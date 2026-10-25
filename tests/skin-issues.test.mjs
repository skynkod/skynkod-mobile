import assert from 'node:assert/strict'
import { productMatch } from '../utils/ingredients-guide.js'
import { fromIssues } from '../utils/skin-issues.js'
import { withIssues, toColumns, suspicionsFrom } from '../utils/skin-quiz.js'
import { checkRoutine } from '../utils/routine-checks.js'

// Photos → profile: concerns, acne types, suspected conditions (health only).
const f = fromIssues(['comedonal-acne', 'chapped-lips', 'dark-circles', 'rosacea'])
assert.deepEqual(f.concerns, ['Acne', 'Chapped lips', 'Dark circles'])
assert.deepEqual(f.acneTypes, ['Comedonal'])
assert.deepEqual(f.suspected, ['Rosacea'])
assert.deepEqual(fromIssues(['rosacea'], { health: false }).suspected, [])
assert.deepEqual(withIssues({ issues: ['dry-skin', 'neck-lines'] }).concerns, ['Dryness', 'Fine lines'])
assert.deepEqual(toColumns({ issues: ['fungal-acne'] }, true).skin_profile.suspected, ['Fungal'])
assert.deepEqual(suspicionsFrom({ issues: ['eczema'] }), ['Eczema'])

// Lip and eye products: their own zone only (Lita, 2026-10-25).
const profile = { skin_type: 'Oily', skin_concerns: ['Acne', 'Chapped lips', 'Dark circles', 'Sensitivity'], acne_types: ['Fungal'], skin_conditions: [], avoid_ingredients: [] }
const oils = ['Butyrospermum Parkii Butter', 'Cocos Nucifera Oil', 'Petrolatum']
const balm = productMatch({ name: 'Balm', category: 'lip care', ingredients_text: 'x', ingredients: oils }, profile)
assert.equal(balm.tone, 'success', 'fungal acne and pores never judge a lip balm')
assert.ok(balm.good.some(g => /chapped lips/.test(g.text)))
const cream = productMatch({ name: 'Cream', category: 'moisturizer', ingredients_text: 'x', ingredients: oils }, profile)
assert.equal(cream.tone, 'danger', 'the same formula on the face is not fungal-acne safe')
assert.ok(!cream.good.some(g => /dark circles|chapped/.test(g.text)), 'face products leave eye and lip concerns out')
const eye = productMatch({ name: 'Eye gel', category: 'eye care', ingredients_text: 'x', ingredients: ['Aqua', 'Caffeine', 'Parfum'] }, profile)
assert.ok(eye.good.some(g => /dark circles/.test(g.text)))
assert.ok(eye.care.some(c => /sensitive/.test(c.text)), 'sensitive skin still counts near the eyes')

// Clash: the product that works on her main concern keeps its days.
const retinol = { id: 1, name: 'Retinol serum', category: 'serum', ingredients_text: 'x', ingredients: ['Aqua', 'Retinol'] }
const acid = { id: 2, name: 'Glycolic toner', category: 'toner', ingredients_text: 'x', ingredients: ['Aqua', 'Glycolic Acid'] }
const args = { period: 'evening', steps: [{ product_id: 1 }, { product_id: 2 }], productsById: { 1: retinol, 2: acid } }
assert.equal(checkRoutine(args).find(i => i.key.startsWith('retinol-acid')).fix.stepIndex, 1, 'usually the acid moves')
assert.equal(checkRoutine({ ...args, priority: 'Dullness' }).find(i => i.key.startsWith('retinol-acid')).fix.stepIndex, 0, 'main concern dullness: the acid keeps its days, the retinol moves')
console.log('skin issues: all checks passed')
