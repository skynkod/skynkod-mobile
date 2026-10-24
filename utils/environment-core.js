// "Your environment changed" (Lita, 2026-10-24): when she is far from home in
// a clearly different climate, Home adapts the routine advice; back home, it
// says so. Home is learned on its own: where she spent most days in the last
// month. Pure functions, tested on their own.

export const AWAY_KM = 300
const NEAR_KM = 100
const MIN_HOME_DAYS = 7

export const distanceKm = (a, b) => {
  const R = 6371
  const rad = d => (d * Math.PI) / 180
  const dLat = rad(b.lat - a.lat)
  const dLon = rad(b.lon - a.lon)
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(x))
}

// samples: [{ date, lat, lon, tempMax, humidityMean, uvMax }], one per day.
// Home: the place with the most days, and its usual climate.
export const homeOf = (samples = []) => {
  let best = null
  for (const s of samples) {
    const near = samples.filter(o => distanceKm(s, o) <= NEAR_KM)
    if (!best || near.length > best.length) best = near
  }
  if (!best || best.length < MIN_HOME_DAYS) return null
  const avg = k => best.reduce((n, s) => n + (s[k] ?? 0), 0) / best.length
  return { lat: best[0].lat, lon: best[0].lon, tempMax: avg('tempMax'), humidityMean: avg('humidityMean'), uvMax: avg('uvMax'), days: best.length }
}

const ADVICE = {
  hotter: { label: 'hotter', morning: ['A lighter moisturizer (gel or lotion)', 'SPF 50, again every 2 hours outside'], evening: ['Cleanse well: sweat and sunscreen build up', 'Skip rich creams'] },
  humid: { label: 'more humid', morning: ['A lighter moisturizer (gel or lotion)'], evening: ['Skip rich creams'] },
  colder: { label: 'colder', morning: ['A richer moisturizer', 'A lip balm'], evening: ['Support your barrier (ceramides, panthenol)'] },
  dry: { label: 'drier', morning: ['A richer moisturizer', 'A lip balm'], evening: ['Support your barrier (ceramides, panthenol)', 'Fewer exfoliations while your skin adapts'] },
  sunnier: { label: 'sunnier', morning: ['SPF 50, again every 2 hours outside', 'A hat and sunglasses at midday'], evening: ['Space retinoids and acids: your skin burns more easily'] },
}

// How today's place differs from home: { changes: ['hotter', …], morning, evening } or null.
export const climateShift = (today, home) => {
  if (!today || !home) return null
  const changes = []
  if (today.tempMax - home.tempMax >= 6) changes.push('hotter')
  if (home.tempMax - today.tempMax >= 6) changes.push('colder')
  if (today.humidityMean - home.humidityMean >= 20) changes.push('humid')
  if (home.humidityMean - today.humidityMean >= 20) changes.push('dry')
  if (today.uvMax - home.uvMax >= 3) changes.push('sunnier')
  if (!changes.length) return null
  const pick = period => [...new Set(changes.flatMap(c => ADVICE[c][period]))].slice(0, 3)
  return { changes, labels: changes.map(c => ADVICE[c].label), morning: pick('morning'), evening: pick('evening') }
}

// What Home shows: { kind: 'away', ...shift } far from home in another
// climate, { kind: 'back' } on the first day back, or null.
export const environmentState = ({ samples = [], today, wasAway = false }) => {
  const home = homeOf(samples.filter(s => s.date !== today?.date))
  if (!home || !today) return null
  const far = distanceKm(today, home) > AWAY_KM
  if (far) {
    const shift = climateShift(today, home)
    return shift ? { kind: 'away', ...shift } : null
  }
  return wasAway && distanceKm(today, home) <= NEAR_KM ? { kind: 'back' } : null
}
