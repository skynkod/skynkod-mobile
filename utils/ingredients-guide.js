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
  I('hyaluronic', 'Hyaluronic acid', ['hyaluronic acid', 'sodium hyaluronate', 'hydrolyzed hyaluronic', 'hyaluronate'], 'Draws water into the skin for plump, bouncy hydration.', ['Dryness', 'Fine lines', 'Dry', 'Normal', 'Combination', 'Sensitive', 'Eczema']),
  I('glycerin', 'Glycerin', ['glycerin'], 'A gentle, reliable humectant that keeps skin hydrated.', ['Dryness', 'Dry', 'Normal', 'Sensitive', 'Eczema']),
  I('ceramides', 'Ceramides', ['ceramide'], 'Lipids that rebuild the skin barrier and lock moisture in.', ['Dryness', 'Sensitivity', 'Redness', 'Dry', 'Sensitive', 'Eczema', 'Rosacea', 'Psoriasis']),
  I('cholesterol', 'Cholesterol', ['cholesterol'], 'Part of the skin barrier; works with ceramides.', ['Dryness', 'Dry', 'Eczema']),
  I('panthenol', 'Panthenol', ['panthenol'], 'Pro-vitamin B5. Soothes, hydrates and helps skin repair.', ['Sensitivity', 'Redness', 'Dryness', 'Sensitive', 'Dry', 'Eczema', 'Rosacea']),
  I('squalane', 'Squalane', ['squalane'], 'A light, non-greasy oil that softens and protects.', ['Dryness', 'Fine lines', 'Dry', 'Normal', 'Sensitive'], { comedogenic: 1 }),
  I('urea', 'Urea', ['urea'], 'Hydrates deeply and softens rough, dry patches.', ['Dryness', 'Dry', 'Psoriasis', 'Eczema'], { irritancy: 1 }),
  I('betaglucan', 'Beta-glucan', ['beta-glucan', 'beta glucan'], 'Soothes and hydrates; great for reactive skin.', ['Sensitivity', 'Redness', 'Dryness', 'Sensitive', 'Rosacea']),
  I('polyglutamic', 'Polyglutamic acid', ['polyglutamic acid'], 'Holds even more water than hyaluronic acid.', ['Dryness', 'Dry']),
  I('allantoin', 'Allantoin', ['allantoin'], 'Soothes and softens irritated skin.', ['Sensitivity', 'Redness', 'Sensitive', 'Eczema']),
  I('oat', 'Colloidal oatmeal', ['avena sativa', 'oat kernel'], 'Calms itching and dryness; a classic for eczema.', ['Eczema', 'Sensitivity', 'Dryness', 'Sensitive', 'Dry', 'Psoriasis']),
  I('ectoin', 'Ectoin', ['ectoin'], 'Protects and calms stressed, reactive skin.', ['Sensitivity', 'Redness', 'Sensitive', 'Rosacea']),
  I('petrolatum', 'Petrolatum', ['petrolatum', 'paraffinum liquidum', 'mineral oil'], 'Seals moisture in; very protective for dry, damaged skin.', ['Dryness', 'Dry', 'Eczema', 'Psoriasis'], { comedogenic: 1, tags: ['heavy-occlusive'] }),
  I('dimethicone', 'Dimethicone', ['dimethicone'], 'Silky silicone that smooths and protects.', ['Dry', 'Normal'], { comedogenic: 1 }),
  I('shea', 'Shea butter', ['butyrospermum parkii', 'shea butter'], 'Rich butter that nourishes very dry skin.', ['Dryness', 'Dry', 'Eczema'], { comedogenic: 1, tags: ['fungal-trigger', 'nut'] }),
  I('jojoba', 'Jojoba oil', ['simmondsia chinensis'], 'Light oil close to skin\'s own sebum.', ['Dry', 'Combination'], { comedogenic: 2, tags: ['fungal-trigger'] }),
  I('rosehip', 'Rosehip oil', ['rosa canina', 'rosa moschata', 'rosa rubiginosa'], 'Nourishing oil that helps with marks and fine lines.', ['Fine lines', 'Dark spots', 'Dry'], { comedogenic: 1, tags: ['fungal-trigger'] }),

  // ---------- Soothing ----------
  I('centella', 'Centella asiatica', ['centella', 'madecassoside', 'asiaticoside', 'madecassic acid', 'asiatic acid'], 'A calming plant extract that soothes irritation and supports healing.', ['Redness', 'Sensitivity', 'Acne', 'Sensitive', 'Rosacea', 'Inflammatory', 'Eczema']),
  I('bisabolol', 'Bisabolol', ['bisabolol'], 'Chamomile-derived soother for red, irritated skin.', ['Redness', 'Sensitivity', 'Sensitive', 'Rosacea']),
  I('licorice', 'Licorice root', ['glycyrrhiza', 'dipotassium glycyrrhizate'], 'Calms redness and helps fade dark spots.', ['Redness', 'Dark spots', 'Rosacea', 'Melasma']),
  I('greentea', 'Green tea', ['camellia sinensis', 'green tea'], 'Antioxidant that soothes and helps control oil.', ['Redness', 'Oily', 'Acne', 'Rosacea']),
  I('heartleaf', 'Heartleaf (Houttuynia)', ['houttuynia'], 'Calms irritation and helps with breakouts.', ['Acne', 'Redness', 'Sensitivity', 'Oily', 'Inflammatory']),
  I('mugwort', 'Mugwort', ['artemisia'], 'Traditional Korean soother for irritated skin.', ['Redness', 'Sensitivity', 'Acne']),
  I('aloe', 'Aloe vera', ['aloe barbadensis'], 'Cools and soothes.', ['Redness', 'Sensitivity', 'Sensitive']),
  I('propolis', 'Propolis', ['propolis'], 'Soothing, helps breakouts and adds glow.', ['Acne', 'Dullness', 'Inflammatory']),
  I('snail', 'Snail mucin', ['snail secretion'], 'Hydrates, soothes and helps skin repair.', ['Dryness', 'Dark spots', 'Dullness', 'Dry', 'Normal']),
  I('ginseng', 'Ginseng', ['panax ginseng'], 'Antioxidant that boosts radiance.', ['Dullness', 'Fine lines']),
  I('caffeine', 'Caffeine', ['caffeine'], 'De-puffs and wakes up tired-looking skin.', ['Dullness']),
  I('rice', 'Rice extract', ['oryza sativa'], 'Brightens and softens.', ['Dullness', 'Dark spots']),

  // ---------- Actives ----------
  I('niacinamide', 'Niacinamide', ['niacinamide'], 'Vitamin B3. Calms redness, evens tone, controls oil and strengthens the barrier.', ['Redness', 'Large pores', 'Dark spots', 'Acne', 'Oily', 'Combination', 'Dullness', 'Rosacea', 'Melasma', 'Inflammatory', 'Hormonal'], { irritancy: 1 }),
  I('zinc', 'Zinc PCA', ['zinc pca', 'zinc gluconate'], 'Helps regulate oil and calm breakouts.', ['Acne', 'Oily', 'Large pores', 'Inflammatory', 'Seborrheic dermatitis']),
  I('zincpyrithione', 'Zinc pyrithione', ['zinc pyrithione'], 'Antifungal; helps fungal acne and flaky, itchy patches.', ['Fungal', 'Seborrheic dermatitis']),
  I('sulfur', 'Sulfur', ['sulfur', 'sulphur'], 'Dries out spots and calms fungal breakouts.', ['Acne', 'Fungal', 'Inflammatory', 'Seborrheic dermatitis', 'Oily'], { irritancy: 2 }),
  I('salicylic', 'Salicylic acid (BHA)', ['salicylic acid', 'betaine salicylate', 'willow bark'], 'Oil-soluble exfoliant that clears pores and blackheads.', ['Acne', 'Large pores', 'Oily', 'Combination', 'Comedonal', 'Fungal'], { irritancy: 2, tags: ['bha', 'exfoliant', 'pregnancy-care'] }),
  I('glycolic', 'Glycolic acid (AHA)', ['glycolic acid'], 'Surface exfoliant that smooths texture and boosts glow.', ['Dullness', 'Dark spots', 'Fine lines', 'Normal', 'Oily', 'Melasma'], { irritancy: 3, tags: ['aha', 'exfoliant', 'rosacea-trigger', 'eczema-trigger'] }),
  I('lactic', 'Lactic acid (AHA)', ['lactic acid'], 'A gentler AHA that exfoliates while hydrating.', ['Dullness', 'Dryness', 'Dark spots', 'Dry', 'Normal'], { irritancy: 2, tags: ['aha', 'exfoliant'] }),
  I('mandelic', 'Mandelic acid (AHA)', ['mandelic acid'], 'A slow, gentle AHA; good for breakouts and dark marks.', ['Acne', 'Dark spots', 'Dullness', 'Melasma', 'Comedonal'], { irritancy: 1, tags: ['aha', 'exfoliant'] }),
  I('pha', 'PHA', ['gluconolactone', 'lactobionic acid'], 'The gentlest acids: exfoliate with little irritation.', ['Dullness', 'Sensitivity', 'Sensitive'], { tags: ['exfoliant'] }),
  I('azelaic', 'Azelaic acid', ['azelaic acid', 'potassium azeloyl diglycinate'], 'Calms redness, fades marks and helps with breakouts. Safe in pregnancy.', ['Redness', 'Acne', 'Dark spots', 'Sensitivity', 'Rosacea', 'Melasma', 'Inflammatory', 'Comedonal', 'Hormonal'], { irritancy: 1 }),
  I('retinol', 'Retinol', ['retinol', 'retinal', 'retinyl', 'hydroxypinacolone retinoate', 'retinoate', 'adapalene', 'tretinoin'], 'Vitamin A. Speeds cell renewal for smoother skin, fewer lines and clearer pores.', ['Fine lines', 'Acne', 'Dark spots', 'Large pores', 'Oily', 'Normal', 'Comedonal', 'Inflammatory', 'Hormonal'], { irritancy: 3, tags: ['retinoid', 'pregnancy-avoid', 'eczema-trigger', 'rosacea-trigger'] }),
  I('bakuchiol', 'Bakuchiol', ['bakuchiol'], 'A plant alternative to retinol, gentler on the skin.', ['Fine lines', 'Sensitivity', 'Sensitive', 'Acne']),
  I('benzoyl', 'Benzoyl peroxide', ['benzoyl peroxide'], 'Kills acne bacteria; strong but effective on inflamed breakouts.', ['Acne', 'Inflammatory', 'Oily'], { irritancy: 3, tags: ['drying'] }),
  I('vitaminc', 'Vitamin C', ['ascorbic acid', 'ascorbyl', 'ascorbic', 'ascorbate'], 'Antioxidant that brightens, fades dark spots and protects from pollution.', ['Dullness', 'Dark spots', 'Fine lines', 'Normal', 'Combination', 'Melasma'], { irritancy: 1 }),
  I('arbutin', 'Alpha-arbutin', ['arbutin'], 'Fades dark spots and evens skin tone.', ['Dark spots', 'Melasma']),
  I('txa', 'Tranexamic acid', ['tranexamic acid'], 'Targets stubborn dark spots and melasma.', ['Dark spots', 'Melasma']),
  I('kojic', 'Kojic acid', ['kojic acid'], 'Brightens and fades dark spots.', ['Dark spots', 'Melasma'], { irritancy: 2 }),
  I('hydroquinone', 'Hydroquinone', ['hydroquinone'], 'Strong skin lightener, usually on prescription.', ['Melasma', 'Dark spots'], { irritancy: 3, tags: ['pregnancy-avoid'] }),
  I('peptides', 'Peptides', ['peptide', 'palmitoyl', 'acetyl hexapeptide', 'matrixyl', 'copper tripeptide'], 'Help skin look firmer and smoother.', ['Fine lines', 'Normal', 'Dry']),
  I('ferulic', 'Ferulic acid', ['ferulic acid'], 'Antioxidant that boosts vitamins C and E.', ['Fine lines', 'Dullness']),
  I('vitamine', 'Vitamin E', ['tocopherol', 'tocopheryl'], 'Antioxidant that protects and softens.', ['Dry', 'Fine lines']),

  // ---------- Sun filters ----------
  I('zincoxide', 'Zinc oxide (mineral SPF)', ['zinc oxide'], 'Mineral UV filter, gentle on reactive skin.', ['Sensitivity', 'Redness', 'Sensitive', 'Rosacea', 'Melasma', 'Eczema']),
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
  I('lanolin', 'Lanolin', ['lanolin', 'adeps lanae'], 'Rich wool wax; very moisturizing but a known allergen for some.', ['Dry'], { comedogenic: 2, tags: ['lanolin'] }),
  I('nutoils', 'Nut oils', ['prunus amygdalus dulcis', 'macadamia', 'juglans regia seed', 'corylus avellana', 'argania spinosa', 'arachis hypogaea', 'pistacia vera', 'bertholletia excelsa', 'anacardium occidentale'], 'Nourishing oils from nuts.', ['Dry'], { comedogenic: 2, tags: ['nut', 'fungal-trigger'] }),
  I('coconut', 'Coconut oil', ['cocos nucifera'], 'Rich oil that can clog pores on breakout-prone skin.', ['Dry'], { comedogenic: 4, tags: ['nut', 'fungal-trigger'] }),
  I('cocoabutter', 'Cocoa butter', ['theobroma cacao'], 'Very rich butter that can clog pores.', ['Dry'], { comedogenic: 4, tags: ['fungal-trigger'] }),
  I('poreclog', 'Pore-clogging esters', ['isopropyl myristate', 'isopropyl palmitate', 'isopropyl isostearate', 'myristyl myristate', 'myristyl lactate', 'isocetyl stearate', 'ethylhexyl palmitate', 'octyl palmitate', 'laureth-4', 'oleth-3', 'acetylated lanolin'], 'Emollients that are among the most pore-clogging ingredients.', [], { comedogenic: 4, tags: ['fungal-trigger'] }),
  I('heavyoils', 'Heavier plant oils', ['olea europaea', 'triticum vulgare germ', 'linum usitatissimum', 'glycine soja oil', 'gossypium'], 'Rich oils that can clog pores or feed fungal acne.', ['Dry'], { comedogenic: 3, tags: ['fungal-trigger'] }),
  I('fungalfood', 'Fungal-acne triggers', ['polysorbate', 'sorbitan', 'glyceryl stearate', 'peg-100 stearate', 'stearic acid', 'palmitic acid', 'myristic acid', 'lauric acid', 'oleic acid', 'decyl oleate', 'butyl stearate'], 'Fatty acids and esters that can feed the yeast behind fungal acne.', [], { comedogenic: 1, tags: ['fungal-trigger'] }),
]

// ---------- Matching ingredients in a product ----------

const byId = Object.fromEntries(INGREDIENTS.map(i => [i.id, i]))
export const getIngredient = id => byId[id]

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
  entry.match.some(m => inci.includes(m)) || (entry.exact || []).some(e => inci === e)

// Guide entries found in a product, each with its best (earliest) position.
export const findIngredients = (product) => {
  const { full, key, partial } = productList(product)
  const list = full.length ? full : key
  const found = []
  for (const entry of INGREDIENTS) {
    let pos = list.findIndex(i => matchesEntry(entry, i))
    if (pos < 0 && full.length) pos = key.findIndex(i => matchesEntry(entry, i)) >= 0 ? 10 : -1
    if (pos >= 0) found.push({ entry, pos, weight: positionWeight(pos, partial || !full.length) })
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
  }
}

// Why pregnancy rules exist, in plain words, and safer swaps (guide ids).
const PREGNANCY_DETAIL = {
  retinol: 'Vitamin A in high doses can affect a baby\'s development, so doctors advise stopping retinoids (retinol, retinal, adapalene, tretinoin) while pregnant or breastfeeding, even in skincare.',
  hydroquinone: 'A large share of hydroquinone is absorbed through the skin, so it isn\'t recommended while pregnant or breastfeeding.',
}
const PREGNANCY_ALTERNATIVES = {
  retinol: ['azelaic', 'niacinamide', 'vitaminc', 'peptides'],
  hydroquinone: ['azelaic', 'vitaminc', 'niacinamide'],
}

const AVOID_TAGS = { Fragrance: ['fragrance'], 'Essential oils': ['essential-oil'], Nuts: ['nut'], Lanolin: ['lanolin'], Alcohol: ['drying-alcohol'] }

// Cautions an ingredient raises for this user: { level: 'avoid' | 'care', text }.
const cautionsFor = (entry, facts, isRinseOff) => {
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
  if (facts.avoid.includes('Fragrance') && has('eu-allergen')) out.push({ level: 'care', text: 'Contains fragrance allergens' })
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
  if (facts.fungal && has('fungal-trigger')) out.push({ level: 'care', text: `${name} can feed fungal acne` })
  if (facts.rosacea && has('rosacea-trigger')) out.push({ level: 'care', text: `${name} can trigger rosacea flare-ups` })
  if (facts.eczema && has('eczema-trigger')) out.push({ level: 'care', text: `${name} can irritate eczema-prone skin` })
  if (facts.perioral && (has('heavy-occlusive') || has('fragrance'))) out.push({ level: 'care', text: `${name} can aggravate perioral dermatitis` })
  if (facts.breakoutProne && entry.comedogenic >= 3 && !isRinseOff) out.push({ level: 'care', text: `${name} can clog pores` })
  if (facts.sensitive && entry.irritancy >= 3 && !out.length) out.push({ level: 'care', text: `${name} can irritate sensitive skin` })
  if (facts.dry && has('drying') && !out.length) out.push({ level: 'care', text: `${name} can dry out your skin` })
  return out
}

// ---------- Verdicts ----------

// Profile values as they read in a sentence ("helps with dry skin").
const PHRASES = {
  Dry: 'dry skin', Oily: 'oily skin', Combination: 'combination skin', Normal: 'normal skin', Sensitive: 'sensitive skin',
  Comedonal: 'blackheads', Inflammatory: 'inflamed spots', Cystic: 'cystic acne', Hormonal: 'hormonal acne', Fungal: 'fungal acne',
}
const phrase = value => PHRASES[value] || value.toLowerCase()

// How well one guide ingredient suits the user's skin.
export const ingredientFit = (entry, profile) => {
  const facts = profileFacts(profile)
  const helps = entry.goodFor.filter(g => facts.mine.includes(g))
  const cautions = cautionsFor(entry, facts, false)
  const warns = cautions.map(c => c.text)
  if (cautions.some(c => c.level === 'avoid')) return { label: 'Avoid', tone: 'danger', helps, warns }
  if (cautions.length) return { label: 'Use with care', tone: 'warning', helps, warns }
  if (helps.length) return { label: 'Great for you', tone: 'success', helps, warns }
  if (!entry.goodFor.length) return { label: 'Not needed', tone: 'neutral', helps, warns }
  return { label: 'Fine for you', tone: 'neutral', helps, warns }
}

// Product match score (5–98) with the reasons behind it.
export const productMatch = (product, profile) => {
  const facts = profileFacts(profile)
  const found = findIngredients(product)
  const isRinseOff = product?.category === 'cleanser'
  const good = []
  const care = []
  const avoid = []
  let benefit = 0
  let penalty = 0

  for (const { entry, weight } of found) {
    const helps = entry.goodFor.filter(g => facts.mine.includes(g))
    if (helps.length) {
      benefit += 9 * weight * Math.min(2, 1 + (helps.length - 1) * 0.25)
      good.push({ entry, weight, text: `${entry.name} helps with ${[...new Set(helps.map(phrase))].join(', ')}` })
    }
    for (const c of cautionsFor(entry, facts, isRinseOff)) {
      if (c.level === 'avoid') avoid.push({ entry, text: c.text, detail: c.detail, alternatives: c.alternatives || [] })
      else {
        penalty += 14 * weight * (isRinseOff ? 0.6 : 1)
        care.push({ entry, weight, text: c.text })
      }
    }
  }

  // Strength written on the pack ("10%") makes the hero active count more.
  const strength = Number((product?.name || '').match(/(\d+(?:\.\d+)?)\s?%/)?.[1] || 0)
  if (strength >= 5 && good.length) benefit *= 1.15

  good.sort((a, b) => b.weight - a.weight)
  care.sort((a, b) => b.weight - a.weight)

  let score = (facts.hasProfile ? 70 : 75) + Math.min(26, benefit) - Math.min(45, penalty)
  score = Math.round(Math.max(30, Math.min(98, score)))
  if (avoid.length) score = Math.min(score, 20)

  const label = avoid.length ? 'Avoid' : score >= 85 ? 'Great for you' : score >= 70 ? 'Good match' : score >= 55 ? 'OK for you' : 'Use with care'
  const tone = avoid.length ? 'danger' : score >= 70 ? 'success' : score >= 55 ? 'neutral' : 'warning'
  return { score, label, tone, good, care: [...avoid, ...care], avoid, found: found.map(f => f.entry), partial: !product?.ingredients_text }
}

// One sentence explaining a product match, the most important reason first.
export const matchReason = (match, profile) => {
  if (!profileFacts(profile).hasProfile) return 'Add your skin type for a personal match'
  if (match.avoid.length) return match.avoid[0].text
  if (match.care.length) return match.care[0].text
  if (match.good.length) return match.good[0].text
  return 'Nothing in it clashes with your skin'
}
