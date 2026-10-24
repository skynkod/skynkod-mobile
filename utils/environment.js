import { environmentState } from './environment-core'
import { loadState, saveState } from './cloud-state'

// Keeps one climate sample a day (last 45 days) and tells Home whether she is
// away from home in a different climate. On the phone and in her account.
export const getEnvironment = async (userId, coords, day) => {
  if (!userId || !coords?.latitude || !day) return null
  const today = { date: day.date, lat: coords.latitude, lon: coords.longitude, tempMax: day.tempMax, humidityMean: day.humidityMean, uvMax: day.uvMax }
  const samples = await loadState(userId, 'climate_samples', [])
  const next = [...samples.filter(s => s.date !== today.date), today].slice(-45)
  saveState(userId, 'climate_samples', next)
  const wasAway = !!(await loadState(userId, 'climate_away', false))
  const state = environmentState({ samples: next, today, wasAway })
  if (state?.kind === 'away' && !wasAway) saveState(userId, 'climate_away', true)
  if (state?.kind === 'back') saveState(userId, 'climate_away', false)
  return state
}
