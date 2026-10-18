// What common skincare ingredients do and who they suit. Concern and skin
// type names match the onboarding answers (users.skin_concerns / skin_type).
// `match` lists lowercase INCI fragments that identify the ingredient.

export const INGREDIENTS = [
  { id: 'niacinamide', name: 'Niacinamide', match: ['niacinamide'], what: 'Vitamin B3. Calms redness, evens tone, controls oil and strengthens the barrier.', goodFor: ['Redness', 'Large pores', 'Dark spots', 'Acne', 'Oily', 'Combination', 'Dullness'] },
  { id: 'hyaluronic', name: 'Hyaluronic acid', match: ['hyaluronic acid', 'sodium hyaluronate', 'hyaluronate'], what: 'Draws water into the skin for plump, bouncy hydration.', goodFor: ['Dryness', 'Fine lines', 'Dry', 'Normal', 'Combination', 'Sensitive'] },
  { id: 'ceramides', name: 'Ceramides', match: ['ceramide'], what: 'Lipids that rebuild the skin barrier and lock moisture in.', goodFor: ['Dryness', 'Sensitivity', 'Redness', 'Dry', 'Sensitive'] },
  { id: 'glycerin', name: 'Glycerin', match: ['glycerin'], what: 'A gentle, reliable humectant that keeps skin hydrated.', goodFor: ['Dryness', 'Dry', 'Normal', 'Sensitive'] },
  { id: 'panthenol', name: 'Panthenol', match: ['panthenol'], what: 'Pro-vitamin B5. Soothes, hydrates and helps skin repair.', goodFor: ['Sensitivity', 'Redness', 'Dryness', 'Sensitive', 'Dry'] },
  { id: 'centella', name: 'Centella asiatica', match: ['centella', 'madecassoside', 'asiaticoside', 'cica'], what: 'A calming plant extract that soothes irritation and supports healing.', goodFor: ['Redness', 'Sensitivity', 'Acne', 'Sensitive'] },
  { id: 'allantoin', name: 'Allantoin', match: ['allantoin'], what: 'Soothes and softens irritated skin.', goodFor: ['Sensitivity', 'Redness', 'Sensitive'] },
  { id: 'squalane', name: 'Squalane', match: ['squalane'], what: 'A light, non-greasy oil that softens and protects.', goodFor: ['Dryness', 'Fine lines', 'Dry', 'Normal'] },
  { id: 'salicylic', name: 'Salicylic acid (BHA)', match: ['salicylic acid', 'betaine salicylate'], what: 'Oil-soluble exfoliant that clears pores and blackheads.', goodFor: ['Acne', 'Large pores', 'Oily', 'Combination'], caution: ['Sensitive', 'Dry'], cautionWhy: 'can be drying or irritating for dry or sensitive skin' },
  { id: 'glycolic', name: 'Glycolic acid (AHA)', match: ['glycolic acid'], what: 'Surface exfoliant that smooths texture and boosts glow.', goodFor: ['Dullness', 'Dark spots', 'Fine lines', 'Normal', 'Oily'], caution: ['Sensitive'], cautionWhy: 'can sting sensitive skin; use SPF the next day' },
  { id: 'lactic', name: 'Lactic acid (AHA)', match: ['lactic acid'], what: 'A gentler AHA that exfoliates while hydrating.', goodFor: ['Dullness', 'Dryness', 'Dark spots', 'Dry', 'Normal'] },
  { id: 'pha', name: 'PHA', match: ['gluconolactone', 'lactobionic acid'], what: 'The gentlest acids: exfoliate with little irritation.', goodFor: ['Dullness', 'Sensitivity', 'Sensitive'] },
  { id: 'azelaic', name: 'Azelaic acid', match: ['azelaic acid'], what: 'Calms redness, fades marks and helps with breakouts.', goodFor: ['Redness', 'Acne', 'Dark spots', 'Sensitivity'] },
  { id: 'retinol', name: 'Retinol', match: ['retinol', 'retinal', 'retinyl', 'hydroxypinacolone retinoate'], what: 'Vitamin A. Speeds cell renewal for smoother skin, fewer lines and clearer pores.', goodFor: ['Fine lines', 'Acne', 'Dark spots', 'Large pores', 'Oily', 'Normal'], caution: ['Sensitive'], cautionWhy: 'can irritate sensitive skin; start slowly, at night, with SPF the next day' },
  { id: 'bakuchiol', name: 'Bakuchiol', match: ['bakuchiol'], what: 'A plant alternative to retinol, gentler on the skin.', goodFor: ['Fine lines', 'Sensitivity', 'Sensitive'] },
  { id: 'vitaminc', name: 'Vitamin C', match: ['ascorbic acid', 'ascorbyl', 'ascorbic'], what: 'Antioxidant that brightens, fades dark spots and protects from pollution.', goodFor: ['Dullness', 'Dark spots', 'Fine lines', 'Normal', 'Combination'] },
  { id: 'arbutin', name: 'Alpha-arbutin', match: ['arbutin'], what: 'Fades dark spots and evens skin tone.', goodFor: ['Dark spots', 'Dullness'] },
  { id: 'txa', name: 'Tranexamic acid', match: ['tranexamic acid'], what: 'Targets stubborn dark spots and post-acne marks.', goodFor: ['Dark spots'] },
  { id: 'peptides', name: 'Peptides', match: ['peptide', 'palmitoyl', 'acetyl hexapeptide', 'matrixyl'], what: 'Help skin look firmer and smoother.', goodFor: ['Fine lines', 'Normal', 'Dry'] },
  { id: 'zinc', name: 'Zinc', match: ['zinc pca', 'zinc gluconate'], what: 'Helps regulate oil and calm breakouts.', goodFor: ['Acne', 'Oily', 'Large pores'] },
  { id: 'snail', name: 'Snail mucin', match: ['snail secretion'], what: 'Hydrates, soothes and helps skin repair.', goodFor: ['Dryness', 'Dark spots', 'Dullness', 'Dry', 'Normal'] },
  { id: 'heartleaf', name: 'Heartleaf (Houttuynia)', match: ['houttuynia'], what: 'Calms irritation and helps with breakouts.', goodFor: ['Acne', 'Redness', 'Sensitivity', 'Oily'] },
  { id: 'greentea', name: 'Green tea', match: ['camellia sinensis', 'green tea'], what: 'Antioxidant that soothes and helps control oil.', goodFor: ['Redness', 'Oily', 'Acne'] },
  { id: 'urea', name: 'Urea', match: ['urea'], what: 'Hydrates deeply and softens rough, dry patches.', goodFor: ['Dryness', 'Dry'] },
  { id: 'benzoyl', name: 'Benzoyl peroxide', match: ['benzoyl peroxide'], what: 'Kills acne bacteria; strong but effective on breakouts.', goodFor: ['Acne'], caution: ['Sensitive', 'Dry'], cautionWhy: 'is very drying and can bleach fabrics' },
  { id: 'zincoxide', name: 'Zinc oxide (mineral SPF)', match: ['zinc oxide'], what: 'Mineral UV filter, gentle on reactive skin.', goodFor: ['Sensitivity', 'Redness', 'Sensitive'] },
  // Watch-outs: no benefits listed, only cautions.
  { id: 'fragrance', name: 'Fragrance', match: ['parfum', 'fragrance', 'aroma'], what: 'Adds scent. Not needed by the skin and a common cause of irritation.', goodFor: [], caution: ['Sensitive', 'Sensitivity', 'Redness'], cautionWhy: 'can irritate sensitive or reactive skin' },
  { id: 'alcohol', name: 'Drying alcohol', match: ['alcohol denat', 'sd alcohol', 'ethanol'], what: 'Makes textures light, but can dry out and irritate skin.', goodFor: [], caution: ['Dry', 'Sensitive', 'Dryness', 'Sensitivity'], cautionWhy: 'can dry out and irritate the skin' },
  { id: 'essentialoils', name: 'Essential oils', match: ['limonene', 'linalool', 'citral', 'eugenol', 'lavandula', 'citrus aurantium', 'mentha'], what: 'Natural scent compounds that can sensitize skin.', goodFor: [], caution: ['Sensitive', 'Sensitivity', 'Redness'], cautionWhy: 'can trigger reactions on sensitive skin' },
  { id: 'comedogenic', name: 'Pore-clogging oils', match: ['cocos nucifera', 'coconut oil', 'isopropyl myristate', 'isopropyl palmitate', 'myristyl myristate'], what: 'Rich ingredients that can clog pores on breakout-prone skin.', goodFor: [], caution: ['Acne', 'Oily', 'Large pores'], cautionWhy: 'can clog pores on oily or acne-prone skin' },
]

const byId = Object.fromEntries(INGREDIENTS.map(i => [i.id, i]))
export const getIngredient = id => byId[id]

// Guide entries found in a product's ingredient list.
export const findIngredients = (product) => {
  const list = [...(product?.ingredients || []), ...(product?.key_ingredients || [])].map(s => String(s).toLowerCase())
  return INGREDIENTS.filter(entry => entry.match.some(m => list.some(i => i.includes(m))))
}

// Search the guide by name or INCI fragment.
export const searchIngredients = (query) => {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  return INGREDIENTS.filter(i => i.name.toLowerCase().includes(q) || i.match.some(m => m.includes(q) || q.includes(m)))
}

// How well one guide ingredient suits the user's skin.
export const ingredientFit = (entry, profile) => {
  const mine = [profile?.skin_type, ...(profile?.skin_concerns || [])].filter(Boolean)
  const helps = entry.goodFor.filter(g => mine.includes(g))
  const warns = (entry.caution || []).filter(c => mine.includes(c))
  if (warns.length) return { label: 'Use with care', tone: 'warning', helps, warns }
  if (helps.length) return { label: 'Great for you', tone: 'success', helps, warns }
  if (!entry.goodFor.length) return { label: 'Not needed', tone: 'neutral', helps, warns }
  return { label: 'Fine for you', tone: 'neutral', helps, warns }
}

// Product match score (30–98) with the reasons behind it.
export const productMatch = (product, profile) => {
  const found = findIngredients(product)
  const mine = [profile?.skin_type, ...(profile?.skin_concerns || [])].filter(Boolean)
  const good = []
  const care = []
  for (const entry of found) {
    const helps = entry.goodFor.filter(g => mine.includes(g))
    const warns = (entry.caution || []).filter(c => mine.includes(c))
    if (helps.length) good.push({ entry, text: `${entry.name} helps with ${helps.map(h => h.toLowerCase()).join(', ')}` })
    if (warns.length) care.push({ entry, text: `${entry.name} ${entry.cautionWhy}` })
  }
  let score = mine.length ? 70 : 75
  score += Math.min(25, good.length * 9)
  score -= Math.min(40, care.length * 15)
  score = Math.max(30, Math.min(98, score))
  const label = score >= 85 ? 'Great for you' : score >= 70 ? 'Good match' : score >= 55 ? 'OK for you' : 'Use with care'
  const tone = score >= 70 ? 'success' : score >= 55 ? 'neutral' : 'warning'
  const partial = !product?.ingredients_text
  return { score, label, tone, good, care, found, partial }
}
