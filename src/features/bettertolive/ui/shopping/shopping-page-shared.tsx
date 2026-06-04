import { type LucideIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
import type { ShoppingPlanWithLane } from "@/features/bettertolive/ui/shopping/shopping-system-detail-dialog"
import {
  DEPRECIATION_STYLES,
  LIFECYCLE_COPY,
  LIFECYCLE_STYLES,
  NEED_LEVEL_STYLES,
  formatPrice,
  getPriceSignal,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"
import { cn } from "@/lib/utils"

function ClassificationBadge({ label, className }: { label: string; className: string }) {
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
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
        <p className="mt-3 text-sm text-[color:var(--text-muted)]">当前阶段暂时没有这一层。</p>
      )}
    </div>
  )
}

export function CompactItemRow({
  item,
  sourceLabel,
  compact = false,
}: {
  item: ShoppingOwnedItem | ShoppingPlanWithLane
  sourceLabel: string
  compact?: boolean
}) {
  const isPlanItem = "currentPrice" in item

  return (
    <div
      className={cn(
        "rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3",
        compact && "px-3 py-2.5",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3
          className={cn(
            "text-sm font-medium text-[color:var(--text-primary)]",
            compact && "text-[13px]",
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
            <TableHead className="sticky top-0 z-10 bg-[color:var(--surface-bg)]">物品</TableHead>
            <TableHead className="sticky top-0 z-10 bg-[color:var(--surface-bg)]">归属</TableHead>
            <TableHead className="sticky top-0 z-10 bg-[color:var(--surface-bg)]">理由</TableHead>
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
  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <ClassificationBadge label={lifecycle} className={LIFECYCLE_STYLES[lifecycle]} />
        <span className="text-sm font-medium text-[color:var(--text-primary)]">
          {LIFECYCLE_COPY[lifecycle].title}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
        {LIFECYCLE_COPY[lifecycle].detail}
      </p>
      <div className="mt-3 text-xs text-[color:var(--text-muted)]">
        已有 {ownedCount} 项 · 待看 {plannedCount} 项
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
        <p className="mt-3 text-sm text-[color:var(--text-muted)]">当前筛选下还没有条目。</p>
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
  const signal = getPriceSignal(item)

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
            label="当前价格"
            value={formatPrice(item.currentPrice)}
          />
          <ShoppingPriceRow
            compact={compact}
            label="什么价格可以购入"
            value={`<= ${formatPrice(item.buyBelowPrice)}`}
          />
          <ShoppingPriceRow
            compact={compact}
            label="什么价格性价比低"
            value={`>= ${formatPrice(item.overpayPrice)}`}
          />
        </div>

        <div>
          <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
            相关提醒
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
