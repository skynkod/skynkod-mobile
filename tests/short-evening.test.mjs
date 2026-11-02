import assert from 'node:assert/strict'
import { mock } from 'node:test'
import { shortSteps, canGoShort, shiftPlan, shouldSuggestSimplify } from '../utils/short-evening-core.js'
import { weekPattern, weekOf } from '../utils/rekod-schedule.js'

// A fixed today: weekPattern depends on the plan's current week, and a pause moves
// the plan a day back, so on some real dates the two weeks compared would differ.
mock.timers.enable({ apis: ['Date'], now: new Date(2026, 9, 14, 12) })

// Tonight's essentials: cleanser, cream, lips. Never the active.
const steps = [
  { key: 'cleanser', product: 'Gel' },
  { key: 'treatment', product: 'Retinol', night: 'retinoid' },
  { key: 'serum', product: 'Niacinamide' },
  { key: 'eye', product: 'Eye cream' },
  { key: 'moisturizer', product: 'Cream' },
  { key: 'lips', product: 'Balm' },
]
assert.deepEqual(shortSteps(steps).map(s => s.key), ['cleanser', 'moisturizer', 'lips'])
assert.equal(canGoShort(steps), true)
assert.equal(canGoShort([{ key: 'cleanser', product: 'Gel' }, { key: 'moisturizer', product: 'Cream' }]), false, 'already short')
assert.equal(canGoShort([{ key: 'serum', product: 'A' }, { key: 'eye', product: 'B' }, { key: 'mask', product: 'C' }]), false, 'nothing essential to keep')

// Rekod's one-night pause: tonight's night moves to tomorrow, and so on.
const plan = { level: 2, experience: 'used', sensitive: false, startedAt: new Date(2026, 9, 5).toISOString(), checkins: [] }
const before = weekPattern(plan)
const after = weekPattern(shiftPlan(plan))
for (let i = 0; i < 7; i += 1) assert.equal(after[(i + 1) % 7], before[i], `night ${i} moves one evening later`)
assert.equal(weekPattern(shiftPlan(shiftPlan(plan), -1)).join(), before.join(), 'undo puts it back')
const seven = Array.from({ length: 7 }).reduce(p => shiftPlan(p), plan)
assert.equal(weekPattern(seven).join(), before.join(), '7 pauses = a full week round')
// The weeks move too: the weekly review comes one day later.
const day = new Date(2026, 9, 19, 12)
assert.equal(weekOf(plan, day), 3)
assert.equal(weekOf(shiftPlan(plan), day), 2, 'the new week starts one day later')
assert.equal(weekOf(shiftPlan(plan), new Date(2026, 9, 20, 12)), 3)
// The hard rules still hold after a pause: never two strong nights touching (sensitive skin).
const sens = { ...plan, sensitive: true, level: 3 }
for (let k = 0; k < 7; k += 1) {
  const w = weekPattern({ ...sens, dayShift: k })
  const strong = n => n === 'retinoid' || n === 'exfoliation'
  for (let i = 0; i < 7; i += 1) assert.ok(!(strong(w[i]) && strong(w[(i + 1) % 7])), `shift ${k}: two strong nights in a row`)
}

// 3 short evenings in a week: offered once, then not for 30 days.
const now = new Date(2026, 9, 20)
const d = n => new Date(2026, 9, 20 - n).toISOString()
assert.equal(shouldSuggestSimplify({ dates: [d(1), d(3)] }, now), false)
assert.equal(shouldSuggestSimplify({ dates: [d(1), d(3), d(5)] }, now), true)
assert.equal(shouldSuggestSimplify({ dates: [d(1), d(3), d(9)] }, now), false, 'only the last 7 days')
assert.equal(shouldSuggestSimplify({ dates: [d(1), d(3), d(5)], suggestedAt: d(10) }, now), false, 'offered less than 30 days ago')
console.log('short evening: all checks passed')
