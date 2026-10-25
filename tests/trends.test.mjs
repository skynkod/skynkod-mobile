import assert from 'node:assert/strict'
import { TRENDS, findTrend, trendNote } from '../utils/trends.js'

assert.equal(TRENDS.length, 42, 'the 42 trends Lita approved')
assert.equal(new Set(TRENDS.map(t => t.id)).size, 42, 'no duplicate')
for (const t of TRENDS) {
  assert.ok(['false', 'depends', 'true'].includes(t.verdict), t.id)
  assert.ok(t.title && t.why && t.instead && t.keys.length, t.id)
}

// What people type, in French or English.
const cases = {
  'dentifrice bouton': 'toothpaste-spots',
  'Toothpaste on pimple': 'toothpaste-spots',
  'slugging': 'slugging',
  'vaseline la nuit': 'slugging',
  'glaçons visage': 'ice',
  'bicarbonate de soude': 'baking-soda',
  'rétinol tous les soirs': 'retinol-nightly',
  'retinol en été': 'retinol-summer',
  'skin cycling': 'skin-cycling',
  'crème solaire maison': 'diy-sunscreen',
  'huile de coco': 'coconut',
  'gua sha rides': 'gua-sha',
  'après-rasage alcool': 'alcohol-aftershave',
  'niacinamide et vitamine C': 'niacinamide-vitc',
  'citron taches': 'lemon-spots',
  'chocolat boutons': 'chocolate',
  'percer un bouton': 'pop-pimple',
}
for (const [q, id] of Object.entries(cases)) assert.equal(findTrend(q)?.id, id, q)

// A product or ingredient search shows no trend card.
for (const q of ['retinol', 'niacinamide', 'La Roche-Posay', 'cerave cleanser', 'vitamin c serum', 'aloe vera', 'hyaluronic acid', 'natural moisturizer', 'winter cream', 'sugar scrub', 'popular serum', 'coco lip balm']) {
  assert.equal(findTrend(q), null, q)
}

// One line for her skin.
const ice = TRENDS.find(t => t.id === 'ice')
assert.match(trendNote(ice, { skin_conditions: ['Rosacea'] }), /rosacea/)
assert.equal(trendNote(ice, { skin_conditions: [] }), null)
console.log('trends: all checks passed')
