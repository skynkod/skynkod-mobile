// Sunrise and sunset for a place and day (NOAA's simplified solar equations,
// accurate to a couple of minutes), used to switch to night mode and the
// evening greeting when it actually gets dark.
const RAD = Math.PI / 180

export const sunTimes = (date, latitude, longitude) => {
  const dayStartUtc = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const dayOfYear = Math.floor((dayStartUtc - Date.UTC(date.getFullYear(), 0, 0)) / 86400000)
  const gamma = (2 * Math.PI / 365) * (dayOfYear - 1)
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
    - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma))
  const decl = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
    - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
    - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma)
  const cosH = Math.cos(90.833 * RAD) / (Math.cos(latitude * RAD) * Math.cos(decl)) - Math.tan(latitude * RAD) * Math.tan(decl)
  if (cosH > 1) return { polarNight: true }
  if (cosH < -1) return { polarDay: true }
  const hourAngle = Math.acos(cosH) / RAD
  const sunriseMinutes = 720 - 4 * (longitude + hourAngle) - eqTime
  const sunsetMinutes = 720 - 4 * (longitude - hourAngle) - eqTime
  return {
    sunrise: new Date(dayStartUtc + sunriseMinutes * 60000),
    sunset: new Date(dayStartUtc + sunsetMinutes * 60000),
  }
}

// Night between sunset and sunrise where we know the place; otherwise a
// fixed 7 pm – 7 am window.
export const isNightAt = (now = new Date(), coords = null) => {
  if (coords) {
    const times = sunTimes(now, coords.latitude, coords.longitude)
    if (times.polarNight) return true
    if (times.polarDay) return false
    return now < times.sunrise || now >= times.sunset
  }
  const hour = now.getHours()
  return hour >= 19 || hour < 7
}
