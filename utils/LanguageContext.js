import React, { createContext, useEffect, useState } from 'react'
import { getLanguage, getLanguages, setLanguage, t } from './i18n'

export const LanguageContext = createContext()

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState('en')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    initializeLanguage()
  }, [])

  const initializeLanguage = async () => {
    try {
      const lang = await getLanguage()
      setLanguageState(lang)
    } catch (error) {
      console.error('Initialize language error:', error)
    } finally {
      setLoading(false)
    }
  }

  const changeLanguage = async (lang) => {
    setLanguageState(lang)
    await setLanguage(lang)
  }

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t: (key) => t(key, language), languages: getLanguages(), loading }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => {
  const context = React.useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}