// How to use the main ingredients: when, how strong, how often, what to pair,
// what not to mix, and pregnancy safety ('safe' | 'ask' | 'avoid').

export const HOWTO = {
  hyaluronic: { when: 'Morning and evening', strength: '1–2%', often: 'Every day', how: 'On slightly damp skin, then seal with a moisturizer.', pairs: ['niacinamide', 'ceramides', 'vitaminc', 'retinol'], pregnancy: 'safe' },
  glycerin: { when: 'Morning and evening', often: 'Every day', pairs: ['hyaluronic', 'ceramides'], pregnancy: 'safe' },
  ceramides: { when: 'Morning and evening', often: 'Every day', how: 'In your moisturizer: the best partner for any strong active.', pairs: ['retinol', 'niacinamide', 'hyaluronic', 'cholesterol'], pregnancy: 'safe' },
  panthenol: { when: 'Morning and evening', often: 'Every day', pairs: ['ceramides', 'centella', 'retinol'], pregnancy: 'safe' },
  centella: { when: 'Morning and evening', often: 'Every day', pairs: ['niacinamide', 'retinol', 'azelaic'], pregnancy: 'safe' },
  niacinamide: { when: 'Morning and/or evening', strength: '2–5% (10% can irritate some skins)', often: 'Every day', pairs: ['retinol', 'hyaluronic', 'azelaic', 'salicylic', 'zinc'], pregnancy: 'safe', tip: 'Niacinamide and vitamin C can be used together: the old warning came from outdated studies.' },
  salicylic: { when: 'Evening (or morning with sunscreen)', strength: '0.5–2%', often: '2–3 times a week, up to daily if your skin is fine', how: 'On dry skin after cleansing, then moisturizer.', pairs: ['niacinamide', 'hyaluronic', 'ceramides'], dontMix: ['retinol', 'glycolic', 'benzoyl'], pregnancy: 'ask', tip: 'Low amounts in a rinse-off cleanser are generally considered fine in pregnancy: ask your doctor.' },
  glycolic: { when: 'Evening', strength: '5–10%', often: '1–3 times a week', how: 'On dry skin, then a moisturizer. Sunscreen the next morning.', pairs: ['hyaluronic', 'ceramides', 'niacinamide'], dontMix: ['retinol', 'salicylic', 'vitaminc'], pregnancy: 'safe', tip: 'Glycolic acid at normal cosmetic strength is considered safe in pregnancy.' },
  lactic: { when: 'Evening', strength: '5–10%', often: '1–3 times a week', pairs: ['hyaluronic', 'ceramides'], dontMix: ['retinol', 'salicylic'], pregnancy: 'safe' },
  mandelic: { when: 'Evening', strength: '5–10%', often: '2–3 times a week', pairs: ['niacinamide', 'ceramides'], dontMix: ['retinol'], pregnancy: 'safe' },
  azelaic: { when: 'Morning and/or evening', strength: '10% (over the counter), 15–20% (prescription)', often: 'Once a day, then twice', pairs: ['niacinamide', 'retinol', 'hyaluronic'], pregnancy: 'safe', tip: 'One of the best options for acne, redness and dark spots during pregnancy.' },
  retinol: { when: 'Evening only', strength: 'Start at 0.2–0.3%', often: '2 nights a week, then build up', how: 'Pea-sized amount on dry skin, then moisturizer.', pairs: ['niacinamide', 'ceramides', 'hyaluronic', 'panthenol'], dontMix: ['glycolic', 'salicylic', 'benzoyl', 'vitaminc'], pregnancy: 'avoid', tip: 'Not during pregnancy or breastfeeding. Bakuchiol or azelaic acid are safer alternatives.', article: 'retinol-start' },
  bakuchiol: { when: 'Morning and/or evening', strength: '0.5–1%', often: 'Every day', pairs: ['niacinamide', 'hyaluronic'], pregnancy: 'ask' },
  benzoyl: { when: 'Evening (or as a short wash)', strength: '2.5–5%', often: 'Once a day, on spots or as a wash', how: 'It bleaches fabric: use white towels and pillowcases.', pairs: ['niacinamide', 'ceramides'], dontMix: ['retinol', 'vitaminc'], pregnancy: 'ask' },
  vitaminc: { when: 'Morning', strength: '10–15% (ascorbic acid)', often: 'Every morning', how: 'After cleansing, before moisturizer and sunscreen.', pairs: ['vitamine', 'ferulic', 'hyaluronic', 'niacinamide', 'zincoxide'], dontMix: ['retinol', 'glycolic', 'benzoyl'], pregnancy: 'safe', tip: 'Turned dark orange? It has oxidised: replace it.' },
  arbutin: { when: 'Morning and/or evening', strength: '2%', often: 'Every day', pairs: ['niacinamide', 'vitaminc', 'txa'], pregnancy: 'ask' },
  txa: { when: 'Morning and/or evening', strength: '2–5%', often: 'Every day', pairs: ['niacinamide', 'arbutin', 'azelaic'], pregnancy: 'ask' },
  kojic: { when: 'Evening', strength: '1–2%', often: 'Once a day', pairs: ['niacinamide'], pregnancy: 'ask' },
  hydroquinone: { when: 'Evening, on prescription', often: 'As prescribed, for a limited time', pregnancy: 'avoid', tip: 'Only under a doctor’s supervision. Not in pregnancy.' },
  peptides: { when: 'Morning and evening', often: 'Every day', pairs: ['hyaluronic', 'niacinamide', 'ceramides'], pregnancy: 'safe' },
  sulfur: { when: 'Evening, or as a short mask', strength: '3–10%', often: 'Once a day on spots', pairs: ['niacinamide'], pregnancy: 'safe' },
  zincpyrithione: { when: 'As a wash', often: '2–3 times a week', how: 'Leave on 2–5 minutes, then rinse.', pregnancy: 'safe' },
  zincoxide: { when: 'Morning, last step', often: 'Every day, reapply every 2 hours outside', pairs: ['vitaminc', 'niacinamide'], pregnancy: 'safe' },
  titanium: { when: 'Morning, last step', often: 'Every day', pregnancy: 'safe' },
  chemicalspf: { when: 'Morning, last step', often: 'Every day, reapply every 2 hours outside', pregnancy: 'safe' },
  squalane: { when: 'Morning and/or evening', often: 'Every day', how: 'A few drops last, or mixed into your moisturizer.', pregnancy: 'safe' },
  hydrocolloid: { when: 'Evening, or under makeup', often: 'On a spot with a white head', how: 'On clean, dry skin. Leave until it turns white.', pregnancy: 'safe' },
}

export const PREGNANCY = {
  safe: { label: 'Generally safe in pregnancy', tone: 'success' },
  ask: { label: 'Ask your doctor if pregnant', tone: 'watch' },
  avoid: { label: 'Avoid during pregnancy', tone: 'danger' },
}
