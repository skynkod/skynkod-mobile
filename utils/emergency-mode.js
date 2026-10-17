export const generateEmergencyPlan = (skinIssue, severity = 'moderate') => {
  const plans = {
    acne: {
      high: {
        day1: ['Gentle cleanser 2x', 'Salicylic acid spot treatment', 'Light moisturizer'],
        day2: ['Cleanser', 'Niacinamide serum', 'Sunscreen SPF30'],
        day3: ['Cleanser', 'Azelaic acid', 'Moisturizer + Retinol'],
        day4: ['Cleanser', 'Benzoyl peroxide (2.5%)', 'Hydrating mask'],
        day5: ['Cleanser', 'Salicylic acid', 'Oil-free moisturizer'],
        day6: ['Cleanser', 'Niacinamide', 'SPF moisturizer'],
        day7: ['Rest day - gentle routine only', 'Hydrating mask', 'Moisturizer'],
      },
      moderate: {
        day1: ['Cleanser', 'Salicylic acid 2x', 'Moisturizer'],
        day2: ['Cleanser', 'Niacinamide', 'Sunscreen'],
        day3: ['Cleanser', 'Retinol (start low)', 'Moisturizer'],
        day4: ['Cleanser', 'Azelaic acid', 'Hydrating mask'],
        day5: ['Cleanser', 'Spot treatment', 'SPF moisturizer'],
        day6: ['Cleanser', 'Niacinamide serum', 'Moisturizer'],
        day7: ['Light routine', 'Hydrating mask', 'Rest'],
      },
      low: {
        day1: ['Cleanser', 'Salicylic acid', 'Moisturizer'],
        day2: ['Cleanser', 'Niacinamide', 'SPF'],
        day3: ['Cleanser', 'Gentle exfoliant', 'Moisturizer'],
        day4: ['Cleanser', 'Vitamin C serum', 'SPF'],
        day5: ['Cleanser', 'Hydrating mask', 'Moisturizer'],
        day6: ['Cleanser', 'Niacinamide', 'SPF'],
        day7: ['Maintenance routine', 'Hydrating mask', 'Moisturizer'],
      },
    },
    redness: {
      high: {
        day1: ['Calming cleanser', 'Centella asiatica', 'Barrier repair cream'],
        day2: ['Gentle cleanser', 'Niacinamide', 'Moisturizer + sunscreen'],
        day3: ['Cleanser', 'Azelaic acid', 'Soothing mask'],
        day4: ['Cleanser', 'Hyaluronic acid', 'Barrier cream'],
        day5: ['Gentle cleanser', 'Allantoin serum', 'SPF moisturizer'],
        day6: ['Cleanser', 'Centella + Niacinamide', 'Barrier cream'],
        day7: ['Light routine', 'Hydrating mask', 'Rest'],
      },
      moderate: {
        day1: ['Cleanser', 'Centella asiatica', 'Moisturizer'],
        day2: ['Cleanser', 'Niacinamide', 'SPF'],
        day3: ['Cleanser', 'Azelaic acid', 'Moisturizer'],
        day4: ['Cleanser', 'Green tea antioxidant', 'Moisturizer'],
        day5: ['Cleanser', 'Soothing mask', 'SPF'],
        day6: ['Cleanser', 'Niacinamide', 'Moisturizer'],
        day7: ['Maintenance', 'Hydrating mask', 'Rest'],
      },
      low: {
        day1: ['Cleanser', 'Niacinamide', 'Moisturizer'],
        day2: ['Cleanser', 'Green tea serum', 'SPF'],
        day3: ['Cleanser', 'Hydrating mask', 'Moisturizer'],
        day4: ['Cleanser', 'Vitamin C', 'SPF'],
        day5: ['Cleanser', 'Soothing serum', 'Moisturizer'],
        day6: ['Cleanser', 'Niacinamide', 'SPF'],
        day7: ['Maintenance', 'Hydrating mask', 'Moisturizer'],
      },
    },
    dryness: {
      high: {
        day1: ['Gentle cleanser', 'Hyaluronic acid', 'Rich moisturizer'],
        day2: ['Hydrating cleanser', 'Glycerin serum', 'Occlusives'],
        day3: ['Cleanser', 'Ceramides', 'Rich cream'],
        day4: ['Gentle cleanser', 'Peptides', 'Hydrating mask'],
        day5: ['Cleanser', 'Hyaluronic acid + Glycerin', 'Moisturizer'],
        day6: ['Gentle cleanser', 'Oil serum', 'Rich moisturizer'],
        day7: ['Light routine', 'Deep hydrating mask', 'Rest'],
      },
      moderate: {
        day1: ['Cleanser', 'Hyaluronic acid', 'Moisturizer'],
        day2: ['Cleanser', 'Glycerin', 'Moisturizer'],
        day3: ['Cleanser', 'Ceramides', 'Moisturizer'],
        day4: ['Cleanser', 'Hydrating mask', 'Moisturizer'],
        day5: ['Cleanser', 'Peptides', 'Moisturizer'],
        day6: ['Cleanser', 'Niacinamide', 'Rich cream'],
        day7: ['Maintenance', 'Hydrating mask', 'Moisturizer'],
      },
      low: {
        day1: ['Cleanser', 'Hyaluronic acid', 'Moisturizer'],
        day2: ['Cleanser', 'Glycerin serum', 'Moisturizer'],
        day3: ['Cleanser', 'Hydrating mask', 'Moisturizer'],
        day4: ['Cleanser', 'Peptides', 'Moisturizer'],
        day5: ['Cleanser', 'Ceramides', 'Moisturizer'],
        day6: ['Cleanser', 'Niacinamide', 'Moisturizer'],
        day7: ['Maintenance', 'Hydrating mask', 'Moisturizer'],
      },
    },
  };

  return plans[skinIssue]?.[severity] || plans.acne.moderate;
};

export const calculateSeverity = (symptomScore) => {
  if (symptomScore >= 8) return 'high';
  if (symptomScore >= 5) return 'moderate';
  return 'low';
};

export const getSOS_Tips = () => [
  '❌ Avoid: Hot water, over-exfoliating, heavy makeup',
  '✅ Do: Stay hydrated, sleep 8 hours, use SPF daily',
  '💧 Priority: Barrier repair + hydration',
  '🚨 If worsening: Consult dermatologist',
];
