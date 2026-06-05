import { useCallback } from "react"
import { useTranslation } from "react-i18next"
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable"
import { House, Pencil } from "lucide-react"
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
import type { SpaceOverview } from "@/features/bettertolive/ui/shopping/shopping-types"
import type { ShoppingOwnedItem } from "@/features/bettertolive/types"
import type { ShoppingPlanWithLane } from "@/features/bettertolive/ui/shopping/shopping-types"
import {
  AddCard,
  SystemSummaryChip,
} from "@/features/bettertolive/ui/shopping/shopping-page-shared"
import { SortableShoppingCard } from "@/features/bettertolive/ui/shopping/shopping-sortable-card"
import { EmptyState, Surface } from "@/features/bettertolive/ui/shared/shared"
import {
  laneDisplayName,
  stageLikeDisplayName,
  systemDisplayName,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"
import { cn } from "@/lib/utils"

function SpaceDetailTable({
  space,
  isManagementMode,
  onEditOwned,
  onEditPlan,
}: {
  space: SpaceOverview
  isManagementMode?: boolean
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
      sourceLabel: laneDisplayName(item.laneId, item.laneTitle, t),
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
                <TableHead className="sticky left-0 z-10 bg-[color:var(--surface-bg)] text-xs tracking-[0.1em] text-[color:var(--text-muted)] uppercase">
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
                <TableHead
                  className={cn(
                    "z-10 bg-[color:var(--surface-bg)] text-xs tracking-[0.1em] text-[color:var(--text-muted)] uppercase",
                    isManagementMode ? "sticky right-[40px]" : "sticky right-0",
                  )}
                >
                  {t("shopping.spaces.table.tag")}
                </TableHead>
                <TableHead className="sticky right-0 z-10 w-[40px] bg-[color:var(--surface-bg)]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {allItems.map(({ item, sourceLabel, sourceType }) => {
                const isPlanItem = "currentPrice" in item
                return (
                  <TableRow key={item.id}>
                    <TableCell className="sticky left-0 z-10 bg-[color:var(--surface-bg)]">
                      <div className="text-sm text-[color:var(--text-primary)]">{item.name}</div>
                      <div className="truncate text-[11px] text-[color:var(--text-muted)]">
                        {isPlanItem ? item.reason : item.replacementCue}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-[color:var(--text-secondary)]">
                      {systemDisplayName(item.system, t)}
                    </TableCell>
                    <TableCell className="text-sm text-[color:var(--text-secondary)]">
                      {item.category}
                    </TableCell>
                    <TableCell className="text-sm text-[color:var(--text-secondary)]">
                      {item.stages.map((stage) => stageLikeDisplayName(stage, t)).join(", ")}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "z-10 bg-[color:var(--surface-bg)]",
                        isManagementMode ? "sticky right-[40px]" : "sticky right-0",
                      )}
                    >
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
                    <TableCell className="sticky right-0 z-10 bg-[color:var(--surface-bg)]">
                      {isManagementMode ? (
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
                      ) : null}
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
            <SystemSummaryChip key={system} label={systemDisplayName(system, t)} />
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
  onEditSpace,
}: {
  space: SpaceOverview
  isSelected: boolean
  onSelect: (spaceName: string) => void
  isManagementMode?: boolean
  onEditSpace?: (space: SpaceOverview) => void
}) {
  const { t } = useTranslation()
  const totalItems = space.owned.length + space.planned.length
  const isActive = totalItems > 0

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
      role="button"
      tabIndex={0}
      className={cn(
        "relative flex w-full flex-col gap-1.5 overflow-hidden rounded-xl border px-2.5 py-2 text-left transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-[color:var(--tone-present-border)]",
        isActive
          ? "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]"
          : "border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)]",
        isSelected &&
          "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)]/40 shadow-[0_4px_16px_rgba(15,23,42,0.06)]",
      )}
      onClick={() => onSelect(space.name)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect(space.name)
        }
      }}
    >
      <div className="flex min-w-0 items-start gap-2 pr-6">
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

      <div className={cn("flex min-w-0 items-center gap-1.5 overflow-hidden")}>
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

      <p className={cn("truncate text-[12px] leading-5 text-[color:var(--text-secondary)]")}>
        {summaryText}
      </p>

      <div className={cn("flex min-w-0 items-center gap-1.5 overflow-hidden opacity-45")}>
        {Array.from(space.systems)
          .slice(0, 3)
          .map((system) => (
            <Badge
              key={system}
              variant="outline"
              className="h-5 shrink-0 border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-1.5 text-[10px] text-[color:var(--text-muted)]"
            >
              {systemDisplayName(system, t)}
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

      {isManagementMode && onEditSpace ? (
        <Button
          size="icon-sm"
          variant="ghost"
          className="absolute top-2 right-2 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
          onClick={(e) => {
            e.stopPropagation()
            onEditSpace(space)
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
  onAddNew,
  onEditSpace,
  onEditOwned,
  onEditPlan,
  onReorder,
}: {
  spaces: SpaceOverview[]
  selectedSpaceName: string | null
  isFixedLayout: boolean
  isManagementMode?: boolean
  onSelectSpace: (spaceName: string) => void
  onAddNew?: () => void
  onEditSpace?: (space: SpaceOverview) => void
  onEditOwned?: (item: ShoppingOwnedItem) => void
  onEditPlan?: (item: ShoppingPlanWithLane) => void
  onReorder?: (orderedNames: string[]) => void
}) {
  const { t } = useTranslation()
  const selectedSpace = spaces.find((s) => s.name === selectedSpaceName) ?? null

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const spaceNames = spaces.map((s) => s.name)
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = spaceNames.indexOf(active.id as string)
      const newIndex = spaceNames.indexOf(over.id as string)
      if (oldIndex === -1 || newIndex === -1) return

      onReorder?.(arrayMove(spaceNames, oldIndex, newIndex))
    },
    [spaceNames, onReorder],
  )

  const gridContent = (
    <div className="grid min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:var(--muted-surface-border)_transparent] auto-rows-max grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2 overflow-y-auto pr-1">
      {isManagementMode && onAddNew ? <AddCard onClick={onAddNew} /> : null}
      {spaces.length > 0 ? (
        spaces.map((space) =>
          isManagementMode ? (
            <SortableShoppingCard key={space.name} id={space.name}>
              <SpaceMapCard
                space={space}
                isSelected={selectedSpaceName === space.name}
                onSelect={onSelectSpace}
                isManagementMode={isManagementMode}
                onEditSpace={onEditSpace}
              />
            </SortableShoppingCard>
          ) : (
            <SpaceMapCard
              key={space.name}
              space={space}
              isSelected={selectedSpaceName === space.name}
              onSelect={onSelectSpace}
            />
          ),
        )
      ) : !isManagementMode ? (
        <EmptyState message={t("shopping.spaces.noSpaceData")} />
      ) : null}
    </div>
  )

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
          {isManagementMode ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={spaceNames}>{gridContent}</SortableContext>
            </DndContext>
          ) : (
            gridContent
          )}
        </Surface>

        {/* Right: Detail Panel */}
        <div className="min-h-0 overflow-hidden">
          {selectedSpace ? (
            <SpaceDetailTable
              space={selectedSpace}
              isManagementMode={isManagementMode}
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
