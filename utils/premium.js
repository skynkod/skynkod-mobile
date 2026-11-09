import { Platform } from 'react-native'
import { supabase } from './supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Purchases from 'react-native-purchases'
import { userCurrency } from './currency'
import { logError } from './errorLogger'

// ---------- Payments: RevenueCat (Lita, 2026-11-09) ----------
// Public SDK keys from the RevenueCat dashboard (made to live in the app, not
// secret). Empty until Lita's RevenueCat project exists: payments stay closed.
const REVENUECAT_KEYS = { ios: '', android: '' }
// The entitlement every plan unlocks, named the same in RevenueCat.
const ENTITLEMENT = 'premium'
const apiKey = () => REVENUECAT_KEYS[Platform.OS] || ''
let configuredFor = null

// Ties the store purchases to her Skynkod account, so the server (webhook) and
// any new phone know she is Premium.
const ready = async (userId) => {
  if (!apiKey() || !userId) return false
  if (configuredFor === userId) return true
  if (configuredFor) await Purchases.logIn(userId)
  else Purchases.configure({ apiKey: apiKey(), appUserID: userId })
  configuredFor = userId
  return true
}

// Paid until when: her account (written only by the server, from RevenueCat) or
// the store's answer right after a purchase, whichever is later. Kept on the
// phone for offline, and asked to the server at most once a minute.
const asked = {}
const paidUntil = async (userId) => {
  const key = `premium_until_${userId}`
  const kept = (await AsyncStorage.getItem(key).catch(() => null)) || null
  if (asked[userId] > Date.now() - 60000) return kept
  const { data, error } = await supabase.from('users').select('premium_until').eq('id', userId).maybeSingle()
  if (error) return kept
  asked[userId] = Date.now()
  const server = data?.premium_until || null
  const later = [server, kept].filter(Boolean).sort((a, b) => new Date(b) - new Date(a))[0] || null
  await AsyncStorage.setItem(key, later || '').catch(() => {})
  return later
}
const keepPaidUntil = (userId, info) => {
  const until = info?.entitlements?.active?.[ENTITLEMENT]?.expirationDate
  if (until) return AsyncStorage.setItem(`premium_until_${userId}`, until).catch(() => {})
}

// Premium = paid (her account says so) or, for the team, "See the app as Premium".
export const isPremiumUser = async (userId) => {
  try {
    if ((await AsyncStorage.getItem(`premium_${userId}`)) === 'true') return true
    const until = await paidUntil(userId)
    return !!until && new Date(until) > new Date()
  } catch (error) {
    return false
  }
}

// Sent with Koda and Dekod calls: a team account viewing the app as Free gets
// the free limits on the server too (it can only lower the rights).
export const viewHeaders = async (userId) => ((await isPremiumUser(userId)) ? {} : { 'x-skynkod-view': 'free' })

export const setPremium = async (userId, isPremium) => {
  try {
    await AsyncStorage.setItem(`premium_${userId}`, isPremium ? 'true' : 'false')
  } catch (error) {
    console.error('Error setting premium:', error)
  }
}

export const getRemainingKodaChats = async (userId) => {
  try {
    const chats = await AsyncStorage.getItem(`koda_chats_${userId}`)
    return chats ? parseInt(chats) : 3
  } catch (error) {
    return 3
  }
}

export const decrementKodaChats = async (userId) => {
  try {
    const current = await getRemainingKodaChats(userId)
    const remaining = Math.max(0, current - 1)
    await AsyncStorage.setItem(`koda_chats_${userId}`, remaining.toString())
    return remaining
  } catch (error) {
    return 0
  }
}

export const resetKodaChats = async (userId) => {
  try {
    await AsyncStorage.setItem(`koda_chats_${userId}`, '3')
  } catch (error) {
    console.error('Error resetting chats:', error)
  }
}
// ---------- Premium page ----------

// The three plans (Lita, 2026-10-23). Prices and the trial are set in the App
// Store for each country; `fallbackPrice` only shows until the store answers.
export const PREMIUM_PLANS = [
  { id: 'yearly', label: 'Yearly', fallbackPrice: '349 MAD', per: 'year', badge: '-40%', trialDays: 7, highlight: true },
  { id: 'monthly', label: 'Monthly', fallbackPrice: '49 MAD', per: 'month' },
  { id: 'weekly', label: 'Weekly', fallbackPrice: '19 MAD', per: 'week', note: 'To try it' },
]

// What Premium adds on top of the free app.
export const PREMIUM_BENEFITS = [
  // Icons: feature names from components/FeatureIcon.js (official logos for Rekod and Koda).
  { icon: 'rekod', title: 'Rekod', text: 'Your skin programme: 4 to 12 weeks built around your skin and your goals.' },
  { icon: 'dekod', title: 'Dekod', text: 'Your skin scan: one selfie reads redness, shine, spots, blackheads, dryness, dark spots and dullness, and follows how they change.' },
  { icon: 'koda', title: 'Koda every day', text: 'Up to 20 questions a day to your skin coach, instead of 3 a week.' },
  { icon: 'emergency', title: 'Emergency mode', text: 'Full 7-day SOS plans: when your skin reacts, a gentle plan day by day.' },
  { icon: 'flask-outline', title: 'Every ingredient explained', text: 'What each one does for your skin, and better alternatives when a product isn’t for you.' },
  { icon: 'search-outline', title: 'Search any product or ingredient', text: 'Without needing the bottle in your hands.' },
  { icon: 'analytics-outline', title: 'What your journal reveals', text: 'The patterns behind your good and bad skin days.' },
  { icon: 'progress', title: 'Your progress in numbers', text: 'Breakouts, redness, dryness and shine in %, what may have helped, and what worked for you over time.' },
  { icon: 'bag-check-outline', title: 'Why to buy or not', text: 'The reason behind every “Should I buy this?”, your full next-best-buy ranking and what not to buy yet.' },
  { icon: 'remove-circle-outline', title: 'Your shelf, sorted', text: 'Which of your products to keep, use less, or stop, and what does the same job twice.' },
  { icon: 'library-outline', title: 'The whole Skyncyclopedia', text: 'Every ingredient of the guide, including the niche ones.' },
  { icon: 'layering', title: 'Your routine in the right order', text: 'How to layer your own products, morning and evening.' },
  { icon: 'report', title: 'My skin report', text: 'One page to show your dermatologist: your routine, your journal and your questions.' },
]

// Skynkod is global (full audit, 2026-10-25): the price comes from her App
// Store in her currency. Until the store answers, a fallback shows only in the
// currency it was written in; elsewhere no number is made up.
export const planPrice = plan => (userCurrency() === 'MAD' ? plan.fallbackPrice : null)

// The store's packages for the three plans, with her local price ("49,00 MAD", "$4.99").
const TYPE_OF = { yearly: 'ANNUAL', monthly: 'MONTHLY', weekly: 'WEEKLY' }
export const getStorePlans = async (userId) => {
  try {
    if (!(await ready(userId))) return null
    const offerings = await Purchases.getOfferings()
    const packages = offerings?.current?.availablePackages || []
    return Object.fromEntries(Object.entries(TYPE_OF).map(([id, type]) => {
      const pkg = packages.find(x => x.packageType === type)
      return [id, pkg ? { pkg, price: pkg.product.priceString } : null]
    }))
  } catch (error) {
    await logError('Premium_offerings', error, {}, 'warn')
    return null
  }
}

// { ok } bought, { cancelled } she closed the store sheet, { unavailable } payments not open yet.
export const startPurchase = async (plan, userId, storePlans) => {
  const pkg = storePlans?.[plan.id]?.pkg
  if (!pkg || !(await ready(userId))) return { unavailable: true }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg)
    await keepPaidUntil(userId, customerInfo)
    return customerInfo?.entitlements?.active?.[ENTITLEMENT] ? { ok: true } : { unavailable: true }
  } catch (error) {
    if (error?.userCancelled) return { cancelled: true }
    await logError('Premium_purchase', error, { plan: plan.id })
    return { error: error?.message || 'Purchase failed' }
  }
}

export const restorePurchases = async (userId) => {
  if (!(await ready(userId))) return { unavailable: true }
  try {
    const info = await Purchases.restorePurchases()
    await keepPaidUntil(userId, info)
    return { ok: !!info?.entitlements?.active?.[ENTITLEMENT] }
  } catch (error) {
    await logError('Premium_restore', error)
    return { error: error?.message || 'Restore failed' }
  }
}

// What Premium gave her this month, shown on the Premium page so she sees the
// value she keeps (Lita, 2026-10-23).
export const getMonthValue = async (userId) => {
  const start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0)
  const since = start.toISOString()
  const count = async (q) => { const { count: n } = await q; return n || 0 }
  const [koda, dekod, plan] = await Promise.all([
    count(supabase.from('chat_history').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('role', 'user').gte('created_at', since)).catch(() => 0),
    count(supabase.from('dekod_results').select('id', { count: 'exact', head: true }).eq('user_id', userId).gte('created_at', since)).catch(() => 0),
    supabase.from('rekod_plans').select('plan').eq('user_id', userId).maybeSingle().then(r => r.data?.plan || null).catch(() => null),
  ])
  return { koda, dekod, rekod: !!plan }
}
