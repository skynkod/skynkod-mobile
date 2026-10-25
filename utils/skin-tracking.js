import { supabase } from './supabase'
import { getDekodResults } from './dekod'
import { getProductsByIds } from './catalog'
import { canAskAgain } from './ask-pace'
import { baselineOf, checkInStatus, progressChanges, whatChanged } from './skin-tracking-core'

// Loads what the skin tracking needs: the journal (6 months), her check-ins,
// Dekod scans and the products she started (first opened).
const DAY = 86400000

export const getCheckins = async (userId) => {
  const { data, error } = await supabase.from('skin_checkins').select('id, created_at, overall, concerns').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export const saveCheckin = async (userId, { overall, concerns }) => {
  const { error } = await supabase.from('skin_checkins').insert({ user_id: userId, overall, concerns })
  if (error) throw error
}

// Only what Home needs: is the 2-week check-in due?
export const getCheckInStatus = async (userId) => {
  const [first, checkins, scans, rekod] = await Promise.all([
    supabase.from('journal_entries').select('date').eq('user_id', userId).order('date', { ascending: true }).limit(1),
    getCheckins(userId),
    getDekodResults(userId, 30).catch(() => []),
    supabase.from('rekod_plans').select('user_id').eq('user_id', userId).maybeSingle(),
  ])
  // A Rekod member answers her weekly Rekod review: no second review on top (full audit, 2026-10-25).
  if (rekod?.data) return { due: false, rekod: true }
  const status = checkInStatus({ baseline: baselineOf({ entries: first.data || [], scans, checkins }), checkins })
  // Another "how is it going?" question in the last 3 days: the review waits.
  return status.due && !(await canAskAgain(userId)) ? { ...status, due: false } : status
}

export const getSkinTracking = async (userId) => {
  const since = new Date(Date.now() - 180 * DAY).toISOString()
  const [entries, first, checkins, scans, products] = await Promise.all([
    supabase.from('journal_entries').select('date, skin_conditions, skin_state').eq('user_id', userId).gte('date', since),
    supabase.from('journal_entries').select('date').eq('user_id', userId).order('date', { ascending: true }).limit(1),
    getCheckins(userId),
    getDekodResults(userId, 30).catch(() => []),
    supabase.from('user_products').select('product_id, product_name, opened_at').eq('user_id', userId).not('opened_at', 'is', null).gte('opened_at', since),
  ])
  if (entries.error) throw entries.error
  const journal = entries.data || []
  const baseline = baselineOf({ entries: first.data || [], scans, checkins })
  const rows = products.data || []
  const names = Object.fromEntries((await getProductsByIds([...new Set(rows.map(r => r.product_id).filter(Boolean))]).catch(() => [])).map(p => [p.id, p.name]))
  const started = rows.map(r => ({ name: names[r.product_id] || r.product_name, date: r.opened_at })).filter(s => s.name)
  return {
    baseline,
    status: checkInStatus({ baseline, checkins }),
    checkins,
    firstScan: scans.length ? scans[scans.length - 1] : null,
    changes: progressChanges({ entries: journal }),
    changed: whatChanged({ entries: journal, started }),
  }
}
