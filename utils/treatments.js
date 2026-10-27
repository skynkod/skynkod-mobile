// Her prescribed treatments (Lita, 2026-10-27; docs/routines/livre-des-regles.md,
// section 6). Her treatment is her main active: Skynkod adds no other strong
// active on top, and shows her treatment as a step of her routine, at the times
// her doctor gave her. Skynkod never suggests a dose or a rhythm.
// Pure (no app imports), so the tests can run it.

// On the skin: each one becomes a "Your treatment" step.
export const TOPICAL_RX = [
  { id: 'tretinoin', label: 'Tretinoin', retinoid: true },
  { id: 'adapalene', label: 'Adapalene', retinoid: true },
  { id: 'rx_benzoyl', label: 'Benzoyl peroxide' },
  { id: 'rx_antibiotic', label: 'Antibiotic cream (clindamycin…)', name: 'Antibiotic cream' },
  { id: 'metronidazole', label: 'Metronidazole' },
  { id: 'rx_azelaic', label: 'Azelaic acid' },
  { id: 'ivermectin', label: 'Ivermectin' },
  { id: 'ketoconazole', label: 'Ketoconazole' },
  { id: 'rx_other', label: 'Another cream' },
]
// By mouth or other: they change the rules, with no step.
export const OTHER_RX = [
  { id: 'isotretinoin', label: 'Isotretinoin (Roaccutane)', retinoid: true },
  { id: 'oral_antibiotic', label: 'Antibiotics by mouth' },
  { id: 'hormonal', label: 'Hormonal treatment or the pill' },
]
// Before 2026-10-27, one box: "Prescription cream (tretinoin, adapalene…)".
const LEGACY = { id: 'topical_rx', label: 'Prescription cream', retinoid: true }
const ALL = [...TOPICAL_RX, ...OTHER_RX, LEGACY]

export const rxOf = id => ALL.find(x => x.id === id) || null
export const isTopicalRx = id => TOPICAL_RX.some(x => x.id === id)
// Tretinoin, adapalene, isotretinoin, or the old box (it named them): not in pregnancy.
export const isRetinoidRx = id => !!rxOf(id)?.retinoid
export const rxName = (id, other = '') => (id === 'rx_other' && other.trim() ? other.trim() : rxOf(id)?.name || rxOf(id)?.label || id)

// Monday first, like the Rekod week; values are Date.getDay().
export const WEEK = [[1, 'M'], [2, 'T'], [3, 'W'], [4, 'T'], [5, 'F'], [6, 'S'], [0, 'S']]

// A plan is complete when she said morning, evening or both, and every day or which days.
export const planDone = p => !!p && ['morning', 'evening', 'both'].includes(p.when) && (p.every || (p.days || []).length > 0)

// Her prescribed creams, with her times: [{ id, name, when, days }].
export const rxList = ({ meds = [], rxPlan = {}, medsOther = '' } = {}) => meds
  .filter(id => isTopicalRx(id) && planDone(rxPlan[id]))
  .map(id => ({ id, name: rxName(id, medsOther), when: rxPlan[id].when, days: rxPlan[id].every ? null : [...rxPlan[id].days].sort() }))

const PREGNANT = ['pregnant', 'breastfeeding']
// Rulebook G5: a retinoid treatment during pregnancy or breastfeeding.
export const pregnancyRxAlert = (profile = {}) => {
  if (!PREGNANT.includes(profile.pregnancy)) return null
  const meds = profile.meds || []
  if (meds.some(isRetinoidRx)) return { level: 'avoid', text: 'Talk to your doctor as soon as you can', detail: 'Retinoid treatments (tretinoin, adapalene, isotretinoin) are not recommended during pregnancy or breastfeeding. Your doctor will tell you what to do.' }
  if (meds.some(id => isTopicalRx(id) || id === 'topical_rx')) return { level: 'watch', text: 'Check this treatment with your doctor', detail: 'Tell your doctor or midwife you are pregnant or breastfeeding: they will check your treatment is right for now.' }
  return null
}

const overlap = (a, b) => (!a.days || !b.days || a.days.some(d => b.days.includes(d)))
const at = (rx, period) => rx.when === 'both' || rx.when === period

// "Your treatment" steps for one period.
export const treatmentSteps = (profile = {}, period) => {
  const list = profile.rx || rxList(profile)
  const alert = pregnancyRxAlert(profile)
  return list.filter(rx => at(rx, period)).map((rx, _, mine) => {
    const issues = []
    if (alert && (isRetinoidRx(rx.id) || alert.level === 'watch')) issues.push(alert)
    // Rulebook R7: benzoyl peroxide weakens classic tretinoin at the same time.
    if (rx.id === 'rx_benzoyl' && mine.some(o => o.id === 'tretinoin' && overlap(o, rx))) {
      issues.push({ level: 'watch', text: 'Ask your doctor about using it with tretinoin', detail: 'Benzoyl peroxide can weaken some tretinoin creams when they go on together. Your doctor will tell you if you should use them at different times.' })
    }
    return {
      key: `rx-${rx.id}`,
      action: 'Your treatment',
      product: rx.name,
      product_id: null,
      rx: true,
      days: rx.days,
      issues,
      why: 'Prescribed by your doctor: use it exactly as they told you. Skynkod adds no other strong active on top.',
    }
  })
}

// Her treatments go right after cleansing (rulebook R3, layering "spot-after-cleanse"),
// in every routine she has: the free one, Rekod, or her own.
export const withTreatmentSteps = (steps = [], period, profile) => {
  const extra = treatmentSteps(profile || {}, period).filter(s => !steps.some(x => x.key === s.key))
  if (!extra.length) return steps
  const last = steps.reduce((at, s, i) => (s.key === 'cleanser' || s.key === 'remover' ? i : at), -1)
  return [...steps.slice(0, last + 1), ...extra, ...steps.slice(last + 1)]
}
