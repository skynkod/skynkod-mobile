// The skin quiz: every question asked at sign-up and editable later in
// "My skin profile". One definition, used by both screens.
//
// Answers live in users.skin_profile (jsonb). The ones the compatibility engine
// already reads are also written to their own columns (skin_type,
// skin_concerns, acne_types, skin_conditions, avoid_ingredients, pregnancy,
// skin_goals). Health questions are only asked with the health consent.

export const CHAPTERS = [
  { id: 'you', label: 'About you', cheer: 'Let’s get to know each other.' },
  { id: 'test', label: 'Your skin test', cheer: 'No mirror needed, just think of an ordinary day.' },
  { id: 'bothers', label: 'What bothers you', cheer: 'Your skin is starting to talk to us…' },
  { id: 'signs', label: 'Mystery signs', cheer: 'Some things are hard to name. Let’s look closer.' },
  { id: 'health', label: 'Your health', cheer: 'Private, and only used to keep you safe.' },
  { id: 'habits', label: 'Your habits', cheer: 'Your days shape your skin too.' },
  { id: 'prefs', label: 'Your preferences', cheer: 'Last stretch!' },
]

const o = (value, label, hint) => ({ value, label, hint })

export const QUESTIONS = [
  { id: 'sex', chapter: 'you', type: 'single', title: 'You are…', subtitle: 'Skin differs a little between men and women (oil, shaving, hormones).',
    options: [o('woman', 'A woman'), o('man', 'A man'), o('other', 'Non-binary'), o('unsaid', 'I’d rather not say')] },

  { id: 'feel', chapter: 'test', type: 'single', title: 'Two hours after washing your face, with nothing on, it feels…',
    options: [o('dry', 'Tight or a bit rough'), o('normal', 'Comfortable'), o('combo', 'Shiny on the forehead and nose only'), o('oily', 'Shiny all over')] },
  { id: 'shine', chapter: 'test', type: 'single', title: 'By midday, your skin is…',
    options: [o('matte', 'Matte'), o('tzone', 'A bit shiny on the T-zone'), o('all', 'Shiny everywhere')] },
  { id: 'pores', chapter: 'test', type: 'single', title: 'Your pores are…',
    options: [o('small', 'Barely visible'), o('nose', 'Visible on the nose'), o('large', 'Visible on the cheeks too')] },
  { id: 'reactivity', chapter: 'test', type: 'single', title: 'Does your skin react easily?', subtitle: 'Stinging, redness or itching with products, heat or wind.',
    options: [o('rarely', 'Rarely'), o('sometimes', 'Sometimes'), o('often', 'Often')] },
  { id: 'sun', chapter: 'test', type: 'single', title: 'In the sun, you…', subtitle: 'It tells us how easily you get dark spots, and which sunscreen suits you.',
    options: [o('burn', 'Always burn, never tan'), o('burntan', 'Burn, then tan a little'), o('tan', 'Tan easily, rarely burn'), o('never', 'Never burn')] },

  { id: 'concerns', chapter: 'bothers', type: 'multi', title: 'What would you like to work on?', subtitle: 'Pick as many as you like.',
    options: ['Acne', 'Redness', 'Dryness', 'Dark spots', 'Fine lines', 'Large pores', 'Dullness', 'Sensitivity'].map(c => o(c, c)) },
  { id: 'acneWhere', chapter: 'bothers', type: 'multi', title: 'Where do you get breakouts?', showIf: a => (a.concerns || []).includes('Acne'),
    options: [o('forehead', 'Forehead'), o('cheeks', 'Cheeks'), o('jaw', 'Jawline and chin'), o('mouth', 'Around the mouth'), o('body', 'Chest or back')] },
  { id: 'acneTypes', chapter: 'bothers', type: 'multi', sensitive: true, title: 'What kind of breakouts?', subtitle: 'It changes which ingredients help.', showIf: a => (a.concerns || []).includes('Acne'),
    options: [o('Comedonal', 'Blackheads and whiteheads'), o('Inflammatory', 'Red, inflamed spots'), o('Cystic', 'Deep, painful cysts'), o('Hormonal', 'Hormonal (jawline, around periods)'), o('Fungal', 'Tiny itchy bumps (fungal acne)'), o('Unsure', 'Not sure')] },

  { id: 'signs', chapter: 'signs', type: 'multi', sensitive: true, title: 'Do you notice any of these?', subtitle: 'Pick what looks familiar. We’ll tell you what it might be.',
    options: [
      o('tiny_itchy', 'Tiny bumps, all the same size, that itch and get worse with heat or sweat'),
      o('flush', 'Redness on the cheeks and nose that comes and goes (heat, spicy food, stress)'),
      o('vessels', 'Small visible red lines on the cheeks or nose'),
      o('flaky', 'Flaky, slightly greasy patches around the nose, eyebrows or hairline'),
      o('mouth', 'Small red bumps around the mouth or nose that sting'),
      o('itchy_dry', 'Dry, itchy patches, sometimes in the folds of elbows or knees'),
      o('brown', 'Brown patches on the cheeks, forehead or upper lip, darker in summer'),
      o('None', 'None of these'),
    ] },

  { id: 'conditions', chapter: 'health', type: 'multi', sensitive: true, title: 'Has a doctor ever diagnosed one of these?',
    options: [o('Rosacea', 'Rosacea'), o('Eczema', 'Eczema or atopic skin'), o('Perioral dermatitis', 'Perioral dermatitis'), o('Seborrheic dermatitis', 'Seborrheic dermatitis'), o('Psoriasis', 'Psoriasis'), o('Melasma', 'Melasma'), o('None', 'None of these')] },
  { id: 'meds', chapter: 'health', type: 'multi', sensitive: true, title: 'Are you taking any of these?', subtitle: 'Some treatments make the skin fragile: we adapt your products.',
    options: [o('isotretinoin', 'Isotretinoin (Roaccutane, Curacné…)'), o('topical_rx', 'A prescription skin cream (tretinoin, adapalene, antibiotic…)'), o('hormonal', 'Hormonal treatment or contraception'), o('oral_antibiotic', 'Antibiotics by mouth'), o('None', 'None of these')] },
  { id: 'avoid', chapter: 'health', type: 'multi', sensitive: true, title: 'Anything you need to avoid?', subtitle: 'Allergies or ingredients that don’t agree with you.',
    options: [o('Fragrance', 'Fragrance'), o('Essential oils', 'Essential oils'), o('Nuts', 'Nuts'), o('Lanolin', 'Lanolin'), o('Alcohol', 'Alcohol'), o('None', 'Nothing in particular')] },
  { id: 'pregnancy', chapter: 'health', type: 'single', sensitive: true, title: 'Are you pregnant or breastfeeding?', subtitle: 'Some ingredients, like retinol, are best avoided then.', showIf: a => a.sex !== 'man',
    options: [o('no', 'No'), o('pregnant', 'I’m pregnant'), o('breastfeeding', 'I’m breastfeeding'), o('unsaid', 'I’d rather not say')] },

  { id: 'routineLevel', chapter: 'habits', type: 'single', title: 'Your routine today…', subtitle: 'You can add the products you use anytime in My products.',
    options: [o('none', 'Nothing, just water'), o('basic', 'Cleanser and cream'), o('full', 'A full routine'), o('lover', 'Lots of products, I love it')] },
  { id: 'shaving', chapter: 'habits', type: 'single', title: 'You shave…', showIf: a => a.sex === 'man',
    options: [o('daily', 'Every day'), o('often', 'A few times a week'), o('rarely', 'Rarely, or I keep a beard')] },
  { id: 'sunTime', chapter: 'habits', type: 'single', title: 'Time outside on a normal day',
    options: [o('low', 'Less than 30 minutes'), o('mid', '1 to 2 hours'), o('high', 'Most of the day')] },
  { id: 'makeup', chapter: 'habits', type: 'single', title: 'Make-up or tinted products?',
    options: [o('rarely', 'Rarely'), o('some', 'Some days'), o('daily', 'Every day')] },
  { id: 'sleep', chapter: 'habits', type: 'single', title: 'You usually sleep…',
    options: [o('short', 'Less than 6 hours'), o('ok', '6 to 8 hours'), o('long', 'More than 8 hours')] },
  { id: 'stress', chapter: 'habits', type: 'single', title: 'Your stress lately',
    options: [o('low', 'Low'), o('mid', 'Medium'), o('high', 'High')] },

  { id: 'goals', chapter: 'prefs', type: 'multi', max: 3, title: 'And your goals?', subtitle: 'Pick up to 3.',
    options: [o('clear', 'Clearer skin'), o('hydration', 'Deep hydration'), o('even_tone', 'An even skin tone'), o('anti_aging', 'Smoother, firmer skin'), o('simple', 'A routine I actually stick to')] },
  { id: 'time', chapter: 'prefs', type: 'single', title: 'Time you want to spend on your routine',
    options: [o('2', 'About 2 minutes'), o('5', 'About 5 minutes'), o('10', '10 minutes or more')] },
  { id: 'budget', chapter: 'prefs', type: 'single', title: 'Your budget per product',
    options: [o('low', 'Small budget'), o('mid', 'Medium budget'), o('high', 'I treat myself'), o('any', 'No limit')] },
  { id: 'prefs', chapter: 'prefs', type: 'multi', title: 'Anything that matters to you?',
    options: [o('fragrance_free', 'Fragrance-free'), o('vegan', 'Vegan'), o('cruelty_free', 'Cruelty-free'), o('None', 'Nothing in particular')] },
]

export const questionsFor = (answers, health) =>
  QUESTIONS.filter(q => (health || !q.sensitive) && (!q.showIf || q.showIf(answers)))

// ---------- Results ----------

// The skin type comes from the test, not from what people think they have.
export const computeSkinType = (a) => {
  if (!a.feel && !a.shine) return null
  if (a.feel === 'oily' || a.shine === 'all') return 'Oily'
  if (a.feel === 'combo' || a.shine === 'tzone' || (a.feel === 'normal' && a.pores === 'nose')) return 'Combination'
  if (a.feel === 'dry' && (!a.shine || a.shine === 'matte')) return 'Dry'
  return 'Normal'
}

// "Mystery signs" → what it might be. Never a diagnosis: we suggest seeing a doctor.
export const SUSPICIONS = {
  Fungal: { from: ['tiny_itchy'], title: 'It might be fungal acne', text: 'Tiny, itchy, same-size bumps that get worse with heat are typical of fungal acne (malassezia). It needs different products from regular acne.', field: 'acne' },
  Rosacea: { from: ['flush', 'vessels'], title: 'It might be rosacea', text: 'Redness that comes and goes, sometimes with small visible vessels, can be a sign of rosacea. Gentle products help; a doctor can confirm it and treat it.', field: 'condition' },
  'Seborrheic dermatitis': { from: ['flaky'], title: 'It might be seborrheic dermatitis', text: 'Flaky, slightly greasy patches around the nose and eyebrows often come from seborrheic dermatitis.', field: 'condition' },
  'Perioral dermatitis': { from: ['mouth'], title: 'It might be perioral dermatitis', text: 'Small stinging bumps around the mouth can be perioral dermatitis. Rich creams and some products can make it worse.', field: 'condition' },
  Eczema: { from: ['itchy_dry'], title: 'It might be eczema', text: 'Dry, itchy patches, especially in skin folds, are common with eczema (atopic skin). Barrier-repair products help a lot.', field: 'condition' },
  Melasma: { from: ['brown'], title: 'It might be melasma', text: 'Brown patches that darken in summer are often melasma. Daily sunscreen is essential.', field: 'condition' },
}
export const DOCTOR_NOTE = 'Only a doctor or dermatologist can confirm it. We recommend seeing one. Meanwhile, Skynkod avoids the ingredients known to make it worse.'

export const suspicionsFrom = (a) => {
  const signs = a.signs || []
  const diagnosed = [...(a.conditions || []), ...(a.acneTypes || [])]
  return Object.entries(SUSPICIONS).filter(([id, s]) => s.from.some(f => signs.includes(f)) && !diagnosed.includes(id)).map(([id]) => id)
}

export const PHOTOTYPE = { burn: 'I–II', burntan: 'III', tan: 'IV', never: 'V–VI' }

// ---------- Saving and reading ----------

const clean = list => (list || []).filter(v => v !== 'None')

// Answers → users row fields.
export const toColumns = (a, health) => {
  const concerns = [...(a.concerns || [])]
  if (a.reactivity === 'often' && !concerns.includes('Sensitivity')) concerns.push('Sensitivity')
  return {
    skin_profile: { ...a, suspected: health ? suspicionsFrom(a) : [] },
    skin_type: computeSkinType(a),
    skin_concerns: concerns,
    skin_goals: a.goals || [],
    skin_goal: (a.goals || [])[0] || null,
    acne_types: health && concerns.includes('Acne') ? clean(a.acneTypes).filter(v => v !== 'Unsure') : [],
    skin_conditions: health ? clean(a.conditions) : [],
    avoid_ingredients: health ? clean(a.avoid) : [],
    pregnancy: health && a.sex !== 'man' ? a.pregnancy || null : null,
  }
}

// users row → answers, for the profile screen (older accounts have only columns).
export const fromRow = (row) => ({
  ...(row?.skin_profile || {}),
  concerns: row?.skin_profile?.concerns || row?.skin_concerns || [],
  goals: row?.skin_profile?.goals || row?.skin_goals || [],
  acneTypes: row?.skin_profile?.acneTypes || row?.acne_types || [],
  conditions: row?.skin_profile?.conditions || row?.skin_conditions || [],
  avoid: row?.skin_profile?.avoid || row?.avoid_ingredients || [],
  pregnancy: row?.skin_profile?.pregnancy || row?.pregnancy || null,
})

// The profile the compatibility engine reads: suspected conditions count as a
// precaution, and treatments that make the skin fragile make it sensitive.
export const engineProfile = (row) => {
  const sp = row?.skin_profile || {}
  const suspected = row?.consent_health_at ? sp.suspected || [] : []
  const meds = row?.consent_health_at ? clean(sp.meds) : []
  const fragile = meds.includes('isotretinoin') || meds.includes('topical_rx')
  return {
    skin_type: row?.skin_type || null,
    skin_concerns: [...new Set([...(row?.skin_concerns || []), ...(fragile || sp.reactivity === 'often' ? ['Sensitivity'] : [])])],
    acne_types: [...new Set([...(row?.acne_types || []), ...suspected.filter(s => SUSPICIONS[s]?.field === 'acne')])],
    skin_conditions: [...new Set([...(row?.skin_conditions || []), ...suspected.filter(s => SUSPICIONS[s]?.field === 'condition')])],
    avoid_ingredients: row?.avoid_ingredients || [],
    pregnancy: row?.pregnancy || null,
    skin_goals: row?.skin_goals || [],
    sex: sp.sex || null,
    meds,
    fragile,
  }
}

export const answerLabel = (q, value) => {
  if (value === undefined || value === null || (Array.isArray(value) && !value.length)) return null
  const labels = (Array.isArray(value) ? value : [value]).map(v => q.options.find(x => x.value === v)?.label).filter(Boolean)
  return labels.join(' · ') || null
}
