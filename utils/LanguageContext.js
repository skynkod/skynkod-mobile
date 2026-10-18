import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { getLocales } from 'expo-localization'
import { translate, SUPPORTED_LANGUAGES } from './i18n'
import { logError } from './errorLogger'

const LanguageContext = createContext()

// The phone's language if we support it, English otherwise.
const deviceLanguage = () => {
  try {
    const code = getLocales()[0]?.languageCode
    return SUPPORTED_LANGUAGES.includes(code) ? code : 'en'
  } catch {
    return 'en'
  }
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(deviceLanguage)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeLanguage()
  }, [])

  // A language picked in Settings wins over the phone's language.
  const initializeLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem('skynkod_language')
      setLanguage(SUPPORTED_LANGUAGES.includes(saved) ? saved : deviceLanguage())
    } catch (error) {
      await logError('LanguageContext_initializeLanguage', error, {}, 'error')
    } finally {
      setLoading(false)
    }
  }

  const setLanguageAsync = async (lang) => {
    try {
      setLanguage(lang)
      await AsyncStorage.setItem('skynkod_language', lang)
    } catch (error) {
      await logError('LanguageContext_setLanguage', error, { lang }, 'error')
    }
  }

  // Back to following the phone's language.
  const useDeviceLanguage = async () => {
    try {
      setLanguage(deviceLanguage())
      await AsyncStorage.removeItem('skynkod_language')
    } catch (error) {
      await logError('LanguageContext_useDeviceLanguage', error, {}, 'error')
    }
  }

  const t = (text, vars) => translate(language, text, vars)

  return (
    <LanguageContext.Provider value={{ language, setLanguage: setLanguageAsync, useDeviceLanguage, t, loading }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}

// Shortcut for screens that only need t().
export const useT = () => useLanguage().t
