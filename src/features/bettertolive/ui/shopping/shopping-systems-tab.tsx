import { Pencil } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { ShoppingOwnedItem } from "@/features/bettertolive/types"
import { EmptyState, Surface } from "@/features/bettertolive/ui/shared/shared"
import {
  AddCard,
  SystemSummaryChip,
} from "@/features/bettertolive/ui/shopping/shopping-page-shared"
import { SortableShoppingCard } from "@/features/bettertolive/ui/shopping/shopping-sortable-card"
import type {
  ShoppingPlanWithLane,
  ShoppingSystemOverview,
} from "@/features/bettertolive/ui/shopping/shopping-types"
import {
  laneDisplayName,
  systemDisplayName,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"
import { cn } from "@/lib/utils"

const SYSTEM_STATUS_STYLES = {
  active:
    "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]",
  pending:
    "border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]",
}

function SystemDetailItemRow({
  item,
  sourceLabel,
  isManagementMode,
  onEditOwned,
  onEditPlan,
}: {
  item: ShoppingSystemOverview["owned"][number] | ShoppingSystemOverview["planned"][number]
  sourceLabel: string
  isManagementMode?: boolean
  onEditOwned?: (item: ShoppingOwnedItem) => void
  onEditPlan?: (item: ShoppingPlanWithLane) => void
}) {
  const isPlanItem = "currentPrice" in item
  const summaryParts = [
    sourceLabel,
    item.category,
    item.spaces.length > 0 ? item.spaces.join(" / ") : null,
    isPlanItem ? item.reason : item.replacementCue,
  ].filter(Boolean)

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="min-w-0 truncate text-sm font-medium text-[color:var(--text-primary)]">
            {item.name}
          </div>
          <p className="mt-1 truncate text-sm leading-6 text-[color:var(--text-secondary)]">
            {summaryParts.join(" · ")}
          </p>
        </div>

        {isManagementMode ? (
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

function SystemDetailPanel({
  system,
  isManagementMode,
  onEditOwned,
  onEditPlan,
}: {
  system: ShoppingSystemOverview
  isManagementMode?: boolean
  onEditOwned?: (item: ShoppingOwnedItem) => void
  onEditPlan?: (item: ShoppingPlanWithLane) => void
}) {
  const { t } = useTranslation()
  const defaultItemTab = system.owned.length > 0 ? "owned" : "planned"

  return (
    <div className="flex h-full flex-col rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]">
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div>
          <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">
            {systemDisplayName(system.id, t)}
          </h3>
          <p className="mt-1 leading-6 text-[color:var(--text-secondary)]">{system.summary}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <SystemSummaryChip label={systemDisplayName(system.id, t)} />
          <Badge variant="outline" className={cn("border", SYSTEM_STATUS_STYLES.active)}>
            {t("shopping.systems.ownedBadge", { count: system.owned.length })}
          </Badge>
          <Badge variant="outline" className={cn("border", SYSTEM_STATUS_STYLES.pending)}>
            {t("shopping.systems.pendingBadge", { count: system.planned.length })}
          </Badge>
        </div>

        <p className="mt-4 text-sm leading-6 text-[color:var(--text-secondary)]">
          {t("shopping.systems.coreQuestion", { question: system.keyQuestion })}
        </p>

        <div className="mt-5 grid gap-4">
          <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
            <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
              {t("shopping.systems.secondaryGroups")}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {system.secondaryGroups.map((group) => (
                <SystemSummaryChip key={group} label={group} />
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
            <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
              {t("shopping.systems.spaces")}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {system.spaces.length > 0 ? (
                system.spaces.map((space) => <SystemSummaryChip key={space} label={space} />)
              ) : (
                <span className="text-sm text-[color:var(--text-muted)]">
                  {t("shopping.systems.noSpaceData")}
                </span>
              )}
            </div>
          </div>
        </div>

        <Tabs defaultValue={defaultItemTab} className="mt-5">
          <TabsList className="w-full">
            <TabsTrigger value="owned" className="text-xs">
              {t("shopping.systems.ownedLabel")} ({system.owned.length})
            </TabsTrigger>
            <TabsTrigger value="planned" className="text-xs">
              {t("shopping.systems.pendingLabel")} ({system.planned.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="owned" className="mt-4">
            {system.owned.length > 0 ? (
              <div className="space-y-3">
                {system.owned.map((item) => (
                  <SystemDetailItemRow
                    key={item.id}
                    item={item}
                    sourceLabel={t("shopping.systems.ownedLabel")}
                    isManagementMode={isManagementMode}
                    onEditOwned={onEditOwned}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[color:var(--text-muted)]">
                {t("shopping.systems.noOwnedItems")}
              </p>
            )}
          </TabsContent>

          <TabsContent value="planned" className="mt-4">
            {system.planned.length > 0 ? (
              <div className="space-y-3">
                {system.planned.map((item) => (
                  <SystemDetailItemRow
                    key={item.id}
                    item={item}
                    sourceLabel={laneDisplayName(item.laneId, item.laneTitle, t)}
                    isManagementMode={isManagementMode}
                    onEditPlan={onEditPlan}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-[color:var(--text-muted)]">
                {t("shopping.systems.noPendingItems")}
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

function SystemMapCard({
  definition,
  isSelected,
  onSelect,
  isManagementMode,
  onEditSystem,
}: {
  definition: ShoppingSystemOverview
  isSelected: boolean
  onSelect: (systemId: string) => void
  isManagementMode?: boolean
  onEditSystem?: (system: ShoppingSystemOverview) => void
}) {
  const { t } = useTranslation()
  const systemName = systemDisplayName(definition.id, t)

  return (
    <div
      role="button"
      tabIndex={0}
      className={cn(
        "relative flex w-full flex-col gap-1.5 overflow-hidden rounded-xl border px-2.5 py-2 text-left transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-[color:var(--tone-present-border)]",
        isSelected
          ? "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)]/40 shadow-[0_4px_16px_rgba(15,23,42,0.06)]"
          : "border-[color:var(--muted-surface-border)] bg-[color:var(--surface-bg)] hover:border-[color:var(--surface-border)] hover:shadow-[0_2px_8px_rgba(15,23,42,0.04)]",
      )}
      onClick={() => onSelect(definition.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect(definition.id)
        }
      }}
    >
      <div className="flex min-w-0 items-start gap-2 pr-6">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[11px] font-medium text-[color:var(--text-primary)]">
          {systemName.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-[color:var(--text-primary)]">
            {systemName}
          </div>
        </div>
      </div>

      {/* Row 2: Badges — no wrapping, overflow hidden */}
      <div className={cn("flex min-w-0 items-center gap-1.5 overflow-hidden")}>
        <Badge
          variant="outline"
          className="h-5 shrink-0 border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-1.5 text-[10px] text-[color:var(--text-muted)]"
        >
          {definition.owned.length} / {definition.planned.length}
        </Badge>
        {definition.urgentCount > 0 ? (
          <Badge
            variant="outline"
            className="h-5 shrink-0 border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)] px-1.5 text-[10px] text-[color:var(--tone-value-ink)]"
          >
            {t("shopping.systems.urgentBadge", { count: definition.urgentCount })}
          </Badge>
        ) : null}
      </div>

      {/* Row 3: Summary — single line with ellipsis truncation */}
      <p className={cn("truncate text-[12px] leading-5 text-[color:var(--text-secondary)]")}>
        {definition.summary}
      </p>

      {/* Row 4: Secondary group badges — no wrapping, overflow hidden */}
      <div className={cn("flex min-w-0 items-center gap-1.5 overflow-hidden opacity-45")}>
        {definition.secondaryGroups.slice(0, 2).map((group) => (
          <Badge
            key={group}
            variant="outline"
            className="h-5 shrink-0 border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-1.5 text-[10px] text-[color:var(--text-muted)]"
          >
            {group}
          </Badge>
        ))}
        {definition.secondaryGroups.length > 2 ? (
          <Badge
            variant="outline"
            className="h-5 shrink-0 border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-1.5 text-[10px] text-[color:var(--text-muted)]"
          >
            +{definition.secondaryGroups.length - 2}
          </Badge>
        ) : null}
      </div>

      {isManagementMode && onEditSystem ? (
        <Button
          size="icon-sm"
          variant="ghost"
          className="absolute top-2 right-2 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
          onClick={(e) => {
            e.stopPropagation()
            onEditSystem(definition)
          }}
        >
          <Pencil className="size-3.5" />
        </Button>
      ) : null}
    </div>
  )
}

export function ShoppingSystemsTab({
  systems,
  selectedSystemId,
  isFixedLayout,
  isManagementMode,
  onSelectSystem,
  onAddNew,
  onEditSystem,
  onEditOwned,
  onEditPlan,
  onReorder,
}: {
  systems: ShoppingSystemOverview[]
  selectedSystemId: string | null
  isFixedLayout: boolean
  isManagementMode?: boolean
  onSelectSystem: (systemId: string) => void
  onAddNew?: () => void
  onEditSystem?: (system: ShoppingSystemOverview) => void
  onEditOwned?: (item: ShoppingOwnedItem) => void
  onEditPlan?: (item: ShoppingPlanWithLane) => void
  onReorder?: (orderedIds: string[]) => void
}) {
  const { t } = useTranslation()
  const selectedSystem = systems.find((s) => s.id === selectedSystemId) ?? null

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const systemIdStrings = systems.map((s) => s.id)
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = systemIdStrings.indexOf(active.id as string)
      const newIndex = systemIdStrings.indexOf(over.id as string)
      if (oldIndex === -1 || newIndex === -1) return

      onReorder?.(arrayMove(systemIdStrings, oldIndex, newIndex))
    },
    [systemIdStrings, onReorder],
  )

  const gridContent = (
    <div className="grid min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:var(--muted-surface-border)_transparent] auto-rows-max grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2 overflow-y-auto pr-1">
      {isManagementMode && onAddNew ? <AddCard onClick={onAddNew} /> : null}
      {systems.length > 0 ? (
        systems.map((definition) =>
          isManagementMode ? (
            <SortableShoppingCard key={definition.id} id={definition.id}>
              <SystemMapCard
                definition={definition}
                isSelected={selectedSystemId === definition.id}
                onSelect={onSelectSystem}
                isManagementMode={isManagementMode}
                onEditSystem={onEditSystem}
              />
            </SortableShoppingCard>
          ) : (
            <SystemMapCard
              key={definition.id}
              definition={definition}
              isSelected={selectedSystemId === definition.id}
              onSelect={onSelectSystem}
            />
          ),
        )
      ) : !isManagementMode ? (
        <EmptyState message={t("shopping.systems.noSystemData")} />
      ) : null}
    </div>
  )

  return (
    <TabsContent
      value="systems"
      className={cn("space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
    >
      <div
        className={cn(
          "grid gap-4",
          isFixedLayout
            ? "min-h-0 flex-1 grid-cols-[2fr_1fr]"
            : "grid-cols-1 lg:grid-cols-[2fr_1fr]",
          isFixedLayout && "h-full",
        )}
      >
        {/* Left: System Cards */}
        <Surface className={cn("flex min-h-0 flex-col p-3", isFixedLayout && "min-h-0")}>
          {isManagementMode ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={systemIdStrings}>{gridContent}</SortableContext>
            </DndContext>
          ) : (
            gridContent
          )}
        </Surface>

        {/* Right: Detail Panel */}
        <div className="min-h-0 overflow-hidden">
          {selectedSystem ? (
            <SystemDetailPanel
              system={selectedSystem}
              isManagementMode={isManagementMode}
              onEditOwned={onEditOwned}
              onEditPlan={onEditPlan}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)]">
              <p className="text-sm text-[color:var(--text-muted)]">
                {t("shopping.systems.selectPrompt")}
              </p>
            </div>
          )}
        </div>
      </div>
    </TabsContent>
  )
}
