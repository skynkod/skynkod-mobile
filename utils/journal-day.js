import { findPatterns } from './skin-patterns'
import { supabase } from './supabase'

// The Journal keeps one entry per day. Mood and "what's going on" tags are
// also turned into the 0–10 levels other features read (Koda's tip, the
// dermatologist card).

export const MOODS = [
  { value: 'great', label: 'Great', icon: 'emoticon-excited-outline', satisfaction: 9 },
  { value: 'good', label: 'Good', icon: 'emoticon-happy-outline', satisfaction: 7 },
  { value: 'okay', label: 'Okay', icon: 'emoticon-neutral-outline', satisfaction: 5 },
  { value: 'bad', label: 'Bad', icon: 'emoticon-sad-outline', satisfaction: 3 },
  { value: 'terrible', label: 'Terrible', icon: 'emoticon-cry-outline', satisfaction: 1 },
]

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
    .select('id, date, mood, skin_conditions, notes')
    .eq('user_id', userId)
    .gte('date', start.toISOString())
    .lt('date', end.toISOString())
    .order('date', { ascending: false })
  if (error) throw error
  return data || []
}

// Creates or updates the entry of one day.
export const saveDay = async (userId, day, { mood, tags, notes }, existingId) => {
  const { start } = dayBounds(day)
  const noon = new Date(start)
  noon.setHours(12)
  const fields = {
    mood: mood || null,
    skin_conditions: tags,
    notes: notes || '',
    ...levelsFrom(mood, tags),
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
  return findPatterns({
    entries: entries.data || [],
    openedDates: (opened.data || []).map(r => r.opened_at),
    routineDates,
    hasRoutine: (routines.data || []).length > 0,
  })
}
