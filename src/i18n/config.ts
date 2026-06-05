import i18next from "i18next"
import { initReactI18next } from "react-i18next"

import en from "./locales/en.json"
import zh from "./locales/zh.json"

const LOCALE_STORAGE_KEY = "bettertolive.locale"

export type SupportedLocale = "zh" | "en"

export function readPersistedLocale(): SupportedLocale {
  if (typeof window === "undefined") return "zh"
  const raw = window.localStorage.getItem(LOCALE_STORAGE_KEY)
  if (raw === "zh" || raw === "en") return raw
  return "zh"
}

export function persistLocale(locale: SupportedLocale) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
}

const initialLocale = readPersistedLocale()

void i18next.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
  },
  lng: initialLocale,
  fallbackLng: "zh",
  interpolation: {
    escapeValue: false,
  },
})

export default i18next
