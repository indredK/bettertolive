import { GripVertical, Pencil } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TabsContent } from "@/components/ui/tabs"
import type { ShoppingOwnedItem } from "@/features/bettertolive/types"
import { EmptyState, Surface } from "@/features/bettertolive/ui/shared/shared"
import { AddCard } from "@/features/bettertolive/ui/shopping/shopping-page-shared"
import type {
  ShoppingPlanWithLane,
  ShoppingSystemOverview,
} from "@/features/bettertolive/ui/shopping/shopping-system-detail-dialog"
import { cn } from "@/lib/utils"

const SYSTEM_STATUS_STYLES = {
  active:
    "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]",
  pending:
    "border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]",
}

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

function SystemDetailItemRow({
  item,
  sourceLabel,
  onEditOwned,
  onEditPlan,
}: {
  item: ShoppingSystemOverview["owned"][number] | ShoppingSystemOverview["planned"][number]
  sourceLabel: string
  onEditOwned?: (item: ShoppingOwnedItem) => void
  onEditPlan?: (item: ShoppingPlanWithLane) => void
}) {
  const isPlanItem = "currentPrice" in item

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 truncate text-sm font-medium text-[color:var(--text-primary)]">
              {item.name}
            </span>
            <Badge
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
            >
              {sourceLabel}
            </Badge>
          </div>

          <div className="mt-2 text-xs leading-5 text-[color:var(--text-muted)]">
            {item.category} · {item.spaces.join(" / ")}
          </div>

          <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
            {isPlanItem ? item.reason : item.replacementCue}
          </p>
          <p className="mt-1 text-sm leading-6 text-[color:var(--text-muted)]">{item.note}</p>
        </div>

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
      </div>
    </div>
  )
}

function SystemDetailPanel({
  system,
  onEditOwned,
  onEditPlan,
}: {
  system: ShoppingSystemOverview
  onEditOwned?: (item: ShoppingOwnedItem) => void
  onEditPlan?: (item: ShoppingPlanWithLane) => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex h-full flex-col rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]">
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div>
          <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">{system.id}</h3>
          <p className="mt-1 leading-6 text-[color:var(--text-secondary)]">{system.summary}</p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <SystemSummaryChip label={system.id} />
          <SystemSummaryChip label={system.cluster} />
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

        <div className="mt-5 grid gap-5">
          <div>
            <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
              {t("shopping.systems.ownedCount", { count: system.owned.length })}
            </div>
            {system.owned.length > 0 ? (
              <div className="mt-3 space-y-3">
                {system.owned.map((item) => (
                  <SystemDetailItemRow
                    key={item.id}
                    item={item}
                    sourceLabel={t("shopping.systems.ownedLabel")}
                    onEditOwned={onEditOwned}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[color:var(--text-muted)]">
                {t("shopping.systems.noOwnedItems")}
              </p>
            )}
          </div>

          <div>
            <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
              {t("shopping.systems.pendingCount", { count: system.planned.length })}
            </div>
            {system.planned.length > 0 ? (
              <div className="mt-3 space-y-3">
                {system.planned.map((item) => (
                  <SystemDetailItemRow
                    key={item.id}
                    item={item}
                    sourceLabel={item.laneTitle}
                    onEditPlan={onEditPlan}
                  />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[color:var(--text-muted)]">
                {t("shopping.systems.noPendingItems")}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function SystemMapCard({
  definition,
  isSelected,
  onSelect,
  isManagementMode,
  onEditOwned,
  onEditPlan,
  onDragStart,
  onDragOver,
  onDrop,
}: {
  definition: ShoppingSystemOverview
  isSelected: boolean
  onSelect: (systemId: string) => void
  isManagementMode?: boolean
  onEditOwned?: (item: ShoppingOwnedItem) => void
  onEditPlan?: (item: ShoppingPlanWithLane) => void
  onDragStart?: (e: React.DragEvent, id: string) => void
  onDragOver?: (e: React.DragEvent) => void
  onDrop?: (e: React.DragEvent, id: string) => void
}) {
  const hasItems = definition.owned.length > 0 || definition.planned.length > 0
  const firstOwned = definition.owned[0]
  const firstPlanned = definition.planned[0]

  return (
    <div
      className="relative"
      draggable={isManagementMode}
      onDragStart={
        isManagementMode && onDragStart ? (e) => onDragStart(e, definition.id) : undefined
      }
      onDragOver={isManagementMode && onDragOver ? onDragOver : undefined}
      onDrop={isManagementMode && onDrop ? (e) => onDrop(e, definition.id) : undefined}
    >
      <button
        type="button"
        onClick={() => onSelect(definition.id)}
        className={cn(
          "flex w-[210px] shrink-0 flex-col gap-1.5 overflow-hidden rounded-xl border px-2.5 py-2 text-left transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-[color:var(--tone-present-border)]",
          isManagementMode && "pl-0",
          isSelected
            ? "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)]/40 shadow-[0_4px_16px_rgba(15,23,42,0.06)]"
            : "border-[color:var(--muted-surface-border)] bg-[color:var(--surface-bg)] hover:border-[color:var(--surface-border)] hover:shadow-[0_2px_8px_rgba(15,23,42,0.04)]",
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
            {definition.id.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-medium text-[color:var(--text-primary)]">
              {definition.id}
            </div>
            <div className="truncate text-[11px] text-[color:var(--text-muted)]">
              {definition.cluster}
            </div>
          </div>
        </div>

        {/* Row 2: Badges — no wrapping, overflow hidden */}
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
            {definition.owned.length} / {definition.planned.length}
          </Badge>
          {definition.urgentCount > 0 ? (
            <Badge
              variant="outline"
              className="h-5 shrink-0 border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)] px-1.5 text-[10px] text-[color:var(--tone-value-ink)]"
            >
              待补 {definition.urgentCount}
            </Badge>
          ) : null}
        </div>

        {/* Row 3: Summary — single line with ellipsis truncation */}
        <p
          className={cn(
            "truncate text-[12px] leading-5 text-[color:var(--text-secondary)]",
            isManagementMode && "pl-8",
          )}
        >
          {definition.summary}
        </p>

        {/* Row 4: Secondary group badges — no wrapping, overflow hidden */}
        <div
          className={cn(
            "flex min-w-0 items-center gap-1.5 overflow-hidden opacity-45",
            isManagementMode && "pl-8",
          )}
        >
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
      </button>

      {isManagementMode && hasItems ? (
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

export function ShoppingSystemsTab({
  systems,
  selectedSystemId,
  isFixedLayout,
  isManagementMode,
  onSelectSystem,
  onEditOwned,
  onEditPlan,
  onAddNew,
}: {
  systems: ShoppingSystemOverview[]
  selectedSystemId: string | null
  isFixedLayout: boolean
  isManagementMode?: boolean
  onSelectSystem: (systemId: string) => void
  onEditOwned?: (item: ShoppingOwnedItem) => void
  onEditPlan?: (item: ShoppingPlanWithLane) => void
  onAddNew?: () => void
}) {
  const { t } = useTranslation()
  const selectedSystem = systems.find((s) => s.id === selectedSystemId) ?? null

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id)
    e.dataTransfer.effectAllowed = "move"
    ;(e.currentTarget as HTMLElement).style.opacity = "0.5"
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    const dragId = e.dataTransfer.getData("text/plain")
    if (dragId === targetId) return
    onSelectSystem(dragId)
  }

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
          <div className="flex min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:var(--muted-surface-border)_transparent] flex-wrap content-start gap-2 overflow-y-auto pr-1">
            {isManagementMode && onAddNew ? <AddCard onClick={onAddNew} /> : null}
            {systems.length > 0 ? (
              systems.map((definition) => (
                <SystemMapCard
                  key={definition.id}
                  definition={definition}
                  isSelected={selectedSystemId === definition.id}
                  onSelect={onSelectSystem}
                  isManagementMode={isManagementMode}
                  onEditOwned={onEditOwned}
                  onEditPlan={onEditPlan}
                  onDragStart={handleDragStart}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                />
              ))
            ) : !isManagementMode ? (
              <EmptyState message={t("shopping.systems.noSystemData")} />
            ) : null}
          </div>
        </Surface>

        {/* Right: Detail Panel */}
        <div className="min-h-0 overflow-hidden">
          {selectedSystem ? (
            <SystemDetailPanel
              system={selectedSystem}
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
