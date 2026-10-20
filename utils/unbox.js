import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'
import { getDekodResults } from './dekod'
import { localDay } from './routine-log'
import { MOOD_SCORE, recapWeekKey } from './progress'

// "My space": inspired by Unpacking. Each week a box arrives, filled from
// what she really did; she unpacks it and places each object. Every object
// keeps a memory. Nothing is ever lost, there's no score.
// Prototype: kept on the phone.

export const CHAPTERS = [
  { id: 'pouch', name: 'The pouch', slots: 4 },
  { id: 'shelf', name: 'The shelf', slots: 9 },
  { id: 'table', name: 'The dressing table', slots: 12 },
  { id: 'bathroom', name: 'The bathroom', slots: 16 },
]

const DAY = 86400000
const avg = list => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : null)

// Her product, drawn by type, in a soft colour of its own.
const PRODUCT_ART = {
  serum: ['dropper', '#C5A8BB'], essence: ['dropper', '#DCCDEB'], treatment: ['dropper', '#B9C9DE'],
  moisturizer: ['jar', '#F3D9E4'], mask: ['jar', '#C9D8C5'],
  cleanser: ['pump', '#F6CDB8'], toner: ['pump', '#DCCDEB'],
  sunscreen: ['tube', '#F7E1A8'], 'eye cream': ['tube', '#F3D9E4'], exfoliator: ['tube', '#C9D8C5'], exfoliant: ['tube', '#C9D8C5'],
}
export const productArt = category => PRODUCT_ART[String(category || '').toLowerCase()] || ['pump', '#E9D6E2']

const key = userId => `unbox_${userId}`
const fresh = () => ({ boxes: [], placed: {}, chapter: 0 })
export const loadSpace = async (userId) => {
  try { return { ...fresh(), ...JSON.parse((await AsyncStorage.getItem(key(userId))) || '{}') } } catch { return fresh() }
}
export const saveSpace = (userId, state) => AsyncStorage.setItem(key(userId), JSON.stringify(state)).catch(() => {})

// The box of the week that just ended, if not opened yet.
export const pendingBoxKey = state => {
  const k = recapWeekKey()
  return state.boxes.some(b => b.key === k) ? null : k
}

// What goes in a box, from [from, to): routines, journal, new products,
// Dekod and how the skin felt compared with the week before.
export const buildBox = async (userId, from, to, boxKey) => {
  const [ticks, entries, prods, scans] = await Promise.all([
    supabase.from('routine_completions').select('date, routine_type').eq('user_id', userId).gte('date', localDay(new Date(from))).lt('date', localDay(new Date(to))),
    supabase.from('journal_entries').select('date, mood').eq('user_id', userId).gte('date', new Date(from - 7 * DAY).toISOString()).lt('date', new Date(to).toISOString()),
    supabase.from('user_products').select('id, product_name, brand, category, status, created_at').eq('user_id', userId).eq('status', 'owned').gte('created_at', new Date(from).toISOString()).lt('created_at', new Date(to).toISOString()),
    getDekodResults(userId, 10).catch(() => []),
  ])
  const done = new Set((ticks.data || []).map(t => `${t.date}-${t.routine_type}`))
  const mornings = [...done].filter(k => k.endsWith('morning')).length
  const evenings = [...done].filter(k => k.endsWith('evening')).length
  const all = entries.data || []
  const inWeek = e => new Date(e.date).getTime() >= from
  const journalDays = new Set(all.filter(e => e.mood && inWeek(e)).map(e => String(e.date).slice(0, 10))).size
  const mood = avg(all.filter(e => e.mood && inWeek(e)).map(e => MOOD_SCORE[e.mood]).filter(Boolean))
  const before = avg(all.filter(e => e.mood && !inWeek(e)).map(e => MOOD_SCORE[e.mood]).filter(Boolean))

  const items = []
  const add = (art, title, memory, extra = {}) => items.push({ id: `${boxKey}-${items.length}`, art, title, memory, date: to - DAY, ...extra })
  if (mornings >= 7 && evenings >= 7) add('gold-mirror', 'Golden mirror', 'A perfect week: every morning and every evening ✨', { rare: true })
  if (evenings >= 3) add('candle', 'Evening candle', `${evenings} evening routines this week 🌙`)
  if (mornings >= 3) add('cotton', 'Cotton pads', `${mornings} morning routines this week ☀️`)
  if (journalDays >= 3) add('notebook', 'Little notebook', `${journalDays} days in your journal: you listened to your skin`)
  for (const p of prods.data || []) {
    const [art, tint] = productArt(p.category)
    add(art, p.product_name, `You welcomed ${p.brand ? `${p.brand} ` : ''}${p.product_name} into your routine`, { tint, product: true })
  }
  const scan = scans.find(s => { const t = new Date(s.created_at).getTime(); return t >= from && t < to })
  if (scan) add('mirror', 'Round mirror', 'Your Dekod scan: a look at your skin, kept here')
  if (mood !== null && before !== null && mood - before >= 0.4) add('vase', 'Fresh flowers', 'Your skin felt better than the week before 🌸')
  if (!items.length || (mood !== null && mood <= 2.5)) add('tea', 'A cup of tea', 'A softer week. This tea is for you: be gentle with yourself.')
  return { key: boxKey, from, to, items, openedAt: Date.now() }
}

export const weekBounds = () => {
  const end = new Date(); end.setHours(0, 0, 0, 0); end.setDate(end.getDate() - ((end.getDay() + 6) % 7))
  return { from: end.getTime() - 7 * DAY, to: end.getTime() }
}
