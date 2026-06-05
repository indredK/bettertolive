import { type LucideIcon, Pencil, Plus } from "lucide-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  ShoppingBoundaryEntry,
  ShoppingLifecycle,
  ShoppingOwnedItem,
  ShoppingSystem,
} from "@/features/bettertolive/types"
import type { ShoppingPlanWithLane } from "@/features/bettertolive/ui/shopping/shopping-types"
import {
  DEPRECIATION_STYLES,
  getLifecycleCopy,
  LIFECYCLE_STYLES,
  NEED_LEVEL_STYLES,
  formatPrice,
  getPriceSignal,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"
import { cn } from "@/lib/utils"

export function ClassificationBadge({ label, className }: { label: string; className: string }) {
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}

export function FormField({
  label,
  required,
  className,
  children,
}: {
  label: string
  required?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <label className={cn("space-y-1.5", className)}>
      <span className="text-xs font-medium text-[color:var(--text-secondary)]">
        {label}
        {required ? <span className="ml-0.5 text-red-400">*</span> : null}
      </span>
      {children}
    </label>
  )
}

export function SystemChip({ system }: { system: ShoppingSystem }) {
  return (
    <Badge
      variant="outline"
      className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
    >
      {system}
    </Badge>
  )
}

export function SystemSummaryChip({ label }: { label: string }) {
  return (
    <Badge
      variant="outline"
      className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
    >
      {label}
    </Badge>
  )
}

export function ShoppingPriceRow({
  label,
  value,
  compact = false,
}: {
  label: string
  value: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-t border-[color:var(--muted-surface-border)] py-2 first:border-t-0 first:pt-0 last:pb-0",
        compact && "py-1.5",
      )}
    >
      <span className={cn("text-xs text-[color:var(--text-muted)]", compact && "text-[11px]")}>
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-medium text-[color:var(--text-primary)]",
          compact && "text-[13px]",
        )}
      >
        {value}
      </span>
    </div>
  )
}

export function ChecklistBlock({ title, items }: { title: string; items: string[] }) {
  const { t } = useTranslation()
  return (
    <div>
      <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
        {title}
      </div>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[color:var(--text-secondary)]">
          {items.map((item) => (
            <li
              key={item}
              className="border-t border-[color:var(--muted-surface-border)] py-2 first:border-t-0 first:pt-0 last:pb-0"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[color:var(--text-muted)]">
          {t("shopping.shared.noItemsInLayer")}
        </p>
      )}
    </div>
  )
}

export function CompactItemRow({
  item,
  sourceLabel,
  compact = false,
  onEditOwned,
  onEditPlan,
}: {
  item: ShoppingOwnedItem | ShoppingPlanWithLane
  sourceLabel: string
  compact?: boolean
  onEditOwned?: (item: ShoppingOwnedItem) => void
  onEditPlan?: (item: ShoppingPlanWithLane) => void
}) {
  const isPlanItem = "currentPrice" in item

  return (
    <div
      className={cn(
        "rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3",
        compact && "px-3 py-2.5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3
              className={cn(
                "text-sm font-medium text-[color:var(--text-primary)]",
                compact && "text-[13px]",
              )}
            >
              {item.name}
            </h3>
            <ClassificationBadge
              label={item.necessity}
              className={NEED_LEVEL_STYLES[item.necessity]}
            />
            <ClassificationBadge
              label={item.lifecycle}
              className={LIFECYCLE_STYLES[item.lifecycle]}
            />
            {item.depreciation ? (
              <ClassificationBadge
                label={item.depreciation}
                className={DEPRECIATION_STYLES[item.depreciation]}
              />
            ) : null}
            <Badge
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
            >
              {sourceLabel}
            </Badge>
          </div>

          <div
            className={cn(
              "mt-2 flex flex-wrap gap-2 text-xs text-[color:var(--text-muted)]",
              compact && "text-[11px]",
            )}
          >
            <span>{item.system}</span>
            <span>·</span>
            <span>{item.category}</span>
            <span>·</span>
            <span>{item.spaces.join(" / ")}</span>
            <span>·</span>
            <span>{item.stages.join(" / ")}</span>
          </div>

          <p
            className={cn(
              "mt-2 text-sm leading-6 text-[color:var(--text-secondary)]",
              compact && "text-[13px] leading-5",
            )}
          >
            {isPlanItem ? item.reason : item.replacementCue}
          </p>
          <p
            className={cn(
              "mt-1 text-sm leading-6 text-[color:var(--text-muted)]",
              compact && "text-[13px] leading-5",
            )}
          >
            {item.note}
          </p>
        </div>

        {onEditOwned || onEditPlan ? (
          <Button
            size="icon-sm"
            variant="ghost"
            className="shrink-0 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
            onClick={(e) => {
              e.stopPropagation()
              if (isPlanItem && onEditPlan) {
                onEditPlan(item)
              } else if (!isPlanItem && onEditOwned) {
                onEditOwned(item)
              }
            }}
          >
            <Pencil className="size-3.5" />
          </Button>
        ) : null}
      </div>
    </div>
  )
}

export function InlineSectionHeader({
  icon: Icon,
  title,
  description,
  compact = false,
}: {
  icon: LucideIcon
  title: string
  description: string
  compact?: boolean
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2 text-[color:var(--text-primary)]">
          <Icon className="size-4 shrink-0" />
          <div className="flex min-w-0 items-baseline gap-2">
            <h4
              className={cn(
                "shrink-0 text-base font-semibold tracking-tight",
                compact && "text-sm",
              )}
            >
              {title}
            </h4>
            <p
              className={cn(
                "min-w-0 truncate text-xs leading-5 text-[color:var(--text-muted)]",
                compact && "text-[11px]",
              )}
              title={description}
            >
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export function BoundaryTable({
  entries,
  className,
}: {
  entries: ShoppingBoundaryEntry[]
  className?: string
}) {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        "mt-5 min-h-0 flex-1 overflow-auto rounded-lg border border-[color:var(--muted-surface-border)]",
        className,
      )}
    >
      <Table className="min-w-[720px]">
        <TableHeader>
          <TableRow className="border-[color:var(--muted-surface-border)] bg-[color:var(--surface-bg)]">
            <TableHead className="sticky top-0 z-10 bg-[color:var(--surface-bg)]">
              {t("shopping.shared.boundaryTable.item")}
            </TableHead>
            <TableHead className="sticky top-0 z-10 bg-[color:var(--surface-bg)]">
              {t("shopping.shared.boundaryTable.ownership")}
            </TableHead>
            <TableHead className="sticky top-0 z-10 bg-[color:var(--surface-bg)]">
              {t("shopping.shared.boundaryTable.reason")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} className="border-[color:var(--muted-surface-border)]">
              <TableCell className="font-medium text-[color:var(--text-primary)]">
                {entry.item}
              </TableCell>
              <TableCell className="text-[color:var(--text-secondary)]">
                <SystemChip system={entry.system} />
              </TableCell>
              <TableCell className="max-w-[420px] whitespace-normal text-[color:var(--text-secondary)]">
                <span className="block text-sm leading-6">{entry.reason}</span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export function LifecycleLane({
  lifecycle,
  ownedCount,
  plannedCount,
  highlights,
}: {
  lifecycle: ShoppingLifecycle
  ownedCount: number
  plannedCount: number
  highlights: string[]
}) {
  const { t } = useTranslation()
  const lifecycleCopy = getLifecycleCopy(t)
  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <ClassificationBadge label={lifecycle} className={LIFECYCLE_STYLES[lifecycle]} />
        <span className="text-sm font-medium text-[color:var(--text-primary)]">
          {lifecycleCopy[lifecycle].title}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
        {lifecycleCopy[lifecycle].detail}
      </p>
      <div className="mt-3 text-xs text-[color:var(--text-muted)]">
        {t("shopping.overview.ownedAndPlanned", { owned: ownedCount, planned: plannedCount })}
      </div>
      {highlights.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {highlights.map((item) => (
            <Badge
              key={item}
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
            >
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-[color:var(--text-muted)]">
          {t("shopping.overview.noItemsUnderFilter")}
        </p>
      )}
    </div>
  )
}

export function PurchaseDecisionCard({
  item,
  compact = false,
}: {
  item: ShoppingPlanWithLane
  compact?: boolean
}) {
  const { t } = useTranslation()
  const signal = getPriceSignal(item, t)

  return (
    <div
      className={cn(
        "border-t border-[color:var(--muted-surface-border)] pt-5 first:border-t-0 first:pt-0",
        compact && "pt-4",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3
          className={cn(
            "text-base font-medium text-[color:var(--text-primary)]",
            compact && "text-sm",
          )}
        >
          {item.name}
        </h3>
        <ClassificationBadge label={item.necessity} className={NEED_LEVEL_STYLES[item.necessity]} />
        <ClassificationBadge label={item.lifecycle} className={LIFECYCLE_STYLES[item.lifecycle]} />
        {item.depreciation ? (
          <ClassificationBadge
            label={item.depreciation}
            className={DEPRECIATION_STYLES[item.depreciation]}
          />
        ) : null}
        <SystemChip system={item.system} />
        <ClassificationBadge label={signal.label} className={signal.className} />
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-xs text-[color:var(--text-muted)]">
        <span>{item.category}</span>
        <span>·</span>
        <span>{item.spaces.join(" / ")}</span>
        <span>·</span>
        <span>{item.stages.join(" / ")}</span>
      </div>

      <p
        className={cn(
          "mt-3 text-sm leading-6 text-[color:var(--text-secondary)]",
          compact && "mt-2 text-[13px] leading-5",
        )}
      >
        {item.reason}
      </p>
      <p
        className={cn(
          "mt-2 text-sm leading-6 text-[color:var(--text-muted)]",
          compact && "text-[13px] leading-5",
        )}
      >
        {item.note}
      </p>

      <div
        className={cn(
          "mt-4 grid gap-4 min-[960px]:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]",
          compact && "mt-3 gap-3",
        )}
      >
        <div className="space-y-2">
          <ShoppingPriceRow
            compact={compact}
            label={t("shopping.planning.currentPrice")}
            value={formatPrice(item.currentPrice)}
          />
          <ShoppingPriceRow
            compact={compact}
            label={t("shopping.planning.buyBelowPrice")}
            value={`<= ${formatPrice(item.buyBelowPrice)}`}
          />
          <ShoppingPriceRow
            compact={compact}
            label={t("shopping.planning.overpayPrice")}
            value={`>= ${formatPrice(item.overpayPrice)}`}
          />
        </div>

        <div>
          <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
            {t("shopping.shared.relatedReminders")}
          </div>
          <div className={cn("mt-3 flex flex-wrap gap-2", compact && "mt-2 gap-1.5")}>
            <Badge
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
            >
              {item.laneTitle}
            </Badge>
            <Badge
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
            >
              {item.targetLifestyle}
            </Badge>
            {item.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AddCard({ onClick, className }: { onClick: () => void; className?: string }) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[color:var(--chip-border)] px-3 py-4 text-[color:var(--text-muted)] transition-all duration-200 hover:border-[color:var(--tone-present-border)] hover:text-[color:var(--text-primary)]",
        className,
      )}
    >
      <Plus className="size-5" />
      <span className="text-xs">{t("shopping.cardGrid.addNew")}</span>
    </button>
  )
}
