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

// What the scan suggests for the journal and Emergency mode.
export const journalFrom = points => {
  const levels = DEKOD_POINTS.map(p => points?.[p.key]?.level)
  const mood = levels.includes('visible') ? 'bad' : levels.includes('light') ? 'okay' : null
  const tags = DEKOD_POINTS.filter(p => p.tag && points?.[p.key]?.level && points[p.key].level !== 'none').map(p => p.tag)
  const issues = DEKOD_POINTS.filter(p => p.issue && points?.[p.key]?.level === 'visible').map(p => p.issue)
  return { mood, tags, issues }
}

// ---------- Dekod × Rekod ----------
// Dekod reads the skin, Rekod transforms it: the scan suggests Rekod goals
// (Day 0), feeds the weekly check-in, and shows the before / after.

const RANK = { none: 0, light: 1, visible: 2 }
const levelOf = (points, key) => points?.[key]?.level || 'none'

// A scan from the last `days` days, newest first, or null.
export const recentScan = (history, days = 7) =>
  (history || []).find(h => Date.now() - new Date(h.created_at).getTime() <= days * 86400000) || null

// Rekod goals suggested by what Dekod saw (most visible first, max 3).
export const goalsFromDekod = points => {
  const map = [['blemishes', 'clear'], ['redness', 'calm'], ['dryness', 'hydration'], ['tone', 'spots'], ['shine', 'pores']]
  return map
    .filter(([key, goal]) => levelOf(points, key) !== 'none' && (goal !== 'pores' || levelOf(points, key) === 'visible'))
    .sort((a, b) => RANK[levelOf(points, b[0])] - RANK[levelOf(points, a[0])])
    .map(([, goal]) => goal)
    .slice(0, 3)
}

// Point by point, from the Day 0 scan to the latest: { key, from, to, trend }.
export const compareScans = (fromPoints, toPoints) =>
  DEKOD_POINTS.map(p => {
    const from = levelOf(fromPoints, p.key)
    const to = levelOf(toPoints, p.key)
    return { key: p.key, label: p.label, from, to, trend: RANK[to] < RANK[from] ? 'better' : RANK[to] > RANK[from] ? 'worse' : 'same' }
  })

// The weekly check-in answer the scan points to: irritation signs (redness,
// dryness) getting worse slow the plan down; otherwise it can move on.
export const checkInFromDekod = (fromPoints, toPoints) => {
  const irritation = compareScans(fromPoints, toPoints).filter(c => c.key === 'redness' || c.key === 'dryness')
  if (irritation.some(c => c.to === 'visible' && c.trend === 'worse')) return 'lot'
  if (irritation.some(c => c.trend === 'worse')) return 'little'
  return 'good'
}
