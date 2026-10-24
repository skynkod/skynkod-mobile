import test from 'node:test'
import assert from 'node:assert/strict'
import { baselineOf, checkInStatus, progressChanges, whatChanged } from '../utils/skin-tracking-core.js'

const DAY = 86400000
const NOW = new Date('2026-10-24T12:00:00Z')
const ago = n => new Date(NOW.getTime() - n * DAY).toISOString()
// One journal entry a day from `from` days ago to `to` days ago, with tags when pick(day) is true.
const days = (from, to, tags, pick = () => true) => Array.from({ length: from - to + 1 }, (_, i) => from - i)
  .map(n => ({ date: ago(n), skin_conditions: pick(n) ? tags : [] }))

test('baseline is the first day she logged anything', () => {
  const b = baselineOf({ entries: [{ date: ago(10) }], scans: [{ created_at: ago(20) }], checkins: [] })
  assert.equal(b.toISOString(), ago(20))
  assert.equal(baselineOf({}), null)
})

test('check-in is due 14 days after the start, then 14 days after the last one', () => {
  assert.equal(checkInStatus({ baseline: new Date(ago(10)), now: NOW }).due, false)
  const st = checkInStatus({ baseline: new Date(ago(15)), now: NOW })
  assert.equal(st.due, true)
  assert.equal(st.week, 3)
  assert.equal(checkInStatus({ baseline: new Date(ago(30)), checkins: [{ created_at: ago(3) }], now: NOW }).due, false)
  assert.equal(checkInStatus({ baseline: null }).started, false)
})

test('progress: breakouts every other day before, one day in four now = 50% fewer', () => {
  const entries = [...days(55, 28, ['New pimple'], n => n % 2 === 0), ...days(27, 0, ['New pimple'], n => n % 4 === 0)]
  const c = progressChanges({ entries, now: NOW })
  const b = c.find(x => x.key === 'breakouts')
  assert.ok(b.change <= -40 && b.change >= -60, `got ${b.change}`)
})

test('progress needs at least 5 journal days on each side', () => {
  assert.deepEqual(progressChanges({ entries: days(3, 0, ['Redness']), now: NOW }), [])
})

test('what changed: one product, skin better after', () => {
  const entries = [...days(80, 50, ['New pimple']), ...days(49, 0, ['New pimple'], n => n % 5 === 0)]
  const r = whatChanged({ entries, started: [{ name: 'Azelaic serum', date: ago(50) }], now: NOW })
  assert.equal(r.helped.length, 1)
  assert.equal(r.helped[0].name, 'Azelaic serum')
})

test('what changed: redness after a new toner', () => {
  const entries = [...days(80, 50, []), ...days(49, 0, ['Redness'], n => n % 2 === 0)]
  const r = whatChanged({ entries, started: [{ name: 'Exfoliating toner', date: ago(50) }], now: NOW })
  assert.equal(r.worse[0].name, 'Exfoliating toner')
})

test('what changed: two products the same week cannot be told apart', () => {
  const entries = [...days(80, 50, ['New pimple']), ...days(49, 0, [])]
  const r = whatChanged({ entries, started: [{ name: 'A', date: ago(50) }, { name: 'B', date: ago(46) }], now: NOW })
  assert.equal(r.helped.length, 0)
  assert.deepEqual(r.together[0].names, ['A', 'B'])
})

test('what changed waits 4 weeks after a new product', () => {
  const entries = [...days(40, 10, ['New pimple']), ...days(9, 0, [])]
  assert.equal(whatChanged({ entries, started: [{ name: 'A', date: ago(10) }], now: NOW }).helped.length, 0)
})

test('Home chips count too: "Breaking out" days without any Journal tag', () => {
  const entries = [...days(55, 28, []).map((e, i) => ({ ...e, skin_state: i % 2 ? ['breakout'] : [] })), ...days(27, 0, []).map((e, i) => ({ ...e, skin_state: i % 4 ? [] : ['breakout'] }))]
  const b = progressChanges({ entries, now: NOW }).find(x => x.key === 'breakouts')
  assert.ok(b && b.change < 0, `got ${b?.change}`)
})

test('dehydrated and dry are tracked apart', () => {
  const entries = [...days(55, 28, []).map(e => ({ ...e, skin_state: ['dehydrated'] })), ...days(27, 0, []).map((e, i) => ({ ...e, skin_state: i % 4 ? [] : ['dehydrated'] }))]
  const c = progressChanges({ entries, now: NOW })
  assert.ok(c.find(x => x.key === 'dehydration'))
  assert.equal(c.find(x => x.key === 'dryness'), undefined)
})

import { recentNewActive } from '../utils/skin-tracking-core.js'
test('one new active at a time: another started 5 days ago means wait 9 more days', () => {
  const r = recentNewActive({ candidate: { id: 'b' }, started: [{ id: 'a', name: 'Retinol serum', date: ago(5) }], now: NOW })
  assert.equal(r.name, 'Retinol serum')
  assert.equal(Math.round((r.until - NOW) / DAY), 9)
  assert.equal(recentNewActive({ candidate: { id: 'b' }, started: [{ id: 'a', name: 'x', date: ago(20) }], now: NOW }), null)
  assert.equal(recentNewActive({ candidate: { id: 'a' }, started: [{ id: 'a', name: 'x', date: ago(2) }], now: NOW }), null)
})
