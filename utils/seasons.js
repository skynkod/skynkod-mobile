import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from './supabase'
import { getUserRoutines, saveRoutine } from './routines-service'

// Seasons on the official dates (northern hemisphere; swapped in the south):
// spring 20 March, summer 21 June, autumn 22 September, winter 21 December.
// At the start of each season Home shows a card with tips and offers a new
// routine for the season; the previous routine is kept in routine_archive.

export const SEASONS = {
  spring: {
    label: 'Spring', icon: 'flower-outline',
    title: 'Spring begins',
    tips: [
      'The sun gets stronger: back to SPF 30 or more every morning',
      'Pollen can irritate: a gentle cleanser in the evening',
      'A good time to start an exfoliant or retinol, slowly',
    ],
    daily: [
      'Spring sun is stronger than it feels: don’t skip SPF',
      'Lighter textures are welcome as it warms up',
      'Itchy, red skin? Pollen season: keep your routine gentle',
    ],
  },
  summer: {
    label: 'Summer', icon: 'sunny-outline',
    title: 'Summer begins',
    tips: [
      'SPF 50, reapplied every 2 hours outside',
      'Lighter textures: gel moisturizer, fluid sunscreen',
      'Go easy on retinol and acids, and never before the beach',
    ],
    daily: [
      'Beach or pool today? Reapply SPF after swimming',
      'Sweat and sunscreen: cleanse well every evening',
      'Dark spots love summer: SPF is your best treatment',
    ],
  },
  autumn: {
    label: 'Autumn', icon: 'leaf-outline',
    title: 'Autumn begins',
    tips: [
      'The best season to treat summer’s dark spots',
      'Bring back retinol or acids, slowly',
      'Start moving to a slightly richer moisturizer',
    ],
    daily: [
      'Summer spots fade best now: vitamin C, niacinamide, azelaic acid',
      'UV is still there in autumn: keep your SPF',
      'Skin feeling tight? Time for a richer cream',
    ],
  },
  winter: {
    label: 'Winter', icon: 'snow-outline',
    title: 'Winter begins',
    tips: [
      'A richer cream with ceramides',
      'Lukewarm water, never hot, on your face',
      'Fewer exfoliations, more hydration',
    ],
    daily: [
      'Cold and wind dry the skin: richer cream today',
      'Hot showers feel good but dry your skin: keep them lukewarm',
      'Lips and cheeks need extra care in winter',
    ],
  },
}

const ORDER = ['winter', 'spring', 'summer', 'autumn']

// Start of each season in a given year (month is 0-based).
const startsIn = year => [
  { id: 'spring', date: new Date(year, 2, 20) },
  { id: 'summer', date: new Date(year, 5, 21) },
  { id: 'autumn', date: new Date(year, 8, 22) },
  { id: 'winter', date: new Date(year, 11, 21) },
]

const flip = { spring: 'autumn', summer: 'winter', autumn: 'spring', winter: 'summer' }

// { id, startedAt } of the current season.
export const currentSeason = (now = new Date(), latitude = null) => {
  const starts = [...startsIn(now.getFullYear() - 1), ...startsIn(now.getFullYear())].filter(s => s.date <= now)
  const last = starts[starts.length - 1]
  const id = latitude !== null && latitude < 0 ? flip[last.id] : last.id
  return { id, startedAt: last.date }
}

export const previousSeason = id => ORDER[(ORDER.indexOf(id) + 3) % 4]

// A season tip for calm weather days, changing every day.
export const seasonDailyTip = (seasonId, now = new Date()) => {
  const season = SEASONS[seasonId]
  const day = Math.floor(now.getTime() / 86400000)
  return { icon: season.icon, text: season.daily[day % season.daily.length] }
}

// ---------- The new-season card on Home ----------

const CARD_DAYS = 7
const seenKey = (userId, seasonId, year) => `skynkod_season_seen_${userId}_${seasonId}_${year}`

// The card shows in the first week of a season, until the user answers.
export const shouldShowSeasonCard = async (userId, season, now = new Date()) => {
  if (!userId) return false
  if (now - season.startedAt > CARD_DAYS * 86400000) return false
  const seen = await AsyncStorage.getItem(seenKey(userId, season.id, season.startedAt.getFullYear())).catch(() => null)
  return !seen
}

export const dismissSeasonCard = (userId, season) =>
  AsyncStorage.setItem(seenKey(userId, season.id, season.startedAt.getFullYear()), '1').catch(() => {})

// The routines saved for this season last year, if any: { morning, evening }.
export const getArchivedRoutines = async (userId, seasonId) => {
  const { data, error } = await supabase
    .from('routine_archive')
    .select('type, steps, archived_at')
    .eq('user_id', userId)
    .eq('season', seasonId)
    .order('archived_at', { ascending: false })
  if (error) throw error
  const out = {}
  for (const row of data || []) if (!out[row.type]) out[row.type] = row.steps
  return out
}

// Keeps the current routines under the season that just ended.
export const archiveCurrentRoutines = async (userId, endingSeasonId) => {
  const res = await getUserRoutines(userId)
  const rows = (res.success ? res.data : [])
    .filter(r => Array.isArray(r.steps) && r.steps.length)
    .reduce((acc, r) => (acc.some(x => x.type === r.type) ? acc : [...acc, r]), [])
  if (!rows.length) return
  const { error } = await supabase.from('routine_archive').insert(
    rows.map(r => ({ user_id: userId, season: endingSeasonId, type: r.type, steps: r.steps })),
  )
  if (error) throw error
}

// Brings back last year's routines for this season (after archiving today's).
export const restoreSeasonRoutines = async (userId, season, archived) => {
  await archiveCurrentRoutines(userId, previousSeason(season.id))
  for (const type of ['morning', 'evening']) {
    if (archived[type]?.length) {
      const res = await saveRoutine(userId, type, archived[type])
      if (!res.success) throw new Error(res.error)
    }
  }
}
