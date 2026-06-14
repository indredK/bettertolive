import { Check, ExternalLink, GitFork, Globe, Palette, RefreshCw, Sparkles } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import type { WorkspaceTheme, WorkspaceThemeId } from "@/features/bettertolive/config/theme-presets"
import { useLocaleStore } from "@/features/bettertolive/stores/locale-store"
import { cn } from "@/lib/utils"

const APP_VERSION = "0.1.0"
const GITHUB_URL = "https://github.com/indredK/bettertolive"

type SettingsTab = "about" | "preferences"

function AboutTab() {
  const { t } = useTranslation()
  const [updateState, setUpdateState] = useState<"idle" | "checking" | "done">("idle")

  function handleCheckUpdates() {
    setUpdateState("checking")
    setTimeout(() => setUpdateState("done"), 1500)
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3.5">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[color:var(--text-primary)] text-[color:var(--hero-ink)]">
          <Sparkles className="size-6" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[color:var(--text-primary)]">BetterToLive</h3>
          <p className="text-xs text-[color:var(--text-muted)]">
            {t("shell.settings.about.description")}
          </p>
        </div>
      </div>

      <div className="space-y-2 rounded-xl border border-[color:var(--chip-border)] bg-white/60 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[color:var(--text-muted)]">
            {t("shell.settings.about.version")}
          </span>
          <span className="font-mono text-sm font-medium text-[color:var(--text-primary)]">
            v{APP_VERSION}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-[color:var(--text-muted)]">
            {t("shell.settings.about.license")}
          </span>
          <span className="text-sm text-[color:var(--text-primary)]">MIT</span>
        </div>
      </div>

      <div className="space-y-2">
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "w-full justify-start gap-2 border-[color:var(--chip-border)] bg-white/80 text-[color:var(--text-primary)] hover:bg-white",
            updateState === "done" && "border-emerald-200 bg-emerald-50 text-emerald-700",
          )}
          onClick={handleCheckUpdates}
          disabled={updateState === "checking"}
        >
          {updateState === "done" ? (
            <>
              <Check className="size-4 text-emerald-600" />
              {t("shell.settings.about.upToDate")}
            </>
          ) : (
            <>
              <RefreshCw className={cn("size-4", updateState === "checking" && "animate-spin")} />
              {updateState === "checking"
                ? t("shell.settings.about.checkingUpdates")
                : t("shell.settings.about.checkUpdates")}
            </>
          )}
        </Button>

        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-[color:var(--chip-border)] bg-white/80 px-3 py-2 text-sm text-[color:var(--text-primary)] transition hover:bg-white"
        >
          <span className="flex items-center gap-2">
            <GitFork className="size-4" />
            {t("shell.settings.about.github")}
          </span>
          <ExternalLink className="size-3.5 text-[color:var(--text-muted)]" />
        </a>
      </div>

      <p className="text-center text-xs text-[color:var(--text-muted)]">
        {t("shell.settings.about.copyright")}
      </p>
    </div>
  )
}

function PreferencesTab({
  themeId,
  themes,
  onSelectTheme,
}: {
  themeId: WorkspaceThemeId
  themes: WorkspaceTheme[]
  onSelectTheme: (id: WorkspaceThemeId) => void
}) {
  const { t } = useTranslation()
  const locale = useLocaleStore((state) => state.locale)
  const setLocale = useLocaleStore((state) => state.setLocale)

  return (
    <div className="space-y-5">
      <section>
        <div className="mb-2.5 flex items-center gap-2">
          <Globe className="size-3.5 text-[color:var(--text-muted)]" />
          <span className="text-xs font-medium tracking-wide text-[color:var(--text-muted)] uppercase">
            {t("shell.settings.preferences.language.title")}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(["zh", "en"] as const).map((lang) => {
            const isActive = locale === lang
            return (
              <button
                key={lang}
                type="button"
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-left text-sm transition",
                  isActive
                    ? "border-[color:var(--nav-active-border)] bg-white font-medium text-[color:var(--text-primary)]"
                    : "border-[color:var(--chip-border)] bg-white/60 text-[color:var(--text-muted)] hover:bg-white",
                )}
                onClick={() => setLocale(lang)}
              >
                <div className="flex items-center justify-between">
                  <span>
                    {lang === "zh"
                      ? t("shell.language.chineseTitle")
                      : t("shell.language.englishTitle")}
                  </span>
                  {isActive && <Check className="size-3.5 text-emerald-600" />}
                </div>
              </button>
            )
          })}
        </div>
      </section>

      <section>
        <div className="mb-2.5 flex items-center gap-2">
          <Palette className="size-3.5 text-[color:var(--text-muted)]" />
          <span className="text-xs font-medium tracking-wide text-[color:var(--text-muted)] uppercase">
            {t("shell.settings.preferences.appearance.title")}
          </span>
        </div>
        <div className="space-y-1.5">
          {themes.map((item) => {
            const isActive = item.id === themeId
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left transition",
                  isActive
                    ? "border-[color:var(--nav-active-border)] bg-white"
                    : "border-[color:var(--chip-border)] bg-white/60 hover:bg-white",
                )}
                onClick={() => onSelectTheme(item.id)}
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1">
                    {item.swatches.slice(0, 3).map((swatch) => (
                      <span
                        key={swatch}
                        className="size-2.5 rounded-full border border-white/80 shadow-sm"
                        style={{ backgroundColor: swatch }}
                      />
                    ))}
                  </div>
                  <span
                    className={cn(
                      "text-sm",
                      isActive
                        ? "font-medium text-[color:var(--text-primary)]"
                        : "text-[color:var(--text-muted)]",
                    )}
                  >
                    {t(`shell.themes.options.${item.id}.label`, item.label)}
                  </span>
                </div>
                {isActive && <Check className="size-3.5 shrink-0 text-emerald-600" />}
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}

export function SettingsDialog({
  open,
  onOpenChange,
  themeId,
  themes,
  onSelectTheme,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  themeId: WorkspaceThemeId
  themes: WorkspaceTheme[]
  onSelectTheme: (id: WorkspaceThemeId) => void
}) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<SettingsTab>("about")

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[620px] overflow-hidden p-0 sm:max-w-[620px]"
        style={{ maxHeight: "80vh" }}
      >
        <div className="flex" style={{ minHeight: "420px" }}>
          <div className="flex w-[176px] shrink-0 flex-col gap-1 border-r border-[color:var(--surface-border)] bg-[color:var(--aside-bg)] p-4 pt-12">
            <DialogTitle className="sr-only">{t("shell.settings.title")}</DialogTitle>
            {(["about", "preferences"] as SettingsTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                className={cn(
                  "rounded-lg px-3 py-2 text-left text-sm transition",
                  activeTab === tab
                    ? "bg-white font-medium text-[color:var(--text-primary)] shadow-sm"
                    : "text-[color:var(--text-muted)] hover:bg-white/60 hover:text-[color:var(--text-primary)]",
                )}
                onClick={() => setActiveTab(tab)}
              >
                {t(`shell.settings.tabs.${tab}`)}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-6 pt-10">
            {activeTab === "about" && <AboutTab />}
            {activeTab === "preferences" && (
              <PreferencesTab themeId={themeId} themes={themes} onSelectTheme={onSelectTheme} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
