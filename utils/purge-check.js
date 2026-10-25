import { loadState, saveState } from './cloud-state'
import { supabase } from './supabase'
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

// Strong actives among these products: their spots are looked at for 3 weeks.
const activeIds = async (ids) => new Set((ids.length ? await getProductsByIds(ids) : []).filter(isActiveProduct).map(p => p.id))

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
  const reactions = await getProductReactions(userId, { longFor: activeIds }).catch(() => [])
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

// The product page (Lita, 2026-10-25): "Spots since you started it?" for a
// product she started in the last 8 weeks and hasn't been asked about.
export const purgeOfferFor = async (userId, product) => {
  if (!userId || !product?.id) return null
  const checks = await getPurgeChecks(userId)
  if (checks[product.id]) return null
  const since = new Date(Date.now() - 8 * 7 * 86400000).toISOString()
  const [opened, journal] = await Promise.all([
    supabase.from('user_products').select('id').eq('user_id', userId).eq('product_id', product.id).gte('opened_at', since).limit(1),
    supabase.from('journal_entries').select('products_used').eq('user_id', userId).gte('date', since),
  ])
  const inJournal = (journal.data || []).some(r => Array.isArray(r.products_used) && r.products_used.some(p => p?.id === product.id))
  if (!opened.data?.length && !inJournal) return null
  return { kind: 'ask', manual: true, product: { id: product.id, name: product.name }, active: isActiveProduct(product) }
}

export const purgeCheckOf = async (userId, productId) => (await getPurgeChecks(userId))[productId] || null
