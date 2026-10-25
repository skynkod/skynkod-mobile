import { loadState, saveState } from './cloud-state'
import { supabase } from './supabase'
import { isActiveProduct } from './new-actives'
import { setProductPaused } from './paused-products'
import { canOffer, testDue, recentOther } from './patch-core'

// "New product" mode (Lita, 2026-10-25): her patch tests, kept in her account.
// { tests: { [productId]: { id, name, at, result: null | 'ok' | 'red' } }, declines }
// The rules: patch-core.js.

export const getPatchState = async (userId) => {
  const s = await loadState(userId, 'patch_tests', {})
  return s && typeof s === 'object' ? s : {}
}
const save = (userId, state) => saveState(userId, 'patch_tests', state)

// What the offer line says, or null when it shouldn't show.
export const patchOfferFor = async (userId, product, profile) => {
  if (!userId || !product?.id) return null
  const state = await getPatchState(userId)
  if (!canOffer({ state, productId: product.id, profile, active: isActiveProduct(product) })) return null
  const since = new Date(Date.now() - 8 * 86400000).toISOString()
  const { data } = await supabase.from('user_products').select('product_id, product_name, opened_at').eq('user_id', userId).not('product_id', 'is', null).gte('opened_at', since)
  const other = recentOther({ productId: product.id, started: (data || []).filter(r => r.product_name).map(r => ({ id: r.product_id, name: r.product_name, date: r.opened_at })) })
  return { product: { id: product.id, name: product.name }, other }
}

export const startPatchTest = async (userId, product) => {
  const state = await getPatchState(userId)
  await save(userId, { ...state, tests: { ...(state.tests || {}), [product.id]: { id: product.id, name: product.name, at: new Date().toISOString(), result: null } } })
  // Tomorrow's morning reminder asks about it.
  import('./notifications').then(m => m.syncSmartReminders(userId)).catch(() => {})
}

export const declinePatchTest = async (userId) => {
  const state = await getPatchState(userId)
  await save(userId, { ...state, declines: (state.declines || 0) + 1 })
}

export const duePatchTest = async (userId, now = new Date()) => testDue(await getPatchState(userId), now)

// "Redness or itching": the product is paused.
export const answerPatchTest = async (userId, test, ok) => {
  const state = await getPatchState(userId)
  await save(userId, { ...state, tests: { ...(state.tests || {}), [test.id]: { ...test, result: ok ? 'ok' : 'red' } } })
  if (!ok) await setProductPaused(userId, { id: test.id, name: test.name }, true)
}
