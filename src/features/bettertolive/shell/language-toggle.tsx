import { Globe } from "lucide-react"
import { useTranslation } from "react-i18next"

import { useLocaleStore } from "@/features/bettertolive/stores/locale-store"

export function LanguageToggle() {
  const { t } = useTranslation()
  const locale = useLocaleStore((s) => s.locale)
  const toggleLocale = useLocaleStore((s) => s.toggleLocale)

  return (
    <button
      type="button"
      data-testid="language-toggle"
      onClick={toggleLocale}
      aria-label={
        locale === "zh" ? t("shell.language.switchToEnglish") : t("shell.language.switchToChinese")
      }
      title={locale === "zh" ? t("shell.language.englishTitle") : t("shell.language.chineseTitle")}
      className="flex size-8 items-center justify-center rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text-primary)]"
    >
      <Globe className="size-4" />
    </button>
  )
}
