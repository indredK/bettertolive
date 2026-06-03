import { Check } from "lucide-react"

import type { WorkspaceTheme, WorkspaceThemeId } from "@/features/bettertolive/config/theme-presets"
import { cn } from "@/lib/utils"

export function ThemeUtilityPanel({
  currentTheme,
  themeId,
  themes,
  onSelectTheme,
}: {
  currentTheme: WorkspaceTheme
  themeId: WorkspaceThemeId
  themes: WorkspaceTheme[]
  onSelectTheme: (themeId: WorkspaceThemeId) => void
}) {
  return (
    <div
      data-testid="utility-panel-themes"
      className="rounded-2xl border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-[color:var(--text-primary)]">主题切换</div>
          <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
            主题是一种工作氛围，不是昼夜模式。当前是 {currentTheme.label}。
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-[color:var(--chip-border)] bg-white/80 px-2 py-1">
          {currentTheme.swatches.map((swatch) => (
            <span
              key={swatch}
              className="size-2.5 rounded-full border border-white/80"
              style={{ backgroundColor: swatch }}
            />
          ))}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {themes.map((item) => {
          const isActive = item.id === themeId

          return (
            <button
              key={item.id}
              type="button"
              data-testid={`theme-option-${item.id}`}
              className={cn(
                "w-full rounded-xl border px-3 py-3 text-left transition",
                isActive
                  ? "border-[color:var(--nav-active-border)] bg-white"
                  : "border-[color:var(--chip-border)] bg-white/75 hover:bg-white",
              )}
              onClick={() => onSelectTheme(item.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--text-primary)]">
                    {item.label}
                    {isActive ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] leading-none text-emerald-700">
                        当前
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
                    {item.description}
                  </p>
                </div>
                {isActive ? (
                  <div className="mt-0.5 rounded-full bg-[color:var(--nav-active-icon-bg)] p-1 text-[color:var(--nav-active-icon-ink)]">
                    <Check className="size-3" />
                  </div>
                ) : null}
              </div>
              <div className="mt-3 flex items-center gap-2">
                {item.swatches.map((swatch) => (
                  <span
                    key={swatch}
                    className="size-3 rounded-full border border-white/80 shadow-sm"
                    style={{ backgroundColor: swatch }}
                  />
                ))}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
