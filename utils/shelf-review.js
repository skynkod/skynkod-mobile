import { findIngredients, productMatch } from './ingredients-guide'
import { activesOf } from './routine-checks'
import { stopReason } from './stop-advice'

// "Your shelf" (Lita, 2026-10-24): every product she owns sorted into Keep,
// Use less often, Not right now (her skin today) and Consider stopping, plus what is really missing. The point
// is to buy less: "You only need one". Summary free, the lists Premium.

export const SHELF_GROUPS = [
  { key: 'keep', label: 'Keep', color: 'success' },
  { key: 'lessOften', label: 'Use less often', color: 'caution' },
  { key: 'notNow', label: 'Not right now', color: 'warning' },
  { key: 'stop', label: 'Consider stopping', color: 'danger' },
  { key: 'missing', label: 'Missing', color: 'primary' },
]
const ESSENTIALS = [
  { category: 'cleanser', label: 'A gentle cleanser' },
  { category: 'moisturizer', label: 'A moisturizer' },
  { category: 'sunscreen', label: 'A sunscreen' },
]
const TREATS = ['serum', 'toner', 'exfoliant', 'mask']

// owned: [{ product, life }], reactions: { [productId]: { tag, count } },
// routineProducts: products in her routines, tooManyExfoliations: from "Your week".
export const shelfReview = ({ owned = [], profile = null, reactions = {}, routineProducts = [], tooManyExfoliations = false, verdicts = {} }) => {
  const groups = { keep: [], lessOften: [], notNow: [], stop: [], missing: [] }
  const others = [...routineProducts, ...owned.map(o => o.product)].filter((p, i, all) => p && all.findIndex(x => x?.id === p.id) === i)
  for (const { product, life } of owned) {
    if (!product) continue
    const advice = stopReason({ product, profile, reaction: reactions[product.id], life, others, verdict: verdicts[product.id]?.value })
    const match = profile ? productMatch(product, profile) : null
    // Words used everywhere: Not right now = her skin today (temporary),
    // Consider stopping = stop it.
    if (advice) {
      groups.stop.push({ product, why: { text: advice.params ? advice.text : advice.title, params: advice.params } })
    } else if (match?.notNow) {
      groups.notNow.push({ product, why: { text: match.notNow.title } })
    } else if (tooManyExfoliations && activesOf(product).exfoliant) {
      groups.lessOften.push({ product, why: { text: 'Your week has too many exfoliations: 2 or 3 are enough.' } })
    } else {
      groups.keep.push({ product })
    }
  }
  // What's really missing: the three basics, then one treatment for her main concern.
  const usable = [...groups.keep, ...groups.lessOften].map(x => x.product)
  for (const e of ESSENTIALS) if (!usable.some(p => p.category === e.category)) groups.missing.push({ label: e.label })
  const main = profile?.priority
  if (main && !usable.some(p => TREATS.includes(p.category) && findIngredients(p).some(f => f.pos <= 8 && (f.entry.goodFor || []).includes(main)))) {
    groups.missing.push({ label: 'A treatment for {concern}', params: { concern: main.toLowerCase() } })
  }
  return { groups, total: owned.filter(o => o.product).length }
}
