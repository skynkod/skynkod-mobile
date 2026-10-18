// Skin issues: what they are, what helps, what to avoid, when to see a doctor.

const issue = (id, title, subtitle, icon, forProfile, ingredients, about, helps, avoid, derm, extra = []) => ({
  id, section: 'issues', title, subtitle, icon, minutes: 4, forProfile, ingredients,
  blocks: [
    { p: about },
    ...extra,
    { h: 'What helps' },
    { list: helps },
    { h: 'What to avoid' },
    { list: avoid },
    { derm },
  ],
})

export const ISSUES = [
  issue(
    'comedonal-acne', 'Blackheads and whiteheads', 'Clogged pores, without much inflammation.', 'ellipse-outline',
    ['Acne', 'Comedonal', 'Large pores', 'Oily'], ['salicylic', 'retinol', 'niacinamide', 'azelaic'],
    'Comedones form when oil and dead skin clog a pore. Open, the plug oxidises and turns dark (blackhead). Closed, it stays white (whitehead).',
    ['Salicylic acid (BHA) 2–3 times a week: it dissolves oil inside the pores', 'A retinoid at night to keep pores from clogging', 'Niacinamide to regulate oil', 'A non-comedogenic moisturizer: skipping it makes skin produce more oil'],
    ['Squeezing: it pushes the plug deeper and leaves marks', 'Heavy oils and pore-clogging ingredients (isopropyl myristate, coconut oil...)', 'Harsh scrubs'],
    'See a dermatologist if nothing improves after 3 months of a consistent routine.'
  ),
  issue(
    'inflammatory-acne', 'Red, inflamed spots', 'Papules and pustules.', 'flame-outline',
    ['Acne', 'Inflammatory', 'Redness'], ['benzoyl', 'azelaic', 'niacinamide', 'centella', 'hydrocolloid'],
    'When bacteria and inflammation join a clogged pore, it becomes a red bump (papule) or a spot with a white head (pustule).',
    ['Benzoyl peroxide or azelaic acid on spots', 'Pimple patches (hydrocolloid) on whiteheads at night', 'Niacinamide and centella to calm the redness', 'Gentle cleanser twice a day'],
    ['Picking: it spreads the infection and leaves dark marks', 'Drying everything out: irritated skin heals more slowly', 'Too many actives at once'],
    'See a dermatologist if spots are painful, leave scars, or cover a large area: prescription treatments work much better.'
  ),
  issue(
    'cystic-acne', 'Cystic acne', 'Deep, painful lumps under the skin.', 'warning-outline',
    ['Acne', 'Cystic'], ['benzoyl', 'azelaic'],
    'Cysts and nodules are deep, painful and last for weeks. They often leave scars. This type of acne needs medical treatment: skincare alone isn’t enough.',
    ['Keep a gentle, simple routine that doesn’t irritate', 'A warm compress can ease the pain', 'Sunscreen to stop marks from darkening'],
    ['Squeezing or popping cysts: high risk of scarring', 'Strong scrubs and many actives'],
    'Please see a dermatologist: cystic acne responds to prescription treatments (topical, oral, sometimes hormonal) and early care prevents scars.'
  ),
  issue(
    'hormonal-acne', 'Hormonal acne', 'Jawline and chin breakouts, often around periods.', 'calendar-outline',
    ['Acne', 'Hormonal'], ['azelaic', 'niacinamide', 'salicylic', 'retinol'],
    'Hormonal acne usually shows on the jawline, chin and neck, and follows the menstrual cycle. Stress and poor sleep can make it worse.',
    ['A consistent routine all month, not only when spots appear', 'Azelaic acid and niacinamide: effective and gentle', 'Note your cycle in the Journal to see the pattern'],
    ['Changing products every time a spot appears', 'Over-treating the jawline'],
    'See a doctor or dermatologist: hormonal acne often responds to treatments only they can prescribe.'
  ),
  issue(
    'fungal-acne', 'Fungal acne', 'Small, itchy, same-size bumps.', 'bug-outline',
    ['Acne', 'Fungal', 'Oily'], ['zincpyrithione', 'sulfur', 'salicylic', 'fungalfood'],
    'Fungal acne (Malassezia folliculitis) is caused by yeast, not bacteria. It looks like many small, uniform bumps on the forehead, hairline or chest, and it itches. Classic acne treatments don’t help.',
    ['Products free of fungal-acne triggers: Skynkod flags them for you', 'Zinc pyrithione or a dandruff shampoo with ketoconazole as a short mask, then rinse', 'Sulfur and salicylic acid can help'],
    ['Most plant oils, fatty acids, esters and polysorbates (they feed the yeast)', 'Staying in sweaty clothes after sport', 'Heavy, rich creams'],
    'See a dermatologist to confirm it’s fungal and not bacterial acne: they can prescribe antifungal treatment.'
  ),
  issue(
    'rosacea', 'Rosacea', 'Redness, flushing and sometimes bumps.', 'flower-outline',
    ['Rosacea', 'Redness', 'Sensitive', 'Sensitivity'], ['azelaic', 'niacinamide', 'centella', 'zincoxide', 'alcohol', 'menthol'],
    'Rosacea is a chronic condition: the cheeks and nose redden easily, can stay red, and sometimes small bumps appear. It comes and goes in flare-ups.',
    ['Very gentle, fragrance-free products', 'Azelaic acid and niacinamide calm redness', 'Mineral sunscreen every day', 'Note your triggers in the Journal (sun, heat, spicy food, alcohol, stress)'],
    ['Alcohol, menthol, fragrance and essential oils in skincare', 'Hot water, long hot steam, scrubs', 'Strong acids and retinol without medical advice'],
    'See a dermatologist: prescription treatments calm rosacea far better than skincare alone.'
  ),
  issue(
    'eczema', 'Eczema and atopic skin', 'Dry, itchy, easily irritated patches.', 'bandage-outline',
    ['Eczema', 'Dry', 'Dryness', 'Sensitive'], ['ceramides', 'oat', 'panthenol', 'petrolatum', 'fragrance', 'sls'],
    'Atopic skin has a weak barrier: it loses water, dries out, itches and reacts easily. Eczema flares as red, itchy, sometimes oozing patches.',
    ['Rich, fragrance-free creams with ceramides, several times a day', 'Colloidal oatmeal and panthenol to soothe itching', 'Lukewarm, short showers, then cream within 3 minutes'],
    ['Fragrance, essential oils, alcohol, sulfates (SLS)', 'Exfoliants and strong actives on patches', 'Scratching: keep nails short'],
    'See a doctor during flare-ups: prescription creams are often needed to calm them.'
  ),
  issue(
    'melasma', 'Melasma', 'Brown patches on the cheeks, forehead or upper lip.', 'contrast-outline',
    ['Melasma', 'Dark spots'], ['txa', 'azelaic', 'vitaminc', 'niacinamide', 'arbutin', 'zincoxide'],
    'Melasma is triggered by sun, heat and hormones (pregnancy, contraception). It’s very common on Moroccan and darker skin tones, and it comes back easily.',
    ['SPF 50 every day, reapplied, plus a hat: this is the number one treatment', 'Tranexamic acid, azelaic acid, vitamin C, niacinamide, alpha-arbutin', 'Patience: results take 2–3 months'],
    ['Sun without protection, even a little', 'Heat (hammam, ovens) can make it worse', 'Irritating products: irritation darkens skin'],
    'See a dermatologist: melasma needs a long-term plan and sometimes prescription treatments.'
  ),
  issue(
    'pih', 'Dark marks after spots', 'Post-inflammatory hyperpigmentation.', 'ellipse',
    ['Dark spots', 'Acne', 'Inflammatory'], ['niacinamide', 'azelaic', 'vitaminc', 'arbutin', 'txa', 'retinol'],
    'After a spot, a scratch or irritation, the skin can leave a brown mark. It’s not a scar: it fades, but it can take months, especially on darker skin.',
    ['Sunscreen every day: it stops marks from darkening', 'Niacinamide, azelaic acid, vitamin C, alpha-arbutin, retinol', 'Treat the acne itself, so new marks don’t appear'],
    ['Picking spots', 'Harsh scrubs and irritation, which make marks darker'],
    'See a dermatologist if marks don’t fade after several months, or for scars with a dip in the skin.'
  ),
  issue(
    'sensitive-skin', 'Sensitive skin', 'Stinging, tightness, redness from products.', 'heart-outline',
    ['Sensitive', 'Sensitivity', 'Redness'], ['ceramides', 'panthenol', 'centella', 'betaglucan', 'fragrance'],
    'Sensitive skin reacts more than average to products, weather or stress. Usually the skin barrier is weakened.',
    ['A short routine: gentle cleanser, moisturizer, sunscreen', 'Soothing ingredients: centella, panthenol, beta-glucan, ceramides', 'Patch test every new product, one at a time'],
    ['Fragrance and essential oils', 'Several actives at once', 'Hot water and harsh foaming cleansers'],
    'See a dermatologist if your skin reacts to almost everything: it could be rosacea, eczema or an allergy.'
  ),
  issue(
    'perioral-dermatitis', 'Perioral dermatitis', 'Small red bumps around the mouth and nose.', 'happy-outline',
    ['Perioral dermatitis', 'Redness'], ['azelaic', 'petrolatum', 'fragrance'],
    'Small red bumps and dry patches around the mouth, nose, sometimes the eyes. It’s often linked to heavy creams, steroid creams or fluoride toothpaste.',
    ['Strip the routine back to the minimum: gentle cleanser and a light moisturizer', 'Patience: it can get worse for a few days before it improves'],
    ['Heavy, occlusive creams and balms around the mouth', 'Steroid creams (they make it worse after stopping)', 'Fragranced products'],
    'See a dermatologist: perioral dermatitis usually needs a prescription treatment to clear up.'
  ),
  issue(
    'seborrheic-dermatitis', 'Seborrheic dermatitis', 'Red, flaky patches on the sides of the nose and eyebrows.', 'snow-outline',
    ['Seborrheic dermatitis', 'Oily'], ['zincpyrithione', 'fungalfood'],
    'Greasy, flaky, sometimes itchy patches around the nose, eyebrows, hairline and scalp (dandruff). It’s linked to the same yeast as fungal acne.',
    ['Zinc pyrithione or ketoconazole washes as a short mask', 'Light, oil-free moisturizers'],
    ['Plant oils and rich creams on the patches', 'Scratching off the flakes'],
    'See a dermatologist for antifungal or anti-inflammatory treatment if it doesn’t calm down.'
  ),
]
