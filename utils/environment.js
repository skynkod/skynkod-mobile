import AsyncStorage from '@react-native-async-storage/async-storage'
import { environmentState } from './environment-core'

// Keeps one climate sample a day (last 45 days) and tells Home whether she is
// away from home in a different climate. Stays on the phone.
const SAMPLES = 'skynkod_climate_samples'
const AWAY = 'skynkod_climate_away'

export const getEnvironment = async (coords, day) => {
  if (!coords?.latitude || !day) return null
  const today = { date: day.date, lat: coords.latitude, lon: coords.longitude, tempMax: day.tempMax, humidityMean: day.humidityMean, uvMax: day.uvMax }
  const samples = JSON.parse((await AsyncStorage.getItem(SAMPLES).catch(() => null)) || '[]')
  const next = [...samples.filter(s => s.date !== today.date), today].slice(-45)
  AsyncStorage.setItem(SAMPLES, JSON.stringify(next)).catch(() => {})
  const wasAway = (await AsyncStorage.getItem(AWAY).catch(() => null)) === '1'
  const state = environmentState({ samples: next, today, wasAway })
  if (state?.kind === 'away' && !wasAway) AsyncStorage.setItem(AWAY, '1').catch(() => {})
  if (state?.kind === 'back') AsyncStorage.removeItem(AWAY).catch(() => {})
  return state
}
