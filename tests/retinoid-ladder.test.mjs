import assert from 'node:assert/strict'
import { test } from 'node:test'
import { startRung, retinoidRung, stepUpReady, applyStepUp, stepUpLater, nightCounts } from '../utils/rekod-schedule.js'

// The retinoid ladder (Lita, 2026-11-10): 8 good weeks at her top pace, then she chooses.
const at = week => new Date(Date.now() - (week - 1) * 7 * 864e5 - 3600e3).toISOString()
const good = (from, to) => Array.from({ length: to - from + 1 }, (_, i) => ({ week: from + i, answer: 'good' }))
const base = { goal: 'antiaging', goals: ['antiaging'], experience: 'none', level: 2, levelSince: 4 }

test('where she starts', () => {
  assert.equal(startRung({ experience: 'none' }), 1)
  assert.equal(startRung({ experience: 'none', sensitive: true }), 0)
  assert.equal(startRung({ experience: 'used' }), 2)
})

test('the card waits for 8 good weeks at the top pace', () => {
  assert.equal(stepUpReady({ ...base, startedAt: at(11), checkins: good(5, 11) }), false)
  assert.equal(stepUpReady({ ...base, startedAt: at(12), checkins: good(5, 12) }), true)
  assert.equal(stepUpReady({ ...base, startedAt: at(12), checkins: [...good(5, 11), { week: 12, answer: 'little' }] }), false)
  assert.equal(stepUpReady({ ...base, level: 1, startedAt: at(12), checkins: good(5, 12) }), false)
  assert.equal(stepUpReady({ ...base, pregnant: true, startedAt: at(12), checkins: good(5, 12) }), false)
})

test('yes: the next product and back to 2 nights; not now: 4 weeks later', () => {
  const plan = { ...base, startedAt: at(12), checkins: good(5, 12) }
  const up = applyStepUp(plan)
  assert.equal(retinoidRung(up), 2)
  assert.equal(up.level, 1)
  assert.equal(nightCounts(up).ret, 2)
  assert.equal(stepUpReady(up), false)
  assert.equal(stepUpReady(stepUpLater(plan)), false)
  // The dermatologist rung changes no product and ends the ladder.
  const derm = applyStepUp({ ...plan, retinoidRung: 2 })
  assert.equal(derm.retinoidRung, 3)
  assert.equal(derm.level, 2)
  assert.equal(stepUpReady({ ...derm, levelSince: 1 }), false)
})
