import assert from 'node:assert/strict'
import { rxList, planDone, treatmentSteps, withTreatmentSteps, pregnancyRxAlert, rxName } from '../utils/treatments.js'
import { nightCounts, treatmentOf, textureFor, planPrecautions } from '../utils/rekod-schedule.js'
import { shortSteps } from '../utils/short-evening-core.js'
import { engineProfile } from '../utils/skin-quiz.js'

// Safety gaps E1–E6 (docs/routines/livre-des-regles.md, section 9).

// E1: a prescribed cream becomes a "Your treatment" step, at her doctor's times.
assert.ok(!planDone({ when: 'evening' }))
assert.ok(planDone({ when: 'evening', every: true }))
assert.ok(planDone({ when: 'morning', every: false, days: [1] }))
const tret = { meds: ['tretinoin'], rxPlan: { tretinoin: { when: 'evening', every: false, days: [5, 1, 3] } } }
assert.deepEqual(rxList(tret), [{ id: 'tretinoin', name: 'Tretinoin', when: 'evening', days: [1, 3, 5] }])
assert.equal(treatmentSteps(tret, 'morning').length, 0)
const [step] = treatmentSteps(tret, 'evening')
assert.equal(step.action, 'Your treatment')
assert.equal(step.product, 'Tretinoin')
assert.deepEqual(step.days, [1, 3, 5])
assert.ok(step.rx && step.product_id === null)
// "Another cream" uses the name she typed.
assert.equal(rxName('rx_other', 'Elidel'), 'Elidel')
assert.equal(rxList({ meds: ['rx_other'], rxPlan: { rx_other: { when: 'both', every: true } }, medsOther: 'Elidel' })[0].name, 'Elidel')
// Right after cleansing, in any routine.
const evening = [{ key: 'remover' }, { key: 'cleanser' }, { key: 'moisturizer' }]
assert.deepEqual(withTreatmentSteps(evening, 'evening', tret).map(s => s.key), ['remover', 'cleanser', 'rx-tretinoin', 'moisturizer'])
assert.deepEqual(withTreatmentSteps(evening, 'morning', tret).map(s => s.key), ['remover', 'cleanser', 'moisturizer'])
// Benzoyl peroxide with tretinoin at the same time: ask the doctor.
const both = { meds: ['tretinoin', 'rx_benzoyl'], rxPlan: { tretinoin: { when: 'evening', every: true }, rx_benzoyl: { when: 'evening', every: true } } }
assert.ok(treatmentSteps(both, 'evening').find(s => s.key === 'rx-rx_benzoyl').issues.length)
const apart = { meds: ['tretinoin', 'rx_benzoyl'], rxPlan: { tretinoin: { when: 'evening', every: true }, rx_benzoyl: { when: 'morning', every: true } } }
assert.equal(treatmentSteps(apart, 'morning')[0].issues.length, 0)
// Pregnancy with a retinoid treatment: a clear alert; with another cream: check with the doctor.
assert.equal(pregnancyRxAlert({ pregnancy: 'pregnant', meds: ['tretinoin'] }).level, 'avoid')
assert.equal(pregnancyRxAlert({ pregnancy: 'breastfeeding', meds: ['isotretinoin'] }).level, 'avoid')
assert.equal(pregnancyRxAlert({ pregnancy: 'pregnant', meds: ['metronidazole'] }).level, 'watch')
assert.equal(pregnancyRxAlert({ pregnancy: 'no', meds: ['tretinoin'] }), null)
assert.equal(treatmentSteps({ ...tret, pregnancy: 'pregnant' }, 'evening')[0].issues[0].level, 'avoid')
// Her treatment stays on a short evening.
assert.equal(shortSteps([{ key: 'cleanser' }, step, { key: 'serum', night: 'repair' }]).filter(s => s.rx).length, 1)

// The engine profile reads it all, only with the health consent.
const row = {
  consent_health_at: '2026-10-27', skin_type: 'Oily', skin_conditions: ['Rosacea'],
  skin_profile: { meds: ['metronidazole', 'oral_antibiotic'], rxPlan: { metronidazole: { when: 'both', every: true } }, retinolOk: true, issues: ['cystic-acne'] },
}
const ep = engineProfile(row)
assert.ok(ep.fragile && ep.photosensitive && ep.retinolOk && ep.cystic)
assert.equal(ep.rx.length, 1)
const noConsent = engineProfile({ ...row, consent_health_at: null })
assert.ok(!noConsent.fragile && !noConsent.rx.length && !noConsent.retinolOk && !noConsent.photosensitive)
// The OK for retinol only counts with rosacea or eczema.
assert.ok(!engineProfile({ ...row, skin_conditions: [] }).retinolOk)

// Rekod weeks. A plan at full strength, week 10.
const base = { goals: ['antiaging'], experience: 'used', level: 3, levelSince: 1, startedAt: new Date(Date.now() - 9 * 7 * 86400000).toISOString() }
assert.ok(nightCounts(base).ret >= 3)
// E3: rosacea keeps azelaic acid; with her dermatologist's OK, retinol 2 nights at most.
const rosacea = { ...base, reactive: true, sensitive: true, ...planPrecautions({ skin_conditions: ['Rosacea'] }) }
assert.equal(treatmentOf(rosacea), 'azelaic')
const rosaceaOk = { ...rosacea, retinolOk: true }
assert.equal(treatmentOf(rosaceaOk), 'retinol')
assert.ok(nightCounts(rosaceaOk).ret <= 2)
// E3: eczema has no treatment night, unless her dermatologist said yes.
const eczema = { ...base, reactive: true, sensitive: true, ...planPrecautions({ skin_conditions: ['Eczema'] }) }
assert.equal(nightCounts(eczema).ret, 0)
assert.equal(nightCounts(eczema).ex, 0)
assert.ok(nightCounts({ ...eczema, retinolOk: true }).ret > 0 && nightCounts({ ...eczema, retinolOk: true }).ret <= 2)
// E4: deep, painful spots: no new strong active.
const cystic = { ...base, ...planPrecautions({ cystic: true }) }
assert.equal(nightCounts(cystic).ret + nightCounts(cystic).ex, 0)
// E6: perioral dermatitis: only reset nights (cleanser and cream).
const perioral = { ...base, ...planPrecautions({ skin_conditions: ['Perioral dermatitis'] }) }
assert.deepEqual(nightCounts(perioral), { ex: 0, ret: 0, rep: 0, reset: 7 })
assert.deepEqual(nightCounts({ ...perioral, restUntil: new Date(Date.now() + 86400000).toISOString() }), { ex: 0, ret: 0, rep: 0, reset: 7 })
// E1: a prescribed cream: Rekod adds no strong active.
assert.equal(nightCounts({ ...base, fragile: true }).ret + nightCounts({ ...base, fragile: true }).ex, 0)

// E5 and E6: cream textures.
const gel = { name: 'Hydro Boost Water Gel' }
const rich = { name: 'Rich Repair Cream' }
assert.ok(textureFor({ skin_type: 'Oily', isotretinoin: true })(rich))
assert.ok(!textureFor({ skin_type: 'Dry', skin_conditions: ['Perioral dermatitis'] })(rich))
assert.ok(textureFor({ skin_type: 'Dry', skin_conditions: ['Perioral dermatitis'] })(gel))

console.log('treatments: all good')
