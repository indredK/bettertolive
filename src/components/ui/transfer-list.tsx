import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react"
import { useMemo, useState, type ReactNode } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

export type TransferListItem = {
  id: string
  title: string
  description?: string | null
  meta?: ReactNode
  searchText?: string
}

export type TransferListLabels = {
  availableTitle: string
  selectedTitle: string
  searchPlaceholder: string
  emptyAvailable: string
  emptySelected: string
  addChecked: string
  addAll: string
  removeChecked: string
  removeAll: string
}

type TransferListItemLayout = "default" | "compact"

export function TransferList({
  items,
  selectedIds,
  onChange,
  labels,
  description,
  className,
  itemLayout = "default",
}: {
  items: TransferListItem[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  labels: TransferListLabels
  description?: ReactNode
  className?: string
  itemLayout?: TransferListItemLayout
}) {
  const [availableSearch, setAvailableSearch] = useState("")
  const [selectedSearch, setSelectedSearch] = useState("")
  const [rawAvailableChecked, setRawAvailableChecked] = useState<string[]>([])
  const [rawSelectedChecked, setRawSelectedChecked] = useState<string[]>([])

  const itemMap = useMemo(() => new Map(items.map((item) => [item.id, item])), [items])
  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const selectedItems = useMemo(
    () =>
      selectedIds
        .map((id) => itemMap.get(id))
        .filter((item): item is TransferListItem => Boolean(item)),
    [itemMap, selectedIds],
  )

  const availableItems = useMemo(
    () => items.filter((item) => !selectedIdSet.has(item.id)),
    [items, selectedIdSet],
  )

  const filteredAvailableItems = useMemo(
    () => filterTransferItems(availableItems, availableSearch),
    [availableItems, availableSearch],
  )
  const filteredSelectedItems = useMemo(
    () => filterTransferItems(selectedItems, selectedSearch),
    [selectedItems, selectedSearch],
  )

  // Prune checked sets when items change (derive during render, React 19 compatible)
  const availableChecked = useMemo(() => {
    const validIds = new Set(availableItems.map((item) => item.id))
    return new Set(rawAvailableChecked.filter((id) => validIds.has(id)))
  }, [availableItems, rawAvailableChecked])

  const selectedChecked = useMemo(() => {
    const validIds = new Set(selectedItems.map((item) => item.id))
    return new Set(rawSelectedChecked.filter((id) => validIds.has(id)))
  }, [selectedItems, rawSelectedChecked])

  const commit = (nextIds: string[]) => {
    onChange(nextIds)
    setRawAvailableChecked([])
    setRawSelectedChecked([])
  }

  const handleAddAll = () => {
    const nextIds = [...selectedIds, ...filteredAvailableItems.map((item) => item.id)]
    commit(Array.from(new Set(nextIds)))
  }

  const handleAddChecked = () => {
    const nextIds = [...selectedIds, ...Array.from(availableChecked)]
    commit(Array.from(new Set(nextIds)))
  }

  const handleRemoveChecked = () => {
    commit(selectedIds.filter((id) => !selectedChecked.has(id)))
  }

  const handleRemoveAll = () => {
    const removeSet = new Set(filteredSelectedItems.map((item) => item.id))
    commit(selectedIds.filter((id) => !removeSet.has(id)))
  }

  return (
    <div className={cn("flex h-full min-h-[24rem] flex-col gap-3", className)}>
      {description ? (
        <div className="text-muted-foreground shrink-0 text-xs leading-5">{description}</div>
      ) : null}

      <div className="grid min-h-0 flex-1 gap-3 xl:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <TransferListPanel
          title={labels.availableTitle}
          count={filteredAvailableItems.length}
          totalCount={availableItems.length}
          searchValue={availableSearch}
          onSearchChange={setAvailableSearch}
          checkedIds={availableChecked}
          onToggleChecked={(itemId) => {
            setRawAvailableChecked((current) =>
              current.includes(itemId)
                ? current.filter((id) => id !== itemId)
                : [...current, itemId],
            )
          }}
          items={filteredAvailableItems}
          emptyMessage={labels.emptyAvailable}
          searchPlaceholder={labels.searchPlaceholder}
          itemLayout={itemLayout}
        />

        <div className="flex flex-row items-center justify-center gap-2 xl:flex-col">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={handleAddAll}
            disabled={filteredAvailableItems.length === 0}
            title={labels.addAll}
            aria-label={labels.addAll}
          >
            <ChevronsRight />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={handleAddChecked}
            disabled={availableChecked.size === 0}
            title={labels.addChecked}
            aria-label={labels.addChecked}
          >
            <ChevronRight />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={handleRemoveChecked}
            disabled={selectedChecked.size === 0}
            title={labels.removeChecked}
            aria-label={labels.removeChecked}
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            onClick={handleRemoveAll}
            disabled={filteredSelectedItems.length === 0}
            title={labels.removeAll}
            aria-label={labels.removeAll}
          >
            <ChevronsLeft />
          </Button>
        </div>

        <TransferListPanel
          title={labels.selectedTitle}
          count={filteredSelectedItems.length}
          totalCount={selectedItems.length}
          searchValue={selectedSearch}
          onSearchChange={setSelectedSearch}
          checkedIds={selectedChecked}
          onToggleChecked={(itemId) => {
            setRawSelectedChecked((current) =>
              current.includes(itemId)
                ? current.filter((id) => id !== itemId)
                : [...current, itemId],
            )
          }}
          items={filteredSelectedItems}
          emptyMessage={labels.emptySelected}
          searchPlaceholder={labels.searchPlaceholder}
          itemLayout={itemLayout}
        />
      </div>
    </div>
  )
}

function TransferListPanel({
  title,
  count,
  totalCount,
  searchValue,
  onSearchChange,
  checkedIds,
  onToggleChecked,
  items,
  emptyMessage,
  searchPlaceholder,
  itemLayout,
}: {
  title: string
  count: number
  totalCount: number
  searchValue: string
  onSearchChange: (value: string) => void
  checkedIds: Set<string>
  onToggleChecked: (itemId: string) => void
  items: TransferListItem[]
  emptyMessage: string
  searchPlaceholder: string
  itemLayout: TransferListItemLayout
}) {
  const hasSearch = searchValue.trim().length > 0

  return (
    <div className="border-foreground/10 bg-card/70 flex min-h-0 flex-col overflow-hidden rounded-xl border p-3">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="text-sm font-medium">{title}</div>
        <Badge variant="outline" className="text-muted-foreground text-[10px]">
          {hasSearch ? `${count} / ${totalCount}` : totalCount}
        </Badge>
      </div>

      <div className="mt-2 shrink-0">
        <div className="border-foreground/10 bg-background/70 flex items-center gap-1.5 rounded-md border px-2 py-1">
          <Search className="text-muted-foreground h-3 w-3 shrink-0" />
          <Input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-6 min-w-0 border-0 bg-transparent px-0 text-xs shadow-none focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="mt-3 max-h-72 min-h-32 flex-1 overflow-y-auto pr-1 xl:max-h-none xl:min-h-0">
        {items.length === 0 ? (
          <div className="border-foreground/15 bg-muted/15 text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-xs">
            {emptyMessage}
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <label
                key={item.id}
                className={cn(
                  "border-foreground/10 flex cursor-pointer items-start rounded-lg border transition-colors",
                  itemLayout === "compact" ? "gap-2 p-2.5" : "gap-3 p-3",
                  checkedIds.has(item.id)
                    ? "bg-muted/45 ring-foreground/10 ring-1"
                    : "bg-background/85 hover:bg-muted/35",
                )}
              >
                <Checkbox
                  checked={checkedIds.has(item.id)}
                  onCheckedChange={() => onToggleChecked(item.id)}
                  className={cn("shrink-0", itemLayout === "compact" ? "mt-0.5" : "mt-0.5")}
                />
                <div className="min-w-0 flex-1">
                  {itemLayout === "compact" ? (
                    <>
                      <div className="flex min-w-0 items-start justify-between gap-2">
                        <div className="min-w-0 flex-1 truncate text-sm leading-5 font-medium">
                          {item.title}
                        </div>
                        {item.meta ? <div className="shrink-0">{item.meta}</div> : null}
                      </div>
                      {item.description ? (
                        <div className="text-muted-foreground mt-0.5 line-clamp-2 text-xs leading-5">
                          {item.description}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <div className="truncate text-sm font-medium">{item.title}</div>
                      {item.description ? (
                        <div className="text-muted-foreground mt-1 text-xs">{item.description}</div>
                      ) : null}
                      {item.meta ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">{item.meta}</div>
                      ) : null}
                    </>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function filterTransferItems(items: TransferListItem[], search: string) {
  const normalizedSearch = search.trim().toLowerCase()
  if (!normalizedSearch) return items

  return items.filter((item) =>
    [item.title, item.description, item.searchText]
      .join(" ")
      .toLowerCase()
      .includes(normalizedSearch),
  )
}
