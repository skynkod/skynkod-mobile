import { supabase } from './supabase';

export const addExpense = async (userId, expense) => {
  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert([
        {
          user_id: userId,
          name: expense.name,
          price: expense.price,
          category: expense.category,
          brand: expense.brand || null,
          date: new Date().toISOString(),
        },
      ]);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserExpenses = async (userId, days = 30) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .gte('date', thirtyDaysAgo.toISOString())
      .order('date', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteExpense = async (expenseId) => {
  try {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getMonthlyBudgetSummary = async (userId) => {
  try {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);

    const { data, error } = await supabase
      .from('expenses')
      .select('price')
      .eq('user_id', userId)
      .gte('date', firstDay.toISOString());

    if (error) throw error;

    const total = data.reduce((sum, exp) => sum + exp.price, 0);
    return { success: true, monthlyTotal: total };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
