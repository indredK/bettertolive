import { type ComponentProps } from "react"
import {
  ArrowDownLeft,
  ArrowUpRight,
  BookOpenText,
  BookHeart,
  Compass,
  HeartPulse,
  NotebookPen,
  ScrollText,
  type LucideIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { RecentRecord } from "@/features/bettertolive/types"

const SUMMARY_SURFACE_STYLES = {
  past: "border-[color:var(--tone-past-border)] bg-[color:var(--tone-past-bg)]",
  present: "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)]",
  future: "border-[color:var(--tone-future-border)] bg-[color:var(--tone-future-bg)]",
  value: "border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)]",
} as const

const KIND_BADGE_STYLES: Record<RecentRecord["kind"], string> = {
  反思: "bg-[color:var(--tone-past-bg)] text-[color:var(--tone-past-ink)]",
  记事: "bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]",
  支出: "bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]",
  收入: "bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]",
  蓝图: "bg-[color:var(--tone-past-bg)] text-[color:var(--tone-past-ink)]",
  情绪: "bg-[color:var(--tone-present-border)] text-[color:var(--tone-present-ink)]",
  记忆: "bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]",
  托付: "bg-[color:var(--tone-future-border)] text-[color:var(--tone-future-ink)]",
}

export function SummarySurface({
  tone,
  title,
  value,
  detail,
  compact = false,
}: {
  tone: keyof typeof SUMMARY_SURFACE_STYLES
  title: string
  value: string
  detail: string
  compact?: boolean
}) {
  return (
    <Surface className={cn("p-5", compact && "p-3", SUMMARY_SURFACE_STYLES[tone])}>
      <div
        className={cn(
          "text-xs tracking-[0.2em] text-[color:var(--text-muted)] uppercase",
          compact && "text-[10px] tracking-[0.14em]",
        )}
      >
        {title}
      </div>
      <div
        className={cn(
          "mt-4 text-[1.1rem] leading-snug font-semibold tracking-tight text-[color:var(--text-primary)]",
          compact && "mt-1.5 text-[15px]",
        )}
      >
        {value}
      </div>
      <p
        className={cn(
          "mt-3 text-sm leading-6 text-[color:var(--text-secondary)]",
          compact && "mt-1 text-[12px] leading-[1.1rem]",
        )}
      >
        {detail}
      </p>
    </Surface>
  )
}

export function SectionHeading({
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
      <div className="min-w-0">
        <div className="flex items-center gap-2 text-[color:var(--text-primary)]">
          <Icon className="size-4" />
          <h4 className={cn("text-base font-semibold tracking-tight", compact && "text-sm")}>
            {title}
          </h4>
        </div>
        <p
          className={cn(
            "mt-2 text-sm leading-6 text-[color:var(--text-muted)]",
            compact && "mt-1 text-[12px] leading-[1.1rem]",
          )}
        >
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
        <div className="font-medium text-[color:var(--text-primary)]">{label}</div>
        <div className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">{description}</div>
      </div>
      <span className="text-[color:var(--text-muted)]">&rsaquo;</span>
    </button>
  )
}

export function EmptyState({ message, compact = false }: { message: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-[color:var(--chip-border)] bg-[color:var(--muted-surface-bg)] px-4 py-5 text-sm text-[color:var(--text-muted)]",
        compact && "py-4",
      )}
    >
      {message}
    </div>
  )
}

export function Surface({ className, style, ...props }: ComponentProps<"section">) {
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
              <span className="text-xs text-[color:var(--text-muted)]">{record.date}</span>
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
      return <Compass className="size-4" />
    case "情绪":
      return <HeartPulse className="size-4" />
    case "记忆":
      return <BookHeart className="size-4" />
    case "托付":
      return <ScrollText className="size-4" />
    default:
      return <Compass className="size-4" />
  }
}
