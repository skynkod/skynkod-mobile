import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Location from 'expo-location'

// "Skin weather": today's local weather (Open-Meteo, free, no key) turned
// into the one skincare tip that matters most today, shown on Home.

const CACHE_KEY = 'skynkod_skin_weather'

// One tip from the day's weather, most important first. `profile` adapts
// the thresholds (dry skin hears about dry air sooner, oily about humidity).
export const pickSkinTip = (w, profile, city) => {
  if (!w) return null
  const type = profile?.skin_type
  const dryThreshold = type === 'Dry' || type === 'Sensitive' ? 40 : 30
  const at = city ? ` in ${city}` : ''
  const hour = h => `${h}:00`

  // Chergui: hot, dry, windy.
  if (w.tempMax >= 30 && w.humidityMin <= 25 && w.windMax >= 25) {
    return { icon: 'flag-outline', text: 'Chergui today · Hot, dry wind: protect your skin barrier' }
  }
  if (w.uvMax >= 8) {
    return { icon: 'sunny-outline', text: `UV ${Math.round(w.uvMax)}${at} · Reapply sunscreen around ${hour(w.uvPeakHour)}` }
  }
  if (w.humidityMin <= dryThreshold) {
    return { icon: 'leaf-outline', text: 'Very dry air today · Your skin will be thirsty, add a hydrating serum' }
  }
  if (w.tempMax >= 33 && w.humidityMean >= 60) {
    return { icon: 'water-outline', text: `${Math.round(w.tempMax)}° and humid · Light cream, and cleanse well tonight` }
  }
  if (w.tempMax >= 33) {
    return { icon: 'thermometer-outline', text: `${Math.round(w.tempMax)}°${at} · Light textures, and reapply your SPF` }
  }
  if (w.tempMax <= 10) {
    return { icon: 'snow-outline', text: `Cold day · ${Math.round(w.tempMax)}° · Richer cream, protect your cheeks and lips` }
  }
  if (type === 'Oily' && w.humidityMean >= 70) {
    return { icon: 'water-outline', text: 'Humid day · A light gel moisturizer is enough' }
  }
  if (w.uvMax >= 5) {
    return { icon: 'partly-sunny-outline', text: `UV ${Math.round(w.uvMax)}${at} · SPF 30 or more this morning` }
  }
  return { icon: 'cloud-outline', text: `Mild day · ${Math.round(w.tempMax)}°${at} · Your usual routine is perfect` }
}

const fetchWeather = async ({ latitude, longitude }) => {
  const url = 'https://api.open-meteo.com/v1/forecast'
    + `?latitude=${latitude}&longitude=${longitude}`
    + '&daily=uv_index_max,temperature_2m_max,relative_humidity_2m_min,relative_humidity_2m_mean,wind_speed_10m_max'
    + '&hourly=uv_index&timezone=auto&forecast_days=1'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`weather ${res.status}`)
  const data = await res.json()
  const uvHours = data.hourly?.uv_index || []
  const peak = uvHours.reduce((best, uv, i) => (uv > uvHours[best] ? i : best), 0)
  return {
    uvMax: data.daily?.uv_index_max?.[0] ?? 0,
    uvPeakHour: peak,
    tempMax: data.daily?.temperature_2m_max?.[0] ?? 20,
    humidityMin: data.daily?.relative_humidity_2m_min?.[0] ?? 50,
    humidityMean: data.daily?.relative_humidity_2m_mean?.[0] ?? 50,
    windMax: data.daily?.wind_speed_10m_max?.[0] ?? 0,
  }
}

const cityOf = async ({ latitude, longitude }) => {
  try {
    const [place] = await Location.reverseGeocodeAsync({ latitude, longitude })
    return place?.city || place?.subregion || null
  } catch {
    return null
  }
}

// Today's weather for the user's rough position, fetched once a day.
export const getSkinWeather = async (coords) => {
  if (!coords?.latitude) return null
  const today = new Date().toDateString()
  const where = `${coords.latitude},${coords.longitude}`
  try {
    const cached = JSON.parse((await AsyncStorage.getItem(CACHE_KEY)) || 'null')
    if (cached?.day === today && cached?.where === where) return cached
  } catch {}
  const [weather, city] = await Promise.all([fetchWeather(coords), cityOf(coords)])
  const fresh = { day: today, where, weather, city }
  AsyncStorage.setItem(CACHE_KEY, JSON.stringify(fresh)).catch(() => {})
  return fresh
}
