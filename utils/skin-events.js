import { supabase } from './supabase'

// Products she took out of her routines, for the Skin Timeline (Lita, 2026-10-24).
export const logStopped = async (userId, products = []) => {
  const rows = products.filter(p => p?.id).map(p => ({ user_id: userId, kind: 'stopped', product_id: String(p.id), name: p.name }))
  if (!userId || !rows.length) return
  await supabase.from('skin_events').insert(rows).then(() => {}, () => {})
}

export const getSkinEvents = async (userId) => {
  const { data } = await supabase.from('skin_events').select('kind, product_id, name, created_at').eq('user_id', userId).order('created_at', { ascending: false })
  return data || []
}
