import { supabase } from './supabase'
import { getProductsByIds } from './catalog'
import { activesOf } from './routine-checks'
import { findIngredients } from './ingredients-guide'
import { NEW_ACTIVE_WAIT_DAYS, recentNewActive } from './skin-tracking-core'

export { recentNewActive }

// One new active at a time (Lita, 2026-10-24): when she starts a second
// active less than 2 weeks after another, the app suggests waiting, so she
// knows what works (and what irritates). A suggestion: she can keep it.

const DAY = 86400000
const ACTIVE_IDS = new Set(['retinol', 'azelaic', 'vitaminc', 'bakuchiol', 'txa', 'benzoyl', 'glycolic', 'salicylic', 'lactic', 'mandelic', 'pha', 'sulfur', 'arbutin', 'kojic'])

// A product that does something strong enough to change the skin.
export const isActiveProduct = (product) => {
  if (!product) return false
  const a = activesOf(product)
  return a.retinoid || a.exfoliant || a.vitaminC || a.benzoyl || findIngredients(product).some(f => f.pos <= 8 && ACTIVE_IDS.has(f.entry.id))
}

// Has she already started this product (opened it at some point)?
export const alreadyStarted = async (userId, productId) => {
  const { data } = await supabase.from('user_products').select('opened_at').eq('user_id', userId).eq('product_id', productId).not('opened_at', 'is', null).limit(1)
  return !!data?.length
}

// Actives she started (first opened) in the last 2 weeks.
export const recentStartedActives = async (userId, now = new Date()) => {
  const since = new Date(now.getTime() - NEW_ACTIVE_WAIT_DAYS * DAY).toISOString()
  const { data } = await supabase.from('user_products').select('product_id, opened_at').eq('user_id', userId).not('product_id', 'is', null).gte('opened_at', since)
  const rows = data || []
  if (!rows.length) return []
  const byId = Object.fromEntries((await getProductsByIds([...new Set(rows.map(r => r.product_id))])).map(p => [p.id, p]))
  return rows.filter(r => isActiveProduct(byId[r.product_id])).map(r => ({ id: r.product_id, name: byId[r.product_id].name, date: r.opened_at }))
}
