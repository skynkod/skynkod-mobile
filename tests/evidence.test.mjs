import assert from 'node:assert/strict'
import { introWeeks, introStage, nightCounts, treatmentOf, isReactive, planPrecautions, retinolChoice, applyCheckIn, morningCleanse, isThermal, weekPattern } from '../utils/rekod-schedule.js'
import { spfOf, sunscreenOk, tintTip } from '../utils/sunscreen.js'
import { isRich } from '../utils/rekod-schedule.js'
import { buildSosPlan, questionsFor } from '../utils/sos-plan.js'

// Evidence gaps E7–E13 (docs/routines/livre-des-regles.md, section 9).
const weeksAgo = w => new Date(Date.now() - (w - 1) * 7 * 864e5 - 3600e3).toISOString()
const plan = (extra = {}) => ({ goal: 'antiaging', goals: ['antiaging'], experience: 'used', level: 3, levelSince: 1, startedAt: weeksAgo(1), ...extra })

// E7: one new strong active every 2 weeks, the most useful first.
assert.deepEqual(introWeeks(plan({ vitc: true })), { treatment: 1, vitc: 3, exfoliation: 5 })
assert.deepEqual(introWeeks(plan({ goal: 'clear', goals: ['clear'], inflamed: true, vitc: false })), { treatment: 1, benzoyl: 3, exfoliation: 5 })
assert.deepEqual(introWeeks(plan({ inflamed: true, vitc: true })), { treatment: 1, benzoyl: 3, vitc: 5, exfoliation: 7 })
// A glow-only beginner has no treatment night: vitamin C first, then exfoliation.
assert.deepEqual(introWeeks(plan({ goal: 'glow', goals: ['glow'], experience: 'none', level: 0, vitc: true })), { vitc: 1, exfoliation: 3 })
// Exfoliation waits for its week, then comes in at one night, in place of a treatment night.
assert.equal(nightCounts(plan({ vitc: true, startedAt: weeksAgo(3) })).ex, 0)
const arrival = nightCounts(plan({ vitc: true, startedAt: weeksAgo(5) }))
assert.equal(arrival.ex, 1)
assert.ok(arrival.ex + arrival.ret <= nightCounts(plan({ vitc: true, startedAt: weeksAgo(4) })).ret)
assert.ok(nightCounts(plan({ vitc: true, startedAt: weeksAgo(9) })).ex >= 1)
// Each new active rebuilds the routine.
assert.equal(introStage(plan({ vitc: true, startedAt: weeksAgo(1) })), 1)
assert.equal(introStage(plan({ vitc: true, startedAt: weeksAgo(3) })), 2)

// E8: pregnancy, azelaic acid for every goal.
for (const goal of ['antiaging', 'clear', 'spots', 'glow', 'pores']) {
  assert.equal(treatmentOf(plan({ goal, goals: [goal], pregnant: true, startedAt: weeksAgo(8) })), 'azelaic', goal)
}

// E10: a deeper skin tone with breakouts or marks: azelaic acid 4 weeks, then retinol, gently.
const deep = planPrecautions({ tone: 4, skin_concerns: ['Acne'] })
assert.ok(deep.deepStart)
assert.ok(!planPrecautions({ tone: 4, skin_concerns: ['Fine lines'] }).deepStart)
assert.ok(!planPrecautions({ tone: 1, skin_concerns: ['Acne'] }).deepStart)
assert.equal(treatmentOf(plan({ ...deep, startedAt: weeksAgo(2) })), 'azelaic')
assert.equal(treatmentOf(plan({ ...deep, startedAt: weeksAgo(6) })), 'retinol')
assert.ok(nightCounts(plan({ ...deep, startedAt: weeksAgo(5) })).ret <= 2)

// E11: psoriasis is a sensitive, reactive skin.
assert.ok(isReactive({ skin_conditions: ['Psoriasis'] }))

// E12: 3 strong actives at most; 2 for a sensitive skin or after a reaction
// (with red spots, retinoid and benzoyl peroxide stay, exfoliation goes).
const acne = plan({ goal: 'clear', goals: ['clear'], inflamed: true, startedAt: weeksAgo(10) })
assert.ok(nightCounts(acne).ex > 0)
assert.equal(nightCounts({ ...acne, sensitive: true }).ex, 0)
assert.equal(nightCounts({ ...acne, extraReset: true }).ex, 0)
assert.equal(nightCounts({ ...acne, restUntil: new Date(Date.now() - 3 * 864e5).toISOString() }).ex, 0)
assert.ok(nightCounts({ ...acne, inflamed: false, sensitive: true }).ex > 0)

// E13: SPF 30 at least, with UVA protection.
assert.equal(spfOf({ name: 'Anthelios UVMune 400 SPF50+' }), 50)
assert.equal(spfOf({ name: 'Crème Solaire IP 30' }), 30)
assert.equal(spfOf({ name: 'Capital Soleil Soin Anti Taches' }), null)
assert.ok(sunscreenOk({ name: 'Fluid SPF 50', ingredients_text: 'Aqua, Butyl Methoxydibenzoylmethane, Glycerin' }))
assert.ok(!sunscreenOk({ name: 'Day Cream SPF 15', ingredients_text: 'Aqua, Zinc Oxide' }))
assert.ok(!sunscreenOk({ name: 'Glow Cream SPF 50', ingredients_text: 'Aqua, Ethylhexyl Methoxycinnamate, Glycerin' }))
// A US list that leaves the filters out: the label says it.
assert.ok(sunscreenOk({ name: 'Sensitive Skin Zinc Oxide SPF 50', ingredients_text: 'Water, Glycerin' }))
assert.ok(sunscreenOk({ name: 'Broad Spectrum SPF 30 Lotion', ingredients_text: 'Water' }))

// E9: the tinted tip, never imposed.
assert.ok(tintTip({ skin_concerns: ['Dark spots'] }))
assert.ok(tintTip({ skin_conditions: ['Melasma'] }))
assert.ok(tintTip({ tone: 3 }))
assert.ok(!tintTip({ tone: 1, skin_concerns: ['Acne'] }))

// E14: retinol 4 nights at most, unless she adds more herself (up to 7).
const full = plan({ startedAt: weeksAgo(10) })
const base = nightCounts(full).ret
assert.ok(base <= 4)
assert.equal(nightCounts({ ...full, extraRet: 2 }).ret, Math.min(7, base + 2))
assert.equal(nightCounts({ ...full, extraRet: 9 }).ret + nightCounts({ ...full, extraRet: 9 }).ex <= 7, true)
// No room for exfoliation (it needs a free night on each side): it steps back.
const many = nightCounts({ ...full, extraRet: 3 })
assert.ok(many.ex === 0 || many.ret + many.ex * 3 <= 7)
assert.equal(weekPattern({ ...full, extraRet: 3 }).filter(n => n === 'retinoid').length, many.ret)
// Not for a sensitive skin, in pregnancy, or while her skin reacts; a reaction takes the extra nights back.
assert.ok(retinolChoice(full))
assert.ok(!retinolChoice({ ...full, sensitive: true }))
assert.ok(!retinolChoice({ ...full, pregnant: true }))
assert.equal(nightCounts({ ...full, sensitive: true, extraRet: 3 }).ret, nightCounts({ ...full, sensitive: true }).ret)
assert.equal(nightCounts({ ...full, extraReset: true, extraRet: 3 }).ret, nightCounts({ ...full, extraReset: true }).ret)
const after = applyCheckIn({ ...full, extraRet: 2 }, 'little')
assert.equal(after.extraRet, 0)
assert.ok(after.extraRetDropped)
assert.equal(applyCheckIn({ ...full, extraRet: 2 }, 'good').extraRet, 2)

// E16: no cleanser in the morning, except for oily or breakout-prone skin.
assert.ok(morningCleanse({ skin_type: 'Oily' }))
assert.ok(morningCleanse({ skin_type: 'Dry', skin_concerns: ['Acne'] }))
assert.ok(!morningCleanse({ skin_type: 'Combination' }))
assert.ok(!morningCleanse({ skin_type: 'Dry', skin_concerns: ['Dark spots'] }))
assert.ok(isThermal({ name: 'Eau Thermale Avène' }))
assert.ok(isThermal({ name: 'Thermal Spring Water' }))
assert.ok(!isThermal({ name: 'Thermal Micellar Water' }))

// Milia: rich eye balms stay out.
assert.ok(isRich({ name: 'Rich Eye Balm' }))
assert.ok(!isRich({ name: 'Eye Gel Cream' }))

// After a peel, a laser or microneedling: no actives in the SOS plan, mineral SPF, the practitioner first.
const laser = buildSosPlan(['procedure'], { procedure: 'laser' })
for (const p of ['retinoid', 'acid', 'exfoliant', 'vitaminC', 'scrub']) assert.ok(laser.pause.includes(p), p)
assert.ok(laser.notes.some(n => /practitioner/.test(n)))
assert.ok(laser.notes.some(n => /2 weeks/.test(n)))
assert.ok(questionsFor(['procedure'], {}, null).some(q => q.id === 'procedure'))
const withSpots = buildSosPlan(['procedure', 'breakout'], { procedure: 'peel' })
assert.ok(withSpots.days.every(d => !d.evening.some(st => /benzoyl|salicylic|azelaic/i.test(st.text))), 'no spot active after a treatment')
// Breakout plan: benzoyl peroxide on the whole area, not on spots only.
const spots = buildSosPlan(['breakout'], {})
assert.ok(spots.days.some(d => d.evening.some(st => /whole breakout area/.test(st.text))))

console.log('evidence: all good')
