import assert from 'node:assert/strict'
import { isRemover, removerNeed, withRemoverStep, hasSunscreen, removerPrefer } from '../utils/removers.js'
import { shortSteps } from '../utils/short-evening-core.js'

// Removers are told apart from cleansers by their name.
for (const name of ['Micellar Cleansing Water', 'Take The Day Off Cleansing Balm', 'Ginseng Cleansing Oil', 'Eau Micellaire Demaquillante', 'Demaquillant Biphase', 'Huile Nettoyante Hydratante Douce']) assert.ok(isRemover({ name }), name)
for (const name of ['Hydrating Facial Cleanser', 'Gel Moussant Purifiant', 'Foaming Cleanser']) assert.ok(!isRemover({ name }), name)

// Who needs it: sunscreen or daily makeup = every evening; makeup some days = optional.
assert.equal(removerNeed({ hasSpf: true }), 'every')
assert.equal(removerNeed({ makeup: 'daily' }), 'every')
assert.equal(removerNeed({ makeup: 'some' }), 'optional')
assert.equal(removerNeed({ makeup: 'some', hasSpf: true }), 'every')
assert.equal(removerNeed({ makeup: 'rarely' }), null)
assert.equal(hasSunscreen([{ key: 'sunscreen' }]), true)
assert.equal(hasSunscreen([{ key: 'serum', product_id: 4 }], { 4: { category: 'sunscreen' } }), true)
assert.equal(hasSunscreen([{ key: 'moisturizer' }]), false)

// An evening without the step shows it first, empty; an optional one is marked.
const evening = [{ key: 'cleanser', product: 'Gel' }, { key: 'moisturizer', product: 'Cream' }]
assert.equal(withRemoverStep(evening, 'every')[0].key, 'remover')
assert.equal(withRemoverStep(evening, 'every')[0].product, null)
assert.equal(withRemoverStep(evening, 'optional')[0].optional, true)
assert.equal(withRemoverStep(evening, null).length, 2)
const own = [{ key: 'remover', product: 'Balm' }, ...evening]
assert.equal(withRemoverStep(own, 'every').length, 3, 'no second remover')
assert.equal(withRemoverStep(own, 'optional')[0].optional, true)

// Dry skin gets a balm or an oil; others a micellar water.
assert.ok(removerPrefer({ skin_type: 'Dry' })({ name: 'Cleansing Balm' }))
assert.ok(removerPrefer({ skin_type: 'Oily' })({ name: 'Micellar Water' }))

// The short version keeps it.
assert.deepEqual(shortSteps([...own, { key: 'treatment', product: 'Retinol', night: 'retinoid' }]).map(s => s.key), ['remover', 'cleanser', 'moisturizer'])
console.log('removers: all checks passed')
