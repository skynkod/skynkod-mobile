import { Platform } from 'react-native'
import Constants from 'expo-constants'
import AsyncStorage from '@react-native-async-storage/async-storage'

// Apple Health (inspired by Flo, Lita 2026-10-23): with her consent, Skynkod
// READS her period dates and her sleep, never writes anything. Used by the
// skin forecast ("period expected in 3 days") and the journal links (period,
// short nights) without her having to tick them.
//
// Needs a real build of the app: in Expo Go the native module doesn't exist,
// so everything here quietly says "not available". To check before launch.

const ON_KEY = 'skynkod_apple_health'
const DAY = 86400000
const READ = ['HKCategoryTypeIdentifierMenstrualFlow', 'HKCategoryTypeIdentifierSleepAnalysis']
const FLOW_NONE = 5
const ASLEEP = [1, 3, 4, 5] // asleep, core, deep, REM (not "in bed" or "awake")

let cached
const healthKit = () => {
  if (cached !== undefined) return cached
  cached = null
  if (Platform.OS !== 'ios' || Constants.executionEnvironment === 'storeClient') return null
  try { cached = require('@kingstinct/react-native-healthkit') } catch { cached = null }
  return cached
}

export const healthAvailable = async () => {
  const HK = healthKit()
  if (!HK) return false
  try { return await HK.isHealthDataAvailable() } catch { return false }
}
export const isHealthOn = async () => (await AsyncStorage.getItem(ON_KEY).catch(() => null)) === '1'

export const connectHealth = async () => {
  const HK = healthKit()
  if (!HK) return false
  await HK.requestAuthorization({ toRead: READ })
  await AsyncStorage.setItem(ON_KEY, '1')
  return true
}
export const disconnectHealth = () => AsyncStorage.removeItem(ON_KEY)

const dayKey = d => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}` }

// The last `days` days: the days with a period, and hours slept each night
// (counted on the morning she wakes up).
export const readHealth = async (days = 120) => {
  const HK = healthKit()
  if (!HK || !(await isHealthOn())) return null
  const filter = { date: { startDate: new Date(Date.now() - days * DAY), endDate: new Date() } }
  try {
    const [flow, sleep] = await Promise.all([
      HK.queryCategorySamples('HKCategoryTypeIdentifierMenstrualFlow', { limit: 0, filter }).catch(() => []),
      HK.queryCategorySamples('HKCategoryTypeIdentifierSleepAnalysis', { limit: 0, filter }).catch(() => []),
    ])
    const periodDays = new Set(flow.filter(s => s.value !== FLOW_NONE).map(s => dayKey(s.startDate)))
    const sleepHours = {}
    for (const s of sleep) {
      if (!ASLEEP.includes(s.value)) continue
      const k = dayKey(s.endDate)
      sleepHours[k] = (sleepHours[k] || 0) + (new Date(s.endDate) - new Date(s.startDate)) / 3600000
    }
    return { periodDays, sleepHours }
  } catch {
    return null
  }
}

// When the next period should start, from her own past cycles (at least 2
// periods logged, cycles between 21 and 40 days). Otherwise null: no guess.
export const nextPeriod = (periodDays, today = new Date()) => {
  const sorted = [...(periodDays || [])].sort()
  const starts = sorted.filter(k => !periodDays.has(dayKey(new Date(`${k}T12:00:00`).getTime() - DAY)))
  const gaps = starts.slice(1).map((k, i) => Math.round((new Date(`${k}T12:00:00`) - new Date(`${starts[i]}T12:00:00`)) / DAY)).filter(g => g >= 21 && g <= 40)
  if (!gaps.length) return null
  const cycle = Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)
  const next = new Date(`${starts[starts.length - 1]}T12:00:00`).getTime() + cycle * DAY
  const inDays = Math.round((next - new Date(dayKey(today) + 'T12:00:00')) / DAY)
  return inDays >= 0 ? { inDays, cycle } : null
}

// Adds what Apple Health knows to her check-ins, as if she had ticked it:
// "Hormonal / Period" on period days, "Poor sleep" after a night under 6 hours.
export const withHealthTags = (entries, health) => {
  if (!health) return entries
  return entries.map(e => {
    const k = dayKey(e.date)
    const tags = new Set(e.skin_conditions || [])
    if (health.periodDays.has(k)) tags.add('Hormonal / Period')
    if (health.sleepHours[k] !== undefined && health.sleepHours[k] < 6) tags.add('Poor sleep')
    return { ...e, skin_conditions: [...tags] }
  })
}
