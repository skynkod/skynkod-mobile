import AsyncStorage from '@react-native-async-storage/async-storage'
import React, { createContext, useEffect, useState } from 'react'
import { getColors, getTheme, isNightTime, setTheme } from './theme'

export const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeTheme()
    const interval = setInterval(checkAutoTheme, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  const initializeTheme = async () => {
    try {
      const mode = await getTheme()
      setIsDark(mode === 'dark')
    } catch (error) {
      console.error('Initialize theme error:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkAutoTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('theme_mode')
      if (saved === 'auto') {
        const shouldBeDark = isNightTime()
        setIsDark(shouldBeDark)
      }
    } catch (error) {
      console.error('Check auto theme error:', error)
    }
  }

  const toggleTheme = async () => {
    const newMode = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    await setTheme(newMode)
  }

  const setAutoTheme = async () => {
    await setTheme('auto')
    const shouldBeDark = isNightTime()
    setIsDark(shouldBeDark)
  }

  const colors = getColors(isDark)

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, setAutoTheme, colors, loading }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = React.useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}