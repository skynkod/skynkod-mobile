// Run with: npm run test:journey
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  XP, LEVELS, VISIBLE_BADGES, canEarn, ACTIVE_DAYS, activeDaysIn, boxContents, levelFor, streakFrom, buildStats, reachedBadges, weekChallenges, newXpEvents, totalXp, weekStart, dayKey, nextSteps,
} from '../utils/journey-core.js'

const empty = (over = {}) => ({
  profileComplete: false, routineSaved: false, products: [], openedCount: 0, ticks: [], journal: [],
  dekodScans: 0, kodaQuestions: 0, rekodStarted: false, rekodFinished: false, ingredients: {}, productPages: {}, opened: {}, articles: {}, finished: {}, stars: [], shares: 0, ...over,
})
const run = (raw, events = {}, badgesEarned = {}, now = new Date(2026, 9, 21, 12)) => {
  const stats = buildStats(raw, now)
  const week = weekStart(now)
  const badges = reachedBadges(stats, badgesEarned)
  const challenges = weekChallenges(stats, week, events)
  return { stats, badges, challenges, fresh: newXpEvents({ raw, stats, badges, challenges, week }, events, now.getTime()) }
}
const apply = (events, fresh) => { const out = { ...events }; for (const e of fresh) out[e.key] = { xp: e.xp, at: e.at }; return out }

test('levels: thresholds and progress', () => {
  assert.equal(levelFor(0).name, 'Curious')
  assert.equal(levelFor(99).level, 1)
  assert.equal(levelFor(100).name, 'Explorer')
  assert.equal(levelFor(299).toNext, 1)
  assert.equal(levelFor(LEVELS.at(-1).xp + 500).level, LEVELS.length)
  assert.equal(levelFor(LEVELS.at(-1).xp + 500).progress, 1)
})

test('streak: consecutive local days, same day counted once, kept until tomorrow', () => {
  const s = streakFrom(['2026-10-18', '2026-10-19', '2026-10-19', '2026-10-20'], '2026-10-21')
  assert.equal(s.current, 3)
  assert.equal(s.active, true)
  assert.equal(s.doneToday, false)
  assert.equal(streakFrom(['2026-10-18'], '2026-10-21').active, false)
  assert.equal(streakFrom(['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-10'], '2026-10-10').best, 3)
})

test('badges: real thresholds, set-aside / coming soon / secret never earned, kept forever', () => {
  const ticks = Array.from({ length: 7 }, (_, i) => ({ date: dayKey(new Date(2026, 9, 12 + i)), routine_type: 'evening' }))
  const { badges } = run(empty({ profileComplete: true, routineSaved: true, ticks, journal: [{ date: '2026-10-12T10:00:00Z', mood: 'good' }], kodaQuestions: 1, shares: 1 }))
  for (const id of ['first-steps', 'routine-rookie', 'consistency-club', 'night-ritual', 'first-entry', 'first-question', 'helpful-friend']) assert.ok(badges.includes(id), id)
  for (const id of ['one-month-strong', 'skinfluencer', 'skin-observer', 'secret-1', 'morning-glow']) assert.ok(!badges.includes(id), id)
  const kept = reachedBadges(buildStats(empty()), { 'product-curator': { at: 1 } })
  assert.ok(kept.includes('product-curator'))
})

test('badges that count badges: enthusiast at 5, insider needs every regular badge', () => {
  const regular = VISIBLE_BADGES.filter(b => canEarn(b) && b.metric !== 'otherBadges' && !['stars', 'seasonal', 'secret'].includes(b.category)).map(b => b.id)
  const five = Object.fromEntries(regular.slice(0, 5).map(id => [id, { at: 1 }]))
  assert.ok(reachedBadges(buildStats(empty()), five).includes('skincare-enthusiast'))
  assert.ok(!reachedBadges(buildStats(empty()), five).includes('skynkod-insider'))
  // Stars and seasons don't count.
  const withStars = { ...Object.fromEntries(regular.slice(0, 4).map(id => [id, { at: 1 }])), 'star-welcome': { at: 1 }, 'spring-glow': { at: 1 } }
  assert.ok(!reachedBadges(buildStats(empty()), withStars).includes('skincare-enthusiast'))
  const all = Object.fromEntries(regular.map(id => [id, { at: 1 }]))
  assert.ok(reachedBadges(buildStats(empty()), all).includes('skynkod-insider'))
})

test('stars and seasons: milestones from weekly stars, 4 active weeks in one season', () => {
  const stars = ['2026-03-02', '2026-03-09', '2026-04-06', '2026-05-04', '2026-06-01'].map(week => ({ week }))
  const got = reachedBadges(buildStats(empty({ stars })))
  assert.ok(got.includes('star-welcome'))
  assert.ok(got.includes('spring-glow'))
  assert.ok(!got.includes('summer-care'))
  // December belongs to the next winter: Dec 2026 + Jan/Feb 2027 together.
  const winter = ['2026-12-07', '2026-12-14', '2027-01-04', '2027-02-01'].map(week => ({ week }))
  assert.ok(reachedBadges(buildStats(empty({ stars: winter }))).includes('winter-rituals'))
})

test('comebacks, brave skin, bounce back and calm week from the journal and routines', () => {
  const raw = empty({
    ticks: [{ date: '2026-08-01', routine_type: 'morning' }, { date: '2026-09-10', routine_type: 'morning' }, { date: '2026-09-14', routine_type: 'evening' }],
    journal: [
      { date: new Date(2026, 8, 14, 9).toISOString(), mood: 'bad', skin_conditions: ['Redness'] },
      { date: new Date(2026, 8, 16, 9).toISOString(), mood: 'good', skin_conditions: [] },
      { date: new Date(2026, 8, 22, 9).toISOString(), mood: 'good', skin_conditions: [] },
      { date: new Date(2026, 8, 23, 9).toISOString(), mood: 'great', skin_conditions: [] },
      { date: new Date(2026, 8, 24, 9).toISOString(), mood: 'good', skin_conditions: [] },
    ],
  })
  const got = reachedBadges(buildStats(raw, new Date(2026, 8, 25)))
  for (const id of ['comeback-queen', 'unstoppable', 'brave-skin', 'bounce-back', 'calm-week']) assert.ok(got.includes(id), id)
})

test('xp: no double award on repeated syncs', () => {
  const raw = empty({ profileComplete: true, ticks: [{ date: '2026-10-20', routine_type: 'morning' }, { date: '2026-10-20', routine_type: 'evening' }] })
  const first = run(raw)
  const events = apply({}, first.fresh)
  assert.equal(events['day:2026-10-20'].xp, XP.routineDay)
  assert.equal(events.profile.xp, XP.profile)
  const second = run(raw, events, Object.fromEntries(first.badges.map(id => [id, { at: 1 }])))
  assert.equal(second.fresh.length, 0)
})

test('xp: products paid once each, daily cap, re-adding pays nothing', () => {
  const day = '2026-10-20T09:00:00Z'
  const products = Array.from({ length: 5 }, (_, i) => ({ product_id: `p${i}`, created_at: day }))
  const events = apply({}, run(empty({ products })).fresh)
  const paid = Object.entries(events).filter(([k, e]) => k.startsWith('product:') && e.xp > 0)
  assert.equal(paid.length, XP.productDailyCap)
  // p0 removed then added again (new row, same catalogue product): no XP.
  const again = run(empty({ products: [{ product_id: 'p0', created_at: '2026-10-21T09:00:00Z' }] }), events)
  assert.ok(!again.fresh.some(e => e.key === 'product:p0'))
})

test('challenges: weekly progress, states and stable completion', () => {
  const now = new Date(2026, 9, 21, 12) // Wednesday
  const ticks = ['2026-10-19', '2026-10-20', '2026-10-21'].map(date => ({ date, routine_type: 'morning' }))
  const { challenges } = run(empty({ ticks, profileComplete: true }), {}, {}, now)
  const routine = challenges.find(c => c.id === 'routine-5')
  assert.equal(routine.value, 3)
  assert.equal(routine.state, 'started')
  assert.equal(routine.from, '2026-10-19')
  assert.equal(routine.to, '2026-10-25')
  assert.ok(!challenges.some(c => c.id === 'profile'), 'profile challenge hidden once done')
  // Done once this week: stays done even if data changes.
  const events = { 'challenge:2026-10-19:products-3': { xp: XP.challenge, at: 1 } }
  const after = run(empty({ profileComplete: true }), events, {}, now).challenges.find(c => c.id === 'products-3')
  assert.equal(after.done, true)
})

test('total xp adds every event', () => {
  assert.equal(totalXp({ a: { xp: 5 }, b: { xp: 20 } }), 25)
})

test('next steps show progress towards locked badges', () => {
  const stats = buildStats(empty({ ingredients: Object.fromEntries(Array.from({ length: 7 }, (_, i) => [`i${i}`, 1])) }))
  const steps = nextSteps(stats, {}, 3)
  const scholar = steps.find(s => s.badge.id === 'skin-scholar')
  assert.ok(scholar)
  assert.equal(scholar.value, 7)
  assert.equal(scholar.target, 10)
})

test('koda box: a star for an active week, tea and Welcome Back once otherwise', () => {
  const raw = empty({ ticks: [{ date: '2026-10-13', routine_type: 'morning' }, { date: '2026-10-13', routine_type: 'evening' }], journal: [{ date: new Date(2026, 9, 15, 10).toISOString(), mood: 'good' }] })
  assert.equal(activeDaysIn(raw, '2026-10-12'), 2)
  assert.equal(activeDaysIn(raw, '2026-10-19'), 0)
  assert.deepEqual(boxContents({ activeDays: ACTIVE_DAYS, stars: 2, comebackEarned: false }), { kind: 'star', star: 3 })
  assert.deepEqual(boxContents({ activeDays: 1, stars: 2, comebackEarned: false }), { kind: 'tea', comeback: true })
  assert.deepEqual(boxContents({ activeDays: 0, stars: 2, comebackEarned: true }), { kind: 'tea', comeback: false })
  // Comeback Queen also comes from the box after a quiet week.
  assert.ok(reachedBadges(buildStats(empty({ comeback: true }))).includes('comeback-queen'))
})
