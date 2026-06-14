import { SlidersHorizontal, X } from "lucide-react"
import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export type FilterPopoverDimension = {
  key: string
  label: string
  allLabel: string
  value: string
  options: ReadonlyArray<{
    value: string
    label: string
  }>
}

export function FilterPopover({
  className,
  dimensions,
  popoverWidth,
  onChangeFilter,
  onClearAll,
}: {
  className?: string
  dimensions: FilterPopoverDimension[]
  popoverWidth?: string
  onChangeFilter: (key: string, value: string) => void
  onClearAll: () => void
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <FilterPopoverButton
        dimensions={dimensions}
        popoverWidth={popoverWidth}
        onChangeFilter={onChangeFilter}
        onClearAll={onClearAll}
      />
      <FilterAppliedChips dimensions={dimensions} onChangeFilter={onChangeFilter} />
    </div>
  )
}

export function FilterPopoverButton({
  className,
  dimensions,
  popoverWidth,
  onChangeFilter,
  onClearAll,
}: {
  className?: string
  dimensions: FilterPopoverDimension[]
  popoverWidth?: string
  onChangeFilter: (key: string, value: string) => void
  onClearAll: () => void
}) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const activeFilterCount = dimensions.filter((d) => d.value !== "all").length
  const hasActiveFilters = activeFilterCount > 0

  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [isOpen])

  return (
    <div className={cn("relative", className)} ref={containerRef}>
      <Button
        type="button"
        variant={isOpen || hasActiveFilters ? "default" : "outline"}
        size="sm"
        className="h-9 gap-1.5 px-3 text-[12px]"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <SlidersHorizontal className="size-3.5" />
        {t("common.filter.label")}
        {activeFilterCount > 0 ? (
          <span
            role="button"
            aria-label={t("common.filter.clearAll")}
            className="group/clear relative inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-white/20 px-0.5"
            onClick={(e) => {
              e.stopPropagation()
              onClearAll()
            }}
          >
            <span className="text-[10px] tabular-nums group-hover/clear:invisible">
              {activeFilterCount}
            </span>
            <X className="absolute size-2.5 opacity-0 transition-opacity group-hover/clear:opacity-100" />
          </span>
        ) : null}
      </Button>

      {isOpen ? (
        <div
          className="absolute top-full right-0 z-50 mt-1.5 space-y-2 rounded-xl border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] p-2.5 shadow-lg backdrop-blur-xl"
          style={{ width: popoverWidth }}
        >
          {dimensions.map((dimension) => (
            <FilterPopoverGroup key={dimension.key} title={dimension.label}>
              <FilterPopoverChip
                active={dimension.value === "all"}
                onClick={() => onChangeFilter(dimension.key, "all")}
              >
                {dimension.allLabel}
              </FilterPopoverChip>
              {dimension.options.map((option) => (
                <FilterPopoverChip
                  key={option.value}
                  active={dimension.value === option.value}
                  onClick={() => onChangeFilter(dimension.key, option.value)}
                >
                  {option.label}
                </FilterPopoverChip>
              ))}
            </FilterPopoverGroup>
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function FilterAppliedChips({
  className,
  dimensions,
  onChangeFilter,
}: {
  className?: string
  dimensions: FilterPopoverDimension[]
  onChangeFilter: (key: string, value: string) => void
}) {
  const activeDimensions = dimensions.filter((dimension) => dimension.value !== "all")

  if (activeDimensions.length === 0) {
    return null
  }

  return (
    <div className={cn("flex flex-wrap gap-1", className)}>
      {activeDimensions.map((dimension) => {
        const option = dimension.options.find((entry) => entry.value === dimension.value)
        const valueLabel = option?.label ?? dimension.value

        return (
          <FilterAppliedChip
            key={dimension.key}
            label={`${dimension.label}: ${valueLabel}`}
            onRemove={() => onChangeFilter(dimension.key, "all")}
          />
        )
      })}
    </div>
  )
}

function FilterPopoverChip({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px] transition-colors",
        active
          ? "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)] text-[color:var(--text-primary)]"
          : "border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)] hover:border-[color:var(--surface-border)] hover:text-[color:var(--text-primary)]",
      )}
    >
      {children}
    </button>
  )
}

function FilterAppliedChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex max-w-full items-center gap-1 rounded-full border border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)] px-2 py-0.5 text-[11px] text-[color:var(--text-primary)] transition-colors hover:opacity-80"
    >
      <span className="truncate">{label}</span>
      <X className="size-3 shrink-0" />
    </button>
  )
}

function FilterPopoverGroup({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="space-y-1">
      <div className="text-[10px] font-medium tracking-wide text-[color:var(--text-muted)] uppercase">
        {title}
      </div>
      <div className="flex flex-wrap gap-1">{children}</div>
    </div>
  )
}
