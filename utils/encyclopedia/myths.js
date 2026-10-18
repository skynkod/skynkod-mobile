// Myths vs facts: common beliefs, and what's actually true.

const myth = (id, title, fact, why, ingredients = [], forProfile = [], tip = null) => ({
  id, section: 'myths', title, subtitle: fact, icon: 'help-buoy-outline', minutes: 1, forProfile, ingredients,
  blocks: [
    { h: 'Fact' },
    { p: fact },
    { p: why },
    ...(tip ? [{ tip }] : []),
  ],
})

export const MYTHS = [
  myth(
    'oily-no-moisturizer', '"Oily skin doesn’t need a moisturizer"',
    'Oily skin needs one too, just a lighter one.',
    'When you skip moisturizer, skin can become dehydrated and produce even more oil to compensate. A light gel or a non-comedogenic fluid keeps it balanced.',
    ['niacinamide', 'hyaluronic'], ['Oily', 'Combination', 'Acne']
  ),
  myth(
    'tingle-works', '"If it tingles, it works"',
    'Stinging means irritation, not effectiveness.',
    'A slight tingle from an acid can happen, but burning, redness or stinging that lasts means the product is too strong for your skin right now. Irritation slows healing and can cause dark marks.',
    [], ['Sensitive', 'Sensitivity', 'Rosacea']
  ),
  myth(
    'toothpaste-spots', '"Toothpaste dries out pimples"',
    'Toothpaste irritates the skin and can leave a mark.',
    'It contains menthol, fragrance and other ingredients made for teeth, not skin. Use a pimple patch, benzoyl peroxide or salicylic acid instead.',
    ['hydrocolloid', 'benzoyl', 'salicylic'], ['Acne']
  ),
  myth(
    'dark-skin-spf', '"Dark skin doesn’t need sunscreen"',
    'Every skin tone needs sunscreen.',
    'Melanin gives some protection, but not enough. Darker skin tones are actually more prone to dark spots and melasma, which the sun makes worse and longer-lasting.',
    ['zincoxide'], ['Dark spots', 'Melasma'], 'In Morocco, sunscreen every day, all year round.'
  ),
  myth(
    'natural-safe', '"Natural means safe"',
    'Natural ingredients can irritate or cause allergies too.',
    'Essential oils, lemon, cinnamon or henna on the face can cause strong reactions. What matters is the ingredient and its amount, not whether it’s natural or synthetic.',
    ['fragrance'], ['Sensitive', 'Eczema', 'Rosacea']
  ),
  myth(
    'lemon-spots', '"Lemon juice lightens dark spots"',
    'Lemon on the skin can burn and create new spots.',
    'It’s very acidic and reacts with the sun (phytophotodermatitis), which can leave brown marks. Vitamin C serums, niacinamide and azelaic acid do the job safely.',
    ['vitaminc', 'niacinamide', 'azelaic'], ['Dark spots', 'Melasma']
  ),
  myth(
    'pores-open-close', '"Hot water opens pores, cold water closes them"',
    'Pores don’t open or close.',
    'Heat softens what’s inside them and cold makes the skin feel tighter, but the pore itself doesn’t change size. Very hot water mostly dries out your skin.',
    ['salicylic', 'niacinamide'], ['Large pores']
  ),
  myth(
    'more-product', '"More product works better"',
    'The right amount works best.',
    'A pea of retinol, a few drops of serum: more doesn’t add results, it adds irritation and costs more. Sunscreen is the exception: most people use too little.',
    ['retinol']
  ),
  myth(
    'acne-dirty', '"Acne means your skin is dirty"',
    'Acne comes from hormones, oil, clogged pores and inflammation.',
    'Washing more or scrubbing harder makes acne worse. Twice a day with a gentle cleanser is enough.',
    [], ['Acne']
  ),
  myth(
    'expensive-better', '"Expensive products work better"',
    'Price doesn’t tell you if a product works.',
    'Many affordable products contain the same proven ingredients as luxury ones. Look at the ingredient list, not the price. Skynkod helps you compare.'
  ),
  myth(
    'sunscreen-winter', '"No sun, no sunscreen"',
    'UVA rays pass through clouds and windows.',
    'They age the skin and darken spots all year. Wear sunscreen every morning, even in winter and indoors near windows.',
    ['zincoxide']
  ),
  myth(
    'pop-pimple', '"Popping a pimple makes it go faster"',
    'Popping usually makes it last longer and leaves a mark.',
    'It pushes bacteria deeper and damages the skin around it. Cover it with a pimple patch and let it heal.',
    ['hydrocolloid'], ['Acne', 'Dark spots']
  ),
]
