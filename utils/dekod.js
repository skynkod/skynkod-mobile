import { viewHeaders } from './premium'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'

const API_URL = process.env.EXPO_PUBLIC_API_URL

// Dekod: Skynkod's skin scan. One selfie goes to our backend, is analysed and
// dropped (never stored); only the result is saved, in the user's account.

export { DEKOD_POINTS, scoreOf, levelFor, averagePoints, journalFrom, recentScan, goalsFromDekod, compareScans, checkInFromDekod } from './dekod-core'

const consentKey = userId => `dekod_consent_${userId}`
export const hasDekodConsent = async userId => !!(await AsyncStorage.getItem(consentKey(userId)).catch(() => null))
export const giveDekodConsent = userId => AsyncStorage.setItem(consentKey(userId), new Date().toISOString()).catch(() => {})

// { ok, summary, points } | { ok: false, retake } | { error }
// `context`: her skin type and known issues, for kinder notes and tips (the scores never use it).
export const runDekod = async (base64, language = 'en', context = null) => {
  try {
    if (!API_URL) return { error: 'not_configured' }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return { error: 'not_signed_in' }
    const response = await fetch(`${API_URL.replace(/\/$/, '')}/dekod`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${session.access_token}`, ...(await viewHeaders(session.user?.id)) },
      body: JSON.stringify({ image: base64, language, context }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || data.error) return { error: data.error || `HTTP ${response.status}` }
    return data
  } catch {
    return { error: 'offline' }
  }
}

export const saveDekodResult = async (userId, result) => {
  const { error } = await supabase.from('dekod_results').insert({ user_id: userId, result })
  if (error) throw error
  require('./journey').syncSoon(userId)
}

// She can delete any of her results, as promised before the first scan.
export const deleteDekodResult = async (id) => {
  const { error } = await supabase.from('dekod_results').delete().eq('id', id)
  if (error) throw error
}

// The user's scans, newest first: [{ id, created_at, result }].
export const getDekodResults = async (userId, limit = 30) => {
  const { data, error } = await supabase.from('dekod_results').select('id, created_at, result')
    .eq('user_id', userId).order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  return data || []
}
