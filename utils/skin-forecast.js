// "Your skin forecast" on Home (inspired by Flo's predictions, Lita 2026-10-23):
// the next 3 days of skin weather, what her own journal says is coming, and
// her Rekod nights. Only facts: the weather forecast, patterns already found
// in her check-ins, and her plan. Nothing is guessed.

const PERSONAL_WINDOW = 1 // a factor logged today or yesterday

// The skin weather of one day, most important first. `level` ranks how much it
// matters (0 = calm).
export const forecastTip = (w, profile) => {
  if (!w) return null
  const type = profile?.skin_type
  const dryThreshold = type === 'Dry' || type === 'Sensitive' ? 40 : 30
  const t = Math.round(w.tempMax)
  const uv = Math.round(w.uvMax)
  const humid = w.humidityMean >= 60 && w.humidityMin > dryThreshold
  if (w.tempMax >= 30 && w.humidityMin <= 25 && w.windMax >= 25) return { id: 'hotwind', level: 5, icon: 'flag-outline', short: 'Hot wind', head: '{when}: hot, dry wind', advice: 'Protect your skin barrier: a richer cream, sunscreen, and no strong actives that evening.' }
  if (uv >= 8) return { id: 'uv', level: 4, icon: 'sunny-outline', short: 'UV {uv}', head: '{when}: very strong sun, UV {uv}', advice: 'SPF 50 in the morning, and reapply around {hour}.', params: { uv, hour: `${w.uvPeakHour}:00` } }
  if (w.humidityMin <= dryThreshold) return { id: 'dry', level: 4, icon: 'leaf-outline', short: 'Dry air', head: '{when}: very dry air', advice: 'Your skin may feel tight. Add a hydrating serum and a little more cream.' }
  if (w.tempMax >= 33 && humid) return { id: 'hothumid', level: 3, icon: 'water-outline', short: '{t}°', head: '{when}: {t}° and humid', advice: 'Light textures in the morning, and cleanse well in the evening.', params: { t } }
  if (w.tempMax >= 33) return { id: 'hot', level: 3, icon: 'thermometer-outline', short: '{t}°', head: '{when}: heat, up to {t}°', advice: 'Light textures, and reapply your sunscreen.', params: { t } }
  if (w.tempMax <= 10) return { id: 'cold', level: 3, icon: 'snow-outline', short: '{t}°', head: '{when}: cold, {t}° at most', advice: 'A richer cream, and protect your cheeks and lips.', params: { t } }
  if (type === 'Oily' && humid && w.humidityMean >= 70) return { id: 'humid', level: 2, icon: 'water-outline', short: 'Humid', head: '{when}: humid air', advice: 'A light gel moisturizer is enough.' }
  if (uv >= 5) return { id: 'uvmid', level: 2, icon: 'partly-sunny-outline', short: 'UV {uv}', head: '{when}: sunny, UV {uv}', advice: 'SPF 30 or more in the morning.', params: { uv } }
  return { id: 'calm', level: 0, icon: 'cloud-outline', short: 'Calm', head: '{when}: calm skin weather', advice: 'A good day to keep your two routines steady.' }
}

const dayKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate() + n); return d }

// What her journal says is coming: a pattern whose cause she logged today or
// yesterday (a short night, stress, sun…). Free users see the one pattern the
// journal shows them for free; Premium sees them all.
const FACTOR_NOTED = { sleep: 'a short night', stress: 'stress', period: 'your period', sun: 'time in the sun', product: 'a new product' }
const REACTION_SOON = {
  breakout: 'Breakouts often follow within 2 days.',
  redness: 'Redness often follows within 2 days.',
  dryness: 'Dryness often follows within 2 days.',
  rough: 'A rougher skin day often follows within 2 days.',
}
export const personalSignals = (patterns, { premium, today = new Date() } = {}) => {
  if (!patterns?.ready) return []
  const recent = new Set(Array.from({ length: PERSONAL_WINDOW + 1 }, (_, i) => dayKey(addDays(today, -i))))
  const list = premium ? patterns.patterns : patterns.patterns.slice(0, 1)
  return list
    .filter(p => !p.positive && FACTOR_NOTED[p.factor] && p.lastSeen && recent.has(p.lastSeen) && REACTION_SOON[p.reaction])
    .slice(0, 2)
    .map(p => ({ icon: p.icon, text: 'You noted {after} recently. {soon}', params: { after: FACTOR_NOTED[p.factor], soon: REACTION_SOON[p.reaction] } }))
}

// Her strong Rekod nights in the next 3 days.
export const rekodSignals = (plan, { nightOf, nights, today = new Date() }) => {
  if (!plan || !nightOf) return []
  const out = []
  for (let i = 0; i < 3; i += 1) {
    const date = addDays(today, i)
    const id = nightOf(plan, date)
    if (id === 'retinoid' || id === 'exfoliation') out.push({ icon: nights[id].icon, text: 'Rekod: {night} {when}.', params: { night: nights[id].label.toLowerCase() }, day: i })
  }
  return out.slice(0, 2)
}

// The whole card: 3 day tiles, the day that matters most first, and the signals.
export const buildForecast = ({ days, profile }) => {
  if (!days?.length) return null
  const tiles = days.slice(0, 3).map((w, i) => ({ index: i, date: w.date, tip: forecastTip(w, profile) }))
  // The day to talk about: the most important one, the soonest when equal.
  const focus = tiles.reduce((best, d) => (d.tip.level > best.tip.level ? d : best), tiles[0])
  return { tiles, focus: focus.index }
}

// Apple Health: her next period, from her own past cycles. With a breakout
// link already found in her journal, say so; otherwise a gentle general tip.
export const periodSignal = (next, patterns) => {
  if (!next || next.inDays > 3) return null
  const linked = (patterns?.patterns || []).some(p => p.factor === 'period' && p.reaction === 'breakout')
  const when = next.inDays === 0 ? 'today' : next.inDays === 1 ? 'tomorrow' : 'in about {n} days'
  return {
    icon: 'calendar-outline',
    text: linked ? `Your period is expected ${when}. Your skin often breaks out around then: keep your routine steady and skip new products.` : `Your period is expected ${when}. Many people get a few spots around then: keep your routine steady.`,
    params: { n: next.inDays },
  }
}
