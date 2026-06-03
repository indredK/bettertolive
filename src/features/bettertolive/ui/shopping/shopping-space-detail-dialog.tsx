import { House } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ShoppingOwnedItem, ShoppingSystem } from "@/features/bettertolive/types"
import type { ShoppingPlanWithLane } from "@/features/bettertolive/ui/shopping/shopping-system-detail-dialog"
import { cn } from "@/lib/utils"

export type SpaceOverview = {
  name: string
  owned: ShoppingOwnedItem[]
  planned: ShoppingPlanWithLane[]
  systems: Set<ShoppingSystem>
}

const SPACE_DETAIL_DIALOG_CLASS = "w-[min(1040px,calc(100vw-2rem))] max-w-none p-0 sm:max-w-none"

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

export function ShoppingSpaceDetailDialog({
  space,
  open,
  onOpenChange,
}: {
  space: SpaceOverview | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!space) {
    return null
  }

  const totalItems = space.owned.length + space.planned.length
  const isEmpty = totalItems === 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          SPACE_DETAIL_DIALOG_CLASS,
          "border border-[color:var(--surface-border)] bg-[color:var(--dialog-bg)] text-[color:var(--text-primary)] ring-[color:var(--surface-border)]",
        )}
      >
        <div className="max-h-[calc(100vh-2rem)] overflow-y-auto">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <House className="size-5" />
              {space.name}
            </DialogTitle>
            <DialogDescription className="leading-6 text-[color:var(--text-secondary)]">
              该空间共有 {totalItems} 项物品，涉及 {space.systems.size} 个生活系统。
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 pb-5">
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className={cn(
                  "border",
                  "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]",
                )}
              >
                已有 {space.owned.length}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "border",
                  "border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]",
                )}
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
              <p className="mt-6 text-sm text-[color:var(--text-muted)]">
                当前该空间暂无物品数据。
              </p>
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
                    <p className="mt-3 text-sm text-[color:var(--text-muted)]">
                      当前没有已拥有条目。
                    </p>
                  )}
                </div>

                <div>
                  <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                    待补 {space.planned.length} 项
                  </div>
                  {space.planned.length > 0 ? (
                    <div className="mt-3 space-y-3">
                      {space.planned.map((item) => (
                        <SpaceDetailItemRow
                          key={item.id}
                          item={item}
                          sourceLabel={item.laneTitle}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-[color:var(--text-muted)]">
                      当前没有待补条目。
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
