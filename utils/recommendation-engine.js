export const scoreProduct = (product, userSkinConditions, userPreferences = {}) => {
  let score = 0;
  const breakdown = {};

  // 1. Condition Match (+40 max)
  const conditionMatch = userSkinConditions.length > 0
    ? (product.ingredients.filter(ing =>
        userSkinConditions.some(cond => ing.idealFor?.includes(cond))
      ).length / userSkinConditions.length) * 40
    : 0;
  breakdown.conditionMatch = Math.min(40, conditionMatch);
  score += breakdown.conditionMatch;

  // 2. Ingredient Quality (+30 max)
  const avgQuality = product.ingredients.reduce((sum, ing) => sum + (ing.benefitScore || 3), 0) / product.ingredients.length;
  breakdown.ingredientQuality = Math.min(30, (avgQuality / 5) * 30);
  score += breakdown.ingredientQuality;

  // 3. Synergy Bonus (+20 max)
  const synergies = product.ingredients.length > 1 ? Math.min(20, (product.ingredients.length - 1) * 5) : 0;
  breakdown.synergy = synergies;
  score += breakdown.synergy;

  // 4. Conflict Penalty (-50 min)
  const conflicts = product.ingredients.length > 0 ? Math.random() * 5 : 0; // placeholder
  breakdown.conflicts = -conflicts;
  score += breakdown.conflicts;

  return Math.max(0, Math.min(100, score));
};

export const getProductRecommendations = (products, userSkinConditions, budget = null, limit = 10) => {
  let filtered = products;

  if (budget) {
    filtered = filtered.filter(p => p.price <= budget);
  }

  const scored = filtered.map(product => ({
    ...product,
    score: scoreProduct(product, userSkinConditions),
  }));

  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
};

export const getIngredientSynergies = (ingredients) => {
  const synergies = [];
  for (let i = 0; i < ingredients.length; i++) {
    for (let j = i + 1; j < ingredients.length; j++) {
      if (ingredients[i].pairsWellWith?.includes(ingredients[j].name)) {
        synergies.push(`${ingredients[i].name} + ${ingredients[j].name}`);
      }
    }
  }
  return synergies;
};

export const getIngredientConflicts = (ingredients) => {
  const conflicts = [];
  for (let i = 0; i < ingredients.length; i++) {
    for (let j = i + 1; j < ingredients.length; j++) {
      if (ingredients[i].conflictsWith?.includes(ingredients[j].name)) {
        conflicts.push(`${ingredients[i].name} ❌ ${ingredients[j].name}`);
      }
    }
  }
  return conflicts;
};
