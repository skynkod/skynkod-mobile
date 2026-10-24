import { getUserProfile } from './supabase'
import { getUserRoutines } from './routines-service'
import { getMyProducts } from './catalog'
import { getEntriesBetween, getSkinPatterns } from './journal-day'
import { getActivePlan } from './emergency-state'
import { getRekodPlan, goalsTitle, weekOf, tonightNight, NIGHTS, planWeeks } from './rekod'
import { getDekodResults } from './dekod'
import { getSkinTracking } from './skin-tracking'
import { getVerdicts } from './expectation-verdicts'
import { getSkinEvents } from './skin-events'
import { getWaterDays, waterGoal } from './water'
import { loadState } from './cloud-state'
import { getProductsByIds } from './catalog'
import { getProductReactions } from './journal-day'
import { describeDays } from './routine-checks'
import { stopReason } from './stop-advice'
import { expectationFor, expectationStatus } from './expectations'

// What Koda should know about the user's week, sent with each question.
// Journal days and skin patterns are health data: only shared when the user
// accepted the health-data consent. Routine and products always are.
export const buildKodaContext = async (userId) => {
  if (!userId) return null
  const safe = promise => promise.catch(() => null)
  const profile = await safe(getUserProfile(userId))
  const healthOk = !!profile?.consent_health_at

  const since = new Date(Date.now() - 7 * 86400000)
  const [routines, products, plan, entries, patterns, rekod, dekod] = await Promise.all([
    safe(getUserRoutines(userId)),
    safe(getMyProducts(userId)),
    safe(getActivePlan(userId)),
    healthOk ? safe(getEntriesBetween(userId, since, new Date(Date.now() + 86400000))) : null,
    healthOk ? safe(getSkinPatterns(userId)) : null,
    safe(getRekodPlan(userId)),
    // Like the journal, the latest skin scan is only shared with the health consent.
    healthOk ? safe(getDekodResults(userId, 1)) : null,
  ])

  // Each step with its days when it isn't every day ("Retinol serum (Mon, Thu)").
  const routine = {}
  for (const r of (routines?.success ? routines.data : []) || []) {
    if (Array.isArray(r.steps) && r.steps.length) {
      routine[r.type] = r.steps.map(s => {
        const label = [s.action, s.product].filter(Boolean).join(': ')
        return Array.isArray(s.days) && s.days.length && s.days.length < 7 ? `${label} (${describeDays(s.days)})` : label
      }).slice(0, 10)
    }
  }

  // What Skynkod worked out since (Lita's audit, 2026-10-24): progress, what may
  // have helped, her own verdicts, products stopped or worth stopping, water,
  // travel. Health-related parts only with the health consent.
  const routineSteps = ((routines?.success ? routines.data : []) || []).flatMap(r => r.steps || [])
  const routineIds = [...new Set(routineSteps.map(s => s.product_id).filter(Boolean))]
  const [track, verdictMap, events, waterDays, away, routineProducts, reactions] = await Promise.all([
    healthOk ? safe(getSkinTracking(userId)) : null,
    safe(getVerdicts(userId)),
    safe(getSkinEvents(userId)),
    healthOk ? safe(getWaterDays(userId, since)) : null,
    safe(loadState(userId, 'climate_away', false)),
    routineIds.length ? safe(getProductsByIds(routineIds)) : [],
    healthOk ? safe(getProductReactions(userId)) : [],
  ])
  const byId = Object.fromEntries((routineProducts || []).map(p => [String(p.id), p]))
  const opened = Object.fromEntries((products || []).filter(p => p.opened_at && p.product_id).map(p => [String(p.product_id), p.opened_at]))
  const reactionOf = Object.fromEntries((reactions || []).map(r => [String(r.product?.id), r]))
  const verdicts = Object.entries(verdictMap || {}).map(([id, v]) => ({ name: byId[id]?.name || null, answer: v?.value })).filter(v => v.name)
  const actives = (routineProducts || []).map(p => {
    const e = expectationFor(p)
    const st = expectationStatus(e, opened[String(p.id)])
    return st ? { name: p.name, day: st.day, judgeAfterWeeks: `${e.weeks[0]}-${e.weeks[1]}` } : null
  }).filter(Boolean).slice(0, 6)
  const considerStopping = (routineProducts || []).map(p => {
    const a = stopReason({ product: p, profile, reaction: reactionOf[String(p.id)], others: routineProducts, verdict: verdictMap?.[p.id]?.value })
    return a ? { name: p.name, reason: a.title } : null
  }).filter(Boolean).slice(0, 5)
  const waterList = Object.values(waterDays || {})

  const monthAgo = Date.now() - 30 * 86400000
  const recentProducts = (products || [])
    .filter(p => p.status !== 'to_buy' && new Date(p.opened_at || p.created_at).getTime() >= monthAgo)
    .slice(0, 8)
    .map(p => ({
      name: [p.product?.brand || p.brand, p.product?.name || p.product_name].filter(Boolean).join(' '),
      opened: p.opened_at ? p.opened_at.slice(0, 10) : null,
      added: (p.created_at || '').slice(0, 10),
    }))

  return {
    today: new Date().toISOString().slice(0, 10),
    journal: healthOk
      ? (entries || []).filter(e => e.mood || (e.skin_state || []).length).map(e => ({ date: String(e.date).slice(0, 10), mood: e.mood, tags: e.skin_conditions || [], skinState: e.skin_state || [] }))
      : null,
    patterns: healthOk && patterns?.ready ? patterns.patterns.map(p => p.text) : null,
    routine,
    recentProducts,
    plan: plan ? { id: plan.situation.id, title: plan.situation.title, day: plan.dayIndex + 1 } : null,
    rekod: rekod ? {
      goals: goalsTitle(rekod),
      week: weekOf(rekod),
      weeks: planWeeks(rekod),
      tonight: NIGHTS[tonightNight(rekod)]?.label || null,
    } : null,
    progress: track?.changes?.length ? track.changes.map(c => ({ concern: c.label, change: c.change })) : null,
    skinReviews: track?.checkins?.length ? track.checkins.slice(0, 3).map(c => ({ date: String(c.created_at).slice(0, 10), overall: c.overall, concerns: c.concerns || [] })) : null,
    mayHaveHelped: track ? [...track.changed.helped.map(h => `${h.name}: skin better after starting it`), ...track.changed.worse.map(w => `${w.name}: redness rose after adding it`)].slice(0, 4) : null,
    verdicts: verdicts.length ? verdicts.slice(0, 6) : null,
    activesTiming: actives.length ? actives : null,
    stopped: (events || []).filter(e => e.kind === 'stopped').slice(0, 5).map(e => ({ name: e.name, date: String(e.created_at).slice(0, 10) })),
    considerStopping: considerStopping.length ? considerStopping : null,
    water: waterList.length ? { daysLogged: waterList.length, average: Math.round((waterList.reduce((a, b) => a + b, 0) / waterList.length) * 10) / 10, goal: waterGoal() } : null,
    travelling: !!away,
    dekod: dekod?.[0] ? {
      date: String(dekod[0].created_at).slice(0, 10),
      points: Object.fromEntries(Object.entries(dekod[0].result?.points || {}).map(([k, v]) => [k, v?.level || 'none'])),
    } : null,
  }
}
