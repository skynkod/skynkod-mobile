import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'

const API_URL = process.env.EXPO_PUBLIC_API_URL

// Dekod: Skynkod's skin scan. One selfie goes to our backend, is analysed and
// dropped (never stored); only the result is saved, in the user's account.

export const DEKOD_POINTS = [
  { key: 'redness', label: 'Redness', icon: 'pulse-outline', tag: 'Redness', issue: 'redness' },
  { key: 'shine', label: 'Shine', icon: 'sunny-outline', tag: 'Oily', issue: null },
  { key: 'blemishes', label: 'Blemishes', icon: 'ellipse-outline', tag: 'New pimple', issue: 'breakout' },
  { key: 'dryness', label: 'Dryness', icon: 'water-outline', tag: 'Dryness', issue: 'dry' },
  { key: 'tone', label: 'Tone & dark spots', icon: 'color-palette-outline', tag: null, issue: null },
]

const consentKey = userId => `dekod_consent_${userId}`
export const hasDekodConsent = async userId => !!(await AsyncStorage.getItem(consentKey(userId)).catch(() => null))
export const giveDekodConsent = userId => AsyncStorage.setItem(consentKey(userId), new Date().toISOString()).catch(() => {})

// { ok, summary, points } | { ok: false, retake } | { error }
export const runDekod = async (base64, language = 'en') => {
  try {
    if (!API_URL) return { error: 'not_configured' }
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) return { error: 'not_signed_in' }
    const response = await fetch(`${API_URL.replace(/\/$/, '')}/dekod`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ image: base64, language }),
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
}

// What the scan suggests for the journal and Emergency mode.
export const journalFrom = points => {
  const levels = DEKOD_POINTS.map(p => points?.[p.key]?.level)
  const mood = levels.includes('visible') ? 'bad' : levels.includes('light') ? 'okay' : null
  const tags = DEKOD_POINTS.filter(p => p.tag && points?.[p.key]?.level && points[p.key].level !== 'none').map(p => p.tag)
  const issues = DEKOD_POINTS.filter(p => p.issue && points?.[p.key]?.level === 'visible').map(p => p.issue)
  return { mood, tags, issues }
}
