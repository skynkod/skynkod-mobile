import assert from 'node:assert/strict'
import { GOALS, weekPattern, nightCounts, applyCheckIn, projectRekod, nightInfo, treatmentOf } from '../utils/rekod-schedule.js'

// Every goal, experience, level, skin, priority and week (Rekod audit 2026-10-25).
const strong = n => n === 'retinoid' || n === 'exfoliation'
const near = (w, i) => [w[(i + 6) % 7], w[(i + 1) % 7]]
let checked = 0
for (const goal of GOALS.map(g => g.id)) for (const experience of ['none', 'some', 'used']) for (const level of [0, 1, 2, 3])
  for (const sensitive of [false, true]) for (const reactive of [false, true]) for (const priority of [null, 'retinoid', 'exfoliation'])
    for (const week of [1, 3, 5, 9]) for (const pregnant of [false, true]) for (const missing of [[], ['exfoliation'], ['retinoid']]) {
      if (reactive && !sensitive) continue
      const plan = { goal, goals: [goal], experience, level, sensitive, reactive, priority, pregnant, missing, startedAt: new Date(Date.now() - (week - 1) * 7 * 864e5 - 3600e3).toISOString() }
      const c = nightCounts(plan)
      const w = weekPattern(plan)
      const tag = JSON.stringify({ goal, experience, level, sensitive, reactive, priority, week, missing })
      assert.equal(c.ex + c.ret + c.rep + c.reset, 7, tag)
      assert.ok(Object.values(c).every(v => v >= 0), tag)
      assert.ok(w.every(Boolean), `empty night ${tag}`)
      assert.equal(w.filter(n => n === 'exfoliation').length, c.ex, tag)
      assert.equal(w.filter(n => n === 'retinoid').length, c.ret, tag)
      assert.ok(c.ex + c.ret <= (sensitive ? 3 : 4), `too many strong nights ${tag}`)
      w.forEach((n, i) => {
        if (n === 'exfoliation') assert.ok(!near(w, i).some(strong), `acids next to a strong night ${tag} ${w}`)
        if (sensitive && strong(n)) assert.ok(!near(w, i).some(strong), `two strong nights in a row on sensitive skin ${tag} ${w}`)
      })
      if (missing.includes('exfoliation')) assert.equal(c.ex, 0, `night with no product ${tag}`)
      if (missing.includes('retinoid')) assert.equal(c.ret, 0, `night with no product ${tag}`)
      // The treatment night says what it really is.
      if (c.ret) {
        const t = treatmentOf(plan)
        if (pregnant && t !== 'azelaic') assert.equal(t, 'gentle', `retinol in pregnancy ${tag}`)
        assert.ok(!/retinol/i.test(nightInfo(plan, 'retinoid').label) || t === 'retinol', tag)
      }
      checked++
    }

// Pace: 2 weeks at a level at least; "a lot" rests the skin for 7 days.
const start = { goal: 'clear', goals: ['clear'], experience: 'none', level: 0, levelSince: 1, startedAt: new Date(Date.now() - 7 * 864e5 - 3600e3).toISOString() }
const wk2 = applyCheckIn(start, 'good')
assert.equal(wk2.level, 0, 'no level up after one week')
const wk3 = applyCheckIn({ ...wk2, startedAt: new Date(Date.now() - 14 * 864e5 - 3600e3).toISOString() }, 'good')
assert.equal(wk3.level, 1)
const rest = applyCheckIn({ ...wk3, level: 2 }, 'lot')
assert.deepEqual(nightCounts(rest), { ex: 0, ret: 0, rep: 4, reset: 3 }, 'a rest week after a strong reaction')
assert.equal(rest.level, 1)

// The forecast never promises retinol in pregnancy.
const preg = projectRekod({ goal: 'spots', goals: ['spots'], experience: 'some', level: 1, pregnant: true, startedAt: new Date().toISOString() })
assert.ok(preg.every(w => !w.changes.some(c => /retinol/i.test(c))))
console.log(`rekod: ${checked} plans checked`)

// Audit 2: retinol restarts at 2 nights after azelaic acid; the simple routine has no repair nights.
const restart = nightCounts({ goal: 'antiaging', goals: ['antiaging'], experience: 'used', level: 3, sensitive: true, reactive: true, startedAt: new Date(Date.now() - 4 * 7 * 864e5 - 3600e3).toISOString() })
assert.ok(restart.ret <= 2, 'retinol restarts gently in week 5')
const simple = nightCounts({ goal: 'spots', goals: ['spots'], experience: 'used', level: 3, maintenance: true, maintenanceMode: 'simple', startedAt: new Date().toISOString() })
assert.equal(simple.rep, 0)
assert.equal(simple.ret + simple.ex, 2)
console.log('rekod audit 2: checks passed')
