// The makeup remover step (Lita, 2026-10-25): first step of the evening, before
// the cleanser (double cleansing), to take off makeup and sunscreen.
//   - every evening when she wears sunscreen or makeup every day;
//   - optional ("on evenings you wear makeup") when she wears makeup some days:
//     it doesn't count in the routine's total;
//   - none otherwise.
// Pure (no app imports), so the tests can run it.

// Removers are cleansers by category: told apart by their name.
const REMOVER = /micell|cleansing\s?(oil|balm|water)|make[\s-]?up\s?remov|d[ée]maquill|bi[\s-]?phas|huile\s?nettoyante|baume\s?nettoyant|eau\s?nettoyante/i
export const isRemover = product => REMOVER.test(product?.name || '')

// 'every' | 'optional' | null
export const removerNeed = ({ makeup = null, hasSpf = false } = {}) => (hasSpf || makeup === 'daily' ? 'every' : makeup === 'some' ? 'optional' : null)

// Dry skin: a balm or an oil melts makeup without drying; otherwise a gentle micellar water.
export const removerPrefer = profile => (profile?.skin_type === 'Dry'
  ? p => /oil|balm|huile|baume/i.test(p.name || '')
  : p => /micell/i.test(p.name || ''))

export const REMOVER_ACTION = 'Remove makeup & SPF'

// An evening routine that needs the step but hasn't got one shows it empty, to pick
// a remover (like Lips); with makeup only some days, the step is optional.
export const withRemoverStep = (steps = [], need = null) => {
  if (!need) return steps
  const optional = need === 'optional'
  if (steps.some(s => s.key === 'remover')) return steps.map(s => (s.key === 'remover' ? { ...s, optional } : s))
  return [{ key: 'remover', action: REMOVER_ACTION, product: null, product_id: null, cats: ['cleanser'], days: null, optional }, ...steps]
}

// The morning routine has a sunscreen.
export const hasSunscreen = (steps = [], products = {}) => steps.some(s => s.key === 'sunscreen' || products[s.product_id]?.category === 'sunscreen')
