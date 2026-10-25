import assert from 'node:assert/strict'
import { findPatterns } from '../utils/skin-patterns.js'
import { tipOfTheMoment } from '../utils/daily-tips.js'

// 20 mornings: short nights (5 h) are followed by breakouts, good nights (8 h) by good skin.
const entries = []
for (let i = 0; i < 20; i++) {
  const short = i % 4 === 0
  const date = new Date(2026, 8, 1 + i, 12)
  const next = i % 4 === 1
  entries.push({ date, mood: short || next ? 'bad' : 'good', skin_conditions: next ? ['New pimple'] : [], sleep_hours: short ? 5 : 8, sleep_quality: short ? 'bad' : 'good' })
}
const found = findPatterns({ entries, today: new Date(2026, 8, 25) })
assert.equal(found.ready, true)
assert.ok(found.patterns.some(p => p.factor === 'sleep'), 'sleep is linked to her skin')

// Tips: by day water/sun, at night sleep; a short night comes first in the evening.
assert.match(tipOfTheMoment({ period: 'evening', sleptHours: 5 }).text, /slept/)
assert.ok(tipOfTheMoment({ period: 'day' }).text.length > 0)
console.log('sleep: 3 checks passed')
