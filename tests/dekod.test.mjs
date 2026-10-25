import assert from 'node:assert/strict'
import { scoreOf, averagePoints, compareScans, journalFrom, goalsFromDekod, checkInFromDekod, splitScans, startPoints } from '../utils/dekod-core.js'

const scan = (scores) => ({ result: { points: Object.fromEntries(Object.entries(scores).map(([k, v]) => [k, { score: v }])) } })

// Old scans (3 levels, "tone") still read.
assert.equal(scoreOf({ tone: { level: 'visible' } }, 'spots'), 7)
assert.equal(scoreOf({ redness: { level: 'none' } }, 'redness'), 1)
assert.equal(scoreOf({ redness: { score: null } }, 'redness'), null, 'not read stays not read')

// One odd photo doesn't make a trend; a clear, lasting change does.
const steady = [scan({ redness: 4 }), scan({ redness: 4 }), scan({ redness: 4 })]
assert.equal(compareScans(averagePoints(steady, 2), averagePoints([scan({ redness: 6 }), ...steady], 3)).find(r => r.key === 'redness').trend, 'same')
assert.equal(compareScans(averagePoints(steady, 2), averagePoints([scan({ redness: 1 }), scan({ redness: 1 }), scan({ redness: 2 })], 3)).find(r => r.key === 'redness').trend, 'better')

// The scan never sets the mood; Emergency only when clearly worse than her usual.
assert.equal(journalFrom({ blemishes: { score: 8 } }).mood, null)
assert.deepEqual(journalFrom({ blemishes: { score: 8 } }, [scan({ blemishes: 7 })]).issues, [], 'acne-prone skin as usual: no Emergency')
assert.deepEqual(journalFrom({ blemishes: { score: 8 } }, [scan({ blemishes: 3 })]).issues, ['breakout'])

// Shine is not a pores goal; blackheads are.
assert.deepEqual(goalsFromDekod({ shine: { score: 9 } }), [])
assert.deepEqual(goalsFromDekod({ blackheads: { score: 6 }, radiance: { score: 5 } }), ['pores', 'glow'])

// Rekod slows down only for a clear irritation.
assert.equal(checkInFromDekod({ redness: { score: 3 } }, { redness: { score: 4 } }), 'good')
assert.equal(checkInFromDekod({ redness: { score: 3 } }, { redness: { score: 7 } }), 'lot')
// Before and after never share a scan (audit 2): with 2 scans, a clear change shows.
const two = [{ ...scan({ redness: 1 }), created_at: '2026-10-20' }, { ...scan({ redness: 6 }), created_at: '2026-10-01' }]
const s2 = splitScans(two)
assert.equal(compareScans(s2.from, s2.to).find(r => r.key === 'redness').trend, 'better')
assert.equal(splitScans([two[0]]), null)

// Rekod's start: the first week's scans averaged.
const start = startPoints([{ ...scan({ redness: 6 }), created_at: '2026-10-03' }, { ...scan({ redness: 2 }), created_at: '2026-10-01' }], '2026-10-01')
assert.equal(start.redness.score, 4)
console.log('dekod: all checks passed')
