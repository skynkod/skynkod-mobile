// Rekod: the premium programme that builds a routine of proven actives for one
// goal, then introduces them week after week ("skin cycling").
//
// Everything here follows docs/rekod/regles-rekod.html, written to be reviewed
// by a dermatologist or pharmacist. Deterministic rules only: no AI decides.

import { supabase } from './supabase'
import { findIngredients, productMatch, isUnsuitable } from './ingredients-guide'
import { productsByCategory, getMyProducts } from './catalog'
import { saveRoutine } from './routines-service'
import { getUserProfile } from './supabase'
import { engineProfile } from './skin-quiz'
import { archiveCurrentRoutines } from './seasons'

// ---------- Goals ----------

export const GOALS = [
  { id: 'clear', title: 'Clear skin', subtitle: 'Breakouts, blackheads', weeks: 12, results: 'First results around week 6' },
  { id: 'antiaging', title: 'Anti-aging', subtitle: 'Lines, firmness', weeks: 12, results: 'First results around week 8' },
  { id: 'spots', title: 'Dark spots', subtitle: 'Marks, uneven tone', weeks: 12, results: 'First results around week 8' },
  { id: 'glow', title: 'Glow', subtitle: 'Dull, tired skin', weeks: 8, results: 'First results around week 3' },
  { id: 'pores', title: 'Smaller pores', subtitle: 'Shine, texture', weeks: 12, results: 'First results around week 8' },
  { id: 'calm', title: 'Calm skin', subtitle: 'Redness, reactivity', weeks: 8, results: 'First results around week 3' },
  { id: 'hydration', title: 'Deep hydration', subtitle: 'Tight, dry skin', weeks: 6, results: 'First results within 2 weeks' },
]
export const goalOf = id => GOALS.find(g => g.id === id) || GOALS[0]
export const goalsTitle = plan => (plan.goals?.length ? plan.goals : [plan.goal]).map(id => goalOf(id).title).join(' · ')

// ---------- The week (skin cycling) ----------

export const NIGHTS = {
  exfoliation: { label: 'Exfoliation night', short: 'Exfoliate', icon: 'sparkles-outline' },
  retinoid: { label: 'Retinol night', short: 'Retinol', icon: 'moon-outline' },
  repair: { label: 'Repair night', short: 'Repair', icon: 'bandage-outline' },
  reset: { label: 'Reset night', short: 'Reset', icon: 'leaf-outline' },
}

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
const START = { none: 0, some: 1, used: 2 }
const REACTIVE_CONDITIONS = ['Rosacea', 'Eczema', 'Perioral dermatitis', 'Seborrheic dermatitis']
export const isReactive = profile => (profile?.skin_conditions || []).some(c => REACTIVE_CONDITIONS.includes(c))
const TARGET = { none: 2, some: 2, used: 3 }

// The counts for a plan's current level, adapted to the goal and the skin.
export const nightCounts = (plan) => {
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
  if (plan.fragile) {
    // Isotretinoin or a prescription skin cream: no acids, no retinoid, only gentle care.
    c.rep += c.ex + c.ret; c.ex = 0; c.ret = 0
  }
  if (plan.goal === 'calm') {
    // No acids; the "retinoid" night becomes azelaic acid from week 3.
    c.rep += c.ex; c.ex = 0
    if (weekOf(plan) < 3) { c.rep += c.ret; c.ret = 0 } else if (c.ret > 2) { c.rep += c.ret - 2; c.ret = 2 }
  }
  if (plan.goal === 'hydration') {
    // No strong actives: repair and reset nights only.
    c = { ex: 0, ret: 0, rep: 4, reset: 3 }
  }
  if (plan.goal === 'glow' && plan.experience === 'none') { c.rep += c.ret; c.ret = 0 }
  if (plan.extraReset) {
    // Last check-in said the skin reacted: one active night becomes a reset night.
    if (c.ret > 0) { c.ret -= 1; c.reset += 1 } else if (c.ex > 0) { c.ex -= 1; c.reset += 1 }
  }
  return c
}

// Seven nights, Monday first. Strong nights are spread out; a reactive skin
// never gets two strong nights in a row.
export const weekPattern = (plan) => {
  const c = nightCounts(plan)
  const strong = [...Array(c.ret).fill('retinoid'), ...Array(c.ex).fill('exfoliation')]
  // Alternate exfoliation and retinoid among the strong nights.
  const ordered = []
  let r = strong.filter(s => s === 'retinoid'), e = strong.filter(s => s === 'exfoliation')
  while (r.length || e.length) {
    if (e.length && (ordered.length % 2 === 0 || !r.length)) ordered.push(e.shift())
    else if (r.length) ordered.push(r.shift())
  }
  const week = Array(7).fill(null)
  const n = ordered.length
  // A reactive skin gets a gentle night between two strong ones (Mon, Wed, Fri, Sun).
  const spaced = plan.sensitive && n <= 4 ? [0, 2, 4, 6] : null
  ordered.forEach((night, i) => {
    let pos = spaced ? spaced[i] : Math.round((i * 7) / Math.max(n, 1))
    while (week[pos % 7]) pos += 1
    week[pos % 7] = night
  })
  // Gentle nights: repair right after a strong night, otherwise whichever is left most.
  let rep = c.rep, reset = c.reset
  for (let i = 0; i < 7; i += 1) {
    if (week[i]) continue
    const afterStrong = i > 0 && (week[i - 1] === 'retinoid' || week[i - 1] === 'exfoliation')
    const useRepair = rep > 0 && (afterStrong || !reset || rep >= reset)
    if (useRepair) { week[i] = 'repair'; rep -= 1 } else { week[i] = 'reset'; reset -= 1 }
  }
  return week // index 0 = Monday … 6 = Sunday
}

const JS_DAY = [1, 2, 3, 4, 5, 6, 0] // Monday-first index → Date.getDay()
export const tonightNight = (plan, date = new Date()) => weekPattern(plan)[JS_DAY.indexOf(date.getDay())]

// ---------- Weeks and check-ins ----------

export const weekOf = (plan, now = new Date()) =>
  Math.max(1, Math.floor((now - new Date(plan.startedAt)) / (7 * 86400000)) + 1)

export const checkInDue = (plan, now = new Date()) => {
  const last = plan.checkins?.[plan.checkins.length - 1]
  return weekOf(plan, now) > 1 && (!last || last.week < weekOf(plan, now))
}

// "good": move up a level · "little": stay · "lot": go back a level and rest.
export const applyCheckIn = (plan, answer, now = new Date()) => {
  const week = weekOf(plan, now)
  let level = plan.level
  if (answer === 'good') level = Math.min(level + 1, TARGET[plan.experience] ?? 2)
  if (answer === 'lot') level = Math.max(level - 1, 0)
  return {
    ...plan,
    level,
    extraReset: answer !== 'good',
    checkins: [...(plan.checkins || []), { week, answer, at: now.toISOString() }],
  }
}

// ---------- Choosing products ----------

// `ids` present in the product; for an active, high enough in the list to matter
// (the tail of an INCI list is under ~1%).
const has = (product, ids, maxPos = 99) => findIngredients(product).some(f => ids.includes(f.entry.id) && f.pos <= maxPos)
const STRONG = ['retinol', 'glycolic', 'salicylic', 'lactic', 'mandelic', 'benzoyl', 'azelaic']
const harsh = p => has(p, ['sls', 'scrub', 'alcohol', 'fragrance', 'essentialoils']) || /scrub|exfoli|peel/i.test(p?.name || '')

// What each step looks for, per goal. `want` = guide ingredient ids.
const morningSerum = { clear: ['niacinamide'], antiaging: ['vitaminc', 'peptides'], spots: ['vitaminc', 'niacinamide', 'arbutin'], glow: ['vitaminc'], pores: ['niacinamide'], calm: ['niacinamide', 'centella', 'panthenol'], hydration: ['hyaluronic', 'polyglutamic'] }
const exfoliantFor = (goal, sensitive) => (sensitive ? ['mandelic', 'pha', 'lactic'] : goal === 'clear' || goal === 'pores' ? ['salicylic'] : ['glycolic', 'lactic'])
const repairFor = { antiaging: ['peptides'], spots: ['txa', 'arbutin', 'niacinamide'], calm: ['ceramides', 'panthenol', 'centella'], hydration: ['hyaluronic', 'ceramides'] }

// A paid programme only proposes products that are 100% safe for this person:
// a full ingredient list, and nothing the engine flags for her skin (fungal
// acne triggers, rosacea triggers, pore-cloggers for acne, allergies,
// pregnancy…). If nothing qualifies, the step stays empty rather than unsafe.
export const isSafeFor = (product, profile) => {
  if (!product?.ingredients_text) return false
  const m = productMatch(product, profile || {})
  return !m.partial && !isUnsuitable(m) && !m.avoid.length && !(m.triggers || []).length && !(m.care || []).length
}

// What makes a product less than 100% safe for this person, in plain words.
// level: 'watch' (small amount or mild) · 'patch' (worth a patch test).
export const safetyIssues = (product, profile) => {
  const m = productMatch(product, profile || {})
  return (m.triggers || []).filter(t => t.level !== 'avoid').map(t => ({ level: t.level, text: t.text, detail: t.detail || '' }))
}

// Second choice when nothing is 100% safe: never a product the engine says to
// avoid, never one with an unknown ingredient list; only mild, explained issues.
const isAcceptable = (product, profile) => {
  if (!product?.ingredients_text) return false
  const m = productMatch(product, profile || {})
  const personal = (m.care || []).filter(c => !(m.triggers || []).includes(c))
  return !m.partial && !isUnsuitable(m) && !personal.length && (m.triggers || []).every(t => t.level === 'watch' || t.level === 'patch')
}

const pickFrom = (candidates, profile, { want = [], avoidHarsh = false, noStrong = false, exclude = [], prefer = null, strictOnly = false } = {}) => {
  const base = candidates.filter(p => p && !exclude.includes(p.id) && (!avoidHarsh || !harsh(p)) && (!noStrong || !has(p, STRONG, 12)))
  // The active must be one of the first ingredients, not a trace.
  const withActive = want.length ? base.filter(p => has(p, want, 8)) : base
  const rank = p => (productMatch(p, profile || {}).score || 0) + (prefer && prefer(p) ? 100 : 0)
  const best = list => list.map(p => ({ p, score: rank(p) })).sort((a, b) => b.score - a.score)[0]?.p || null
  const safe = best(withActive.filter(p => isSafeFor(p, profile)))
  if (safe || strictOnly) return safe
  // Nothing 100% safe: the mildest acceptable one, fewest issues first.
  const ok = withActive.filter(p => isAcceptable(p, profile))
  return ok.map(p => ({ p, n: safetyIssues(p, profile).reduce((a, i) => a + (i.level === 'patch' ? 3 : 1), 0), score: rank(p) }))
    .sort((a, b) => a.n - b.n || b.score - a.score)[0]?.p || null
}

// The user's own products first, then the catalogue.
const chooser = async (userId, profile) => {
  const mine = (await getMyProducts(userId).catch(() => [])).filter(r => r.status !== 'to_buy' && r.product).map(r => r.product)
  const cache = {}
  const used = []
  return async (categories, opts = {}) => {
    // Each treatment step gets its own product (the same serum isn't both the treatment and the repair).
    const o = { ...opts, exclude: opts.unique ? used : [] }
    const own = pickFrom(mine.filter(p => categories.includes(p.category)), profile, o)
    let found = own
    if (!found) {
      const key = categories.join('|')
      cache[key] = cache[key] || await productsByCategory(categories, 200).catch(() => [])
      found = pickFrom(cache[key], profile, o)
    }
    if (found && opts.unique) used.push(found.id)
    return found ? { product: found, owned: found === own, issues: isSafeFor(found, profile) ? [] : safetyIssues(found, profile) } : null
  }
}

// Why each step is there, in plain words. Active steps explain their main
// active from the ingredient guide instead.
const ROLE_WHY = {
  cleanser: 'Cleans gently without stripping, so your skin handles the actives better.',
  moisturizer: 'Locks in hydration and protects your skin barrier: the base of every result.',
  sunscreen: 'The step that protects your results: without it, actives can’t do their job.',
}

// The product's key ingredients (guide entries), the ones this step is for first.
const keyIngredients = (product, want = []) => {
  const found = findIngredients(product).map(f => f.entry).filter(e => e.goodFor?.length)
  const ranked = [...found.filter(e => want.includes(e.id)), ...found.filter(e => !want.includes(e.id))]
  return ranked.slice(0, 3).map(e => ({ id: e.id, name: e.name, what: e.what }))
}

const stepFrom = (key, action, choice, extra = {}, want = []) => {
  const keys = choice ? keyIngredients(choice.product, want) : []
  const main = keys.find(k => want.includes(k.id))
  return {
    key,
    action,
    product: choice ? `${choice.product.brand} ${choice.product.name}` : null,
    product_id: choice?.product.id || null,
    image_url: choice?.product.image_url || null,
    owned: !!choice?.owned,
    days: null,
    acks: null,
    issues: choice?.issues || [],
    want,
    why: !choice ? 'No product in our catalogue is safe enough for your skin for this step yet. We’re adding more every week.'
      : main ? `${main.name}: ${main.what}` : ROLE_WHY[key] || (keys[0] ? `${keys[0].name}: ${keys[0].what}` : null),
    keys,
    ...extra,
  }
}

// Builds the Rekod routine for a plan: { morning: steps, evening: steps }.
// Evening steps carry `days`, so the Home routine shows the right products
// on the right nights.
// The skin answers always come fresh from the database: a safe routine must
// never be built on a profile that hasn't loaded yet.
const loadProfile = async (userId) => {
  const p = await getUserProfile(userId)
  return p ? engineProfile(p) : {}
}

export const buildRekodRoutine = async (userId, basePlan, givenProfile) => {
  const profile = await loadProfile(userId).catch(() => givenProfile || {})
  // The latest skin profile decides the precautions (a new diagnosis, a new treatment).
  const plan = { ...basePlan, reactive: !!basePlan.reactive || isReactive(profile), fragile: !!profile.fragile, sensitive: !!basePlan.sensitive || isReactive(profile) || !!profile.fragile }
  const pick = await chooser(userId, profile)
  const pregnant = ['pregnant', 'breastfeeding'].includes(profile?.pregnancy)
  const gentle = { avoidHarsh: true, noStrong: true }
  // Up to 3 goals: the first one sets the plan's pace, all of them choose the actives.
  const goals = plan.goals?.length ? plan.goals : [plan.goal]
  const union = lists => [...new Set(lists.flat().filter(Boolean))]
  const amWant = union(goals.map(g => morningSerum[g]))
  const exWant = plan.sensitive ? ['mandelic', 'pha', 'lactic'] : goals.some(g => g === 'clear' || g === 'pores') ? ['salicylic'] : ['glycolic', 'lactic']
  const repairWant = union(goals.map(g => repairFor[g])).length ? union(goals.map(g => repairFor[g])) : ['ceramides', 'panthenol', 'centella', 'peptides']
  const spf50 = p => /50/.test(p.name || '')

  const cleanser = await pick(['cleanser'], gentle)
  const moisturizer = await pick(['moisturizer'], goals.some(g => g === 'calm' || g === 'hydration') ? { ...gentle, want: ['ceramides'] } : gentle)
  const sunscreen = await pick(['sunscreen'], plan.sensitive ? { ...gentle, want: ['zincoxide', 'titanium'], prefer: spf50 } : { ...gentle, prefer: spf50 })
  const amSerum = await pick(['serum', 'toner'], { ...gentle, want: amWant, unique: true })

  const morning = [
    stepFrom('cleanser', 'Cleanse', cleanser, { cats: ['cleanser'] }),
    amSerum && stepFrom('serum', 'Serum', amSerum, { cats: ['serum', 'toner'] }, amWant),
    stepFrom('moisturizer', 'Moisturize', moisturizer, { cats: ['moisturizer'] }),
    stepFrom('sunscreen', 'SPF 50', sunscreen, { cats: ['sunscreen'] }, ['zincoxide', 'titanium', 'chemicalspf']),
  ].filter(Boolean)

  const week = weekPattern(plan)
  const daysFor = night => week.map((n, i) => (n === night ? JS_DAY[i] : null)).filter(d => d !== null)

  const exfoliant = await pick(['exfoliant', 'toner', 'serum'], { want: exWant, unique: true, prefer: p => p.category === 'exfoliant' })
  // Reactive conditions start with azelaic acid; a retinoid only after 4 calm weeks.
  const retinoidWant = plan.goal === 'calm' || (plan.reactive && weekOf(plan) < 5) ? ['azelaic'] : pregnant ? ['bakuchiol', 'peptides'] : ['retinol']
  // Start low: a gentle strength for beginners and reactive skin (rules, section 3).
  const gentleStrength = p => /0[.,]0?[12]\s?%|0[.,]2|starter|0[.,]1|2\s?% emulsion|emulsion/i.test(p.name || '')
  const midStrength = p => /0[.,][2-5]|emulsion|2\s?%/i.test(p.name || '')
  const strength = plan.experience === 'used' && !plan.sensitive ? null : plan.experience === 'some' && !plan.sensitive ? midStrength : gentleStrength
  const retinoid = await pick(['serum', 'moisturizer'], { want: retinoidWant, unique: true, prefer: retinoidWant[0] === 'retinol' ? strength : null })
  const repair = await pick(['serum', 'moisturizer'], { ...gentle, want: repairWant, unique: true })

  const evening = [
    stepFrom('cleanser', 'Cleanse', cleanser, { cats: ['cleanser'] }),
    daysFor('exfoliation').length && exfoliant && stepFrom('exfoliant', 'Exfoliate', exfoliant, { days: daysFor('exfoliation'), night: 'exfoliation', cats: ['exfoliant', 'toner', 'serum'] }, exWant),
    daysFor('retinoid').length && retinoid && stepFrom('treatment', retinoidWant[0] === 'azelaic' ? 'Azelaic acid' : pregnant ? 'Gentle treatment' : 'Retinol', retinoid, { days: daysFor('retinoid'), night: 'retinoid', cats: ['serum', 'moisturizer'] }, retinoidWant),
    daysFor('repair').length && repair && stepFrom('serum', 'Repair', repair, { days: daysFor('repair'), night: 'repair', cats: ['serum', 'moisturizer'] }, repairWant),
    stepFrom('moisturizer', 'Moisturize', moisturizer, { cats: ['moisturizer'] }),
  ].filter(Boolean)

  return { morning, evening }
}

// ---------- Changing one product ----------

// A 100% safe product for the same step: with the same active first, then any
// safe product of the same kind. null when the catalogue has none.
export const findSafeAlternative = async (userId, step) => {
  const profile = await loadProfile(userId).catch(() => ({}))
  const cats = step.cats || [step.key === 'treatment' || step.key === 'exfoliant' ? 'serum' : step.key]
  const candidates = (await productsByCategory(cats, 300).catch(() => [])).filter(p => p.id !== step.product_id)
  const strong = ['exfoliant', 'treatment'].includes(step.key)
  const opts = { strictOnly: true, avoidHarsh: !strong, noStrong: !strong }
  const found = pickFrom(candidates, profile, { ...opts, want: step.want || [] }) || pickFrom(candidates, profile, opts)
  return found ? { product: found, owned: false, issues: [] } : null
}

// On a product page: if this product isn't 100% safe for her, a similar one
// that is (same kind, same main actives when possible). null when none exists.
export const safeAlternativeFor = async (userId, product) => {
  const profile = await loadProfile(userId).catch(() => ({}))
  if (isSafeFor(product, profile)) return { safe: true, alternative: null }
  const actives = findIngredients(product).filter(f => f.pos <= 8 && f.entry.goodFor?.length).map(f => f.entry.id)
  const strong = has(product, STRONG, 12)
  const candidates = (await productsByCategory([product.category], 300).catch(() => [])).filter(p => p.id !== product.id)
  const opts = { strictOnly: true, avoidHarsh: !strong, noStrong: !strong }
  const found = (actives.length && pickFrom(candidates, profile, { ...opts, want: actives })) || pickFrom(candidates, profile, opts)
  return { safe: false, alternative: found }
}

// The same step with another product (an alternative, or one the user chose).
export const stepWithProduct = async (userId, step, product) => {
  const profile = await loadProfile(userId).catch(() => ({}))
  const choice = { product, owned: false, issues: isSafeFor(product, profile) ? [] : safetyIssues(product, profile) }
  const unsafe = !isSafeFor(product, profile) && !isAcceptable(product, profile)
  // custom: the user's own change, kept when the routine is rebuilt.
  const next = stepFrom(step.key, step.action, choice, { days: step.days, night: step.night, cats: step.cats, custom: true }, step.want || [])
  return unsafe ? { ...next, issues: [{ level: 'avoid', text: 'Not recommended for your skin', detail: 'You chose this product yourself: we advise against it for your skin.' }, ...next.issues] } : next
}

// Saves a changed step into the user's current routine.
export const replaceRoutineStep = async (userId, period, index, step) => {
  const { data, error } = await supabase.from('routines').select('id, steps').eq('user_id', userId).eq('type', period).order('created_at', { ascending: false }).limit(1)
  if (error) throw error
  const steps = [...(data?.[0]?.steps || [])]
  steps[index] = step
  const res = await saveRoutine(userId, period, steps)
  if (!res.success) throw new Error(res.error)
  return steps
}

// Rebuilds a member's routine with the latest rules and catalogue, keeping the
// products she chose herself. Saves only when something changed.
export const refreshRekodRoutine = async (userId, plan) => {
  const profile = await loadProfile(userId).catch(() => ({}))
  const flags = { reactive: !!plan.reactive || isReactive(profile), fragile: !!profile.fragile }
  if (flags.reactive !== !!plan.reactive || flags.fragile !== !!plan.fragile) await saveRekodPlan(userId, { ...plan, ...flags })
  const fresh = await buildRekodRoutine(userId, { ...plan, ...flags })
  const { data } = await supabase.from('routines').select('type, steps').eq('user_id', userId).order('created_at', { ascending: false })
  const out = {}
  for (const type of ['morning', 'evening']) {
    const current = (data || []).find(r => r.type === type)?.steps || []
    const merged = fresh[type].map(step => current.find(c => c.custom && c.key === step.key && c.night === step.night) ? { ...current.find(c => c.custom && c.key === step.key && c.night === step.night), days: step.days } : step)
    const sig = list => JSON.stringify(list.map(x => [x.key, x.product_id, x.days, (x.issues || []).length, !!x.why]))
    if (sig(merged) !== sig(current)) {
      const res = await saveRoutine(userId, type, merged)
      if (!res.success) throw new Error(res.error)
    }
    out[type] = merged
  }
  return out
}

// ---------- Saving ----------

export const getRekodPlan = async (userId) => {
  const { data, error } = await supabase.from('rekod_plans').select('plan').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data?.plan || null
}

export const saveRekodPlan = async (userId, plan) => {
  const { error } = await supabase.from('rekod_plans').upsert({ user_id: userId, plan, updated_at: new Date().toISOString() })
  if (error) throw error
}

// Joins Rekod: keeps the current routine in the archive, saves the new one.
export const startRekod = async (userId, answers, givenProfile) => {
  const profile = await loadProfile(userId).catch(() => givenProfile || {})
  const plan = {
    goal: answers.goals?.[0] || answers.goal,
    goals: answers.goals?.length ? answers.goals : [answers.goal],
    sensitive: !!answers.sensitive || isReactive(profile),
    reactive: isReactive(profile),
    experience: answers.experience,
    priority: answers.priority || null,
    level: START[answers.experience] ?? 0,
    startedAt: new Date().toISOString(),
    checkins: [],
    extraReset: false,
  }
  const routine = await buildRekodRoutine(userId, plan, profile)
  await archiveCurrentRoutines(userId, 'before-rekod').catch(() => {})
  for (const type of ['morning', 'evening']) {
    const res = await saveRoutine(userId, type, routine[type])
    if (!res.success) throw new Error(res.error)
  }
  await saveRekodPlan(userId, plan)
  return { plan, routine }
}

// After a weekly check-in: new level, new evening days.
export const recordCheckIn = async (userId, plan, answer, profile) => {
  const next = applyCheckIn(plan, answer)
  const routine = await buildRekodRoutine(userId, next, profile)
  const res = await saveRoutine(userId, 'evening', routine.evening)
  if (!res.success) throw new Error(res.error)
  await saveRekodPlan(userId, next)
  return { plan: next, routine }
}

export const leaveRekod = async (userId) => {
  const { error } = await supabase.from('rekod_plans').delete().eq('user_id', userId)
  if (error) throw error
}
