import { Search } from "lucide-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { Input } from "@/components/ui/input"
import {
  FilterAppliedChips,
  FilterPopoverButton,
  type FilterPopoverDimension,
} from "@/features/bettertolive/shared/filter-popover"
import { Surface } from "@/features/bettertolive/shared/shared"
import { cn } from "@/lib/utils"

export function FilterablePanel({
  bodyClassName,
  children,
  className,
  dimensions,
  header,
  onSearchQueryChange,
  onChangeFilter,
  onClearAll,
  popoverWidth,
  searchQuery,
  searchAriaLabel,
  searchPlaceholder,
}: {
  bodyClassName?: string
  children?: ReactNode
  className?: string
  dimensions: FilterPopoverDimension[]
  header?: ReactNode
  onSearchQueryChange: (value: string) => void
  onChangeFilter: (key: string, value: string) => void
  onClearAll: () => void
  popoverWidth?: string
  searchQuery: string
  searchAriaLabel?: string
  searchPlaceholder?: string
}) {
  const { t } = useTranslation()

  return (
    <Surface className={cn("shrink-0 p-3", className)}>
      <div className="space-y-2.5">
        {header ? <div>{header}</div> : null}

        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
            <Input
              value={searchQuery}
              onChange={(event) => onSearchQueryChange(event.currentTarget.value)}
              className="h-9 w-full border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] pl-9 text-sm text-[color:var(--text-primary)] shadow-none placeholder:text-[color:var(--text-muted)]"
              placeholder={searchPlaceholder ?? t("shell.searchPlaceholder")}
              aria-label={searchAriaLabel ?? t("shell.searchAria")}
            />
          </div>

          <FilterPopoverButton
            className="shrink-0"
            dimensions={dimensions}
            popoverWidth={popoverWidth}
            onChangeFilter={onChangeFilter}
            onClearAll={onClearAll}
          />
        </div>

        <FilterAppliedChips
          className="min-w-0"
          dimensions={dimensions}
          onChangeFilter={onChangeFilter}
        />
      </div>

      {children ? <div className={cn("mt-3", bodyClassName)}>{children}</div> : null}
    </Surface>
  )
}
