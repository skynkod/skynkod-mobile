import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Sharing from 'expo-sharing'
import * as LocalAuthentication from 'expo-local-authentication'
import { File, Paths } from 'expo-file-system'
import { supabase } from './supabase'
import { setAnalyticsOff } from './analytics'
import { clearChatHistory } from './chat-service'

// Privacy, inspired by Flo (Lita, 2026-10-23): a copy of all her data right
// away, a discreet mode, a Face ID lock, and an optional "why are you leaving?".

// ---------- A copy of my data, right now ----------
const MY_TABLES = ['journal_entries', 'skin_checkins', 'routines', 'routine_completions', 'routine_archive', 'skin_events', 'user_products', 'rekod_plans', 'dekod_results', 'photos', 'chat_history', 'expenses', 'product_submissions', 'user_skin_conditions', 'app_events']

export const exportMyData = async (userId) => {
  const [{ data: account }, ...tables] = await Promise.all([
    supabase.from('users').select('*').eq('id', userId).maybeSingle(),
    ...MY_TABLES.map(table => supabase.from(table).select('*').eq('user_id', userId)),
  ])
  const data = { exported_at: new Date().toISOString(), account: account || null }
  MY_TABLES.forEach((table, i) => { data[table] = tables[i].error ? { error: 'Could not be read, ask us at privacy@skynkod.com' } : tables[i].data || [] })
  const file = new File(Paths.cache, `skynkod-my-data-${new Date().toISOString().slice(0, 10)}.json`)
  file.create({ overwrite: true })
  await file.write(JSON.stringify(data, null, 2))
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(file.uri, { mimeType: 'application/json', UTI: 'public.json', dialogTitle: 'My Skynkod data' })
  return file.uri
}

// ---------- Discreet mode ----------
// Removes her first name and date of birth, turns statistics off, and Koda
// conversations are no longer kept (past ones are deleted). Her email stays,
// only so she can sign in again.
const discreetKey = userId => `skynkod_discreet_${userId}`
export const isDiscreet = async userId => (await AsyncStorage.getItem(discreetKey(userId)).catch(() => null)) === '1'

export const setDiscreet = async (userId, on) => {
  if (on) {
    const { error } = await supabase.from('users').update({ first_name: null, birth_date: null, analytics_off: true, discreet_mode: true }).eq('id', userId)
    if (error) throw error
    await setAnalyticsOff(true, false)
    await clearChatHistory(userId)
    await AsyncStorage.multiRemove([`skynkod_first_name_${userId}`]).catch(() => {})
    await AsyncStorage.setItem(discreetKey(userId), '1')
  } else {
    const { error } = await supabase.from('users').update({ discreet_mode: false }).eq('id', userId)
    if (error) throw error
    await AsyncStorage.removeItem(discreetKey(userId))
  }
}

// ---------- Face ID lock ----------
const LOCK_KEY = 'skynkod_app_lock'
export const isLockOn = async () => (await AsyncStorage.getItem(LOCK_KEY).catch(() => null)) === '1'
export const canLock = async () => (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync())
export const unlock = async (promptMessage) => {
  const result = await LocalAuthentication.authenticateAsync({ promptMessage, fallbackLabel: 'Use passcode' })
  return result.success
}
// Turning it on or off asks for Face ID first, so nobody else can change it.
export const setLock = async (on, promptMessage) => {
  if (!(await unlock(promptMessage))) return false
  if (on) await AsyncStorage.setItem(LOCK_KEY, '1')
  else await AsyncStorage.removeItem(LOCK_KEY)
  return true
}

// ---------- Why are you leaving? (optional, anonymous) ----------
export const LEAVING_REASONS = [
  { id: 'not_useful', label: 'It wasn’t useful for my skin' },
  { id: 'too_complex', label: 'Too complicated to use' },
  { id: 'price', label: 'Premium is too expensive' },
  { id: 'privacy', label: 'Privacy worries' },
  { id: 'other_app', label: 'I use another app' },
]
// No user id: only the reason and the day.
export const sendLeavingReason = async (reason) => {
  if (!reason) return
  await supabase.from('leaving_feedback').insert({ reason }).then(() => {}, () => {})
}
