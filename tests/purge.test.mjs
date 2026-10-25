import assert from 'node:assert/strict'
import { verdictOf, needsQuestions, isPurging, followUpDue, followUpDate, answerFollowUp, laterReaction, purgeRunning } from '../utils/purge-core.js'
import { applyCheckIn } from '../utils/rekod-schedule.js'

// The 3 questions.
assert.equal(verdictOf({ active: true, where: 'usual', itch: false }).verdict, 'purge')
assert.deepEqual(verdictOf({ active: false, where: 'usual', itch: false }), { verdict: 'reaction', reason: 'not-active' })
assert.deepEqual(verdictOf({ active: true, where: 'new', itch: false }), { verdict: 'reaction', reason: 'new-place' })
assert.deepEqual(verdictOf({ active: true, where: 'usual', itch: true }), { verdict: 'reaction', reason: 'itch' })

// Asked only for spots, and only once per product.
const spots = { product: { id: 7, name: 'Retinol' }, tag: 'New pimple', tags: ['New pimple', 'Redness'] }
assert.equal(needsQuestions(spots, {}), true)
assert.equal(needsQuestions(spots, { 7: { verdict: 'purge' } }), false)
assert.equal(needsQuestions({ product: { id: 8 }, tag: 'Redness', tags: ['Redness'] }, {}), false)

// Follow-up: 4 weeks, then 8 weeks if not better yet.
const at = new Date(2026, 9, 1)
const check = { verdict: 'purge', at: at.toISOString() }
const day = d => new Date(2026, 9, 1 + d)
assert.equal(followUpDue(check, day(20)), null)
assert.equal(followUpDue(check, day(28)), 'week4')
assert.equal(followUpDate(check).getTime(), day(28).getTime())
const better = answerFollowUp(check, 'week4', true)
assert.equal(better.closed, true)
assert.equal(isPurging(better), true, 'a purge that got better is still not a reaction')
assert.equal(followUpDue(better, day(60)), null)
const notYet = answerFollowUp(check, 'week4', false)
assert.equal(followUpDue(notYet, day(40)), null)
assert.equal(followUpDue(notYet, day(56)), 'week8')
const tooLong = answerFollowUp(notYet, 'week8', false)
assert.equal(tooLong.verdict, 'reaction')
assert.equal(tooLong.reason, 'too-long')
assert.equal(isPurging(tooLong), false, 'after 8 weeks it counts as a reaction again')
assert.equal(followUpDate(tooLong), null)

// The safety net: itching on 2 days, or redness on 3 days, after a purge answer.
const row = (d, tags) => ({ date: day(d).toISOString(), skin_conditions: tags })
assert.equal(laterReaction(check, [row(3, ['Itchiness / Sensitivity'])]), false)
assert.equal(laterReaction(check, [row(3, ['Itchiness / Sensitivity']), row(5, ['Itchiness / Sensitivity'])]), true)
assert.equal(laterReaction(check, [row(2, ['Redness']), row(4, ['Redness'])]), false)
assert.equal(laterReaction(check, [row(2, ['Redness']), row(4, ['Redness']), row(6, ['Redness'])]), true)
assert.equal(laterReaction(check, [row(-3, ['Itchiness / Sensitivity']), row(-1, ['Itchiness / Sensitivity'])]), false, 'only after the answer')
assert.equal(laterReaction(better, [row(30, ['Itchiness / Sensitivity']), row(31, ['Itchiness / Sensitivity'])]), false, 'a closed purge stays closed')

// Rekod keeps its level while a purge runs.
assert.equal(purgeRunning({ 7: check }), true)
assert.equal(purgeRunning({ 7: better }), false)
assert.equal(purgeRunning({ 7: tooLong }), false)
const plan = { level: 1, levelSince: 1, experience: 'used', startedAt: new Date(2026, 8, 1).toISOString(), checkins: [] }
const now = new Date(2026, 8, 25)
assert.equal(applyCheckIn(plan, 'good', now).level, 2)
assert.equal(applyCheckIn(plan, 'good', now, { hold: true }).level, 1)
assert.equal(applyCheckIn(plan, 'lot', now, { hold: true }).level, 0, 'slowing down still works')
console.log('purge: 33 checks passed')
