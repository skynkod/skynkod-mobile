import { supabase } from './supabase';

export const createRoutine = async (userId, routine) => {
  try {
    const { data, error } = await supabase
      .from('routines')
      .insert([
        {
          user_id: userId,
          name: routine.name,
          type: routine.type, // 'morning' or 'evening'
          steps: routine.steps,
          created_at: new Date().toISOString(),
        },
      ]);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Saves the user's morning or evening routine. Updates the existing row
// (past ticks in routine_completions point to it) or creates the first one.
export const saveRoutine = async (userId, type, steps) => {
  try {
    const { data: existing, error: findError } = await supabase
      .from('routines')
      .select('id')
      .eq('user_id', userId)
      .eq('type', type)
      .order('created_at', { ascending: false })
      .limit(1);
    if (findError) throw findError;

    const row = { name: type === 'morning' ? 'Morning routine' : 'Night routine', steps, updated_at: new Date().toISOString() };
    const { data, error } = existing?.length
      ? await supabase.from('routines').update(row).eq('id', existing[0].id).select()
      : await supabase.from('routines').insert([{ ...row, user_id: userId, type }]).select();
    if (error) throw error;
    return { success: true, data: data?.[0] };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getUserRoutines = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('routines')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const completeRoutineStep = async (userId, routineId, stepIndex) => {
  try {
    const { data, error } = await supabase
      .from('routine_completions')
      .insert([
        {
          user_id: userId,
          routine_id: routineId,
          step_index: stepIndex,
          completed_at: new Date().toISOString(),
        },
      ]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

export const getRoutineCompletionStats = async (userId, routineId, days = 30) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);

    const { data, error } = await supabase
      .from('routine_completions')
      .select('*')
      .eq('user_id', userId)
      .eq('routine_id', routineId)
      .gte('completed_at', thirtyDaysAgo.toISOString());

    if (error) throw error;

    const completedDays = new Set(
      data.map(c => new Date(c.completed_at).toDateString())
    ).size;

    return {
      success: true,
      completedDays,
      totalDays: days,
      consistency: Math.round((completedDays / days) * 100),
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
