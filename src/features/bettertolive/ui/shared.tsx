import { type ComponentProps } from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpenText,
  Compass,
  NotebookPen,
  type LucideIcon,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { RecentRecord } from "@/features/bettertolive/types"

const SUMMARY_SURFACE_STYLES = {
  past: "border-[color:var(--tone-past-border)] bg-[color:var(--tone-past-bg)]",
  present:
    "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)]",
  future:
    "border-[color:var(--tone-future-border)] bg-[color:var(--tone-future-bg)]",
  value:
    "border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)]",
} as const

const KIND_BADGE_STYLES: Record<RecentRecord["kind"], string> = {
  反思: "bg-[color:var(--tone-past-bg)] text-[color:var(--tone-past-ink)]",
  记事: "bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]",
  支出: "bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]",
  收入: "bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]",
  蓝图: "bg-[color:var(--tone-past-bg)] text-[color:var(--tone-past-ink)]",
}

export function PageIntro({
  searchQuery,
}: {
  eyebrow: string
  title: string
  description: string
  searchQuery: string
}) {
  if (searchQuery.trim().length === 0) {
    return null
  }

  return (
    <Badge
      variant="outline"
      className="w-fit border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
    >
      当前筛选：{searchQuery.trim()}
    </Badge>
  )
}

export function SummarySurface({
  tone,
  title,
  value,
  detail,
}: {
  tone: keyof typeof SUMMARY_SURFACE_STYLES
  title: string
  value: string
  detail: string
}) {
  return (
    <Surface className={cn("p-5", SUMMARY_SURFACE_STYLES[tone])}>
      <div className="text-xs tracking-[0.2em] text-[color:var(--text-muted)] uppercase">
        {title}
      </div>
      <div className="mt-4 text-[1.1rem] leading-snug font-semibold tracking-tight text-[color:var(--text-primary)]">
        {value}
      </div>
      <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
        {detail}
      </p>
    </Surface>
  )
}

export function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[color:var(--text-primary)]">
          <Icon className="size-4" />
          <h4 className="text-base font-semibold tracking-tight">{title}</h4>
        </div>
        <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
          {description}
        </p>
      </div>
    </div>
  )
}

export function QuickActionButton({
  icon: Icon,
  label,
  description,
  onClick,
}: {
  icon: LucideIcon
  label: string
  description: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-left transition hover:border-[color:var(--surface-border)] hover:bg-[color:var(--chip-bg)]"
    >
      <div className="flex size-9 items-center justify-center rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]">
        <Icon className="size-4" />
      </div>
      <div className="min-w-0">
        <div className="font-medium text-[color:var(--text-primary)]">
          {label}
        </div>
        <div className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
          {description}
        </div>
      </div>
      <span className="text-[color:var(--text-muted)]">&rsaquo;</span>
    </button>
  )
}

export function EmptyState({
  message,
  compact = false,
}: {
  message: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-[color:var(--chip-border)] bg-[color:var(--muted-surface-bg)] px-4 py-5 text-sm text-[color:var(--text-muted)]",
        compact ? "py-4" : "py-8",
      )}
    >
      {message}
    </div>
  )
}

export function Surface({
  className,
  style,
  ...props
}: ComponentProps<"section">) {
  return (
    <section
      className={cn(
        "rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] backdrop-blur-sm",
        className,
      )}
      style={{ boxShadow: "var(--surface-shadow)", ...style }}
      {...props}
    />
  )
}

export function RecordStream({ records }: { records: RecentRecord[] }) {
  return (
    <div className="space-y-3">
      {records.map((record) => (
        <div
          key={record.id}
          className="flex items-start gap-3 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
        >
          <div
            className={cn(
              "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg",
              KIND_BADGE_STYLES[record.kind],
            )}
          >
            <RecordIcon kind={record.kind} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-[color:var(--text-primary)]">
                {record.title}
              </span>
              <span className="text-xs text-[color:var(--text-muted)]">
                {record.date}
              </span>
            </div>
            <p className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)]">
              {record.description}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

function RecordIcon({ kind }: { kind: RecentRecord["kind"] }) {
  switch (kind) {
    case "反思":
      return <NotebookPen className="size-4" />
    case "记事":
      return <BookOpenText className="size-4" />
    case "收入":
      return <ArrowUpRight className="size-4" />
    case "支出":
      return <ArrowDownLeft className="size-4" />
    case "蓝图":
    default:
      return <Compass className="size-4" />
  }
}
