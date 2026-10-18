import { supabase } from './supabase'

// What users type in feeds Skynkod's own data: real prices and stores in
// Morocco, and the products people want that the catalogue lacks. Shown only
// as anonymous summaries.

export const recordPrice = async ({ productId, price, store }) => {
  if (!productId || !(Number(price) > 0)) return
  const { error } = await supabase.from('product_prices').insert({ product_id: productId, price: Number(price), store: store || null })
  if (error) throw error
}

export const requestProduct = async (kind, value) => {
  const v = String(value || '').trim()
  if (v.length < 2) return
  const { error } = await supabase.from('product_requests').insert({ kind, value: v.slice(0, 200) })
  if (error) throw error
}

// { purchases, typical, low, high, top_store } — only with 3+ purchases, so
// nobody's own price can be guessed.
export const getPriceStats = async (productId) => {
  const { data, error } = await supabase.rpc('product_price_stats', { p_product_id: productId })
  if (error) throw error
  const row = Array.isArray(data) ? data[0] : data
  return row && Number(row.purchases) >= 3 ? row : null
}

export const STORES = ['Pharmacy', 'Parapharmacy', 'Parachezvous', 'Jumia', 'Marjane', 'Carrefour', 'Instagram shop']
