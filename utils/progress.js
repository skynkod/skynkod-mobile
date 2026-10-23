import { supabase } from './supabase'
import { getDekodResults, compareScans } from './dekod'
import { localDay } from './routine-log'

// "My progress" and the weekly recap: everything comes from what she already
// fills in (journal moods and problems, ticked routines, Dekod scans).

export const MOOD_SCORE = { great: 5, good: 4, okay: 3, bad: 2, terrible: 1 }
const DAY = 86400000
const avg = list => (list.length ? list.reduce((a, b) => a + b, 0) / list.length : null)
const dayKey = d => localDay(new Date(d))

const load = async (userId, days) => {
  const since = new Date(Date.now() - days * DAY)
  const [entries, ticks] = await Promise.all([
    supabase.from('journal_entries').select('date, mood, skin_conditions').eq('user_id', userId).gte('date', since.toISOString()),
    supabase.from('routine_completions').select('date, routine_type').eq('user_id', userId).gte('date', localDay(since)),
  ])
  if (entries.error) throw entries.error
  if (ticks.error) throw ticks.error
  return { entries: entries.data || [], ticks: ticks.data || [] }
}

// Which routines were done each day: { 'YYYY-MM-DD': { morning, evening } }.
const routineDays = ticks => {
  const out = {}
  for (const t of ticks) {
    out[t.date] = out[t.date] || { morning: false, evening: false }
    if (t.routine_type === 'morning' || t.routine_type === 'evening') out[t.date][t.routine_type] = true
  }
  return out
}

const tagCounts = entries => {
  const out = {}
  for (const e of entries) for (const tag of e.skin_conditions || []) out[tag] = (out[tag] || 0) + 1
  return out
}

const inRange = (date, from, to) => { const t = new Date(date).getTime(); return t >= from && t < to }

export const getProgress = async (userId) => {
  const { entries, ticks } = await load(userId, 56)
  const now = Date.now()
  const done = routineDays(ticks)

  // Four rolling weeks, oldest first: average mood and routines done.
  const weeks = [3, 2, 1, 0].map(w => {
    const to = now - w * 7 * DAY + DAY
    const from = to - 7 * DAY
    const moods = entries.filter(e => e.mood && inRange(e.date, from, to)).map(e => MOOD_SCORE[e.mood]).filter(Boolean)
    let routines = 0
    for (let d = 0; d < 7; d += 1) {
      const k = dayKey(from + d * DAY)
      routines += (done[k]?.morning ? 1 : 0) + (done[k]?.evening ? 1 : 0)
    }
    return { mood: avg(moods), routines, from }
  })

  const recent = avg(weeks.slice(2).map(w => w.mood).filter(v => v !== null))
  const before = avg(weeks.slice(0, 2).map(w => w.mood).filter(v => v !== null))
  const moodTrend = recent === null ? null : before === null ? 'start' : recent - before >= 0.4 ? 'better' : before - recent >= 0.4 ? 'harder' : 'steady'

  // The last 28 days, for the calendar.
  const calendar = Array.from({ length: 28 }, (_, i) => {
    const k = dayKey(now - (27 - i) * DAY)
    return { date: k, morning: !!done[k]?.morning, evening: !!done[k]?.evening }
  })
  const routinesDone = calendar.reduce((n, d) => n + (d.morning ? 1 : 0) + (d.evening ? 1 : 0), 0)

  // Problems ticked in the journal: last 4 weeks against the 4 before.
  const cut = now - 28 * DAY
  const nowCounts = tagCounts(entries.filter(e => new Date(e.date).getTime() >= cut))
  const prevCounts = tagCounts(entries.filter(e => new Date(e.date).getTime() < cut))
  const concerns = Object.keys({ ...nowCounts, ...prevCounts })
    .map(tag => ({ tag, now: nowCounts[tag] || 0, before: prevCounts[tag] || 0 }))
    .filter(c => c.now || c.before)
    .sort((a, b) => b.now - a.now || b.before - a.before)
    .slice(0, 4)

  // Dekod, if she scans: first scan of the last 3 months against the latest.
  const scans = await getDekodResults(userId, 30).catch(() => [])
  const recentScans = scans.filter(s => now - new Date(s.created_at).getTime() <= 90 * DAY)
  const dekod = recentScans.length > 1
    ? { from: recentScans[recentScans.length - 1].created_at, to: recentScans[0].created_at, rows: compareScans(recentScans[recentScans.length - 1].result?.points, recentScans[0].result?.points) }
    : null

  return { weeks, moodTrend, calendar, routinesDone, concerns, dekod, hasData: entries.length > 0 || ticks.length > 0 }
}

// ---------- The weekly recap (shown on Mondays for the week that just ended) ----------

const lastWeekBounds = (now = new Date()) => {
  const end = new Date(now)
  end.setHours(0, 0, 0, 0)
  end.setDate(end.getDate() - ((end.getDay() + 6) % 7)) // this Monday 00:00
  const start = new Date(end.getTime() - 7 * DAY)
  return { start, end }
}
export const recapWeekKey = (now = new Date()) => localDay(lastWeekBounds(now).start)

export const getWeekRecap = async (userId) => {
  const { start, end } = lastWeekBounds()
  const { entries, ticks } = await load(userId, 15)
  const done = routineDays(ticks)
  let routines = 0
  for (let d = 0; d < 7; d += 1) {
    const k = dayKey(start.getTime() + d * DAY)
    routines += (done[k]?.morning ? 1 : 0) + (done[k]?.evening ? 1 : 0)
  }
  const week = entries.filter(e => inRange(e.date, start.getTime(), end.getTime()))
  const prev = entries.filter(e => inRange(e.date, start.getTime() - 7 * DAY, start.getTime()))
  const mood = avg(week.filter(e => e.mood).map(e => MOOD_SCORE[e.mood]).filter(Boolean))
  const prevMood = avg(prev.filter(e => e.mood).map(e => MOOD_SCORE[e.mood]).filter(Boolean))
  const counts = tagCounts(week)
  const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] || null

  // One tip, from what the week shows. Both routines, every day, are what
  // bring results: said kindly, never lowered to "at least one".
  const tip = routines < 7
    ? 'Your skin changes when you care for it morning and evening, every day. This week, make your two routines a small daily ritual: a few minutes that add up to real results.'
    : routines < 12
    ? 'You’re building the habit. This week, aim for your morning and evening routines every day: that’s where results really show.'
    : top && ['New pimple', 'Oily'].includes(top[0]) ? 'Keep your two routines steady, your hands off your face, and change your pillowcase this week.'
    : top && ['Dryness', 'Peeling / Flaking'].includes(top[0]) ? 'Keep your two routines going, moisturize on damp skin and skip hot water this week.'
    : top && ['Redness', 'Itchiness / Sensitivity'].includes(top[0]) ? 'Keep your two routines gentle this week: no new products, no strong actives.'
    : top && ['Poor sleep', 'Stress'].includes(top[0]) ? 'Your routines are on track. Sleep and stress show on skin too: try an earlier night or two this week.'
    : 'Morning and evening, every day: your skin feels it. Keep this rhythm, it’s your skin code.'

  return {
    from: start, routines, checkins: week.filter(e => e.mood).length, mood,
    moodChange: mood !== null && prevMood !== null ? mood - prevMood : null,
    top: top ? { tag: top[0], count: top[1] } : null,
    tip,
    empty: !routines && !week.length,
  }
}

// Kind words for a week's skin mood: a hard week is never called "terrible".
export const moodLabel = score => (score === null ? null : score >= 4.5 ? 'Great' : score >= 3.5 ? 'Good' : score >= 2.5 ? 'Okay' : score >= 1.5 ? 'Not easy' : 'Tough')
