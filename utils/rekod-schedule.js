// Rekod's goals, week rhythm, check-ins and forecast: pure rules, no phone
// APIs, so tests/rekod.test.mjs can check every combination.

// ---------- Goals ----------

// Length = the realistic time for a visible result (rules, sections 5–11):
// skin renews itself about every 4 weeks (Lita, 2026-10-23).
export const GOALS = [
  // Honest timings (AAD; retinoid trials, rulebook section 1 bis, 2026-10-27).
  { id: 'clear', title: 'Clear skin', subtitle: 'Breakouts, blackheads', weeks: 12, results: 'First change around week 4 to 6', why: 'Breakouts usually start to improve after 4 to 6 weeks of steady care, and look clearer around week 12.' },
  { id: 'antiaging', title: 'Anti-aging', subtitle: 'Lines, firmness', weeks: 12, results: 'First change around week 12', why: 'Retinol works slowly: a first change around week 12, and fuller results after about 6 months of steady use.' },
  { id: 'spots', title: 'Dark spots', subtitle: 'Marks, uneven tone', weeks: 12, results: 'First change around week 8 to 12', why: 'Dark spots fade slowly, layer by layer: 8 to 12 weeks, with sunscreen every morning.' },
  { id: 'glow', title: 'Glow', subtitle: 'Dull, tired skin', weeks: 6, results: 'First change around week 3 or 4', why: 'Skin renews itself about every 4 weeks: in 6 weeks its surface looks smoother and brighter.' },
  { id: 'pores', title: 'Smaller pores', subtitle: 'Shine, texture', weeks: 12, results: 'First change around week 8', why: 'Pores look smaller once they stay unclogged, which takes 8 to 12 weeks.' },
  { id: 'calm', title: 'Calm skin', subtitle: 'Redness, reactivity', weeks: 4, results: 'First change within 2 to 4 weeks', why: 'A calmer, stronger skin barrier takes about one skin renewal cycle: 4 weeks.' },
  { id: 'hydration', title: 'Deep hydration', subtitle: 'Tight, dry skin', weeks: 4, results: 'First change within 1 to 2 weeks', why: 'Hydration improves fast; 4 weeks lets your skin barrier settle.' },
]
// Goals that work against each other: a reactive skin first repairs its
// barrier, with no exfoliation, while these goals rely on acids or retinol.
// Since the calm phase always comes first (4 weeks of barrier care, no acids,
// then the other goals' actives), "Calm skin" fits with every goal (audit
// 2026-10-25: it was blocked with some active goals and not others).
export const INCOMPATIBLE = {}
export const conflictWith = (picked, id) => picked.find(g => (INCOMPATIBLE[g] || []).includes(id)) || null
export const goalOf = id => GOALS.find(g => g.id === id) || GOALS[0]
export const goalsTitle = plan => (plan.goals?.length ? plan.goals : [plan.goal]).map(id => goalOf(id).title).join(' · ')
export const goalsOf = plan => (plan.goals?.length ? plan.goals : [plan.goal])
// The programme lasts as long as its longest goal; a calm-only plan for a skin
// that reacts often gets 2 more weeks; "Extend 4 weeks" adds to it.
export const planWeeks = (plan) => {
  const goals = goalsOf(plan)
  let weeks = Math.max(...goals.map(g => goalOf(g).weeks))
  if (goals.length === 1 && goals[0] === 'calm' && plan.sensitive) weeks = 6
  return weeks + (plan.extraWeeks || 0)
}
// With "Calm skin", the barrier comes first: calm rules for the first 4 weeks
// (the whole plan when calm is the only goal).
export const calmPhase = (plan, now = new Date()) => goalsOf(plan).includes('calm') && (goalsOf(plan).length === 1 || weekOf(plan, now) < 5)
// Why the plan lasts this long, from the goal that sets the length.
export const planWhy = plan => goalOf(goalsOf(plan).reduce((a, g) => (goalOf(g).weeks > goalOf(a).weeks ? g : a), goalsOf(plan)[0])).why

// ---------- The week (skin cycling) ----------

export const NIGHTS = {
  exfoliation: { label: 'Exfoliation night', short: 'Exfoliate', icon: 'refresh-outline' },
  retinoid: { label: 'Retinol night', short: 'Retinol', icon: 'moon-outline' },
  repair: { label: 'Repair night', short: 'Repair', icon: 'bandage-outline' },
  reset: { label: 'Reset night', short: 'Reset', icon: 'leaf-outline' },
}

// What the "retinoid" night really holds (audit 2026-10-25: it was called
// "Retinol night" even with azelaic acid or, in pregnancy, bakuchiol).
// Reactive skin and the calm phase: azelaic acid; pregnancy: a gentle treatment.
// 18–24 without an anti-ageing, clear-skin or spots goal: no retinol yet (Lita, 2026-10-27).
// Rosacea: azelaic acid for the whole plan, retinol only if her dermatologist agreed (rulebook M1).
// Pregnancy: azelaic acid, the best-studied active then (G2). A deeper skin tone
// with breakouts or marks: azelaic acid for 4 weeks, then retinol (D2).
export const treatmentOf = (plan, now = new Date()) => (calmPhase(plan, now) || ((plan.reactive || plan.deepStart) && weekOf(plan, now) < 5) || (plan.rosacea && !plan.retinolOk) || plan.pregnant ? 'azelaic' : plan.young ? 'gentle' : 'retinol')
const TREATMENT_NIGHT = {
  azelaic: { label: 'Azelaic acid night', short: 'Azelaic acid', name: 'azelaic acid' },
  gentle: { label: 'Gentle treatment night', short: 'Treatment', name: 'a gentle treatment' },
  retinol: { label: 'Retinol night', short: 'Retinol', name: 'retinol' },
}
// A night's label and icon, with the true name of the treatment night.
export const nightInfo = (plan, night, now = new Date()) => (night === 'retinoid' ? { ...NIGHTS.retinoid, ...TREATMENT_NIGHT[treatmentOf(plan, now)] } : NIGHTS[night])
// What the saved routine was built for: when it changes (a new week, a new
// level, a rest week ending), the routine is rebuilt.
// r2: the makeup remover step (2026-10-25) rebuilds routines made before it.
// r3: one new active every 2 weeks (2026-10-27): each new one rebuilds it.
// r4 (2026-11-09): eye, lip and neck steps follow her priorities per area, every Rekod rebuilds once.
// r5 (2026-11-10): retinol down to the neck, Lita's big lip tip (glycolic + panthenol).
// r6 (2026-11-11): the glycolic tip replaces the lip scrub; one short retinol sentence.
// The retinoid rung (g) is part of it: a step up rebuilds the routine with the new product.
export const rekodKey = (plan, now = new Date()) => `${weekPattern(plan).join(',')}|${treatmentOf(plan, now)}|${resting(plan, now) ? 'rest' : ''}|i${introStage(plan, now)}|g${retinoidRung(plan)}|r6`

// Nights per week, from the rules (exfoliation, retinoid, repair, reset).
const LEVELS = [
  { ex: 0, ret: 2, rep: 3, reset: 2 }, // 0: beginner, weeks 1–2
  { ex: 1, ret: 2, rep: 2, reset: 2 }, // 1: beginner, weeks 3–4
  { ex: 1, ret: 3, rep: 2, reset: 1 }, // 2: some experience
  { ex: 2, ret: 3, rep: 1, reset: 1 }, // 3: used to actives, balanced
]
const PRIORITY = {
  retinoid: { ex: 1, ret: 4, rep: 1, reset: 1 },
  exfoliation: { ex: 3, ret: 2, rep: 1, reset: 1 },
}
export const START = { none: 0, some: 1, used: 2 }
// Psoriasis too: a sensitive skin, no exfoliating acids (rulebook M5).
const REACTIVE_CONDITIONS = ['Rosacea', 'Eczema', 'Perioral dermatitis', 'Seborrheic dermatitis', 'Psoriasis']
export const isReactive = profile => (profile?.skin_conditions || []).some(c => REACTIVE_CONDITIONS.includes(c))
const TARGET = { none: 2, some: 2, used: 3 }

// The counts for a plan's current level, adapted to the goal and the skin.
const baseCounts = (plan) => {
  const top = plan.experience === 'used' && plan.level >= 3
  let c = { ...(top && plan.priority && PRIORITY[plan.priority] ? PRIORITY[plan.priority] : LEVELS[Math.min(plan.level, 3)]) }
  if (plan.sensitive) {
    // Never more than 2 exfoliation nights; the extra goes to repair.
    if (c.ex > 2) { c.rep += c.ex - 2; c.ex = 2 }
  }
  if (plan.reactive) {
    // Rosacea, eczema, perioral or seborrheic dermatitis: no exfoliating acids.
    c.rep += c.ex; c.ex = 0
  }
  if (plan.fragile || plan.cystic) {
    // Isotretinoin or a prescribed cream (her treatment is her active), or deep,
    // painful spots waiting for a dermatologist: no acids, no retinoid, only gentle care.
    c.rep += c.ex + c.ret; c.ex = 0; c.ret = 0
  }
  if (plan.eczema && (!plan.retinolOk || treatmentOf(plan) !== 'retinol')) {
    // Eczema: no treatment night, the moisturizer is the care (rulebook M2).
    c.rep += c.ret; c.ret = 0
  }
  if (calmPhase(plan)) {
    // No acids; the "retinoid" night becomes azelaic acid from week 3.
    c.rep += c.ex; c.ex = 0
    if (weekOf(plan) < 3) { c.rep += c.ret; c.ret = 0 } else if (c.ret > 2) { c.rep += c.ret - 2; c.ret = 2 }
  }
  if (goalsOf(plan).every(g => g === 'hydration')) {
    // No strong actives: repair and reset nights only.
    c = { ex: 0, ret: 0, rep: 4, reset: 3 }
  }
  // A beginner who only wants glow (or glow and hydration) starts without a retinoid.
  if (plan.experience === 'none' && goalsOf(plan).includes('glow') && goalsOf(plan).every(g => g === 'glow' || g === 'hydration')) { c.rep += c.ret; c.ret = 0 }
  // Nothing safe in the catalogue for a strong step: that night becomes a repair night.
  if ((plan.missing || []).includes('retinoid')) { c.rep += c.ret; c.ret = 0 }
  if ((plan.missing || []).includes('exfoliation')) { c.rep += c.ex; c.ex = 0 }
  // Rosacea or eczema with her dermatologist's OK: retinol 2 nights a week at most (rulebook M1–M2).
  if (plan.retinolOk && (plan.rosacea || plan.eczema) && treatmentOf(plan) === 'retinol' && c.ret > 2) { c.rep += c.ret - 2; c.ret = 2 }
  // Retinol after azelaic acid (reactive skin, or the end of the calm phase):
  // it restarts at 2 nights for 2 weeks (audit 2, 2026-10-25).
  if (treatmentOf(plan) === 'retinol' && (plan.reactive || plan.deepStart || goalsOf(plan).includes('calm')) && [5, 6].includes(weekOf(plan)) && c.ret > 2) { c.rep += c.ret - 2; c.ret = 2 }
  if (plan.extraReset) {
    // Last check-in said the skin reacted: one active night becomes a reset night.
    if (c.ret > 0) { c.ret -= 1; c.reset += 1 } else if (c.ex > 0) { c.ex -= 1; c.reset += 1 }
  }
  if (plan.maintenance && plan.maintenanceMode === 'simple') {
    // Simplified routine: one strong active, two evenings a week.
    // No repair serum in it: the other nights are cleanser and cream only.
    const strong = c.ret ? 'ret' : c.ex ? 'ex' : null
    c = { ex: strong === 'ex' ? 2 : 0, ret: strong === 'ret' ? 2 : 0, rep: 0, reset: strong ? 5 : 7 }
  } else if (plan.maintenance && plan.maintenanceMode !== 'asis') {
    // "Keep my results": the same products with fewer strong nights.
    if (c.ret > 1) { c.ret -= 1; c.rep += 1 }
    if (c.ex > 1) { c.ex -= 1; c.reset += 1 }
  }
  // Caps (audit 2026-10-25): 4 strong nights at most, 3 for a sensitive skin;
  // acids on 2 nights at most (1 for a sensitive skin, and 1 when there are 4
  // strong nights, so they can always sit apart).
  const maxStrong = plan.sensitive ? 3 : 4
  const maxEx = plan.sensitive ? 1 : 2
  if (c.ex > maxEx) { c.rep += c.ex - maxEx; c.ex = maxEx }
  // Too many: the acids go down to one night first, unless exfoliation is her
  // priority (then the retinoid nights go first).
  while (c.ex + c.ret > maxStrong) {
    if (plan.priority === 'exfoliation' && c.ret > 0) c.ret -= 1
    else if (c.ex > 1 || (c.ex > 0 && plan.priority === 'retinoid')) c.ex -= 1
    else if (c.ret > 0) c.ret -= 1
    else c.ex -= 1
    c.rep += 1
  }
  // 4 strong nights only fit with one acid night: exfoliation as her priority
  // keeps its 2 acid nights and gives up a retinoid night instead.
  if (c.ex + c.ret === 4 && c.ex > 1) {
    if (plan.priority === 'exfoliation') { c.ret -= 1; c.rep += 1 } else { c.rep += c.ex - 1; c.ex = 1 }
  }
  // Perioral dermatitis: as few products as possible, every night a reset night (rulebook M3).
  if (plan.perioral) c = { ex: 0, ret: 0, rep: 0, reset: 7 }
  // A strong reaction: a week of rest, repair and reset nights only.
  else if (resting(plan)) c = { ex: 0, ret: 0, rep: 4, reset: 3 }
  // Two weeks back after a rest week (audit 3): first no acids and 2 strong
  // nights at most, then 3 strong nights at most with one acid night.
  else if (plan.restUntil) {
    const since = new Date() - new Date(plan.restUntil)
    if (since < 7 * 86400000) {
      c.rep += c.ex; c.ex = 0
      if (c.ret > 2) { c.rep += c.ret - 2; c.ret = 2 }
    } else if (since < 14 * 86400000) {
      if (c.ex > 1) { c.rep += c.ex - 1; c.ex = 1 }
      while (c.ex + c.ret > 3) { if (c.ret > 0) c.ret -= 1; else c.ex -= 1; c.rep += 1 }
    }
  }
  return c
}
export const resting = (plan, now = new Date()) => !!plan.restUntil && now < new Date(plan.restUntil)
// Her last check-in said the skin reacted, or she came back from a rest week less than 2 weeks ago.
const reacting = (plan, now = new Date()) => !!plan.extraReset || (!!plan.restUntil && now - new Date(plan.restUntil) < 14 * 86400000)

// One new strong active every 2 weeks, the most useful first (rulebook R1, Lita
// 2026-10-27): the treatment night, then benzoyl peroxide (red spots), then
// vitamin C, then exfoliation. Gentle actives (niacinamide, peptides,
// hyaluronic acid) don't count. → { treatment, benzoyl, vitc, exfoliation }: the week each may start.
export const introWeeks = (plan) => {
  // Does this plan ever have a treatment night? The same plan at full strength.
  const full = baseCounts({ ...plan, level: 3, levelSince: 1, startedAt: new Date(Date.now() - 9 * 7 * 86400000).toISOString(), restUntil: null, extraReset: false, maintenance: false })
  const order = [full.ret > 0 && 'treatment', plan.inflamed && 'benzoyl', plan.vitc && 'vitc', 'exfoliation'].filter(Boolean)
  return Object.fromEntries(order.map((k, i) => [k, 1 + 2 * i]))
}
// How many of them have started: a new one rebuilds the routine.
export const introStage = (plan, now = new Date()) => Object.values(introWeeks(plan)).filter(w => weekOf(plan, now) >= w).length

export const nightCounts = (plan, now = new Date()) => {
  const c = baseCounts(plan)
  // Exfoliation waits its turn; its first 2 weeks, one night that takes a
  // treatment night's place, so the week never jumps up at once.
  const since = weekOf(plan, now) - introWeeks(plan).exfoliation
  if (c.ex && since < 0) { c.rep += c.ex; c.ex = 0 }
  if (c.ex && since >= 0 && since < 2) {
    if (c.ex > 1) { c.rep += c.ex - 1; c.ex = 1 }
    if (c.ret > 1) { c.ret -= 1; c.rep += 1 }
  }
  // 3 strong actives at most; 2 for a sensitive skin or after a reaction (rulebook
  // R10): with red spots, retinoid and benzoyl peroxide stay (the proven pair).
  if (c.ex && c.ret && plan.inflamed && (plan.sensitive || reacting(plan, now))) { c.rep += c.ex; c.ex = 0 }
  // Her own choice (Lita, 2026-10-27, rulebook S3): more retinol nights than the 4
  // we advise, up to 7. Not for a sensitive skin (never two strong nights in a row
  // there), and never while her skin reacts.
  if (plan.extraRet && retinolChoice(plan, now) && c.ret > 0) {
    let add = Math.min(plan.extraRet, 7 - c.ret - c.ex)
    while (add > 0) { if (c.reset > 0) c.reset -= 1; else c.rep -= 1; c.ret += 1; add -= 1 }
    // An exfoliation night needs a free night on each side: it steps back when there's no room.
    while (c.ex && c.ret + c.ex * 3 > 7) { c.ex -= 1; c.rep += 1 }
  }
  return c
}
// Whether she can add retinol nights herself right now.
// ---------- Retinoid strength (Lita, 2026-11-10) ----------
// The ladder, fast towards retinal: a low retinol → a gentle retinal → a stronger
// retinal → her dermatologist (tretinoin is on prescription only). A skin that
// isn't sensitive starts with a gentle retinal, even a beginner; one used to
// retinoids with the stronger retinal; a sensitive skin with a low retinol.
export const RETINOID_RUNGS = ['a low retinol', 'a gentle retinal', 'a stronger retinal', 'your dermatologist']
export const startRung = plan => (plan.sensitive ? 0 : plan.experience === 'used' ? 2 : 1)
export const retinoidRung = plan => plan.retinoidRung ?? startRung(plan)
// Ready for the next rung: 8 weeks at her top pace, every check-in since then
// "All good". "Not now" asks again 4 weeks later.
export const stepUpReady = (plan, now = new Date()) => {
  if (!plan || treatmentOf(plan, now) !== 'retinol' || plan.pregnant || resting(plan, now) || reacting(plan, now)) return false
  if (retinoidRung(plan) >= RETINOID_RUNGS.length - 1 || plan.level < (TARGET[plan.experience] ?? 2)) return false
  const since = plan.levelSince ?? 1
  const week = weekOf(plan, now)
  if (week - since < 8 || (plan.stepUpLater && week < plan.stepUpLater)) return false
  return (plan.checkins || []).filter(c => c.week > since).every(c => c.answer === 'good')
}
// She said yes: the next product, and back to 2 retinoid nights a week (level 1),
// climbing again from there. Seeing her dermatologist changes no product.
export const applyStepUp = (plan, now = new Date()) => {
  const rung = retinoidRung(plan) + 1
  const product = rung < RETINOID_RUNGS.length - 1
  return { ...plan, retinoidRung: rung, stepUpLater: null, ...(product ? { level: Math.min(plan.level, 1), levelSince: weekOf(plan, now), extraRet: 0 } : {}) }
}
export const stepUpLater = (plan, now = new Date()) => ({ ...plan, stepUpLater: weekOf(plan, now) + 4 })

export const retinolChoice = (plan, now = new Date()) => treatmentOf(plan, now) === 'retinol' && !plan.sensitive && !plan.pregnant && !resting(plan, now) && !reacting(plan, now)

// Seven nights, Monday first (audit 2026-10-25). Hard rules, checked on
// every combination by tests/rekod.test.mjs:
//   - an exfoliation night never touches another strong night, Sunday to
//     Monday included (so never acids the night after retinol);
//   - a sensitive skin never has two strong nights in a row;
//   - otherwise only two retinoid nights may follow each other.
// Among the placements allowed, the most spread out wins; ties go to the
// earliest, so the week is always the same for the same plan.
const near = (a, b) => (a - b + 7) % 7 === 1 || (b - a + 7) % 7 === 1
const placements = (ex, ret, sensitive) => {
  const n = ex + ret
  let best = null
  const combos = []
  const pick = (start, chosen) => {
    if (chosen.length === n) { combos.push([...chosen]); return }
    for (let i = start; i < 7; i += 1) { chosen.push(i); pick(i + 1, chosen); chosen.pop() }
  }
  pick(0, [])
  for (const slots of combos) {
    // Which of the chosen slots are exfoliation nights: try each split.
    const splits = []
    const choose = (start, chosen) => {
      if (chosen.length === ex) { splits.push([...chosen]); return }
      for (let i = start; i < slots.length; i += 1) { chosen.push(slots[i]); choose(i + 1, chosen); chosen.pop() }
    }
    choose(0, [])
    for (const exNights of splits) {
      const retNights = slots.filter(d => !exNights.includes(d))
      const ok = exNights.every(e => slots.every(o => o === e || !near(e, o)))
        && (!sensitive || retNights.every(r => retNights.every(o => o === r || !near(r, o))))
      if (!ok) continue
      const pairs = retNights.filter(r => retNights.some(o => near(r, o))).length
      const gaps = slots.map((d, i) => (slots[(i + 1) % slots.length] - d + 7) % 7 || 7)
      const score = [pairs, -Math.min(...gaps)]
      if (!best || score[0] < best.score[0] || (score[0] === best.score[0] && score[1] < best.score[1])) best = { score, exNights, retNights }
    }
  }
  return best
}

export const weekPattern = (plan) => {
  const c = nightCounts(plan)
  const week = Array(7).fill(null)
  const placed = placements(c.ex, c.ret, plan.sensitive)
  if (placed) {
    placed.exNights.forEach(d => { week[d] = 'exfoliation' })
    placed.retNights.forEach(d => { week[d] = 'retinoid' })
  }
  // Gentle nights: repair right after a strong night, otherwise whichever is left most.
  let rep = c.rep + (placed ? 0 : c.ex + c.ret), reset = c.reset
  for (let i = 0; i < 7; i += 1) {
    if (week[i]) continue
    const afterStrong = week[(i + 6) % 7] === 'retinoid' || week[(i + 6) % 7] === 'exfoliation'
    const useRepair = rep > 0 && (afterStrong || !reset || rep >= reset)
    if (useRepair) { week[i] = 'repair'; rep -= 1 } else { week[i] = 'reset'; reset -= 1 }
  }
  // "Short version tonight" pauses Rekod one evening (short-evening-core.js):
  // each pause moves the week one night later. The rules above go round the
  // week (Sunday touches Monday), so they still hold.
  const shift = ((plan.dayShift || 0) % 7 + 7) % 7
  return shift ? week.map((_, i) => week[(i - shift + 7) % 7]) : week // index 0 = Monday … 6 = Sunday
}

export const JS_DAY = [1, 2, 3, 4, 5, 6, 0] // Monday-first index → Date.getDay()
export const tonightNight = (plan, date = new Date()) => weekPattern(plan)[JS_DAY.indexOf(date.getDay())]

// ---------- Weeks and check-ins ----------

export const weekOf = (plan, now = new Date()) =>
  Math.max(1, Math.floor((now - new Date(plan.startedAt)) / (7 * 86400000)) + 1)

export const checkInDue = (plan, now = new Date()) => {
  const last = plan.checkins?.[plan.checkins.length - 1]
  // After the programme: a short check every 4 weeks.
  if (plan.maintenance) return now - new Date(Math.max(new Date(plan.maintenanceSince || plan.startedAt), last ? new Date(last.at) : 0)) >= 28 * 86400000
  return weekOf(plan, now) > 1 && (!last || last.week < weekOf(plan, now))
}

// "good": move up a level · "little": stay · "lot": go back a level and rest.
// At least 2 weeks at a level before the next one (audit 2026-10-25: a beginner
// reached 4 strong nights by week 3). "A lot" also rests the skin for 7 days.
// During a purge ("Purging or a reaction?"), "all good" keeps the level: the
// skin isn't pushed harder while it purges (Lita, 2026-10-25).
export const applyCheckIn = (plan, answer, now = new Date(), { hold = false } = {}) => {
  const week = weekOf(plan, now)
  const since = plan.levelSince ?? 1
  let level = plan.level
  let levelSince = since
  // In maintenance the pace stays: "all good" never adds strong nights (audit 3).
  if (answer === 'good' && !hold && !plan.maintenance && week - since >= 2) { level = Math.min(level + 1, TARGET[plan.experience] ?? 2); if (level !== plan.level) levelSince = week }
  if (answer === 'lot') { level = Math.max(level - 1, 0); levelSince = week }
  return {
    ...plan,
    level,
    levelSince,
    extraReset: answer !== 'good',
    // Her skin reacted: back to the retinol nights we advise, and we tell her why.
    extraRet: answer === 'good' ? plan.extraRet || 0 : 0,
    extraRetDropped: answer !== 'good' && !!plan.extraRet,
    restUntil: answer === 'lot' ? new Date(now.getTime() + 7 * 86400000).toISOString() : plan.restUntil || null,
    checkins: [...(plan.checkins || []), { week, answer, at: now.toISOString() }],
  }
}

// ---------- The whole programme, week by week ----------
// The path if every weekly check-in says "All good": the level goes up one
// step a week until the target, and the nights follow the same rules as the
// real plan. Check-ins can slow it down, so it is a forecast, not a promise.
const PHASES = ['Gentle start', 'Building up', 'Steady rhythm', 'Full strength']
export const projectRekod = (plan, now = new Date()) => {
  const current = weekOf(plan, now)
  const target = TARGET[plan.experience] ?? 2
  const weeks = []
  let previous = null
  let previousTreatment = null
  // Same pace as the check-ins: at least 2 weeks at a level.
  let lvl = plan.level
  let since = plan.levelSince ?? 1
  for (let w = 1; w <= planWeeks(plan); w += 1) {
    if (w > current && w - since >= 2 && lvl < target) { lvl += 1; since = w }
    const level = w <= current ? plan.level : lvl
    // The same plan, as it would be in week w.
    const startedAt = new Date(now.getTime() - (w - 1) * 7 * 86400000).toISOString()
    // A rest week only shows where it is (this week).
    const at = { ...plan, level, startedAt, extraReset: w === current ? plan.extraReset : false, restUntil: w === current ? plan.restUntil : null }
    const counts = nightCounts(at)
    const pattern = weekPattern(at)
    const treatment = treatmentOf(at, now)
    const azelaic = treatment === 'azelaic'
    const name = TREATMENT_NIGHT[treatment].name
    const Name = name.charAt(0).toUpperCase() + name.slice(1)
    const changes = []
    if (previous) {
      if (previousTreatment !== treatment && counts.ret) changes.push(`${TREATMENT_NIGHT[previousTreatment].name.charAt(0).toUpperCase() + TREATMENT_NIGHT[previousTreatment].name.slice(1)} makes way for ${name}`)
      else if (counts.ret > previous.ret) changes.push(previous.ret ? `${Name}: ${counts.ret} nights` : `New: ${name} comes in (${counts.ret} nights)`)
      if (counts.ex > previous.ex) changes.push(previous.ex ? `Exfoliation: ${counts.ex} nights` : `New: exfoliation comes in (${counts.ex} night${counts.ex > 1 ? 's' : ''})`)
    } else {
      changes.push('Your routine starts gently')
    }
    weeks.push({ week: w, level, phase: PHASES[Math.min(level, 3)], counts, pattern, azelaic, treatment, changes, past: w < current, now: w === current })
    previous = counts
    previousTreatment = treatment
  }
  return weeks
}

// The same plan seen from another day (for reminders planned ahead): its weeks,
// rest week and treatment as they will be on `date`, without new check-ins.
export const shiftedTo = (plan, date, now = new Date()) => {
  const gap = date - now
  const shift = iso => (iso ? new Date(new Date(iso).getTime() - gap).toISOString() : iso)
  return { ...plan, startedAt: shift(plan.startedAt), restUntil: shift(plan.restUntil) }
}
export const nightOnDate = (plan, date, now = new Date()) => weekPattern(shiftedTo(plan, date, now))[JS_DAY.indexOf(date.getDay())]
export const treatmentOnDate = (plan, date, now = new Date()) => treatmentOf(shiftedTo(plan, date, now), now)

// The morning (Lita, 2026-10-27, rulebook B4): no cleanser, a mist of thermal water,
// except for oily or breakout-prone skin (NICE: a gentle cleanser twice a day).
export const morningCleanse = profile => profile.skin_type === 'Oily' || (profile.skin_concerns || []).includes('Acne') || (profile.acne_types || []).length > 0
export const isThermal = p => /eau thermale|thermal (spring )?water/i.test(p?.name || '')

// A cream that suits her skin: light for oily skin or sweat, rich for dry skin or menopause.
// The plan's precautions, from her profile (rulebook section 6): pure, so the tests read it too.
export const planPrecautions = (profile = {}) => {
  const conditions = profile.skin_conditions || []
  return {
    rosacea: conditions.includes('Rosacea'),
    eczema: conditions.includes('Eczema'),
    perioral: conditions.includes('Perioral dermatitis'),
    retinolOk: !!profile.retinolOk,
    cystic: !!profile.cystic,
    photosensitive: !!profile.photosensitive,
    isotretinoin: !!profile.isotretinoin,
    // A deeper skin tone (swatches 4 to 6) with breakouts or marks: azelaic acid first (rulebook D2).
    deepStart: profile.tone != null && profile.tone >= 3 && (profile.skin_concerns || []).some(c => c === 'Acne' || c === 'Dark spots'),
  }
}
const LIGHT = /\b(gel|fluid|water|aqua|light|lightweight|matte|mattifying|oil[- ]free)\b/i
const RICH = /\b(cream|crème|creme|balm|baume|rich|riche|nourishing|nourrissant)\b/i
// A rich cream or balm (not a light texture): never around eyes prone to milia.
export const isRich = p => RICH.test(p?.name || '') && !LIGHT.test(p?.name || '')
export const textureFor = (profile = {}) => {
  // Isotretinoin dries every skin: a richer cream (rulebook X1). Perioral dermatitis: light only (M3).
  if (profile.isotretinoin) return p => RICH.test(p.name || '') && !LIGHT.test(p.name || '')
  if ((profile.skin_conditions || []).includes('Perioral dermatitis')) return p => LIGHT.test(p.name || '')
  if (['Oily', 'Combination'].includes(profile.skin_type) || profile.sweat) return p => LIGHT.test(p.name || '')
  if (profile.skin_type === 'Dry' || ['during', 'after'].includes(profile.menopause)) return p => RICH.test(p.name || '') && !LIGHT.test(p.name || '')
  return null
}
