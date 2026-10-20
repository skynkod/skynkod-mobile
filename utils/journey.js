import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'
import { programmeFinished } from './rekod'
import { logError } from './errorLogger'
import {
  BADGES, badgeOf, buildStats, reachedBadges, nextSteps, weekChallenges, newXpEvents, totalXp,
  levelFor, streakFrom, weekStart, dayKey,
} from './journey-core'

// The service behind My Skin Journey: reads what she really did (Supabase),
// plus the pages she read (kept on the phone), then awards XP, badges and
// challenges once each. Nothing is ever taken back.
//
// Stored on the phone (key journey_<userId>):
//   events   { key: { xp, at } }       every XP ever given, one per unique key
//   badges   { id: { at, revealed } }  earned badges; revealed = opened in the Koda box
//   ingredients / productPages / opened  { id: firstTimestamp }
//   box      { lastWeek }              week of the last Koda box opened

const key = userId => `journey_${userId}`
const fresh = () => ({ events: {}, badges: {}, ingredients: {}, productPages: {}, opened: {}, box: null })

export const loadJourney = async (userId) => {
  try { return { ...fresh(), ...JSON.parse((await AsyncStorage.getItem(key(userId))) || '{}') } } catch { return fresh() }
}
const save = (userId, state) => AsyncStorage.setItem(key(userId), JSON.stringify(state)).catch(() => {})

// One update at a time, so two quick syncs can't award the same thing twice.
let queue = Promise.resolve()
const serial = fn => { const run = queue.then(fn, fn); queue = run.catch(() => {}); return run }

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

// ---------- Reading her real activity ----------

const count = async (query) => { const { count: n, error } = await query; if (error) throw error; return n || 0 }

const gather = async (userId, state) => {
  const [profile, routines, products, ticks, journal, dekodScans, kodaQuestions, rekod] = await Promise.all([
    supabase.from('users').select('skin_type, skin_concerns, skin_goals').eq('id', userId).maybeSingle(),
    supabase.from('routines').select('steps').eq('user_id', userId),
    supabase.from('user_products').select('id, product_id, created_at, opened_at, status').eq('user_id', userId).eq('status', 'owned'),
    supabase.from('routine_completions').select('date, routine_type').eq('user_id', userId),
    supabase.from('journal_entries').select('date, mood').eq('user_id', userId),
    count(supabase.from('dekod_results').select('id', { count: 'exact', head: true }).eq('user_id', userId)).catch(() => 0),
    count(supabase.from('chat_history').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('role', 'user')).catch(() => 0),
    supabase.from('rekod_plans').select('plan').eq('user_id', userId).maybeSingle(),
  ])
  for (const r of [profile, routines, products, ticks, journal]) if (r.error) throw r.error
  const p = profile.data || {}
  const plan = rekod.data?.plan || null
  return {
    profileComplete: !!p.skin_type && ((p.skin_concerns || []).length > 0 || (p.skin_goals || []).length > 0),
    routineSaved: (routines.data || []).some(r => (r.steps || []).length > 0),
    products: products.data || [],
    openedCount: (products.data || []).filter(r => r.opened_at).length,
    ticks: ticks.data || [],
    journal: journal.data || [],
    dekodScans,
    kodaQuestions,
    rekodStarted: !!plan,
    rekodFinished: !!plan && (!!plan.maintenance || programmeFinished(plan)),
    ingredients: state.ingredients,
    productPages: state.productPages,
    opened: state.opened,
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
  for (const id of newBadges) state.badges[id] = { at: Date.now(), revealed: false }

  const challenges = weekChallenges(stats, week, state.events)
  const fresh = newXpEvents({ raw, stats, badges: reached, challenges, week }, state.events)
  for (const e of fresh) state.events[e.key] = { xp: e.xp, at: e.at }
  await save(userId, state)

  const xp = totalXp(state.events)
  const level = levelFor(xp)
  if (newBadges.length || level.level > before.level) {
    announce({ badges: newBadges.map(badgeOf).filter(Boolean), levelUp: level.level > before.level ? level : null })
  }
  return picture(state, stats, challenges)
})

const picture = (state, stats, challenges) => {
  const xp = totalXp(state.events)
  const earnedCount = Object.keys(state.badges).length
  return {
    xp,
    level: levelFor(xp),
    streak: streakFrom(stats.routineDayList, dayKey()),
    badges: BADGES.map(b => ({ ...b, earned: state.badges[b.id] || null })),
    earnedCount,
    nextSteps: nextSteps(stats, state.badges),
    challenges,
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

// Ready when a new week started since the last one was opened. Inside: the
// badges earned and not revealed yet, or a cup of tea.
const boxOf = (state) => {
  const ready = !!state.box && weekStart() > state.box.lastWeek
  const inside = Object.entries(state.badges).filter(([, b]) => !b.revealed).map(([id]) => badgeOf(id)).filter(Boolean)
  return { ready, inside }
}

export const openBox = (userId) => serial(async () => {
  const state = await loadJourney(userId)
  const inside = Object.entries(state.badges).filter(([, b]) => !b.revealed).map(([id]) => ({ ...badgeOf(id), earned: state.badges[id] })).filter(b => b.id)
  for (const b of inside) state.badges[b.id] = { ...state.badges[b.id], revealed: true }
  state.box = { lastWeek: weekStart() }
  await save(userId, state)
  return inside
})

// Tester only: make this week's box ready now.
export const makeBoxReadyForTest = (userId) => serial(async () => {
  const state = await loadJourney(userId)
  state.box = { lastWeek: '0000-00-00' }
  await save(userId, state)
})
