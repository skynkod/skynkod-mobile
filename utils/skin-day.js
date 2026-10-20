import { sunTimes } from './daylight'

// A skin day runs from one sunrise to the next (5 am when we don't know the
// place), so a routine or check-in done at 1 am still counts for last night.
let lastCoords = null
export const setSkinDayCoords = coords => { lastCoords = coords || null }

export const sunriseOn = (date, coords = lastCoords) => {
  if (coords) {
    const times = sunTimes(date, coords.latitude, coords.longitude)
    if (times.sunrise) return times.sunrise
  }
  const d = new Date(date)
  d.setHours(5, 0, 0, 0)
  return d
}

// The calendar date this moment belongs to.
export const skinDay = (now = new Date(), coords = lastCoords) => {
  if (now >= sunriseOn(now, coords)) return now
  const d = new Date(now)
  d.setDate(d.getDate() - 1)
  return d
}

// 'YYYY-MM-DD' of the current skin day (local time).
export const skinDayKey = (now = new Date()) => {
  const d = skinDay(now)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
