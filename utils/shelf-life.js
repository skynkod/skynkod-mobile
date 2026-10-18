import { supabase } from './supabase'
import { findIngredients } from './ingredients-guide'

// How long a product keeps once opened (the "12M" open-jar symbol), with
// sensible defaults by product type, and when it should be replaced.

const DAY = 86400000

export const defaultPaoMonths = (product) => {
  const ids = new Set(findIngredients(product || {}).map(f => f.entry.id))
  if (ids.has('vitaminc') && product?.category === 'serum') return 3 // oxidises fast
  if (ids.has('retinol')) return 6
  return { serum: 6, 'eye care': 6, sunscreen: 12, moisturizer: 12, cleanser: 12, toner: 12, exfoliant: 12, mask: 12 }[product?.category] || 12
}

const addMonths = (date, months) => {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

// { replaceBy: Date | null, status: 'ok' | 'soon' | 'expired' | 'unknown', daysLeft, openedMonths, pao }
export const shelfLife = (row) => {
  const pao = row?.pao_months || defaultPaoMonths(row?.product)
  const opened = row?.opened_at ? new Date(row.opened_at) : null
  const printed = row?.expires_at ? new Date(row.expires_at) : null
  const candidates = [opened ? addMonths(opened, pao) : null, printed].filter(Boolean)
  if (!candidates.length) return { replaceBy: null, status: 'unknown', daysLeft: null, openedMonths: null, pao }
  const replaceBy = new Date(Math.min(...candidates.map(d => d.getTime())))
  const daysLeft = Math.ceil((replaceBy - new Date()) / DAY)
  const openedMonths = opened ? Math.max(0, Math.floor((Date.now() - opened) / (30.44 * DAY))) : null
  const status = daysLeft < 0 ? 'expired' : daysLeft <= 30 ? 'soon' : 'ok'
  return { replaceBy, status, daysLeft, openedMonths, pao }
}

const isoDay = d => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)

export const setOpened = async (rowId, date = new Date()) => {
  const { error } = await supabase.from('user_products').update({ opened_at: isoDay(date) }).eq('id', rowId)
  if (error) throw error
}

export const setExpiry = async (rowId, date) => {
  const { error } = await supabase.from('user_products').update({ expires_at: date ? isoDay(date) : null }).eq('id', rowId)
  if (error) throw error
}

export const setPao = async (rowId, months) => {
  const { error } = await supabase.from('user_products').update({ pao_months: months }).eq('id', rowId)
  if (error) throw error
}

// First time a product is ticked in a routine: that's when it was opened.
export const markOpenedIfNeeded = async (userId, productId) => {
  if (!productId) return
  const { data } = await supabase
    .from('user_products').select('id, opened_at').eq('user_id', userId).eq('product_id', productId).limit(1)
  const row = data?.[0]
  if (row && !row.opened_at) await setOpened(row.id)
}
