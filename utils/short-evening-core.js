// "Short version tonight" (Lita, 2026-10-25): on a tired evening, the routine
// keeps only the essentials (makeup remover, cleanser, cream, lips), so she doesn't skip it all.
//   - Rekod takes a one-night pause: the whole programme moves one evening
//     later (nights, weekly review, end), then goes on as planned.
//   - 3 short evenings in a week: once, Home offers to simplify her routine.
// Pure rules (no app imports), so the tests can run them.

const DAY = 86400000
// Step keys from routine-steps.js (her own routines and Rekod use the same ones).
const KEEP_KEYS = ['remover', 'cleanser', 'moisturizer', 'lips']

// The essentials of tonight's steps: never a strong night's step.
// Her prescribed treatment stays on a short evening: Skynkod never skips it for her.
export const shortSteps = (steps = []) => steps.filter(st => st.rx || (!st.night && KEEP_KEYS.includes(st.key)))

// Worth offering only when it really makes the evening shorter.
export const canGoShort = (steps = []) => {
  const withProduct = steps.filter(st => st.product)
  return withProduct.length > 2 && shortSteps(withProduct).length > 0 && shortSteps(withProduct).length < withProduct.length
}

// Rekod's one-night pause: everything one evening later. `by` = -1 undoes it.
export const shiftPlan = (plan, by = 1) => {
  const move = iso => (iso ? new Date(new Date(iso).getTime() + by * DAY).toISOString() : iso)
  return { ...plan, dayShift: ((plan.dayShift || 0) + by + 7) % 7, startedAt: move(plan.startedAt), restUntil: move(plan.restUntil) }
}

// 3 short evenings in the last 7 days, and not offered in the last 30 days.
export const shouldSuggestSimplify = (state, now = new Date()) => {
  const recent = (state?.dates || []).filter(d => now - new Date(d) < 7 * DAY && now >= new Date(d))
  const offered = state?.suggestedAt && now - new Date(state.suggestedAt) < 30 * DAY
  return recent.length >= 3 && !offered
}
