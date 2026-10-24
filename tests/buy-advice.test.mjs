// Run with: npm run test:buy
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buyVerdict } from '../utils/buy-advice.js'

const P = (id, name, category, ingredients) => ({ id, name, category, ingredients, ingredients_text: ingredients.join(', ') })
const nia = P('1', 'Niacinamide 10%', 'serum', ['water', 'niacinamide', 'glycerin'])
const nia2 = P('2', 'TikTok Pore Serum', 'serum', ['water', 'niacinamide', 'propanediol'])
const spf = P('3', 'Daily SPF 50', 'sunscreen', ['water', 'zinc oxide', 'glycerin'])
const cream = P('4', 'Barrier Cream', 'moisturizer', ['water', 'glycerin', 'ceramide np'])
const retinol = P('5', 'Retinol 0.3%', 'serum', ['water', 'squalane', 'retinol'])
const profile = { skin_type: 'Normal', skin_concerns: ['Large pores'], priority: 'Large pores' }

test('a second niacinamide serum: probably not, save your money', () => {
  const v = buyVerdict({ product: nia2, profile, owned: [nia, cream] })
  assert.equal(v.answer, 'probablyNot')
  assert.equal(v.save, true)
  assert.equal(v.params.other, 'Niacinamide 10%')
})

test('no sunscreen yet: yes, it fills a gap', () => {
  assert.equal(buyVerdict({ product: spf, profile, owned: [nia, cream] }).answer, 'yes')
})

test('a retinol when she only cares about pores: probably not', () => {
  assert.equal(buyVerdict({ product: retinol, profile: { ...profile, skin_concerns: ['Redness'], priority: 'Redness' }, owned: [cream] }).answer, 'probablyNot')
})

test('a second moisturizer: your call', () => {
  assert.equal(buyVerdict({ product: P('6', 'Other Cream', 'moisturizer', ['water', 'glycerin', 'squalane']), profile, owned: [cream] }).answer, 'yourCall')
})
