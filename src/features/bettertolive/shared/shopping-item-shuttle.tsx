import { useMemo } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { TransferList, type TransferListItem } from "@/components/ui/transfer-list"
import { cn } from "@/lib/utils"
import type { ShoppingAttributeDefinition, ShoppingItem } from "@/features/bettertolive/types"
import {
  itemPrimaryStatusCode,
  statusStyle,
  statusDisplayName,
} from "@/features/bettertolive/shopping/shopping-page-data"

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
              className={cn(
                "h-4.5 px-1.5 text-[10px] leading-none",
                statusStyle(status, attributeDefinitions),
              )}
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
          ? t("shopping.systems.form.assignItemsHelp")
          : scope === "space"
            ? t("shopping.spaces.form.assignItemsHelp")
            : t("shopping.stage.shuttleDescription")
      }
      labels={{
        availableTitle: t("shopping.shuttle.candidates"),
        selectedTitle: t("shopping.shuttle.selected"),
        searchPlaceholder: t("shopping.shuttle.search"),
        emptyAvailable: t("shopping.shuttle.empty"),
        emptySelected: t("shopping.shuttle.noSelected"),
        addChecked: t("shopping.shuttle.addChecked"),
        addAll: t("shopping.shuttle.addAll"),
        removeChecked: t("shopping.shuttle.removeChecked"),
        removeAll: t("shopping.shuttle.removeAll"),
      }}
    />
  )
}
