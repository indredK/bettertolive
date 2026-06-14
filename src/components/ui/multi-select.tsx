"use client"

import { Check, ChevronDown, Search, X } from "lucide-react"
import * as React from "react"
import { Popover } from "@base-ui/react/popover"
import { useTranslation } from "react-i18next"

import { cn } from "@/lib/utils"
import { UI_LAYERS } from "@/lib/ui-layers"

export type MultiSelectOption = {
  value: string
  label: string
}

type MultiSelectProps = {
  options: MultiSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  maxItems?: number
  disabled?: boolean
  className?: string
}

export function MultiSelect({
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  maxItems,
  disabled = false,
  className,
}: MultiSelectProps) {
  const { t } = useTranslation()
  const resolvedPlaceholder = placeholder ?? t("common.multiSelect.placeholder")
  const resolvedSearchPlaceholder = searchPlaceholder ?? t("common.multiSelect.searchPlaceholder")
  const resolvedEmptyMessage = emptyMessage ?? t("common.multiSelect.emptyMessage")
  const [open, setOpen] = React.useState(false)
  const [search, setSearch] = React.useState("")
  const searchInputRef = React.useRef<HTMLInputElement>(null)
  const valueSet = React.useMemo(() => new Set(value), [value])

  const filteredOptions = React.useMemo(() => {
    if (!search.trim()) return options
    const lower = search.toLowerCase()
    return options.filter((opt) => opt.label.toLowerCase().includes(lower))
  }, [options, search])

  const selectedOptions = React.useMemo(
    () => options.filter((opt) => valueSet.has(opt.value)),
    [options, valueSet],
  )

  const toggleOption = React.useCallback(
    (optValue: string) => {
      if (valueSet.has(optValue)) {
        onChange(value.filter((v) => v !== optValue))
      } else {
        if (maxItems !== undefined && value.length >= maxItems) return
        onChange([...value, optValue])
      }
    },
    [value, valueSet, onChange, maxItems],
  )

  const removeOption = React.useCallback(
    (optValue: string) => {
      onChange(value.filter((v) => v !== optValue))
    },
    [value, onChange],
  )

  const handleOpenChange = React.useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      setSearch("")
    }
  }, [])

  // focus search input when popover opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 50)
    }
  }, [open])

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange} modal={false}>
      <Popover.Trigger
        disabled={disabled}
        className={cn(
          "flex min-h-9 w-full items-center justify-between gap-1 rounded-md border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-2 py-1.5 text-sm text-[color:var(--text-primary)] shadow-none transition-colors hover:bg-[color:var(--muted-surface-bg)] disabled:cursor-not-allowed disabled:opacity-50",
          open &&
            "border-[color:var(--tone-present-border)] ring-1 ring-[color:var(--tone-present-border)]/20",
          className,
        )}
      >
        <div className="flex min-w-0 flex-1 flex-wrap gap-1">
          {selectedOptions.length === 0 ? (
            <span className="text-[color:var(--text-muted)]">{resolvedPlaceholder}</span>
          ) : (
            selectedOptions.map((option) => {
              return (
                <span
                  key={option.value}
                  className="inline-flex items-center gap-0.5 rounded-md border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-1.5 py-0.5 text-[11px] leading-4 text-[color:var(--text-secondary)]"
                >
                  <span className="max-w-[120px] truncate">{option.label}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      removeOption(option.value)
                    }}
                    className="ml-0.5 inline-flex size-3.5 shrink-0 items-center justify-center rounded-sm text-[color:var(--text-muted)] hover:bg-[color:var(--surface-border)] hover:text-[color:var(--text-primary)]"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )
            })
          )}
        </div>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-[color:var(--text-muted)] transition-transform",
            open && "rotate-180",
          )}
        />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Positioner sideOffset={4} className={UI_LAYERS.floatingContent}>
          <Popover.Popup
            className={cn(
              "w-[var(--available-width)] max-w-[360px] min-w-[200px] overflow-hidden rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-1 shadow-lg",
            )}
          >
            <div className="flex items-center border-b border-[color:var(--surface-border)] px-2 pb-1">
              <Search className="mr-1.5 size-3.5 shrink-0 text-[color:var(--text-muted)]" />
              <input
                ref={searchInputRef}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={resolvedSearchPlaceholder}
                className="flex-1 bg-transparent py-1.5 text-sm text-[color:var(--text-primary)] outline-none placeholder:text-[color:var(--text-muted)]"
              />
            </div>

            <div className="max-h-60 overflow-y-auto py-1">
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-[color:var(--text-muted)]">
                  {resolvedEmptyMessage}
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = valueSet.has(opt.value)
                  const isAtLimit =
                    maxItems !== undefined && !isSelected && value.length >= maxItems
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isAtLimit}
                      onClick={() => toggleOption(opt.value)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm leading-5 transition-colors",
                        isSelected
                          ? "bg-[color:var(--tone-present-bg)]/35 text-[color:var(--text-primary)]"
                          : "text-[color:var(--text-secondary)] hover:bg-[color:var(--muted-surface-bg)]",
                        isAtLimit && "cursor-not-allowed opacity-40",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded border",
                          isSelected
                            ? "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-border)]"
                            : "border-[color:var(--surface-border)]",
                        )}
                      >
                        {isSelected && <Check className="size-3 text-white" />}
                      </span>
                      <span className="truncate">{opt.label}</span>
                    </button>
                  )
                })
              )}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  )
}
