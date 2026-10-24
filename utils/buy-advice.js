import { productMatch, isUnsuitable, findIngredients } from './ingredients-guide'
import { keyActives, TREATS, CONCERNS } from './stop-advice'

// "Should I buy this?" (Lita, 2026-10-24): before she buys a product she saw
// on TikTok or in a shop, Skynkod answers from her skin AND what she already
// owns. The answer is free; the reason is Premium, except "not for your skin"
// (safety), which is always shown.

const ESSENTIALS = { cleanser: 'cleanser', moisturizer: 'moisturizer', sunscreen: 'sunscreen' }

// owned: the catalogue products she owns.
// { answer: 'yes' | 'probablyNot' | 'no' | 'yourCall', free, text, params, save }
export const buyVerdict = ({ product, profile = null, owned = [] }) => {
  if (!product) return null
  const match = profile ? productMatch(product, profile) : null
  if (match && isUnsuitable(match)) {
    const first = match.avoid[0] || match.triggered[0]
    return { answer: 'no', free: true, text: first.text }
  }
  const others = owned.filter(p => p && p.id !== product.id)
  const sameKind = others.filter(p => p.category === product.category)

  // A gap: one of the three basics, or a treatment for her main concern.
  if (ESSENTIALS[product.category] && !sameKind.length) {
    return { answer: 'yes', free: false, text: 'You don’t have a {kind} yet: it fills a gap in your routine.', params: { kind: ESSENTIALS[product.category] } }
  }
  const mine = keyActives(product)
  const main = profile?.priority
  const targets = [...new Set(mine.flatMap(a => (a.goodFor || []).filter(g => CONCERNS.includes(g))))]
  if (TREATS.includes(product.category) && main && targets.includes(main)
    && !others.some(p => TREATS.includes(p.category) && findIngredients(p).some(f => f.pos <= 8 && (f.entry.goodFor || []).includes(main)))) {
    return { answer: 'yes', free: false, text: 'Nothing you own targets {concern} yet: it fills a gap.', params: { concern: main.toLowerCase() } }
  }

  // Already covered: same kind of product with the same key ingredient.
  for (const other of sameKind) {
    const shared = keyActives(other).find(a => mine.some(m => m.id === a.id))
    if (shared) return { answer: 'probablyNot', free: false, save: true, text: 'You already have {other} ({active}): it does the same job.', params: { other: other.name, active: shared.name.toLowerCase() } }
  }
  // It targets concerns she doesn't have.
  const hers = [...new Set([...(profile?.skin_concerns || []), profile?.priority, profile?.secondary].filter(Boolean))]
  if (TREATS.includes(product.category) && hers.length && targets.length && !targets.some(c => hers.includes(c))) {
    return { answer: 'probablyNot', free: false, save: true, text: 'It mainly targets {targets}, which isn’t among your concerns.', params: { targets: targets.slice(0, 2).map(c => c.toLowerCase()).join(' and ') } }
  }
  return sameKind.length
    ? { answer: 'yourCall', free: false, text: 'It suits your skin, but you already have a {kind}: your routine covers this.', params: { kind: product.category } }
    : { answer: 'yourCall', free: false, text: 'It suits your skin and you have nothing like it. Buy it only if it answers something you want.' }
}
