// Purging or a reaction? (Lita, 2026-10-25). When spots keep showing up after
// a new product, 3 questions tell the two apart, so a working retinol isn't
// stopped for a purge, and a product that irritates isn't kept "because it purges".
//   - Only actives that speed up skin renewal purge. A cream, a cleanser or a
//     sunscreen can't: spots after them are a reaction.
//   - A purge shows up where spots usually are. New places point to a reaction.
//   - Itching, stinging or burning point to a reaction.
//   - A purge settles in 4 to 6 weeks: the app asks again at 4 weeks, and at
//     8 weeks without getting better, it says to see a dermatologist.
// Pure rules (no app imports), so the tests can run them.

export const PURGE_TAG = 'New pimple'
const WEEK = 7 * 86400000

export const verdictOf = ({ active, where, itch }) => {
  if (!active) return { verdict: 'reaction', reason: 'not-active' }
  if (where === 'new') return { verdict: 'reaction', reason: 'new-place' }
  if (itch) return { verdict: 'reaction', reason: 'itch' }
  return { verdict: 'purge', reason: null }
}

// Spots after a product she hasn't been asked about yet.
export const needsQuestions = (reaction, checks = {}) =>
  !!reaction?.product?.id && (reaction.tags || [reaction.tag]).includes(PURGE_TAG) && !checks[reaction.product.id]

// A purge still followed (or confirmed): the journal doesn't count it as a reaction.
export const isPurging = check => check?.verdict === 'purge'

// The next follow-up of a purge, if it's due: 'week4', then 'week8' if it wasn't better yet.
export const followUpDue = (check, now = new Date()) => {
  if (!isPurging(check) || check.closed) return null
  const weeks = (new Date(now) - new Date(check.at)) / WEEK
  if (!check.week4 && weeks >= 4) return 'week4'
  if (check.week4 === 'not-yet' && !check.week8 && weeks >= 8) return 'week8'
  return null
}

// When the next follow-up falls (for the morning reminder).
export const followUpDate = check => {
  if (!isPurging(check) || check.closed) return null
  if (!check.week4) return new Date(new Date(check.at).getTime() + 4 * WEEK)
  if (check.week4 === 'not-yet' && !check.week8) return new Date(new Date(check.at).getTime() + 8 * WEEK)
  return null
}

export const answerFollowUp = (check, step, better) => {
  if (step === 'week4') return better ? { ...check, week4: 'better', closed: true } : { ...check, week4: 'not-yet' }
  // 8 weeks and still not better: not a purge any more.
  return better ? { ...check, week8: 'better', closed: true } : { ...check, week8: 'not-better', verdict: 'reaction', reason: 'too-long', closed: true }
}

// The safety net (Lita, 2026-10-25): after a "purge" answer, itching on 2 days
// or redness on 3 days in her journal means it's a reaction after all.
export const laterReaction = (check, rows = []) => {
  if (!isPurging(check) || check.closed) return false
  const after = rows.filter(r => new Date(r.date) > new Date(check.at))
  const days = tag => new Set(after.filter(r => (r.skin_conditions || []).includes(tag)).map(r => new Date(r.date).toDateString())).size
  return days('Itchiness / Sensitivity') >= 2 || days('Redness') >= 3
}

// A purge still running: Rekod doesn't step up meanwhile.
export const purgeRunning = checks => Object.values(checks || {}).some(c => isPurging(c) && !c.closed)
