// Rekod: the premium programme that builds a routine of proven actives for one
// goal, then introduces them week after week ("skin cycling").
//
// Everything here follows docs/rekod/regles-rekod.html, written to be reviewed
// by a dermatologist or pharmacist. Deterministic rules only: no AI decides.

import { supabase } from './supabase'
import { findIngredients, productMatch, isUnsuitable, getIngredient } from './ingredients-guide'
import { allProductsByCategory, getMyProducts } from './catalog'
import { saveRoutine } from './routines-service'
import { getUserProfile } from './supabase'
import { engineProfile } from './skin-quiz'
import {
  GOALS, INCOMPATIBLE, conflictWith, goalOf, goalsTitle, goalsOf,
  planWeeks, calmPhase, planWhy, NIGHTS, treatmentOf, nightInfo,
  rekodKey, START, isReactive, nightCounts, resting, weekPattern,
  JS_DAY, tonightNight, weekOf, checkInDue, applyCheckIn, projectRekod,
} from './rekod-schedule'
export {
  GOALS, INCOMPATIBLE, conflictWith, goalOf, goalsTitle, planWeeks,
  calmPhase, planWhy, NIGHTS, treatmentOf, nightInfo, rekodKey,
  isReactive, nightCounts, resting, weekPattern, tonightNight, weekOf,
  checkInDue, applyCheckIn, projectRekod, shiftedTo, nightOnDate, treatmentOnDate,
} from './rekod-schedule'

// ---------- Choosing products ----------

// `ids` present in the product; for an active, high enough in the list to matter
// (the tail of an INCI list is under ~1%).
const has = (product, ids, maxPos = 99) => findIngredients(product).some(f => ids.includes(f.entry.id) && f.pos <= maxPos)
const STRONG = ['retinol', 'glycolic', 'salicylic', 'lactic', 'mandelic', 'benzoyl', 'azelaic']
// A gentle step never hides a strong active (audit 2026-10-25: a "retinol
// cream" was picked as the day cream). A retinoid counts wherever it sits in
// the list, the others in the first 12; the name gives it away too.
const strongName = p => /retin(ol|al|oid)|\bAHA\b|\bBHA\b|\bPHA\b|peel|glycolic|salicylic|lactic|mandelic|azelaic|exfoli/i.test(p?.name || '')
const isStrong = p => has(p, ['retinol']) || has(p, STRONG, 12) || strongName(p)
// Concentrated vitamin C stings reactive skin: only where it's the step's own active.
const strongVitC = p => has(p, ['vitaminc'], 5) || /vitamin\s?c\b|vit\.?\s?c\b|ascorbic/i.test(p?.name || '')
// Actives that shouldn't come twice in one routine (vitamin C in the morning
// and again at night, two acids…): each one has a single step.
const ONCE = ['vitaminc', 'retinol', 'glycolic', 'salicylic', 'lactic', 'mandelic', 'azelaic', 'bakuchiol', 'arbutin', 'txa', 'kojic', 'benzoyl']
// Basics every product has: never the reason a product is "similar".
const BASICS = ['glycerin', 'hyaluronic', 'dimethicone', 'petrolatum', 'squalane', 'shea', 'aloe', 'vitamine', 'allantoin', 'jojoba']
const harsh = p => has(p, ['sls', 'scrub', 'alcohol', 'fragrance', 'essentialoils']) || /scrub|exfoli|peel/i.test(p?.name || '')

// What each step looks for, per goal. `want` = guide ingredient ids.
const morningSerum = { clear: ['niacinamide'], antiaging: ['vitaminc', 'peptides'], spots: ['vitaminc', 'niacinamide', 'arbutin'], glow: ['vitaminc'], pores: ['niacinamide'], calm: ['niacinamide', 'centella', 'panthenol'], hydration: ['hyaluronic', 'polyglutamic'] }
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

// Order of choice, for every step:
//   1. 100% safe with the wanted active, 2. 100% safe without it (when the active
//   is only a preference, like ceramides in a moisturizer), and only then
//   3. the mildest "not 100% safe" one. `level` limits to 'safe' or 'acceptable'.
const pickFrom = (candidates, profile, { want = [], wantRequired = false, avoidHarsh = false, noStrong = false, exclude = [], avoid = [], reject = null, prefer = null, strictOnly = false, level = null } = {}) => {
  const skip = avoid.filter(a => !want.includes(a))
  // Lash and brow serums aren't skincare (removed from the catalogue 2026-10-25);
  // this guards future imports. An eye serum that also helps lashes stays.
  const base = candidates.filter(p => p && !exclude.includes(p.id) && (!avoidHarsh || !harsh(p)) && !(reject && reject(p))
    && !(p.category === 'eye care' && /eyelash|lash (and|&) brow|brow serum|mascara|sourcil|\bcils\b/i.test(p.name || ''))
    && (!noStrong || (!isStrong(p) && (want.includes('vitaminc') || !strongVitC(p))))
    && (!skip.length || !has(p, skip, 8)))
  // The active must be one of the first ingredients, not a trace.
  const withActive = want.length ? base.filter(p => has(p, want, 8)) : base
  const pools = want.length && !wantRequired ? [withActive, base] : [withActive]
  const rank = p => (productMatch(p, profile || {}).score || 0) + (prefer && prefer(p) ? 100 : 0)
  // Ties go to the lowest id: the same profile always gets the same product.
  const best = list => list.map(p => ({ p, score: rank(p) })).sort((a, b) => b.score - a.score || a.p.id - b.p.id)[0]?.p || null
  if (level !== 'acceptable') {
    for (const pool of pools) {
      const safe = best(pool.filter(p => isSafeFor(p, profile)))
      if (safe) return safe
    }
    if (strictOnly || level === 'safe') return null
  }
  // Nothing 100% safe: the mildest acceptable one, fewest issues first.
  for (const pool of pools) {
    const ok = pool.filter(p => isAcceptable(p, profile))
    const mild = ok.map(p => ({ p, n: safetyIssues(p, profile).reduce((a, i) => a + (i.level === 'patch' ? 3 : 1), 0), score: rank(p) }))
      .sort((a, b) => a.n - b.n || b.score - a.score || a.p.id - b.p.id)[0]?.p
    if (mild) return mild
  }
  return null
}

// The user's own products first, then the catalogue.
const chooser = async (userId, profile, pref = 'own') => {
  const mine = pref === 'new' ? [] : (await getMyProducts(userId).catch(() => [])).filter(r => r.status !== 'to_buy' && r.product).map(r => r.product)
  const cache = {}
  const used = []
  const usedActives = new Set()
  return async (categories, opts = {}) => {
    // Each treatment step gets its own product (the same serum isn't both the
    // treatment and the repair), and each strong active comes once (eyes and
    // lips are their own small areas and don't count).
    const face = !categories.some(c => c === 'eye care' || c === 'lip care')
    const o = { ...opts, exclude: opts.unique ? used : [], avoid: opts.unique && face ? [...usedActives] : [] }
    const ownList = mine.filter(p => categories.includes(p.category))
    const key = categories.join('|')
    cache[key] = cache[key] || await allProductsByCategory(categories).catch(() => [])
    // Her own 100% safe product, else a 100% safe one from the catalogue; a
    // "not 100% safe" product only when nothing safe exists anywhere.
    const own = pickFrom(ownList, profile, { ...o, level: 'safe' })
    let found = own || pickFrom(cache[key], profile, { ...o, level: 'safe' })
    let ownMild = null
    if (!found && !o.strictOnly) {
      ownMild = pickFrom(ownList, profile, { ...o, level: 'acceptable' })
      found = ownMild || pickFrom(cache[key], profile, { ...o, level: 'acceptable' })
    }
    if (found && opts.unique) {
      used.push(found.id)
      if (face) findIngredients(found).filter(f => ONCE.includes(f.entry.id) && f.pos <= 8).forEach(f => usedActives.add(f.entry.id))
    }
    return found ? { product: found, owned: found === own || found === ownMild, issues: isSafeFor(found, profile) ? [] : safetyIssues(found, profile) } : null
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
      : main ? `${main.name}: ${main.what}`
      // A base step whose ideal active isn't in any 100% safe product: say so honestly.
      : want.length && ROLE_WHY[key] && !['sunscreen'].includes(key) ? `${ROLE_WHY[key]} The ideal for your goals would also contain ${getIngredient(want[0])?.name?.toLowerCase() || want[0]}, but no product with it is 100% safe for your skin yet.`
      : ROLE_WHY[key] || (keys[0] ? `${keys[0].name}: ${keys[0].what}` : null),
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
  const pregnantNow = ['pregnant', 'breastfeeding'].includes(profile?.pregnancy)
  const plan = { ...basePlan, reactive: !!basePlan.reactive || isReactive(profile), fragile: !!profile.fragile, sensitive: !!basePlan.sensitive || isReactive(profile) || !!profile.fragile, pregnant: pregnantNow }
  const pick = await chooser(userId, profile, plan.productPref)
  const pregnant = pregnantNow
  const gentle = { avoidHarsh: true, noStrong: true }
  // Up to 3 goals: the first one sets the plan's pace, all of them choose the actives.
  const goals = plan.goals?.length ? plan.goals : [plan.goal]
  const union = lists => [...new Set(lists.flat().filter(Boolean))]
  // Pure vitamin C stings sensitive and reactive skin: niacinamide or peptides instead (audit 2).
  const amWant = plan.sensitive
    ? union([...goals.map(g => morningSerum[g]).flat().filter(x => x !== 'vitaminc'), 'niacinamide'])
    : union(goals.map(g => morningSerum[g]))
  const moistWant = goals.some(g => g === 'calm' || g === 'hydration') ? ['ceramides'] : []
  // Pregnancy: no salicylic acid; a gentle AHA instead, so acne still gets an exfoliation night (audit 2).
  const exWant = plan.sensitive ? ['mandelic', 'pha', 'lactic'] : plan.pregnant ? ['mandelic', 'lactic', 'glycolic'] : goals.some(g => g === 'clear' || g === 'pores') ? ['salicylic'] : ['glycolic', 'lactic']
  const repairWant = union(goals.map(g => repairFor[g])).length ? union(goals.map(g => repairFor[g])) : ['ceramides', 'panthenol', 'centella', 'peptides']
  // SPF 50 from the name ("SPF 50", "50+", "SPF50"), never "150 ml".
  const spf50 = p => /spf\s?50|\b50\s?\+|\bspf\s?50\+?/i.test(p.name || '')

  const cleanser = await pick(['cleanser'], gentle)
  // unique: the repair step never repeats the day cream.
  const moisturizer = await pick(['moisturizer'], { ...gentle, want: moistWant, unique: true })
  const sunscreen = await pick(['sunscreen'], plan.sensitive ? { ...gentle, want: ['zincoxide', 'titanium'], prefer: spf50 } : { ...gentle, prefer: spf50 })
  const amSerum = plan.maintenance && plan.maintenanceMode === 'simple' ? null : await pick(['serum', 'toner'], { ...gentle, want: amWant, wantRequired: true, unique: true })
  // Eyes (essential, Lita 2026-10-24): peptides every day; lips: an SPF balm by day.
  const PEPTIDES = ['argireline', 'matrixyl', 'copperpeptides', 'peptides']
  const eyePeptide = await pick(['eye care'], { ...gentle, want: PEPTIDES, wantRequired: true, unique: true })
    || await pick(['eye care'], { ...gentle, unique: true })
  const lipSpf = await pick(['lip care'], { want: ['zincoxide', 'titanium', 'chemicalspf'], wantRequired: true, unique: true })

  const morning = [
    stepFrom('cleanser', 'Cleanse', cleanser, { cats: ['cleanser'] }),
    amSerum && stepFrom('serum', 'Serum', amSerum, { cats: ['serum', 'toner'] }, amWant),
    eyePeptide && stepFrom('eye', 'Eye care', eyePeptide, { cats: ['eye care'] }, PEPTIDES),
    stepFrom('moisturizer', 'Moisturize', moisturizer, { cats: ['moisturizer'] }, moistWant),
    stepFrom('sunscreen', 'SPF 50', sunscreen, { cats: ['sunscreen'] }, ['zincoxide', 'titanium', 'chemicalspf']),
    lipSpf && stepFrom('lips', 'Lips · SPF', lipSpf, { cats: ['lip care'] }, ['zincoxide', 'titanium', 'chemicalspf']),
  ].filter(Boolean)

  // A peel or a high-strength acid only for a skin used to actives (audit 2026-10-25:
  // a 30% AHA peel came up for a skin with "some" experience).
  const tooStrongAcid = p => /peel/i.test(p.name || '') || Number((p.name || '').match(/(\d+(?:[.,]\d+)?)\s?%/)?.[1]?.replace(',', '.') || 0) >= 15
  const exfoliant = await pick(['exfoliant', 'toner', 'serum'], { want: exWant, wantRequired: true, unique: true, prefer: p => p.category === 'exfoliant', reject: plan.experience === 'used' && !plan.sensitive ? null : tooStrongAcid })
  // Reactive conditions start with azelaic acid; a retinoid only after 4 calm weeks.
  const retinoidWant = { azelaic: ['azelaic'], gentle: ['bakuchiol', 'peptides'], retinol: ['retinol'] }[treatmentOf(plan)]
  // Start low: a gentle strength for beginners and reactive skin (rules, section 3).
  const gentleStrength = p => /0[.,]0?[12]\s?%|0[.,]2|starter|0[.,]1|2\s?% emulsion|emulsion/i.test(p.name || '')
  const midStrength = p => /0[.,][2-5]|emulsion|2\s?%/i.test(p.name || '')
  const strength = plan.experience === 'used' && !plan.sensitive ? null : plan.experience === 'some' && !plan.sensitive ? midStrength : gentleStrength
  const retinoid = await pick(['serum', 'moisturizer'], { want: retinoidWant, wantRequired: true, unique: true, prefer: retinoidWant[0] === 'retinol' ? strength : null })
  // A strong step with no safe product: its nights become repair nights, so the
  // calendar never shows a night with nothing to do.
  plan.missing = [!exfoliant && 'exfoliation', !retinoid && 'retinoid'].filter(Boolean)
  const week = weekPattern(plan)
  const daysFor = night => week.map((n, i) => (n === night ? JS_DAY[i] : null)).filter(d => d !== null)

  // A serum first: a second cream on the same night isn't a repair step (audit 2).
  const simple = plan.maintenance && plan.maintenanceMode === 'simple'
  const repair = simple ? null : await pick(['serum', 'moisturizer'], { ...gentle, want: repairWant, wantRequired: true, unique: true, prefer: p => p.category === 'serum' })
  // Eyes at night: a retinoid eye cream on the retinoid nights (never in pregnancy,
  // calm phase or reactive start), peptides on the other nights.
  const eyeRetinoid = retinoidWant[0] === 'retinol' && !plan.sensitive && !simple
    ? await pick(['eye care'], { want: ['retinol'], wantRequired: true, unique: true, prefer: strength })
    : null
  const retinoidNights = daysFor('retinoid')
  const peptideNights = eyeRetinoid && retinoidNights.length ? JS_DAY.filter(d => !retinoidNights.includes(d)) : null
  // Lips: a nourishing balm every night; a lip scrub and a lip mask once or twice a week.
  const lipBalm = await pick(['lip care'], { ...gentle, unique: true, prefer: p => !/scrub|exfoli|gommage|mask|masque|sleeping/i.test(p.name || '') })
  const lipScrub = await pick(['lip care'], { unique: true, prefer: p => /scrub|exfoli|gommage/i.test(p.name || ''), strictOnly: false })
  const lipMask = await pick(['lip care'], { ...gentle, unique: true, prefer: p => /mask|masque|sleeping|overnight/i.test(p.name || '') })
  const isScrub = c => c && /scrub|exfoli|gommage/i.test(c.product.name || '')
  const isMask = c => c && /mask|masque|sleeping|overnight/i.test(c.product.name || '')

  const evening = [
    stepFrom('cleanser', 'Cleanse', cleanser, { cats: ['cleanser'] }),
    daysFor('exfoliation').length && exfoliant && stepFrom('exfoliant', 'Exfoliate', exfoliant, { days: daysFor('exfoliation'), night: 'exfoliation', cats: ['exfoliant', 'toner', 'serum'] }, exWant),
    daysFor('retinoid').length && retinoid && stepFrom('treatment', retinoidWant[0] === 'azelaic' ? 'Azelaic acid' : pregnant ? 'Gentle treatment' : 'Retinol', retinoid, { days: daysFor('retinoid'), night: 'retinoid', cats: ['serum', 'moisturizer'] }, retinoidWant),
    daysFor('repair').length && repair && stepFrom('serum', 'Repair', repair, { days: daysFor('repair'), night: 'repair', cats: ['serum', 'moisturizer'] }, repairWant),
    eyeRetinoid && retinoidNights.length && stepFrom('eye', 'Eye care · retinol', eyeRetinoid, { days: retinoidNights, night: 'eye-retinoid', cats: ['eye care'] }, ['retinol']),
    eyePeptide && stepFrom('eye', 'Eye care', eyePeptide, { days: peptideNights, night: peptideNights ? 'eye-peptides' : undefined, cats: ['eye care'] }, PEPTIDES),
    stepFrom('moisturizer', 'Moisturize', moisturizer, { cats: ['moisturizer'] }, moistWant),
    // No lip scrub on fragile lips (isotretinoin, a prescription cream) or in the simple routine.
    !plan.fragile && !simple && isScrub(lipScrub) && stepFrom('lipscrub', 'Lip scrub', lipScrub, { days: [3], night: 'lip-scrub', cats: ['lip care'] }),
    lipBalm && stepFrom('lips', 'Lips', lipBalm, { cats: ['lip care'] }),
    !simple && isMask(lipMask) && stepFrom('lipmask', 'Lip mask', lipMask, { days: [0, 4], night: 'lip-mask', cats: ['lip care'] }),
  ].filter(Boolean)

  // Her own decisions about flagged steps: removed ones stay out, accepted ones
  // stop asking (the explanation stays).
  const decide = period => list => list
    .filter(st => !(plan.removed || []).includes(stepId(period, st)))
    .map(st => ((plan.accepted || []).includes(stepId(period, st)) ? { ...st, accepted: true } : st))
  // `flags`: what the plan must remember so Home, Koda and the calendar say the same thing.
  return { morning: decide('morning')(morning), evening: decide('evening')(evening), flags: { reactive: plan.reactive, fragile: plan.fragile, sensitive: plan.sensitive, pregnant: plan.pregnant, missing: plan.missing, builtKey: rekodKey(plan) } }
}

// ---------- Changing one product ----------

export const stepId = (period, step) => `${period}:${step.key}:${step.night || ''}`

// "Keep it and patch test" or "Remove from my routine" on a flagged step.
export const decideStep = (plan, period, step, decision) => {
  const id = stepId(period, step)
  const key = decision === 'remove' ? 'removed' : 'accepted'
  return { ...plan, [key]: [...new Set([...(plan[key] || []), id])] }
}

// A 100% safe product for the same step: with the same active first, then any
// safe product of the same kind. null when the catalogue has none.
export const findSafeAlternative = async (userId, step) => {
  const profile = await loadProfile(userId).catch(() => ({}))
  const cats = step.cats || [step.key === 'treatment' || step.key === 'exfoliant' ? 'serum' : step.key]
  const candidates = (await allProductsByCategory(cats).catch(() => [])).filter(p => p.id !== step.product_id)
  const strong = ['exfoliant', 'treatment'].includes(step.key)
  const opts = { strictOnly: true, avoidHarsh: !strong, noStrong: !strong }
  const found = pickFrom(candidates, profile, { ...opts, want: step.want || [] }) || pickFrom(candidates, profile, opts)
  return found ? { product: found, owned: false, issues: [] } : null
}

// Up to `n` other 100% safe products for a step, with the same active: the
// best match first, and the gentlest one labelled (fewest irritating ingredients).
export const optionsForStep = async (userId, step, n = 2) => {
  const profile = await loadProfile(userId).catch(() => ({}))
  const cats = step.cats || [step.key === 'treatment' || step.key === 'exfoliant' ? 'serum' : step.key]
  const strong = ['exfoliant', 'treatment'].includes(step.key)
  const want = step.want || []
  const pool = (await allProductsByCategory(cats).catch(() => []))
    .filter(p => p.id !== step.product_id && isSafeFor(p, profile) && (!want.length || has(p, want, 8)) && (strong || (!harsh(p) && !isStrong(p))))
  const irritancy = p => findIngredients(p).reduce((a, f) => a + (f.entry.irritancy || 0), 0)
  const ranked = pool.map(p => ({ p, score: productMatch(p, profile).score || 0, irr: irritancy(p) })).sort((a, b) => b.score - a.score || a.p.id - b.p.id)
  const picks = ranked.slice(0, n).map(r => r.p)
  const gentlest = [...ranked].sort((a, b) => a.irr - b.irr || b.score - a.score)[0]?.p
  if (gentlest && !picks.includes(gentlest)) { if (picks.length < n) picks.push(gentlest); else picks[n - 1] = gentlest }
  return picks.map((p, i) => ({ product: p, label: p === gentlest && picks.length > 1 ? 'The gentlest' : i === 0 ? 'Best match' : 'Also a good match' }))
}

// On a product page: if this product isn't 100% safe for her, a similar one
// that is (same kind, same main actives when possible). null when none exists.
export const safeAlternativeFor = async (userId, product) => {
  const profile = await loadProfile(userId).catch(() => ({}))
  if (isSafeFor(product, profile)) return { safe: true, alternative: null }
  // The product's main active: the one in its name first ("Niacinamide 5%…"),
  // else the first real active of the list (not a basic like glycerin).
  const name = (product.name || '').toLowerCase()
  const found = findIngredients(product).filter(f => f.pos <= 10 && f.entry.goodFor?.length && !BASICS.includes(f.entry.id))
  const inName = found.filter(f => name.includes(f.entry.name.toLowerCase().split(' (')[0]) || (f.entry.match || []).some(m => name.includes(m)))
  const main = (inName[0] || found.sort((a, b) => a.pos - b.pos)[0])?.entry || null
  const strong = has(product, STRONG, 12)
  const related = ['serum', 'moisturizer', 'toner']
  const cats = related.includes(product.category) ? [product.category, ...related.filter(c => c !== product.category)] : [product.category]
  // Cleansers and sunscreens are judged on their role; other products on their active.
  const basicRole = ['cleanser', 'sunscreen'].includes(product.category)
  const opts = { strictOnly: true, avoidHarsh: !strong, noStrong: !strong, want: main ? [main.id] : [], wantRequired: !!main && !basicRole }
  // Same kind of product first, then a close kind (a serum for a cream…).
  for (const cat of cats) {
    const candidates = (await allProductsByCategory([cat]).catch(() => [])).filter(p => p.id !== product.id)
    const alt = pickFrom(candidates, profile, opts)
    if (alt) return { safe: false, alternative: alt, active: alt && main && has(alt, [main.id], 10) ? main.name.split(' (')[0] : null }
  }
  return { safe: false, alternative: null, active: main && !basicRole ? main.name.split(' (')[0] : null }
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
  const fresh = await buildRekodRoutine(userId, { ...plan, ...flags }, profile)
  // The plan remembers what the routine was built for (treatment, missing steps, week).
  const kept = { ...plan, ...flags, ...fresh.flags }
  if (JSON.stringify(['reactive', 'fragile', 'sensitive', 'pregnant', 'missing', 'builtKey'].map(k => plan[k])) !== JSON.stringify(['reactive', 'fragile', 'sensitive', 'pregnant', 'missing', 'builtKey'].map(k => kept[k]))) await saveRekodPlan(userId, kept)
  const { data } = await supabase.from('routines').select('type, steps').eq('user_id', userId).order('created_at', { ascending: false })
  const out = {}
  for (const type of ['morning', 'evening']) {
    const current = (data || []).find(r => r.type === type)?.steps || []
    // Her own product stays only while the step keeps the same active: when azelaic
    // acid makes way for retinol, the step gets a retinol product (audit 3).
    const sameStep = (c, step) => c.custom && c.key === step.key && c.night === step.night && JSON.stringify(c.want || []) === JSON.stringify(step.want || [])
    const merged = fresh[type].map(step => current.find(c => sameStep(c, step)) ? { ...current.find(c => sameStep(c, step)), days: step.days } : step)
    const sig = list => JSON.stringify(list.map(x => [x.key, x.product_id, x.days, (x.issues || []).length, !!x.why]))
    if (sig(merged) !== sig(current)) {
      const res = await saveRoutine(userId, type, merged)
      if (!res.success) throw new Error(res.error)
    }
    out[type] = merged
  }
  return out
}

// A change to her health answers (pregnancy, a new diagnosis, a treatment like
// isotretinoin) rebuilds her Rekod routine at once, Premium or not: safety
// never waits for her to open Rekod (audit 2, 2026-10-25). Returns true when rebuilt.
export const refreshIfRekod = async (userId) => {
  const plan = await getRekodPlan(userId).catch(() => null)
  if (!plan) return false
  await refreshRekodRoutine(userId, plan)
  return true
}

// The week as her saved routine has it (what Home and a frozen, non-Premium
// plan show): Monday first, from the evening steps' days and nights.
export const patternFromRoutine = (eveningSteps = []) => JS_DAY.map(day => {
  const tonight = eveningSteps.filter(s => !Array.isArray(s.days) || !s.days.length || s.days.includes(day)).map(s => s.night)
  return ['exfoliation', 'retinoid', 'repair'].find(n => tonight.includes(n)) || 'reset'
})

// ---------- Saving ----------

export const getRekodPlan = async (userId) => {
  const { data, error } = await supabase.from('rekod_plans').select('plan').eq('user_id', userId).maybeSingle()
  if (error) throw error
  return data?.plan || null
}

export const saveRekodPlan = async (userId, plan) => {
  const { error } = await supabase.from('rekod_plans').upsert({ user_id: userId, plan, updated_at: new Date().toISOString() })
  if (error) throw error
  require('./journey').syncSoon(userId)
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
    // 'own': her products first when they suit her skin · 'new': suggestions only.
    productPref: answers.productPref || 'own',
    level: START[answers.experience] ?? 0,
    levelSince: 1,
    startedAt: new Date().toISOString(),
    checkins: [],
    extraReset: false,
    removed: answers.removed || [],
    accepted: answers.accepted || [],
    // Day 0 Dekod scan, to show progress and guide the weekly check-ins.
    baseline: answers.baseline || null,
  }
  // Her routine before Rekod, so she can go back to it at the end.
  const { data: before } = await supabase.from('routines').select('type, steps').eq('user_id', userId).order('created_at', { ascending: false })
  plan.previous = { morning: (before || []).find(r => r.type === 'morning')?.steps || [], evening: (before || []).find(r => r.type === 'evening')?.steps || [] }
  const routine = await buildRekodRoutine(userId, plan, profile)
  for (const type of ['morning', 'evening']) {
    const res = await saveRoutine(userId, type, routine[type])
    if (!res.success) throw new Error(res.error)
  }
  Object.assign(plan, routine.flags)
  await saveRekodPlan(userId, plan)
  return { plan, routine }
}

// The programme is over (all its weeks done) and not yet in maintenance.
export const programmeFinished = (plan, now = new Date()) => !plan.maintenance && weekOf(plan, now) > planWeeks(plan)

// After the programme (Lita, 2026-10-23), mode:
//   'gentle' keep my results: the same products, fewer strong nights
//   'asis'   keep my routine exactly as it is
//   'simple' the essentials and one active two evenings a week
export const startMaintenance = async (userId, plan, profile, mode = 'gentle') => {
  const next = { ...plan, maintenance: true, maintenanceMode: mode, maintenanceSince: new Date().toISOString(), extraReset: false }
  const routine = await buildRekodRoutine(userId, next, profile)
  for (const type of ['morning', 'evening']) {
    const res = await saveRoutine(userId, type, routine[type])
    if (!res.success) throw new Error(res.error)
  }
  Object.assign(next, routine.flags)
  await saveRekodPlan(userId, next)
  return { plan: next, routine }
}

// After a weekly check-in: new level, new evening days.
export const recordCheckIn = async (userId, plan, answer, profile) => {
  const next = applyCheckIn(plan, answer)
  const routine = await buildRekodRoutine(userId, next, profile)
  const res = await saveRoutine(userId, 'evening', routine.evening)
  if (!res.success) throw new Error(res.error)
  Object.assign(next, routine.flags)
  await saveRekodPlan(userId, next)
  return { plan: next, routine }
}

// "A little" at the end: 4 more weeks at the same pace, then a new look.
export const extendRekod = async (userId, plan, weeks = 4) => {
  const next = { ...plan, extraWeeks: (plan.extraWeeks || 0) + weeks, endAnswer: null }
  await saveRekodPlan(userId, next)
  return next
}

// "Back to my routine before Rekod": puts it back exactly as it was, then leaves.
export const restorePreviousRoutine = async (userId, plan) => {
  for (const type of ['morning', 'evening']) {
    const res = await saveRoutine(userId, type, plan.previous?.[type] || [])
    if (!res.success) throw new Error(res.error)
  }
  await leaveRekod(userId)
}

// How regular she was during the programme: share of days with a ticked routine.
export const regularityOf = async (userId, plan, now = new Date()) => {
  const since = new Date(plan.startedAt)
  const days = Math.max(1, Math.round((now - since) / 86400000))
  const { data, error } = await supabase.from('routine_completions').select('date').eq('user_id', userId).gte('date', since.toISOString().slice(0, 10))
  if (error) throw error
  return Math.min(1, new Set((data || []).map(r => r.date)).size / days)
}

// The advice at the end, from her answer to "Do you see a difference?".
export const endAdvice = (plan, answer, regularity) => {
  const gentleGoals = goalsOf(plan).every(g => g === 'calm' || g === 'hydration')
  if (answer === 'yes') return { choice: gentleGoals ? 'asis' : 'gentle', why: gentleGoals ? 'Your routine has no strong actives: you can keep it as it is for the long term.' : 'To keep your results, dermatologists advise going on with your actives, a little less often: without them, breakouts and spots tend to come back.' }
  if (answer === 'little') return { choice: 'extend', why: 'That’s normal: many skins need longer, especially for dark spots and fine lines (often 3 to 6 months). 4 more weeks at the same pace, then a new check.' }
  if (regularity < 0.6) return { choice: 'extend', why: `You did your routine on ${Math.round(regularity * 100)}% of the days. Actives need regular use: 4 more weeks, as regularly as you can, should make a difference.` }
  return { choice: 'newgoal', why: 'You were regular, so your skin may need something else. Try a new goal or ask Koda; for breakouts or spots that won’t go, a dermatologist can help.' }
}

export const leaveRekod = async (userId) => {
  const { error } = await supabase.from('rekod_plans').delete().eq('user_id', userId)
  if (error) throw error
}
