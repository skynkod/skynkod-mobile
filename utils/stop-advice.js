import { findIngredients, productMatch, isUnsuitable } from './ingredients-guide'

// "Consider stopping" (Lita, 2026-10-24): Skynkod sometimes tells her to stop
// a product, never to sell her another one. One reason per product, the most
// important first. The product isn't necessarily bad: it just doesn't make
// sense for her now. Safety reasons are free, saving-money advice is Premium.

export const CONCERNS = ['Acne', 'Redness', 'Dryness', 'Dark spots', 'Fine lines', 'Large pores', 'Dullness', 'Sensitivity']
// Products that treat something (the basics, cleanser, moisturizer and sunscreen, are never "not needed").
export const TREATS = ['serum', 'toner', 'exfoliant', 'mask']
// Ingredients that give a product its job: two products of the same kind with one in common do the same job.
const KEY_IDS = new Set(['retinol', 'vitaminc', 'niacinamide', 'azelaic', 'salicylic', 'glycolic', 'lactic', 'mandelic', 'pha', 'txa', 'arbutin', 'kojic', 'bakuchiol', 'benzoyl', 'peptides', 'argireline', 'matrixyl', 'copperpeptides'])

export const keyActives = product => findIngredients(product).filter(f => f.pos <= 8 && KEY_IDS.has(f.entry.id)).map(f => f.entry)

// product: the catalogue product. reaction: { tag, count } from the journal.
// life: shelfLife() of her row. others: the other products in her routines.
// verdict: her answer when it was time to judge it ('better' | 'same' | 'worse').
// { kind, level: 'danger' | 'warning' | 'muted', free, title, text, params } | null
export const stopReason = ({ product, profile = null, reaction = null, life = null, others = [], verdict = null }) => {
  if (!product) return null
  // She said so herself, at the "time to look" of Your expectations.
  if (verdict === 'worse') {
    return { kind: 'notHelping', level: 'danger', free: true, title: 'Your skin got worse', text: 'You said your skin got worse since you started it.' }
  }
  if (reaction) {
    return { kind: 'reaction', level: 'danger', free: true, title: 'Your skin reacts to it', text: '{tag} on {n} days after you used it.', params: { tag: reaction.tag.toLowerCase(), n: reaction.count } }
  }
  const match = profile ? productMatch(product, profile) : null
  if (match && isUnsuitable(match)) {
    const first = match.avoid[0] || match.triggered[0]
    return { kind: 'unsuitable', level: 'danger', free: true, title: 'Not for your skin', text: first.text }
  }
  if (life?.status === 'expired') {
    return { kind: 'expired', level: 'muted', free: true, title: 'Past its date', text: 'Opened longer than it keeps: it may not work well anymore. Replace it.' }
  }
  if (TREATS.includes(product.category)) {
    // Same kind of product, same key ingredient: the weaker match of the two gets the label.
    const mine = keyActives(product)
    for (const other of others) {
      if (!other || other.id === product.id || other.category !== product.category) continue
      const shared = keyActives(other).find(a => mine.some(m => m.id === a.id))
      if (!shared) continue
      const score = p => (profile ? productMatch(p, profile).score : 0)
      const weaker = score(product) < score(other) || (score(product) === score(other) && String(product.id) > String(other.id))
      if (weaker) return { kind: 'duplicate', level: 'warning', free: false, title: 'Does the same job', text: 'Same job as {other} ({active}), already in your routine.', params: { other: other.name, active: shared.name.toLowerCase() } }
    }
    // It targets concerns she doesn't have.
    const hers = [...new Set([...(profile?.skin_concerns || []), profile?.priority, profile?.secondary].filter(Boolean))]
    const targets = [...new Set(mine.flatMap(a => (a.goodFor || []).filter(g => CONCERNS.includes(g))))]
    if (hers.length && targets.length && !targets.some(c => hers.includes(c))) {
      return { kind: 'notNeeded', level: 'warning', free: false, title: 'Not needed for you now', text: 'It mainly targets {targets}, which isn’t among your concerns.', params: { targets: targets.slice(0, 2).map(c => c.toLowerCase()).join(' and ') } }
    }
  }
  return null
}
