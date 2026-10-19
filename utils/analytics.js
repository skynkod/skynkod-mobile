// Usage statistics and error reports, saved in Supabase (app_events, app_errors).
// Linked to the account and on by default; the user can turn it off in
// Settings > Privacy (users.analytics_off). We count what people use, never
// what they write or feel (no moods, journal notes or Koda messages).
import { AppState, Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Constants from 'expo-constants'
import { getLocales } from 'expo-localization'
import { supabase } from './supabase'

const OFF_KEY = 'skynkod_analytics_off'
const OUTBOX_KEY = 'skynkod_error_outbox'
const MAX_QUEUE = 200

let userId = null
let off = false
let queue = []
let timer = null

const device = () => ({
  platform: Platform.OS,
  app_version: Constants.expoConfig?.version ?? null,
  language: getLocales()[0]?.languageCode ?? null,
})

// Called at sign-in (with the id) and sign-out (with null).
export async function setAnalyticsUser(id) {
  userId = id
  if (!id) { queue = []; return }
  off = (await AsyncStorage.getItem(OFF_KEY).catch(() => null)) === 'true'
  // The saved choice wins over the phone's copy (it may have changed on another phone).
  const { data } = await supabase.from('users').select('analytics_off').eq('id', id).maybeSingle()
  if (data) await setAnalyticsOff(!!data.analytics_off, false)
  flushErrors()
}

export async function setAnalyticsOff(value, save = true) {
  off = value
  if (off) queue = []
  await AsyncStorage.setItem(OFF_KEY, String(off)).catch(() => {})
  if (save && userId) {
    const { error } = await supabase.from('users').update({ analytics_off: off }).eq('id', userId)
    if (error) throw error
  }
}

export function isAnalyticsOff() {
  return off
}

// track('routine_done', { period: 'morning' })
export function track(name, props = {}) {
  if (!userId || off) return
  queue.push({ user_id: userId, name, props, ...device(), created_at: new Date().toISOString() })
  if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE)
  if (!timer) timer = setTimeout(flush, 5000)
}

async function flush() {
  timer = null
  if (!queue.length || !userId || off) return
  const batch = queue
  queue = []
  const { error } = await supabase.from('app_events').insert(batch)
  // Offline: keep them for the next try.
  if (error) queue = [...batch, ...queue].slice(-MAX_QUEUE)
}

// ---------- Errors ----------

// Errors wait in an outbox on the phone until they reach the server, so a
// crash is still reported the next time the app opens.
export async function reportError({ source, message, stack, fatal = false }) {
  if (off) return
  try {
    const outbox = JSON.parse((await AsyncStorage.getItem(OUTBOX_KEY)) || '[]')
    outbox.push({
      source: String(source || '').slice(0, 100),
      message: String(message || '').slice(0, 1000),
      stack: String(stack || '').slice(0, 4000),
      fatal,
      happened_at: new Date().toISOString(),
      ...device(),
    })
    await AsyncStorage.setItem(OUTBOX_KEY, JSON.stringify(outbox.slice(-30)))
  } catch {}
  if (!fatal) flushErrors()
}

let flushing = false
export async function flushErrors() {
  if (flushing || off) return
  flushing = true
  try {
    const outbox = JSON.parse((await AsyncStorage.getItem(OUTBOX_KEY)) || '[]')
    if (outbox.length) {
      const rows = outbox.map(e => ({ ...e, user_id: userId }))
      const { error } = await supabase.from('app_errors').insert(rows)
      if (!error) await AsyncStorage.removeItem(OUTBOX_KEY)
    }
  } catch {} finally {
    flushing = false
  }
}

// A crash that closes the app: saved first, sent at the next launch.
const previousHandler = global.ErrorUtils?.getGlobalHandler?.()
global.ErrorUtils?.setGlobalHandler?.((error, isFatal) => {
  reportError({ source: isFatal ? 'crash' : 'uncaught', message: error?.message, stack: error?.stack, fatal: !!isFatal })
  previousHandler?.(error, isFatal)
})

// Send what's waiting when the app goes to the background.
AppState.addEventListener('change', state => {
  if (state === 'background') flush()
  if (state === 'active') {
    track('app_open')
    flushErrors()
  }
})
