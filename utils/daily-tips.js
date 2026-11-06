// One small tip under the routine of the moment, a different one each day
// (Lita, 2026-10-25): water and sun by day, sleep and gentle habits at night.

export const DAY_TIPS = [
  'Drink a glass of water now. Your skin needs it too.',
  'Outside for a while? Reapply your SPF every 2 hours.',
  'SPF on your neck and ears too, not just your face.',
  'Keep a water bottle close and sip through the day.',
  'Sunglasses protect the thin skin around your eyes.',
  'Hands off your face: fewer germs, fewer breakouts.',
  'Clean your phone screen: it touches your cheek all day.',
]

export const EVENING_TIPS = [
  'Get enough sleep tonight: 7 to 9 hours helps your skin repair.',
  'Remove your sunscreen and makeup before bed, always.',
  'Change your pillowcase once a week.',
  'Screens off a little earlier tonight for better sleep.',
  'Don’t pick at spots before bed. Let them heal.',
  'A glass of water before bed, not a big one.',
  'Sleep on your back when you can: fewer creases on your face.',
]

// Where she gets breakouts (Lita, 2026-11-06): her own habits come back every other day.
const ZONE_TIPS = {
  day: { forehead: ['Breakouts on your forehead? Keep hair products and your fringe off your skin.'], cheeks: ['Clean your phone screen: it touches your cheek all day.'] },
  evening: { cheeks: ['Change your pillowcase once a week.'] },
}

const dayOfYear = (date) => Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000)

// `sleptHours`: last night, from her morning answer. A short night comes first in the evening.
// `zones`: where she gets breakouts, from her sign-up.
export const tipOfTheMoment = ({ period, date = new Date(), sleptHours = null, zones = [] }) => {
  if (period === 'evening' && sleptHours != null && sleptHours < 6) {
    return { text: 'You slept {n} h last night. Try to go to bed a little earlier tonight.', params: { n: sleptHours } }
  }
  const mine = [...new Set(zones.flatMap(z => ZONE_TIPS[period === 'evening' ? 'evening' : 'day'][z] || []))]
  if (mine.length && dayOfYear(date) % 2 === 0) return { text: mine[(dayOfYear(date) / 2) % mine.length], params: {} }
  const list = period === 'evening' ? EVENING_TIPS : DAY_TIPS
  return { text: list[dayOfYear(date) % list.length], params: {} }
}
