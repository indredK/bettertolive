import { House } from "lucide-react"
import type { MutableRefObject } from "react"

import { Badge } from "@/components/ui/badge"
import { TabsContent } from "@/components/ui/tabs"
import { EmptyState, SectionHeading, Surface } from "@/features/bettertolive/ui/shared/shared"
import { getSystemRowTemplate } from "@/features/bettertolive/ui/shopping/shopping-page-data"
import {
  ShoppingSpaceDetailDialog,
  type SpaceOverview,
} from "@/features/bettertolive/ui/shopping/shopping-space-detail-dialog"
import { cn } from "@/lib/utils"

function SpaceMapCard({
  space,
  isHovered,
  onHover,
  onOpen,
}: {
  space: SpaceOverview
  isHovered: boolean
  onHover: (spaceName: string | null) => void
  onOpen: (spaceName: string) => void
}) {
  const totalItems = space.owned.length + space.planned.length
  const isActive = totalItems > 0

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={`${space.name} 空间详情`}
      onPointerEnter={() => onHover(space.name)}
      onClick={() => {
        onHover(null)
        onOpen(space.name)
      }}
      className={cn(
        "flex h-full w-full min-w-0 flex-col overflow-hidden rounded-xl border p-3 text-left transition-[box-shadow,border-color,background-color,opacity] duration-500 ease-in-out outline-none focus-visible:ring-3 focus-visible:ring-[color:var(--tone-present-border)]",
        isActive
          ? "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]"
          : "border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)]",
        isHovered &&
          "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)]/40",
      )}
      style={{
        boxShadow: isHovered ? "0 18px 36px rgba(15, 23, 42, 0.08)" : "0 0 0 rgba(0,0,0,0)",
      }}
    >
      <div className="flex items-start gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[11px] font-medium text-[color:var(--text-primary)]">
          <House className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-[color:var(--text-primary)]">
            {space.name}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-[color:var(--text-muted)]">
            {space.systems.size} 个关联系统
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge
          variant="outline"
          className="h-5 border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-1.5 text-[10px] text-[color:var(--text-muted)]"
        >
          {space.owned.length} / {space.planned.length}
        </Badge>
        {space.planned.length > 0 ? (
          <Badge
            variant="outline"
            className="h-5 border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)] px-1.5 text-[10px] text-[color:var(--tone-value-ink)]"
          >
            待补 {space.planned.length}
          </Badge>
        ) : null}
      </div>

      <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[color:var(--text-secondary)]">
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

      <div
        className={cn(
          "mt-auto flex min-h-[42px] flex-wrap gap-1.5 pt-2 transition-opacity duration-500 ease-in-out",
          isHovered ? "opacity-100" : "opacity-45",
        )}
      >
        {Array.from(space.systems)
          .slice(0, 3)
          .map((system) => (
            <Badge
              key={system}
              variant="outline"
              className="h-5 border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-1.5 text-[10px] text-[color:var(--text-muted)]"
            >
              {system}
            </Badge>
          ))}
        {space.systems.size > 3 ? (
          <Badge
            variant="outline"
            className="h-5 border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-1.5 text-[10px] text-[color:var(--text-muted)]"
          >
            +{space.systems.size - 3}
          </Badge>
        ) : null}
      </div>
    </button>
  )
}

export function ShoppingSpacesTab({
  spaceRows,
  spaces,
  spaceRowRefs,
  hoveredSpaceName,
  selectedSpaceName,
  isWideLayout,
  isFixedLayout,
  onHoverSpace,
  onOpenSpace,
  onOpenChange,
}: {
  spaceRows: SpaceOverview[][]
  spaces: SpaceOverview[]
  spaceRowRefs: MutableRefObject<Array<HTMLDivElement | null>>
  hoveredSpaceName: string | null
  selectedSpaceName: string | null
  isWideLayout: boolean
  isFixedLayout: boolean
  onHoverSpace: (spaceName: string | null) => void
  onOpenSpace: (spaceName: string) => void
  onOpenChange: (open: boolean) => void
}) {
  return (
    <TabsContent
      value="spaces"
      className={cn("space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
    >
      <Surface className={cn("p-5", isFixedLayout && "flex h-full min-h-0 flex-col")}>
        <SectionHeading
          compact={isWideLayout}
          icon={House}
          title="空间巡检"
          description="点击任意空间卡片，查看该位置的已有物品和待补缺口。"
        />

        <div
          className={cn("flex flex-col gap-3", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          {spaceRows.length > 0 ? (
            spaceRows.map((row, rowIndex) => (
              <div
                key={`space-row-${rowIndex}`}
                ref={(element) => {
                  spaceRowRefs.current[rowIndex] = element
                }}
                onPointerLeave={() => onHoverSpace(null)}
                className={cn(
                  isFixedLayout
                    ? "grid min-h-0 flex-1 items-stretch gap-3"
                    : "grid gap-3 min-[680px]:grid-cols-2 min-[1040px]:grid-cols-3",
                )}
                style={
                  isFixedLayout
                    ? { gridTemplateColumns: getSystemRowTemplate(row.length, null) }
                    : undefined
                }
              >
                {row.map((space) => (
                  <SpaceMapCard
                    key={space.name}
                    space={space}
                    isHovered={hoveredSpaceName === space.name}
                    onHover={onHoverSpace}
                    onOpen={onOpenSpace}
                  />
                ))}
              </div>
            ))
          ) : (
            <EmptyState message="当前筛选下没有空间视角数据。" />
          )}
        </div>
      </Surface>

      <ShoppingSpaceDetailDialog
        space={spaces.find((item) => item.name === selectedSpaceName) ?? null}
        open={selectedSpaceName !== null}
        onOpenChange={onOpenChange}
      />
    </TabsContent>
  )
}
