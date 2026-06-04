import { Sparkles } from "lucide-react"
import type { MutableRefObject } from "react"

import { Badge } from "@/components/ui/badge"
import { TabsContent } from "@/components/ui/tabs"
import type { ShoppingStageChecklist } from "@/features/bettertolive/types"
import { EmptyState, SectionHeading, Surface } from "@/features/bettertolive/ui/shared/shared"
import { getSystemRowTemplate } from "@/features/bettertolive/ui/shopping/shopping-page-data"
import { ShoppingStageDetailDialog } from "@/features/bettertolive/ui/shopping/shopping-stage-detail-dialog"
import { cn } from "@/lib/utils"

function StageMapCard({
  checklist,
  isHovered,
  onHover,
  onOpen,
}: {
  checklist: ShoppingStageChecklist
  isHovered: boolean
  onHover: (stageId: string | null) => void
  onOpen: (stageId: string) => void
}) {
  const sectionCount = checklist.sections.length
  const totalItems = checklist.sections.reduce(
    (sum, section) =>
      sum + section.minimum.length + section.essentials.length + section.upgrades.length,
    0,
  )
  const systemNames = checklist.sections.map((section) => section.system)

  return (
    <button
      type="button"
      aria-haspopup="dialog"
      aria-label={`${checklist.title} 阶段详情`}
      onPointerEnter={() => onHover(checklist.id)}
      onClick={() => {
        onHover(null)
        onOpen(checklist.id)
      }}
      className={cn(
        "flex h-full w-full min-w-0 flex-col overflow-hidden rounded-xl border p-3 text-left transition-[box-shadow,border-color,background-color,opacity] duration-500 ease-in-out outline-none focus-visible:ring-3 focus-visible:ring-[color:var(--tone-present-border)]",
        totalItems > 0
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
          <Sparkles className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-[color:var(--text-primary)]">
            {checklist.title}
          </div>
          <div className="mt-0.5 truncate text-[11px] text-[color:var(--text-muted)]">
            {checklist.stage}
          </div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <Badge
          variant="outline"
          className="h-5 border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-1.5 text-[10px] text-[color:var(--text-muted)]"
        >
          {sectionCount} 系统
        </Badge>
        <Badge
          variant="outline"
          className="h-5 border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)] px-1.5 text-[10px] text-[color:var(--tone-value-ink)]"
        >
          {totalItems} 条物品
        </Badge>
      </div>

      <p className="mt-2 line-clamp-2 text-[12px] leading-5 text-[color:var(--text-secondary)]">
        {checklist.focus}
      </p>

      <div
        className={cn(
          "mt-auto flex min-h-[42px] flex-wrap gap-1.5 pt-2 transition-opacity duration-500 ease-in-out",
          isHovered ? "opacity-100" : "opacity-45",
        )}
      >
        {systemNames.slice(0, 3).map((system) => (
          <Badge
            key={system}
            variant="outline"
            className="h-5 border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-1.5 text-[10px] text-[color:var(--text-muted)]"
          >
            {system}
          </Badge>
        ))}
        {systemNames.length > 3 ? (
          <Badge
            variant="outline"
            className="h-5 border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-1.5 text-[10px] text-[color:var(--text-muted)]"
          >
            +{systemNames.length - 3}
          </Badge>
        ) : null}
      </div>
    </button>
  )
}

export function ShoppingStagesTab({
  stageRows,
  shoppingStageChecklists,
  stageRowRefs,
  hoveredStageId,
  selectedStageId,
  isWideLayout,
  isFixedLayout,
  onHoverStage,
  onOpenStage,
  onOpenChange,
}: {
  stageRows: ShoppingStageChecklist[][]
  shoppingStageChecklists: ShoppingStageChecklist[]
  stageRowRefs: MutableRefObject<Array<HTMLDivElement | null>>
  hoveredStageId: string | null
  selectedStageId: string | null
  isWideLayout: boolean
  isFixedLayout: boolean
  onHoverStage: (stageId: string | null) => void
  onOpenStage: (stageId: string) => void
  onOpenChange: (open: boolean) => void
}) {
  return (
    <TabsContent
      value="stages"
      className={cn("space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
    >
      <Surface className={cn("p-5", isFixedLayout && "flex h-full min-h-0 flex-col")}>
        <SectionHeading
          compact={isWideLayout}
          icon={Sparkles}
          title="阶段模板"
          description="点击任意阶段卡片，查看该生活阶段的完整物品清单模板。"
        />

        <div
          className={cn("flex flex-col gap-3", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          {stageRows.length > 0 ? (
            stageRows.map((row, rowIndex) => (
              <div
                key={`stage-row-${rowIndex}`}
                ref={(element) => {
                  stageRowRefs.current[rowIndex] = element
                }}
                onPointerLeave={() => onHoverStage(null)}
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
                {row.map((checklist) => (
                  <StageMapCard
                    key={checklist.id}
                    checklist={checklist}
                    isHovered={hoveredStageId === checklist.id}
                    onHover={onHoverStage}
                    onOpen={onOpenStage}
                  />
                ))}
              </div>
            ))
          ) : (
            <EmptyState message="当前筛选下没有阶段模板。" />
          )}
        </div>
      </Surface>

      <ShoppingStageDetailDialog
        checklist={shoppingStageChecklists.find((item) => item.id === selectedStageId) ?? null}
        open={selectedStageId !== null}
        onOpenChange={onOpenChange}
      />
    </TabsContent>
  )
}
