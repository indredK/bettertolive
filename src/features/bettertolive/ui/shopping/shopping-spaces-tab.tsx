import { House, Pencil, Trash2 } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { DndContext, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

import { AnimatedIconButton } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  ShoppingItem,
  ShoppingModuleData,
  ShoppingSpaceDefinition,
} from "@/features/bettertolive/types"
import { ShoppingStatus } from "@/features/bettertolive/types"
import {
  deleteSpaceDefinition,
  reorderSpaceDefinitions,
} from "@/features/bettertolive/api/shopping-crud-api"
import { confirmUndoableDelete } from "@/features/bettertolive/ui/shopping/shopping-delete"
import { itemHasStatus } from "@/features/bettertolive/ui/shopping/shopping-page-data"
import {
  ItemCard,
  SHOPPING_DETAIL_CARD_CLASS,
  SHOPPING_MUTED_PANEL_CLASS,
  SHOPPING_SELECTABLE_CARD_CLASS,
  SHOPPING_SELECTED_CARD_CLASS,
  ShoppingDetailPane,
  ShoppingEmptyDetailCard,
  ShoppingSidebarPane,
  ShoppingTabBody,
  ShoppingTabViewport,
} from "@/features/bettertolive/ui/shopping/shopping-page-shared"
import { SortableShoppingCard } from "@/features/bettertolive/ui/shopping/shopping-sortable-card"
import { cn } from "@/lib/utils"

// ---- Left-side space card ----

function SpaceMapCard({
  space,
  items,
  isSelected,
  isControlMode,
  onSelect,
  onEditSpace,
}: {
  space: ShoppingSpaceDefinition
  items: ShoppingItem[]
  isSelected: boolean
  isControlMode: boolean
  onSelect: (id: string) => void
  onEditSpace: (space: ShoppingSpaceDefinition) => void
}) {
  const { t } = useTranslation()
  const owned = items.filter((i) => itemHasStatus(i, ShoppingStatus.Owned))
  const wanted = items.filter((i) => itemHasStatus(i, ShoppingStatus.Wanted))

  return (
    <div className={cn(SHOPPING_SELECTABLE_CARD_CLASS, isSelected && SHOPPING_SELECTED_CARD_CLASS)}>
      <div className="flex items-start gap-2 py-2.5 pr-3 pl-8">
        <button
          type="button"
          onClick={() => onSelect(space.id)}
          className="focus-visible:ring-ring flex min-w-0 flex-1 appearance-none flex-col gap-1 border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2"
        >
          <div className="flex min-w-0 items-center gap-1.5">
            <House className="text-muted-foreground size-3.5 shrink-0" />
            <span className="truncate text-[13px] font-medium">{space.name}</span>
          </div>
          <div className="text-muted-foreground flex gap-1.5 text-[11px]">
            <span>
              {t("shopping.spaces.ownedInlineCount", {
                count: owned.length,
                defaultValue: "{{count}} 已有",
              })}
            </span>
            <span>
              {t("shopping.spaces.wantedInlineCount", {
                count: wanted.length,
                defaultValue: "{{count}} 待购",
              })}
            </span>
          </div>
        </button>
        <AnimatedIconButton
          show={isControlMode}
          size="icon-sm"
          variant="ghost"
          className="h-6 w-6 shrink-0"
          label={t("shopping.spaces.edit", "编辑空间")}
          icon={<Pencil className="size-3" />}
          onClick={() => onEditSpace(space)}
        />
      </div>
    </div>
  )
}

// ---- Right-side detail panel ----

function SpaceDetailPanel({
  space,
  items,
  shopping,
  isControlMode,
  onDelete,
}: {
  space: ShoppingSpaceDefinition
  items: ShoppingItem[]
  shopping: ShoppingModuleData
  isControlMode: boolean
  onDelete?: () => void
}) {
  const { t } = useTranslation()

  const systemIds = useMemo(() => [...new Set(items.map((i) => i.systemTags).flat())], [items])

  return (
    <Card className={cn(SHOPPING_DETAIL_CARD_CLASS, "flex h-full min-h-0 flex-col")}>
      <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <House className="size-4.5" />
            <CardTitle>{space.name}</CardTitle>
          </div>
          {space.note && <div className="text-muted-foreground text-xs">{space.note}</div>}
          <div className="text-muted-foreground text-xs">
            {t("shopping.spaces.summary", { total: items.length, systems: systemIds.length })}
          </div>
        </div>
        <AnimatedIconButton
          show={isControlMode && Boolean(onDelete)}
          variant="outline"
          size="sm"
          label={t("shopping.spaces.delete", "删除空间")}
          icon={<Trash2 className="h-4 w-4" />}
          onClick={onDelete}
        />
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto">
        {items.length > 0 ? (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                systemDefinitions={shopping.systemDefinitions}
                spaceDefinitions={shopping.spaceDefinitions}
              />
            ))}
          </div>
        ) : (
          <div className="border-foreground/15 bg-muted/15 text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-xs">
            {t("shopping.spaces.emptySpace", "当前空间下暂无物品")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---- Main component ----

export function ShoppingSpacesTab({
  shopping,
  items,
  isControlMode,
  onEditSpace,
  onDeleted,
}: {
  shopping: ShoppingModuleData
  items: ShoppingItem[]
  isControlMode: boolean
  onEditItem: (item: ShoppingItem | null) => void
  onEditSpace: (space: ShoppingSpaceDefinition | null) => void
  onDeleted: () => void
}) {
  const { t } = useTranslation()
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(
    () => shopping.spaceDefinitions[0]?.id ?? null,
  )

  const prevIdsRef = useRef<string[]>([])
  const [orderedIds, setOrderedIds] = useState<string[]>(() =>
    shopping.spaceDefinitions.map((d) => d.id),
  )
  useEffect(() => {
    const currentIds = shopping.spaceDefinitions.map((d) => d.id)
    const prevKey = prevIdsRef.current.join(",")
    const curKey = currentIds.join(",")
    if (curKey !== prevKey) {
      setOrderedIds((prev) => {
        const curSet = new Set(currentIds)
        const localSet = new Set(prev)
        if (curSet.size !== localSet.size || !currentIds.every((id) => localSet.has(id))) {
          prevIdsRef.current = currentIds
          return currentIds
        }
        return prev
      })
    }
  }, [shopping.spaceDefinitions])

  const orderedDefinitions = useMemo(() => {
    return orderedIds
      .map((id) => shopping.spaceDefinitions.find((d) => d.id === id))
      .filter(Boolean) as ShoppingSpaceDefinition[]
  }, [orderedIds, shopping.spaceDefinitions])

  const selectedSpace = useMemo(
    () =>
      orderedDefinitions.find((space) => space.id === selectedSpaceId) ??
      orderedDefinitions[0] ??
      null,
    [orderedDefinitions, selectedSpaceId],
  )

  const spaceItems = useMemo(
    () => (selectedSpace ? items.filter((i) => i.spaceTags.includes(selectedSpace.id)) : []),
    [items, selectedSpace],
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldOrder = [...orderedIds]
    const oldIdx = oldOrder.indexOf(String(active.id))
    const newIdx = oldOrder.indexOf(String(over.id))
    if (oldIdx === -1 || newIdx === -1) return

    const newOrder = [...oldOrder]
    newOrder.splice(oldIdx, 1)
    newOrder.splice(newIdx, 0, String(active.id))
    setOrderedIds(newOrder)

    try {
      await reorderSpaceDefinitions(newOrder)
      toast.success(t("shopping.spaces.reordered", "空间顺序已更新"))
      onDeleted()
    } catch (err) {
      toast.error(String(err))
      setOrderedIds(oldOrder)
    }
  }

  const handleDeleteSpace = (space: ShoppingSpaceDefinition) => {
    confirmUndoableDelete({
      confirmMessage: t("shopping.confirm.deleteSpace", {
        name: space.name,
        defaultValue: `确定删除 ${space.name} 吗？`,
      }),
      pendingMessage: t("shopping.toast.deletePendingSpace", {
        name: space.name,
        defaultValue: `已加入删除队列：${space.name}，5 秒内可撤销`,
      }),
      successMessage: t("shopping.toast.deleteSuccessSpace", {
        name: space.name,
        defaultValue: `已删除空间：${space.name}`,
      }),
      failureMessage: t("shopping.toast.deleteFailedSpace", "删除空间失败"),
      undoLabel: t("shopping.undo", "撤销"),
      undoneMessage: t("shopping.toast.deleteUndoneSpace", {
        name: space.name,
        defaultValue: `已撤销删除：${space.name}`,
      }),
      onDelete: () => deleteSpaceDefinition(space.id),
      onDeleted: () => {
        if (selectedSpaceId === space.id) setSelectedSpaceId(null)
        onDeleted()
      },
    })
  }

  return (
    <ShoppingTabViewport>
      {orderedDefinitions.length === 0 ? (
        <div
          className={cn(
            SHOPPING_MUTED_PANEL_CLASS,
            "text-muted-foreground rounded-xl border p-6 text-center text-sm",
          )}
        >
          {t("shopping.spaces.emptyHint", "还没有空间定义,点击「新增空间」开始")}
        </div>
      ) : (
        <ShoppingTabBody>
          {/* 左侧：空间卡片列表 */}
          <ShoppingSidebarPane contentClassName="gap-2">
            <DndContext onDragEnd={handleDragEnd}>
              <SortableContext
                items={orderedIds}
                strategy={verticalListSortingStrategy}
                disabled={!isControlMode}
              >
                {orderedDefinitions.map((sp) => {
                  const spItems = items.filter((i) => i.spaceTags.includes(sp.id))
                  return (
                    <div key={sp.id} className="flex w-full items-start gap-2">
                      <SortableShoppingCard id={sp.id} disabled={!isControlMode}>
                        <SpaceMapCard
                          space={sp}
                          items={spItems}
                          isSelected={selectedSpace?.id === sp.id}
                          isControlMode={isControlMode}
                          onSelect={setSelectedSpaceId}
                          onEditSpace={onEditSpace}
                        />
                      </SortableShoppingCard>
                    </div>
                  )
                })}
              </SortableContext>
            </DndContext>
          </ShoppingSidebarPane>

          {/* 右侧：详情 */}
          <ShoppingDetailPane>
            {selectedSpace ? (
              <SpaceDetailPanel
                space={selectedSpace}
                items={spaceItems}
                shopping={shopping}
                isControlMode={isControlMode}
                onDelete={isControlMode ? () => handleDeleteSpace(selectedSpace) : undefined}
              />
            ) : (
              <ShoppingEmptyDetailCard
                message={t("shopping.spaces.selectPrompt", "从左侧选择一个空间查看详情")}
              />
            )}
          </ShoppingDetailPane>
        </ShoppingTabBody>
      )}
    </ShoppingTabViewport>
  )
}
