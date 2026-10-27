// The sunscreens Skynkod suggests (rulebook B2, AAD): SPF 30 at least, and UVA
// protection, from a known UVA filter in the list or the label's own words (some
// US lists leave the filters out). Pure, so the tests can run it.

const UVA_FILTER = /butyl methoxydibenzoylmethane|avobenzone|zinc oxide|titanium dioxide|bis-ethylhexyloxyphenol methoxyphenyl triazine|methylene bis-benzotriazolyl|terephthalylidene dicamphor|drometrizole trisiloxane|diethylamino hydroxybenzoyl hexyl benzoate|methoxypropylamino cyclohexenylidene|phenylene bis-diphenyltriazine/i
const UVA_LABEL = /broad[\s-]?spectrum|large spectre|\buva\b|uvmune|\bpa\s?\+{3,4}|\bzinc\b|mineral|min[ée]ral/i

// The SPF on the label ("SPF 50+", "SPF50", "IP 30"), or null when it doesn't say.
export const spfOf = (product) => {
  const m = (product?.name || '').match(/\bspf\s?(\d{1,3})|\bip\s?(\d{2,3})\b/i)
  return m ? Number(m[1] || m[2]) : null
}
export const hasUva = product => UVA_FILTER.test(product?.ingredients_text || '') || UVA_LABEL.test(product?.name || '')
// A label with no SPF number passes on its UVA filters; SPF 15 or 20 never does.
export const sunscreenOk = product => (spfOf(product) == null || spfOf(product) >= 30) && hasUva(product)

// Dark spots, melasma or a deeper skin tone: tinted sunscreens are suggested, never imposed (Lita, 2026-10-27).
export const tintTip = (profile = {}) => (profile.skin_concerns || []).includes('Dark spots')
  || (profile.skin_conditions || []).includes('Melasma')
  || (profile.tone != null && profile.tone >= 3)
export const TINT_TIP = 'A tinted sunscreen with iron oxides also blocks visible light, which darkens spots: a good choice for you.'
