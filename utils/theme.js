import AsyncStorage from '@react-native-async-storage/async-storage'

export const LIGHT_COLORS = {
  bg: '#F7F1F5',
  primary: '#B283AC',
  secondary: '#7A3E76',
  text: '#14121A',
  muted: '#9B97A0',
  border: '#E8E1ED',
  card: '#FFFFFF',
}

export const DARK_COLORS = {
  bg: '#1A1620',
  primary: '#D4A5D4',
  secondary: '#A667A6',
  text: '#F5F1F8',
  muted: '#6B6773',
  border: '#2A2430',
  card: '#2F2935',
}

export const getTheme = async () => {
  try {
    const saved = await AsyncStorage.getItem('theme_mode')
    if (saved) return saved
    
    const hour = new Date().getHours()
    const isDark = hour >= 20 || hour <= 6
    
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
  return hour >= 20 || hour <= 6
}