// src/i18n/index.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation resources
import en from './locales/en.json';
import am from './locales/am.json';

const resources = {
  en: {
    translation: en
  },
  am: {
    translation: am
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: ['en', 'am'],
    
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'ui.lang',
      caches: ['localStorage']
    },

    interpolation: {
      escapeValue: false // React already does escaping
    },

    react: {
      useSuspense: false // Avoid suspense for better UX
    }
  });

export default i18n;