import { loadState, saveState } from './cloud-state'

// Products she paused herself (for example after the journal spotted a
// reaction). Home leaves them out of the routine until she resumes them.
// Kept in her account (integration audit, 2026-10-25): a new phone keeps
// them, and Rekod and Koda see them. Same key as before on the phone.
export const getPausedProducts = async (userId) => {
  const list = await loadState(userId, 'paused_products', [])
  return Array.isArray(list) ? list : []
}
export const setProductPaused = async (userId, product, paused) => {
  const list = (await getPausedProducts(userId)).filter(p => p.id !== product.id)
  if (paused) list.push({ id: product.id, name: product.name, at: new Date().toISOString() })
  await saveState(userId, 'paused_products', list)
  return list
}
