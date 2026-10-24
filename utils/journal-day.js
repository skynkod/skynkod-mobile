import { findPatterns } from './skin-patterns'
import { readHealth, withHealthTags } from './apple-health'
import { supabase } from './supabase'

// The Journal keeps one entry per day. Mood and "what's going on" tags are
// also turned into the 0–10 levels other features read (Koda's tip, the
// dermatologist card).

export const MOODS = [
  { value: 'great', label: 'Glowing', icon: 'emoticon-excited-outline', satisfaction: 9 },
  { value: 'good', label: 'Good', icon: 'emoticon-happy-outline', satisfaction: 7 },
  { value: 'okay', label: 'Okay', icon: 'emoticon-neutral-outline', satisfaction: 5 },
  { value: 'bad', label: 'Not great', icon: 'emoticon-sad-outline', satisfaction: 3 },
  { value: 'terrible', label: 'Tough day', icon: 'emoticon-cry-outline', satisfaction: 1 },
]

// A short message for each mood, on Home and in the journal.
export const MOOD_MESSAGES = {
  great: 'Your skin is glowing today! Keep your routine as it is, and don’t skip your SPF.',
  good: 'Nice! Consistency keeps skin happy: stick to your routine.',
  okay: 'An average day is normal. Drink water, cleanse gently tonight and get some sleep.',
  bad: 'Sorry your skin isn’t at its best. Tick what’s going on below for a few simple tips.',
  terrible: 'Rough day for your skin. Keep it simple and gentle today, and tick what’s going on below.',
}

export const TAGS = [
  'New pimple', 'Redness', 'Dryness', 'Itchiness / Sensitivity', 'Oily', 'Peeling / Flaking',
  'Sun exposure', 'Poor sleep', 'Stress', 'Hormonal / Period', 'Used new product',
]

const levelsFrom = (mood, tags) => {
  const bad = mood === 'bad' || mood === 'terrible'
  return {
    acne_level: tags.includes('New pimple') ? (bad ? 8 : 6) : 1,
    redness_level: tags.includes('Redness') ? (bad ? 8 : 6) : 1,
    hydration_level: tags.includes('Dryness') || tags.includes('Peeling / Flaking') ? 3 : 7,
    barrier_health: tags.includes('Itchiness / Sensitivity') || tags.includes('Peeling / Flaking') ? 3 : 7,
    overall_satisfaction: MOODS.find(m => m.value === mood)?.satisfaction ?? 5,
  }
}

const dayBounds = (day) => {
  const start = new Date(day)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)
  return { start, end }
}

// Entries between two dates, newest first.
export const getEntriesBetween = async (userId, start, end) => {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('id, date, mood, skin_conditions, skin_state, notes, products_used')
    .eq('user_id', userId)
    .gte('date', start.toISOString())
    .lt('date', end.toISOString())
    .order('date', { ascending: false })
  if (error) throw error
  return data || []
}

// Creates or updates the entry of one day.
export const saveDay = async (userId, day, { mood, tags, notes, newProducts, states }, existingId) => {
  const { start } = dayBounds(day)
  const noon = new Date(start)
  noon.setHours(12)
  const fields = {
    mood: mood || null,
    skin_conditions: tags,
    notes: notes || '',
    ...levelsFrom(mood, tags),
    // Which new product(s) she started that day, to spot reactions later.
    // Her skin state today (utils/skin-state.js), when she picked one.
    ...(states !== undefined ? { skin_state: states } : {}),
    ...(newProducts !== undefined ? { products_used: (tags || []).includes('Used new product') ? newProducts : [] } : {}),
  }
  if (existingId) {
    const { error } = await supabase.from('journal_entries').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', existingId)
    if (error) throw error
    return existingId
  }
  const { data, error } = await supabase
    .from('journal_entries')
    .insert({ user_id: userId, date: noon.toISOString(), ...fields })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

// From a day's check-in, the Emergency situation that fits (or null).
// Used by Home to suggest a plan when the skin isn't doing well.
export const situationFromCheckIn = (entry) => {
  if (!entry) return null
  const tags = entry.skin_conditions || []
  const bad = entry.mood === 'bad' || entry.mood === 'terrible'
  const has = t => tags.includes(t)
  const problem = has('Redness') || has('Itchiness / Sensitivity') || has('New pimple') || has('Dryness') || has('Peeling / Flaking')
  if (!problem && !bad) return null
  if (!problem && bad) return { id: 'irritation', text: "Your skin isn't at its best today" }
  if (has('Used new product') && (has('Redness') || has('Itchiness / Sensitivity') || has('New pimple'))) {
    return { id: 'reaction', text: 'Looks like a reaction to something new' }
  }
  if (has('Redness') || has('Itchiness / Sensitivity')) return { id: 'irritation', text: 'Your skin seems irritated today' }
  if (has('Peeling / Flaking')) return { id: 'peeling', text: 'Your skin is peeling today' }
  if (has('New pimple') && bad) return { id: 'breakout', text: 'Breakouts are bothering you today' }
  if (has('Dryness') && bad) return { id: 'barrier', text: 'Your skin feels dry and uncomfortable' }
  return null
}

// "What your skin tells you": the last 90 days of check-ins, product openings
// and routine days, read by findPatterns (utils/skin-patterns.js).
export const getSkinPatterns = async (userId) => {
  const since = new Date(Date.now() - 90 * 86400000)
  const [entries, opened, routineDays, routines] = await Promise.all([
    supabase.from('journal_entries').select('date, mood, skin_conditions').eq('user_id', userId).gte('date', since.toISOString()),
    supabase.from('user_products').select('opened_at').eq('user_id', userId).gte('opened_at', since.toISOString()),
    supabase.from('routine_completions').select('date').eq('user_id', userId).gte('date', since.toISOString().slice(0, 10)),
    supabase.from('routines').select('id').eq('user_id', userId).limit(1),
  ])
  for (const r of [entries, opened, routineDays, routines]) if (r.error) throw r.error
  // routine_completions.date is a plain day: read it as local noon.
  const routineDates = (routineDays.data || []).map(r => new Date(`${r.date}T12:00:00`))
  // Apple Health, if connected: period days and short nights count as ticked.
  const health = await readHealth().catch(() => null)
  return findPatterns({
    entries: withHealthTags(entries.data || [], health),
    openedDates: (opened.data || []).map(r => r.opened_at),
    routineDates,
    hasRoutine: (routines.data || []).length > 0,
  })
}

// ---------- Products and reactions ----------
// When a reaction (spots, redness, itching, peeling) shows up 0 to 5 days after
// she started a product, more than once, the journal points it out.
const REACTIONS = ['New pimple', 'Redness', 'Itchiness / Sensitivity', 'Peeling / Flaking']
export const getProductReactions = async (userId) => {
  const since = new Date(Date.now() - 120 * 86400000)
  const { data, error } = await supabase.from('journal_entries').select('date, skin_conditions, products_used')
    .eq('user_id', userId).gte('date', since.toISOString()).order('date', { ascending: true })
  if (error) throw error
  const rows = (data || []).map(r => ({ t: new Date(r.date).getTime(), tags: r.skin_conditions || [], products: Array.isArray(r.products_used) ? r.products_used : [] }))
  const found = {}
  for (const intro of rows) {
    for (const p of intro.products) {
      if (!p?.id) continue
      const after = rows.filter(r => r.t >= intro.t && r.t <= intro.t + 5 * 86400000)
      for (const r of after) {
        const hit = r.tags.filter(tag => REACTIONS.includes(tag))
        if (!hit.length) continue
        found[p.id] = found[p.id] || { product: p, days: new Set(), tags: {} }
        found[p.id].days.add(new Date(r.t).toDateString())
        hit.forEach(tag => { found[p.id].tags[tag] = (found[p.id].tags[tag] || 0) + 1 })
      }
    }
  }
  return Object.values(found)
    .filter(f => f.days.size >= 2)
    .map(f => ({ product: f.product, count: f.days.size, tag: Object.entries(f.tags).sort((a, b) => b[1] - a[1])[0][0] }))
    .sort((a, b) => b.count - a.count)
}
