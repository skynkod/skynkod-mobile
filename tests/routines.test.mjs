import assert from 'node:assert/strict'
import { textureFor } from '../utils/rekod-schedule.js'
import { treatmentOf } from '../utils/rekod-schedule.js'

// Creams by skin: light for oily skin or sweat, rich for dry skin or menopause.
const gel = { name: 'Hydro Boost Water Gel' }
const rich = { name: 'Rich Repair Cream' }
assert.ok(textureFor({ skin_type: 'Oily' })(gel))
assert.ok(!textureFor({ skin_type: 'Oily' })(rich))
assert.ok(textureFor({ skin_type: 'Normal', sweat: true })(gel))
assert.ok(textureFor({ skin_type: 'Dry' })(rich))
assert.ok(!textureFor({ skin_type: 'Dry' })(gel))
assert.ok(textureFor({ skin_type: 'Normal', menopause: 'after' })(rich))
assert.equal(textureFor({ skin_type: 'Normal' }), null)

// No retinol for a young skin without an anti-ageing, clear-skin or spots goal.
const started = new Date().toISOString()
assert.equal(treatmentOf({ goals: ['hydration'], young: true, startedAt: started, level: 1 }), 'gentle')
assert.equal(treatmentOf({ goals: ['hydration'], young: false, startedAt: started, level: 1 }), 'retinol')
