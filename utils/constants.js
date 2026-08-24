import { DARK_COLORS, LIGHT_COLORS } from './theme'

export const getSkynkodColors = (isDark = false) => {
  return isDark ? DARK_COLORS : LIGHT_COLORS
}

export const SKYNKOD_COLORS = LIGHT_COLORS

export const SKIN_CONDITIONS = [
  'Acne',
  'Dryness',
  'Oiliness',
  'Redness',
  'Sensitivity',
  'Hyperpigmentation',
  'Fine Lines',
  'Texture',
]

export const MOODS = ['Poor', 'Okay', 'Good', 'Great']