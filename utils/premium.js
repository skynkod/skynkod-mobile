import AsyncStorage from '@react-native-async-storage/async-storage'

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
  // icon: 'rekod' / 'koda' use the official logos, others are Ionicons as in the app.
  { icon: 'rekod', title: 'Rekod', text: 'Your skin programme: 6 to 12 weeks built around your skin and your goals.' },
  { icon: 'scan-circle', title: 'Dekod', text: 'Your skin scan: one selfie reads redness, shine, blemishes, dryness and tone, and follows how they change.' },
  { icon: 'koda', title: 'Koda every day', text: 'Up to 20 questions a day to your skin coach, instead of 3 a week.' },
  { icon: 'medkit-outline', title: 'Emergency mode', text: 'Full 7-day SOS plans: when your skin reacts, a gentle plan day by day.' },
  { icon: 'flask-outline', title: 'Every ingredient explained', text: 'What each one does for your skin, and better alternatives when a product isn’t for you.' },
  { icon: 'search-outline', title: 'Search any product or ingredient', text: 'Without needing the bottle in your hands.' },
  { icon: 'analytics-outline', title: 'What your journal reveals', text: 'The patterns behind your good and bad skin days.' },
  { icon: 'library-outline', title: 'The whole Skyncyclopedia', text: 'Every ingredient of the guide, including the niche ones.' },
  { icon: 'layers-outline', title: 'Your routine in the right order', text: 'How to layer your own products, morning and evening.' },
]

// In-app purchases need the store accounts; until then the page explains it.
export const startPurchase = async () => ({ unavailable: true })
export const restorePurchases = async () => ({ unavailable: true })
