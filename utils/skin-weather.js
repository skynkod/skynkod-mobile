import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Location from 'expo-location'

// "Skin weather": today's local weather (Open-Meteo, free, no key) turned
// into the one skincare tip that matters most today, shown on Home.

const CACHE_KEY = 'skynkod_skin_weather'

// The day's skin tips from the weather, most important first (at most 3).
// `profile` adapts the thresholds (dry skin hears about dry air sooner, oily
// about humidity). A calm day gives an empty list.
export const pickSkinTips = (w, profile, city) => {
  if (!w) return []
  const type = profile?.skin_type
  const dryThreshold = type === 'Dry' || type === 'Sensitive' ? 40 : 30
  const at = city ? ` in ${city}` : ''
  const hour = h => `${h}:00`
  const tips = []

  // Chergui: hot, dry, windy.
  const chergui = w.tempMax >= 30 && w.humidityMin <= 25 && w.windMax >= 25
  if (chergui) tips.push({ icon: 'flag-outline', text: 'Chergui today · Hot, dry wind: protect your skin barrier' })
  if (w.uvMax >= 8) tips.push({ icon: 'sunny-outline', text: `UV up to ${Math.round(w.uvMax)} today${at} · Reapply sunscreen around ${hour(w.uvPeakHour)}` })
  if (!chergui && w.humidityMin <= dryThreshold) tips.push({ icon: 'leaf-outline', text: 'Very dry air today · Your skin will be thirsty, add a hydrating serum' })
  // Humid only when the air isn't also dry at some point of the day.
  const humid = w.humidityMean >= 60 && w.humidityMin > dryThreshold
  if (w.tempMax >= 33 && humid) tips.push({ icon: 'water-outline', text: `${Math.round(w.tempMax)}° and humid · Light cream, and cleanse well tonight` })
  else if (w.tempMax >= 33) tips.push({ icon: 'thermometer-outline', text: `${Math.round(w.tempMax)}°${at} · Light textures, and reapply your SPF` })
  if (w.tempMax <= 10) tips.push({ icon: 'snow-outline', text: `Cold day · ${Math.round(w.tempMax)}° · Richer cream, protect your cheeks and lips` })
  if (type === 'Oily' && humid && w.humidityMean >= 70 && w.tempMax < 33) tips.push({ icon: 'water-outline', text: 'Humid day · A light gel moisturizer is enough' })
  if (w.uvMax >= 5 && w.uvMax < 8) tips.push({ icon: 'partly-sunny-outline', text: `UV up to ${Math.round(w.uvMax)} today${at} · SPF 30 or more this morning` })
  return tips.slice(0, 3)
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

// ---------- The weather right now (refreshed every 30 minutes) ----------

const NOW_KEY = 'skynkod_weather_now'

// WMO weather codes → a short label and an icon (day / night).
const SKY = [
  [[0], 'Clear', 'sunny-outline', 'moon-outline'],
  [[1, 2], 'Partly cloudy', 'partly-sunny-outline', 'cloudy-night-outline'],
  [[3], 'Cloudy', 'cloud-outline', 'cloud-outline'],
  [[45, 48], 'Foggy', 'cloud-outline', 'cloud-outline'],
  [[51, 53, 55, 56, 57], 'Drizzle', 'rainy-outline', 'rainy-outline'],
  [[61, 63, 65, 66, 67, 80, 81, 82], 'Rain', 'rainy-outline', 'rainy-outline'],
  [[71, 73, 75, 77, 85, 86], 'Snow', 'snow-outline', 'snow-outline'],
  [[95, 96, 99], 'Storm', 'thunderstorm-outline', 'thunderstorm-outline'],
]
const skyOf = (code, isDay) => {
  const row = SKY.find(([codes]) => codes.includes(code)) || SKY[2]
  return { label: row[1], icon: isDay ? row[2] : row[3] }
}

export const getWeatherNow = async (coords) => {
  if (!coords?.latitude) return null
  const where = `${coords.latitude},${coords.longitude}`
  try {
    const cached = JSON.parse((await AsyncStorage.getItem(NOW_KEY)) || 'null')
    if (cached?.where === where && Date.now() - cached.at < 30 * 60000) return cached
  } catch {}
  const res = await fetch('https://api.open-meteo.com/v1/forecast'
    + `?latitude=${coords.latitude}&longitude=${coords.longitude}`
    + '&current=temperature_2m,relative_humidity_2m,weather_code,uv_index,is_day&timezone=auto')
  if (!res.ok) throw new Error(`weather ${res.status}`)
  const c = (await res.json()).current || {}
  const sky = skyOf(c.weather_code, c.is_day !== 0)
  const fresh = {
    where,
    at: Date.now(),
    temp: Math.round(c.temperature_2m ?? 0),
    humidity: Math.round(c.relative_humidity_2m ?? 0),
    uv: Math.round(c.uv_index ?? 0),
    isDay: c.is_day !== 0,
    ...sky,
  }
  AsyncStorage.setItem(NOW_KEY, JSON.stringify(fresh)).catch(() => {})
  return fresh
}

// ---------- The 3-day skin forecast (today and the next two days) ----------

const FORECAST_KEY = 'skynkod_skin_forecast'

export const getForecastWeather = async (coords) => {
  if (!coords?.latitude) return null
  const today = new Date().toDateString()
  const where = `${coords.latitude},${coords.longitude}`
  try {
    const cached = JSON.parse((await AsyncStorage.getItem(FORECAST_KEY)) || 'null')
    if (cached?.day === today && cached?.where === where) return cached.days
  } catch {}
  const res = await fetch('https://api.open-meteo.com/v1/forecast'
    + `?latitude=${coords.latitude}&longitude=${coords.longitude}`
    + '&daily=uv_index_max,temperature_2m_max,relative_humidity_2m_min,relative_humidity_2m_mean,wind_speed_10m_max'
    + '&hourly=uv_index&timezone=auto&forecast_days=3')
  if (!res.ok) throw new Error(`forecast ${res.status}`)
  const data = await res.json()
  const d = data.daily || {}
  const uvHours = data.hourly?.uv_index || []
  const days = (d.time || []).slice(0, 3).map((date, i) => {
    const hours = uvHours.slice(i * 24, i * 24 + 24)
    const peak = hours.reduce((best, uv, h) => (uv > hours[best] ? h : best), 0)
    return {
      date,
      uvMax: d.uv_index_max?.[i] ?? 0,
      uvPeakHour: peak,
      tempMax: d.temperature_2m_max?.[i] ?? 20,
      humidityMin: d.relative_humidity_2m_min?.[i] ?? 50,
      humidityMean: d.relative_humidity_2m_mean?.[i] ?? 50,
      windMax: d.wind_speed_10m_max?.[i] ?? 0,
    }
  })
  AsyncStorage.setItem(FORECAST_KEY, JSON.stringify({ day: today, where, days })).catch(() => {})
  return days
}
