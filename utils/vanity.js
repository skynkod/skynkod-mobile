import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'

// "My vanity": the collection game. Good habits earn sparkles; sparkles buy
// decor; the space grows from a pouch to a dream bathroom. Free for everyone.
// Prototype: progress is kept on the phone.

export const SPACES = [
  { id: 'pouch', name: 'The pouch', from: 0, slots: 4 },
  { id: 'case', name: 'The vanity case', from: 150, slots: 6 },
  { id: 'shelf', name: 'The shelf', from: 400, slots: 9 },
  { id: 'table', name: 'The dressing table', from: 800, slots: 12 },
  { id: 'bathroom', name: 'The dream bathroom', from: 1500, slots: 16 },
]

// Decor items. `price` in sparkles; rare ones are only earned by big moments.
export const ITEMS = [
  { id: 'dropper', name: 'Glass dropper', price: 20, style: 'minimal' },
  { id: 'jar', name: 'Cream jar', price: 20, style: 'minimal' },
  { id: 'pump', name: 'Pump bottle', price: 30, style: 'minimal' },
  { id: 'tube', name: 'Soft tube', price: 15, style: 'minimal' },
  { id: 'cotton', name: 'Cotton pads', price: 15, style: 'minimal' },
  { id: 'plant', name: 'Little plant', price: 40, style: 'japandi' },
  { id: 'vase', name: 'Bud vase', price: 45, style: 'japandi' },
  { id: 'brush', name: 'Wooden brush', price: 35, style: 'japandi' },
  { id: 'candle', name: 'Scented candle', price: 50, style: 'marble' },
  { id: 'tray', name: 'Marble tray', price: 60, style: 'marble' },
  { id: 'mirror', name: 'Round mirror', price: 80, style: 'marble' },
  { id: 'perfume', name: 'Pastel perfume', price: 70, style: 'retro' },
  { id: 'scrunchie', name: 'Silk scrunchie', price: 25, style: 'retro' },
  { id: 'roller', name: 'Rose quartz roller', price: 90, style: 'retro' },
  { id: 'gold-mirror', name: 'Golden mirror', rare: 'A perfect week', style: 'rare' },
  { id: 'orchid', name: 'White orchid', rare: 'A finished 7-day plan', style: 'rare' },
  { id: 'crystal', name: 'Crystal bottle', rare: 'A finished Rekod', style: 'rare' },
]
export const itemOf = id => ITEMS.find(i => i.id === id) || null

const key = userId => `vanity_${userId}`
const fresh = () => ({ spent: 0, owned: [], slots: {}, bonus: 0, rares: [] })
export const loadVanity = async (userId) => {
  try { return { ...fresh(), ...JSON.parse((await AsyncStorage.getItem(key(userId))) || '{}') } } catch { return fresh() }
}
export const saveVanity = (userId, state) => AsyncStorage.setItem(key(userId), JSON.stringify(state)).catch(() => {})

// Sparkles earned: 10 per routine done (morning or evening), 5 per journal
// day, + bonuses. Counted from what she really did in the app.
export const earnedSparkles = async (userId, state) => {
  const [ticks, entries] = await Promise.all([
    supabase.from('routine_completions').select('date, routine_type').eq('user_id', userId),
    supabase.from('journal_entries').select('date').eq('user_id', userId).not('mood', 'is', null),
  ])
  const routines = new Set((ticks.data || []).map(t => `${t.date}-${t.routine_type}`)).size
  const journal = new Set((entries.data || []).map(e => String(e.date).slice(0, 10))).size
  return { total: routines * 10 + journal * 5 + (state.bonus || 0), routines, journal }
}

export const spaceFor = total => [...SPACES].reverse().find(s => total >= s.from) || SPACES[0]
export const nextSpace = total => SPACES.find(s => s.from > total) || null
