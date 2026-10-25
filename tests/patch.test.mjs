import assert from 'node:assert/strict'
import { needsPatchTest, canOffer, testDue, testMorning, recentOther } from '../utils/patch-core.js'

// Who is offered the test.
assert.equal(needsPatchTest({ profile: {}, active: false }), false, 'normal skin, gentle product: nothing')
assert.equal(needsPatchTest({ profile: {}, active: true }), true, 'a strong active')
assert.equal(needsPatchTest({ profile: { avoid_ingredients: ['Fragrance'] }, active: false }), true, 'an allergy')
assert.equal(needsPatchTest({ profile: { skin_concerns: ['Sensitivity'] }, active: false }), true, 'sensitive skin')
assert.equal(needsPatchTest({ profile: { skin_conditions: ['Rosacea'] }, active: false }), true, 'rosacea')
assert.equal(needsPatchTest({ profile: { fragile: true }, active: false }), true, 'a treatment that makes the skin fragile')

// Offered once per product, and never after 2 "No thanks".
const sensitive = { skin_concerns: ['Sensitivity'] }
assert.equal(canOffer({ state: {}, productId: 1, profile: sensitive }), true)
assert.equal(canOffer({ state: { declines: 2 }, productId: 1, profile: sensitive }), false)
assert.equal(canOffer({ state: { tests: { 1: { at: '2026-10-01' } } }, productId: 1, profile: sensitive }), false)

// Asked from the next morning, for a week.
const at = new Date(2026, 9, 10, 21).toISOString()
const state = { tests: { 1: { id: 1, name: 'Serum', at, result: null } } }
assert.equal(testDue(state, new Date(2026, 9, 10, 23)), null, 'not the same evening')
assert.equal(testDue(state, new Date(2026, 9, 11, 8)).id, 1, 'the next morning')
assert.equal(testDue(state, new Date(2026, 9, 18, 8)), null, 'dropped after a week')
assert.equal(testDue({ tests: { 1: { ...state.tests[1], result: 'ok' } } }, new Date(2026, 9, 11, 8)), null, 'answered')
assert.equal(testMorning(state.tests[1]).getDate(), 11)

// One new product at a time.
const started = [{ id: 2, name: 'Cream', date: new Date(2026, 9, 8).toISOString() }]
assert.equal(recentOther({ productId: 1, started, now: new Date(2026, 9, 10) }).name, 'Cream')
assert.equal(recentOther({ productId: 1, started, now: new Date(2026, 9, 10) }).until.getDate(), 15)
assert.equal(recentOther({ productId: 1, started, now: new Date(2026, 9, 16) }), null, 'a week later: fine')
assert.equal(recentOther({ productId: 2, started, now: new Date(2026, 9, 10) }), null, 'not itself')
console.log('patch: 19 checks passed')
