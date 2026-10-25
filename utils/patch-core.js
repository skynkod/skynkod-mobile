// "New product" mode (Lita, 2026-10-25): test a new product on a small area
// for 24 hours, and one new product at a time. Light on purpose:
//   - offered only to sensitive skin, allergies, or for a strong active;
//   - offered once, right when she adds or opens the product;
//   - after 2 "No thanks", never offered again;
//   - asked the next morning; left unanswered for a week, it's dropped.
// Pure rules (no app imports), so the tests can run them.

const DAY = 86400000
export const NEW_PRODUCT_WAIT_DAYS = 7
const REACTIVE = ['Rosacea', 'Eczema', 'Perioral dermatitis', 'Seborrheic dermatitis']

// Does this person need the test for this product?
export const needsPatchTest = ({ profile, active }) => !!(
  active
  || (profile?.avoid_ingredients || []).length
  || (profile?.skin_concerns || []).includes('Sensitivity')
  || (profile?.skin_conditions || []).some(c => REACTIVE.includes(c))
  || profile?.fragile
)

export const canOffer = ({ state, productId, profile, active }) =>
  needsPatchTest({ profile, active }) && (state?.declines || 0) < 2 && !state?.tests?.[productId]

const dayStart = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime() }

// The test waiting for its answer: from the next morning, for a week.
export const testDue = (state, now = new Date()) => Object.values(state?.tests || {})
  .filter(t => !t.result && dayStart(now) > dayStart(t.at) && now - new Date(t.at) < 7 * DAY)
  .sort((a, b) => new Date(a.at) - new Date(b.at))[0] || null

// The morning after a test (for the reminder).
export const testMorning = test => new Date(dayStart(test.at) + DAY)

// Another product started less than a week ago: one at a time.
// started: [{ id, name, date }]
export const recentOther = ({ productId, started = [], now = new Date(), wait = NEW_PRODUCT_WAIT_DAYS }) => {
  const recent = started
    .filter(s => s.id !== productId && now - new Date(s.date) < wait * DAY && now >= new Date(s.date))
    .sort((a, b) => new Date(b.date) - new Date(a.date))[0]
  return recent ? { ...recent, until: new Date(dayStart(recent.date) + wait * DAY) } : null
}
