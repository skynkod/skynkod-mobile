import { viewHeaders } from './premium'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase, getUserProfile, updateUserProfile } from './supabase'

const API_URL = process.env.EXPO_PUBLIC_API_URL

// Dekod: Skynkod's skin scan. One selfie goes to our backend, is analysed and
// dropped (never stored); only the result is saved, in the user's account.

export { DEKOD_POINTS, OLD_POINTS, scoreOf, levelFor, averagePoints, splitScans, startPoints, journalFrom, recentScan, goalsFromDekod, compareScans, checkInFromDekod } from './dekod-core'

// Her consent is kept in her account with its date (audit 2, 2026-10-25), so it
// can be shown and withdrawn; the server asks for it. Older consents given on
// this phone only are copied to her account once.
const consentKey = userId => `dekod_consent_${userId}`
export const hasDekodConsent = async userId => {
  const [local, row] = await Promise.all([AsyncStorage.getItem(consentKey(userId)).catch(() => null), getUserProfile(userId).catch(() => null)])
  if (row?.consent_dekod_at) return true
  if (local) { await updateUserProfile(userId, { consent_dekod_at: local }); return true }
  return false
}
export const giveDekodConsent = async userId => {
  const at = new Date().toISOString()
  await AsyncStorage.setItem(consentKey(userId), at).catch(() => {})
  await updateUserProfile(userId, { consent_dekod_at: at })
}

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
      // Her own date: the daily scan counts on her day, wherever she is.
      body: JSON.stringify({ image: base64, language, context, day: localDay() }),
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || data.error) return { error: data.error || `HTTP ${response.status}` }
    return data
  } catch {
    return { error: 'offline' }
  }
}

const localDay = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

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
