// Run with: npm run test:water
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findPatterns } from '../utils/skin-patterns.js'

const key = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

test('the journal links breakouts to days she drinks little water', () => {
  const entries = []
  const water = {}
  for (let i = 0; i < 30; i += 1) {
    const d = new Date(2026, 8, 1 + i, 9)
    const low = i % 5 === 0
    water[key(d)] = low ? 2 : 8
    // Breakouts the day after a low-water day only.
    const afterLow = (i - 1) % 5 === 0
    entries.push({ date: d.toISOString(), mood: afterLow ? 'bad' : 'good', skin_conditions: afterLow ? ['New pimple'] : [] })
  }
  const r = findPatterns({ entries, water, today: new Date(2026, 9, 5) })
  assert.ok(r.ready)
  assert.ok(r.patterns.some(p => p.factor === 'water' || /water/.test(p.text || '')), JSON.stringify(r.patterns.map(p => p.text || p.factor)))
})
