import { loadState, saveState } from './cloud-state'
import { getProductReactions } from './journal-day'
import { getProductsByIds } from './catalog'
import { isActiveProduct } from './new-actives'
import { needsQuestions, verdictOf, followUpDue, answerFollowUp } from './purge-core'

// "Purging or a reaction?" (Lita, 2026-10-25): her answers, kept in her
// account by product, and what the card shows now. The rules: purge-core.js.

export const getPurgeChecks = async (userId) => {
  const checks = await loadState(userId, 'purge_checks', {})
  return checks && typeof checks === 'object' ? checks : {}
}

// A follow-up that's due first, then an answer she hasn't read, then new spots to ask about.
export const purgeCardState = async (userId, now = new Date()) => {
  if (!userId) return null
  const checks = await getPurgeChecks(userId)
  for (const check of Object.values(checks)) {
    const step = followUpDue(check, now)
    if (step) return { kind: 'followup', step, check }
  }
  const unseen = Object.values(checks).find(c => !c.seen)
  if (unseen) return { kind: 'result', check: unseen }
  const reactions = await getProductReactions(userId).catch(() => [])
  const r = reactions.find(x => needsQuestions(x, checks))
  if (!r) return null
  const [product] = await getProductsByIds([r.product.id]).catch(() => [])
  // Not found in the catalogue: the card asks her if it's an active.
  return { kind: 'ask', product: { id: r.product.id, name: product?.name || r.product.name }, active: product ? isActiveProduct(product) : null }
}

const save = async (userId, check) => {
  const checks = await getPurgeChecks(userId)
  checks[check.productId] = check
  await saveState(userId, 'purge_checks', checks)
  return check
}

export const answerPurgeQuestions = (userId, product, answers) =>
  save(userId, { productId: product.id, name: product.name, ...verdictOf(answers), at: new Date().toISOString(), seen: false })

export const answerPurgeFollowUp = (userId, check, step, better) =>
  save(userId, { ...answerFollowUp(check, step, better), seen: false })

export const markPurgeSeen = (userId, check) => save(userId, { ...check, seen: true })
