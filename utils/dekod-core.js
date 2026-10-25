// Dekod's pure logic (no phone APIs), so it can be tested on its own.

// Dekod v2 (Lita's audit, 2026-10-25): seven separate points, each scored
// 0–10 (0 = nothing visible). Older scans had five points and three levels:
// they still read through scoreOf().
export const DEKOD_POINTS = [
  { key: 'redness', label: 'Redness', icon: 'pulse-outline', tag: 'Redness', issue: 'redness' },
  { key: 'shine', label: 'Shine', icon: 'sunny-outline', tag: 'Oily', issue: null },
  { key: 'blemishes', label: 'Spots', icon: 'ellipse-outline', tag: 'New pimple', issue: 'breakout' },
  { key: 'blackheads', label: 'Blackheads', icon: 'grid-outline', tag: null, issue: null },
  { key: 'dryness', label: 'Dryness', icon: 'water-outline', tag: 'Dryness', issue: 'dry' },
  { key: 'spots', label: 'Dark spots & tone', icon: 'color-palette-outline', tag: null, issue: null, old: 'tone' },
  { key: 'radiance', label: 'Dullness', icon: 'sparkles-outline', tag: null, issue: null, old: 'tone' },
]

// The five points of scans made before Dekod v2, shown as they were.
export const OLD_POINTS = [
  { key: 'redness', label: 'Redness', icon: 'pulse-outline' },
  { key: 'shine', label: 'Shine', icon: 'sunny-outline' },
  { key: 'blemishes', label: 'Spots', icon: 'ellipse-outline' },
  { key: 'dryness', label: 'Dryness', icon: 'water-outline' },
  { key: 'tone', label: 'Tone & dark spots', icon: 'color-palette-outline' },
]

// A point's score 0–10, or null when it wasn't read. Old scans: none → 1,
// light → 4, visible → 7 ("tone" stood for both dark spots and dullness).
const OLD_SCORE = { none: 1, light: 4, visible: 7 }
export const scoreOf = (points, key) => {
  const p = points?.[key] ?? (DEKOD_POINTS.find(x => x.key === key)?.old ? points?.[DEKOD_POINTS.find(x => x.key === key).old] : undefined)
  if (!p) return null
  if (typeof p.score === 'number') return p.score
  if (p.score === null) return null
  return OLD_SCORE[p.level] ?? null
}
export const levelFor = score => (score === null || score === undefined ? null : score <= 2 ? 'none' : score <= 5 ? 'light' : 'visible')

// The average of up to `n` scans (newest first), point by point: one photo in
// odd light shouldn't move anything on its own.
export const averagePoints = (scans = [], n = 3) => Object.fromEntries(DEKOD_POINTS.map(p => {
  const values = scans.slice(0, n).map(s => scoreOf(s?.result?.points ?? s?.points, p.key)).filter(v => v !== null)
  const score = values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10 : null
  return [p.key, { score, level: levelFor(score) }]
}))

// Before and after, from scans that never overlap (audit 2: with 2 or 3 scans
// the same ones were "before" and "after", so nothing ever changed).
// `scans` newest first; null with fewer than 2.
export const splitScans = (scans = []) => {
  if (scans.length < 2) return null
  const before = Math.min(2, Math.floor(scans.length / 2))
  const after = Math.min(3, scans.length - before)
  const oldest = [...scans].reverse()
  return { from: averagePoints(oldest, before), to: averagePoints(scans, after), fromAt: oldest[0].created_at, toAt: scans[0].created_at }
}

// Her starting point for Rekod: the scans of her first week averaged (one
// odd Day 0 photo shouldn't skew everything), else the Day 0 scan.
export const startPoints = (scans = [], startedAt, baselinePoints = null) => {
  const start = new Date(startedAt).getTime()
  const firstWeek = scans.filter(s => { const at = new Date(s.created_at).getTime(); return at >= start - 86400000 && at <= start + 7 * 86400000 })
  return firstWeek.length ? averagePoints([...firstWeek].reverse(), 3) : baselinePoints
}

// What the scan suggests for the journal and Emergency mode. The scan never
// decides her mood; Emergency is offered only when a point is clearly marked
// AND clearly worse than her own usual (her previous scans).
export const journalFrom = (points, previous = []) => {
  const usual = previous.length ? averagePoints(previous) : null
  const tags = DEKOD_POINTS.filter(p => p.tag && (scoreOf(points, p.key) ?? 0) >= 6).map(p => p.tag)
  const issues = usual ? DEKOD_POINTS.filter(p => {
    const now = scoreOf(points, p.key)
    const before = usual[p.key].score
    return p.issue && now !== null && before !== null && now >= 6 && now - before >= 3
  }).map(p => p.issue) : []
  return { mood: null, tags, issues }
}

// ---------- Dekod × Rekod ----------
// Dekod reads the skin, Rekod transforms it: the scan suggests Rekod goals
// (Day 0), feeds the weekly check-in, and shows the before / after.

// A change counts only when it's clear: 2 points or more on the 0–10 scale.
const CLEAR = 2

// A scan from the last `days` days, newest first, or null.
export const recentScan = (history, days = 7) =>
  (history || []).find(h => Date.now() - new Date(h.created_at).getTime() <= days * 86400000) || null

// Rekod goals suggested by what Dekod saw (most visible first, max 3).
// Each point leads to its own goal (shine is oil, not pores: no goal of its own).
export const goalsFromDekod = points => {
  const map = [['blemishes', 'clear'], ['blackheads', 'pores'], ['redness', 'calm'], ['dryness', 'hydration'], ['spots', 'spots'], ['radiance', 'glow']]
  const score = key => scoreOf(points, key) ?? 0
  return map
    .filter(([key]) => score(key) >= 4)
    .sort((a, b) => score(b[0]) - score(a[0]))
    .map(([, goal]) => goal)
    .filter((g, i, all) => all.indexOf(g) === i)
    .slice(0, 3)
}

// Point by point, from the Day 0 scan to the latest: { key, from, to, trend }.
// `from` and `to` are levels (none, light, visible), with the scores beside.
// Pass averaged points (averagePoints) so one odd photo doesn't count as a change.
export const compareScans = (fromPoints, toPoints) =>
  DEKOD_POINTS.map(p => {
    const a = scoreOf(fromPoints, p.key)
    const b = scoreOf(toPoints, p.key)
    const trend = a === null || b === null ? 'same' : b <= a - CLEAR ? 'better' : b >= a + CLEAR ? 'worse' : 'same'
    return { key: p.key, label: p.label, from: levelFor(a), to: levelFor(b), fromScore: a, toScore: b, trend }
  }).filter(r => r.fromScore !== null || r.toScore !== null)

// The weekly check-in answer the scan points to: irritation signs (redness,
// dryness) getting worse slow the plan down; otherwise it can move on.
export const checkInFromDekod = (fromPoints, toPoints) => {
  const irritation = compareScans(fromPoints, toPoints).filter(c => c.key === 'redness' || c.key === 'dryness')
  if (irritation.some(c => c.trend === 'worse' && c.toScore >= 6 && c.toScore - c.fromScore >= 3)) return 'lot'
  if (irritation.some(c => c.trend === 'worse')) return 'little'
  return 'good'
}
