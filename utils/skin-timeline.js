import { supabase } from './supabase'
import { getProductsByIds } from './catalog'
import { getProductReactions } from './journal-day'
import { getSkinEvents } from './skin-events'
import { getVerdicts } from './expectation-verdicts'
import { getSkinTracking } from './skin-tracking'
import { buildTimeline, journeySummary } from './skin-tracking-core'

// Loads everything the Skin Timeline shows (Lita, 2026-10-24).
const DAY = 86400000

export const getSkinTimeline = async (userId) => {
  const since = new Date(Date.now() - 365 * DAY).toISOString()
  const [track, entries, opened, events, verdictMap, archives, rekod, reactions] = await Promise.all([
    getSkinTracking(userId),
    supabase.from('journal_entries').select('date, skin_conditions, skin_state').eq('user_id', userId).gte('date', since),
    supabase.from('user_products').select('product_id, product_name, opened_at').eq('user_id', userId).not('opened_at', 'is', null),
    getSkinEvents(userId),
    getVerdicts(userId).catch(() => ({})),
    supabase.from('routine_archive').select('archived_at').eq('user_id', userId),
    supabase.from('rekod_plans').select('plan').eq('user_id', userId).maybeSingle(),
    getProductReactions(userId).catch(() => []),
  ])
  const rows = opened.data || []
  const ids = [...new Set([...rows.map(r => r.product_id), ...Object.keys(verdictMap)].filter(Boolean))]
  const names = Object.fromEntries((ids.length ? await getProductsByIds(ids).catch(() => []) : []).map(p => [String(p.id), p.name]))
  const started = rows.map(r => ({ name: names[String(r.product_id)] || r.product_name, date: r.opened_at })).filter(s => s.name)
  const stopped = events.filter(e => e.kind === 'stopped').map(e => ({ name: e.name, date: e.created_at }))
  const verdicts = Object.entries(verdictMap).map(([id, v]) => ({ name: names[String(id)], value: v.value, date: new Date(v.at).toISOString() })).filter(v => v.name)
  // One season event per day the routines were archived.
  const seasons = [...new Set((archives.data || []).map(a => a.archived_at?.slice(0, 10)).filter(Boolean))].map(date => ({ date }))
  const scans = track.firstScan ? await supabase.from('dekod_results').select('created_at').eq('user_id', userId).then(r => r.data || []).catch(() => []) : []

  const timeline = buildTimeline({
    baseline: track.baseline, started, stopped, checkins: track.checkins, scans, verdicts, seasons,
    rekodStart: rekod.data?.plan?.startedAt || null, entries: entries.data || [],
  })
  const summary = journeySummary({ verdicts, changed: track.changed, reactions: reactions.map(r => ({ name: r.product?.name })), stopped, started })
  return { timeline, summary }
}
