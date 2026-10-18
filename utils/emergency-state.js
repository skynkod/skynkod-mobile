import AsyncStorage from '@react-native-async-storage/async-storage'
import { getSituation } from './emergency-plans'
import { activesOf } from './routine-checks'
import { findIngredients } from './ingredients-guide'

// The running 7-day plan, kept on the phone: { id, startedAt }.
const key = userId => `skynkod_emergency_${userId}`
const DAY = 86400000

const dayIndexSince = (startedAt) => {
  const start = new Date(startedAt)
  start.setHours(0, 0, 0, 0)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((today - start) / DAY)
}

// { situation, dayIndex (0–6), startedAt } or null when none / finished.
export const getActivePlan = async (userId) => {
  try {
    const raw = await AsyncStorage.getItem(key(userId))
    if (!raw) return null
    const saved = JSON.parse(raw)
    const situation = getSituation(saved.id)
    const dayIndex = dayIndexSince(saved.startedAt)
    if (!situation || dayIndex > 6) {
      await AsyncStorage.removeItem(key(userId))
      return null
    }
    return { situation, dayIndex, startedAt: saved.startedAt }
  } catch {
    return null
  }
}

export const startPlan = (userId, id) => AsyncStorage.setItem(key(userId), JSON.stringify({ id, startedAt: new Date().toISOString() }))
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
  const kept = []
  const paused = []
  for (const step of steps) {
    const product = productsById[step.product_id]
    const a = product ? activesOf(product) : {}
    const ids = product ? new Set(findIngredients(product).map(f => f.entry.id)) : new Set()
    const hit = plan.situation.pause.find(p =>
      (p === 'retinoid' && a.retinoid) ||
      (p === 'acid' && a.acid) ||
      (p === 'exfoliant' && a.exfoliant) ||
      (p === 'vitaminC' && a.vitaminC) ||
      (p === 'fragrance' && ids.has('fragrance')) ||
      (p === 'scrub' && ids.has('scrub')) ||
      (p === 'mask' && product?.category === 'mask') ||
      (p === 'newest' && newestProductId && step.product_id === newestProductId)
    )
    if (hit) paused.push({ step, reason: PAUSE_REASONS[hit] })
    else kept.push(step)
  }
  return { steps: kept, paused }
}
