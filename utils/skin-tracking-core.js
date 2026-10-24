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
