// Run with: npm run test:stop
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { stopReason } from '../utils/stop-advice.js'

const P = (id, name, category, ingredients) => ({ id, name, category, ingredients, ingredients_text: ingredients.join(', ') })
const niaA = P('a', 'Niacinamide 10%', 'serum', ['water', 'niacinamide', 'glycerin', 'zinc pca'])
const niaB = P('b', 'Pore Serum', 'serum', ['water', 'niacinamide', 'propanediol', 'panthenol'])
const retinol = P('c', 'Retinol 0.3%', 'serum', ['water', 'squalane', 'retinol', 'glycerin'])
const cream = P('d', 'Barrier Cream', 'moisturizer', ['water', 'glycerin', 'ceramide np'])
const profile = { skin_type: 'Normal', skin_concerns: ['Dark spots'], priority: 'Dark spots' }

test('a journal reaction comes first and is free', () => {
  const r = stopReason({ product: niaA, profile, reaction: { tag: 'Redness', count: 3 }, others: [niaB] })
  assert.equal(r.kind, 'reaction')
  assert.equal(r.free, true)
})

test('expired is free', () => {
  assert.equal(stopReason({ product: cream, profile, life: { status: 'expired' } }).kind, 'expired')
})

test('two niacinamide serums: only one gets "same job", and it is Premium', () => {
  const a = stopReason({ product: niaA, profile, others: [niaA, niaB] })
  const b = stopReason({ product: niaB, profile, others: [niaA, niaB] })
  const flagged = [a, b].filter(x => x?.kind === 'duplicate')
  assert.equal(flagged.length, 1)
  assert.equal(flagged[0].free, false)
})

test('a retinol for someone who only wants to fade dark spots: not needed now', () => {
  const r = stopReason({ product: retinol, profile: { skin_type: 'Normal', skin_concerns: ['Redness'] } })
  assert.equal(r?.kind, 'notNeeded')
})

test('basics are never "not needed"', () => {
  assert.equal(stopReason({ product: cream, profile: { skin_type: 'Normal', skin_concerns: ['Acne'] } }), null)
})
