import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import fa from './locales/fa.json'

export const LANGUAGE_KEY = 'orix-school-admin-language'

export function applyDocumentLanguage(language: string) {
  const lang = language.startsWith('en') ? 'en' : 'fa'
  const dir = lang === 'fa' ? 'rtl' : 'ltr'
  document.documentElement.lang = lang
  document.documentElement.dir = dir
  document.title = lang === 'fa' ? 'پنل مدیریت | Orix School' : 'Admin | Orix School'
}

export async function initI18n() {
  const stored = localStorage.getItem(LANGUAGE_KEY)
  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        fa: { translation: fa },
        en: { translation: en },
      },
      lng: stored === 'en' || stored === 'fa' ? stored : 'fa',
      fallbackLng: 'fa',
      supportedLngs: ['fa', 'en'],
      interpolation: { escapeValue: false },
      detection: {
        order: ['localStorage'],
        lookupLocalStorage: LANGUAGE_KEY,
        caches: ['localStorage'],
      },
    })
  applyDocumentLanguage(i18n.language)
  i18n.on('languageChanged', applyDocumentLanguage)
  return i18n
}

export default i18n
