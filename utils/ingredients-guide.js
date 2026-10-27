import { ZONE_CONCERNS, EYE_LIP_ONLY } from './skin-issues'
// Skynkod compatibility engine.
//
// 1. INGREDIENTS describes what common skincare ingredients do (goodFor), how
//    likely they are to clog pores (comedogenic, 0–5, Fulton-style) or to
//    irritate (irritancy, 0–5), and tags used by the rules below.
// 2. productMatch() reads a product's INCI list. Position matters: the first
//    ingredients make up most of the formula, the tail is under ~1%. Rinse-off
//    products (cleansers) weigh much less for pore-clogging.
// 3. The user's answers (skin type, concerns, acne types, conditions,
//    ingredients to avoid, pregnancy) turn tags into benefits, cautions or
//    hard "avoid" flags.
//
// It is a rules engine, not medical advice; the rules are meant to be reviewed
// by a dermatologist or cosmetic chemist as the app grows.

// Profile values understood in goodFor: skin types (Dry, Oily, Combination,
// Normal, Sensitive), concerns (Acne, Redness, Dryness, Dark spots, Fine lines,
// Large pores, Dullness, Sensitivity), acne types (Comedonal, Inflammatory,
// Cystic, Hormonal, Fungal) and conditions (Rosacea, Eczema, Perioral
// dermatitis, Seborrheic dermatitis, Psoriasis, Melasma).

const I = (id, name, match, what, goodFor = [], extra = {}) => ({ id, name, match, what, goodFor, comedogenic: 0, irritancy: 0, tags: [], ...extra })

export const INGREDIENTS = [
  // ---------- Hydrating and barrier ----------
  I('hyaluronic', 'Hyaluronic acid', ['hyaluronic acid', 'sodium hyaluronate', 'hydrolyzed hyaluronic', 'hyaluronate'], 'Draws water into the skin for plump, bouncy hydration.', ['Dryness', 'Fine lines', 'Dry', 'Normal', 'Combination', 'Sensitive', 'Eczema', 'Dehydration']),
  I('glycerin', 'Glycerin', ['glycerin'], 'A gentle, reliable humectant that keeps skin hydrated.', ['Dryness', 'Dry', 'Normal', 'Sensitive', 'Eczema', 'Dehydration']),
  I('ceramides', 'Ceramides', ['ceramide'], 'Lipids that rebuild the skin barrier and lock moisture in.', ['Dryness', 'Sensitivity', 'Redness', 'Dry', 'Sensitive', 'Eczema', 'Rosacea', 'Psoriasis', 'Chapped lips']),
  I('cholesterol', 'Cholesterol', ['cholesterol'], 'Part of the skin barrier; works with ceramides.', ['Dryness', 'Dry', 'Eczema', 'Chapped lips']),
  I('panthenol', 'Panthenol', ['panthenol'], 'Pro-vitamin B5. Soothes, hydrates and helps skin repair.', ['Sensitivity', 'Redness', 'Dryness', 'Sensitive', 'Dry', 'Eczema', 'Rosacea', 'Chapped lips', 'Cracked lip corners', 'Dehydration']),
  I('squalane', 'Squalane', ['squalane'], 'A light, non-greasy oil that softens and protects.', ['Dryness', 'Fine lines', 'Dry', 'Normal', 'Sensitive', 'Chapped lips'], { comedogenic: 1 }),
  I('urea', 'Urea', ['urea'], 'Hydrates deeply and softens rough, dry patches.', ['Dryness', 'Dry', 'Psoriasis', 'Eczema', 'Dehydration'], { irritancy: 1 }),
  I('betaglucan', 'Beta-glucan', ['beta-glucan', 'beta glucan'], 'Soothes and hydrates; great for reactive skin.', ['Sensitivity', 'Redness', 'Dryness', 'Sensitive', 'Rosacea']),
  I('polyglutamic', 'Polyglutamic acid', ['polyglutamic acid'], 'Holds even more water than hyaluronic acid.', ['Dryness', 'Dry', 'Dehydration']),
  I('allantoin', 'Allantoin', ['allantoin'], 'Soothes and softens irritated skin.', ['Sensitivity', 'Redness', 'Sensitive', 'Eczema']),
  I('oat', 'Colloidal oatmeal', ['avena sativa', 'oat kernel'], 'Calms itching and dryness; a classic for eczema.', ['Eczema', 'Sensitivity', 'Dryness', 'Sensitive', 'Dry', 'Psoriasis']),
  I('ectoin', 'Ectoin', ['ectoin'], 'Protects and calms stressed, reactive skin.', ['Sensitivity', 'Redness', 'Sensitive', 'Rosacea']),
  I('petrolatum', 'Petrolatum', ['petrolatum', 'paraffinum liquidum', 'mineral oil'], 'Seals moisture in; very protective for dry, damaged skin.', ['Dryness', 'Dry', 'Eczema', 'Psoriasis', 'Chapped lips', 'Cracked lip corners'], { comedogenic: 1, tags: ['heavy-occlusive'] }),
  I('dimethicone', 'Dimethicone', ['dimethicone'], 'Silky silicone that smooths and protects.', ['Dry', 'Normal'], { comedogenic: 1 }),
  I('shea', 'Shea butter', ['butyrospermum parkii', 'shea butter'], 'Rich butter that nourishes very dry skin.', ['Dryness', 'Dry', 'Eczema', 'Chapped lips'], { comedogenic: 1, tags: ['fungal-trigger', 'nut'] }),
  I('jojoba', 'Jojoba oil', ['simmondsia chinensis'], 'Light oil close to skin\'s own sebum.', ['Dry', 'Combination'], { comedogenic: 2, tags: ['fungal-trigger'] }),
  I('rosehip', 'Rosehip oil', ['rosa canina', 'rosa moschata', 'rosa rubiginosa'], 'Nourishing oil that helps with marks and fine lines.', ['Fine lines', 'Dark spots', 'Dry'], { comedogenic: 1, tags: ['fungal-trigger'] }),

  // ---------- Soothing ----------
  I('centella', 'Centella asiatica', ['centella', 'madecassoside', 'asiaticoside', 'madecassic acid', 'asiatic acid'], 'A calming plant extract that soothes irritation and supports healing.', ['Redness', 'Sensitivity', 'Acne', 'Sensitive', 'Rosacea', 'Inflammatory', 'Eczema']),
  I('bisabolol', 'Bisabolol', ['bisabolol'], 'Chamomile-derived soother for red, irritated skin.', ['Redness', 'Sensitivity', 'Sensitive', 'Rosacea']),
  I('licorice', 'Licorice root', ['glycyrrhiza', 'dipotassium glycyrrhizate'], 'Calms redness and helps fade dark spots.', ['Redness', 'Dark spots', 'Rosacea', 'Melasma']),
  I('greentea', 'Green tea', ['camellia sinensis', 'green tea'], 'Antioxidant that soothes and helps control oil.', ['Redness', 'Oily', 'Acne', 'Rosacea', 'Puffy eyes']),
  I('heartleaf', 'Heartleaf (Houttuynia)', ['houttuynia'], 'Calms irritation and helps with breakouts.', ['Acne', 'Redness', 'Sensitivity', 'Oily', 'Inflammatory']),
  I('mugwort', 'Mugwort', ['artemisia'], 'Traditional Korean soother for irritated skin.', ['Redness', 'Sensitivity', 'Acne']),
  I('aloe', 'Aloe vera', ['aloe barbadensis'], 'Cools and soothes.', ['Redness', 'Sensitivity', 'Sensitive']),
  I('propolis', 'Propolis', ['propolis'], 'Soothing, helps breakouts and adds glow.', ['Acne', 'Dullness', 'Inflammatory']),
  I('snail', 'Snail mucin', ['snail secretion'], 'Hydrates, soothes and helps skin repair.', ['Dryness', 'Dark spots', 'Dullness', 'Dry', 'Normal']),
  I('ginseng', 'Ginseng', ['panax ginseng'], 'Antioxidant that boosts radiance.', ['Dullness', 'Fine lines']),
  I('caffeine', 'Caffeine', ['caffeine'], 'De-puffs and wakes up tired-looking skin.', ['Dullness', 'Puffy eyes', 'Dark circles']),
  I('rice', 'Rice extract', ['oryza sativa'], 'Brightens and softens.', ['Dullness', 'Dark spots']),

  // ---------- Actives ----------
  I('niacinamide', 'Niacinamide', ['niacinamide'], 'Vitamin B3. Calms redness, evens tone, controls oil and strengthens the barrier.', ['Redness', 'Large pores', 'Dark spots', 'Acne', 'Oily', 'Combination', 'Dullness', 'Rosacea', 'Melasma', 'Inflammatory', 'Hormonal', 'Dark circles'], { irritancy: 1 }),
  I('zinc', 'Zinc PCA', ['zinc pca', 'zinc gluconate'], 'Helps regulate oil and calm breakouts.', ['Acne', 'Oily', 'Large pores', 'Inflammatory', 'Seborrheic dermatitis']),
  I('zincpyrithione', 'Zinc pyrithione', ['zinc pyrithione'], 'Antifungal; helps fungal acne and flaky, itchy patches.', ['Fungal', 'Seborrheic dermatitis']),
  I('sulfur', 'Sulfur', ['sulfur', 'sulphur'], 'Dries out spots and calms fungal breakouts.', ['Acne', 'Fungal', 'Inflammatory', 'Seborrheic dermatitis', 'Oily'], { irritancy: 2 }),
  I('salicylic', 'Salicylic acid (BHA)', ['salicylic acid', 'betaine salicylate', 'willow bark'], 'Oil-soluble exfoliant that clears pores and blackheads.', ['Acne', 'Large pores', 'Oily', 'Combination', 'Comedonal', 'Fungal'], { irritancy: 2, tags: ['bha', 'exfoliant', 'pregnancy-care'] }),
  I('glycolic', 'Glycolic acid (AHA)', ['glycolic acid'], 'Surface exfoliant that smooths texture and boosts glow.', ['Dullness', 'Dark spots', 'Fine lines', 'Normal', 'Oily', 'Melasma'], { irritancy: 3, tags: ['aha', 'exfoliant', 'rosacea-trigger', 'eczema-trigger'] }),
  I('lactic', 'Lactic acid (AHA)', ['lactic acid'], 'A gentler AHA that exfoliates while hydrating.', ['Dullness', 'Dryness', 'Dark spots', 'Dry', 'Normal'], { irritancy: 2, tags: ['aha', 'exfoliant'] }),
  I('mandelic', 'Mandelic acid (AHA)', ['mandelic acid'], 'A slow, gentle AHA; good for breakouts and dark marks.', ['Acne', 'Dark spots', 'Dullness', 'Melasma', 'Comedonal'], { irritancy: 1, tags: ['aha', 'exfoliant'] }),
  I('pha', 'PHA', ['gluconolactone', 'lactobionic acid'], 'The gentlest acids: exfoliate with little irritation.', ['Dullness', 'Sensitivity', 'Sensitive'], { tags: ['exfoliant'] }),
  I('azelaic', 'Azelaic acid', ['azelaic acid', 'potassium azeloyl diglycinate'], 'Calms redness, fades marks and helps with breakouts. Safe in pregnancy.', ['Redness', 'Acne', 'Dark spots', 'Sensitivity', 'Rosacea', 'Melasma', 'Inflammatory', 'Comedonal', 'Hormonal'], { irritancy: 1 }),
  I('retinol', 'Retinol', ['retinol', 'retinal', 'retinyl', 'hydroxypinacolone retinoate', 'retinoate', 'adapalene', 'tretinoin'], 'Vitamin A. Speeds cell renewal for smoother skin, fewer lines and clearer pores.', ['Fine lines', 'Acne', 'Dark spots', 'Large pores', 'Oily', 'Normal', 'Comedonal', 'Inflammatory', 'Hormonal', 'Dark circles'], { irritancy: 3, tags: ['retinoid', 'pregnancy-avoid', 'eczema-trigger', 'rosacea-trigger'] }),
  I('bakuchiol', 'Bakuchiol', ['bakuchiol'], 'A plant alternative to retinol, gentler on the skin.', ['Fine lines', 'Sensitivity', 'Sensitive', 'Acne']),
  I('benzoyl', 'Benzoyl peroxide', ['benzoyl peroxide'], 'Kills acne bacteria; strong but effective on inflamed breakouts.', ['Acne', 'Inflammatory', 'Oily'], { irritancy: 3, tags: ['drying'] }),
  I('vitaminc', 'Vitamin C', ['ascorbic acid', 'ascorbyl', 'ascorbic', 'ascorbate'], 'Antioxidant that brightens, fades dark spots and protects from pollution.', ['Dullness', 'Dark spots', 'Fine lines', 'Normal', 'Combination', 'Melasma', 'Dark circles'], { irritancy: 1 }),
  I('arbutin', 'Alpha-arbutin', ['arbutin'], 'Fades dark spots and evens skin tone.', ['Dark spots', 'Melasma']),
  I('txa', 'Tranexamic acid', ['tranexamic acid'], 'Targets stubborn dark spots, melasma and red marks left by spots.', ['Dark spots', 'Melasma']),
  I('kojic', 'Kojic acid', ['kojic acid'], 'Brightens and fades dark spots.', ['Dark spots', 'Melasma'], { irritancy: 2 }),
  I('hydroquinone', 'Hydroquinone', ['hydroquinone'], 'Strong skin lightener, usually on prescription.', ['Melasma', 'Dark spots'], { irritancy: 3, tags: ['pregnancy-avoid'] }),
  I('peptides', 'Peptides', ['peptide', 'palmitoyl', 'acetyl hexapeptide', 'matrixyl', 'copper tripeptide'], 'Help skin look firmer and smoother.', ['Fine lines', 'Normal', 'Dry']),
  // The three peptides of the eye-care step (Lita, 2026-10-24), each with its study.
  I('argireline', 'Argireline', ['acetyl hexapeptide-8', 'acetyl hexapeptide-3', 'argireline', 'acetyl octapeptide-3'], 'Softens the look of expression lines, like crow’s feet, by calming the small muscle contractions that crease the skin.', ['Fine lines', 'Normal', 'Dry', 'Combination'], { source: { label: 'Blanes-Mira C et al. A synthetic hexapeptide (Argireline) with antiwrinkle activity. Int J Cosmet Sci 2002', url: 'https://pubmed.ncbi.nlm.nih.gov/18498523/' } }),
  I('matrixyl', 'Matrixyl', ['palmitoyl pentapeptide-4', 'palmitoyl tripeptide-1', 'palmitoyl tetrapeptide-7', 'matrixyl', 'palmitoyl oligopeptide'], 'Signals the skin to make more collagen, for skin that looks firmer and smoother over time.', ['Fine lines', 'Normal', 'Dry', 'Combination', 'Sensitive'], { source: { label: 'Robinson LR et al. Topical palmitoyl pentapeptide provides improvement in photoaged human facial skin. Int J Cosmet Sci 2005', url: 'https://pubmed.ncbi.nlm.nih.gov/18492182/' } }),
  I('copperpeptides', 'Copper peptides', ['copper tripeptide-1', 'ghk-cu', 'copper peptide'], 'Help firm thin skin and support its repair. Use them at a different time from pure vitamin C and strong acids.', ['Fine lines', 'Normal', 'Dry', 'Sensitive'], { source: { label: 'Pickart L et al. GHK peptide as a natural modulator of multiple cellular pathways in skin regeneration. Biomed Res Int 2015', url: 'https://pubmed.ncbi.nlm.nih.gov/26236730/' } }),
  I('ferulic', 'Ferulic acid', ['ferulic acid'], 'Antioxidant that boosts vitamins C and E.', ['Fine lines', 'Dullness']),
  I('vitamine', 'Vitamin E', ['tocopherol', 'tocopheryl'], 'Antioxidant that protects and softens.', ['Dry', 'Fine lines', 'Chapped lips']),

  I('hydrocolloid', 'Hydrocolloid', ['hydrocolloid'], 'Pimple patches that absorb fluid, protect the spot and stop you picking.', ['Acne', 'Inflammatory']),

  // ---------- Sun filters ----------
  I('zincoxide', 'Zinc oxide (mineral SPF)', ['zinc oxide'], 'Mineral UV filter, gentle on reactive skin.', ['Sensitivity', 'Redness', 'Sensitive', 'Rosacea', 'Melasma', 'Eczema', 'Cracked lip corners']),
  I('titanium', 'Titanium dioxide (mineral SPF)', ['titanium dioxide'], 'Mineral UV filter, well tolerated.', ['Sensitive', 'Rosacea', 'Melasma']),
  I('chemicalspf', 'Chemical UV filters', ['avobenzone', 'butyl methoxydibenzoylmethane', 'octocrylene', 'homosalate', 'octinoxate', 'ethylhexyl methoxycinnamate', 'bemotrizinol', 'bis-ethylhexyloxyphenol', 'ethylhexyl triazone', 'diethylamino hydroxybenzoyl', 'tinosorb', 'uvinul'], 'Absorb UV light; light textures, sometimes sting sensitive eyes.', ['Melasma', 'Dark spots'], { irritancy: 1 }),

  // ---------- Watch-outs ----------
  I('fragrance', 'Fragrance', ['parfum', 'fragrance', 'aroma'], 'Adds scent. Not needed by the skin and a common cause of irritation.', [], { irritancy: 3, tags: ['fragrance', 'rosacea-trigger', 'eczema-trigger', 'perioral-trigger'] }),
  I('allergens', 'Fragrance allergens', ['limonene', 'linalool', 'citral', 'citronellol', 'geraniol', 'eugenol', 'isoeugenol', 'coumarin', 'farnesol', 'benzyl salicylate', 'benzyl benzoate', 'benzyl cinnamate', 'cinnamal', 'cinnamyl alcohol', 'hexyl cinnamal', 'amyl cinnamal', 'hydroxycitronellal', 'alpha-isomethyl ionone', 'butylphenyl methylpropional', 'anise alcohol', 'evernia', 'methyl 2-octynoate'], 'Scent molecules on the EU list of common allergens.', [], { irritancy: 2, tags: ['eu-allergen', 'rosacea-trigger', 'eczema-trigger'] }),
  I('essentialoils', 'Essential oils', ['lavandula', 'citrus aurantium', 'citrus limon', 'citrus sinensis', 'citrus bergamia', 'mentha', 'eucalyptus', 'rosmarinus', 'melaleuca alternifolia', 'tea tree', 'cymbopogon', 'pelargonium', 'ylang', 'cananga'], 'Concentrated plant scents that can sensitize skin.', ['Acne'], { irritancy: 3, tags: ['essential-oil', 'rosacea-trigger', 'eczema-trigger'] }),
  I('menthol', 'Menthol and cooling agents', ['menthol', 'menthyl', 'camphor'], 'Gives a cooling tingle, which is actually irritation.', [], { irritancy: 3, tags: ['rosacea-trigger', 'eczema-trigger'] }),
  I('alcohol', 'Drying alcohol', ['alcohol denat', 'sd alcohol', 'isopropyl alcohol'], 'Makes textures light, but can dry out and irritate skin.', [], { irritancy: 2, exact: ['alcohol', 'ethanol'], tags: ['drying-alcohol', 'drying', 'rosacea-trigger', 'eczema-trigger'] }),
  I('witchhazel', 'Witch hazel', ['hamamelis'], 'Astringent; can be drying for sensitive skin.', ['Oily'], { irritancy: 2, tags: ['rosacea-trigger'] }),
  I('sls', 'Sodium lauryl sulfate', ['sodium lauryl sulfate', 'ammonium lauryl sulfate'], 'Harsh foaming agent that can strip and irritate.', [], { irritancy: 4, comedogenic: 2, tags: ['drying', 'eczema-trigger', 'rosacea-trigger'] }),
  I('scrub', 'Physical scrub particles', ['juglans regia shell', 'prunus armeniaca seed powder', 'apricot kernel', 'walnut shell'], 'Rough particles that can cause micro-tears.', [], { irritancy: 3, tags: ['rosacea-trigger'] }),
  I('lanolin', 'Lanolin', ['lanolin', 'adeps lanae'], 'Rich wool wax; very moisturizing but a known allergen for some.', ['Dry', 'Chapped lips'], { comedogenic: 2, tags: ['lanolin'] }),
  I('nutoils', 'Nut oils', ['prunus amygdalus dulcis', 'macadamia', 'juglans regia seed', 'corylus avellana', 'argania spinosa', 'arachis hypogaea', 'pistacia vera', 'bertholletia excelsa', 'anacardium occidentale'], 'Nourishing oils from nuts.', ['Dry'], { comedogenic: 2, tags: ['nut', 'fungal-trigger'] }),
  I('coconut', 'Coconut oil', ['cocos nucifera'], 'Rich oil that can clog pores on breakout-prone skin.', ['Dry'], { comedogenic: 4, tags: ['nut', 'fungal-trigger'] }),
  I('cocoabutter', 'Cocoa butter', ['theobroma cacao'], 'Very rich butter that can clog pores.', ['Dry'], { comedogenic: 4, tags: ['fungal-trigger'] }),
  I('poreclog', 'Pore-clogging esters', ['isopropyl myristate', 'isopropyl palmitate', 'isopropyl isostearate', 'myristyl myristate', 'myristyl lactate', 'isocetyl stearate', 'ethylhexyl palmitate', 'octyl palmitate', 'laureth-4', 'oleth-3', 'acetylated lanolin'], 'Emollients that are among the most pore-clogging ingredients.', [], { comedogenic: 4, tags: ['fungal-trigger'] }),
  I('heavyoils', 'Heavier plant oils', ['olea europaea', 'triticum vulgare germ', 'linum usitatissimum', 'glycine soja oil', 'gossypium'], 'Rich oils that can clog pores or feed fungal acne.', ['Dry'], { comedogenic: 3, tags: ['fungal-trigger'] }),
  // Malassezia feeds on C11–C24 fatty acids, their esters and ethoxylates,
  // polysorbates and most plant oils. Known-safe exceptions are excluded.
  I('fungalfood', 'Fungal-acne triggers', [], 'Fatty acids, esters and oils that can feed the yeast behind fungal acne.', [], {
    comedogenic: 1,
    tags: ['fungal-trigger'],
    test: inci =>
      !/caprylic|capric|squalane|mineral oil|paraffin|cetearyl alcohol|cetyl alcohol|stearyl alcohol|behenyl alcohol|tocopher/.test(inci) &&
      /polysorbate|sorbitan|(stear|palmit|myrist|laur|ole|linole|linolen|isostear|behen|arachid|ricinole)(ate|ic acid|oyl|yl lactylate|eth-)|glyceryl (stear|ole|laur|myrist|isostear)|peg-\d+ (stear|ole|laur|dilaur|disteara)|ceteareth|steareth|laureth|oleth|\bseed oil|\bkernel oil|\bfruit oil|\bnut oil|\bbutter\b/.test(inci),
  }),
]

// ---------- Matching ingredients in a product ----------

const byId = Object.fromEntries(INGREDIENTS.map(i => [i.id, i]))
export const getIngredient = id => byId[id]

// Niche ingredients are Premium "to discover" (Lita, 2026-10-19): the name and
// one line stay free. Well-known and caution ingredients are always free.
export const PREMIUM_INGREDIENTS = new Set(['betaglucan', 'polyglutamic', 'ectoin', 'allantoin', 'oat', 'cholesterol', 'jojoba', 'rosehip', 'bisabolol', 'licorice', 'heartleaf', 'mugwort', 'propolis', 'ginseng', 'rice', 'zinc', 'zincpyrithione', 'sulfur', 'lactic', 'mandelic', 'pha', 'azelaic', 'bakuchiol', 'arbutin', 'txa', 'kojic', 'peptides', 'argireline', 'matrixyl', 'copperpeptides', 'ferulic', 'hydrocolloid'])
export const isPremiumIngredient = id => PREMIUM_INGREDIENTS.has(id)

const productList = product => {
  const full = (product?.ingredients || []).map(s => String(s).toLowerCase())
  const key = (product?.key_ingredients || []).map(s => String(s).toLowerCase())
  return { full, key, partial: !product?.ingredients_text }
}

// How much an ingredient counts, from where it sits in the INCI list.
const positionWeight = (pos, partial) => {
  if (partial) return 0.8 // only hero ingredients known
  if (pos < 5) return 1
  if (pos < 10) return 0.75
  if (pos < 20) return 0.5
  return 0.3 // tail of the list, usually under 1%
}

const matchesEntry = (entry, inci) =>
  entry.match.some(m => inci.includes(m)) || (entry.exact || []).some(e => inci === e) || (entry.test ? entry.test(inci) : false)

// Guide entries found in a product, each with its best (earliest) position.
export const findIngredients = (product) => {
  const { full, key, partial } = productList(product)
  const list = full.length ? full : key
  const found = []
  for (const entry of INGREDIENTS) {
    let pos = list.findIndex(i => matchesEntry(entry, i))
    if (pos < 0 && full.length) pos = key.findIndex(i => matchesEntry(entry, i)) >= 0 ? 10 : -1
    if (pos >= 0) found.push({ entry, pos, inci: list[pos], weight: positionWeight(pos, partial || !full.length) })
  }
  return found
}

export const searchIngredients = (query) => {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []
  return INGREDIENTS.filter(i => i.name.toLowerCase().includes(q) || i.match.some(m => m.includes(q) || (q.length > 4 && q.includes(m))))
}

// ---------- The user's profile → what matters ----------

const profileFacts = (profile) => {
  const type = profile?.skin_type || null
  const concerns = profile?.skin_concerns || []
  const acne = profile?.acne_types || []
  const conditions = profile?.skin_conditions || []
  const avoid = profile?.avoid_ingredients || []
  const pregnant = profile?.pregnancy === 'pregnant' || profile?.pregnancy === 'breastfeeding'
  const mine = [type, ...concerns, ...acne, ...conditions].filter(Boolean)
  return {
    mine,
    hasProfile: mine.length > 0,
    sensitive: type === 'Sensitive' || concerns.includes('Sensitivity'),
    breakoutProne: concerns.includes('Acne') || type === 'Oily' || concerns.includes('Large pores') || acne.length > 0,
    dry: type === 'Dry' || concerns.includes('Dryness'),
    fungal: acne.includes('Fungal') || conditions.includes('Seborrheic dermatitis'),
    rosacea: conditions.includes('Rosacea'),
    eczema: conditions.includes('Eczema') || conditions.includes('Psoriasis'),
    perioral: conditions.includes('Perioral dermatitis'),
    avoid,
    pregnant,
    // From the new sign-up (2026-10-27): only bonuses, plus 2 alerts for deeper skin tones.
    age: profile?.ageRange ?? null,
    menopause: ['during', 'after'].includes(profile?.menopause),
    deep: profile?.tone != null && profile.tone >= 3,
    outdoors: !!profile?.outdoors,
    sweat: !!profile?.sweat,
    eyeKinds: profile?.eyeDetails || [],
    prefs: profile?.prefs || [],
  }
}

// What her age, menopause, skin tone, days and dark circles add (Lita, 2026-10-27):
// good ingredients rank a little higher and say why. Never a warning.
const LIFE_BONUS = [
  { when: f => f.age === 0, ids: ['ceramides', 'niacinamide', 'hyaluronic', 'panthenol'], why: 'a gentle essential at your age' },
  { when: f => f.age === 1, ids: ['vitaminc', 'vitamine', 'ferulic', 'niacinamide', 'greentea'], why: 'antioxidant prevention at your age' },
  { when: f => f.age === 2, ids: ['vitaminc', 'retinol', 'bakuchiol', 'peptides', 'matrixyl', 'argireline'], why: 'glow and fine lines at your age' },
  { when: f => f.age >= 3, ids: ['peptides', 'matrixyl', 'copperpeptides', 'ceramides', 'cholesterol', 'retinol', 'squalane'], why: 'firmness and comfort at your age' },
  { when: f => f.menopause, ids: ['ceramides', 'cholesterol', 'hyaluronic', 'squalane', 'peptides', 'petrolatum'], why: 'nourishes skin through menopause' },
  { when: f => f.deep, ids: ['azelaic', 'niacinamide', 'vitaminc', 'txa', 'licorice', 'arbutin'], why: 'evens tone gently on deeper skin' },
  { when: f => f.outdoors, ids: ['vitaminc', 'vitamine', 'ferulic'], why: 'extra antioxidant shield for your time outdoors' },
  { when: (f, zone) => zone === 'eyes' && f.eyeKinds.includes('blue'), ids: ['caffeine', 'peptides'], why: 'helps blue or purple dark circles' },
  { when: (f, zone) => zone === 'eyes' && f.eyeKinds.includes('brown'), ids: ['vitaminc', 'niacinamide', 'licorice', 'arbutin'], why: 'helps brown dark circles' },
  { when: (f, zone) => zone === 'eyes' && f.eyeKinds.includes('hollow'), ids: ['hyaluronic', 'peptides', 'matrixyl'], why: 'softens the shadow of hollow dark circles' },
]

// Why pregnancy rules exist, in plain words, and safer swaps (guide ids).
export const PREGNANCY_DETAIL = {
  retinol: 'Vitamin A in high doses can affect a baby\'s development, so doctors advise stopping retinoids (retinol, retinal, adapalene, tretinoin) while pregnant or breastfeeding, even in skincare.',
  hydroquinone: 'A large share of hydroquinone is absorbed through the skin, so it isn\'t recommended while pregnant or breastfeeding.',
}
export const PREGNANCY_ALTERNATIVES = {
  retinol: ['azelaic', 'niacinamide', 'vitaminc', 'peptides'],
  hydroquinone: ['azelaic', 'vitaminc', 'niacinamide'],
}

// Animal-derived ingredients, by their INCI names.
const VEGAN_NO = /lanolin|cera alba|beeswax|\bcera flava|carmine|ci 75470|snail|mucin|\bmel\b|honey|propolis|royal jelly|collagen|elastin|keratin|\bsilk|sericin|lactis|\bmilk|lactose|whey|casein|guanine|squalene|shellac|tallow|\begg\b|ovum/
const AVOID_TAGS = { Fragrance: ['fragrance'], 'Essential oils': ['essential-oil'], Nuts: ['nut'], Lanolin: ['lanolin'], Alcohol: ['drying-alcohol'] }

// Rules from the user's own answers: ingredients to avoid and pregnancy.
// { level: 'avoid' | 'care', text, detail?, alternatives? }
const personalFlags = (entry, facts) => {
  const out = []
  const has = tag => entry.tags.includes(tag)
  const name = entry.name
  const lower = name.charAt(0).toLowerCase() + name.slice(1)
  for (const [answer, tags] of Object.entries(AVOID_TAGS)) {
    if (facts.avoid.includes(answer) && tags.some(has)) {
      out.push({
        level: 'avoid',
        text: `Contains ${lower}, which you want to avoid`,
        detail: `You told us to avoid ${answer.toLowerCase()}. We check every ingredient of every product for you, so you don't have to read the small print.`,
      })
    }
  }
  if (facts.avoid.includes('Fragrance') && has('eu-allergen')) out.push({ level: 'avoid', text: 'Contains fragrance allergens', detail: 'These scent molecules are part of fragrance and are on the EU list of common allergens.' })
  if (facts.pregnant && has('pregnancy-avoid')) {
    out.push({
      level: 'avoid',
      text: `${name} is best avoided while pregnant or breastfeeding`,
      detail: PREGNANCY_DETAIL[entry.id] || `${name} is not recommended while pregnant or breastfeeding. Check with your doctor or midwife.`,
      alternatives: PREGNANCY_ALTERNATIVES[entry.id] || [],
    })
  }
  if (facts.pregnant && has('pregnancy-care')) {
    out.push({
      level: 'care',
      text: `Ask your doctor about ${lower} while pregnant or breastfeeding`,
      detail: 'Low-strength salicylic acid in skincare is generally considered fine, but peels and high strengths are not. Check with your doctor or midwife.',
    })
  }
  return out
}

// ---------- Skin-issue triggers, graded ----------
//
// Each issue the user has gets a check. An ingredient's base risk for that
// issue (1 mild, 2 moderate, 3 strong) is adjusted by how much of it there is:
// near the top of the INCI list counts more, the tail (usually under 1%) less,
// and rinse-off products less. The result is a level the user can act on:
//   avoid  – strong trigger in a real amount: skip it
//   patch  – may be fine: patch test first
//   watch  – trace amount or rinsed off: usually fine, keep an eye on it

const has = (entry, tag) => entry.tags.includes(tag)

const FA_STRONG = /polysorbate|seed oil|kernel oil|fruit oil|nut oil|butter\b|olea europaea/
const FA_MILD = /lauroyl|sarcosinate|lactylate/

const CONDITION_CHECKS = [
  {
    id: 'fungal', label: 'fungal acne', active: f => f.fungal,
    risk: (e, inci) => {
      if (!has(e, 'fungal-trigger')) return 0
      if (e.id !== 'fungalfood') return { nutoils: 3, coconut: 3, cocoabutter: 3, heavyoils: 3, poreclog: 3, rosehip: 3, jojoba: 2, shea: 2 }[e.id] || 2
      if (FA_STRONG.test(inci)) return 3
      if (FA_MILD.test(inci)) return 1
      return 2
    },
    badge: 'Not FA safe', safe: 'Fungal-acne safe', effect: 'can feed the yeast behind fungal acne',
  },
  {
    id: 'rosacea', label: 'rosacea', active: f => f.rosacea,
    risk: e => ({ alcohol: 3, menthol: 3, essentialoils: 3, scrub: 3, fragrance: 2, witchhazel: 2, glycolic: 2, retinol: 2, sls: 2, allergens: 1 }[e.id] || 0),
    badge: 'Rosacea trigger', safe: 'Rosacea friendly', effect: 'can trigger rosacea flare-ups',
  },
  {
    id: 'eczema', label: 'eczema', active: f => f.eczema,
    risk: e => ({ sls: 3, essentialoils: 3, fragrance: 3, alcohol: 2, menthol: 2, glycolic: 2, retinol: 2, allergens: 1 }[e.id] || 0),
    badge: 'Eczema trigger', safe: 'Eczema friendly', effect: 'can irritate eczema-prone skin',
  },
  {
    id: 'perioral', label: 'perioral dermatitis', active: f => f.perioral,
    risk: e => (has(e, 'heavy-occlusive') || has(e, 'fragrance') ? 2 : 0),
    badge: 'Perioral dermatitis trigger', safe: 'Perioral-dermatitis friendly', effect: 'can aggravate perioral dermatitis',
  },
  {
    id: 'pores', label: 'breakouts', active: f => f.breakoutProne,
    risk: e => (e.comedogenic >= 4 ? 3 : e.comedogenic === 3 ? 2 : 0),
    badge: 'Pore-clogging', safe: 'Non-comedogenic', effect: 'can clog pores',
  },
  {
    id: 'sensitive', label: 'sensitive skin', active: f => f.sensitive,
    risk: e => (e.irritancy >= 4 ? 3 : e.irritancy === 3 || has(e, 'fragrance') ? 2 : 0),
    badge: 'Irritating', safe: 'Gentle on sensitive skin', effect: 'can irritate sensitive skin',
  },
  {
    id: 'dry', label: 'dry skin', active: f => f.dry,
    risk: e => (has(e, 'drying') ? 2 : 0),
    badge: 'Drying', safe: null, effect: 'can dry out your skin',
  },
]

const levelFor = (risk, pos, partial, rinseOff) => {
  const amount = partial ? 0 : pos < 5 ? 1 : pos < 10 ? 0 : pos < 20 ? -1 : -2
  const v = risk + amount - (rinseOff ? 1 : 0)
  return v >= 3 ? 'avoid' : v === 2 ? 'patch' : 'watch'
}

const amountWords = (pos, partial, rinseOff) => {
  if (rinseOff) return "It's in a product you rinse off"
  if (partial) return "It's one of the key ingredients"
  if (pos < 5) return "It's one of the main ingredients"
  if (pos < 10) return "It's there in a moderate amount"
  if (pos < 20) return "It's there in a small amount"
  return "There's only a trace of it, near the end of the list"
}

// Plain explanation of what to do about one trigger.
const explainLevel = (level, item) => {
  const amount = amountWords(item.pos, item.partial, item.rinseOff)
  if (level === 'avoid') return `${amount}, so it's likely to ${item.check.effect.replace(/^can /, '')}. We'd skip this one.`
  if (level === 'patch') return `${amount}. Many people with ${item.check.label} tolerate it, so patch test first: apply a little on your jaw or behind your ear for 3–5 days before using it all over.`
  return `${amount}, so it's usually fine. Just keep an eye on how your skin reacts.`
}

// ---------- Verdicts ----------

// Profile values as they read in a sentence ("helps with dry skin").
const PHRASES = {
  Dry: 'dry skin', Oily: 'oily skin', Combination: 'combination skin', Normal: 'normal skin', Sensitive: 'sensitive skin',
  Comedonal: 'blackheads', Inflammatory: 'inflamed spots', Cystic: 'cystic acne', Hormonal: 'hormonal acne', Fungal: 'fungal acne',
}
const phrase = value => PHRASES[value] || value.toLowerCase()

const LEVEL_RANK = { avoid: 3, patch: 2, watch: 1 }

// How one guide ingredient suits the user's skin (no formula context).
export const ingredientFit = (entry, profile) => {
  const facts = profileFacts(profile)
  const helps = entry.goodFor.filter(g => facts.mine.includes(g))
  const flags = personalFlags(entry, facts)
  const risks = CONDITION_CHECKS.filter(c => c.active(facts)).map(c => ({ c, r: c.risk(entry, entry.match[0] || '') })).filter(x => x.r > 0)
  const warns = [...flags.map(f => f.text), ...risks.map(({ c }) => `${entry.name} ${c.effect}`)]
  const top = Math.max(0, ...risks.map(x => x.r))
  if (flags.some(f => f.level === 'avoid')) return { label: 'Avoid', tone: 'danger', helps, warns }
  if (top >= 3) return { label: 'Strong trigger for you', tone: 'danger', helps, warns }
  if (top === 2) return { label: 'Patch test first', tone: 'warning', helps, warns }
  if (top === 1) return { label: 'Usually fine', tone: 'watch', helps, warns }
  if (flags.length) return { label: 'Use with care', tone: 'warning', helps, warns }
  if (helps.length) return { label: 'Great for you', tone: 'success', helps, warns }
  if (!entry.goodFor.length) return { label: 'Not needed', tone: 'neutral', helps, warns }
  return { label: 'Fine for you', tone: 'neutral', helps, warns }
}

// Lip and eye products sit on their own small area (Lita, 2026-10-25): they're
// judged on the state of her lips or eye contour, her allergies and pregnancy
// (and sensitive skin or eczema near the eyes), never on fungal acne, pores or
// oil. Face products leave the eye and lip concerns out.
const zoneOf = product => (product?.category === 'lip care' ? 'lips' : product?.category === 'eye care' ? 'eyes' : null)
const zoneFacts = (facts, zone) => {
  if (!zone) return { ...facts, mine: facts.mine.filter(c => !EYE_LIP_ONLY.includes(c)) }
  const eyes = zone === 'eyes'
  return {
    ...facts,
    mine: facts.mine.filter(c => ZONE_CONCERNS[zone].includes(c)),
    breakoutProne: false, dry: false, fungal: false, rosacea: false, perioral: false,
    sensitive: eyes && facts.sensitive,
    eczema: eyes && facts.eczema,
  }
}

// Product verdict for the user: score, label, tone and the reasons.
export const productMatch = (product, profile) => {
  const facts = zoneFacts(profileFacts(profile), zoneOf(product))
  const found = findIngredients(product)
  const partial = !product?.ingredients_text
  const rinseOff = product?.category === 'cleanser'

  // What it does for this skin
  const benefits = []
  let benefit = 0
  for (const { entry, weight } of found) {
    const helps = entry.goodFor.filter(g => facts.mine.includes(g))
    if (!helps.length) continue
    benefit += 9 * weight * Math.min(2, 1 + (helps.length - 1) * 0.25)
    benefits.push({ entry, weight, text: `${entry.name} helps with ${[...new Set(helps.map(phrase))].join(', ')}` })
  }
  const strength = Number((product?.name || '').match(/(\d+(?:\.\d+)?)\s?%/)?.[1] || 0)
  if (strength >= 5 && benefits.length) benefit *= 1.15
  const zone = zoneOf(product)
  for (const rule of LIFE_BONUS.filter(r => r.when(facts, zone))) {
    for (const { entry, weight, pos } of found) {
      if (!rule.ids.includes(entry.id) || pos > 15) continue
      benefit += 5 * weight
      benefits.push({ entry, weight, text: `${entry.name}: ${rule.why}` })
    }
  }
  const sunscreen = product?.category === 'sunscreen'
  const name = (product?.name || '').toLowerCase()
  if (sunscreen && facts.outdoors && /spf\s?50|50\+/.test(name)) { benefit += 4; benefits.push({ weight: 1, text: 'High protection for your time outdoors' }) }
  if (facts.sweat && /\b(gel|fluid|water|aqua|light|matte|mattifying)\b/.test(name)) { benefit += 3; benefits.push({ weight: 0.8, text: 'Light texture, good when you sweat' }) }
  if (sunscreen && facts.sweat && /water[- ]?resistant|sport/.test(name)) { benefit += 3; benefits.push({ weight: 0.8, text: 'Water-resistant, good when you sweat' }) }
  benefits.sort((a, b) => b.weight - a.weight)

  // The user's own rules (allergies, pregnancy)
  const avoid = []
  const cares = []
  for (const { entry } of found) {
    for (const f of personalFlags(entry, facts)) {
      if (f.level === 'avoid') avoid.push({ entry, text: f.text, detail: f.detail, alternatives: f.alternatives || [] })
      else cares.push({ entry, text: f.text, detail: f.detail, level: 'patch' })
    }
  }

  // Her product preferences (Lita, 2026-10-27): fragrance-free and vegan are hard no's for her.
  if (facts.prefs.includes('fragrance_free')) {
    const scent = found.find(f => ['fragrance', 'allergens', 'essentialoils'].includes(f.entry.id))
    if (scent && !avoid.some(x => x.entry === scent.entry)) avoid.push({ entry: scent.entry, text: `Contains ${scent.entry.name.toLowerCase()}, and you prefer fragrance-free`, detail: 'You asked for fragrance-free products. We check the whole ingredient list for perfume, essential oils and scent allergens.', alternatives: [] })
  }
  if (facts.prefs.includes('vegan')) {
    const animal = [...productList(product).full, ...productList(product).key].find(inci => VEGAN_NO.test(inci))
    if (animal) avoid.push({ entry: { id: 'not-vegan', name: animal }, text: `Contains ${animal}, which isn't vegan`, detail: 'You asked for vegan products. This ingredient comes from animals (bees, sheep\'s wool, snails, milk…).', alternatives: [] })
  }

  // Ingredients she typed herself ("Other" at sign-up, 2026-10-27): looked for
  // by name in the ingredient list and through the guide's own names for it.
  const { full, key } = productList(product)
  for (const term of facts.avoid.filter(a => !AVOID_TAGS[a])) {
    const t = String(term).trim().toLowerCase()
    if (t.length < 3) continue
    const known = searchIngredients(t)
    const hit = [...full, ...key].find(inci => inci.includes(t)) || found.find(f => known.includes(f.entry))?.inci
    const label = t.charAt(0).toUpperCase() + t.slice(1)
    if (hit) avoid.push({ entry: { id: `custom-${t}`, name: label }, text: `Contains ${t}, which you want to avoid`, detail: `You told us to avoid ${t}. We check every ingredient of every product for you, so you don't have to read the small print.`, alternatives: [] })
    else if (partial) cares.push({ entry: { id: `custom-${t}`, name: label }, text: `Full ingredient list missing, so we can't check for ${t}`, detail: `You told us to avoid ${t}. Check the box before using it.`, level: 'patch' })
  }

  // Each skin issue: graded triggers, safe, or can't confirm
  const triggers = []
  const safe = []
  const unverified = []
  for (const check of CONDITION_CHECKS.filter(c => c.active(facts))) {
    const hits = found
      .map(f => ({ ...f, risk: check.risk(f.entry, f.inci || '') }))
      .filter(f => f.risk > 0)
    for (const h of hits) {
      const group = ['fungalfood', 'poreclog', 'heavyoils', 'allergens', 'essentialoils', 'nutoils'].includes(h.entry.id)
      const shown = group && h.inci ? h.inci.charAt(0).toUpperCase() + h.inci.slice(1) : h.entry.name
      const item = { check, entry: h.entry, shown, pos: h.pos, partial, rinseOff }
      const level = levelFor(h.risk, h.pos, partial, rinseOff)
      triggers.push({ ...item, level, text: `${shown} ${check.effect}`, detail: explainLevel(level, item), about: h.entry.what })
    }
    if (!hits.length && check.safe) {
      if (partial) unverified.push({ check, text: `Full ingredient list missing, so we can't confirm it's ${check.safe.toLowerCase()}` })
      else safe.push({ check, text: check.safe })
    }
  }
  if (facts.deep) {
    const toneCheck = { id: 'tone', label: 'deeper skin tones', badge: 'Keep an eye' }
    const mineral = found.find(f => ['zincoxide', 'titanium'].includes(f.entry.id) && f.pos < 6)
    if (sunscreen && mineral) triggers.push({ check: toneCheck, entry: mineral.entry, shown: mineral.entry.name, pos: mineral.pos, partial, rinseOff, level: 'watch', text: 'Can leave a white cast on deeper skin tones', detail: 'Mineral filters high in the list often leave a grey or white film on deeper skin. A tinted version or modern chemical filters blend in better.', about: mineral.entry.what })
    const acid = found.find(f => ['glycolic', 'salicylic', 'lactic'].includes(f.entry.id) && (f.pos < 4 || strength >= 10))
    if (acid && !rinseOff) triggers.push({ check: toneCheck, entry: acid.entry, shown: acid.entry.name, pos: acid.pos, partial, rinseOff, level: 'watch', text: 'Strong acids can leave dark marks on deeper skin tones', detail: 'On deeper skin, irritation easily turns into brown marks. Start every other evening, stop if it stings, and wear sunscreen every morning.', about: acid.entry.what })
  }
  triggers.sort((a, b) => LEVEL_RANK[b.level] - LEVEL_RANK[a.level] || a.pos - b.pos)

  const worst = triggers[0]?.level || null
  let score = (facts.hasProfile ? 70 : 75) + Math.min(26, benefit) - triggers.filter(t => t.level === 'watch').length * 4 - cares.length * 6
  score = Math.round(Math.max(30, Math.min(98, score)))
  if (unverified.length) score = Math.min(score, 68)
  if (worst === 'patch' || cares.length) score = Math.min(score, 58)
  if (worst === 'avoid') score = Math.min(score, 30)
  if (avoid.length) score = Math.min(score, 20)

  // Her priorities (main, then secondary concern) lead: a product that targets
  // them says so first, and ranks a little higher (Lita, 2026-10-24).
  const targets = concern => concern && facts.mine.includes(concern) && found.find(f => f.pos <= 12 && (f.entry.goodFor || []).includes(concern))
  const mainHit = targets(profile?.priority)
  const secondHit = !mainHit && targets(profile?.secondary)
  const priority = mainHit ? { level: 'main', concern: profile.priority, ingredient: mainHit.entry.name } : secondHit ? { level: 'second', concern: profile.secondary, ingredient: secondHit.entry.name } : null
  if (priority && !avoid.length && !worst && !cares.length && !unverified.length) score = Math.min(100, score + (priority.level === 'main' ? 6 : 3))
  const priorityReason = priority && { text: `${priority.level === 'main' ? 'Targets your main concern' : 'Helps your second concern'}: ${priority.concern.toLowerCase()}, with ${priority.ingredient.toLowerCase()}` }

  let label
  let tone
  if (avoid.length) { label = 'Avoid'; tone = 'danger' }
  else if (worst === 'avoid') { label = triggers[0].check.badge; tone = 'danger' }
  else if (worst === 'patch' || cares.length) { label = 'Patch test first'; tone = 'warning' }
  else if (unverified.length) { label = 'Not verified'; tone = 'neutral' }
  else if (worst === 'watch') { label = 'Keep an eye'; tone = 'watch' }
  else if (score >= 85) { label = 'Great for you'; tone = 'success' }
  else if (score >= 70) { label = 'Good match'; tone = 'success' }
  else { label = 'OK for you'; tone = 'neutral' }

  return {
    score,
    label,
    tone,
    good: [...(priorityReason ? [priorityReason] : []), ...safe, ...benefits],
    care: [...avoid, ...triggers, ...cares, ...unverified],
    avoid,
    triggers,
    triggered: triggers.filter(t => t.level === 'avoid'),
    unverified,
    found: found.map(f => f.entry),
    partial,
    priority,
    // Good or not for her skin, maybe not today: from her current skin state.
    notNow: notRightNow(product, found, profile?.skinState),
    // Honest notes, neither good nor bad.
    notes: zone === 'eyes' && facts.eyeKinds.includes('hollow') ? [{ text: 'Hollow dark circles come from the shape of the face: creams can soften the shadow a little, not remove it.' }] : [],
  }
}

// ---------- "Not right for you right now" (Lita, 2026-10-24) ----------
// The current skin state (utils/skin-state.js) can make a product a bad idea
// for a while, without changing the verdict for her skin: an exfoliating acid
// can be great for her pigmentation and still wait while her skin is irritated.
const STATE_WORDS = { irritated: 'irritated', red: 'red', barrier: 'showing a damaged barrier', overexfoliated: 'over-exfoliated', dehydrated: 'dehydrated', breakout: 'breaking out' }
const STRONG_FOR_STATE = ['retinol', 'glycolic', 'salicylic', 'lactic', 'mandelic', 'benzoyl', 'scrub']
const DRYING = ['alcohol', 'sls']
export const notRightNow = (product, found, skinState) => {
  const states = skinState?.states || []
  if (!states.length || product?.category === 'lip care') return null
  const near = (ids, maxPos = 12) => (found || []).filter(f => ids.includes(f.entry.id) && f.pos <= maxPos).map(f => f.entry)
  const reactive = states.filter(st => ['irritated', 'red', 'barrier', 'overexfoliated'].includes(st))
  if (reactive.length) {
    const strong = near(STRONG_FOR_STATE)
    if (strong.length || /\bpeel|exfoli|aha|bha\b/i.test(product?.name || '')) {
      const what = strong[0]?.name || 'exfoliating actives'
      return {
        title: 'Not right for you right now',
        text: `Your skin is ${STATE_WORDS[reactive[0]]} at the moment`,
        detail: `This product contains ${what.toLowerCase()}, which can help your skin goals, but adding it now could irritate your skin more and work against them. Keep it for when your skin feels calm again.`,
        states: reactive,
      }
    }
  }
  if (states.includes('dehydrated')) {
    const drying = near(DRYING, 8)
    if (drying.length) return {
      title: 'Not right for you right now',
      text: 'Your skin is dehydrated at the moment',
      detail: `This product contains ${drying[0].name.toLowerCase()}, which can dry the skin further. Choose something more comforting until your skin feels hydrated again.`,
      states: ['dehydrated'],
    }
  }
  return null
}

// One sentence explaining a product match, the most important reason first.
export const matchReason = (match, profile) => {
  if (match.notNow) return `${match.notNow.text}: better later`
  if (!profileFacts(profile).hasProfile) return 'Add your skin type for a personal match'
  if (match.care.length) return match.care[0].text
  if (match.good.length) return match.good[0].text
  return 'Nothing in it clashes with your skin'
}

// Short badge for lists: the verdict when there's something to know, the
// match percentage otherwise.
// Without the full ingredient list we can't vouch for a product: no score.
export const badgeTone = match => (match.notNow && !['danger'].includes(match.tone) ? 'warning' : match.partial && !['danger', 'warning'].includes(match.tone) ? 'neutral' : match.tone)
export const badgeText = match => (match.notNow && !['danger'].includes(match.tone) ? 'Not right now' : match.partial && !['danger', 'warning'].includes(match.tone) ? 'Not checked yet' : ['danger', 'warning', 'watch'].includes(match.tone) || match.unverified.length ? match.label : `${match.score}%`)

// Products that must never be suggested to this user.
export const isUnsuitable = match => match.avoid.length > 0 || match.triggered.length > 0
