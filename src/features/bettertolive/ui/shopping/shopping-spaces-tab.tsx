import { useTranslation } from "react-i18next"
import { GripVertical, House, Pencil } from "lucide-react"
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
import { TabsContent } from "@/components/ui/tabs"
import type { SpaceOverview } from "@/features/bettertolive/ui/shopping/shopping-space-detail-dialog"
import type { ShoppingOwnedItem } from "@/features/bettertolive/types"
import type { ShoppingPlanWithLane } from "@/features/bettertolive/ui/shopping/shopping-system-detail-dialog"
import { AddCard } from "@/features/bettertolive/ui/shopping/shopping-page-shared"
import { EmptyState, Surface } from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"

function SystemSummaryChip({ label }: { label: string }) {
  return (
    <Badge
      variant="outline"
      className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
    >
      {label}
    </Badge>
  )
}

function SpaceDetailTable({
  space,
  onEditOwned,
  onEditPlan,
}: {
  space: SpaceOverview
  onEditOwned?: (item: ShoppingOwnedItem) => void
  onEditPlan?: (item: ShoppingPlanWithLane) => void
}) {
  const { t } = useTranslation()
  const totalItems = space.owned.length + space.planned.length
  const isEmpty = totalItems === 0
  const ownedLabel = t("shopping.spaces.table.owned")

  const allItems: Array<{
    item: ShoppingOwnedItem | ShoppingPlanWithLane
    sourceLabel: string
    sourceType: "owned" | "planned"
  }> = [
    ...space.owned.map((item) => ({
      item,
      sourceLabel: ownedLabel,
      sourceType: "owned" as const,
    })),
    ...space.planned.map((item) => ({
      item,
      sourceLabel: item.laneTitle,
      sourceType: "planned" as const,
    })),
  ]

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]">
      {/* Fixed header */}
      <div className="shrink-0 p-4 pb-0">
        <h3 className="flex items-center gap-2 text-base font-semibold text-[color:var(--text-primary)]">
          <House className="size-4.5" />
          {space.name}
        </h3>
        <p className="mt-0.5 text-sm text-[color:var(--text-secondary)]">
          {t("shopping.spaces.totalItemsAndSystems", {
            total: totalItems,
            systems: space.systems.size,
          })}
        </p>
      </div>

      {/* Scrollable table */}
      <div className="min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:var(--muted-surface-border)_transparent] overflow-y-auto p-4 pt-2">
        {isEmpty ? (
          <p className="text-sm text-[color:var(--text-muted)]">
            {t("shopping.spaces.noItemsInSpace")}
          </p>
        ) : (
          <Table className="whitespace-nowrap">
            <TableHeader className="sticky top-0 z-10 bg-[color:var(--surface-bg)] shadow-[0_1px_0_0_var(--muted-surface-border)]">
              <TableRow>
                <TableHead className="text-xs tracking-[0.1em] text-[color:var(--text-muted)] uppercase">
                  {t("shopping.spaces.table.itemName")}
                </TableHead>
                <TableHead className="text-xs tracking-[0.1em] text-[color:var(--text-muted)] uppercase">
                  {t("shopping.spaces.table.system")}
                </TableHead>
                <TableHead className="text-xs tracking-[0.1em] text-[color:var(--text-muted)] uppercase">
                  {t("shopping.spaces.table.category")}
                </TableHead>
                <TableHead className="text-xs tracking-[0.1em] text-[color:var(--text-muted)] uppercase">
                  {t("shopping.spaces.table.stage")}
                </TableHead>
                <TableHead className="text-xs tracking-[0.1em] text-[color:var(--text-muted)] uppercase">
                  {t("shopping.spaces.table.tag")}
                </TableHead>
                <TableHead className="w-[40px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {allItems.map(({ item, sourceLabel, sourceType }) => {
                const isPlanItem = "currentPrice" in item
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="text-sm text-[color:var(--text-primary)]">{item.name}</div>
                      <div className="truncate text-[11px] text-[color:var(--text-muted)]">
                        {isPlanItem ? item.reason : item.replacementCue}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[color:var(--text-secondary)]">
                      {item.system}
                    </TableCell>
                    <TableCell className="text-sm text-[color:var(--text-secondary)]">
                      {item.category}
                    </TableCell>
                    <TableCell className="text-sm text-[color:var(--text-secondary)]">
                      {item.stages.join(", ")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "h-5 px-1.5 text-[10px]",
                          sourceLabel === ownedLabel
                            ? "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]"
                            : "border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]",
                        )}
                      >
                        {sourceLabel}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
                        onClick={(e) => {
                          e.stopPropagation()
                          if (sourceType === "planned" && onEditPlan) {
                            onEditPlan(item as ShoppingPlanWithLane)
                          } else if (sourceType === "owned" && onEditOwned) {
                            onEditOwned(item as ShoppingOwnedItem)
                          }
                        }}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Fixed footer */}
      <div className="shrink-0 border-t border-[color:var(--muted-surface-border)] px-4 py-3">
        <div className="flex flex-wrap gap-1.5">
          {Array.from(space.systems).map((system) => (
            <SystemSummaryChip key={system} label={system} />
          ))}
        </div>
      </div>
    </div>
  )
}

function SpaceMapCard({
  space,
  isSelected,
  onSelect,
  isManagementMode,
  onEditOwned,
  onEditPlan,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  space: SpaceOverview
  isSelected: boolean
  onSelect: (spaceName: string) => void
  isManagementMode?: boolean
  onEditOwned?: (item: ShoppingOwnedItem) => void
  onEditPlan?: (item: ShoppingPlanWithLane) => void
  onDragStart?: (e: React.DragEvent, name: string) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent, name: string) => void
}) {
  const { t } = useTranslation()
  const totalItems = space.owned.length + space.planned.length
  const isActive = totalItems > 0
  const firstOwned = space.owned[0]
  const firstPlanned = space.planned[0]

  const summaryText = isActive
    ? (() => {
        const ownedList = space.owned.map((i) => i.name).slice(0, 3)
        const plannedList = space.planned.map((i) => i.name).slice(0, 2)
        if (space.owned.length > 3 || space.planned.length > 2) {
          return t("shopping.spaces.itemSummaryMore", {
            ownedList: ownedList.join("、"),
            plannedList: plannedList.join("、"),
          })
        }
        return t("shopping.spaces.itemSummary", {
          owned: ownedList.join("、"),
          planned: plannedList.join("、"),
        })
      })()
    : t("shopping.spaces.noItemData")

  return (
    <div
      className="relative"
      draggable={isManagementMode}
      onDragStart={isManagementMode && onDragStart ? (e) => onDragStart(e, space.name) : undefined}
      onDragOver={isManagementMode && onDragOver ? onDragOver : undefined}
      onDrop={isManagementMode && onDrop ? (e) => onDrop(e, space.name) : undefined}
    >
      <button
        type="button"
        onClick={() => onSelect(space.name)}
        className={cn(
          "flex w-[210px] shrink-0 flex-col gap-1.5 overflow-hidden rounded-xl border px-2.5 py-2 text-left transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-[color:var(--tone-present-border)]",
          isManagementMode && "pl-0",
          isActive
            ? "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]"
            : "border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)]",
          isSelected &&
            "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)]/40 shadow-[0_4px_16px_rgba(15,23,42,0.06)]",
          isManagementMode && "cursor-grab active:cursor-grabbing",
        )}
      >
        <div className="flex min-w-0 items-start gap-2 pr-6">
          {isManagementMode ? (
            <div className="flex size-6 shrink-0 items-center justify-center text-[color:var(--text-muted)]">
              <GripVertical className="size-3.5" />
            </div>
          ) : null}
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[11px] font-medium text-[color:var(--text-primary)]">
            <House className="size-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-[color:var(--text-primary)]">
              {space.name}
            </div>
            <div className="truncate text-[11px] text-[color:var(--text-muted)]">
              {t("shopping.spaces.associatedSystemsCount", { count: space.systems.size })}
            </div>
          </div>
        </div>

        <div
          className={cn(
            "flex min-w-0 items-center gap-1.5 overflow-hidden",
            isManagementMode && "pl-8",
          )}
        >
          <Badge
            variant="outline"
            className="h-5 shrink-0 border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-1.5 text-[10px] text-[color:var(--text-muted)]"
          >
            {space.owned.length} / {space.planned.length}
          </Badge>
          {space.planned.length > 0 ? (
            <Badge
              variant="outline"
              className="h-5 shrink-0 border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)] px-1.5 text-[10px] text-[color:var(--tone-value-ink)]"
            >
              {t("shopping.spaces.pendingBadge", { count: space.planned.length })}
            </Badge>
          ) : null}
        </div>

        <p
          className={cn(
            "truncate text-[12px] leading-5 text-[color:var(--text-secondary)]",
            isManagementMode && "pl-8",
          )}
        >
          {summaryText}
        </p>

        <div
          className={cn(
            "flex min-w-0 items-center gap-1.5 overflow-hidden opacity-45",
            isManagementMode && "pl-8",
          )}
        >
          {Array.from(space.systems)
            .slice(0, 3)
            .map((system) => (
              <Badge
                key={system}
                variant="outline"
                className="h-5 shrink-0 border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-1.5 text-[10px] text-[color:var(--text-muted)]"
              >
                {system}
              </Badge>
            ))}
          {space.systems.size > 3 ? (
            <Badge
              variant="outline"
              className="h-5 shrink-0 border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-1.5 text-[10px] text-[color:var(--text-muted)]"
            >
              +{space.systems.size - 3}
            </Badge>
          ) : null}
        </div>
      </button>

      {isManagementMode && isActive ? (
        <Button
          size="icon-sm"
          variant="ghost"
          className="absolute top-2 right-2 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
          onClick={(e) => {
            e.stopPropagation()
            if (firstOwned && onEditOwned) {
              onEditOwned(firstOwned)
            } else if (firstPlanned && onEditPlan) {
              onEditPlan(firstPlanned)
            }
          }}
        >
          <Pencil className="size-3.5" />
        </Button>
      ) : null}
    </div>
  )
}

export function ShoppingSpacesTab({
  spaces,
  selectedSpaceName,
  isFixedLayout,
  isManagementMode,
  onSelectSpace,
  onEditOwned,
  onEditPlan,
  onAddNew,
}: {
  spaces: SpaceOverview[]
  selectedSpaceName: string | null
  isFixedLayout: boolean
  isManagementMode?: boolean
  onSelectSpace: (spaceName: string) => void
  onEditOwned?: (item: ShoppingOwnedItem) => void
  onEditPlan?: (item: ShoppingPlanWithLane) => void
  onAddNew?: () => void
}) {
  const { t } = useTranslation()
  const selectedSpace = spaces.find((s) => s.name === selectedSpaceName) ?? null

  const handleDragStart = (e: React.DragEvent, name: string) => {
    e.dataTransfer.setData("text/plain", name)
    e.dataTransfer.effectAllowed = "move"
    ;(e.currentTarget as HTMLElement).style.opacity = "0.5"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetName: string) => {
    e.preventDefault()
    const dragName = e.dataTransfer.getData("text/plain")
    if (dragName === targetName) return
    onSelectSpace(dragName)
  }

  return (
    <TabsContent
      value="spaces"
      className={cn("space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
    >
      <div
        className={cn(
          "grid gap-4",
          isFixedLayout
            ? "min-h-0 flex-1 grid-cols-[1fr_2fr]"
            : "grid-cols-1 lg:grid-cols-[1fr_2fr]",
          isFixedLayout && "h-full",
        )}
      >
        {/* Left: Space Cards */}
        <Surface className={cn("flex min-h-0 flex-col p-3", isFixedLayout && "min-h-0")}>
          <div className="flex min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:var(--muted-surface-border)_transparent] flex-wrap content-start gap-2 overflow-y-auto pr-1">
            {isManagementMode && onAddNew ? <AddCard onClick={onAddNew} /> : null}
            {spaces.length > 0 ? (
              spaces.map((space) => (
                <SpaceMapCard
                  key={space.name}
                  space={space}
                  isSelected={selectedSpaceName === space.name}
                  onSelect={onSelectSpace}
                  isManagementMode={isManagementMode}
                  onEditOwned={onEditOwned}
                  onEditPlan={onEditPlan}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              ))
            ) : !isManagementMode ? (
              <EmptyState message={t("shopping.spaces.noSpaceData")} />
            ) : null}
          </div>
        </Surface>

        {/* Right: Detail Panel */}
        <div className="min-h-0 overflow-hidden">
          {selectedSpace ? (
            <SpaceDetailTable
              space={selectedSpace}
              onEditOwned={onEditOwned}
              onEditPlan={onEditPlan}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)]">
              <p className="text-sm text-[color:var(--text-muted)]">
                {t("shopping.spaces.selectPrompt")}
              </p>
            </div>
          )}
        </div>
      </div>
    </TabsContent>
  )
}
