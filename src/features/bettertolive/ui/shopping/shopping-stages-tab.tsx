import { Sparkles } from "lucide-react"
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
import type { ShoppingStageChecklist } from "@/features/bettertolive/types"
import { EmptyState, Surface } from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"

function StageDetailGroupedTable({ checklist }: { checklist: ShoppingStageChecklist }) {
  const sectionCount = checklist.sections.length
  const totalItems = checklist.sections.reduce(
    (sum, s) => sum + s.minimum.length + s.essentials.length + s.upgrades.length,
    0,
  )

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]">
      {/* Fixed header */}
      <div className="shrink-0 p-5 pb-0">
        {/* Line 1: Title left, badges + focus right */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="flex shrink-0 items-center gap-2 text-lg font-semibold text-[color:var(--text-primary)]">
            <Sparkles className="size-5" />
            {checklist.title}
          </h3>
          <div className="flex min-w-0 flex-col items-end gap-1.5">
            <div className="flex flex-wrap justify-end gap-1.5">
              <Badge
                variant="outline"
                className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
              >
                {checklist.stage}
              </Badge>
              <Badge
                variant="outline"
                className="border border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]"
              >
                {sectionCount} 个系统
              </Badge>
              <Badge
                variant="outline"
                className="border border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]"
              >
                {totalItems} 条物品
              </Badge>
            </div>
            <p className="truncate text-right text-[13px] leading-5 text-[color:var(--text-secondary)]">
              {checklist.focus}
            </p>
          </div>
        </div>

        {/* Line 2: Description */}
        <p className="mt-2 leading-6 text-[color:var(--text-secondary)]">{checklist.description}</p>
      </div>

      {/* Scrollable table */}
      <div className="min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:var(--muted-surface-border)_transparent] overflow-y-auto p-5 pt-3">
        <Table className="whitespace-nowrap">
          <TableHeader className="sticky top-0 z-10 bg-[color:var(--surface-bg)] shadow-[0_1px_0_0_var(--muted-surface-border)]">
            <TableRow>
              <TableHead className="w-[30%] text-xs tracking-[0.1em] text-[color:var(--text-muted)] uppercase">
                系统
              </TableHead>
              <TableHead className="text-xs tracking-[0.1em] text-[color:var(--text-muted)] uppercase">
                最低配置
              </TableHead>
              <TableHead className="text-xs tracking-[0.1em] text-[color:var(--text-muted)] uppercase">
                升级配置
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {checklist.sections.map((section) => {
              const upgradeItems = [...section.essentials, ...section.upgrades]

              return (
                <TableRow key={section.system} className="hover:bg-transparent">
                  <TableCell className="align-top">
                    <Badge
                      variant="outline"
                      className="border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)] text-[12px] text-[color:var(--tone-present-ink)]"
                    >
                      {section.system}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top">
                    {section.minimum.length > 0 ? (
                      <ul className="space-y-1">
                        {section.minimum.map((name) => (
                          <li
                            key={name}
                            className="rounded-md border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-2.5 py-1.5 text-sm leading-5 text-[color:var(--text-secondary)]"
                          >
                            {name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-sm text-[color:var(--text-muted)]">—</span>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    {upgradeItems.length > 0 ? (
                      <ul className="space-y-1">
                        {upgradeItems.map((name) => (
                          <li
                            key={name}
                            className="rounded-md border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-2.5 py-1.5 text-sm leading-5 text-[color:var(--text-secondary)]"
                          >
                            {name}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-sm text-[color:var(--text-muted)]">—</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

function StageMapCard({
  checklist,
  isSelected,
  onSelect,
}: {
  checklist: ShoppingStageChecklist
  isSelected: boolean
  onSelect: (stageId: string) => void
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
      onClick={() => onSelect(checklist.id)}
      className={cn(
        "flex w-full min-w-0 flex-col gap-1.5 overflow-hidden rounded-xl border px-2.5 py-2 text-left transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-[color:var(--tone-present-border)]",
        totalItems > 0
          ? "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]"
          : "border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)]",
        isSelected &&
          "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)]/40 shadow-[0_4px_16px_rgba(15,23,42,0.06)]",
      )}
    >
      <div className="flex min-w-0 items-start gap-2">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[11px] font-medium text-[color:var(--text-primary)]">
          <Sparkles className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-medium text-[color:var(--text-primary)]">
            {checklist.title}
          </div>
          <div className="truncate text-[11px] text-[color:var(--text-muted)]">
            {checklist.stage}
          </div>
        </div>
      </div>

      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
        <Badge
          variant="outline"
          className="h-5 shrink-0 border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-1.5 text-[10px] text-[color:var(--text-muted)]"
        >
          {sectionCount} 系统
        </Badge>
        <Badge
          variant="outline"
          className="h-5 shrink-0 border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)] px-1.5 text-[10px] text-[color:var(--tone-value-ink)]"
        >
          {totalItems} 条物品
        </Badge>
      </div>

      <p className="truncate text-[12px] leading-5 text-[color:var(--text-secondary)]">
        {checklist.focus}
      </p>

      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden opacity-45">
        {systemNames.slice(0, 3).map((system) => (
          <Badge
            key={system}
            variant="outline"
            className="h-5 shrink-0 border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-1.5 text-[10px] text-[color:var(--text-muted)]"
          >
            {system}
          </Badge>
        ))}
        {systemNames.length > 3 ? (
          <Badge
            variant="outline"
            className="h-5 shrink-0 border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-1.5 text-[10px] text-[color:var(--text-muted)]"
          >
            +{systemNames.length - 3}
          </Badge>
        ) : null}
      </div>
    </button>
  )
}

export function ShoppingStagesTab({
  checklists,
  selectedStageId,
  isFixedLayout,
  onSelectStage,
}: {
  checklists: ShoppingStageChecklist[]
  selectedStageId: string | null
  isFixedLayout: boolean
  onSelectStage: (stageId: string) => void
}) {
  const selectedChecklist = checklists.find((c) => c.id === selectedStageId) ?? null

  return (
    <TabsContent
      value="stages"
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
        {/* Left: Stage Cards */}
        <Surface className={cn("overflow-hidden p-3", isFixedLayout && "min-h-0")}>
          {checklists.length > 0 ? (
            <div className="grid h-full grid-cols-1 gap-2 min-[400px]:grid-cols-2">
              {checklists.map((checklist) => (
                <StageMapCard
                  key={checklist.id}
                  checklist={checklist}
                  isSelected={selectedStageId === checklist.id}
                  onSelect={onSelectStage}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="当前筛选下没有阶段模板。" />
          )}
        </Surface>

        {/* Right: Detail Panel */}
        <div className="min-h-0 overflow-hidden">
          {selectedChecklist ? (
            <StageDetailGroupedTable checklist={selectedChecklist} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)]">
              <p className="text-sm text-[color:var(--text-muted)]">选择一个阶段查看详情</p>
            </div>
          )}
        </div>
      </div>
    </TabsContent>
  )
}
