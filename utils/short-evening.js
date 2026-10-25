import { loadState, saveState } from './cloud-state'
import { skinDayKey } from './skin-day'
import { shiftPlan } from './short-evening-core'

// "Short version tonight" (Lita, 2026-10-25): the evenings she chose it, kept
// in her account. { dates: [skin day keys], shifted: [keys where Rekod paused], suggestedAt }
// The rules: short-evening-core.js.

export const getShortState = async (userId) => {
  const s = await loadState(userId, 'short_evenings', {})
  return s && typeof s === 'object' ? s : {}
}
const save = (userId, state) => saveState(userId, 'short_evenings', state)
const lastMonth = list => (list || []).slice(-30)

export const isShortTonight = async (userId) => (await getShortState(userId)).dates?.includes(skinDayKey()) || false

// Rekod (Premium, so the routine follows it) takes a one-night pause.
export const startShortEvening = async (userId, { rekodPlan = null, premium = false } = {}) => {
  const { getRekodPlan, saveRekodPlan } = await import('./rekod')
  const state = await getShortState(userId)
  const key = skinDayKey()
  if (state.dates?.includes(key)) return state
  let shifted = state.shifted || []
  const plan = rekodPlan || await getRekodPlan(userId).catch(() => null)
  if (plan && premium) {
    await saveRekodPlan(userId, shiftPlan(plan, 1))
    shifted = lastMonth([...shifted, key])
  }
  const next = { ...state, dates: lastMonth([...(state.dates || []), key]), shifted }
  await save(userId, next)
  return next
}

// "Back to my full routine": undoes tonight, Rekod's pause included.
export const cancelShortEvening = async (userId) => {
  const { getRekodPlan, saveRekodPlan } = await import('./rekod')
  const state = await getShortState(userId)
  const key = skinDayKey()
  if ((state.shifted || []).includes(key)) {
    const plan = await getRekodPlan(userId).catch(() => null)
    if (plan) await saveRekodPlan(userId, shiftPlan(plan, -1))
  }
  const next = { ...state, dates: (state.dates || []).filter(d => d !== key), shifted: (state.shifted || []).filter(d => d !== key) }
  await save(userId, next)
  return next
}

export const markSimplifyOffered = async (userId) => {
  const state = await getShortState(userId)
  const next = { ...state, suggestedAt: new Date().toISOString() }
  await save(userId, next)
  return next
}
