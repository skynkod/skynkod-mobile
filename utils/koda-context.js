import { getUserProfile } from './supabase'
import { getUserRoutines } from './routines-service'
import { getMyProducts } from './catalog'
import { getEntriesBetween, getSkinPatterns } from './journal-day'
import { getActivePlan } from './emergency-state'
import { getRekodPlan, goalsTitle, weekOf, goalOf, tonightNight, NIGHTS, planWeeks } from './rekod'
import { getDekodResults } from './dekod'

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

  const routine = {}
  for (const r of (routines?.success ? routines.data : []) || []) {
    if (Array.isArray(r.steps) && r.steps.length) {
      routine[r.type] = r.steps.map(s => [s.action, s.product].filter(Boolean).join(': ')).slice(0, 10)
    }
  }

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
      ? (entries || []).filter(e => e.mood).map(e => ({ date: String(e.date).slice(0, 10), mood: e.mood, tags: e.skin_conditions || [] }))
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
    dekod: dekod?.[0] ? {
      date: String(dekod[0].created_at).slice(0, 10),
      points: Object.fromEntries(Object.entries(dekod[0].result?.points || {}).map(([k, v]) => [k, v?.level || 'none'])),
    } : null,
  }
}
