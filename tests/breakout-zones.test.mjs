// Where she gets breakouts (Lita, 2026-11-06): the SOS quiz, the perioral suspicion and the daily tip.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { prefilledAnswers } from '../utils/sos-plan.js'
import { tipOfTheMoment } from '../utils/daily-tips.js'
import { toColumns, engineProfile } from '../utils/skin-quiz.js'

test('the SOS quiz comes with her zones ticked, only the ones it offers', () => {
  assert.deepEqual(prefilledAnswers({ acneWhere: ['jaw', 'mouth', 'cheeks', 'nose'] }), { acneWhere: ['jaw', 'cheeks'] })
  assert.deepEqual(prefilledAnswers({ acneWhere: [] }), {})
  assert.deepEqual(prefilledAnswers(null), {})
})

test('the sign-up zones reach the engine profile', () => {
  const cols = toColumns({ issues: ['inflammatory-acne'], acneWhere: ['jaw'] }, true)
  assert.deepEqual(engineProfile({ ...cols, consent_health_at: '2026-11-06' }).acneWhere, ['jaw'])
})

test('a suspected perioral dermatitis becomes a condition, only with the health consent', () => {
  const answers = { issues: ['inflammatory-acne', 'perioral-dermatitis'], acneWhere: ['mouth'] }
  const yes = toColumns(answers, true)
  assert.ok(yes.skin_profile.suspected.includes('Perioral dermatitis'))
  assert.ok(engineProfile({ ...yes, consent_health_at: '2026-11-06' }).skin_conditions.includes('Perioral dermatitis'))
  assert.deepEqual(toColumns(answers, false).skin_profile.suspected, [])
})

test('her own habits come back every other day', () => {
  const even = new Date(2026, 0, 2) // day 2 of the year
  const odd = new Date(2026, 0, 3)
  assert.match(tipOfTheMoment({ period: 'day', date: even, zones: ['forehead'] }).text, /forehead/)
  assert.doesNotMatch(tipOfTheMoment({ period: 'day', date: odd, zones: ['forehead'] }).text, /forehead/)
  assert.equal(tipOfTheMoment({ period: 'evening', date: even, zones: ['cheeks'] }).text, 'Change your pillowcase once a week.')
  assert.doesNotMatch(tipOfTheMoment({ period: 'day', date: even, zones: [] }).text, /forehead/)
})
