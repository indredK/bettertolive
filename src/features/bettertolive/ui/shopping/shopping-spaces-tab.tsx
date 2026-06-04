import { House } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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

function SpaceDetailTable({ space }: { space: SpaceOverview }) {
  const totalItems = space.owned.length + space.planned.length
  const isEmpty = totalItems === 0

  const allItems: Array<{
    item: ShoppingOwnedItem | ShoppingPlanWithLane
    sourceLabel: string
    sourceType: "owned" | "planned"
  }> = [
    ...space.owned.map((item) => ({
      item,
      sourceLabel: "已拥有" as const,
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
          共 {totalItems} 项 · {space.systems.size} 个系统
        </p>
      </div>

      {/* Scrollable table */}
      <div className="min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:var(--muted-surface-border)_transparent] overflow-y-auto p-4 pt-2">
        {isEmpty ? (
          <p className="text-sm text-[color:var(--text-muted)]">当前该空间暂无物品数据。</p>
        ) : (
          <Table className="whitespace-nowrap">
            <TableHeader className="sticky top-0 z-10 bg-[color:var(--surface-bg)] shadow-[0_1px_0_0_var(--muted-surface-border)]">
              <TableRow>
                <TableHead className="text-xs tracking-[0.1em] text-[color:var(--text-muted)] uppercase">
                  物品名称
                </TableHead>
                <TableHead className="text-xs tracking-[0.1em] text-[color:var(--text-muted)] uppercase">
                  系统
                </TableHead>
                <TableHead className="text-xs tracking-[0.1em] text-[color:var(--text-muted)] uppercase">
                  类别
                </TableHead>
                <TableHead className="text-xs tracking-[0.1em] text-[color:var(--text-muted)] uppercase">
                  阶段
                </TableHead>
                <TableHead className="text-xs tracking-[0.1em] text-[color:var(--text-muted)] uppercase">
                  标签
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allItems.map(({ item, sourceLabel }) => {
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
                          sourceLabel === "已拥有"
                            ? "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]"
                            : "border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]",
                        )}
                      >
                        {sourceLabel}
                      </Badge>
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
            ? "min-h-0 flex-1 grid-cols-[1fr_2fr]"
            : "grid-cols-1 lg:grid-cols-[1fr_2fr]",
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
        <div className="min-h-0 overflow-hidden">
          {selectedSpace ? (
            <SpaceDetailTable space={selectedSpace} />
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
