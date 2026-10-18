export const scanBarcodeAndAnalyze = async (barcode, allProducts) => {
  // Simulate barcode lookup (in real app, use external barcode API)
  const product = allProducts.find(p => p.barcode === barcode);

  if (!product) {
    return {
      found: false,
      message: 'Product not found in database. Please add it manually.',
    };
  }

  return analyzeProduct(product);
};

export const analyzeProduct = (product) => {
  return {
    found: true,
    id: product.id,
    name: product.name,
    brand: product.brand,
    price: product.price,
    category: product.category,
    ingredients: product.ingredients || [],
    ingredientAnalysis: analyzeIngredients(product.ingredients || []),
    benefits: product.benefits || [],
    warnings: getWarnings(product.ingredients || []),
    compatibility: {
      goodWith: getGoodPairs(product.ingredients || []),
      avoidWith: getConflicts(product.ingredients || []),
    },
    rating: product.rating || 0,
    reviews: product.reviews || 0,
  };
};

const analyzeIngredients = (ingredients) => {
  return ingredients.map(ing => ({
    name: ing.name || ing,
    benefit: getIngredientBenefit(ing.name || ing),
    concentration: 'Unknown',
    concerns: getIngredientConcerns(ing.name || ing),
  }));
};

const getIngredientBenefit = (ingredient) => {
  const benefits = {
    'Hyaluronic Acid': '💧 Deep hydration',
    'Niacinamide': '🛡️ Barrier repair',
    'Retinol': '⏰ Anti-aging',
    'Salicylic Acid': '🧼 Exfoliation',
    'Benzoyl Peroxide': '💊 Acne fighting',
    'Glycerin': '💧 Hydration',
    'Ceramides': '🛡️ Barrier repair',
    'Vitamin C': '✨ Brightening',
    'Peptides': '💪 Firming',
    'Centella Asiatica': '🔴 Calming',
  };
  return benefits[ingredient] || '🧪 Active ingredient';
};

const getIngredientConcerns = (ingredient) => {
  const concerns = {
    'Retinol': ['Avoid with Vitamin C', 'Use SPF', 'Start low concentration'],
    'Salicylic Acid': ['Max 2x per week', 'Avoid with retinoids'],
    'Benzoyl Peroxide': ['Can be drying', 'Bleaches fabrics'],
    'Vitamin C': ['Unstable', 'Use in AM only'],
    'AHA/BHA': ['Increase photosensitivity', 'Use SPF'],
  };
  return concerns[ingredient] || [];
};

// Every caution that applies to the product's ingredients, without duplicates.
const getWarnings = (ingredients) => {
  const names = ingredients.map(ing => ing?.name || ing);
  return [...new Set(names.flatMap(getIngredientConcerns))];
};

const getGoodPairs = (ingredients) => {
  const pairs = [];
  const synergies = {
    'Hyaluronic Acid': ['Glycerin', 'Niacinamide', 'Peptides'],
    'Niacinamide': ['Retinol', 'Hyaluronic Acid', 'Salicylic Acid'],
    'Retinol': ['Niacinamide', 'Peptides'],
    'Vitamin C': ['Vitamin E', 'Ferulic Acid'],
  };

  ingredients.forEach(ing => {
    const name = ing.name || ing;
    if (synergies[name]) {
      pairs.push(...synergies[name]);
    }
  });

  return [...new Set(pairs)];
};

const getConflicts = (ingredients) => {
  const conflicts = [];
  const incompatible = {
    'Retinol': ['Vitamin C', 'AHA/BHA', 'Benzoyl Peroxide'],
    'Vitamin C': ['Retinol', 'AHA/BHA'],
    'Salicylic Acid': ['Retinol', 'Benzoyl Peroxide'],
    'AHA/BHA': ['Retinol', 'Vitamin C'],
  };

  ingredients.forEach(ing => {
    const name = ing.name || ing;
    if (incompatible[name]) {
      ingredients.forEach(ing2 => {
        const name2 = ing2.name || ing2;
        if (incompatible[name].includes(name2)) {
          conflicts.push(`${name} ❌ ${name2}`);
        }
      });
    }
  });

  return [...new Set(conflicts)];
};

export const getProductScore = (product, userSkinType) => {
  let score = 50;

  if (product.benefits) {
    score += product.benefits.length * 5;
  }

  if (product.rating) {
    score += (product.rating / 5) * 20;
  }

  // Adjust for skin type compatibility
  const skinTypeModifier = {
    'Oily': product.benefits?.includes('oil_control') ? 10 : -5,
    'Dry': product.benefits?.includes('hydration') ? 10 : -5,
    'Sensitive': product.benefits?.includes('calming') ? 10 : -5,
  };

  score += skinTypeModifier[userSkinType] || 0;

  return Math.min(100, Math.max(0, score));
};

export const getBarcodeFromCamera = async () => {
  // This would integrate with expo-barcode-scanner
  // For now, return a placeholder
  return null;
};
