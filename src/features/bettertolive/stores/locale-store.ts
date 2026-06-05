import { create } from "zustand"
import { useTranslation } from "react-i18next"
import { useEffect } from "react"
import type { SupportedLocale } from "@/i18n/config"
import { readPersistedLocale, persistLocale } from "@/i18n/config"

type LocaleState = {
  locale: SupportedLocale
  setLocale: (locale: SupportedLocale) => void
  toggleLocale: () => void
}

export const useLocaleStore = create<LocaleState>((set) => ({
  locale: readPersistedLocale(),
  setLocale: (locale) => {
    persistLocale(locale)
    set({ locale })
  },
  toggleLocale: () =>
    set((state) => {
      const next = state.locale === "zh" ? "en" : "zh"
      persistLocale(next)
      return { locale: next }
    }),
}))

/**
 * Hook that syncs the zustand locale store with i18next's language.
 * Call this once at app root level.
 */
export function useSyncLocaleToI18n() {
  const { i18n } = useTranslation()
  const locale = useLocaleStore((s) => s.locale)

  useEffect(() => {
    if (i18n.language !== locale) {
      void i18n.changeLanguage(locale)
    }
  }, [i18n, locale])
}
