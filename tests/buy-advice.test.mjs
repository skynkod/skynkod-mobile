// Run with: npm run test:buy
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buyVerdict, concernToSuggest, fitsConcern } from '../utils/buy-advice.js'

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

// "Probably not" (Lita, 2026-11-03): a product for her main concern, or nothing if she has what she needs.
const argireline = P('7', 'Argireline 10%', 'serum', ['water', 'acetyl hexapeptide-8', 'glycerin'])

test('it targets something else: suggest for her main concern', () => {
  assert.equal(buyVerdict({ product: argireline, profile, owned: [] }).offTarget, true)
  assert.equal(concernToSuggest({ product: argireline, profile, owned: [] }), 'Large pores')
})

test('she already has one that does the same job: nothing more', () => {
  assert.equal(concernToSuggest({ product: nia2, profile, owned: [nia] }), null)
})

test('she already owns a product of this kind for her concern: nothing more', () => {
  assert.equal(concernToSuggest({ product: argireline, profile, owned: [nia] }), null)
})

test('the suggestion targets her concern and is not one she owns', () => {
  assert.equal(fitsConcern(nia, { concern: 'Large pores', profile, owned: [] }), true)
  assert.equal(fitsConcern(nia, { concern: 'Large pores', profile, owned: [nia] }), false)
  assert.equal(fitsConcern(argireline, { concern: 'Large pores', profile, owned: [] }), false)
})

// Dryness and sensitivity: hydrating and calming ingredients count (Lita, 2026-11-06).
test('for dryness, a hyaluronic serum fits and a peptide serum does not', () => {
  const dry = { skin_type: 'Dry', skin_concerns: ['Dryness'], priority: 'Dryness' }
  const ha = P('8', 'Hyaluronic Acid 2% + B5', 'serum', ['water', 'sodium hyaluronate', 'panthenol'])
  assert.equal(fitsConcern(ha, { concern: 'Dryness', profile: dry, owned: [] }), true)
  assert.equal(fitsConcern(argireline, { concern: 'Dryness', profile: dry, owned: [] }), false)
  assert.equal(concernToSuggest({ product: argireline, profile: dry, owned: [ha] }), null)
})
