import assert from 'node:assert/strict'
import { productMatch } from '../utils/ingredients-guide.js'
import { toColumns, engineProfile } from '../utils/skin-quiz.js'

const product = (ingredients, extra = {}) => ({ name: 'Test', category: 'serum', ingredients_text: ingredients.join(', '), ingredients, key_ingredients: [], ...extra })
const profileOf = (answers, health = true) => engineProfile({ ...toColumns({ feel: 'normal', shine: 'matte', pores: 'small', issues: [], ...answers }, health), consent_health_at: health ? 'now' : null })
const says = (m, words) => m.good.some(g => g.text.includes(words))

// Age only adds bonuses, never warnings.
const peptides = product(['aqua', 'palmitoyl tripeptide-1', 'glycerin'])
assert.ok(says(productMatch(peptides, profileOf({ ageRange: 3 })), 'firmness and comfort at your age'))
assert.ok(!says(productMatch(peptides, profileOf({ ageRange: 0 })), 'at your age') || says(productMatch(peptides, profileOf({ ageRange: 0 })), 'gentle essential'))
assert.ok(productMatch(peptides, profileOf({ ageRange: 3 })).score >= productMatch(peptides, profileOf({})).score)

// Menopause counts only with the health consent.
const ceramides = product(['aqua', 'ceramide np', 'glycerin'])
assert.ok(says(productMatch(ceramides, profileOf({ menopause: 'after' })), 'menopause'))
assert.ok(!says(productMatch(ceramides, profileOf({ menopause: 'after' }, false)), 'menopause'))

// Deeper skin tones: gentle tone-evening bonus and two "keep an eye" alerts.
const deep = profileOf({ tone: 4 })
assert.ok(says(productMatch(product(['aqua', 'azelaic acid']), deep), 'deeper skin'))
const mineralSpf = product(['zinc oxide', 'aqua', 'glycerin'], { category: 'sunscreen', name: 'Mineral SPF 50' })
assert.ok(productMatch(mineralSpf, deep).triggers.some(t => t.text.includes('white cast')))
assert.ok(!productMatch(mineralSpf, profileOf({ tone: 1 })).triggers.some(t => t.text.includes('white cast')))
assert.ok(productMatch(product(['glycolic acid', 'aqua'], { name: 'Peel 10%' }), deep).triggers.some(t => t.text.includes('dark marks')))

// Her days: outdoors favours high SPF, sweat favours light textures.
assert.ok(says(productMatch(product(['aqua', 'homosalate'], { category: 'sunscreen', name: 'Fluid SPF 50+' }), profileOf({ sunTime: 'high' })), 'outdoors'))
assert.ok(says(productMatch(product(['aqua', 'glycerin'], { name: 'Hydrating Gel' }), profileOf({ sweat: true })), 'when you sweat'))

// Dark circles by kind, on eye products only, and the honest note for hollow ones.
const eye = product(['aqua', 'caffeine', 'sodium hyaluronate'], { category: 'eye care', name: 'Eye serum' })
assert.ok(says(productMatch(eye, profileOf({ eyeDetails: ['blue'] })), 'blue or purple'))
assert.equal(productMatch(eye, profileOf({ eyeDetails: ['hollow'] })).notes.length, 1)
assert.equal(productMatch(product(['aqua', 'caffeine']), profileOf({ eyeDetails: ['blue'] })).notes.length, 0)
