import { supabase } from './supabase'
import { localDay } from './routine-log'

// Water (Lita, 2026-10-24): a glass on Home that fills with each tap. Goal 8
// glasses, 10 on hot days. Honest about what it does: drinking more helps skin
// hydration mostly for people who usually drink little (Palma 2015).

export const WATER_GOAL = 8
export const waterGoal = (tempMax) => (Number(tempMax) >= 28 ? 10 : WATER_GOAL)
export const WATER_SOURCE = { label: 'Palma et al., Clin Cosmet Investig Dermatol 2015', url: 'https://pubmed.ncbi.nlm.nih.gov/26345226/' }

export const getWaterToday = async (userId) => {
  const { data } = await supabase.from('water_log').select('glasses').eq('user_id', userId).eq('day', localDay()).maybeSingle()
  return data?.glasses || 0
}

export const setWaterToday = async (userId, glasses) => {
  const { error } = await supabase.from('water_log').upsert({ user_id: userId, day: localDay(), glasses: Math.max(0, Math.min(30, glasses)), updated_at: new Date().toISOString() })
  if (error) throw error
}

// { 'YYYY-MM-DD': glasses } since a date, for the journal's patterns.
export const getWaterDays = async (userId, since) => {
  const { data } = await supabase.from('water_log').select('day, glasses').eq('user_id', userId).gte('day', localDay(since))
  return Object.fromEntries((data || []).map(r => [r.day, r.glasses]))
}
