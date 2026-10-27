import assert from 'node:assert/strict'
import { productMatch } from '../utils/ingredients-guide.js'
import { toColumns, engineProfile } from '../utils/skin-quiz.js'

const product = (ingredients, extra = {}) => ({ name: 'Test', category: 'serum', ingredients_text: ingredients.join(', '), ingredients, key_ingredients: [], ...extra })

// An ingredient she typed herself ("Other") is looked for in every product.
const typed = { avoid_ingredients: ['Fragrance', 'niacinamide'] }
assert.equal(productMatch(product(['aqua', 'niacinamide', 'glycerin']), typed).avoid.length, 1)
assert.equal(productMatch(product(['aqua', 'glycerin']), typed).avoid.length, 0)
// …also under another name the ingredient guide knows (vitamin C = ascorbic acid).
assert.equal(productMatch(product(['aqua', 'ascorbic acid']), { avoid_ingredients: ['vitamin c'] }).avoid.length, 1)
// Without a full ingredient list, we say we can't check it.
const noList = productMatch({ name: 'X', category: 'serum', ingredients: [], key_ingredients: ['hyaluronic acid'] }, typed)
assert.ok(noList.care.some(c => c.text.includes("can't check for niacinamide")))

// A condition diagnosed by a doctor is saved (with the health consent only) and switches its product rules on.
const answers = { feel: 'normal', shine: 'matte', pores: 'small', reactivity: 'rarely', issues: [], conditions: ['Rosacea'], avoid: [], meds: [] }
assert.deepEqual(toColumns(answers, true).skin_conditions, ['Rosacea'])
assert.deepEqual(toColumns(answers, false).skin_conditions, [])
const prof = engineProfile({ ...toColumns(answers, true), consent_health_at: 'now' })
assert.ok(productMatch(product(['aqua', 'glycolic acid']), prof).triggered.some(t => t.text.includes('rosacea')))
