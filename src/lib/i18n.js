import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from '../locales/en.json'
import fr from '../locales/fr.json'
import ar from '../locales/ar.json'
import arMA from '../locales/ar-MA.json'

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  ar: { translation: ar },
  'ar-MA': { translation: arMA },
}

export const RTL_LANGUAGES = ['ar', 'ar-MA']

export const applyDirection = (lng) => {
  const isRtl = RTL_LANGUAGES.includes(lng)
  const dir = isRtl ? 'rtl' : 'ltr'
  
  if (typeof document !== 'undefined') {
    document.documentElement.dir = dir
    document.documentElement.lang = lng
    if (document.body) {
      document.body.dir = dir
    }
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'fr', 'ar', 'ar-MA'],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'wh_language',
    },
  })

// Set initial direction based on detected or current language
applyDirection(i18n.language || 'en')

// Listen for language changes and update dir attribute dynamically
i18n.on('languageChanged', (lng) => {
  applyDirection(lng)
})

export default i18n
