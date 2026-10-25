import { currentRoutine } from './current-routine'
import { getAcceptedContributions } from './contributions'
import { supabase } from './supabase'
import { programmeFinished, weekOf, planWeeks } from './rekod'
import { getSosHistory } from './emergency-state'
import { getPausedProducts } from './paused-products'
import { getDekodResults, compareScans, averagePoints } from './dekod'
import { questionsFor, fromRow } from './skin-quiz'
import { BASICS } from './encyclopedia/basics'
import { logError } from './errorLogger'
import { getVerdicts } from './expectation-verdicts'
import { loadState, saveState } from './cloud-state'
import {
  VISIBLE_BADGES, canEarn, badgeOf, buildStats, progressOf, reachedBadges, nextSteps, weekChallenges, newXpEvents, totalXp,
  levelFor, streakFrom, weekStart, dayKey, addDays, activeDaysIn, boxContents,
} from './journey-core'

// The service behind My Skin Journey: reads what she really did (Supabase),
// plus the pages she read (kept on the phone), then awards XP, badges and
// challenges once each. Nothing is ever taken back.
//
// Stored on the phone and in her account (user_state 'journey'):
//   events   { key: { xp, at } }       every XP ever given, one per unique key
//   badges   { id: { at } }            earned badges
//   ingredients / productPages / opened  { id: firstTimestamp }
//   shares   [timestamps] each time she shared Skynkod
//   articles / finished  { id: firstTimestamp }  articles read, products used up
//   buyChecks / stopAdvised  { productId: firstTimestamp }
//   box      { lastWeek }              week of the last Koda box opened
//   stars    [{ week, at }]            seniority stars, one per active week
//   comeback true once the Welcome Back badge was given

// Bump when the XP or badge rules change before launch: XP and badges are
// then recalculated from her real activity, quietly (no unlock screens).
const RULES_VERSION = 2
const fresh = () => ({ events: {}, badges: {}, ingredients: {}, productPages: {}, opened: {}, shares: [], articles: {}, finished: {}, buyChecks: {}, stopAdvised: {}, box: null, stars: [], comeback: false })

export const loadJourney = async (userId) => {
  try {
    // On the phone and in her account: a new phone gets her badges and XP back.
    const raw = await loadState(userId, 'journey', null)
    if (!raw) return { ...fresh(), rules: RULES_VERSION }
    const state = { ...fresh(), ...raw }
    // Older saves kept one share timestamp.
    if (state.shared && !state.shares.length) state.shares = [state.shared]
    delete state.shared
    if (state.rules !== RULES_VERSION) {
      // What she did (pages read, stars, shares…) is kept; XP and badges are rebuilt.
      state.events = {}
      state.badges = {}
      state.rules = RULES_VERSION
      state.quiet = true
    }
    return state
  } catch { return { ...fresh(), rules: RULES_VERSION } }
}
const save = (userId, state) => saveState(userId, 'journey', state)

// One update at a time, so two quick syncs can't award the same thing twice.
let queue = Promise.resolve()
const serial = fn => { const run = queue.then(fn, fn); queue = run.catch(() => {}); return run }

// What the profile shows, read from the phone only (instant): level, stars
// and earned badges, newest first.
export const quickJourney = async (userId) => {
  const state = await loadJourney(userId)
  const xp = totalXp(state.events)
  const earned = Object.entries(state.badges)
    .map(([id, b]) => ({ ...badgeOf(id), earned: b }))
    .filter(b => b.id && !b.hidden)
    .sort((a, b) => b.earned.at - a.earned.at)
  return { xp, level: levelFor(xp), stars: state.stars.length, earned, earnableCount: VISIBLE_BADGES.filter(canEarn).length }
}

// ---------- Unlock notices (the toast listens) ----------

const listeners = new Set()
export const onJourneyNews = fn => { listeners.add(fn); return () => listeners.delete(fn) }
const announce = news => listeners.forEach(fn => { try { fn(news) } catch {} })

// ---------- Tracking pages she read ----------

const remember = (field) => (userId, id) => {
  if (!userId || !id) return Promise.resolve()
  return serial(async () => {
    const state = await loadJourney(userId)
    if (state[field][id]) return
    state[field][id] = Date.now()
    await save(userId, state)
  }).then(() => syncSoon(userId))
}
export const trackIngredient = remember('ingredients')
export const trackProductPage = remember('productPages')
export const trackOpened = remember('opened')
export const trackArticle = remember('articles')
export const trackFinished = remember('finished')
// "Should I buy this?" seen on a product she doesn't own, and a product she
// removed when Skynkod suggested stopping it (Lita, 2026-10-24).
export const trackBuyCheck = remember('buyChecks')
export const trackStopAdvised = remember('stopAdvised')
// A Better / Same / Worse answer was saved: count it soon.
export const trackVerdict = userId => { if (userId) syncSoon(userId) }

// She shared Skynkod (the share sheet says it was sent, not just opened).
export const trackShared = (userId) => {
  if (!userId) return Promise.resolve()
  return serial(async () => {
    const state = await loadJourney(userId)
    state.shares.push(Date.now())
    await save(userId, state)
  }).then(() => syncSoon(userId, 300))
}

// ---------- Reading her real activity ----------

const count = async (query) => { const { count: n, error } = await query; if (error) throw error; return n || 0 }

const answered = v => (Array.isArray(v) ? v.length > 0 : v !== undefined && v !== null && v !== '')

const gather = async (userId, state) => {
  const [profile, routines, products, ticks, journal, dekod, kodaQuestions, rekod, sos, paused, contributions, checkins, verdicts] = await Promise.all([
    supabase.from('users').select('skin_type, skin_concerns, skin_goals, skin_profile, acne_types, skin_conditions, avoid_ingredients, pregnancy, consent_health_at, created_at').eq('id', userId).maybeSingle(),
    supabase.from('routines').select('type, steps').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('user_products').select('id, product_id, category, created_at, opened_at, status').eq('user_id', userId).eq('status', 'owned'),
    supabase.from('routine_completions').select('date, routine_type').eq('user_id', userId),
    supabase.from('journal_entries').select('date, mood, skin_conditions').eq('user_id', userId),
    getDekodResults(userId, 30).catch(() => []),
    count(supabase.from('chat_history').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('role', 'user')).catch(() => 0),
    supabase.from('rekod_plans').select('plan').eq('user_id', userId).maybeSingle(),
    getSosHistory(userId),
    getPausedProducts(userId),
    getAcceptedContributions(userId).catch(() => []),
    supabase.from('skin_checkins').select('id, created_at').eq('user_id', userId),
    getVerdicts(userId).catch(() => ({})),
  ])
  for (const r of [profile, routines, products, ticks, journal]) if (r.error) throw r.error
  const p = profile.data || {}
  const plan = rekod.data?.plan || null
  const rekodFinished = !!plan && (!!plan.maintenance || programmeFinished(plan))
  // Sun Guardian: a sunscreen among the morning routine's products.
  const morningIds = (currentRoutine(routines.data, 'morning')?.steps || []).map(s => s.product_id).filter(Boolean)
  let morningHasSpf = false
  if (morningIds.length) {
    const { data } = await supabase.from('products').select('category').in('id', morningIds)
    morningHasSpf = (data || []).some(x => x.category === 'sunscreen')
  }
  // Real Results can come from Dekod: the latest scan better than the first.
  // At least 3 scans, averaged, and a clear change (Dekod v2).
  const dekodBetter = dekod.length >= 3 && compareScans(averagePoints([...dekod].reverse(), 2), averagePoints(dekod, 3)).some(c => c.trend === 'better')
  const answers = fromRow(p)
  return {
    profileComplete: !!p.skin_type && ((p.skin_concerns || []).length > 0 || (p.skin_goals || []).length > 0),
    profileFull: !!p.skin_profile && questionsFor(answers, !!p.consent_health_at).every(q => answered(answers[q.id])),
    routineSaved: (routines.data || []).some(r => (r.steps || []).length > 0),
    morningHasSpf,
    products: products.data || [],
    openedCount: (products.data || []).filter(r => r.opened_at).length,
    ticks: ticks.data || [],
    journal: journal.data || [],
    dekodScans: dekod.length,
    dekodBetter,
    kodaQuestions,
    rekodStarted: !!plan,
    rekodHalf: !!plan && (rekodFinished || weekOf(plan) > planWeeks(plan) / 2),
    rekodFinished,
    sosPlanDone: !!sos.plan,
    sosReturnDone: !!sos.return,
    reactionSpotted: (paused || []).length > 0,
    accountCreated: p.created_at || null,
    comeback: !!state.comeback,
    stars: state.stars,
    shares: state.shares.length,
    contributions,
    ingredients: state.ingredients,
    productPages: state.productPages,
    opened: state.opened,
    articles: state.articles,
    finished: state.finished,
    basicsIds: BASICS.map(a => a.id),
    checkins: checkins.data || [],
    verdicts,
    buyChecks: state.buyChecks,
    stopAdvised: state.stopAdvised,
  }
}

// ---------- The sync ----------

// Reads everything, awards what's new, saves, and tells the toast.
// Returns the full picture for the My Skin Journey screen.
export const syncJourney = (userId) => serial(async () => {
  const state = await loadJourney(userId)
  const raw = await gather(userId, state)
  const stats = buildStats(raw)
  const week = weekStart()
  const before = levelFor(totalXp(state.events))

  // The first time: the first Koda box comes next Monday.
  if (!state.box) state.box = { lastWeek: week }

  const reached = reachedBadges(stats, state.badges)
  const newBadges = reached.filter(id => !state.badges[id])
  for (const id of newBadges) state.badges[id] = { at: Date.now() }

  const challenges = weekChallenges(stats, week, state.events)
  const fresh = newXpEvents({ raw, stats, badges: reached, challenges, week }, state.events)
  for (const e of fresh) state.events[e.key] = { xp: e.xp, at: e.at }
  await save(userId, state)

  const xp = totalXp(state.events)
  const level = levelFor(xp)
  // A recalculation awards quietly; only what's new afterwards is celebrated.
  const quiet = state.quiet
  if (quiet) { state.quiet = false; await save(userId, state) }
  if (!quiet && (newBadges.length || level.level > before.level)) {
    announce({ badges: newBadges.map(badgeOf).filter(Boolean), levelUp: level.level > before.level ? level : null })
  }
  return picture(state, stats, challenges)
})

const picture = (state, stats, challenges) => {
  const xp = totalXp(state.events)
  return {
    xp,
    level: levelFor(xp),
    streak: streakFrom(stats.routineDayList, dayKey()),
    badges: VISIBLE_BADGES.filter(b => !b.retired || state.badges[b.id]).map(b => ({ ...b, earned: state.badges[b.id] || null, value: progressOf(b, stats, state.badges) })),
    earnedCount: VISIBLE_BADGES.filter(b => state.badges[b.id]).length,
    earnableCount: VISIBLE_BADGES.filter(canEarn).length,
    stars: state.stars.length,
    nextSteps: nextSteps(stats, state.badges),
    challenges,
    stats,
    box: boxOf(state),
  }
}

// Sync a little later, merging calls made in a burst (after a tap, a save…).
const timers = {}
export const syncSoon = (userId, delay = 800) => {
  if (!userId) return
  clearTimeout(timers[userId])
  timers[userId] = setTimeout(() => {
    syncJourney(userId).catch(error => logError('Journey_sync', error, {}, 'warn'))
  }, delay)
}

// ---------- The Koda box (every Monday) ----------

// Ready when a new week started since the last one was opened.
const boxOf = (state) => ({ ready: !!state.box && weekStart() > state.box.lastWeek })

// Opens the box for the week that just ended: a seniority star if she was
// active, otherwise a cup of tea (and the Welcome Back badge, once).
export const openBox = (userId) => serial(async () => {
  const state = await loadJourney(userId)
  const raw = await gather(userId, state)
  const week = addDays(weekStart(), -7)
  const contents = boxContents({ activeDays: activeDaysIn(raw, week), stars: state.stars.length, comebackEarned: state.comeback })
  if (contents.kind === 'star') state.stars.push({ week, at: Date.now() })
  if (contents.comeback) state.comeback = true
  state.box = { lastWeek: weekStart() }
  await save(userId, state)
  return contents
})

// Tester only: make this week's box ready now.
export const makeBoxReadyForTest = (userId) => serial(async () => {
  const state = await loadJourney(userId)
  state.box = { lastWeek: '0000-00-00' }
  await save(userId, state)
})
