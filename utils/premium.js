import { supabase } from './supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { userCurrency } from './currency'

export const isPremiumUser = async (userId) => {
  try {
    const premium = await AsyncStorage.getItem(`premium_${userId}`)
    return premium === 'true'
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

// In-app purchases need the store accounts; until then the page explains it.
export const startPurchase = async () => ({ unavailable: true })
export const restorePurchases = async () => ({ unavailable: true })

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
