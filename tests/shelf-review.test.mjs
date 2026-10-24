// Run with: npm run test:shelf
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { shelfReview } from '../utils/shelf-review.js'

const P = (id, name, category, ingredients) => ({ id, name, category, ingredients, ingredients_text: ingredients.join(', ') })
const cleanser = P('1', 'Gentle Cleanser', 'cleanser', ['water', 'glycerin', 'cocamidopropyl betaine'])
const cream = P('2', 'Barrier Cream', 'moisturizer', ['water', 'glycerin', 'ceramide np'])
const nia = P('3', 'Niacinamide 10%', 'serum', ['water', 'niacinamide', 'glycerin'])
const nia2 = P('4', 'Pore Serum', 'serum', ['water', 'niacinamide', 'propanediol'])
const aha = P('5', 'AHA Toner', 'exfoliant', ['water', 'glycolic acid', 'glycerin'])
const profile = { skin_type: 'Normal', skin_concerns: ['Large pores'], priority: 'Large pores' }
const own = list => list.map(product => ({ product, life: { status: 'ok' } }))

test('missing sunscreen: "you only need one"', () => {
  const { groups } = shelfReview({ owned: own([cleanser, cream, nia]), profile })
  assert.deepEqual(groups.missing.map(m => m.label), ['A sunscreen'])
  assert.equal(groups.keep.length, 3)
})

test('two niacinamide serums: one is not needed', () => {
  const { groups } = shelfReview({ owned: own([cleanser, cream, nia, nia2]), profile })
  assert.equal(groups.stop.length, 1)
})

test('a reaction means consider stopping; too many exfoliations means use less often', () => {
  const { groups } = shelfReview({ owned: own([cleanser, cream, nia, aha]), reactions: { 3: { tag: 'Redness', count: 3 } }, tooManyExfoliations: true, profile: { ...profile, skin_concerns: ['Large pores', 'Dullness', 'Dark spots', 'Fine lines', 'Acne'] } })
  assert.equal(groups.stop[0].product.id, '3')
  assert.equal(groups.lessOften[0].product.id, '5')
})
