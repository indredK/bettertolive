import { Pencil, X } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TabsContent } from "@/components/ui/tabs"
import type { ShoppingModuleData } from "@/features/bettertolive/types"
import type {
  ShoppingDepreciation,
  ShoppingLifecycle,
  ShoppingSystem,
} from "@/features/bettertolive/types"
import { EmptyState, Surface } from "@/features/bettertolive/ui/shared/shared"
import {
  DEPRECIATION_STYLES,
  LIFECYCLE_STYLES,
  depreciationDisplayName,
  formatPrice,
  getPriceSignal,
  laneDisplayName,
  lifecycleDisplayName,
  SHOPPING_DEPRECIATION_OPTIONS,
  SHOPPING_LIFECYCLE_OPTIONS,
  systemDisplayName,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"
import {
  AddCard,
  ClassificationBadge,
  ItemMetadataChips,
  ShoppingPriceRow,
} from "@/features/bettertolive/ui/shopping/shopping-page-shared"
import type { ShoppingPlanWithLane } from "@/features/bettertolive/ui/shopping/shopping-types"
import { cn } from "@/lib/utils"

const ALL_DEPRECIATIONS: ShoppingDepreciation[] = SHOPPING_DEPRECIATION_OPTIONS

const ALL_LIFECYCLES: ShoppingLifecycle[] = SHOPPING_LIFECYCLE_OPTIONS

const ALL_SYSTEM_FILTER = "__all_systems__"

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
  onEditPlan,
}: {
  item: ShoppingPlanWithLane
  isSelected: boolean
  onSelect: (id: string) => void
  onEditPlan?: (item: ShoppingPlanWithLane) => void
}) {
  const { t } = useTranslation()
  const signal = getPriceSignal(item, t)

  return (
    <div className="relative w-full">
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
        </div>
        {/* 物品物理属性 + 价格信号 */}
        <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
          <ClassificationBadge
            label={lifecycleDisplayName(item.lifecycle, t)}
            className={cn("h-5 shrink-0 text-[10px]", LIFECYCLE_STYLES[item.lifecycle])}
          />
          {item.depreciation ? (
            <ClassificationBadge
              label={depreciationDisplayName(item.depreciation, t)}
              className={cn("h-5 shrink-0 text-[10px]", DEPRECIATION_STYLES[item.depreciation])}
            />
          ) : null}
          <ClassificationBadge
            label={signal.label}
            className={cn("h-5 shrink-0 text-[10px]", signal.className)}
          />
        </div>
        {/* 归属标签:三行不同颜色 */}
        <ItemMetadataChips item={item} compact />
        <div className="flex min-w-0 items-center gap-2 text-[11px] text-[color:var(--text-muted)]">
          <span className="truncate">{formatPrice(item.currentPrice)}</span>
        </div>
      </button>

      {onEditPlan ? (
        <Button
          size="icon-sm"
          variant="ghost"
          className="absolute top-1.5 right-1.5 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
          onClick={(e) => {
            e.stopPropagation()
            onEditPlan(item)
          }}
        >
          <Pencil className="size-3.5" />
        </Button>
      ) : null}
    </div>
  )
}

function PlanItemDetail({
  item,
  shopping,
  onEditPlan,
}: {
  item: ShoppingPlanWithLane
  shopping: ShoppingModuleData
  onEditPlan?: (item: ShoppingPlanWithLane) => void
}) {
  const { t } = useTranslation()
  const signal = getPriceSignal(item, t)
  const systemDef = shopping.systemDefinitions.find((s) => s.id === item.system)

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]">
      <div className="min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:var(--muted-surface-border)_transparent] overflow-y-auto">
        {/* Basic Info */}
        <div className="p-5 pb-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">{item.name}</h3>
            {onEditPlan ? (
              <Button
                size="icon-sm"
                variant="ghost"
                className="shrink-0 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
                onClick={() => onEditPlan(item)}
              >
                <Pencil className="size-4" />
              </Button>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {/* 物品物理属性 + 价格信号(归属信息走下面的 ItemMetadataChips) */}
            <ClassificationBadge
              label={lifecycleDisplayName(item.lifecycle, t)}
              className={LIFECYCLE_STYLES[item.lifecycle]}
            />
            {item.depreciation ? (
              <ClassificationBadge
                label={depreciationDisplayName(item.depreciation, t)}
                className={DEPRECIATION_STYLES[item.depreciation]}
              />
            ) : null}
            <ClassificationBadge label={signal.label} className={signal.className} />
          </div>
          {/* 归属标签:三行不同颜色 — 系统(蓝)/ 空间(绿)/ 阶段(紫) */}
          <div className="mt-2">
            <ItemMetadataChips item={item} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-[color:var(--text-muted)]">
            <span>{item.category}</span>
          </div>
        </div>

        {/* Reason & Note */}
        <div className="p-5 pb-0">
          <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3">
            <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
              {t("shopping.planning.decisionReason")}
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
            {t("shopping.planning.priceReference")}
          </div>
          <div className="mt-3 space-y-2">
            <ShoppingPriceRow
              label={t("shopping.planning.currentPrice")}
              value={formatPrice(item.currentPrice)}
            />
            <ShoppingPriceRow
              label={t("shopping.planning.buyBelowPrice")}
              value={`<= ${formatPrice(item.buyBelowPrice)}`}
            />
            <ShoppingPriceRow
              label={t("shopping.planning.overpayPrice")}
              value={`>= ${formatPrice(item.overpayPrice)}`}
            />
          </div>
        </div>

        {/* System Info */}
        {systemDef ? (
          <div className="p-5 pb-0">
            <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
              {t("shopping.planning.systemInfo")}
            </div>
            <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
              {systemDef.summary}
            </p>
            <p className="mt-2 text-[13px] leading-5 text-[color:var(--text-muted)]">
              {t("shopping.planning.coreQuestion", { question: systemDef.keyQuestion })}
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

        {/* Tags — 现在只剩 lane + targetLifestyle;归属标签由上方的 ItemMetadataChips 承担 */}
        <div className="p-5">
          <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
            {t("shopping.planning.relatedTags")}
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
            >
              {laneDisplayName(item.laneId, item.laneTitle, t)}
            </Badge>
            <Badge
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
            >
              {item.targetLifestyle}
            </Badge>
          </div>

          {/* Keywords */}
          {item.keywords.length > 0 ? (
            <div className="mt-4">
              <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                {t("shopping.planning.searchKeywords")}
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
  isManagementMode,
  onEditPlan,
  onAddNew,
  planItems,
}: {
  shopping: ShoppingModuleData
  isWideLayout: boolean
  isFixedLayout: boolean
  isManagementMode?: boolean
  onEditPlan?: (item: ShoppingPlanWithLane) => void
  onAddNew?: () => void
  planItems: ShoppingPlanWithLane[]
}) {
  const { t } = useTranslation()

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null)
  const [filterDepreciation, setFilterDepreciation] = useState<ShoppingDepreciation | "all">("all")
  const [filterSystem, setFilterSystem] = useState<ShoppingSystem | typeof ALL_SYSTEM_FILTER>(
    ALL_SYSTEM_FILTER,
  )
  // 注:filterNecessity 已删除 — 物品不再有 necessity 字段
  const [filterLifecycle, setFilterLifecycle] = useState<ShoppingLifecycle | "all">("all")
  const systemOptions = useMemo(
    () =>
      Array.from(
        new Set([
          ...shopping.systemDefinitions.map((definition) => definition.id),
          ...planItems.map((item) => item.system),
        ]),
      ),
    [shopping.systemDefinitions, planItems],
  )

  const filteredItems = useMemo(() => {
    return planItems.filter((item) => {
      if (filterDepreciation !== "all" && item.depreciation !== filterDepreciation) return false
      if (filterSystem !== ALL_SYSTEM_FILTER && item.system !== filterSystem) return false
      if (filterLifecycle !== "all" && item.lifecycle !== filterLifecycle) return false
      return true
    })
  }, [planItems, filterDepreciation, filterSystem, filterLifecycle])

  const selectedItem = planItems.find((item) => item.id === selectedItemId) ?? null

  const hasActiveFilters =
    filterDepreciation !== "all" || filterSystem !== ALL_SYSTEM_FILTER || filterLifecycle !== "all"

  const clearFilters = () => {
    setFilterDepreciation("all")
    setFilterSystem(ALL_SYSTEM_FILTER)
    // 注:filterNecessity 已删除
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
              <span className="text-[13px] font-medium text-[color:var(--text-primary)]">
                {t("shopping.planning.filter")}
              </span>
              {hasActiveFilters ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text-primary)]"
                >
                  <X className="size-3" />
                  {t("shopping.planning.clear")}
                </button>
              ) : null}
            </div>

            <div className="mt-3 space-y-3">
              {/* Depreciation */}
              <div>
                <div className="mb-1.5 text-[11px] tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                  {t("shopping.planning.depreciation")}
                </div>
                <div className="flex flex-wrap gap-1">
                  <FilterChip
                    label={t("shopping.planning.all")}
                    isSelected={filterDepreciation === "all"}
                    onClick={() => setFilterDepreciation("all")}
                  />
                  {ALL_DEPRECIATIONS.map((d) => (
                    <FilterChip
                      key={d}
                      label={depreciationDisplayName(d, t)}
                      isSelected={filterDepreciation === d}
                      onClick={() => setFilterDepreciation(d)}
                    />
                  ))}
                </div>
              </div>

              {/* System */}
              <div>
                <div className="mb-1.5 text-[11px] tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                  {t("shopping.planning.system")}
                </div>
                <div className="flex flex-wrap gap-1">
                  <FilterChip
                    label={t("shopping.planning.all")}
                    isSelected={filterSystem === ALL_SYSTEM_FILTER}
                    onClick={() => setFilterSystem(ALL_SYSTEM_FILTER)}
                  />
                  {systemOptions.map((s) => (
                    <FilterChip
                      key={s}
                      label={systemDisplayName(s, t)}
                      isSelected={filterSystem === s}
                      onClick={() => setFilterSystem(s)}
                    />
                  ))}
                </div>
              </div>

              {/* 注:Necessity filter 已删除 — 物品不再有 necessity 字段 */}

              {/* Lifecycle */}
              <div>
                <div className="mb-1.5 text-[11px] tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                  {t("shopping.planning.lifecycle")}
                </div>
                <div className="flex flex-wrap gap-1">
                  <FilterChip
                    label={t("shopping.planning.all")}
                    isSelected={filterLifecycle === "all"}
                    onClick={() => setFilterLifecycle("all")}
                  />
                  {ALL_LIFECYCLES.map((l) => (
                    <FilterChip
                      key={l}
                      label={lifecycleDisplayName(l, t)}
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
                  {t("shopping.planning.itemCount", { count: filteredItems.length })}
                </span>
              </div>

              <div className="min-h-0 flex-1 [scrollbar-width:thin] [scrollbar-color:var(--muted-surface-border)_transparent] overflow-y-auto">
                {filteredItems.length > 0 || (isManagementMode && onAddNew) ? (
                  <div className="grid auto-rows-max grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-2">
                    {isManagementMode && onAddNew ? <AddCard onClick={onAddNew} /> : null}
                    {filteredItems.map((item) => (
                      <PlanItemRow
                        key={item.id}
                        item={item}
                        isSelected={selectedItemId === item.id}
                        onSelect={setSelectedItemId}
                        onEditPlan={isManagementMode ? onEditPlan : undefined}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState message={t("shopping.planning.noMatchingItems")} compact />
                )}
              </div>
            </div>
          </Surface>
        </div>

        {/* Right: Detail */}
        <div className="min-h-0 overflow-hidden">
          {selectedItem ? (
            <PlanItemDetail
              item={selectedItem}
              shopping={shopping}
              onEditPlan={isManagementMode ? onEditPlan : undefined}
            />
          ) : (
            <div className="flex h-full items-center justify-center rounded-xl border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)]">
              <p className="text-sm text-[color:var(--text-muted)]">
                {t("shopping.planning.selectPrompt")}
              </p>
            </div>
          )}
        </div>
      </div>
    </TabsContent>
  )
}
