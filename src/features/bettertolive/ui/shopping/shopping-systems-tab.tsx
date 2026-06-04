import { Badge } from "@/components/ui/badge"
import { TabsContent } from "@/components/ui/tabs"
import { EmptyState, Surface } from "@/features/bettertolive/ui/shared/shared"
import type { ShoppingSystemOverview } from "@/features/bettertolive/ui/shopping/shopping-system-detail-dialog"
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
}: {
  item: ShoppingSystemOverview["owned"][number] | ShoppingSystemOverview["planned"][number]
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

function SystemDetailPanel({ system }: { system: ShoppingSystemOverview }) {
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
            已有 {system.owned.length}
          </Badge>
          <Badge variant="outline" className={cn("border", SYSTEM_STATUS_STYLES.pending)}>
            待补 {system.planned.length}
          </Badge>
        </div>

        <p className="mt-4 text-sm leading-6 text-[color:var(--text-secondary)]">
          核心问题：{system.keyQuestion}
        </p>

        <div className="mt-5 grid gap-4">
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

        <div className="mt-5 grid gap-5">
          <div>
            <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
              已有 {system.owned.length} 项
            </div>
            {system.owned.length > 0 ? (
              <div className="mt-3 space-y-3">
                {system.owned.map((item) => (
                  <SystemDetailItemRow key={item.id} item={item} sourceLabel="已拥有" />
                ))}
              </div>
            ) : (
              <p className="mt-3 text-sm text-[color:var(--text-muted)]">当前没有已拥有条目。</p>
            )}
          </div>

          <div>
            <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
              待补 {system.planned.length} 项
            </div>
            {system.planned.length > 0 ? (
              <div className="mt-3 space-y-3">
                {system.planned.map((item) => (
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
  )
}

function SystemMapCard({
  definition,
  isSelected,
  onSelect,
}: {
  definition: ShoppingSystemOverview
  isSelected: boolean
  onSelect: (systemId: string) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(definition.id)}
      className={cn(
        "flex w-full min-w-0 flex-col gap-1.5 overflow-hidden rounded-xl border px-2.5 py-2 text-left transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-[color:var(--tone-present-border)]",
        isSelected
          ? "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)]/40 shadow-[0_4px_16px_rgba(15,23,42,0.06)]"
          : "border-[color:var(--muted-surface-border)] bg-[color:var(--surface-bg)] hover:border-[color:var(--surface-border)] hover:shadow-[0_2px_8px_rgba(15,23,42,0.04)]",
      )}
    >
      {/* Row 1: Icon + Name/Cluster */}
      <div className="flex min-w-0 items-start gap-2">
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
      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
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
      <p className="truncate text-[12px] leading-5 text-[color:var(--text-secondary)]">
        {definition.summary}
      </p>

      {/* Row 4: Secondary group badges — no wrapping, overflow hidden */}
      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden opacity-45">
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
  )
}

export function ShoppingSystemsTab({
  systems,
  selectedSystemId,
  isFixedLayout,
  onSelectSystem,
}: {
  systems: ShoppingSystemOverview[]
  selectedSystemId: string | null
  isFixedLayout: boolean
  onSelectSystem: (systemId: string) => void
}) {
  const selectedSystem = systems.find((s) => s.id === selectedSystemId) ?? null

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
        <Surface className={cn("overflow-hidden p-3", isFixedLayout && "min-h-0")}>
          {systems.length > 0 ? (
            <div className="grid h-full grid-cols-2 gap-2 lg:grid-cols-3 xl:grid-cols-3">
              {systems.map((definition) => (
                <SystemMapCard
                  key={definition.id}
                  definition={definition}
                  isSelected={selectedSystemId === definition.id}
                  onSelect={onSelectSystem}
                />
              ))}
            </div>
          ) : (
            <EmptyState message="当前筛选下没有系统地图数据。" />
          )}
        </Surface>

        {/* Right: Detail Panel */}
        <div className={cn("min-h-0", isFixedLayout && "overflow-y-auto")}>
          {selectedSystem ? (
            <SystemDetailPanel system={selectedSystem} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)]">
              <p className="text-sm text-[color:var(--text-muted)]">选择一个系统查看详情</p>
            </div>
          )}
        </div>
      </div>
    </TabsContent>
  )
}
