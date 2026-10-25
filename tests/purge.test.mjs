import assert from 'node:assert/strict'
import { verdictOf, needsQuestions, isPurging, followUpDue, followUpDate, answerFollowUp } from '../utils/purge-core.js'

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
console.log('purge: 21 checks passed')
