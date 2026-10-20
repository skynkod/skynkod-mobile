import React, { createContext, useContext, useEffect, useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Location from 'expo-location'
import { DARK_COLORS, LIGHT_COLORS } from './theme'
import { isNightAt } from './daylight'
import { setSkinDayCoords } from './skin-day'
import { logError } from './errorLogger'

const ThemeContext = createContext()
const STORAGE_KEY = 'skynkod_theme_mode'
const LOCATION_KEY = 'skynkod_location'
const DAY_MS = 24 * 60 * 60 * 1000

export const ThemeProvider = ({ children }) => {
  const [themeMode, setThemeModeState] = useState('auto')
  // Rough position (about 10 km), only to know when the sun rises and sets.
  const [coords, setCoords] = useState(null)
  const [nightNow, setNightNow] = useState(isNightAt())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [saved, place] = await Promise.all([AsyncStorage.getItem(STORAGE_KEY), AsyncStorage.getItem(LOCATION_KEY)])
        if (saved === 'light' || saved === 'dark' || saved === 'auto') {
          setThemeModeState(saved)
        }
        if (place) {
          const parsed = JSON.parse(place)
          setCoords(parsed)
          setNightNow(isNightAt(new Date(), parsed))
        }
      } catch (error) {
        await logError('ThemeContext_load', error, {}, 'error')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Re-checks day/night every minute; also drives the Home greeting.
  useEffect(() => {
    setSkinDayCoords(coords)
    setNightNow(isNightAt(new Date(), coords))
    const interval = setInterval(() => setNightNow(isNightAt(new Date(), coords)), 60000)
    return () => clearInterval(interval)
  }, [coords])

  // Asks once for location (screens call this once the user is in the app,
  // not on the login screen) and refreshes it at most once a day. Without
  // permission we keep the fixed 7 pm – 7 am window.
  const updateLocation = async () => {
    try {
      if (coords?.savedAt && Date.now() - coords.savedAt < DAY_MS) return
      const permission = await Location.getForegroundPermissionsAsync()
      let granted = permission.granted
      if (!granted && permission.canAskAgain) {
        granted = (await Location.requestForegroundPermissionsAsync()).granted
      }
      if (!granted) return
      const position =
        (await Location.getLastKnownPositionAsync()) ||
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Lowest }))
      if (!position) return
      const place = {
        latitude: Math.round(position.coords.latitude * 10) / 10,
        longitude: Math.round(position.coords.longitude * 10) / 10,
        savedAt: Date.now(),
      }
      setCoords(place)
      await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(place))
    } catch (error) {
      await logError('ThemeContext_updateLocation', error, {}, 'warn')
    }
  }

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
    <ThemeContext.Provider value={{ isDark, isNight: nightNow, coords, updateLocation, themeMode, setThemeMode, toggleTheme, colors, loading }}>
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
