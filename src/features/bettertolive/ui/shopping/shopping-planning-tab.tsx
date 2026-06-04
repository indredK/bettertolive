import { X } from "lucide-react"
import { useMemo, useState } from "react"

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
import type {
  ShoppingDepreciation,
  ShoppingLifecycle,
  ShoppingModuleData,
  ShoppingNeedLevel,
  ShoppingSystem,
} from "@/features/bettertolive/types"
import { EmptyState, Surface } from "@/features/bettertolive/ui/shared/shared"
import {
  DEPRECIATION_STYLES,
  LIFECYCLE_STYLES,
  NEED_LEVEL_STYLES,
  formatPrice,
  getPriceSignal,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"
import { ShoppingPriceRow } from "@/features/bettertolive/ui/shopping/shopping-page-shared"
import type { ShoppingPlanWithLane } from "@/features/bettertolive/ui/shopping/shopping-system-detail-dialog"
import { cn } from "@/lib/utils"

const ALL_DEPRECIATIONS: ShoppingDepreciation[] = [
  "极快折旧",
  "较快折旧",
  "中等折旧",
  "慢折旧",
  "不折旧或升值",
]

const ALL_NECESSITIES: ShoppingNeedLevel[] = ["最低配置", "必要", "改善体验", "提升幸福感"]

const ALL_LIFECYCLES: ShoppingLifecycle[] = ["消耗品", "耐用品", "工具", "情感物"]

const ALL_SYSTEMS: ShoppingSystem[] = [
  "睡眠",
  "饮食",
  "清洁",
  "收纳",
  "照明",
  "环境",
  "电力网络",
  "工作学习",
  "应急健康",
  "个人护理",
  "穿着",
  "家具陈设",
  "出行",
  "娱乐爱好",
]

function ClassificationBadge({ label, className }: { label: string; className: string }) {
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}

function FilterChip({
  label,
  isSelected,
  onClick,
}: {
  label: string
  isSelected: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[11px] leading-5 transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--tone-present-border)]",
        isSelected
          ? "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]"
          : "border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] text-[color:var(--text-muted)] hover:border-[color:var(--surface-border)] hover:text-[color:var(--text-secondary)]",
      )}
    >
      {label}
    </button>
  )
}

function PlanItemRow({
  item,
  isSelected,
  onSelect,
}: {
  item: ShoppingPlanWithLane
  isSelected: boolean
  onSelect: (id: string) => void
}) {
  const signal = getPriceSignal(item)

  return (
    <button
      type="button"
      onClick={() => onSelect(item.id)}
      className={cn(
        "flex w-full flex-col gap-1.5 rounded-lg border px-3 py-2.5 text-left transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--tone-present-border)]",
        isSelected
          ? "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)]/40 shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
          : "border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] hover:border-[color:var(--surface-border)]",
      )}
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-[13px] font-medium text-[color:var(--text-primary)]">
          {item.name}
        </span>
        <ClassificationBadge
          label={item.necessity}
          className={cn("h-5 shrink-0 text-[10px]", NEED_LEVEL_STYLES[item.necessity])}
        />
      </div>
      <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
        <ClassificationBadge
          label={item.lifecycle}
          className={cn("h-5 shrink-0 text-[10px]", LIFECYCLE_STYLES[item.lifecycle])}
        />
        {item.depreciation ? (
          <ClassificationBadge
            label={item.depreciation}
            className={cn("h-5 shrink-0 text-[10px]", DEPRECIATION_STYLES[item.depreciation])}
          />
        ) : null}
        <ClassificationBadge
          label={signal.label}
          className={cn("h-5 shrink-0 text-[10px]", signal.className)}
        />
      </div>
      <div className="flex min-w-0 items-center gap-2 text-[11px] text-[color:var(--text-muted)]">
        <span>{item.system}</span>
        <span>·</span>
        <span className="truncate">{formatPrice(item.currentPrice)}</span>
      </div>
    </button>
  )
}

function PlanItemDetail({
  item,
  shopping,
}: {
  item: ShoppingPlanWithLane
  shopping: ShoppingModuleData
}) {
  const signal = getPriceSignal(item)
  const systemDef = shopping.systemDefinitions.find((s) => s.id === item.system)
  const priceRefs = shopping.priceReferences.filter(
    (ref) => ref.system === item.system || ref.category === item.category,
  )

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]">
      <div className="min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:var(--muted-surface-border)_transparent] overflow-y-auto">
        {/* Basic Info */}
        <div className="p-5 pb-0">
          <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">{item.name}</h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <ClassificationBadge
              label={item.necessity}
              className={NEED_LEVEL_STYLES[item.necessity]}
            />
            <ClassificationBadge
              label={item.lifecycle}
              className={LIFECYCLE_STYLES[item.lifecycle]}
            />
            {item.depreciation ? (
              <ClassificationBadge
                label={item.depreciation}
                className={DEPRECIATION_STYLES[item.depreciation]}
              />
            ) : null}
            <ClassificationBadge label={signal.label} className={signal.className} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-[color:var(--text-muted)]">
            <span>{item.system}</span>
            <span>{item.category}</span>
            <span>{item.spaces.join(" / ")}</span>
            <span>{item.stages.join(" / ")}</span>
          </div>
        </div>

        {/* Reason & Note */}
        <div className="p-5 pb-0">
          <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3">
            <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
              决策理由
            </div>
            <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
              {item.reason}
            </p>
            {item.note ? (
              <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">{item.note}</p>
            ) : null}
          </div>
        </div>

        {/* Price Info */}
        <div className="p-5 pb-0">
          <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
            价格参考
          </div>
          <div className="mt-3 space-y-2">
            <ShoppingPriceRow label="当前价格" value={formatPrice(item.currentPrice)} />
            <ShoppingPriceRow label="可购入价格" value={`<= ${formatPrice(item.buyBelowPrice)}`} />
            <ShoppingPriceRow label="偏贵价格" value={`>= ${formatPrice(item.overpayPrice)}`} />
          </div>
        </div>

        {/* System Info */}
        {systemDef ? (
          <div className="p-5 pb-0">
            <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
              系统信息
            </div>
            <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
              {systemDef.summary}
            </p>
            <p className="mt-2 text-[13px] leading-5 text-[color:var(--text-muted)]">
              核心问题：{systemDef.keyQuestion}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {systemDef.secondaryGroups.map((group) => (
                <Badge
                  key={group}
                  variant="outline"
                  className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
                >
                  {group}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        {/* Price Reference Table */}
        {priceRefs.length > 0 ? (
          <div className="p-5">
            <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
              同类价格参考
            </div>
            <div className="mt-3 rounded-lg border border-[color:var(--muted-surface-border)]">
              <Table className="whitespace-nowrap">
                <TableHeader className="sticky top-0 z-10 bg-[color:var(--surface-bg)] shadow-[0_1px_0_0_var(--muted-surface-border)]">
                  <TableRow>
                    <TableHead className="text-xs tracking-[0.1em] text-[color:var(--text-muted)] uppercase">
                      物品
                    </TableHead>
                    <TableHead className="text-xs tracking-[0.1em] text-[color:var(--text-muted)] uppercase">
                      系统
                    </TableHead>
                    <TableHead className="text-xs tracking-[0.1em] text-[color:var(--text-muted)] uppercase">
                      入门价
                    </TableHead>
                    <TableHead className="text-xs tracking-[0.1em] text-[color:var(--text-muted)] uppercase">
                      舒适区间
                    </TableHead>
                    <TableHead className="text-xs tracking-[0.1em] text-[color:var(--text-muted)] uppercase">
                      偏贵
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {priceRefs.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-sm text-[color:var(--text-primary)]">
                        <div>{entry.category}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <Badge variant="outline" className={LIFECYCLE_STYLES[entry.lifecycle]}>
                            {entry.lifecycle}
                          </Badge>
                          {entry.depreciation ? (
                            <Badge
                              variant="outline"
                              className={DEPRECIATION_STYLES[entry.depreciation]}
                            >
                              {entry.depreciation}
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-[color:var(--text-secondary)]">
                        {entry.system}
                      </TableCell>
                      <TableCell className="text-sm text-[color:var(--text-secondary)]">
                        {formatPrice(entry.entryPrice)}
                      </TableCell>
                      <TableCell className="text-sm text-[color:var(--text-secondary)]">
                        {formatPrice(entry.sweetSpotPrice)}
                      </TableCell>
                      <TableCell className="text-sm text-[color:var(--text-secondary)]">
                        {formatPrice(entry.overpayPrice)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : null}

        {/* Tags */}
        <div className="p-5">
          <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
            相关标签
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
            >
              {item.laneTitle}
            </Badge>
            <Badge
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
            >
              {item.targetLifestyle}
            </Badge>
            {item.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
              >
                {tag}
              </Badge>
            ))}
          </div>

          {/* Keywords */}
          {item.keywords.length > 0 ? (
            <div className="mt-4">
              <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                搜索关键词
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {item.keywords.map((kw) => (
                  <Badge
                    key={kw}
                    variant="outline"
                    className="border-[color:var(--tone-future-border)] bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]"
                  >
                    {kw}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function ShoppingPlanningTab({
  shopping,
  isWideLayout,
  isFixedLayout,
}: {
  shopping: ShoppingModuleData
  isWideLayout: boolean
  isFixedLayout: boolean
}) {
  const planItems: ShoppingPlanWithLane[] = shopping.purchaseLanes.flatMap((lane) =>
    lane.items.map((item) => ({ ...item, laneId: lane.id, laneTitle: lane.title })),
  )

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [filterDepreciation, setFilterDepreciation] = useState<ShoppingDepreciation | "all">("all")
  const [filterSystem, setFilterSystem] = useState<ShoppingSystem | "all">("all")
  const [filterNecessity, setFilterNecessity] = useState<ShoppingNeedLevel | "all">("all")
  const [filterLifecycle, setFilterLifecycle] = useState<ShoppingLifecycle | "all">("all")

  const filteredItems = useMemo(() => {
    return planItems.filter((item) => {
      if (filterDepreciation !== "all" && item.depreciation !== filterDepreciation) return false
      if (filterSystem !== "all" && item.system !== filterSystem) return false
      if (filterNecessity !== "all" && item.necessity !== filterNecessity) return false
      if (filterLifecycle !== "all" && item.lifecycle !== filterLifecycle) return false
      return true
    })
  }, [planItems, filterDepreciation, filterSystem, filterNecessity, filterLifecycle])

  const selectedItem = planItems.find((item) => item.id === selectedItemId) ?? null

  const hasActiveFilters =
    filterDepreciation !== "all" ||
    filterSystem !== "all" ||
    filterNecessity !== "all" ||
    filterLifecycle !== "all"

  const clearFilters = () => {
    setFilterDepreciation("all")
    setFilterSystem("all")
    setFilterNecessity("all")
    setFilterLifecycle("all")
  }

  return (
    <TabsContent
      value="planning"
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
        {/* Left: Filters + Item List */}
        <div className={cn("flex min-h-0 flex-col gap-3", isFixedLayout && "overflow-hidden")}>
          {/* Filters */}
          <Surface className={cn("shrink-0 overflow-hidden p-4", isWideLayout && "p-3")}>
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium text-[color:var(--text-primary)]">筛选</span>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text-primary)]"
                >
                  <X className="size-3" />
                  清除
                </button>
              ) : null}
            </div>

            <div className="mt-3 space-y-3">
              {/* Depreciation */}
              <div>
                <div className="mb-1.5 text-[11px] tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                  折旧率
                </div>
                <div className="flex flex-wrap gap-1">
                  <FilterChip
                    label="全部"
                    isSelected={filterDepreciation === "all"}
                    onClick={() => setFilterDepreciation("all")}
                  />
                  {ALL_DEPRECIATIONS.map((d) => (
                    <FilterChip
                      key={d}
                      label={d}
                      isSelected={filterDepreciation === d}
                      onClick={() => setFilterDepreciation(d)}
                    />
                  ))}
                </div>
              </div>

              {/* System */}
              <div>
                <div className="mb-1.5 text-[11px] tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                  系统
                </div>
                <div className="flex flex-wrap gap-1">
                  <FilterChip
                    label="全部"
                    isSelected={filterSystem === "all"}
                    onClick={() => setFilterSystem("all")}
                  />
                  {ALL_SYSTEMS.map((s) => (
                    <FilterChip
                      key={s}
                      label={s}
                      isSelected={filterSystem === s}
                      onClick={() => setFilterSystem(s)}
                    />
                  ))}
                </div>
              </div>

              {/* Necessity */}
              <div>
                <div className="mb-1.5 text-[11px] tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                  必要性
                </div>
                <div className="flex flex-wrap gap-1">
                  <FilterChip
                    label="全部"
                    isSelected={filterNecessity === "all"}
                    onClick={() => setFilterNecessity("all")}
                  />
                  {ALL_NECESSITIES.map((n) => (
                    <FilterChip
                      key={n}
                      label={n}
                      isSelected={filterNecessity === n}
                      onClick={() => setFilterNecessity(n)}
                    />
                  ))}
                </div>
              </div>

              {/* Lifecycle */}
              <div>
                <div className="mb-1.5 text-[11px] tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                  生命周期
                </div>
                <div className="flex flex-wrap gap-1">
                  <FilterChip
                    label="全部"
                    isSelected={filterLifecycle === "all"}
                    onClick={() => setFilterLifecycle("all")}
                  />
                  {ALL_LIFECYCLES.map((l) => (
                    <FilterChip
                      key={l}
                      label={l}
                      isSelected={filterLifecycle === l}
                      onClick={() => setFilterLifecycle(l)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </Surface>

          {/* Item List */}
          <Surface className={cn("min-h-0 flex-1 overflow-hidden p-4", isWideLayout && "p-3")}>
            <div className="flex h-full flex-col">
              <div className="mb-3 flex shrink-0 items-center justify-between">
                <span className="text-[13px] font-medium text-[color:var(--text-primary)]">
                  {filteredItems.length} 个物件
                </span>
              </div>

              <div className="min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:var(--muted-surface-border)_transparent] overflow-y-auto">
                {filteredItems.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 min-[520px]:grid-cols-2">
                    {filteredItems.map((item) => (
                      <PlanItemRow
                        key={item.id}
                        item={item}
                        isSelected={selectedItemId === item.id}
                        onSelect={setSelectedItemId}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="当前筛选条件下没有匹配的物件。" compact />
                )}
              </div>
            </div>
          </Surface>
        </div>

        {/* Right: Detail */}
        <div className="min-h-0 overflow-hidden">
          {selectedItem ? (
            <PlanItemDetail item={selectedItem} shopping={shopping} />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)]">
              <p className="text-sm text-[color:var(--text-muted)]">选择一个物件查看采购详情</p>
            </div>
          )}
        </div>
      </div>
    </TabsContent>
  )
}
