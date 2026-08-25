import React, { createContext, useContext, useState, useEffect } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { translations } from './i18n'
import { logError } from './errorLogger'

const LanguageContext = createContext()

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeLanguage()
  }, [])

  const initializeLanguage = async () => {
    try {
      const saved = await AsyncStorage.getItem('skynkod_language')
      if (saved) {
        setLanguage(saved)
      } else {
        setLanguage('en')
      }
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

  const t = (key) => {
    return translations[language]?.[key] || key
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: setLanguageAsync, t, loading }}>
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
