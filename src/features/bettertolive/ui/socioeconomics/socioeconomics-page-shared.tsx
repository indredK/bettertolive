import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"

export const SOCIO_DIALOG_CONTENT_CLASS = "border border-foreground/10 bg-background shadow-lg"

export const SOCIO_DIALOG_HEADER_CLASS =
  "sticky top-0 z-10 -mx-4 -mt-4 border-b border-foreground/10 bg-background/95 px-4 pt-4 pb-3 pr-12 supports-[backdrop-filter]:bg-background/90 supports-[backdrop-filter]:backdrop-blur-xs"

export const SOCIO_DIALOG_SECTION_CLASS =
  "space-y-3 rounded-lg border border-foreground/10 bg-card/70 p-4"

export const SOCIO_DIALOG_FIELD_CLASS = "w-full border-foreground/15 bg-background shadow-sm"

export const SOCIO_DIALOG_FOOTER_CLASS =
  "sticky bottom-0 z-10 gap-2 border-foreground/10 bg-background/95 supports-[backdrop-filter]:bg-background/90 supports-[backdrop-filter]:backdrop-blur-xs"

export const SOCIO_IDLE_BADGE_CLASS = "border-foreground/10 bg-muted text-muted-foreground"

export const SOCIO_CONTROL_BADGE_CLASS = "border-ring/50 bg-accent text-accent-foreground"

export function SocioeconomicsControlModeBadge({ isControlMode }: { isControlMode: boolean }) {
  const { t } = useTranslation()

  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px]",
        isControlMode ? SOCIO_CONTROL_BADGE_CLASS : SOCIO_IDLE_BADGE_CLASS,
      )}
    >
      {isControlMode
        ? t("socioeconomics.controlMode.on", "控制模式")
        : t("socioeconomics.controlMode.off", "浏览模式")}
    </span>
  )
}

export function SocioeconomicsDialogField({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm leading-none font-medium">{label}</label>
      {children}
    </div>
  )
}
