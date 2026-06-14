import i18next from "i18next"
import { initReactI18next } from "react-i18next"

import enCommon from "./locales/en/common.json"
import enShopping from "./locales/en/shopping.json"
import enBeliefs from "./locales/en/beliefs.json"
import enRelationships from "./locales/en/relationships.json"
import enNutrition from "./locales/en/nutrition.json"
import enOverview from "./locales/en/overview.json"
import enReflection from "./locales/en/reflection.json"
import enEvents from "./locales/en/events.json"
import enFinance from "./locales/en/finance.json"
import enJourney from "./locales/en/journey.json"
import enSocioeconomics from "./locales/en/socioeconomics.json"
import enEmotion from "./locales/en/emotion.json"
import enFuture from "./locales/en/future.json"
import enLegacy from "./locales/en/legacy.json"
import enShell from "./locales/en/shell.json"
import enKnowledgeTabs from "./locales/en/knowledgeTabs.json"
import enPrinciples from "./locales/en/principles.json"
import enWorldhistory from "./locales/en/worldhistory.json"
import enSplash from "./locales/en/splash.json"

import zhCommon from "./locales/zh/common.json"
import zhShopping from "./locales/zh/shopping.json"
import zhBeliefs from "./locales/zh/beliefs.json"
import zhRelationships from "./locales/zh/relationships.json"
import zhNutrition from "./locales/zh/nutrition.json"
import zhOverview from "./locales/zh/overview.json"
import zhReflection from "./locales/zh/reflection.json"
import zhEvents from "./locales/zh/events.json"
import zhFinance from "./locales/zh/finance.json"
import zhJourney from "./locales/zh/journey.json"
import zhSocioeconomics from "./locales/zh/socioeconomics.json"
import zhEmotion from "./locales/zh/emotion.json"
import zhFuture from "./locales/zh/future.json"
import zhLegacy from "./locales/zh/legacy.json"
import zhShell from "./locales/zh/shell.json"
import zhKnowledgeTabs from "./locales/zh/knowledgeTabs.json"
import zhPrinciples from "./locales/zh/principles.json"
import zhWorldhistory from "./locales/zh/worldhistory.json"
import zhSplash from "./locales/zh/splash.json"

const en = {
  common: enCommon,
  shopping: enShopping,
  beliefs: enBeliefs,
  relationships: enRelationships,
  nutrition: enNutrition,
  overview: enOverview,
  reflection: enReflection,
  events: enEvents,
  finance: enFinance,
  journey: enJourney,
  socioeconomics: enSocioeconomics,
  emotion: enEmotion,
  future: enFuture,
  legacy: enLegacy,
  shell: enShell,
  knowledgeTabs: enKnowledgeTabs,
  principles: enPrinciples,
  worldhistory: enWorldhistory,
  splash: enSplash,
}

const zh = {
  common: zhCommon,
  shopping: zhShopping,
  beliefs: zhBeliefs,
  relationships: zhRelationships,
  nutrition: zhNutrition,
  overview: zhOverview,
  reflection: zhReflection,
  events: zhEvents,
  finance: zhFinance,
  journey: zhJourney,
  socioeconomics: zhSocioeconomics,
  emotion: zhEmotion,
  future: zhFuture,
  legacy: zhLegacy,
  shell: zhShell,
  knowledgeTabs: zhKnowledgeTabs,
  principles: zhPrinciples,
  worldhistory: zhWorldhistory,
  splash: zhSplash,
}

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
