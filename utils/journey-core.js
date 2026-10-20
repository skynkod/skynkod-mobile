// My Skin Journey: badges, XP, levels, streaks and weekly challenges.
// Everything that can be tuned lives in the config at the top. The functions
// below are pure (no storage, no network) so they can be tested on their own.

// ---------- Config ----------

export const XP = {
  profile: 20,          // skin profile completed, once
  firstRoutine: 15,     // first routine saved, once
  product: 5,           // a product added to the collection, once per product
  productDailyCap: 3,   // products rewarded per day at most
  ingredient: 2,        // an ingredient page read for the first time
  routineDay: 5,        // a day with a ticked routine, once per day
  challenge: 20,        // a weekly challenge completed
  badge: { quartz: 10, pearl: 25, gold: 50, prism: 100 },
}

export const LEVELS = [
  { level: 1, name: 'Curious', xp: 0 },
  { level: 2, name: 'Explorer', xp: 100 },
  { level: 3, name: 'Enthusiast', xp: 300 },
  { level: 4, name: 'Skin Scholar', xp: 700 },
  { level: 5, name: 'Skynkod Insider', xp: 1500 },
]

// Tiers, from simple to legendary (the card design follows them).
export const TIERS = {
  quartz: { name: 'Rose quartz' },
  pearl: { name: 'Pearl' },
  gold: { name: 'Gold' },
  prism: { name: 'Prism' },
}

// Badges: `metric` reads the stats, `target` is the threshold. Each badge is
// earned once and kept forever.
export const BADGES = [
  { id: 'first-steps', name: 'First Steps', tier: 'quartz', icon: 'person-circle-outline', metric: 'profileComplete', target: 1, description: 'Your skin profile is complete.', condition: 'Complete your skin profile.', koda: 'Now I know your skin. Let’s take care of it together.' },
  { id: 'routine-rookie', name: 'Routine Rookie', tier: 'quartz', icon: 'water-outline', metric: 'routineSaved', target: 1, description: 'Your first routine is saved.', condition: 'Save your first routine.', koda: 'Every glow starts with a first routine.' },
  { id: 'dear-diary', name: 'Dear Diary', tier: 'quartz', icon: 'create-outline', metric: 'journalDays', target: 1, description: 'You told your journal how your skin feels.', condition: 'Fill in your journal once.', koda: 'Listening to your skin is the first skill.' },
  { id: 'first-look', name: 'First Look', tier: 'quartz', icon: 'scan-outline', metric: 'dekodScans', target: 1, description: 'Your first Dekod scan.', condition: 'Do your first Dekod scan.', koda: 'You dared to really look. That’s where it all begins.' },
  { id: 'curious', name: 'Curious', tier: 'quartz', icon: 'chatbubble-ellipses-outline', metric: 'kodaQuestions', target: 1, description: 'Your first question to Koda.', condition: 'Ask Koda a question.', koda: 'You ask the right questions. Your skin thanks you.' },
  { id: 'rekod-started', name: 'Here We Go', tier: 'quartz', icon: 'diamond-outline', metric: 'rekodStarted', target: 1, description: 'You started a Rekod programme.', condition: 'Start a Rekod programme.', koda: 'A goal, a plan, and you. Let’s go.' },
  { id: 'product-curator', name: 'Product Curator', tier: 'pearl', icon: 'flask-outline', metric: 'productsOwned', target: 5, description: '5 products in your collection.', condition: 'Add 5 products you own.', koda: 'A shelf that knows you. Nicely curated.' },
  { id: 'shelf-organized', name: 'Shelf Organized', tier: 'pearl', icon: 'calendar-outline', metric: 'openedCount', target: 5, description: 'Opening dates noted for 5 products.', condition: 'Add the opening date of 5 products.', koda: 'Nothing expires behind your back anymore.' },
  { id: 'skin-scholar', name: 'Skin Scholar', tier: 'pearl', icon: 'book-outline', metric: 'ingredientViews', target: 10, description: '10 ingredients discovered.', condition: 'Read 10 different ingredient pages.', koda: 'Ten ingredients you now understand. Labels speak to you.' },
  { id: 'product-detective', name: 'Product Detective', tier: 'pearl', icon: 'search-outline', metric: 'productViews', target: 10, description: '10 product pages studied.', condition: 'Open the details of 10 different products.', koda: 'You check before you trust. Smart.' },
  { id: 'consistency-club', name: 'Consistency Club', tier: 'pearl', icon: 'checkmark-done-outline', metric: 'routineDays', target: 7, description: 'Your routine followed on 7 days.', condition: 'Tick your routine on 7 different days.', koda: 'Seven days. This is how skin changes.' },
  { id: 'night-owl', name: 'Night Owl', tier: 'pearl', icon: 'moon-outline', metric: 'bestWeekEvenings', target: 7, description: 'Seven evening routines in one week.', condition: 'Do your evening routine every night of a week.', koda: 'Seven nights in a row. Your skin worked while you slept.' },
  { id: 'glow-up', name: 'Glow Up', tier: 'pearl', icon: 'sunny-outline', metric: 'glowUp', target: 1, description: 'Your skin felt better than the week before.', condition: 'Have a better skin week than the one before, in your journal.', koda: 'Better than last week. Keep doing what you’re doing.' },
  { id: 'skynkod-explorer', name: 'Skynkod Explorer', tier: 'pearl', icon: 'compass-outline', metric: 'sectionsUsed', target: 4, description: 'You used 4 parts of Skynkod.', condition: 'Use 4 different parts of the app: routines, journal, products, ingredients, Dekod, Rekod or Koda.', koda: 'You know your way around now.' },
  { id: 'ingredient-explorer', name: 'Ingredient Explorer', tier: 'gold', icon: 'library-outline', metric: 'ingredientViews', target: 25, description: '25 ingredients discovered.', condition: 'Read 25 different ingredient pages.', koda: 'Twenty-five ingredients. You read labels like a pro.' },
  { id: 'journal-keeper', name: 'Journal Keeper', tier: 'gold', icon: 'journal-outline', metric: 'journalDays', target: 10, description: '10 days in your skin journal.', condition: 'Fill in your journal on 10 different days.', koda: 'Ten days of listening. You know your skin better than ever.' },
  { id: 'perfect-week', name: 'Perfect Week', tier: 'gold', icon: 'sparkles-outline', metric: 'bestWeekFull', target: 7, description: 'Every morning and every evening of a week.', condition: 'Do both routines every day of a week (14 out of 14).', koda: 'Every morning, every evening. A week without a miss. I’m proud of you.' },
  { id: 'skincare-enthusiast', name: 'Skincare Enthusiast', tier: 'gold', icon: 'ribbon-outline', metric: 'otherBadges', target: 5, description: '5 badges earned.', condition: 'Earn 5 other badges.', koda: 'Five badges. This is becoming a real passion.' },
  { id: 'one-month-strong', name: 'One Month Strong', tier: 'prism', icon: 'trophy-outline', metric: 'routineDays', target: 30, description: 'Your routine followed on 30 days.', condition: 'Tick your routine on 30 different days.', koda: 'Thirty days. This isn’t a try anymore, it’s who you are.' },
  { id: 'rekod-complete', name: 'Rekod Complete', tier: 'prism', icon: 'diamond', metric: 'rekodFinished', target: 1, description: 'You finished a Rekod programme.', condition: 'Go all the way through a Rekod programme.', koda: 'Weeks of care, a skin that changed. You did it. Very few have this one.' },
]
export const badgeOf = id => BADGES.find(b => b.id === id) || null

// Weekly challenges (Monday to Sunday, local time).
export const CHALLENGES = [
  { id: 'routine-5', title: 'Five days of care', description: 'Tick your routine on 5 different days.', metric: 'weekRoutineDays', target: 5 },
  { id: 'ingredients-5', title: 'Label reader', description: 'Discover 5 new ingredients.', metric: 'weekIngredients', target: 5 },
  { id: 'products-3', title: 'Fill your shelf', description: 'Add 3 products you own.', metric: 'weekProducts', target: 3 },
  { id: 'opened-3', title: 'Date check', description: 'Note the opening date of 3 products.', metric: 'weekOpened', target: 3 },
  { id: 'profile', title: 'Know your skin', description: 'Complete your skin profile.', metric: 'profileComplete', target: 1, onlyIfMissing: true },
]

// ---------- Dates (local time) ----------

const DAY = 86400000
export const dayKey = (date = new Date()) => {
  const d = new Date(date)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const fromKey = key => { const [y, m, d] = key.split('-').map(Number); return new Date(y, m - 1, d) }
const addDays = (key, n) => { const d = fromKey(key); d.setDate(d.getDate() + n); return dayKey(d) }
export const weekStart = (date = new Date()) => {
  const d = new Date(date); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return dayKey(d)
}
export const weekEnd = start => addDays(start, 6)

// ---------- Levels ----------

export const levelFor = (xp) => {
  let i = 0
  while (i + 1 < LEVELS.length && xp >= LEVELS[i + 1].xp) i += 1
  const current = LEVELS[i]
  const next = LEVELS[i + 1] || null
  return { ...current, next, progress: next ? (xp - current.xp) / (next.xp - current.xp) : 1, toNext: next ? next.xp - xp : 0 }
}

// ---------- Streaks ----------

// days: list of 'YYYY-MM-DD' with a ticked routine. A streak stays active
// until the end of the day after the last one (she can still keep it today).
export const streakFrom = (days, today = dayKey()) => {
  const set = new Set(days)
  const sorted = [...set].sort()
  let best = 0, run = 0, prev = null
  for (const d of sorted) {
    run = prev && addDays(prev, 1) === d ? run + 1 : 1
    best = Math.max(best, run)
    prev = d
  }
  let current = 0
  let cursor = set.has(today) ? today : addDays(today, -1)
  while (set.has(cursor)) { current += 1; cursor = addDays(cursor, -1) }
  return { current, best, active: current > 0, doneToday: set.has(today) }
}

// ---------- Stats from raw data ----------

const MOOD = { great: 5, good: 4, okay: 3, bad: 2, terrible: 1 }

// raw: { profileComplete, routineSaved, products: [{product_id, created_at}],
// openedCount, ticks: [{date, routine_type}], journal: [{date, mood}],
// dekodScans, rekodStarted, rekodFinished, kodaQuestions,
// ingredients: {id: ts}, productPages: {id: ts}, opened: {rowId: ts} }
export const buildStats = (raw, now = new Date()) => {
  const routineDaySet = new Set(raw.ticks.map(t => t.date))
  // Per week: evenings done and days with both routines.
  const weeks = {}
  const byDay = {}
  for (const t of raw.ticks) {
    byDay[t.date] = byDay[t.date] || {}
    byDay[t.date][t.routine_type] = true
  }
  for (const [d, done] of Object.entries(byDay)) {
    const w = weekStart(fromKey(d))
    weeks[w] = weeks[w] || { evenings: 0, full: 0 }
    if (done.evening) weeks[w].evenings += 1
    if (done.morning && done.evening) weeks[w].full += 1
  }
  const journalDaySet = new Set(raw.journal.filter(e => e.mood).map(e => dayKey(new Date(e.date))))
  // Glow up: a week whose average mood beats the week before by half a point.
  const moodWeeks = {}
  for (const e of raw.journal) {
    if (!MOOD[e.mood]) continue
    const w = weekStart(new Date(e.date))
    moodWeeks[w] = moodWeeks[w] || []
    moodWeeks[w].push(MOOD[e.mood])
  }
  const avg = l => l.reduce((a, b) => a + b, 0) / l.length
  const glowUp = Object.keys(moodWeeks).some(w => moodWeeks[addDays(w, -7)] && avg(moodWeeks[w]) - avg(moodWeeks[addDays(w, -7)]) >= 0.5)

  const productIds = new Set(raw.products.map(p => p.product_id || p.id))
  const ingredientIds = Object.keys(raw.ingredients || {})
  const productPageIds = Object.keys(raw.productPages || {})

  const ws = weekStart(now)
  const we = addDays(ws, 7)
  const inWeek = ts => { const k = dayKey(new Date(ts)); return k >= ws && k < we }

  const stats = {
    profileComplete: raw.profileComplete ? 1 : 0,
    routineSaved: raw.routineSaved ? 1 : 0,
    productsOwned: productIds.size,
    openedCount: raw.openedCount || 0,
    ingredientViews: ingredientIds.length,
    productViews: productPageIds.length,
    routineDays: routineDaySet.size,
    journalDays: journalDaySet.size,
    dekodScans: raw.dekodScans || 0,
    kodaQuestions: raw.kodaQuestions || 0,
    rekodStarted: raw.rekodStarted ? 1 : 0,
    rekodFinished: raw.rekodFinished ? 1 : 0,
    bestWeekEvenings: Math.max(0, ...Object.values(weeks).map(w => w.evenings)),
    bestWeekFull: Math.max(0, ...Object.values(weeks).map(w => w.full)),
    glowUp: glowUp ? 1 : 0,
    weekRoutineDays: [...routineDaySet].filter(d => d >= ws && d < we).length,
    weekIngredients: Object.values(raw.ingredients || {}).filter(inWeek).length,
    weekProducts: raw.products.filter(p => inWeek(p.created_at)).length,
    weekOpened: Object.values(raw.opened || {}).filter(inWeek).length,
  }
  stats.sectionsUsed = [stats.routineDays, stats.journalDays, stats.productsOwned, stats.ingredientViews, stats.dekodScans, stats.rekodStarted, stats.kodaQuestions].filter(v => v > 0).length
  stats.routineDayList = [...routineDaySet]
  return stats
}

// ---------- Badges ----------

export const metricOf = (badge, stats, earnedCount = 0) => (badge.metric === 'otherBadges' ? earnedCount : stats[badge.metric] || 0)

// Which badges are reached now, given those already earned (kept forever).
export const reachedBadges = (stats, earned = {}) => {
  const out = new Set(Object.keys(earned))
  for (const b of BADGES) if (b.metric !== 'otherBadges' && metricOf(b, stats) >= b.target) out.add(b.id)
  const enthusiast = badgeOf('skincare-enthusiast')
  const others = [...out].filter(id => id !== enthusiast.id).length
  if (others >= enthusiast.target) out.add(enthusiast.id)
  return [...out]
}

// The closest badges still to earn, with their progress.
export const nextSteps = (stats, earned = {}, limit = 3) => {
  const count = Object.keys(earned).filter(id => id !== 'skincare-enthusiast').length
  return BADGES
    .filter(b => !earned[b.id])
    .map(b => ({ badge: b, value: Math.min(metricOf(b, stats, count), b.target), target: b.target }))
    .filter(s => s.target > 1 || s.value === 0)
    .sort((a, b) => b.value / b.target - a.value / a.target)
    .slice(0, limit)
}

// ---------- Challenges ----------

export const weekChallenges = (stats, week, events = {}) => CHALLENGES
  .filter(c => !c.onlyIfMissing || !stats[c.metric] || events[`challenge:${week}:${c.id}`])
  .map(c => {
    const value = Math.min(stats[c.metric] || 0, c.target)
    const done = !!events[`challenge:${week}:${c.id}`] || value >= c.target
    return { ...c, value, done, state: done ? 'done' : value > 0 ? 'started' : 'todo', xp: XP.challenge, from: week, to: weekEnd(week) }
  })

// ---------- XP ----------

// Every XP event has a unique key, so the same action can never pay twice.
// Returns the events that are new compared with `events`.
export const newXpEvents = ({ raw, stats, badges, challenges, week }, events = {}, now = Date.now()) => {
  const out = []
  const add = (key, xp, at = now) => { if (!events[key] && !out.some(e => e.key === key)) out.push({ key, xp, at }) }
  if (stats.profileComplete) add('profile', XP.profile)
  if (stats.routineSaved) add('first-routine', XP.firstRoutine)
  // Products: once per catalogue product, with a daily cap (adding and
  // removing the same product never pays again).
  const perDay = {}
  for (const e of Object.entries(events)) if (e[0].startsWith('product:') && e[1].xp > 0) { const d = dayKey(new Date(e[1].at)); perDay[d] = (perDay[d] || 0) + 1 }
  for (const p of [...raw.products].sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)))) {
    const key = `product:${p.product_id || p.id}`
    if (events[key] || out.some(e => e.key === key)) continue
    const d = dayKey(new Date(p.created_at || now))
    const paid = (perDay[d] || 0) < XP.productDailyCap
    if (paid) perDay[d] = (perDay[d] || 0) + 1
    add(key, paid ? XP.product : 0, new Date(p.created_at || now).getTime())
  }
  for (const [id, ts] of Object.entries(raw.ingredients || {})) add(`ingredient:${id}`, XP.ingredient, ts)
  for (const d of stats.routineDayList) add(`day:${d}`, XP.routineDay, fromKey(d).getTime())
  for (const c of challenges) if (c.done) add(`challenge:${week}:${c.id}`, XP.challenge)
  for (const id of badges) add(`badge:${id}`, XP.badge[badgeOf(id)?.tier] || 0)
  return out
}

export const totalXp = events => Object.values(events).reduce((n, e) => n + (e.xp || 0), 0)
