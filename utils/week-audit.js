import { activesOf, daysOf } from './routine-checks'
import { findIngredients } from './ingredients-guide'
import { prioritiesOf } from './skin-quiz'

// "Your week" (Lita, 2026-10-24): her routines looked at over the whole week,
// not day by day. What each evening does, and what adds up too much: too many
// exfoliations, no recovery night, several products for the same concern.

const MON_FIRST = [1, 2, 3, 4, 5, 6, 0]
export const WEEK_LABELS = { retinoid: 'Retinoid', exfoliation: 'Exfoliation', both: 'Retinoid + acid', recovery: 'Recovery' }
const face = p => p && !['eye care', 'lip care'].includes(p.category)
// Products that treat (not the cleanser, moisturizer or sunscreen basics).
const TREATS = ['serum', 'toner', 'exfoliant', 'mask']

export const weekAudit = ({ morning = [], evening = [], productsById = {}, profile = null } = {}) => {
  const items = period => (period === 'morning' ? morning : evening)
    .map(step => ({ step, product: productsById[step.product_id] }))
    .filter(i => face(i.product))
    .map(i => ({ ...i, a: activesOf(i.product) }))
  const am = items('morning')
  const pm = items('evening')

  // Each evening, Monday first.
  const week = MON_FIRST.map(day => {
    const on = pm.filter(i => daysOf(i.step).includes(day))
    const ret = on.some(i => i.a.retinoid)
    const exf = on.some(i => i.a.exfoliant && !i.a.retinoid)
    return { day, kind: ret && exf ? 'both' : ret ? 'retinoid' : exf ? 'exfoliation' : 'recovery' }
  })

  // Exfoliations over the week, morning and evening together.
  const exfoliants = [...am, ...pm].filter(i => i.a.exfoliant && !i.a.retinoid)
  const exfoliations = exfoliants.reduce((n, i) => n + daysOf(i.step).length, 0)
  const exfoliantProducts = new Set(exfoliants.map(i => i.product.id)).size
  const retinoidNights = week.filter(w => w.kind === 'retinoid' || w.kind === 'both').length
  const recoveryNights = week.filter(w => w.kind === 'recovery').length

  const notes = []
  if (exfoliations > 3) notes.push({ level: 'warning', text: 'You exfoliate {n} times this week. Most skin does best with 2 or 3.', params: { n: exfoliations } })
  if (exfoliantProducts >= 3) notes.push({ level: 'warning', text: 'You use {n} exfoliating products. One or two are usually enough.', params: { n: exfoliantProducts } })
  if (week.some(w => w.kind === 'both')) notes.push({ level: 'warning', text: 'Retinoid and acid on the same evening: alternate them instead.' })
  if ((retinoidNights || exfoliations) && recoveryNights < 2) notes.push({ level: 'warning', text: 'Only {n} recovery evenings this week. Give your skin at least 2 or 3 nights without strong actives.', params: { n: recoveryNights } })

  // Several treatments for the same concern: her priorities first, then any concern.
  const treats = [...new Map([...am, ...pm].filter(i => TREATS.includes(i.product.category)).map(i => [i.product.id, i.product])).values()]
  const { main, second } = prioritiesOf({ concerns: profile?.skin_concerns || [], priority: profile?.priority, secondary: profile?.secondary })
  const concerns = [...new Set([main, second, ...(profile?.skin_concerns || [])].filter(Boolean))]
  for (const concern of concerns) {
    const targeting = treats.filter(p => findIngredients(p).some(f => f.pos <= 8 && (f.entry.goodFor || []).includes(concern)))
    if (targeting.length >= 3) {
      notes.push({ level: 'info', text: 'You have {n} products targeting {concern}. You may not need all of them.', params: { n: targeting.length, concern: concern.toLowerCase() }, products: targeting.map(p => p.name) })
      break
    }
  }

  const balanced = !notes.some(n => n.level === 'warning') && (retinoidNights || exfoliations)
  return { week, exfoliations, retinoidNights, recoveryNights, notes, balanced: !!balanced }
}
