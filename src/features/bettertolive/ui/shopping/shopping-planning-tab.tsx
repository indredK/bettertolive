import { Search, SlidersHorizontal, X, Pencil, Plus, Trash2 } from "lucide-react"
import type { ReactNode } from "react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { ShoppingItem, ShoppingModuleData } from "@/features/bettertolive/types"
import { ShoppingStatus } from "@/features/bettertolive/types"
import { deleteItem } from "@/features/bettertolive/api/shopping-crud-api"
import { confirmUndoableDelete } from "@/features/bettertolive/ui/shopping/shopping-delete"
import {
  DEPRECIATION_STYLES,
  LIFECYCLE_STYLES,
  STATUS_STYLES,
  SYSTEM_CHIP_STYLE,
  SPACE_CHIP_STYLE,
  depreciationDisplayName,
  formatPrice,
  itemHasStatus,
  itemPrimaryStatus,
  lifecycleDisplayName,
  statusDisplayName,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"
import {
  SHOPPING_DETAIL_CARD_CLASS,
  SHOPPING_CONTROL_BADGE_CLASS,
  SHOPPING_IDLE_BADGE_CLASS,
  SHOPPING_MUTED_PANEL_CLASS,
  SHOPPING_SELECTABLE_CARD_CLASS,
  SHOPPING_SELECTED_CARD_CLASS,
  ShoppingDetailPane,
  ShoppingEmptyDetailCard,
  ShoppingSidebarPane,
  ShoppingTabBody,
  ShoppingTabViewport,
} from "@/features/bettertolive/ui/shopping/shopping-page-shared"
import { cn } from "@/lib/utils"

// ---- Item card (compact, for the left list) ----

type ShoppingStatusFilter = "all" | ShoppingStatus

function PlanItemCard({
  item,
  isSelected,
  onSelect,
  onEdit,
  isControlMode,
}: {
  item: ShoppingItem
  isSelected: boolean
  onSelect: (id: string) => void
  onEdit: () => void
  isControlMode: boolean
}) {
  const { t } = useTranslation()
  const status = itemPrimaryStatus(item)

  return (
    <div className={cn(SHOPPING_SELECTABLE_CARD_CLASS, isSelected && SHOPPING_SELECTED_CARD_CLASS)}>
      <div className="flex items-start gap-2 py-2.5 pr-3 pl-8">
        <button
          type="button"
          onClick={() => onSelect(item.id)}
          className="focus-visible:ring-ring flex min-w-0 flex-1 appearance-none flex-col gap-1.5 border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2"
        >
          <span className="truncate text-[13px] font-medium">{item.name}</span>
          <div className="flex flex-wrap gap-1">
            <Badge
              variant="outline"
              className={cn("px-1.5 py-0 text-[10px]", STATUS_STYLES[status])}
            >
              {statusDisplayName(status, t)}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground px-1.5 py-0 text-[10px]">
              {t("shopping.item.childCount", {
                count: item.children.length,
                defaultValue: "{{count}} 个子级",
              })}
            </Badge>
          </div>
        </button>
        {isControlMode && (
          <Button size="icon-sm" variant="ghost" className="h-6 w-6 shrink-0" onClick={onEdit}>
            <Pencil className="size-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

// ---- Right-side detail panel ----

function DetailPanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <div className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
        {title}
      </div>
      {children}
    </section>
  )
}

function DetailMetric({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "bg-muted/40 flex items-baseline justify-between gap-2 rounded-md px-2.5 py-1.5",
        className,
      )}
    >
      <span className="text-muted-foreground text-[11px]">{label}</span>
      <span className="text-sm font-medium tabular-nums">{value}</span>
    </div>
  )
}

function DetailTextValue({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-muted-foreground mb-1.5 text-[11px]">{label}</div>
      {children}
    </div>
  )
}

function FilterChip({
  active,
  children,
  onClick,
  compact = false,
}: {
  active: boolean
  children: ReactNode
  onClick: () => void
  compact?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border text-[11px] transition-colors",
        compact ? "px-2 py-0.5" : "px-2.5 py-1",
        active
          ? "border-ring/50 bg-accent text-accent-foreground"
          : "border-foreground/10 bg-background/75 text-muted-foreground hover:border-ring/40 hover:text-foreground",
      )}
    >
      {children}
    </button>
  )
}

function AppliedFilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="border-ring/40 bg-accent text-accent-foreground hover:bg-accent/80 inline-flex max-w-full items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-colors"
    >
      <span className="truncate">{label}</span>
      <X className="size-3 shrink-0" />
    </button>
  )
}

function FilterGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="text-muted-foreground text-[10px] font-medium tracking-wide uppercase">
        {title}
      </div>
      <div className="flex max-h-24 flex-wrap gap-1.5 overflow-y-auto pr-1">{children}</div>
    </div>
  )
}

function PlanItemDetail({
  item,
  shopping,
  isControlMode,
  onDelete,
}: {
  item: ShoppingItem
  shopping: ShoppingModuleData
  isControlMode: boolean
  onDelete?: () => void
}) {
  const { t } = useTranslation()

  const systemNames = item.systemTags
    .map((id) => shopping.systemDefinitions.find((s) => s.id === id)?.name ?? id)
    .filter(Boolean)
  const spaceNames = item.spaceTags
    .map((id) => shopping.spaceDefinitions.find((s) => s.id === id)?.name ?? id)
    .filter(Boolean)

  return (
    <Card className={cn(SHOPPING_DETAIL_CARD_CLASS, "flex h-full min-h-0 flex-col")}>
      <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="text-base">{item.name}</CardTitle>
          {item.children.length > 0 && (
            <div className="text-muted-foreground mt-0.5 truncate text-xs">
              {item.children.map((c) => c.name).join(" / ")}
            </div>
          )}
        </div>
        {isControlMode && onDelete && (
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4">
        {/* 标签区：系统 + 空间 合并到一行 */}
        <div className="space-y-2">
          {systemNames.length > 0 && (
            <DetailTextValue label={t("shopping.item.systemTags", "系统标签")}>
              <div className="flex flex-wrap gap-1">
                {systemNames.map((name) => (
                  <Badge key={`sys-${name}`} variant="outline" className={SYSTEM_CHIP_STYLE}>
                    {name}
                  </Badge>
                ))}
              </div>
            </DetailTextValue>
          )}
          {spaceNames.length > 0 && (
            <DetailTextValue label={t("shopping.item.spaceTags", "空间标签")}>
              <div className="flex flex-wrap gap-1">
                {spaceNames.map((name) => (
                  <Badge key={`spc-${name}`} variant="outline" className={SPACE_CHIP_STYLE}>
                    {name}
                  </Badge>
                ))}
              </div>
            </DetailTextValue>
          )}
        </div>

        {/* 子级 */}
        {item.children.length > 0 ? (
          <DetailPanelSection title={t("shopping.item.children", "子级")}>
            <div className="space-y-2.5">
              {item.children.map((child) => (
                <ItemChildDetailCard key={child.id} child={child} />
              ))}
            </div>
          </DetailPanelSection>
        ) : (
          <div className="text-muted-foreground text-sm">
            {t("shopping.item.noChildren", "暂无子级")}
          </div>
        )}

        {/* 备注 */}
        {item.note && (
          <DetailPanelSection title={t("shopping.note", "备注")}>
            <p className="text-sm leading-6">{item.note}</p>
          </DetailPanelSection>
        )}
      </CardContent>
    </Card>
  )
}

// ---- Main component ----

export function ShoppingPlanningTab({
  shopping,
  items,
  isControlMode,
  onEditItem,
  onDeleted,
}: {
  shopping: ShoppingModuleData
  items: ShoppingItem[]
  isControlMode: boolean
  onEditItem: (item: ShoppingItem | null) => void
  onDeleted: () => void
}) {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState<string | null>(() => items[0]?.id ?? null)
  const [localQuery, setLocalQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<ShoppingStatusFilter>("all")
  const [systemFilter, setSystemFilter] = useState("all")
  const [spaceFilter, setSpaceFilter] = useState("all")
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false)

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (systemFilter !== "all" ? 1 : 0) +
    (spaceFilter !== "all" ? 1 : 0)

  const activeSystemLabel =
    systemFilter === "all"
      ? null
      : systemFilter === "none"
        ? t("shopping.filter.noSystem", "未分配系统")
        : (shopping.systemDefinitions.find((system) => system.id === systemFilter)?.name ??
          systemFilter)

  const activeSpaceLabel =
    spaceFilter === "all"
      ? null
      : spaceFilter === "none"
        ? t("shopping.filter.noSpace", "未分配空间")
        : (shopping.spaceDefinitions.find((space) => space.id === spaceFilter)?.name ?? spaceFilter)

  const filteredItems = useMemo(() => {
    const query = localQuery.trim().toLowerCase()

    return items.filter((item) => {
      if (query) {
        const text = [
          item.name,
          item.note,
          ...item.children.map((child) => child.name),
          ...item.children.flatMap((child) =>
            (child.channelPrices ?? []).map((channelPrice) => channelPrice.channel),
          ),
        ]
          .join(" ")
          .toLowerCase()

        if (!text.includes(query)) return false
      }

      if (statusFilter === ShoppingStatus.Owned && !itemHasStatus(item, ShoppingStatus.Owned)) {
        return false
      }

      if (statusFilter === ShoppingStatus.Wanted && !itemHasStatus(item, ShoppingStatus.Wanted)) {
        return false
      }

      if (systemFilter === "none" && item.systemTags.length > 0) return false
      if (
        systemFilter !== "all" &&
        systemFilter !== "none" &&
        !item.systemTags.includes(systemFilter)
      ) {
        return false
      }

      if (spaceFilter === "none" && item.spaceTags.length > 0) return false
      if (
        spaceFilter !== "all" &&
        spaceFilter !== "none" &&
        !item.spaceTags.includes(spaceFilter)
      ) {
        return false
      }

      return true
    })
  }, [items, localQuery, spaceFilter, statusFilter, systemFilter])

  const selectedItem = useMemo(
    () => filteredItems.find((i) => i.id === selectedId) ?? filteredItems[0] ?? null,
    [filteredItems, selectedId],
  )

  const handleDelete = (id: string, name: string) => {
    confirmUndoableDelete({
      confirmMessage: t("shopping.confirm.deleteItem", {
        name,
        defaultValue: `确定删除 ${name} 吗？`,
      }),
      pendingMessage: t("shopping.toast.deletePendingItem", {
        name,
        defaultValue: `已加入删除队列：${name}，5 秒内可撤销`,
      }),
      successMessage: t("shopping.toast.deleteSuccessItem", {
        name,
        defaultValue: `已删除物件：${name}`,
      }),
      failureMessage: t("shopping.toast.deleteFailedItem", "删除物件失败"),
      undoLabel: t("shopping.undo", "撤销"),
      undoneMessage: t("shopping.toast.deleteUndoneItem", {
        name,
        defaultValue: `已撤销删除：${name}`,
      }),
      onDelete: () => deleteItem(id),
      onDeleted: () => {
        setSelectedId(null)
        onDeleted()
      },
    })
  }

  return (
    <ShoppingTabViewport>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h3 className="text-lg font-medium">{t("shopping.planning.title", "物件库")}</h3>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[11px]",
              isControlMode ? SHOPPING_CONTROL_BADGE_CLASS : SHOPPING_IDLE_BADGE_CLASS,
            )}
          >
            {isControlMode
              ? t("shopping.controlMode.on", "控制模式")
              : t("shopping.controlMode.off", "浏览模式")}
          </span>
        </div>
        {isControlMode && (
          <Button size="sm" onClick={() => onEditItem(null)}>
            <Plus className="mr-1 h-4 w-4" />
            {t("shopping.planning.addItem", "新增物品")}
          </Button>
        )}
      </div>

      <ShoppingTabBody>
        {/* 左侧：物品列表 */}
        <ShoppingSidebarPane contentClassName="gap-3">
          <div className="shrink-0 space-y-2">
            <div className="relative">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
              <Input
                value={localQuery}
                onChange={(event) => setLocalQuery(event.target.value)}
                placeholder={t("shopping.planning.searchPlaceholder", "搜索物品 / 子级 / 渠道")}
                className="pl-8"
              />
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <FilterChip
                active={statusFilter === "all"}
                compact
                onClick={() => setStatusFilter("all")}
              >
                {t("shopping.filter.all", "全部")}
              </FilterChip>
              <FilterChip
                active={statusFilter === ShoppingStatus.Owned}
                compact
                onClick={() => setStatusFilter(ShoppingStatus.Owned)}
              >
                {statusDisplayName(ShoppingStatus.Owned, t)}
              </FilterChip>
              <FilterChip
                active={statusFilter === ShoppingStatus.Wanted}
                compact
                onClick={() => setStatusFilter(ShoppingStatus.Wanted)}
              >
                {statusDisplayName(ShoppingStatus.Wanted, t)}
              </FilterChip>
              <Button
                type="button"
                variant={isFilterPanelOpen || activeFilterCount > 0 ? "default" : "outline"}
                size="sm"
                className="ml-auto h-7 gap-1.5 px-2 text-[11px]"
                onClick={() => setIsFilterPanelOpen((open) => !open)}
              >
                <SlidersHorizontal className="size-3.5" />
                {t("shopping.filter.more", "筛选")}
                {activeFilterCount > 0 ? (
                  <span className="bg-background/20 rounded-full px-1 tabular-nums">
                    {activeFilterCount}
                  </span>
                ) : null}
              </Button>
            </div>

            {activeFilterCount > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {statusFilter !== "all" ? (
                  <AppliedFilterChip
                    label={statusDisplayName(statusFilter, t)}
                    onRemove={() => setStatusFilter("all")}
                  />
                ) : null}
                {activeSystemLabel ? (
                  <AppliedFilterChip
                    label={`${t("shopping.filter.system", "系统")}: ${activeSystemLabel}`}
                    onRemove={() => setSystemFilter("all")}
                  />
                ) : null}
                {activeSpaceLabel ? (
                  <AppliedFilterChip
                    label={`${t("shopping.filter.space", "空间")}: ${activeSpaceLabel}`}
                    onRemove={() => setSpaceFilter("all")}
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter("all")
                    setSystemFilter("all")
                    setSpaceFilter("all")
                  }}
                  className="text-muted-foreground hover:text-foreground rounded-full px-2 py-0.5 text-[11px]"
                >
                  {t("shopping.filter.clearAll", "清空")}
                </button>
              </div>
            ) : null}

            {isFilterPanelOpen ? (
              <div className={cn(SHOPPING_MUTED_PANEL_CLASS, "space-y-2 rounded-xl border p-2.5")}>
                <FilterGroup title={t("shopping.filter.system", "系统")}>
                  <FilterChip
                    active={systemFilter === "all"}
                    onClick={() => setSystemFilter("all")}
                  >
                    {t("shopping.filter.allSystems", "全部系统")}
                  </FilterChip>
                  <FilterChip
                    active={systemFilter === "none"}
                    onClick={() => setSystemFilter("none")}
                  >
                    {t("shopping.filter.noSystem", "未分配系统")}
                  </FilterChip>
                  {shopping.systemDefinitions.map((system) => (
                    <FilterChip
                      key={system.id}
                      active={systemFilter === system.id}
                      onClick={() => setSystemFilter(system.id)}
                    >
                      {system.name || system.id}
                    </FilterChip>
                  ))}
                </FilterGroup>

                <FilterGroup title={t("shopping.filter.space", "空间")}>
                  <FilterChip active={spaceFilter === "all"} onClick={() => setSpaceFilter("all")}>
                    {t("shopping.filter.allSpaces", "全部空间")}
                  </FilterChip>
                  <FilterChip
                    active={spaceFilter === "none"}
                    onClick={() => setSpaceFilter("none")}
                  >
                    {t("shopping.filter.noSpace", "未分配空间")}
                  </FilterChip>
                  {shopping.spaceDefinitions.map((space) => (
                    <FilterChip
                      key={space.id}
                      active={spaceFilter === space.id}
                      onClick={() => setSpaceFilter(space.id)}
                    >
                      {space.name}
                    </FilterChip>
                  ))}
                </FilterGroup>
              </div>
            ) : null}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="text-muted-foreground mb-2 text-[11px]">
              {t("shopping.planning.filteredItemCount", {
                count: filteredItems.length,
                total: items.length,
                defaultValue: `${filteredItems.length} / ${items.length} 个物品`,
              })}
            </div>
            <div className="flex flex-col gap-2">
              {filteredItems.map((item) => (
                <PlanItemCard
                  key={item.id}
                  item={item}
                  isSelected={selectedItem?.id === item.id}
                  onSelect={setSelectedId}
                  onEdit={() => onEditItem(item)}
                  isControlMode={isControlMode}
                />
              ))}
              {filteredItems.length === 0 && (
                <div className="text-muted-foreground py-4 text-center text-xs">
                  {t("shopping.planning.noMatchingItems", "无匹配物品")}
                </div>
              )}
            </div>
          </div>
        </ShoppingSidebarPane>

        {/* 右侧：详情 */}
        <ShoppingDetailPane>
          {selectedItem ? (
            <PlanItemDetail
              item={selectedItem}
              shopping={shopping}
              isControlMode={isControlMode}
              onDelete={
                isControlMode ? () => handleDelete(selectedItem.id, selectedItem.name) : undefined
              }
            />
          ) : (
            <ShoppingEmptyDetailCard
              message={t("shopping.planning.selectPrompt", "从左侧选择一个物品查看详情")}
            />
          )}
        </ShoppingDetailPane>
      </ShoppingTabBody>
    </ShoppingTabViewport>
  )
}

function ItemChildDetailCard({ child }: { child: ShoppingItem["children"][number] }) {
  const { t } = useTranslation()
  const channelPrices = child.channelPrices ?? []
  const hasChannelPrices = channelPrices.length > 0

  return (
    <div className={cn(SHOPPING_MUTED_PANEL_CLASS, "rounded-lg border px-3.5 py-3")}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{child.name}</span>
        <div className="flex flex-wrap gap-1">
          {child.status ? (
            <Badge
              variant="outline"
              className={cn("px-1.5 py-0 text-[10px]", STATUS_STYLES[child.status])}
            >
              {statusDisplayName(child.status, t)}
            </Badge>
          ) : null}
          {child.lifecycle ? (
            <Badge
              variant="outline"
              className={cn("px-1.5 py-0 text-[10px]", LIFECYCLE_STYLES[child.lifecycle])}
            >
              {lifecycleDisplayName(child.lifecycle, t)}
            </Badge>
          ) : null}
          {child.depreciation ? (
            <Badge
              variant="outline"
              className={cn("px-1.5 py-0 text-[10px]", DEPRECIATION_STYLES[child.depreciation])}
            >
              {depreciationDisplayName(child.depreciation, t)}
            </Badge>
          ) : null}
        </div>
      </div>

      {hasChannelPrices ? (
        <div className="mt-2.5 space-y-1.5">
          {channelPrices.map((channelPrice) => (
            <div key={channelPrice.id} className="flex items-center gap-3">
              <span className="text-muted-foreground min-w-16 shrink-0 text-xs font-medium">
                {channelPrice.channel}
              </span>
              <div className="flex flex-1 flex-wrap gap-x-4 gap-y-1 text-xs">
                <DetailMetric
                  label={t("shopping.priceRef.entry", "入门")}
                  value={
                    channelPrice.entryPrice != null ? formatPrice(channelPrice.entryPrice) : "-"
                  }
                  className="min-w-0 flex-1"
                />
                <DetailMetric
                  label={t("shopping.priceRef.sweet", "甜蜜")}
                  value={
                    channelPrice.sweetSpotPrice != null
                      ? formatPrice(channelPrice.sweetSpotPrice)
                      : "-"
                  }
                  className="min-w-0 flex-1"
                />
                <DetailMetric
                  label={t("shopping.priceRef.overpay", "虚高")}
                  value={
                    channelPrice.overpayPrice != null ? formatPrice(channelPrice.overpayPrice) : "-"
                  }
                  className="min-w-0 flex-1"
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground mt-2.5 text-xs">
          {t("shopping.item.noChildChannels", "暂未添加渠道价格")}
        </div>
      )}
    </div>
  )
}
