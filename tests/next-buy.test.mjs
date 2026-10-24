// Run with: npm run test:nextbuy
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { nextBestBuys } from '../utils/next-buy.js'

const P = (id, name, category, ingredients) => ({ id, name, category, ingredients, ingredients_text: ingredients.join(', ') })
const cleanser = P('1', 'Gentle Cleanser', 'cleanser', ['water', 'glycerin'])
const spf = P('2', 'SPF 50', 'sunscreen', ['water', 'zinc oxide'])
const nia = P('3', 'Niacinamide 10%', 'serum', ['water', 'niacinamide'])
const nia2 = P('4', 'TikTok Pore Serum', 'serum', ['water', 'niacinamide'])
const cream = P('5', 'Barrier Cream', 'moisturizer', ['water', 'glycerin', 'ceramide np'])
const profile = { skin_type: 'Normal', skin_concerns: ['Large pores'], priority: 'Large pores' }
const ok = p => ({ product: p, life: { status: 'ok' } })

test('#1 the missing moisturizer, SPF running out next, the duplicate serum can wait', () => {
  const r = nextBestBuys({ owned: [ok(cleanser), ok(nia), { product: spf, life: { status: 'soon', daysLeft: 12 } }], toBuy: [nia2], profile })
  assert.equal(r.ranked[0].label, 'A moisturizer')
  assert.equal(r.ranked[1].product.id, '2')
  assert.equal(r.skip[0].product.id, '4')
})

test('a missing basic already in her list is ranked from the list, not twice', () => {
  const r = nextBestBuys({ owned: [ok(cleanser), ok(nia), ok(spf)], toBuy: [cream], profile })
  assert.equal(r.ranked[0].product.id, '5')
  assert.equal(r.ranked.filter(x => x.label === 'A moisturizer').length, 0)
})
