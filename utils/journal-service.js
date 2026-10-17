import { supabase } from './supabase';

export const addJournalEntry = async (userId, entry) => {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .insert([
        {
          user_id: userId,
          date: new Date().toISOString(),
          hydration_level: entry.hydrationLevel || 5,
          barrier_health: entry.barrierHealth || 5,
          acne_level: entry.acneLevel || 0,
          redness_level: entry.rednessLevel || 0,
          texture_quality: entry.textureQuality || 5,
          mood: entry.mood || 'neutral',
          routine_completed: entry.routineCompleted || false,
          products_used: entry.productsUsed || [],
          notes: entry.notes || '',
          overall_satisfaction: entry.overallSatisfaction || 5,
        },
      ]);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getJournalEntries = async (userId, days = 30) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);

    const { data, error } = await supabase
      .from('journal_entries')
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

export const updateJournalEntry = async (entryId, updates) => {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .update(updates)
      .eq('id', entryId);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const deleteJournalEntry = async (entryId) => {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .delete()
      .eq('id', entryId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
