export const buildRoutine = (skinType, skinConditions, preferences = {}) => {
  const morningRoutine = buildMorningRoutine(skinType, skinConditions);
  const eveningRoutine = buildEveningRoutine(skinType, skinConditions);

  return {
    morning: morningRoutine,
    evening: eveningRoutine,
    frequency: 'daily',
    adaptationTips: getAdaptationTips(skinType),
  };
};

const buildMorningRoutine = (skinType, conditions) => {
  const steps = [];

  // Step 1: Cleanser
  steps.push({
    order: 1,
    action: 'Cleanse',
    product: getCleanser(skinType),
    time: '2-3 min',
    tip: 'Use lukewarm water, pat dry gently',
  });

  // Step 2: Toner/Essence
  if (conditions.includes('Dehydrated') || conditions.includes('Dry')) {
    steps.push({
      order: 2,
      action: 'Hydrate',
      product: 'Hydrating toner or essence',
      time: '1 min',
      tip: 'Apply to damp skin',
    });
  }

  // Step 3: Serum
  steps.push({
    order: 3,
    action: 'Treat',
    product: getSerumForConditions(conditions),
    time: '1 min',
    tip: 'Use pea-sized amount, wait 1-2 min',
  });

  // Step 4: Moisturizer
  steps.push({
    order: 4,
    action: 'Moisturize',
    product: getMoisturizer(skinType),
    time: '1 min',
    tip: 'Apply to face and neck',
  });

  // Step 5: Sunscreen
  steps.push({
    order: 5,
    action: 'Protect',
    product: 'SPF 30+',
    time: '2 min',
    tip: 'Use 1/4 teaspoon for face, wait 15 min before makeup',
  });

  return steps;
};

const buildEveningRoutine = (skinType, conditions) => {
  const steps = [];

  // Step 1: Makeup removal
  steps.push({
    order: 1,
    action: 'Remove makeup',
    product: getMakeupRemover(skinType),
    time: '2 min',
    tip: 'Double cleanse if needed',
  });

  // Step 2: Cleanser
  steps.push({
    order: 2,
    action: 'Cleanse',
    product: getCleanser(skinType),
    time: '2-3 min',
    tip: 'Massage gently for 60 seconds',
  });

  // Step 3: Toner
  if (conditions.includes('Oily') || conditions.includes('Acne-prone')) {
    steps.push({
      order: 3,
      action: 'Balance',
      product: 'Balancing toner',
      time: '1 min',
      tip: 'Use on T-zone if needed',
    });
  }

  // Step 4: Treatment
  steps.push({
    order: 4,
    action: 'Treat',
    product: getEveningTreatment(conditions),
    time: '1-2 min',
    tip: 'Rotate: Retinol 3x/week, AHA/BHA 2x/week',
  });

  // Step 5: Moisturizer
  steps.push({
    order: 5,
    action: 'Moisturize',
    product: getMoisturizer(skinType),
    time: '1 min',
    tip: 'Can use richer formula at night',
  });

  // Step 6: Eye cream
  steps.push({
    order: 6,
    action: 'Eye care',
    product: 'Eye cream or serum',
    time: '1 min',
    tip: 'Pat gently with ring finger',
  });

  return steps;
};

const getCleanser = (skinType) => {
  const cleansers = {
    'Oily': 'Oil-control cleanser (gel or foam)',
    'Dry': 'Gentle cream cleanser',
    'Combination': 'Balanced gel cleanser',
    'Sensitive': 'Fragrance-free gentle cleanser',
    'Acne-prone': 'Salicylic acid cleanser',
  };
  return cleansers[skinType] || 'Gentle cleanser';
};

const getMoisturizer = (skinType) => {
  const moisturizers = {
    'Oily': 'Lightweight gel moisturizer',
    'Dry': 'Rich cream moisturizer',
    'Combination': 'Hydrating gel-cream',
    'Sensitive': 'Hypoallergenic moisturizer',
    'Acne-prone': 'Oil-free non-comedogenic moisturizer',
  };
  return moisturizers[skinType] || 'Hydrating moisturizer';
};

const getSerumForConditions = (conditions) => {
  if (conditions.includes('Acne-prone')) return 'Niacinamide or Salicylic acid serum';
  if (conditions.includes('Aging')) return 'Vitamin C or Peptide serum';
  if (conditions.includes('Dehydrated')) return 'Hyaluronic acid serum';
  if (conditions.includes('Sensitive')) return 'Centella asiatica serum';
  return 'Hydrating serum';
};

const getEveningTreatment = (conditions) => {
  if (conditions.includes('Acne-prone')) return 'Benzoyl peroxide or Retinol';
  if (conditions.includes('Aging')) return 'Retinol or Peptides';
  if (conditions.includes('Sensitive')) return 'Gentle hydrating mask';
  return 'Retinol or AHA/BHA';
};

const getMakeupRemover = (skinType) => {
  if (skinType === 'Oily') return 'Micellar water or cleansing gel';
  if (skinType === 'Dry') return 'Cleansing oil or balm';
  return 'Micellar water';
};

const getAdaptationTips = (skinType) => {
  const tips = {
    'Oily': ['Skip moisturizer if skin feels heavy', 'Use mattifying products in T-zone'],
    'Dry': ['Apply serums to damp skin', 'Layer moisturizers for extra hydration'],
    'Combination': ['Customize per zone', 'Use lighter products on T-zone'],
    'Sensitive': ['Patch test new products', 'Simplify routine if irritated'],
    'Acne-prone': ['Start with 2x/week treatments', 'Increase slowly to avoid irritation'],
  };
  return tips[skinType] || [];
};

export const adjustRoutineForWeather = (season) => {
  const adjustments = {
    summer: 'Use lighter formulas, increase SPF, reduce heavy occlusives',
    winter: 'Add richer moisturizer, use humidifier, layer products',
    spring: 'Introduce active ingredients gradually, monitor for reactions',
    fall: 'Strengthen barrier before cold weather, add antioxidants',
  };
  return adjustments[season] || '';
};

export const getRoutineConsistencyScore = (completedDays, totalDays) => {
  const percentage = (completedDays / totalDays) * 100;
  if (percentage >= 90) return { score: 95, message: 'Excellent!' };
  if (percentage >= 75) return { score: 80, message: 'Great job!' };
  if (percentage >= 50) return { score: 60, message: 'Keep going!' };
  return { score: 40, message: 'Try to be consistent' };
};
