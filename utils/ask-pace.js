import AsyncStorage from '@react-native-async-storage/async-storage'

// "How is it going?" questions (Better / Same / Worse) come from three places:
// the 2-week Skin review, the time to judge a product, and the Rekod review.
// Lita's audit (2026-10-24): never two within 3 days. Rekod's review always
// comes (it drives the programme); the other two wait.
const key = userId => `bsw_asked_${userId}`
export const PACE_DAYS = 3

export const markAsked = (userId) => (userId ? AsyncStorage.setItem(key(userId), String(Date.now())).catch(() => {}) : Promise.resolve())
export const canAskAgain = async (userId) => {
  const last = Number(await AsyncStorage.getItem(key(userId)).catch(() => null)) || 0
  return Date.now() - last >= PACE_DAYS * 86400000
}
