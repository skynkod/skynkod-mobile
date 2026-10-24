// Run with: npm run test:env
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { homeOf, climateShift, environmentState } from '../utils/environment-core.js'

const paris = { lat: 48.85, lon: 2.35, tempMax: 14, humidityMean: 75, uvMax: 2 }
const bali = { lat: -8.4, lon: 115.2, tempMax: 31, humidityMean: 80, uvMax: 11 }
const month = Array.from({ length: 20 }, (_, i) => ({ ...paris, date: `2026-10-${String(i + 1).padStart(2, '0')}` }))

test('home is where she spent most days', () => {
  assert.equal(Math.round(homeOf(month).tempMax), 14)
  assert.equal(homeOf(month.slice(0, 3)), null)
})

test('Paris to Bali: hotter and sunnier, lighter moisturizer and SPF', () => {
  const s = environmentState({ samples: [...month, { ...bali, date: '2026-10-24' }], today: { ...bali, date: '2026-10-24' } })
  assert.equal(s.kind, 'away')
  assert.deepEqual(s.changes, ['hotter', 'sunnier'])
  assert.ok(s.morning.some(a => a.includes('lighter')))
})

test('a trip to a similar climate shows nothing; back home says so once', () => {
  const lyon = { lat: 45.76, lon: 4.83, tempMax: 15, humidityMean: 72, uvMax: 2, date: '2026-10-24' }
  assert.equal(environmentState({ samples: month, today: lyon }), null)
  assert.equal(environmentState({ samples: month, today: { ...paris, date: '2026-10-25' }, wasAway: true }).kind, 'back')
  assert.equal(climateShift(paris, paris), null)
})
