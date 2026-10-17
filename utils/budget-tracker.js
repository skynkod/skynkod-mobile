export const addExpense = (expense) => {
  return {
    id: Date.now(),
    name: expense.name,
    price: parseFloat(expense.price),
    category: expense.category,
    date: new Date().toISOString(),
    brand: expense.brand || 'Unknown',
    liters: expense.liters || null,
  };
};

export const calculateCostPerUse = (price, usesPerDay, daysLeft = 365) => {
  const totalUses = usesPerDay * daysLeft;
  return (price / totalUses).toFixed(2);
};

export const getMonthlySpending = (expenses) => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  return expenses
    .filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.getMonth() === currentMonth && expDate.getFullYear() === currentYear;
    })
    .reduce((sum, exp) => sum + exp.price, 0)
    .toFixed(2);
};

export const getBudgetStatus = (spent, budget) => {
  const percentage = (spent / budget) * 100;

  if (percentage >= 100) {
    return { status: 'Over Budget', color: '#F44336', percentage: 100, message: `You\'ve exceeded by $${(spent - budget).toFixed(2)}` };
  }
  if (percentage >= 80) {
    return { status: 'Warning', color: '#FF9800', percentage, message: `$${(budget - spent).toFixed(2)} left` };
  }
  if (percentage >= 50) {
    return { status: 'On Track', color: '#FFC107', percentage, message: `$${(budget - spent).toFixed(2)} left` };
  }
  return { status: 'Great!', color: '#4CAF50', percentage, message: `$${(budget - spent).toFixed(2)} left` };
};

export const getCategoryBreakdown = (expenses) => {
  const categories = {
    Cleanser: 0,
    Moisturizer: 0,
    Serum: 0,
    Sunscreen: 0,
    Treatment: 0,
    Mask: 0,
    Other: 0,
  };

  expenses.forEach(exp => {
    if (categories.hasOwnProperty(exp.category)) {
      categories[exp.category] += exp.price;
    } else {
      categories.Other += exp.price;
    }
  });

  return Object.entries(categories)
    .map(([name, amount]) => ({ name, amount: parseFloat(amount.toFixed(2)) }))
    .filter(cat => cat.amount > 0)
    .sort((a, b) => b.amount - a.amount);
};

export const getMonthlyTrend = (expenses, months = 6) => {
  const trend = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = date.toLocaleDateString('en-US', { month: 'short' });

    const spending = expenses
      .filter(exp => {
        const expDate = new Date(exp.date);
        return expDate.getMonth() === date.getMonth() && expDate.getFullYear() === date.getFullYear();
      })
      .reduce((sum, exp) => sum + exp.price, 0);

    trend.push({ month: monthName, amount: parseFloat(spending.toFixed(2)) });
  }

  return trend;
};

export const getProductValue = (product, usesPerDay = 1) => {
  const daysToFinish = product.liters ? (product.liters * 1000) / (usesPerDay * 5) : 30;
  const costPerDay = (product.price / daysToFinish).toFixed(2);

  return {
    costPerDay,
    costPerMonth: (costPerDay * 30).toFixed(2),
    daysToFinish: Math.round(daysToFinish),
    valueRating: costPerDay < 1 ? 'Great value' : costPerDay < 2 ? 'Good value' : 'Premium',
  };
};

export const setPremiumBudget = (userBudget = 100) => {
  return {
    total: userBudget,
    monthly: Math.round(userBudget / 12),
    perWeek: Math.round(userBudget / 52),
    suggestions: {
      cleanser: Math.round(userBudget * 0.15),
      moisturizer: Math.round(userBudget * 0.20),
      serum: Math.round(userBudget * 0.20),
      sunscreen: Math.round(userBudget * 0.15),
      treatment: Math.round(userBudget * 0.15),
      other: Math.round(userBudget * 0.15),
    },
  };
};

export const getReccomendedBudget = (skinType) => {
  const budgets = {
    'Oily': 80,
    'Dry': 120,
    'Combination': 100,
    'Sensitive': 150,
    'Acne-prone': 110,
  };
  return budgets[skinType] || 100;
};
