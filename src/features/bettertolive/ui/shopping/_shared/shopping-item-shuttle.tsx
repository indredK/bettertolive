import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { TransferList, type TransferListItem } from "@/components/ui/transfer-list"
import type { ShoppingAttributeDefinition, ShoppingItem } from "@/features/bettertolive/types"
import {
  itemPrimaryStatusCode,
  statusStyle,
  statusDisplayName,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"

type ShuttleScope = "system" | "space" | "stage"

export function ShoppingItemShuttle({
  items,
  attributeDefinitions,
  selectedIds,
  onChange,
  scope,
  className,
}: {
  items: ShoppingItem[]
  attributeDefinitions?: ShoppingAttributeDefinition[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
  scope: ShuttleScope
  className?: string
}) {
  const { t } = useTranslation()

  const transferItems = useMemo<TransferListItem[]>(
    () =>
      items.map((item) => {
        const status = itemPrimaryStatusCode(item, attributeDefinitions)
        return {
          id: item.id,
          title: item.name,
          description:
            item.children.length > 0
              ? item.children.map((child) => child.name).join(" / ")
              : undefined,
          searchText: [
            item.name,
            status,
            ...item.children.flatMap((child) => [
              child.name,
              child.status,
              child.lifecycle,
              child.depreciation,
            ]),
          ].join(" "),
          meta: (
            <Badge
              variant="outline"
              className={`h-4.5 px-1.5 text-[10px] leading-none ${statusStyle(status, attributeDefinitions)}`}
            >
              {statusDisplayName(status, t, attributeDefinitions)}
            </Badge>
          ),
        }
      }),
    [attributeDefinitions, items, t],
  )

  return (
    <TransferList
      items={transferItems}
      selectedIds={selectedIds}
      onChange={onChange}
      className={className}
      itemLayout={scope === "stage" ? "compact" : "default"}
      description={
        scope === "system"
          ? t("shopping.systems.form.assignItemsHelp", "将属于此系统的物品移至右侧，保存后生效")
          : scope === "space"
            ? t("shopping.spaces.form.assignItemsHelp", "将属于此空间的物品移至右侧，保存后生效")
            : t("shopping.stage.shuttleDescription", "将属于此阶段的物品移至右侧，保存后生效")
      }
      labels={{
        availableTitle: t("shopping.shuttle.candidates", "候选"),
        selectedTitle: t("shopping.shuttle.selected", "已选"),
        searchPlaceholder: t("shopping.shuttle.search", "搜索物品名"),
        emptyAvailable: t("shopping.shuttle.empty", "暂无候选"),
        emptySelected: t("shopping.shuttle.noSelected", "尚未选择"),
        addChecked: t("shopping.shuttle.addChecked", "加入勾选"),
        addAll: t("shopping.shuttle.addAll", "全部加入"),
        removeChecked: t("shopping.shuttle.removeChecked", "移除勾选"),
        removeAll: t("shopping.shuttle.removeAll", "全部移除"),
      }}
    />
  )
}
