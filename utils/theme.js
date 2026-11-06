import AsyncStorage from '@react-native-async-storage/async-storage'

// Palette Skynkod — built from the logo's dusty mauve (#C5A8BB). `bg`, `primary`, `secondary`, `text`, `muted`,
// `border` and `card` keep their original names so older screens still work.
export const LIGHT_COLORS = {
  bg: '#FBF8FA',
  surface: '#F4EEF2',
  card: '#FFFFFF',
  primary: '#8A6380',
  primarySoft: '#F1E8EE',
  secondary: '#5E3F56',
  accent: '#C5A8BB',
  text: '#1E1A1D',
  textSecondary: '#5E565C',
  muted: '#857C83',
  border: '#EDE5EA',
  onPrimary: '#FFFFFF',
  success: '#3E9A6D',
  successSoft: '#E3F3EA',
  warning: '#C98422',
  warningSoft: '#FBF0DE',
  caution: '#9C7F12',
  cautionSoft: '#FAF4D9',
  danger: '#CF4F57',
  dangerSoft: '#FBE7E8',
  overlay: 'rgba(30, 26, 29, 0.45)',
  shadow: '#4A3043',
  // The glossy universe (Lita, 2026-11-06): glass is the charter's white, a little
  // transparent; two pinks for the light of the sign-up (face zones, current step).
  glass: 'rgba(255,255,255,0.62)',
  glassLine: 'rgba(255,255,255,0.9)',
  glassOn: 'rgba(255,255,255,0.88)',
  glassIcon: 'rgba(255,255,255,0.75)',
  halo: '#F2A5C4',
  glow: '#E8AACD',
}

export const DARK_COLORS = {
  bg: '#151215',
  surface: '#1D191C',
  card: '#241F23',
  primary: '#D2B6C8',
  primarySoft: '#3A2D36',
  secondary: '#E8D6E1',
  accent: '#9C7A90',
  text: '#F6F1F4',
  textSecondary: '#C3B9C0',
  muted: '#8F868C',
  border: '#302830',
  onPrimary: '#1E1A1D',
  success: '#62C495',
  successSoft: '#1D3329',
  warning: '#E8AA4E',
  warningSoft: '#3A2D18',
  caution: '#E2C766',
  cautionSoft: '#363016',
  danger: '#EF7E85',
  dangerSoft: '#3D1F23',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
  glass: 'rgba(255,255,255,0.07)',
  glassLine: 'rgba(255,255,255,0.14)',
  glassOn: 'rgba(210,182,200,0.16)',
  glassIcon: 'rgba(255,255,255,0.08)',
  halo: '#F2A5C4',
  glow: '#E8AACD',
}

export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 28, xxxl: 40 }

export const RADIUS = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 }

export const TYPE = {
  display: { fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  heading: { fontSize: 20, fontWeight: '700', letterSpacing: -0.2 },
  subheading: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 15, fontWeight: '400', lineHeight: 22 },
  bodyStrong: { fontSize: 15, fontWeight: '600' },
  caption: { fontSize: 13, fontWeight: '500' },
  overline: { fontSize: 11, fontWeight: '700', letterSpacing: 1.1, textTransform: 'uppercase' },
}

export const getTheme = async () => {
  try {
    const saved = await AsyncStorage.getItem('theme_mode')
    if (saved) return saved

    const hour = new Date().getHours()
    const isDark = hour >= 20 || hour < 6

    return isDark ? 'dark' : 'light'
  } catch (error) {
    return 'light'
  }
}

export const setTheme = async (mode) => {
  try {
    await AsyncStorage.setItem('theme_mode', mode)
  } catch (error) {
    console.error('Set theme error:', error)
  }
}

export const getColors = (isDark) => {
  return isDark ? DARK_COLORS : LIGHT_COLORS
}

export const isNightTime = () => {
  const hour = new Date().getHours()
  return hour >= 20 || hour < 6
}

// For screens whose colours live outside React (Rekod, Dekod): the palette of
// the mode on screen right now. The ThemeProvider sets it; a screen that reads
// it also calls useTheme() so it redraws when day turns to night.
let liveDark = false
export const setLiveDark = (dark) => { liveDark = !!dark }
// The glossy colours of the mode on screen (glass, see-through background…), set by
// GlossyScope, so these screens share the glossy universe too (Lita, 2026-11-06).
let liveGlossy = null
export const setLiveGlossy = (colors) => { liveGlossy = colors }
// `extra`: { name: [light, dark] } for colours the main palette doesn't have.
export const livePalette = (extra = {}) => new Proxy({}, {
  get: (_, key) => (key in extra ? extra[key][liveDark ? 1 : 0] : liveGlossy && key in liveGlossy ? liveGlossy[key] : (liveDark ? DARK_COLORS : LIGHT_COLORS)[key]),
})
// StyleSheet built from livePalette, made once per mode.
export const liveStyles = (make) => {
  const made = {}
  return new Proxy({}, { get: (_, key) => (made[liveDark] = made[liveDark] || make())[key] })
}
