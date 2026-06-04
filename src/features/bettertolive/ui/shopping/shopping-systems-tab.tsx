import type { MutableRefObject } from "react"

import { Badge } from "@/components/ui/badge"
import { TabsContent } from "@/components/ui/tabs"
import { EmptyState, Surface } from "@/features/bettertolive/ui/shared/shared"
import { getSystemRowTemplate } from "@/features/bettertolive/ui/shopping/shopping-page-data"
import {
  ShoppingSystemDetailDialog,
  type ShoppingSystemOverview,
} from "@/features/bettertolive/ui/shopping/shopping-system-detail-dialog"
import { cn } from "@/lib/utils"

function SystemMapCard({
  definition,
  isHovered,
  onHover,
  onOpen,
}: {
  definition: ShoppingSystemOverview
  isHovered: boolean
  onHover: (systemId: string | null) => void
  onOpen: (systemId: string) => void
}) {
  const intensityClass = definition.isActive
    ? "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]"
    : "border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)]"

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={`${definition.id} 系统详情`}
      onPointerEnter={() => onHover(definition.id)}
      onClick={() => {
        onHover(null)
        onOpen(definition.id)
      }}
      className={cn(
        "flex h-full w-full min-w-0 flex-col overflow-hidden rounded-xl border p-3 text-left transition-[box-shadow,border-color,background-color,opacity] duration-500 ease-in-out outline-none focus-visible:ring-3 focus-visible:ring-[color:var(--tone-present-border)]",
        intensityClass,
        isHovered &&
          "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)]/40",
      )}
      style={{
        boxShadow: isHovered ? "0 18px 36px rgba(15, 23, 42, 0.08)" : "0 0 0 rgba(0,0,0,0)",
      }}
    >
      <div className="flex items-start gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[11px] font-medium text-[color:var(--text-primary)]">
          {definition.id.slice(0, 1)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-[color:var(--text-primary)]">
            {definition.id}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-[color:var(--text-muted)]">
            {definition.cluster}
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge
          variant="outline"
          className="h-5 border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-1.5 text-[10px] text-[color:var(--text-muted)]"
        >
          {definition.owned.length} / {definition.planned.length}
        </Badge>
        {definition.urgentCount > 0 ? (
          <Badge
            variant="outline"
            className="h-5 border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)] px-1.5 text-[10px] text-[color:var(--tone-value-ink)]"
          >
            待补 {definition.urgentCount}
          </Badge>
        ) : null}
      </div>

      <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[color:var(--text-secondary)]">
        {definition.summary}
      </p>

      <div
        className={cn(
          "mt-auto flex min-h-[42px] flex-wrap gap-1.5 pt-2 transition-opacity duration-500 ease-in-out",
          isHovered ? "opacity-100" : "opacity-45",
        )}
      >
        {definition.secondaryGroups.slice(0, 2).map((group) => (
          <Badge
            key={group}
            variant="outline"
            className="h-5 border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-1.5 text-[10px] text-[color:var(--text-muted)]"
          >
            {group}
          </Badge>
        ))}
        {definition.secondaryGroups.length > 2 ? (
          <Badge
            variant="outline"
            className="h-5 border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-1.5 text-[10px] text-[color:var(--text-muted)]"
          >
            +{definition.secondaryGroups.length - 2}
          </Badge>
        ) : null}
      </div>
    </button>
  )
}

export function ShoppingSystemsTab({
  systemRows,
  systemRowRefs,
  hoveredSystemId,
  selectedSystem,
  isFixedLayout,
  onHoverSystem,
  onOpenSystem,
  onOpenChange,
}: {
  systemRows: ShoppingSystemOverview[][]
  systemRowRefs: MutableRefObject<Array<HTMLDivElement | null>>
  hoveredSystemId: string | null
  selectedSystem: ShoppingSystemOverview | null
  isFixedLayout: boolean
  onHoverSystem: (systemId: string | null) => void
  onOpenSystem: (systemId: string) => void
  onOpenChange: (open: boolean) => void
}) {
  return (
    <TabsContent
      value="systems"
      className={cn("space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
    >
      <Surface className={cn("p-5", isFixedLayout && "flex h-full min-h-0 flex-col")}>
        <div
          className={cn("flex flex-col gap-3", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          {systemRows.length > 0 ? (
            systemRows.map((row, rowIndex) => (
              <div
                key={`system-row-${rowIndex}`}
                ref={(element) => {
                  systemRowRefs.current[rowIndex] = element
                }}
                onPointerLeave={() => onHoverSystem(null)}
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
                {row.map((definition) => (
                  <SystemMapCard
                    key={definition.id}
                    definition={definition}
                    isHovered={hoveredSystemId === definition.id}
                    onHover={onHoverSystem}
                    onOpen={onOpenSystem}
                  />
                ))}
              </div>
            ))
          ) : (
            <EmptyState message="当前筛选下没有系统地图数据。" />
          )}
        </div>
      </Surface>

      <ShoppingSystemDetailDialog
        system={selectedSystem}
        open={selectedSystem !== null}
        onOpenChange={onOpenChange}
      />
    </TabsContent>
  )
}
