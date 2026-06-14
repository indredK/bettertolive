import { Search, Pencil, Trash2 } from "lucide-react"
import type { ReactNode } from "react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { AnimatedIconButton } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { ShoppingItem, ShoppingModuleData } from "@/features/bettertolive/types"
import { ShoppingStatus } from "@/features/bettertolive/types"
import { deleteItem } from "@/features/bettertolive/api/shopping-crud-api"
import { confirmUndoableDelete } from "@/features/bettertolive/ui/shopping/_shared/shopping-delete"
import {
  depreciationStyle,
  SYSTEM_CHIP_STYLE,
  SPACE_CHIP_STYLE,
  depreciationDisplayName,
  formatPrice,
  itemHasStatusSemantic,
  itemPrimaryStatusCode,
  lifecycleStyle,
  lifecycleDisplayName,
  semanticStatusCode,
  statusStyle,
  statusDisplayName,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"
import {
  SHOPPING_DETAIL_CARD_CLASS,
  SHOPPING_MUTED_PANEL_CLASS,
  SHOPPING_SELECTABLE_CARD_CLASS,
  SHOPPING_SELECTED_CARD_CLASS,
  ShoppingDetailPane,
  ShoppingEmptyDetailCard,
  ShoppingSidebarPane,
  ShoppingTabBody,
  ShoppingTabViewport,
} from "@/features/bettertolive/ui/shopping/_shared/shopping-page-shared"
import {
  FilterAppliedChips,
  FilterPopoverButton,
  type FilterPopoverDimension,
} from "@/features/bettertolive/ui/shared/filter-popover"
import { cn } from "@/lib/utils"

// ---- Item card (compact, for the left list) ----

type ShoppingStatusFilter = "all" | ShoppingStatus

function PlanItemCard({
  item,
  isSelected,
  onSelect,
  onEdit,
  isControlMode,
  attributeDefinitions,
}: {
  item: ShoppingItem
  isSelected: boolean
  onSelect: (id: string) => void
  onEdit: () => void
  isControlMode: boolean
  attributeDefinitions: ShoppingModuleData["attributeDefinitions"]
}) {
  const { t } = useTranslation()
  const status = itemPrimaryStatusCode(item, attributeDefinitions)

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
              className={cn("px-1.5 py-0 text-[10px]", statusStyle(status, attributeDefinitions))}
            >
              {statusDisplayName(status, t, attributeDefinitions)}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground px-1.5 py-0 text-[10px]">
              {t("shopping.item.childCount", {
                count: item.children.length,
              })}
            </Badge>
          </div>
        </button>
        <AnimatedIconButton
          show={isControlMode}
          size="icon-sm"
          variant="ghost"
          className="h-6 w-6 shrink-0"
          label={t("shopping.planning.edit")}
          icon={<Pencil className="size-3" />}
          onClick={onEdit}
        />
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

function PlanItemDetail({
  item,
  shopping,
  isControlMode,
  onDelete,
  attributeDefinitions,
}: {
  item: ShoppingItem
  shopping: ShoppingModuleData
  isControlMode: boolean
  onDelete?: () => void
  attributeDefinitions: ShoppingModuleData["attributeDefinitions"]
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
        <AnimatedIconButton
          show={isControlMode && Boolean(onDelete)}
          variant="outline"
          size="sm"
          label={t("shopping.planning.delete")}
          icon={<Trash2 className="h-4 w-4" />}
          onClick={onDelete}
        />
      </CardHeader>
      <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4">
        {/* 标签区：系统 + 空间 合并到一行 */}
        <div className="space-y-2">
          {systemNames.length > 0 && (
            <DetailTextValue label={t("shopping.item.systemTags")}>
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
            <DetailTextValue label={t("shopping.item.spaceTags")}>
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
          <DetailPanelSection title={t("shopping.item.children")}>
            <div className="space-y-2.5">
              {item.children.map((child) => (
                <ItemChildDetailCard
                  key={child.id}
                  child={child}
                  attributeDefinitions={attributeDefinitions}
                />
              ))}
            </div>
          </DetailPanelSection>
        ) : (
          <div className="text-muted-foreground text-sm">{t("shopping.item.noChildren")}</div>
        )}

        {/* 备注 */}
        {item.note && (
          <DetailPanelSection title={t("shopping.note")}>
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
  const attributeDefinitions = shopping.attributeDefinitions
  const filterDimensions = useMemo<FilterPopoverDimension[]>(
    () => [
      {
        key: "status",
        label: t("shopping.filter.status"),
        allLabel: t("shopping.filter.all"),
        value: statusFilter,
        options: [
          {
            value: ShoppingStatus.Owned,
            label: statusDisplayName(
              semanticStatusCode("owned", attributeDefinitions),
              t,
              attributeDefinitions,
            ),
          },
          {
            value: ShoppingStatus.Wanted,
            label: statusDisplayName(
              semanticStatusCode("wanted", attributeDefinitions),
              t,
              attributeDefinitions,
            ),
          },
        ],
      },
      {
        key: "system",
        label: t("shopping.filter.system"),
        allLabel: t("shopping.filter.allSystems"),
        value: systemFilter,
        options: [
          { value: "none", label: t("shopping.filter.noSystem") },
          ...shopping.systemDefinitions.map((system) => ({
            value: system.id,
            label: system.name || system.id,
          })),
        ],
      },
      {
        key: "space",
        label: t("shopping.filter.space"),
        allLabel: t("shopping.filter.allSpaces"),
        value: spaceFilter,
        options: [
          { value: "none", label: t("shopping.filter.noSpace") },
          ...shopping.spaceDefinitions.map((space) => ({
            value: space.id,
            label: space.name,
          })),
        ],
      },
    ],
    [
      shopping.systemDefinitions,
      shopping.spaceDefinitions,
      attributeDefinitions,
      statusFilter,
      systemFilter,
      spaceFilter,
      t,
    ],
  )

  const handleFilterChange = (key: string, value: string) => {
    if (key === "status") setStatusFilter(value as ShoppingStatusFilter)
    else if (key === "system") setSystemFilter(value)
    else if (key === "space") setSpaceFilter(value)
  }

  const handleClearAll = () => {
    setStatusFilter("all")
    setSystemFilter("all")
    setSpaceFilter("all")
  }

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

      if (
        statusFilter === ShoppingStatus.Owned &&
        !itemHasStatusSemantic(item, "owned", attributeDefinitions)
      ) {
        return false
      }

      if (
        statusFilter === ShoppingStatus.Wanted &&
        !itemHasStatusSemantic(item, "wanted", attributeDefinitions)
      ) {
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
  }, [attributeDefinitions, items, localQuery, spaceFilter, statusFilter, systemFilter])

  const selectedItem = useMemo(
    () => filteredItems.find((i) => i.id === selectedId) ?? filteredItems[0] ?? null,
    [filteredItems, selectedId],
  )

  const handleDelete = (id: string, name: string) => {
    confirmUndoableDelete({
      confirmMessage: t("common.confirm.deleteItem", {
        name,
      }),
      pendingMessage: t("common.toast.deletePending", {
        name,
      }),
      successMessage: t("shopping.toast.deleteSuccessItem", {
        name,
      }),
      failureMessage: t("shopping.toast.deleteFailedItem"),
      undoLabel: t("common.actions.undo"),
      undoneMessage: t("common.toast.deleteUndone", {
        name,
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
      <ShoppingTabBody>
        {/* 左侧：物品列表 */}
        <ShoppingSidebarPane contentClassName="gap-3">
          <div className="shrink-0 space-y-2">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <div className="relative min-w-0 flex-1">
                <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2" />
                <Input
                  value={localQuery}
                  onChange={(event) => setLocalQuery(event.target.value)}
                  placeholder={t("shopping.planning.searchPlaceholder")}
                  className="pl-8"
                />
              </div>
              <FilterPopoverButton
                className="shrink-0"
                popoverWidth="16.5rem"
                dimensions={filterDimensions}
                onChangeFilter={handleFilterChange}
                onClearAll={handleClearAll}
              />
            </div>
            <FilterAppliedChips dimensions={filterDimensions} onChangeFilter={handleFilterChange} />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="text-muted-foreground mb-2 text-[11px]">
              {t("shopping.planning.filteredItemCount", {
                count: filteredItems.length,
                total: items.length,
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
                  attributeDefinitions={attributeDefinitions}
                />
              ))}
              {filteredItems.length === 0 && (
                <div className="text-muted-foreground py-4 text-center text-xs">
                  {t("shopping.planning.noMatchingItems")}
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
              attributeDefinitions={attributeDefinitions}
              onDelete={
                isControlMode ? () => handleDelete(selectedItem.id, selectedItem.name) : undefined
              }
            />
          ) : (
            <ShoppingEmptyDetailCard message={t("shopping.planning.selectPrompt")} />
          )}
        </ShoppingDetailPane>
      </ShoppingTabBody>
    </ShoppingTabViewport>
  )
}

function ItemChildDetailCard({
  child,
  attributeDefinitions,
}: {
  child: ShoppingItem["children"][number]
  attributeDefinitions: ShoppingModuleData["attributeDefinitions"]
}) {
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
              className={cn(
                "px-1.5 py-0 text-[10px]",
                statusStyle(child.status, attributeDefinitions),
              )}
            >
              {statusDisplayName(child.status, t, attributeDefinitions)}
            </Badge>
          ) : null}
          {child.lifecycle ? (
            <Badge
              variant="outline"
              className={cn(
                "px-1.5 py-0 text-[10px]",
                lifecycleStyle(child.lifecycle, attributeDefinitions),
              )}
            >
              {lifecycleDisplayName(child.lifecycle, t, attributeDefinitions)}
            </Badge>
          ) : null}
          {child.depreciation ? (
            <Badge
              variant="outline"
              className={cn(
                "px-1.5 py-0 text-[10px]",
                depreciationStyle(child.depreciation, attributeDefinitions),
              )}
            >
              {depreciationDisplayName(child.depreciation, t, attributeDefinitions)}
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
                  label={t("shopping.priceRef.entry")}
                  value={
                    channelPrice.entryPrice != null ? formatPrice(channelPrice.entryPrice) : "-"
                  }
                  className="min-w-0 flex-1"
                />
                <DetailMetric
                  label={t("shopping.priceRef.sweet")}
                  value={
                    channelPrice.sweetSpotPrice != null
                      ? formatPrice(channelPrice.sweetSpotPrice)
                      : "-"
                  }
                  className="min-w-0 flex-1"
                />
                <DetailMetric
                  label={t("shopping.priceRef.overpay")}
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
          {t("shopping.item.noChildChannels")}
        </div>
      )}
    </div>
  )
}
