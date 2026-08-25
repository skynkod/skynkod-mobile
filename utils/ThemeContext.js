import React, { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { DARK_COLORS, LIGHT_COLORS } from './theme'

const ThemeContext = createContext()

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeTheme()
  }, [])

  const initializeTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('skynkod_theme')
      if (saved) {
        setIsDark(JSON.parse(saved))
      } else {
        const isNight = checkIfNight()
        setIsDark(isNight)
      }
    } catch (error) {
      console.error('Initialize theme error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const interval = setInterval(() => {
      const isNight = checkIfNight()
      setIsDark(isNight)
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const checkIfNight = () => {
    const hour = new Date().getHours()
    return hour >= 20 || hour < 6
  }

  const toggleTheme = async () => {
    try {
      const newIsDark = !isDark
      setIsDark(newIsDark)
      await AsyncStorage.setItem('skynkod_theme', JSON.stringify(newIsDark))
    } catch (error) {
      console.error('Toggle theme error:', error)
    }
  }

  const colors = isDark ? DARK_COLORS : LIGHT_COLORS

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme, colors, loading }}>
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
