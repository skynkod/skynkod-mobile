import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'

// Each ticked routine step is one row in routine_completions, so the Journal
// can show "Morning routine 4/4" and how regular the user has been.

export const localDay = (date = new Date()) => {
  const d = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return d.toISOString().slice(0, 10)
}

// Ticks (done = true) or unticks one step of today's routine.
export const logStep = async ({ userId, routineId, type, stepIndex, done }) => {
  try {
    const day = localDay()
    const { error: delError } = await supabase
      .from('routine_completions')
      .delete()
      .eq('user_id', userId)
      .eq('routine_type', type)
      .eq('date', day)
      .eq('step_index', stepIndex)
    if (delError) throw delError
    if (!done) return { success: true }
    const { error } = await supabase.from('routine_completions').insert({
      user_id: userId,
      routine_id: routineId || null,
      routine_type: type,
      step_index: stepIndex,
      date: day,
      completed: true,
      completed_at: new Date().toISOString(),
    })
    if (error) throw error
    return { success: true }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// { morning: Set(stepIndex), evening: Set(stepIndex) } for one day.
export const getDayProgress = async (userId, day = localDay()) => {
  const { data, error } = await supabase
    .from('routine_completions')
    .select('routine_type, step_index')
    .eq('user_id', userId)
    .eq('date', day)
  if (error) throw error
  const out = { morning: new Set(), evening: new Set() }
  for (const row of data || []) out[row.routine_type]?.add(row.step_index)
  return out
}

// How many of the last `days` days had at least one routine step done.
export const getRecentRegularity = async (userId, days = 7) => {
  const since = localDay(new Date(Date.now() - (days - 1) * 86400000))
  const { data, error } = await supabase
    .from('routine_completions')
    .select('date')
    .eq('user_id', userId)
    .gte('date', since)
  if (error) throw error
  return { done: new Set((data || []).map(r => r.date)).size, days }
}

// Steps ticked while offline stay on the phone; send the missing ones so the
// Journal shows the same count as Home. Same storage key as Home and Routines.
export const syncTodayTicks = async (userId, routinesById = {}) => {
  try {
    const progress = await getDayProgress(userId, localDay())
    for (const type of ['morning', 'evening']) {
      const raw = await AsyncStorage.getItem(`routine_done_${userId}_${type}_${new Date().toDateString()}`)
      const ticks = JSON.parse(raw || '{}')
      for (const [idx, isDone] of Object.entries(ticks)) {
        if (isDone && !progress[type].has(Number(idx))) {
          await logStep({ userId, routineId: routinesById[type] || null, type, stepIndex: Number(idx), done: true })
        }
      }
    }
  } catch {
    // Offline again: it will sync next time.
  }
}
