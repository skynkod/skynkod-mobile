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
    const { error } = await supabase.from('journal_entries').update(fields).eq('id', existingId)
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
