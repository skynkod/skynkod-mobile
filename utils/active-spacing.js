import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'
import { getUserRoutines, saveRoutine } from './routines-service'
import { getProductsByIds } from './catalog'
import { activesOf, daysOf } from './routine-checks'

// "Your skin reacted this week: space your actives?" (Lita, 2026-10-24).
// When the journal shows redness, itching or peeling on 2 days or more in the
// last 7 while her evening routine has a face retinoid or acid, Home offers to
// space them for 2 weeks: retinoid Monday and Thursday, acids on Saturday.
// Then it offers to bring her own schedule back.

const REACTION_TAGS = ['Redness', 'Itchiness / Sensitivity', 'Peeling / Flaking']
const DAY = 86400000
const SPACE_FOR = 14 * DAY
const ASK_AGAIN = 7 * DAY
const key = userId => `skynkod_active_spacing_${userId}`
const SPACED = { retinoid: [1, 4], acid: [6] }

const load = async userId => JSON.parse((await AsyncStorage.getItem(key(userId)).catch(() => null)) || 'null') || {}
const store = (userId, state) => AsyncStorage.setItem(key(userId), JSON.stringify(state)).catch(() => {})

const faceActive = product => {
  if (!product || ['eye care', 'lip care'].includes(product.category)) return null
  const a = activesOf(product)
  return a.retinoid ? 'retinoid' : a.acid || a.exfoliant ? 'acid' : null
}

// What Home should show: null, { kind: 'offer', days }, or { kind: 'restore' }.
export const spacingState = async (userId) => {
  const state = await load(userId)
  const now = Date.now()
  if (state.spacedAt) return now - state.spacedAt >= SPACE_FOR ? { kind: 'restore' } : null
  if (state.dismissedAt && now - state.dismissedAt < ASK_AGAIN) return null

  const since = new Date(now - 7 * DAY).toISOString()
  const { data } = await supabase.from('journal_entries').select('date, skin_conditions').eq('user_id', userId).gte('date', since)
  const days = new Set((data || []).filter(e => (e.skin_conditions || []).some(t => REACTION_TAGS.includes(t))).map(e => new Date(e.date).toDateString()))
  if (days.size < 2) return null

  const res = await getUserRoutines(userId)
  const evening = (res.success ? res.data : []).find(r => r.type === 'evening')
  const ids = (evening?.steps || []).map(s => s.product_id).filter(Boolean)
  const products = ids.length ? await getProductsByIds(ids) : []
  return products.some(faceActive) ? { kind: 'offer', days: days.size } : null
}

// Spaces the face retinoid and acids, keeping her own days to bring back later.
export const spaceActives = async (userId) => {
  const res = await getUserRoutines(userId)
  const evening = (res.success ? res.data : []).find(r => r.type === 'evening')
  if (!evening) return false
  const products = await getProductsByIds(evening.steps.map(s => s.product_id).filter(Boolean))
  const byId = Object.fromEntries(products.map(p => [p.id, p]))
  // Nothing strong in the evening: nothing to space.
  if (!evening.steps.some(s => faceActive(byId[s.product_id]))) return false
  const original = evening.steps.map(s => s.days || null)
  const steps = evening.steps.map(s => {
    const kind = faceActive(byId[s.product_id])
    if (!kind) return s
    const days = SPACED[kind].filter(d => daysOf(s).includes(d))
    return { ...s, days: days.length ? days : SPACED[kind] }
  })
  const saved = await saveRoutine(userId, 'evening', steps)
  if (!saved.success) throw new Error(saved.error)
  await store(userId, { spacedAt: Date.now(), original })
  return true
}

export const restoreActives = async (userId) => {
  const state = await load(userId)
  const res = await getUserRoutines(userId)
  const evening = (res.success ? res.data : []).find(r => r.type === 'evening')
  if (evening && Array.isArray(state.original) && state.original.length === evening.steps.length) {
    const saved = await saveRoutine(userId, 'evening', evening.steps.map((s, i) => ({ ...s, days: state.original[i] })))
    if (!saved.success) throw new Error(saved.error)
  }
  await store(userId, {})
}

// "Not now" (or "keep it spaced"): ask again in a week.
export const dismissSpacing = async (userId) => store(userId, { ...(await load(userId)), spacedAt: undefined, dismissedAt: Date.now() })
