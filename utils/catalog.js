import { supabase } from './supabase'

const API_URL = process.env.EXPO_PUBLIC_API_URL
const FIELDS = 'id,name,brand,category,photo_url,image_url,key_ingredients,ingredients,ingredients_text,barcode,source'

// Body and hand care products are in the catalogue but hidden until Skynkod
// adds body care next to skincare: set this to true to show them everywhere.
export const BODY_CARE_ENABLED = false
const HIDDEN_CATEGORIES = BODY_CARE_ENABLED ? [] : ['body', 'hand care']
export const isHiddenCategory = category => HIDDEN_CATEGORIES.includes(category)
const visible = request => (HIDDEN_CATEGORIES.length
  ? request.not('category', 'in', `(${HIDDEN_CATEGORIES.map(c => `"${c}"`).join(',')})`)
  : request)

// PostgREST filter values can't contain these.
const safe = text => text.replace(/[,()*%{}"\\]/g, ' ').trim()
const plain = text => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

// Products whose name or brand contains every word typed.
export const searchProducts = async (query) => {
  const words = safe(query).split(/\s+/).filter(w => w.length > 1).slice(0, 4)
  if (!words.length) return []
  let request = visible(supabase.from('products').select(FIELDS))
  // search_text is brand + name without accents, so "creme" finds "Crème".
  for (const w of words) request = request.ilike('search_text', `%${plain(w)}%`)
  const { data, error } = await request.order('photo_url', { ascending: true, nullsFirst: false }).limit(30)
  if (error) throw error
  return data || []
}

// Products containing one of the guide ingredient's INCI names.
export const productsWithIngredient = async (entry, limit = 20) => {
  const filters = entry.match.flatMap(m => [`ingredients_text.ilike.%${safe(m)}%`, `key_ingredients.cs.{"${safe(m)}"}`])
  // Group entries (fungal-acne triggers…) have no single name to look for.
  if (!filters.length) return []
  const { data, error } = await visible(supabase.from('products').select(FIELDS).or(filters.join(','))).limit(limit)
  if (error) throw error
  return data || []
}

// Products of the given categories, for a routine step's top picks.
export const productsByCategory = async (categories, limit = 80) => {
  const { data, error } = await visible(supabase.from('products').select(FIELDS).in('category', categories)).limit(limit)
  if (error) throw error
  return data || []
}

export const getProductsByIds = async (ids) => {
  if (!ids.length) return []
  const { data, error } = await supabase.from('products').select(FIELDS).in('id', ids)
  if (error) throw error
  return data || []
}

export const getProduct = async (id) => {
  const { data, error } = await supabase.from('products').select(FIELDS).eq('id', id).single()
  if (error) throw error
  return data
}

// Barcode → product, through the backend. An unknown barcode comes back with
// a hint from Open Beauty Facts (brand, name) for her proposal.
// Returns { product } or { notFound: true, suggestion } or { error }.
export const lookupBarcode = async (barcode) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetch(`${API_URL.replace(/\/$/, '')}/products/lookup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ barcode }),
    })
    const data = await response.json().catch(() => ({}))
    if (response.status === 404) return { notFound: true, brandHint: data.brandHint || null, suggestion: data.suggestion || null }
    if (!response.ok || !data.product) return { error: data.error || `HTTP ${response.status}` }
    // A hidden (body care) product is treated as not in the catalogue yet.
    if (isHiddenCategory(data.product.category)) return { notFound: true, brandHint: data.product.brand || null }
    return { product: data.product }
  } catch (error) {
    return { error: error.message }
  }
}

// Adds a catalogue product to the user's collection as 'owned' or 'to_buy'.
// Already there: only the status changes.
export const addToMyProducts = async (userId, product, status = 'owned') => {
  const { data: existing } = await supabase
    .from('user_products').select('id').eq('user_id', userId).eq('product_id', product.id).limit(1)
  if (existing?.length) {
    const { error } = await supabase.from('user_products').update({ status }).eq('id', existing[0].id)
    if (error) throw error
    return
  }
  const { error } = await supabase.from('user_products').insert({
    user_id: userId,
    product_id: product.id,
    product_name: product.name,
    brand: product.brand,
    category: product.category,
    status,
  })
  if (error) throw error
}

// The user's collection, each row with its catalogue product (when known).
export const getMyProducts = async (userId) => {
  const { data, error } = await supabase
    .from('user_products')
    .select('id, product_id, product_name, brand, category, status, created_at, opened_at, expires_at, pao_months')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  const ids = [...new Set((data || []).map(r => r.product_id).filter(Boolean))]
  const products = await getProductsByIds(ids)
  const byId = Object.fromEntries(products.map(p => [p.id, p]))
  return (data || []).map(r => ({ ...r, status: r.status || 'owned', product: byId[r.product_id] || null }))
}

// The product the user added most recently (a suspect after a reaction).
export const getNewestProductId = async (userId) => {
  const { data } = await supabase
    .from('user_products').select('product_id').eq('user_id', userId).not('product_id', 'is', null)
    .order('created_at', { ascending: false }).limit(1)
  return data?.[0]?.product_id || null
}

// Status of one catalogue product in the user's collection, or null.
export const myProductStatus = async (userId, productId) => {
  const { data } = await supabase
    .from('user_products').select('status').eq('user_id', userId).eq('product_id', productId).limit(1)
  return data?.length ? data[0].status || 'owned' : null
}

export const setMyProductStatus = async (rowId, status) => {
  const { error } = await supabase.from('user_products').update({ status }).eq('id', rowId)
  if (error) throw error
}

export const removeMyProduct = async (rowId) => {
  const { error } = await supabase.from('user_products').delete().eq('id', rowId)
  if (error) throw error
}

// Tells the catalogue which product an unknown barcode belongs to.
export const linkBarcode = async (barcode, productId) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const response = await fetch(`${API_URL.replace(/\/$/, '')}/products/link-barcode`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
      body: JSON.stringify({ barcode, productId }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) return { error: data.error || `HTTP ${response.status}` }
    return { product: data.product }
  } catch (error) {
    return { error: error.message }
  }
}

// Product photos: the imported (Open Beauty Facts) pictures are hidden until
// Skynkod's own clean product photos are added (`photo_url`).
export const SHOW_IMPORTED_PHOTOS = false
export const photoOf = item => item?.photo_url || (SHOW_IMPORTED_PHOTOS ? item?.image_url || null : null)
