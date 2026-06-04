import { House } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { TabsContent } from "@/components/ui/tabs"
import { EmptyState, Surface } from "@/features/bettertolive/ui/shared/shared"
import type { SpaceOverview } from "@/features/bettertolive/ui/shopping/shopping-space-detail-dialog"
import type { ShoppingOwnedItem } from "@/features/bettertolive/types"
import type { ShoppingPlanWithLane } from "@/features/bettertolive/ui/shopping/shopping-system-detail-dialog"
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

function SpaceDetailItemRow({
  item,
  sourceLabel,
}: {
  item: ShoppingOwnedItem | ShoppingPlanWithLane
  sourceLabel: string
}) {
  const isPlanItem = "currentPrice" in item

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3">
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
        {item.system} · {item.category} · {item.stages.join(" / ")}
      </div>

      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
        {isPlanItem ? item.reason : item.replacementCue}
      </p>
      <p className="mt-1 text-sm leading-6 text-[color:var(--text-muted)]">{item.note}</p>
    </div>
  )
}

function SpaceDetailPanel({ space }: { space: SpaceOverview }) {
  const totalItems = space.owned.length + space.planned.length
  const isEmpty = totalItems === 0

  return (
    <div className="flex h-full flex-col rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]">
      <div className="min-h-0 flex-1 overflow-y-auto p-5">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-[color:var(--text-primary)]">
            <House className="size-5" />
            {space.name}
          </h3>
          <p className="mt-1 leading-6 text-[color:var(--text-secondary)]">
            该空间共有 {totalItems} 项物品，涉及 {space.systems.size} 个生活系统。
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className="border border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]"
          >
            已有 {space.owned.length}
          </Badge>
          <Badge
            variant="outline"
            className="border border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]"
          >
            待补 {space.planned.length}
          </Badge>
        </div>

        <div className="mt-4 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
          <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
            涉及系统
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {Array.from(space.systems).map((system) => (
              <SystemSummaryChip key={system} label={system} />
            ))}
          </div>
        </div>

        {isEmpty ? (
          <p className="mt-6 text-sm text-[color:var(--text-muted)]">当前该空间暂无物品数据。</p>
        ) : (
          <div className="mt-5 grid gap-4 min-[900px]:grid-cols-2">
            <div>
              <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                已有 {space.owned.length} 项
              </div>
              {space.owned.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {space.owned.map((item) => (
                    <SpaceDetailItemRow key={item.id} item={item} sourceLabel="已拥有" />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[color:var(--text-muted)]">当前没有已拥有条目。</p>
              )}
            </div>

            <div>
              <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                待补 {space.planned.length} 项
              </div>
              {space.planned.length > 0 ? (
                <div className="mt-3 space-y-3">
                  {space.planned.map((item) => (
                    <SpaceDetailItemRow key={item.id} item={item} sourceLabel={item.laneTitle} />
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-[color:var(--text-muted)]">当前没有待补条目。</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SpaceMapCard({
  space,
  isSelected,
  onSelect,
}: {
  space: SpaceOverview
  isSelected: boolean
  onSelect: (spaceName: string) => void
}) {
  const totalItems = space.owned.length + space.planned.length
  const isActive = totalItems > 0

  return (
    <button
      type="button"
      onClick={() => onSelect(space.name)}
      className={cn(
        "flex w-full min-w-0 flex-col gap-1.5 overflow-hidden rounded-xl border px-2.5 py-2 text-left transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-[color:var(--tone-present-border)]",
        isActive
          ? "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]"
          : "border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)]",
        isSelected &&
          "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)]/40 shadow-[0_4px_16px_rgba(15,23,42,0.06)]",
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[11px] font-medium text-[color:var(--text-primary)]">
          <House className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-[color:var(--text-primary)]">
            {space.name}
          </div>
          <div className="truncate text-[11px] text-[color:var(--text-muted)]">
            {space.systems.size} 个关联系统
          </div>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
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
            待补 {space.planned.length}
          </Badge>
        ) : null}
      </div>

      <p className="truncate text-[12px] leading-5 text-[color:var(--text-secondary)]">
        {isActive
          ? `已有 ${space.owned
              .map((i) => i.name)
              .slice(0, 3)
              .join("、")}${space.owned.length > 3 ? " 等" : ""}，待补 ${space.planned
              .map((i) => i.name)
              .slice(0, 2)
              .join("、")}${space.planned.length > 2 ? " 等" : ""}`
          : "暂无物品数据"}
      </p>

      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden opacity-45">
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
  )
}

export function ShoppingSpacesTab({
  spaces,
  selectedSpaceName,
  isFixedLayout,
  onSelectSpace,
}: {
  spaces: SpaceOverview[]
  selectedSpaceName: string | null
  isFixedLayout: boolean
  onSelectSpace: (spaceName: string) => void
}) {
  const selectedSpace = spaces.find((s) => s.name === selectedSpaceName) ?? null

  return (
    <TabsContent
      value="spaces"
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
        {/* Left: Space Cards */}
        <Surface className={cn("overflow-hidden p-3", isFixedLayout && "min-h-0")}>
          {spaces.length > 0 ? (
            <div className="grid h-full grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-3">
              {spaces.map((space) => (
                <SpaceMapCard
                  key={space.name}
                  space={space}
                  isSelected={selectedSpaceName === space.name}
                  onSelect={onSelectSpace}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="当前筛选下没有空间视角数据。" />
          )}
        </Surface>

        {/* Right: Detail Panel */}
        <div className={cn("min-h-0", isFixedLayout && "overflow-y-auto")}>
          {selectedSpace ? (
            <SpaceDetailPanel space={selectedSpace} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)]">
              <p className="text-sm text-[color:var(--text-muted)]">选择一个空间查看详情</p>
            </div>
          )}
        </div>
      </div>
    </TabsContent>
  )
}
