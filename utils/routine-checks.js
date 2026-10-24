// Routine-level safety: how often each product is used, and what clashes when
// products are used together. Steps carry `days` (0 = Sunday … 6 = Saturday);
// no `days` means every day.

import { findIngredients } from './ingredients-guide'

export const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6]
export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export const daysOf = step => (Array.isArray(step?.days) && step.days.length ? step.days : EVERY_DAY)
export const usedOn = (step, day) => daysOf(step).includes(day)
export const todaySteps = (steps = [], date = new Date()) => steps.filter(s => usedOn(s, date.getDay()))

export const describeDays = (days) => {
  const d = Array.isArray(days) && days.length ? [...days].sort() : EVERY_DAY
  if (d.length === 7) return 'Every day'
  return d.map(i => DAY_LABELS[i]).join(', ')
}

// What a product does that matters for scheduling and clashes.
export const activesOf = (product) => {
  const ids = new Set(findIngredients(product).map(f => f.entry.id))
  const name = `${product?.name || ''}`.toLowerCase()
  const strongAcid = ids.has('glycolic') || ids.has('salicylic') || ids.has('lactic') || ids.has('mandelic') || /aha|bha|peel|exfoli/.test(name)
  return {
    retinoid: ids.has('retinol'),
    acid: strongAcid,
    exfoliant: strongAcid || product?.category === 'exfoliant' || ids.has('scrub'),
    vitaminC: ids.has('vitaminc'),
    benzoyl: ids.has('benzoyl'),
    spf: product?.category === 'sunscreen' || ids.has('zincoxide') || ids.has('chemicalspf'),
  }
}

// A sensible starting schedule for strong products.
// `stepKey` and `others` (the routine's other slots) let the eye and lip steps
// rotate: eye retinoid 2–3 nights a week with peptides on the other nights,
// lip scrub and lip mask once or twice a week (Lita, 2026-10-24).
export const suggestedDays = (product, period, stepKey = null, others = []) => {
  const a = activesOf(product)
  if (stepKey === 'lipscrub') return [3]
  if (stepKey === 'lipmask') return [0, 4]
  if (stepKey === 'eye' && period === 'evening') {
    const otherEye = others.filter(o => o.key === 'eye' && o.product && o.product.id !== product?.id)
    const retinoidNights = [1, 3, 5]
    if (a.retinoid) return retinoidNights
    // Peptides on the nights without the eye retinoid.
    if (otherEye.some(o => activesOf(o.product).retinoid)) return EVERY_DAY.filter(d => !retinoidNights.includes(d))
    return EVERY_DAY
  }
  if (product?.category === 'mask') return [0]
  if (a.retinoid) return period === 'evening' ? [1, 3, 5] : EVERY_DAY
  if (a.exfoliant) return [2, 6]
  return EVERY_DAY
}

// Eye and lip products sit on their own small area: they don't count as the
// face's strong actives in the clash checks.
const faceOnly = product => !['eye care', 'lip care'].includes(product?.category)

const overlap = (x, y) => daysOf(x).filter(d => daysOf(y).includes(d))

// Checks one routine (with the other period's routine for context).
// Returns [{ level: 'warning' | 'info', title, text, fix? }], where fix is
// { stepIndex, days } to apply with one tap.
export const checkRoutine = ({ period, steps, productsById, otherSteps = [], otherProductsById = {} }) => {
  const issues = []
  const items = steps
    .map((step, index) => ({ step, index, product: productsById[step.product_id] }))
    .filter(i => i.product)
    .map(i => ({ ...i, a: activesOf(i.product) }))

  const face = items.filter(i => faceOnly(i.product))
  const retinoids = face.filter(i => i.a.retinoid)
  const acids = face.filter(i => i.a.acid && !i.a.retinoid)
  const exfoliants = face.filter(i => i.a.exfoliant)

  // Retinol in the morning: sunlight breaks it down and skin gets more sensitive.
  if (period === 'morning') {
    // Eye creams with retinol too: sunlight breaks retinol down wherever it is.
    for (const r of items.filter(i => i.a.retinoid)) {
      issues.push({
        key: 'retinol-morning',
        stepIndex: r.index,
        level: 'warning',
        title: 'Retinol works best at night',
        text: `${r.product.name} contains retinol. Sunlight breaks it down and makes skin more sensitive, so move it to your night routine.`,
      })
    }
  }

  // Retinol and acids on the same night: too much irritation.
  for (const r of retinoids) {
    for (const c of acids) {
      const same = overlap(r.step, c.step)
      if (!same.length) continue
      const acidDays = daysOf(c.step).filter(d => !daysOf(r.step).includes(d))
      issues.push({
        key: `retinol-acid-${r.product.id}`,
        stepIndex: c.index,
        level: 'warning',
        title: 'Retinol and acids on the same day',
        text: `Using ${r.product.name} and ${c.product.name} together (${describeDays(same)}) can irritate your skin. Alternate them instead.`,
        fix: { stepIndex: c.index, days: acidDays.length ? acidDays : [2, 6].filter(d => !daysOf(r.step).includes(d)) },
      })
    }
  }

  // Exfoliating every day, or several exfoliants the same day.
  for (const e of exfoliants) {
    if (daysOf(e.step).length > 3 && !e.a.retinoid) {
      issues.push({
        key: 'exfoliating-often',
        stepIndex: e.index,
        level: 'warning',
        title: 'Exfoliating too often',
        text: `${e.product.name} exfoliates. Most skin does best with it 2–3 times a week.`,
        fix: { stepIndex: e.index, days: [2, 6] },
      })
    }
  }
  for (let i = 0; i < exfoliants.length; i++) {
    for (let j = i + 1; j < exfoliants.length; j++) {
      const same = overlap(exfoliants[i].step, exfoliants[j].step)
      if (same.length) {
        issues.push({
          key: `two-exfoliants-${exfoliants[i].product.id}`,
          stepIndex: exfoliants[j].index,
          level: 'warning',
          title: 'Two exfoliants on the same day',
          text: `${exfoliants[i].product.name} and ${exfoliants[j].product.name} both exfoliate (${describeDays(same)}). Use them on different days.`,
          fix: { stepIndex: exfoliants[j].index, days: daysOf(exfoliants[j].step).filter(d => !daysOf(exfoliants[i].step).includes(d)) },
        })
      }
    }
  }

  // Vitamin C with benzoyl peroxide: they cancel each other out.
  for (const v of items.filter(i => i.a.vitaminC)) {
    for (const b of items.filter(i => i.a.benzoyl)) {
      if (overlap(v.step, b.step).length) {
        issues.push({
          key: `vitc-benzoyl-${v.product.id}`,
          stepIndex: b.index,
          level: 'info',
          title: 'Vitamin C and benzoyl peroxide',
          text: `Benzoyl peroxide can deactivate vitamin C. Use ${v.product.name} in the morning and ${b.product.name} at night.`,
        })
      }
    }
  }

  // Retinol or acids at night need sunscreen in the morning.
  if (period === 'morning') {
    const hasSpf = items.some(i => i.a.spf)
    const otherItems = otherSteps.map(s => otherProductsById[s.product_id]).filter(Boolean).map(activesOf)
    if (!hasSpf && otherItems.some(a => a.retinoid || a.acid)) {
      issues.push({
        level: 'warning',
        title: 'Add sunscreen in the morning',
        text: 'Your night routine has retinol or acids, which make skin more sensitive to the sun. SPF every morning is a must.',
      })
    } else if (!hasSpf) {
      issues.push({ level: 'info', title: 'No sunscreen yet', text: 'SPF is the best anti-aging and anti-dark-spot step. Consider adding one to your morning routine.' })
    }
  }

  // Warnings the user said they're used to stay quiet for that product.
  return issues.filter(i => i.stepIndex === undefined || !(steps[i.stepIndex]?.acks || []).includes(i.key))
}
