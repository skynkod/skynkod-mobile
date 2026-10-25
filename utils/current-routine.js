import { todaySteps } from './routine-checks'
import { getActivePlan, adjustForPlan } from './emergency-state'
import { getProductsByIds, getNewestProductId } from './catalog'
import { getPausedProducts } from './paused-products'
import { isShortTonight } from './short-evening'
import { removerNeed, hasSunscreen } from './removers'
import { shortSteps } from './short-evening-core'

// The routine a period uses everywhere (Home, Routines, Journal, badges): the
// newest one of that type. One without any product counts as no routine, so
// emptying it never brings an older routine back.
export const currentRoutine = (routines, type) => {
  const newest = (routines || []).find(r => r.type === type)
  return newest && Array.isArray(newest.steps) && newest.steps.some(s => s.product) ? newest : null
}

// Lips are an essential step (Lita, 2026-10-25): a routine saved without one
// shows an empty Lips step, to pick a balm for.
export const withLipsStep = (steps = []) => (steps.some(s => s.key === 'lips' || (s.cats || []).includes('lip care'))
  ? steps
  : [...steps, { key: 'lips', action: 'Lips', product: null, product_id: null, cats: ['lip care'], days: null }])

// Steps left out today: a 7-day skin plan pauses strong products, and she can
// pause one herself after a reaction.
export const withPauses = (steps, { plan = null, products = {}, newest = null, pausedIds = [] } = {}) => {
  const base = adjustForPlan(steps, products, plan, newest)
  const mine = new Set(pausedIds)
  if (!mine.size) return base
  return {
    steps: base.steps.filter(st => !mine.has(st.product_id)),
    paused: [...base.paused, ...base.steps.filter(st => mine.has(st.product_id)).map(step => ({ step, reason: 'paused by you' }))],
  }
}

// Today's steps of a routine, as Home shows and ticks them.
export const todayStepsWithPauses = async (userId, routine, { morning = null } = {}) => {
  let steps = todaySteps(routine?.steps || [])
  // The makeup remover with makeup only some days is optional: not counted (as on Home).
  if (routine?.type === 'evening' && steps.some(s => s.key === 'remover')) {
    const { getUserProfile } = await import('./supabase')
    const { engineProfile } = await import('./skin-quiz')
    const row = await getUserProfile(userId).catch(() => null)
    if (removerNeed({ makeup: row ? engineProfile(row).makeup : null, hasSpf: hasSunscreen(morning?.steps || []) }) === 'optional') steps = steps.filter(s => s.key !== 'remover')
  }
  const [plan, paused] = await Promise.all([getActivePlan(userId).catch(() => null), getPausedProducts(userId).catch(() => [])])
  let products = {}
  let newest = null
  if (plan) {
    const [rows, latest] = await Promise.all([
      getProductsByIds(steps.map(x => x.product_id).filter(Boolean)).catch(() => []),
      plan.situation.pause.includes('newest') ? getNewestProductId(userId).catch(() => null) : null,
    ])
    products = Object.fromEntries(rows.map(x => [x.id, x]))
    newest = latest
  }
  const out = withPauses(steps, { plan, products, newest, pausedIds: (paused || []).map(p => p.id) }).steps
  // "Short version tonight": the Journal counts the same steps as Home.
  return routine?.type === 'evening' && await isShortTonight(userId).catch(() => false) ? shortSteps(out) : out
}
