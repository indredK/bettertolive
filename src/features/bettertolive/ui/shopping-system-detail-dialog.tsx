import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type {
  ShoppingOwnedItem,
  ShoppingPlanItem,
  ShoppingSystemDefinition,
} from "@/features/bettertolive/types"
import { cn } from "@/lib/utils"

export type ShoppingPlanWithLane = ShoppingPlanItem & {
  laneId: string
  laneTitle: string
}

export type ShoppingSystemOverview = ShoppingSystemDefinition & {
  owned: ShoppingOwnedItem[]
  planned: ShoppingPlanWithLane[]
  spaces: string[]
  urgentCount: number
  isActive: boolean
}

const SYSTEM_DETAIL_DIALOG_CLASS = "w-[min(1040px,calc(100vw-2rem))] max-w-none p-0 sm:max-w-none"

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
        {item.category} · {item.spaces.join(" / ")}
      </div>

      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
        {isPlanItem ? item.reason : item.replacementCue}
      </p>
      <p className="mt-1 text-sm leading-6 text-[color:var(--text-muted)]">{item.note}</p>
    </div>
  )
}

export function ShoppingSystemDetailDialog({
  system,
  open,
  onOpenChange,
}: {
  system: ShoppingSystemOverview | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!system) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          SYSTEM_DETAIL_DIALOG_CLASS,
          "border border-[color:var(--surface-border)] bg-[color:var(--dialog-bg)] text-[color:var(--text-primary)] ring-[color:var(--surface-border)]",
        )}
      >
        <div className="max-h-[calc(100vh-2rem)] overflow-y-auto">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle className="text-lg">{system.id}</DialogTitle>
            <DialogDescription className="leading-6 text-[color:var(--text-secondary)]">
              {system.summary}
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 pb-5">
            <div className="mt-4 flex flex-wrap gap-2">
              <SystemSummaryChip label={system.id} />
              <SystemSummaryChip label={system.cluster} />
              <Badge variant="outline" className={cn("border", SYSTEM_STATUS_STYLES.active)}>
                已有 {system.owned.length}
              </Badge>
              <Badge variant="outline" className={cn("border", SYSTEM_STATUS_STYLES.pending)}>
                待补 {system.planned.length}
              </Badge>
            </div>

            <p className="mt-4 text-sm leading-6 text-[color:var(--text-secondary)]">
              核心问题：{system.keyQuestion}
            </p>

            <div className="mt-5 grid gap-4 min-[900px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
                <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                  二级分组
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {system.secondaryGroups.map((group) => (
                    <SystemSummaryChip key={group} label={group} />
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
                <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                  空间
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {system.spaces.length > 0 ? (
                    system.spaces.map((space) => <SystemSummaryChip key={space} label={space} />)
                  ) : (
                    <span className="text-sm text-[color:var(--text-muted)]">暂无空间数据</span>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-4 min-[900px]:grid-cols-2">
              <div>
                <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                  已有 {system.owned.length} 项
                </div>
                {system.owned.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {system.owned.slice(0, 3).map((item) => (
                      <SystemDetailItemRow key={item.id} item={item} sourceLabel="已拥有" />
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
                  待补 {system.planned.length} 项
                </div>
                {system.planned.length > 0 ? (
                  <div className="mt-3 space-y-3">
                    {system.planned.slice(0, 3).map((item) => (
                      <SystemDetailItemRow key={item.id} item={item} sourceLabel={item.laneTitle} />
                    ))}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-[color:var(--text-muted)]">当前没有待补条目。</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
