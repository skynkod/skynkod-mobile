import AsyncStorage from '@react-native-async-storage/async-storage'

// Products she paused herself (for example after the journal spotted a
// reaction). Home leaves them out of the routine until she resumes them.
const key = userId => `paused_products_${userId}`
export const getPausedProducts = async (userId) => {
  try { return JSON.parse((await AsyncStorage.getItem(key(userId))) || '[]') } catch { return [] }
}
export const setProductPaused = async (userId, product, paused) => {
  const list = (await getPausedProducts(userId)).filter(p => p.id !== product.id)
  if (paused) list.push({ id: product.id, name: product.name, at: new Date().toISOString() })
  await AsyncStorage.setItem(key(userId), JSON.stringify(list)).catch(() => {})
  return list
}
