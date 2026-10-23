// Run with: node --test tests/layering.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { layerRoutine, layerOf, RULES, SOURCES } from '../utils/layering.js'

const P = (id, name, category, ingredients) => ({ id, name, category, ingredients, ingredients_text: ingredients.join(', ') })
const cleanser = P(1, 'Gentle Cleanser', 'cleanser', ['water', 'glycerin', 'cocamidopropyl betaine', 'sodium chloride'])
const vitc = P(2, 'Vitamin C Serum', 'serum', ['water', 'ascorbic acid', 'propanediol', 'tocopherol', 'ferulic acid'])
const cream = P(3, 'Barrier Cream', 'moisturizer', ['water', 'glycerin', 'ceramide np', 'cetearyl alcohol'])
const spf = P(4, 'Daily SPF 50', 'sunscreen', ['water', 'zinc oxide', 'ethylhexyl methoxycinnamate', 'glycerin'])
const toner = P(5, 'Hydrating Toner', 'toner', ['water', 'glycerin', 'sodium hyaluronate', 'panthenol'])
const retinol = P(6, 'Retinol 0.3%', 'serum', ['water', 'squalane', 'retinol', 'glycerin'])
const bha = P(7, 'BHA Liquid', 'exfoliant', ['water', 'methylpropanediol', 'salicylic acid', 'butylene glycol'])
const oil = P(8, 'Rosehip Face Oil', 'serum', ['rosa canina fruit oil', 'tocopherol', 'squalane'])
const eye = P(9, 'Eye Cream', 'eye care', ['water', 'glycerin', 'caffeine', 'niacinamide'])
const byId = Object.fromEntries([cleanser, vitc, cream, spf, toner, retinol, bha, oil, eye].map(p => [p.id, p]))
const step = (product_id, days) => ({ product_id, days })

test('morning: cleanser first, thin to thick, sunscreen last, whatever order she saved', () => {
  const r = layerRoutine({ period: 'morning', steps: [step(4), step(3), step(2), step(5), step(1), step(9)], productsById: byId })
  assert.deepEqual(r.steps.map(s => s.product.id), [1, 5, 2, 9, 3, 4])
  assert.match(r.steps.at(-1).amount, /1 teaspoon/)
  assert.equal(r.steps.at(-1).then, null)
  assert.equal(r.notes.length, 0)
})

test('evening: face oil right before moisturizer, retinoid pea-sized', () => {
  const r = layerRoutine({ period: 'evening', steps: [step(3), step(8), step(6), step(1)], productsById: byId })
  assert.deepEqual(r.steps.map(s => s.layer), ['cleanser', 'serum', 'oil', 'moisturizer'])
  assert.match(r.steps[1].amount, /pea-sized/)
})

test('notes: retinoid in the morning, no sunscreen, vitamin C at night', () => {
  const m = layerRoutine({ period: 'morning', steps: [step(1), step(6), step(3)], productsById: byId })
  assert.deepEqual(m.notes.map(n => n.rule).sort(), ['moisturizer-then-spf', 'retinoid-night'])
  const e = layerRoutine({ period: 'evening', steps: [step(1), step(2), step(3)], productsById: byId })
  assert.ok(e.notes.some(n => n.rule === 'vitc-morning'))
})

test('evenings: one strong active per night is checked night by night', () => {
  const ok = layerRoutine({ period: 'evening', steps: [step(1), step(6, [1, 3, 5]), step(7, [2, 6]), step(3)], productsById: byId })
  assert.ok(ok.nights.every(n => n.actives.length <= 1))
  assert.ok(!ok.notes.some(n => n.rule === 'not-too-many'))
  const both = layerRoutine({ period: 'evening', steps: [step(1), step(6, [1, 3, 5]), step(7, [1, 4]), step(3)], productsById: byId })
  assert.ok(both.notes.some(n => n.rule === 'not-too-many'))
})

test('every rule has at least one known source', () => {
  for (const r of RULES) {
    assert.ok(r.sources.length, r.id)
    for (const s of r.sources) assert.ok(SOURCES[s]?.url, `${r.id}: ${s}`)
  }
  assert.equal(layerOf(bha), 'exfoliant')
  assert.equal(layerOf(oil), 'oil')
})
