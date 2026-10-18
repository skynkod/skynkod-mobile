import { supabase } from './supabase'

const API_URL = process.env.EXPO_PUBLIC_API_URL
const FIELDS = 'id,name,brand,category,image_url,key_ingredients,ingredients,ingredients_text,barcode,source'

// PostgREST filter values can't contain these.
const safe = text => text.replace(/[,()*%{}"\\]/g, ' ').trim()

// Products whose name or brand contains every word typed.
export const searchProducts = async (query) => {
  const words = safe(query).split(/\s+/).filter(w => w.length > 1).slice(0, 4)
  if (!words.length) return []
  let request = supabase.from('products').select(FIELDS)
  for (const w of words) request = request.or(`name.ilike.%${w}%,brand.ilike.%${w}%`)
  const { data, error } = await request.order('image_url', { ascending: true, nullsFirst: false }).limit(30)
  if (error) throw error
  return data || []
}

// Products containing one of the guide ingredient's INCI names.
export const productsWithIngredient = async (entry, limit = 20) => {
  const filters = entry.match.flatMap(m => [`ingredients_text.ilike.%${safe(m)}%`, `key_ingredients.cs.{"${safe(m)}"}`])
  const { data, error } = await supabase.from('products').select(FIELDS).or(filters.join(',')).limit(limit)
  if (error) throw error
  return data || []
}

export const getProduct = async (id) => {
  const { data, error } = await supabase.from('products').select(FIELDS).eq('id', id).single()
  if (error) throw error
  return data
}

// Barcode → product, through the backend (which also checks Open Beauty Facts).
// Returns { product } or { notFound: true } or { error }.
export const lookupBarcode = async (barcode) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetch(`${API_URL.replace(/\/$/, '')}/products/lookup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ barcode }),
    })
    const data = await response.json().catch(() => ({}))
    if (response.status === 404) return { notFound: true }
    if (!response.ok || !data.product) return { error: data.error || `HTTP ${response.status}` }
    return { product: data.product }
  } catch (error) {
    return { error: error.message }
  }
}

// Adds a catalogue product to the user's collection.
export const addToMyProducts = async (userId, product) => {
  const { error } = await supabase.from('user_products').insert({
    user_id: userId,
    product_id: product.id,
    product_name: product.name,
    brand: product.brand,
    category: product.category,
  })
  if (error) throw error
}
