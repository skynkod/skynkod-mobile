// Run with: npm run test:expect
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { expectationFor, expectationStatus } from '../utils/expectations.js'
import { stopReason } from '../utils/stop-advice.js'

const P = (id, name, category, ingredients) => ({ id, name, category, ingredients, ingredients_text: ingredients.join(', ') })
const now = new Date('2026-10-24T12:00:00Z')
const ago = n => new Date(now.getTime() - n * 86400000).toISOString()

test('the slowest active decides: retinol + niacinamide = 8 to 12 weeks', () => {
  const e = expectationFor(P('1', 'Retinol', 'serum', ['water', 'niacinamide', 'retinol', 'glycerin']))
  assert.deepEqual(e.weeks, [8, 12])
})

test('day 11 of a retinol is too early; week 9 is time to look', () => {
  const e = expectationFor(P('1', 'Retinol', 'serum', ['water', 'retinol']))
  assert.equal(expectationStatus(e, ago(10), now).phase, 'early')
  assert.equal(expectationStatus(e, ago(10), now).day, 11)
  assert.equal(expectationStatus(e, ago(60), now).phase, 'look')
})

test('a plain moisturizer has no expectation line', () => {
  assert.equal(expectationFor(P('2', 'Cream', 'moisturizer', ['water', 'glycerin', 'ceramide np'])), null)
})

test('"Worse" at the time to look becomes Consider stopping, free', () => {
  const r = stopReason({ product: P('1', 'Retinol', 'serum', ['water', 'retinol']), verdict: 'worse' })
  assert.equal(r.kind, 'notHelping')
  assert.equal(r.free, true)
})
