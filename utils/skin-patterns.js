// What the user's skin is telling them: links that keep coming back between
// daily life (sleep, stress, period, sun, a new product, the routine) and how
// the skin reacts, read from the morning check-ins. Observations only, no
// advice (advice is Koda's job).

export const CHECK_INS_NEEDED = 14
const WINDOW_DAYS = 2 // a reaction counts on the same day or up to 2 days after
const MIN_TIMES = 3 // seen at least this many times
const MIN_RATE = 0.6 // ...in at least 60% of the cases
const MIN_LIFT = 0.25 // ...and clearly more than on ordinary days

const dayKey = (date) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const addDays = (key, n) => {
  const [y, m, d] = key.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d + n))
}

// How the skin reacts.
const REACTIONS = [
  { id: 'breakout', label: 'Breakouts', verb: 'show up', test: day => day.tags.includes('New pimple') },
  { id: 'redness', label: 'Redness or sensitivity', verb: 'shows up', test: day => day.tags.includes('Redness') || day.tags.includes('Itchiness / Sensitivity') },
  { id: 'dryness', label: 'Dryness', verb: 'shows up', test: day => day.tags.includes('Dryness') || day.tags.includes('Peeling / Flaking') },
  { id: 'rough', label: 'Rough skin days', verb: 'come', test: day => day.mood === 'bad' || day.mood === 'terrible' },
]

const shortNight = day => (day.sleepHours != null && day.sleepHours < 6) || day.sleepQuality === 'bad'
const goodNight = day => day.sleepHours != null && day.sleepHours >= 7 && day.sleepQuality !== 'bad'

// What happens in daily life.
const FACTORS = [
  // Her morning answer (under 6 hours, or slept badly), the tag, or Apple Health.
  { id: 'sleep', icon: 'bed-outline', after: 'a poor night’s sleep', test: day => day.tags.includes('Poor sleep') || shortNight(day) },
  { id: 'stress', icon: 'pulse-outline', after: 'stressful days', test: day => day.tags.includes('Stress') },
  { id: 'period', icon: 'calendar-outline', after: 'your period', test: day => day.tags.includes('Hormonal / Period') },
  { id: 'sun', icon: 'sunny-outline', after: 'time in the sun', test: day => day.tags.includes('Sun exposure') },
  { id: 'product', icon: 'flask-outline', after: 'starting a new product', test: day => day.tags.includes('Used new product') || day.openedProduct },
  { id: 'skipped', icon: 'water-outline', after: 'skipping your routine', test: day => day.routineKnown && !day.routineDone },
  // Only days she logged her water: under half the goal counts as drinking little.
  { id: 'water', icon: 'water', after: 'days you drink little water', test: day => day.water !== undefined && day.water < 4 },
]

// entries: journal rows { date, mood, skin_conditions }
// openedDates: dates a product was first opened
// routineDates: dates with at least one routine step done
// hasRoutine: whether the user has a routine at all
// water: { 'YYYY-MM-DD': glasses } from the glass on Home
export const findPatterns = ({ entries = [], openedDates = [], routineDates = [], hasRoutine = false, water = {}, today = new Date() }) => {
  const days = {}
  for (const e of entries) {
    if (!e?.date || !e.mood) continue
    days[dayKey(e.date)] = { mood: e.mood, tags: e.skin_conditions || [], sleepHours: e.sleep_hours == null ? null : Number(e.sleep_hours), sleepQuality: e.sleep_quality || null }
  }
  const checkIns = Object.keys(days).length
  if (checkIns < CHECK_INS_NEEDED) return { checkIns, needed: CHECK_INS_NEEDED, ready: false, patterns: [] }

  const opened = new Set(openedDates.filter(Boolean).map(dayKey))
  const routine = new Set(routineDates.filter(Boolean).map(dayKey))
  const firstRoutineDay = [...routine].sort()[0]
  for (const [key, day] of Object.entries(days)) {
    day.openedProduct = opened.has(key)
    // Only judge "skipped" from the day the user started logging routines.
    day.routineKnown = hasRoutine && !!firstRoutineDay && key >= firstRoutineDay && key < dayKey(today)
    day.routineDone = routine.has(key)
    if (water[key] !== undefined) day.water = water[key]
  }

  const keys = Object.keys(days).sort()
  // Did this reaction show up on `key` or the next WINDOW_DAYS days we have a check-in for?
  const reactsWithin = (key, reaction) => {
    let seen = false
    let known = false
    for (let i = 0; i <= WINDOW_DAYS; i++) {
      const day = days[addDays(key, i)]
      if (!day) continue
      known = true
      if (reaction.test(day)) seen = true
    }
    return known ? seen : null
  }

  const found = []
  for (const reaction of REACTIONS) {
    // How often the reaction shows up in any window: the ordinary rate.
    const all = keys.map(k => reactsWithin(k, reaction)).filter(v => v !== null)
    const baseline = all.length ? all.filter(Boolean).length / all.length : 0
    for (const factor of FACTORS) {
      const events = keys.filter(k => factor.test(days[k]))
      const results = events.map(k => reactsWithin(k, reaction)).filter(v => v !== null)
      const times = results.filter(Boolean).length
      const rate = results.length ? times / results.length : 0
      if (times >= MIN_TIMES && rate >= MIN_RATE && rate - baseline >= MIN_LIFT) {
        found.push({
          id: `${factor.id}-${reaction.id}`,
          factor: factor.id,
          reaction: reaction.id,
          after: factor.after,
          // The last day this happened: the skin forecast warns when it's recent.
          lastSeen: events[events.length - 1],
          icon: factor.icon,
          text: `${reaction.label} often ${reaction.verb} within ${WINDOW_DAYS} days of ${factor.after}.`,
          times,
          total: results.length,
          strength: (rate - baseline) * times,
        })
      }
    }
  }

  // The good news: does the skin feel better on routine days?
  const known = keys.filter(k => days[k].routineKnown)
  const good = list => list.filter(k => ['great', 'good'].includes(days[k].mood)).length
  const done = known.filter(k => days[k].routineDone)
  const skipped = known.filter(k => !days[k].routineDone)
  if (done.length >= 4 && skipped.length >= 4) {
    const doneRate = good(done) / done.length
    const skippedRate = good(skipped) / skipped.length
    if (doneRate - skippedRate >= MIN_LIFT) {
      found.push({
        id: 'routine-good',
        factor: 'routine',
        icon: 'sparkles-outline',
        text: 'Your skin feels better on the days you do your routine.',
        times: good(done),
        total: done.length,
        positive: true,
        strength: (doneRate - skippedRate) * good(done),
      })
    }
  }

  // Sleep, the good side: does her skin feel better after a good night?
  const slept = keys.filter(k => goodNight(days[k]))
  const short = keys.filter(k => shortNight(days[k]))
  if (slept.length >= 4 && short.length >= 4) {
    const sleptRate = good(slept) / slept.length
    const shortRate = good(short) / short.length
    if (sleptRate - shortRate >= MIN_LIFT) {
      found.push({
        id: 'sleep-good',
        factor: 'sleep',
        icon: 'bed-outline',
        text: 'Your skin feels better after nights of 7 hours or more.',
        times: good(slept),
        total: slept.length,
        positive: true,
        strength: (sleptRate - shortRate) * good(slept),
      })
    }
  }

  // The 3 strongest, at most one per daily-life factor.
  const seen = new Set()
  const patterns = found
    .sort((a, b) => b.strength - a.strength)
    .filter(p => (seen.has(p.factor) ? false : seen.add(p.factor)))
    .slice(0, 3)
  return { checkIns, needed: CHECK_INS_NEEDED, ready: true, patterns }
}
