import { getLocales } from 'expo-localization'

// Ramadan: on automatically in Arab and Muslim-majority countries. Nothing in
// the app changes; it just gives more tips during the month, and the evening
// reminder also says to rehydrate.

// Arab League and Muslim-majority countries (ISO region codes).
const COUNTRIES = new Set([
  'MA', 'DZ', 'TN', 'LY', 'EG', 'SD', 'MR', 'SA', 'AE', 'QA', 'KW', 'BH', 'OM', 'YE', 'JO', 'LB', 'SY', 'IQ', 'PS',
  'DJ', 'SO', 'KM', 'TR', 'IR', 'PK', 'AF', 'BD', 'ID', 'MY', 'BN', 'MV', 'SN', 'ML', 'NE', 'GN', 'GM', 'TD',
  'AZ', 'UZ', 'TJ', 'KG', 'TM', 'KZ', 'AL', 'XK',
])

// First and last day of Ramadan (expected dates; the real start can move by a
// day with the moon sighting, which is fine for tips).
const DATES = [
  ['2026-02-18', '2026-03-19'],
  ['2027-02-08', '2027-03-09'],
  ['2028-01-28', '2028-02-26'],
  ['2029-01-16', '2029-02-14'],
  ['2030-01-06', '2030-02-04'],
  ['2030-12-26', '2031-01-24'],
  ['2031-12-15', '2032-01-13'],
  ['2032-12-04', '2033-01-02'],
  ['2033-11-23', '2033-12-22'],
  ['2034-11-12', '2034-12-11'],
  ['2035-11-01', '2035-11-30'],
]

const dayKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export const inRamadanCountry = () => COUNTRIES.has(getLocales()[0]?.regionCode || '')

// The day of Ramadan (1–30) for this user today, or null.
export const ramadanDay = (now = new Date()) => {
  if (!inRamadanCountry()) return null
  const today = dayKey(now)
  const period = DATES.find(([start, end]) => today >= start && today <= end)
  if (!period) return null
  const [y, m, d] = period[0].split('-').map(Number)
  return Math.floor((new Date(now.getFullYear(), now.getMonth(), now.getDate()) - new Date(y, m - 1, d)) / 86400000) + 1
}

// While fasting (daytime) and after iftar (evening): one tip per day.
const DAY_TIPS = [
  'Fasting dries the skin: skip harsh cleansers and exfoliants this month',
  'A richer moisturizer helps your skin hold water while you fast',
  'Stay in the shade at midday: fasting skin is more sensitive to the sun',
  'Keep your routine short and gentle during Ramadan',
  'Lips dry fast while fasting: a balm in the morning helps',
]
const EVENING_TIPS = [
  'After iftar, drink water little by little until suhoor',
  'Water-rich foods help your skin: soup, fruit, vegetables',
  'Go easy on salty and fried food tonight: your skin will thank you',
  'Late nights in Ramadan: a hydrating mask before bed helps',
  'Your evening routine is your skin’s best moment this month',
]

export const ramadanTip = (day, evening) => {
  const list = evening ? EVENING_TIPS : DAY_TIPS
  return { icon: 'moon-outline', text: list[(day - 1) % list.length] }
}
