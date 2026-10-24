// Skin tracking (Lita, 2026-10-24): her baseline, a check-in every 2 weeks,
// how each concern changed (from the journal, so the numbers are hers), and
// what may have helped. Links seen in her own data, never proof: the screens
// always say so. Pure functions, no storage, so they can be tested.

const DAY = 86400000
export const CHECKIN_EVERY_DAYS = 14

// The concerns the progress card follows: the Journal's problems (tags) and
// Home's "Your skin feels" chips (states) both count, so the 10 seconds on
// Home are enough.
export const TRACKED = [
  { key: 'breakouts', label: 'Breakouts', tags: ['New pimple'], states: ['breakout'], color: 'warning' },
  { key: 'redness', label: 'Redness', tags: ['Redness', 'Itchiness / Sensitivity'], states: ['red', 'irritated'], color: 'danger' },
  // Dry skin lacks oil, dehydrated skin lacks water: two different things.
  { key: 'dryness', label: 'Dryness', tags: ['Dryness', 'Peeling / Flaking'], states: [], color: 'caution' },
  { key: 'dehydration', label: 'Dehydration', tags: [], states: ['dehydrated'], color: 'primary' },
  { key: 'oiliness', label: 'Oiliness', tags: ['Oily'], states: [], color: 'success' },
]
export const CHECKIN_CONCERNS = ['Breakouts', 'Redness', 'Dryness', 'Oiliness', 'Texture', 'Dark spots']
export const OVERALL = [
  { key: 'better', label: 'Better', emoji: '😊' },
  { key: 'same', label: 'Same', emoji: '😐' },
  { key: 'worse', label: 'Worse', emoji: '😣' },
]

const time = d => new Date(d).getTime()
const ALL = { tags: TRACKED.flatMap(t => t.tags), states: TRACKED.flatMap(t => t.states) }
// Share of journal days with one of these problems (0 to 1), or null without enough days.
const rate = (entries, { tags, states }, min) => {
  if (entries.length < min) return null
  return entries.filter(e => (e.skin_conditions || []).some(x => tags.includes(x)) || (e.skin_state || []).some(x => states.includes(x))).length / entries.length
}
const between = (entries, from, to) => entries.filter(e => time(e.date) >= from && time(e.date) < to)

// Her start: the first journal day, Dekod scan or check-in.
export const baselineOf = ({ entries = [], scans = [], checkins = [] }) => {
  const dates = [...entries.map(e => e.date), ...scans.map(s => s.created_at), ...checkins.map(c => c.created_at)].filter(Boolean).map(time)
  return dates.length ? new Date(Math.min(...dates)) : null
}

// Where she is: which week, and whether the 2-week check-in is due.
export const checkInStatus = ({ baseline, checkins = [], now = new Date() }) => {
  if (!baseline) return { started: false, due: false }
  const last = checkins.length ? Math.max(...checkins.map(c => time(c.created_at))) : time(baseline)
  const next = new Date(last + CHECKIN_EVERY_DAYS * DAY)
  return {
    started: true,
    week: Math.floor((time(now) - time(baseline)) / (7 * DAY)) + 1,
    due: time(now) >= next.getTime(),
    next,
    count: checkins.length,
  }
}

// How each concern changed: the last 4 weeks against the 4 weeks before
// (or since her start when that's shorter). At least 5 journal days each side.
export const progressChanges = ({ entries = [], now = new Date(), minDays = 5 }) => {
  const end = time(now) + DAY
  const cut = end - 28 * DAY
  const recent = between(entries, cut, end)
  const before = between(entries, cut - 28 * DAY, cut)
  return TRACKED.map(t => {
    const b = rate(before, t, minDays)
    const a = rate(recent, t, minDays)
    if (a === null || b === null || (!a && !b)) return null
    return { key: t.key, label: t.label, color: t.color, before: b, after: a, change: b ? Math.round(((a - b) / b) * 100) : null }
  }).filter(Boolean)
}

// What may have helped, or not: each product she started, the 3 weeks before
// against weeks 2 to 4 after (skin needs time). Products started within 2 weeks
// of each other can't be told apart, so they're reported together.
export const whatChanged = ({ entries = [], started = [], now = new Date(), minDays = 4 }) => {
  const out = { helped: [], worse: [], together: [] }
  const ready = started
    .filter(s => s.date && time(now) - time(s.date) >= 28 * DAY && time(now) - time(s.date) <= 180 * DAY)
    .sort((a, b) => time(a.date) - time(b.date))
  // Groups of products started within 14 days of each other.
  const groups = []
  for (const s of ready) {
    const g = groups[groups.length - 1]
    if (g && time(s.date) - time(g[g.length - 1].date) < 14 * DAY) g.push(s)
    else groups.push([s])
  }
  for (const g of groups) {
    const start = time(g[0].date)
    const before = between(entries, start - 21 * DAY, start)
    const after = between(entries, start + 7 * DAY, time(g[g.length - 1].date) + 28 * DAY)
    const b = rate(before, ALL, minDays)
    const a = rate(after, ALL, minDays)
    if (a === null || b === null) continue
    const redB = rate(before, TRACKED[1], minDays)
    const redA = rate(after, TRACKED[1], minDays)
    const better = b >= 0.2 && a <= b * 0.7
    const irritated = redA - redB >= 0.2
    if (!better && !irritated) continue
    if (g.length > 1) { out.together.push({ names: g.map(s => s.name), date: g[0].date, better, irritated }); continue }
    if (better) out.helped.push({ name: g[0].name, date: g[0].date, change: Math.round(((a - b) / b) * 100) })
    if (irritated) out.worse.push({ name: g[0].name, date: g[0].date, concern: 'Redness' })
  }
  return out
}

// One new active at a time: wait this long after starting one before the next.
export const NEW_ACTIVE_WAIT_DAYS = 14

// The most recent other active started less than 2 weeks ago, or null.
// started: [{ id, name, date }]
export const recentNewActive = ({ candidate, started = [], now = new Date(), wait = NEW_ACTIVE_WAIT_DAYS }) => {
  const recent = started
    .filter(s => s.id !== candidate?.id && now.getTime() - new Date(s.date).getTime() < wait * DAY)
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
  return recent ? { ...recent, until: new Date(new Date(recent.date).getTime() + wait * DAY) } : null
}

// ---------- Skin Timeline (Lita, 2026-10-24) ----------
// Every step of her skin story, newest first. Events: { date, kind, text, params }.
export const buildTimeline = ({ baseline = null, started = [], stopped = [], checkins = [], scans = [], verdicts = [], seasons = [], rekodStart = null, entries = [], now = new Date() }) => {
  const ev = []
  if (baseline) ev.push({ date: baseline, kind: 'baseline', text: 'Your skin baseline' })
  for (const s of started) ev.push({ date: s.date, kind: 'started', text: 'Started {name}', params: { name: s.name } })
  for (const s of stopped) ev.push({ date: s.date, kind: 'stopped', text: 'Stopped {name}', params: { name: s.name } })
  for (const c of checkins) {
    const o = OVERALL.find(x => x.key === c.overall)
    ev.push({ date: c.created_at, kind: 'checkin', text: 'Check-in: {overall}', params: { overall: o?.label || '' }, emoji: o?.emoji })
  }
  for (const s of scans) ev.push({ date: s.created_at, kind: 'scan', text: 'Dekod scan' })
  for (const v of verdicts) ev.push({ date: v.date, kind: `verdict-${v.value}`, text: v.value === 'better' ? '{name} helps your skin' : v.value === 'worse' ? 'Your skin got worse with {name}' : 'No change with {name}', params: { name: v.name } })
  for (const s of seasons) ev.push({ date: s.date, kind: 'season', text: 'New routine for the season' })
  if (rekodStart) ev.push({ date: rekodStart, kind: 'rekod', text: 'Started a Rekod programme' })
  // Big changes, 4 weeks against the 4 before, every 4 weeks back to 6 months.
  for (let k = 0; k < 6; k += 1) {
    const end = new Date(time(now) - k * 28 * DAY)
    for (const c of progressChanges({ entries, now: end })) {
      if (c.change === null || Math.abs(c.change) < 20) continue
      ev.push({ date: end.toISOString(), kind: c.change < 0 ? 'better' : 'worse', text: '{concern} {arrow} {n}%', params: { concern: c.label, arrow: c.change < 0 ? '↓' : '↑', n: Math.abs(c.change) }, concern: c.key })
    }
  }
  return ev.filter(e => e.date).sort((a, b) => time(b.date) - time(a.date))
}

// The summary at the top: what worked, what didn't, what she stopped, how much changed.
export const journeySummary = ({ verdicts = [], changed = { helped: [], worse: [] }, reactions = [], stopped = [], started = [], now = new Date() }) => {
  const uniq = list => [...new Set(list.filter(Boolean))]
  const recent = list => list.filter(x => time(now) - time(x.date) <= 90 * DAY)
  return {
    worked: uniq([...verdicts.filter(v => v.value === 'better').map(v => v.name), ...changed.helped.map(h => h.name)]),
    didnt: uniq([...verdicts.filter(v => v.value === 'worse').map(v => v.name), ...changed.worse.map(w => w.name), ...reactions.map(r => r.name)]),
    stopped: uniq(stopped.map(s => s.name)),
    changes: recent(started).length + recent(stopped).length,
  }
}
