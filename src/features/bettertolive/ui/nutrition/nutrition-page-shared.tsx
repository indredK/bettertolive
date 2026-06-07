import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export const NUTRITION_SURFACE_CARD_CLASS =
  "border-foreground/10 bg-linear-to-br from-background via-card to-muted/20 shadow-lg shadow-foreground/5"

export const NUTRITION_DETAIL_CARD_CLASS =
  "border-foreground/10 bg-card/90 shadow-md shadow-foreground/5"

export const NUTRITION_SELECTABLE_CARD_CLASS =
  "rounded-xl border border-foreground/10 bg-background/75 shadow-sm shadow-foreground/5 transition-all duration-150 hover:border-ring/40 hover:bg-muted/25"

export const NUTRITION_SELECTED_CARD_CLASS =
  "border-ring/60 bg-accent text-accent-foreground shadow-md shadow-foreground/10"

export const NUTRITION_MUTED_PANEL_CLASS = "border-foreground/10 bg-muted/25"

export const NUTRITION_IDLE_BADGE_CLASS = "border-foreground/10 bg-muted text-muted-foreground"

export const NUTRITION_CONTROL_BADGE_CLASS = "border-ring/50 bg-accent text-accent-foreground"

export const NUTRITION_DIALOG_CONTENT_CLASS = "border border-foreground/10 bg-background shadow-lg"

export const NUTRITION_DIALOG_HEADER_CLASS =
  "sticky top-0 z-10 -mx-4 -mt-4 border-b border-foreground/10 bg-background/95 px-4 pt-4 pb-3 pr-12 supports-[backdrop-filter]:bg-background/90 supports-[backdrop-filter]:backdrop-blur-xs"

export const NUTRITION_DIALOG_SECTION_CLASS =
  "space-y-3 rounded-xl border border-foreground/10 bg-card/70 p-4"

export const NUTRITION_DIALOG_FIELD_CLASS = "w-full border-foreground/15 bg-background shadow-sm"

export const NUTRITION_DIALOG_FOOTER_CLASS =
  "sticky bottom-0 z-10 gap-2 border-foreground/10 bg-background/95 supports-[backdrop-filter]:bg-background/90 supports-[backdrop-filter]:backdrop-blur-xs"

export function NutritionTabViewport({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1", className)}>
      {children}
    </div>
  )
}

export function NutritionTabBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-3 xl:flex-row", className)}>
      {children}
    </div>
  )
}

export function NutritionSidebarPane({
  children,
  className,
  contentClassName,
}: {
  children: ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <Card
      className={cn(
        NUTRITION_SURFACE_CARD_CLASS,
        "flex min-h-0 flex-col overflow-hidden xl:w-76 xl:shrink-0",
        className,
      )}
    >
      <CardContent
        className={cn("flex h-full min-h-0 flex-1 flex-col overflow-y-auto p-3", contentClassName)}
      >
        {children}
      </CardContent>
    </Card>
  )
}

export function NutritionDetailPane({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn("min-h-[320px] flex-1 xl:min-h-0", className)}>{children}</div>
}

export function NutritionEmptyDetailCard({ message }: { message: string }) {
  return (
    <Card
      className={cn(
        NUTRITION_DETAIL_CARD_CLASS,
        "flex h-full min-h-[260px] items-center justify-center p-8 xl:min-h-0",
      )}
    >
      <p className="text-muted-foreground text-sm">{message}</p>
    </Card>
  )
}

export function NutritionMetricCard({
  detail,
  icon: Icon,
  label,
  value,
}: {
  detail?: string
  icon?: LucideIcon
  label: string
  value: string | number
}) {
  return (
    <div className="border-foreground/10 bg-background/70 shadow-foreground/5 rounded-xl border p-3 shadow-sm">
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        {Icon ? <Icon className="size-3.5" /> : null}
        <span>{label}</span>
      </div>
      <div className="mt-2 text-xl font-semibold tracking-tight">{value}</div>
      {detail ? <div className="text-muted-foreground mt-1 text-xs leading-5">{detail}</div> : null}
    </div>
  )
}

export function NutritionSelectableCard({
  children,
  isActive,
  onClick,
  className,
}: {
  children: ReactNode
  isActive?: boolean
  onClick?: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      className={cn(
        NUTRITION_SELECTABLE_CARD_CLASS,
        "w-full p-3 text-left",
        isActive && NUTRITION_SELECTED_CARD_CLASS,
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

export function NutritionPanel({
  children,
  className,
  contentClassName,
  count,
  title,
}: {
  children: ReactNode
  className?: string
  contentClassName?: string
  count?: number
  title: string
}) {
  return (
    <Card className={cn(NUTRITION_DETAIL_CARD_CLASS, "flex min-h-0 flex-col", className)}>
      <CardHeader className="shrink-0 pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {typeof count === "number" ? (
            <Badge variant="outline" className="text-muted-foreground text-[10px]">
              {count}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className={cn("min-h-0 flex-1 overflow-y-auto", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}

export function NutritionTagBar({ names, className }: { names: string[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {names.map((name) => (
        <Badge key={name} variant="outline" className={NUTRITION_IDLE_BADGE_CLASS}>
          {name}
        </Badge>
      ))}
    </div>
  )
}

export function NutritionControlModeBadge({ isControlMode }: { isControlMode: boolean }) {
  const { t } = useTranslation()

  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px]",
        isControlMode ? NUTRITION_CONTROL_BADGE_CLASS : NUTRITION_IDLE_BADGE_CLASS,
      )}
    >
      {isControlMode
        ? t("nutrition.controlMode.on", "控制模式")
        : t("nutrition.controlMode.off", "浏览模式")}
    </span>
  )
}
