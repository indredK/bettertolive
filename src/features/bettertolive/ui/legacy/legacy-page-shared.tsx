import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Lock, Pencil } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { AnimatedIconButton } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LegacyItem } from "@/features/bettertolive/types"
import {
  legacyRecipientLabel,
  translateLegacyEnum,
} from "@/features/bettertolive/ui/legacy/legacy-page-data"
import { cn } from "@/lib/utils"

export const LEGACY_DIALOG_CONTENT_CLASS = "border border-foreground/10 bg-background shadow-lg"
export const LEGACY_DIALOG_FIELD_CLASS = "w-full border-foreground/15 bg-background shadow-sm"
export const LEGACY_DIALOG_SECTION_CLASS =
  "space-y-3 rounded-xl border border-foreground/10 bg-card/70 p-4"
export const LEGACY_DIALOG_FOOTER_CLASS =
  "sticky bottom-0 z-10 gap-2 border-foreground/10 bg-background/95 supports-[backdrop-filter]:bg-background/90 supports-[backdrop-filter]:backdrop-blur-xs"

export const LEGACY_SURFACE_CARD_CLASS =
  "border-foreground/10 bg-linear-to-br from-background via-card to-[color:var(--legacy-private-bg)] shadow-lg shadow-foreground/5"
export const LEGACY_DETAIL_CARD_CLASS =
  "border-foreground/10 bg-card/90 shadow-md shadow-foreground/5"
export const LEGACY_SELECTABLE_CARD_CLASS =
  "rounded-xl border border-foreground/10 bg-background/75 shadow-sm shadow-foreground/5 transition-all duration-150 hover:border-ring/40 hover:bg-muted/25"
export const LEGACY_SELECTED_CARD_CLASS =
  "border-[color:var(--legacy-private-border)] bg-[color:var(--legacy-private-bg)] text-[color:var(--legacy-private-ink)] shadow-md shadow-foreground/10"

export function LegacyTabViewport({
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

export function LegacyTabBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-3 lg:flex-row", className)}>
      {children}
    </div>
  )
}

export function LegacySidebarPane({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <Card
      className={cn(
        LEGACY_SURFACE_CARD_CLASS,
        "flex min-h-0 flex-col overflow-hidden lg:w-80 lg:shrink-0",
        className,
      )}
    >
      <CardContent className="flex h-full min-h-0 flex-1 flex-col overflow-y-auto p-3">
        {children}
      </CardContent>
    </Card>
  )
}

export function LegacyDetailPane({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn("min-h-[320px] flex-1 lg:min-h-0", className)}>{children}</div>
}

export function LegacyEmptyDetailCard({ message }: { message: string }) {
  return (
    <Card
      className={cn(
        LEGACY_DETAIL_CARD_CLASS,
        "flex h-full min-h-[260px] items-center justify-center p-8 lg:min-h-0",
      )}
    >
      <p className="text-muted-foreground text-sm">{message}</p>
    </Card>
  )
}

export function LegacyMetricCard({
  label,
  value,
  detail,
  tone = "quiet",
}: {
  label: string
  value: string
  detail: string
  tone?: "quiet" | "warning" | "locked"
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3",
        tone === "warning"
          ? "border-[color:var(--legacy-warning-border)] bg-[color:var(--legacy-warning-bg)] text-[color:var(--legacy-warning-ink)]"
          : tone === "locked"
            ? "border-[color:var(--legacy-lock-border)] bg-[color:var(--legacy-lock-bg)] text-[color:var(--legacy-lock-ink)]"
            : "border-foreground/10 bg-muted/25",
      )}
    >
      <div className="text-[11px] font-medium tracking-wide uppercase opacity-75">{label}</div>
      <div className="mt-2 text-xl font-semibold tabular-nums">{value}</div>
      <p className="mt-1 text-xs leading-5 opacity-80">{detail}</p>
    </div>
  )
}

export function LegacyWarningCallout({
  title,
  children,
  compact = false,
}: {
  title: string
  children: ReactNode
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[color:var(--legacy-warning-border)] bg-[color:var(--legacy-warning-bg)] text-[color:var(--legacy-warning-ink)]",
        compact ? "px-3 py-2 text-xs" : "px-4 py-3 text-sm",
      )}
    >
      <div className="font-medium">{title}</div>
      <div className={cn("leading-5 opacity-85", compact ? "mt-1" : "mt-2")}>{children}</div>
    </div>
  )
}

export function LegacyMeta({
  label,
  value,
  accent = false,
}: {
  label: string
  value: ReactNode
  accent?: boolean
}) {
  return (
    <div className="border-foreground/10 bg-background/70 rounded-lg border px-3 py-2">
      <div className="text-muted-foreground text-[11px]">{label}</div>
      <div
        className={cn("mt-1 text-sm font-medium", accent && "text-[color:var(--legacy-lock-ink)]")}
      >
        {value}
      </div>
    </div>
  )
}

export function LegacyItemSummaryCard({
  item,
  isSelected = false,
  onSelect,
  onEdit,
  compact = false,
}: {
  item: LegacyItem
  isSelected?: boolean
  onSelect?: () => void
  onEdit?: () => void
  compact?: boolean
}) {
  const { t } = useTranslation()

  return (
    <article className={cn(LEGACY_SELECTABLE_CARD_CLASS, isSelected && LEGACY_SELECTED_CARD_CLASS)}>
      <div className={cn("flex items-start gap-2", compact ? "p-3" : "p-4")}>
        <button
          type="button"
          onClick={onSelect}
          className="focus-visible:ring-ring min-w-0 flex-1 border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="border-foreground/10 bg-background/70 text-[10px]">
              {translateLegacyEnum(t, "category", item.category)}
            </Badge>
            <Badge className="bg-[color:var(--legacy-private-bg)] text-[color:var(--legacy-private-ink)]">
              {translateLegacyEnum(t, "visibility", item.visibility)}
            </Badge>
            {item.isLocked ? (
              <Badge className="gap-1 bg-[color:var(--legacy-lock-bg)] text-[color:var(--legacy-lock-ink)]">
                <Lock className="size-3" />
                {t("legacy.labels.locked", "已锁定")}
              </Badge>
            ) : null}
          </div>
          <h3 className="mt-2 truncate text-sm font-medium">{item.title}</h3>
          <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-5">
            {item.summary}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge
              variant="outline"
              className="text-muted-foreground border-foreground/10 text-[10px]"
            >
              {legacyRecipientLabel(item, t)}
            </Badge>
            <Badge
              variant="outline"
              className="text-muted-foreground border-foreground/10 text-[10px]"
            >
              {translateLegacyEnum(t, "status", item.status)}
            </Badge>
            {item.excludeFromAi ? (
              <Badge
                variant="outline"
                className="text-muted-foreground border-foreground/10 text-[10px]"
              >
                {t("legacy.labels.aiExcluded", "不参与 AI")}
              </Badge>
            ) : null}
          </div>
        </button>
        <AnimatedIconButton
          show={Boolean(onEdit)}
          size="icon-sm"
          variant="ghost"
          className="h-7 w-7 shrink-0"
          label={t("legacy.actions.edit", "编辑")}
          icon={<Pencil className="size-3.5" />}
          onClick={onEdit}
        />
      </div>
    </article>
  )
}

export function LegacyPanel({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={cn(LEGACY_DETAIL_CARD_CLASS, "min-h-0", className)}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">{title}</CardTitle>
        {description ? (
          <p className="text-muted-foreground text-xs leading-5">{description}</p>
        ) : null}
      </CardHeader>
      <CardContent className="min-h-0">{children}</CardContent>
    </Card>
  )
}
