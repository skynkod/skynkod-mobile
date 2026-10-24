import { supabase } from './supabase'

// The skin's CURRENT state (Lita, 2026-10-24), apart from its permanent
// profile (dry, oily, sensitive…). She picks it in the morning check-in, under
// her mood; without a pick, the last two days of her journal give it. It
// changes the recommendations for a while: a product can be a great match for
// her skin and still be "not right for you right now".

export const SKIN_STATES = [
  { id: 'balanced', label: 'Balanced', emoji: '😌' },
  { id: 'dehydrated', label: 'Dehydrated', emoji: '💧' },
  { id: 'irritated', label: 'Irritated', emoji: '🔥' },
  { id: 'red', label: 'Red', emoji: '🔴' },
  { id: 'breakout', label: 'Breaking out', emoji: '😵‍💫' },
  { id: 'barrier', label: 'Barrier damaged', emoji: '🧱' },
]
// Computed, never picked: irritation while the routine exfoliates a lot.
export const OVER_EXFOLIATED = { id: 'overexfoliated', label: 'Over-exfoliated', emoji: '🧽' }
export const stateLabel = id => (SKIN_STATES.find(s => s.id === id) || (id === OVER_EXFOLIATED.id ? OVER_EXFOLIATED : null))?.label || id

// States where strong actives should wait.
export const REACTIVE = ['irritated', 'red', 'barrier', 'overexfoliated']
export const isReactiveState = states => (states || []).some(s => REACTIVE.includes(s))

// Journal signs → states, when she didn't pick one.
const FROM_TAGS = { Redness: 'red', 'Itchiness / Sensitivity': 'irritated', 'Peeling / Flaking': 'barrier', Dryness: 'dehydrated', 'New pimple': 'breakout' }

const DAY = 86400000
const sameDay = (a, b) => new Date(a).toDateString() === new Date(b).toDateString()

// { states: [...], source: 'today' | 'recent' | 'journal' } or null when unknown.
// `strongNights`: how many evenings a week the routine uses a face retinoid or
// exfoliant (from routine-checks), to spot over-exfoliation.
export const currentSkinState = async (userId, { strongNights = 0 } = {}) => {
  if (!userId) return null
  const since = new Date(Date.now() - 2 * DAY)
  since.setHours(0, 0, 0, 0)
  const { data, error } = await supabase.from('journal_entries').select('date, skin_state, skin_conditions')
    .eq('user_id', userId).gte('date', since.toISOString()).order('date', { ascending: false })
  if (error || !data?.length) return null
  const picked = data.find(e => (e.skin_state || []).length)
  let states, source
  if (picked) {
    states = picked.skin_state
    source = sameDay(picked.date, Date.now()) ? 'today' : 'recent'
  } else {
    states = [...new Set(data.flatMap(e => (e.skin_conditions || []).map(t => FROM_TAGS[t]).filter(Boolean)))]
    source = 'journal'
    if (!states.length) return null
  }
  // Irritated, red or a damaged barrier with 3+ strong nights a week: too much exfoliation.
  if (isReactiveState(states) && strongNights >= 3 && !states.includes('overexfoliated')) states = [...states, 'overexfoliated']
  return { states, source }
}
