import { supabase, getUserProfile, updateUserProfile } from './supabase'
import { activesOf } from './routine-checks'
import { findIngredients } from './ingredients-guide'

// Skynbudget: what the user spends on skincare (in MAD), against a monthly
// budget, plus smart insights from their collection.

export const formatMAD = (amount) => `${Math.round(Number(amount) || 0).toLocaleString('fr-MA')} MAD`

const monthStart = (date = new Date()) => new Date(date.getFullYear(), date.getMonth(), 1)

// Purchases between two dates, newest first.
export const getPurchasesBetween = async (userId, start, end) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('id, name, product_name, brand, category, price, date, product_id, store')
    .eq('user_id', userId)
    .gte('date', start.toISOString())
    .lt('date', end.toISOString())
    .order('date', { ascending: false })
  if (error) throw error
  return data || []
}

// Totals for the 6 months ending with `date`'s month: [{ month: Date, total }].
export const getSixMonths = async (userId, date = new Date()) => {
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1)
  const start = new Date(date.getFullYear(), date.getMonth() - 5, 1)
  const rows = await getPurchasesBetween(userId, start, end)
  return [...Array(6)].map((_, i) => {
    const month = new Date(start.getFullYear(), start.getMonth() + i, 1)
    const total = rows
      .filter(r => { const d = new Date(r.date); return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth() })
      .reduce((sum, r) => sum + Number(r.price || 0), 0)
    return { month, total }
  })
}

export const getYearTotal = async (userId, year = new Date().getFullYear()) => {
  const rows = await getPurchasesBetween(userId, new Date(year, 0, 1), new Date(year + 1, 0, 1))
  return rows.reduce((sum, r) => sum + Number(r.price || 0), 0)
}

export const getMonthPurchases = async (userId, date = new Date()) => {
  const start = monthStart(date)
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 1)
  const { data, error } = await supabase
    .from('expenses')
    .select('id, name, product_name, brand, category, price, date, product_id, store')
    .eq('user_id', userId)
    .gte('date', start.toISOString())
    .lt('date', end.toISOString())
    .order('date', { ascending: false })
  if (error) throw error
  return data || []
}

export const addPurchase = async (userId, { product, name, brand, category, price, store, date }) => {
  const { error } = await supabase.from('expenses').insert({
    user_id: userId,
    product_id: product?.id || null,
    name: product?.name || name,
    product_name: product?.name || name,
    brand: product?.brand || brand || null,
    category: product?.category || category || 'other',
    price: Number(price),
    amount: Number(price),
    currency: 'MAD',
    store: store || null,
    date: (date || new Date()).toISOString(),
  })
  if (error) throw error
}

export const updatePurchase = async (id, { price, store, date }) => {
  const { error } = await supabase
    .from('expenses')
    .update({ price: Number(price), amount: Number(price), store: store || null, date: date.toISOString() })
    .eq('id', id)
  if (error) throw error
}

// Roughly how many uses a typical pack lasts, by category (estimate).
const USES = { serum: 120, moisturizer: 100, cleanser: 150, sunscreen: 60, toner: 150, 'eye care': 150, exfoliant: 40, mask: 25, other: 80 }
export const costPerUse = (price, category) => {
  const uses = USES[category] || USES.other
  return Number(price) / uses
}

export const deletePurchase = async (id) => {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
}

export const getMonthlyBudget = async (userId) => {
  const profile = await getUserProfile(userId)
  return profile?.monthly_budget ? Number(profile.monthly_budget) : null
}

export const setMonthlyBudget = (userId, amount) => updateUserProfile(userId, { monthly_budget: amount })

const CATEGORY_NAMES = {
  cleanser: 'cleansers', toner: 'toners', serum: 'serums', moisturizer: 'moisturizers', sunscreen: 'sunscreens',
  exfoliant: 'exfoliants', mask: 'masks', 'eye care': 'eye creams', other: 'other products',
}

// Insights, most useful first: [{ icon, text }].
export const budgetInsights = ({ owned = [], toBuy = [], purchases = [], budget = null, today = new Date() }) => {
  const out = []

  // Several products that do the same job.
  const exfoliants = owned.filter(p => activesOf(p).exfoliant)
  if (exfoliants.length >= 3) out.push({ icon: 'layers-outline', text: `You already own ${exfoliants.length} exfoliants. No need to buy another one.` })
  const byActive = {}
  for (const p of owned) {
    for (const f of findIngredients(p)) {
      if (['vitaminc', 'retinol', 'niacinamide', 'salicylic', 'hyaluronic'].includes(f.entry.id)) {
        ;(byActive[f.entry.id] = byActive[f.entry.id] || { name: f.entry.name, list: [] }).list.push(p)
      }
    }
  }
  for (const { name, list } of Object.values(byActive)) {
    const serums = list.filter(p => p.category === 'serum')
    if (serums.length >= 2) out.push({ icon: 'copy-outline', text: `You have ${serums.length} ${name} serums doing a similar job.` })
  }
  const byCategory = {}
  for (const p of owned) byCategory[p.category] = (byCategory[p.category] || 0) + 1
  for (const [cat, n] of Object.entries(byCategory)) {
    if (n >= 4 && cat !== 'other') out.push({ icon: 'albums-outline', text: `You own ${n} ${CATEGORY_NAMES[cat] || cat}. Finish one before opening the next.` })
  }

  // Wishlist items that duplicate something already owned.
  for (const wish of toBuy) {
    const wishActives = new Set(findIngredients(wish).map(f => f.entry.id))
    const twin = owned.find(p => p.category === wish.category && findIngredients(p).some(f => wishActives.has(f.entry.id) && ['vitaminc', 'retinol', 'niacinamide', 'salicylic', 'glycolic', 'azelaic'].includes(f.entry.id)))
    if (twin) {
      out.push({ icon: 'bag-remove-outline', text: `${wish.name} (in your To buy list) does a similar job to ${twin.name}, which you already have.` })
      break
    }
  }

  // Spending.
  const spent = purchases.reduce((sum, p) => sum + Number(p.price || 0), 0)
  if (budget && spent > 0) {
    const day = today.getDate()
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()
    const projected = (spent / day) * daysInMonth
    if (spent >= budget) out.push({ icon: 'alert-circle-outline', text: `You've reached your budget for this month (${formatMAD(budget)}).` })
    else if (projected > budget * 1.05) {
      const overDay = Math.max(day + 1, Math.ceil(budget / (spent / day)))
      out.push({ icon: 'trending-up-outline', text: `At this pace you'll go over budget around the ${overDay}th.` })
    } else out.push({ icon: 'checkmark-circle-outline', text: `You're on track: ${formatMAD(budget - spent)} left this month.` })
  }
  const spendByCat = {}
  for (const p of purchases) spendByCat[p.category || 'other'] = (spendByCat[p.category || 'other'] || 0) + Number(p.price || 0)
  if ((spendByCat.serum || 0) > 2 * (spendByCat.cleanser || 0) && (spendByCat.serum || 0) > 0 && (spendByCat.cleanser || 0) > 0) {
    out.push({ icon: 'pie-chart-outline', text: "You're spending much more on serums than on cleansers this month." })
  }

  if (!out.length) out.push({ icon: 'sparkles-outline', text: 'No duplicates in your collection. Nice and minimal!' })
  return out
}
