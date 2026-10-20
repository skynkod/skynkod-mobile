import AsyncStorage from '@react-native-async-storage/async-storage'
import { buildSosPlan, issuesFromSituation } from './sos-plan'
import { activesOf } from './routine-checks'
import { findIngredients } from './ingredients-guide'

// The running 7-day plan, kept on the phone: { plan, startedAt } (older
// saves held a single situation id: { id, startedAt }).
const key = userId => `skynkod_emergency_${userId}`
const DAY = 86400000

const dayIndexSince = (startedAt) => {
  const start = new Date(startedAt)
  start.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((today - start) / DAY)
}

// After the 7 days, paused products come back one at a time, every 3 days,
// gentlest first; retinol comes back last, one night out of two. A product
// suspected of a reaction ("newest") never comes back on its own.
export const RETURN_ORDER = ['mask', 'fragrance', 'vitaminC', 'scrub', 'exfoliant', 'acid', 'retinoid']
// Spread over about two weeks: every 3 days, or every 2 when there are many.
const returnEvery = n => (n > 4 ? 2 : 3)
export const RETURN_LABELS = {
  mask: 'Masks', fragrance: 'Fragranced products', vitaminC: 'Vitamin C', scrub: 'Scrubs',
  exfoliant: 'Exfoliants', acid: 'Acids', retinoid: 'Retinol',
}

// When each paused product comes back: [{ id, day (dayIndex), back, again }].
const returnSchedule = (pause, repaused = []) =>
  RETURN_ORDER.filter(id => pause.includes(id)).map((id, k, all) => ({ id, day: 7 + k * returnEvery(all.length), again: repaused.includes(id) }))

// { situation, dayIndex, startedAt, phase: 'plan' | 'return', pause, schedule }
// or null when none / finished. `pause` is what is set aside today.
export const getActivePlan = async (userId) => {
  try {
    const raw = await AsyncStorage.getItem(key(userId))
    if (!raw) return null
    const saved = JSON.parse(raw)
    const situation = saved.plan || (saved.id ? buildSosPlan(issuesFromSituation(saved.id)) : null)
    const dayIndex = dayIndexSince(saved.startedAt)
    if (!situation || situation.urgent) { await AsyncStorage.removeItem(key(userId)); return null }
    const schedule = returnSchedule(situation.pause || [], saved.repaused || [])
    const lastDay = schedule.length ? schedule[schedule.length - 1].day + returnEvery(schedule.length) : 7
    if (dayIndex >= lastDay || (dayIndex > 6 && !schedule.length)) {
      await AsyncStorage.removeItem(key(userId))
      return null
    }
    if (dayIndex <= 6) return { situation, dayIndex, startedAt: saved.startedAt, phase: 'plan', pause: situation.pause, schedule }
    // Gradual return: still paused = not back yet, or put back after a reaction.
    const stillPaused = [
      ...(situation.pause || []).filter(id => id === 'newest'),
      ...schedule.filter(r => r.again || dayIndex < r.day).map(r => r.id),
    ]
    // Retinol, once back, only one night out of two at first.
    const retinol = schedule.find(r => r.id === 'retinoid')
    if (retinol && !retinol.again && dayIndex >= retinol.day && (dayIndex - retinol.day) % 2 === 1) stillPaused.push('retinoid')
    const today = schedule.find(r => r.day === dayIndex && !r.again) || null
    return { situation, dayIndex, startedAt: saved.startedAt, phase: 'return', pause: stillPaused, schedule, comingBack: today?.id || null, returnDay: dayIndex - 6, returnDays: lastDay - 7 }
  } catch {
    return null
  }
}

// A reaction logged during the return: the last product that came back goes
// back on pause.
export const repauseAfterReaction = async (userId) => {
  try {
    const plan = await getActivePlan(userId)
    if (!plan || plan.phase !== 'return') return null
    const back = plan.schedule.filter(r => !r.again && plan.dayIndex >= r.day)
    const last = back[back.length - 1]
    if (!last) return null
    const saved = JSON.parse(await AsyncStorage.getItem(key(userId)))
    saved.repaused = [...new Set([...(saved.repaused || []), last.id])]
    await AsyncStorage.setItem(key(userId), JSON.stringify(saved))
    return last.id
  } catch {
    return null
  }
}

export const startPlan = (userId, plan) => AsyncStorage.setItem(key(userId), JSON.stringify({ plan, startedAt: new Date().toISOString() }))
export const endPlan = userId => AsyncStorage.removeItem(key(userId))

const PAUSE_REASONS = {
  retinoid: 'retinol',
  acid: 'acids',
  exfoliant: 'exfoliation',
  vitaminC: 'vitamin C',
  fragrance: 'fragrance',
  scrub: 'scrubs',
  mask: 'masks',
  newest: 'your newest product',
}

// Today's steps with the plan applied: what stays, and what's paused and why.
export const adjustForPlan = (steps, productsById, plan, newestProductId = null) => {
  if (!plan) return { steps, paused: [] }
  const pauseNow = plan.pause || plan.situation.pause
  const kept = []
  const paused = []
  for (const step of steps) {
    const product = productsById[step.product_id]
    const a = product ? activesOf(product) : {}
    const ids = product ? new Set(findIngredients(product).map(f => f.entry.id)) : new Set()
    const hit = pauseNow.find(p =>
      (p === 'retinoid' && a.retinoid) ||
      (p === 'acid' && a.acid) ||
      (p === 'exfoliant' && a.exfoliant) ||
      (p === 'vitaminC' && a.vitaminC) ||
      (p === 'fragrance' && ids.has('fragrance')) ||
      (p === 'scrub' && ids.has('scrub')) ||
      (p === 'mask' && product?.category === 'mask') ||
      (p === 'newest' && (plan.situation.pauseProductId
        ? step.product_id === plan.situation.pauseProductId
        : newestProductId && step.product_id === newestProductId))
    )
    if (hit) paused.push({ step, reason: PAUSE_REASONS[hit] })
    else kept.push(step)
  }
  return { steps: kept, paused }
}
