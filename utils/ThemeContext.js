import React, { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DARK_COLORS, LIGHT_COLORS } from './theme'
import { logError } from './errorLogger'

const ThemeContext = createContext()
const STORAGE_KEY = 'skynkod_theme_mode'

const isNightTime = () => {
  const hour = new Date().getHours()
  return hour >= 20 || hour < 6
}

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeModeState] = useState('auto')
  const [nightNow, setNightNow] = useState(isNightTime())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY)
        if (saved === 'light' || saved === 'dark' || saved === 'auto') {
          setThemeModeState(saved)
        }
      } catch (error) {
        await logError('ThemeContext_load', error, {}, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Met à jour le mode nuit chaque minute (utilisé seulement en mode auto)
  useEffect(() => {
    const interval = setInterval(() => setNightNow(isNightTime()), 60000)
    return () => clearInterval(interval)
  }, [])

  const setThemeMode = async (mode) => {
    setThemeModeState(mode)
    try {
      await AsyncStorage.setItem(STORAGE_KEY, mode)
    } catch (error) {
      await logError('ThemeContext_setThemeMode', error, { mode }, 'error')
    }
  }

  const isDark = themeMode === 'dark' || (themeMode === 'auto' && nightNow)

  // Gardé pour les écrans qui utilisent encore toggleTheme
  const toggleTheme = () => setThemeMode(isDark ? 'light' : 'dark')

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  return (
    <ThemeContext.Provider value={{ isDark, themeMode, setThemeMode, toggleTheme, colors, loading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
