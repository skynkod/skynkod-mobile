import { findIngredients } from './ingredients-guide'
import { buyVerdict } from './buy-advice'
import { TREATS } from './stop-advice'

// "My next best buy" (Lita, 2026-10-24): her To buy list ranked by what her
// routine really needs, and what not to buy yet. #1 is free, the rest Premium.

const ESSENTIALS = [
  { category: 'cleanser', label: 'A cleanser', why: 'You don’t have one: every routine starts with it.', query: 'cleanser' },
  { category: 'moisturizer', label: 'A moisturizer', why: 'You don’t have one: your skin barrier needs it.', query: 'moisturizer' },
  { category: 'sunscreen', label: 'A sunscreen', why: 'You don’t have one: it’s the most important step of all.', query: 'sunscreen' },
]

// owned: [{ product, life }], toBuy: catalogue products in her To buy list.
// { ranked: [{ kind, label?, product?, text, params, query? }], skip: [{ product, text, params }] }
export const nextBestBuys = ({ owned = [], toBuy = [], profile = null }) => {
  const usable = owned.filter(o => o.product && o.life?.status !== 'expired').map(o => o.product)
  const ranked = []
  const listed = cat => toBuy.some(p => p.category === cat)

  // 1. The basics she doesn't have (unless one is already in her list: it comes up below).
  for (const e of ESSENTIALS) {
    if (!usable.some(p => p.category === e.category) && !listed(e.category)) ranked.push({ kind: 'missing', label: e.label, text: e.why, query: e.query })
  }
  // 2. A basic running out, with nothing else of its kind.
  for (const o of owned) {
    if (!o.product || !ESSENTIALS.some(e => e.category === o.product.category)) continue
    if (!['soon', 'expired'].includes(o.life?.status)) continue
    if (usable.some(p => p.id !== o.product.id && p.category === o.product.category)) continue
    ranked.push({ kind: 'replace', product: o.product, text: o.life.status === 'expired' ? 'Past its date: replace it.' : 'It runs out in {n} days: replace it.', params: { n: o.life.daysLeft } })
  }
  // 3. Her list: what fills a gap first, then her call; the rest can wait.
  const skip = []
  const later = []
  for (const product of toBuy) {
    const v = buyVerdict({ product, profile, owned: usable })
    if (!v) continue
    if (v.answer === 'yes') ranked.push({ kind: 'list', product, text: v.text, params: v.params })
    else if (v.answer === 'yourCall') later.push({ kind: 'list', product, text: v.text, params: v.params })
    else skip.push({ product, text: v.text, params: v.params })
  }
  // 4. Nothing for her main concern, owned or listed.
  const main = profile?.priority
  const targets = p => TREATS.includes(p.category) && findIngredients(p).some(f => f.pos <= 8 && (f.entry.goodFor || []).includes(main))
  if (main && ![...usable, ...toBuy].some(targets)) {
    ranked.push({ kind: 'missing', label: 'A treatment for {concern}', params: { concern: main.toLowerCase() }, text: 'Nothing you own targets your main concern yet.', query: main })
  }
  return { ranked: [...ranked, ...later], skip }
}
