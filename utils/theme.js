import AsyncStorage from '@react-native-async-storage/async-storage'

// Palette Skynkod — prune / mauve. `bg`, `primary`, `secondary`, `text`, `muted`,
// `border` and `card` keep their original names so older screens still work.
export const LIGHT_COLORS = {
  bg: '#FAF7FB',
  surface: '#F3ECF5',
  card: '#FFFFFF',
  primary: '#9A5C96',
  primarySoft: '#F2E7F2',
  secondary: '#6B3367',
  accent: '#E8B4C8',
  text: '#1C1720',
  textSecondary: '#5F5867',
  muted: '#8F8897',
  border: '#ECE3EE',
  onPrimary: '#FFFFFF',
  success: '#3E9A6D',
  successSoft: '#E3F3EA',
  warning: '#C98422',
  warningSoft: '#FBF0DE',
  danger: '#CF4F57',
  dangerSoft: '#FBE7E8',
  overlay: 'rgba(28, 23, 32, 0.45)',
  shadow: '#5B2A57',
}

export const DARK_COLORS = {
  bg: '#141117',
  surface: '#1C1820',
  card: '#221D27',
  primary: '#D1A6CD',
  primarySoft: '#3A2A3A',
  secondary: '#E6C3E2',
  accent: '#8E4E6C',
  text: '#F5F0F7',
  textSecondary: '#C0B7C6',
  muted: '#8E8595',
  border: '#2F2834',
  onPrimary: '#1C1720',
  success: '#62C495',
  successSoft: '#1D3329',
  warning: '#E8AA4E',
  warningSoft: '#3A2D18',
  danger: '#EF7E85',
  dangerSoft: '#3D1F23',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
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
