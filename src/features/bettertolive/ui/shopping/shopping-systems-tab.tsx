import { Pencil, Plus, Trash2 } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { DndContext, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  ShoppingItem,
  ShoppingModuleData,
  ShoppingSystemDefinition,
} from "@/features/bettertolive/types"
import { ShoppingStatus } from "@/features/bettertolive/types"
import {
  deleteSystemDefinition,
  reorderSystemDefinitions,
} from "@/features/bettertolive/api/shopping-crud-api"
import { confirmUndoableDelete } from "@/features/bettertolive/ui/shopping/shopping-delete"
import { itemHasStatus } from "@/features/bettertolive/ui/shopping/shopping-page-data"
import {
  ItemCard,
  SHOPPING_CONTROL_BADGE_CLASS,
  SHOPPING_DETAIL_CARD_CLASS,
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
import { SortableShoppingCard } from "@/features/bettertolive/ui/shopping/shopping-sortable-card"
import { cn } from "@/lib/utils"

// ---- Left-side system card ----

function SystemMapCard({
  system,
  items,
  isSelected,
  isControlMode,
  onSelect,
  onEditSystem,
}: {
  system: ShoppingSystemDefinition
  items: ShoppingItem[]
  isSelected: boolean
  isControlMode: boolean
  onSelect: (id: string) => void
  onEditSystem: (system: ShoppingSystemDefinition) => void
}) {
  const { t } = useTranslation()
  const owned = items.filter((i) => itemHasStatus(i, ShoppingStatus.Owned))
  const wanted = items.filter((i) => itemHasStatus(i, ShoppingStatus.Wanted))

  return (
    <div className={cn(SHOPPING_SELECTABLE_CARD_CLASS, isSelected && SHOPPING_SELECTED_CARD_CLASS)}>
      <div className="flex items-start gap-2 py-2.5 pr-3 pl-8">
        <button
          type="button"
          onClick={() => onSelect(system.id)}
          className="focus-visible:ring-ring flex min-w-0 flex-1 appearance-none flex-col gap-1 border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2"
        >
          <span className="truncate text-[13px] font-medium">{system.name || system.id}</span>
          <div className="text-muted-foreground flex gap-1.5 text-[11px]">
            <span>
              {t("shopping.systems.ownedInlineCount", {
                count: owned.length,
                defaultValue: "{{count}} 已有",
              })}
            </span>
            <span>
              {t("shopping.systems.wantedInlineCount", {
                count: wanted.length,
                defaultValue: "{{count}} 待购",
              })}
            </span>
          </div>
          {system.summary && (
            <div className="text-muted-foreground truncate text-[11px]">{system.summary}</div>
          )}
        </button>
        {isControlMode && (
          <Button
            size="icon-sm"
            variant="ghost"
            className="h-6 w-6 shrink-0"
            onClick={() => onEditSystem(system)}
          >
            <Pencil className="size-3" />
          </Button>
        )}
      </div>
    </div>
  )
}

// ---- Right-side detail panel ----

function SystemDetailPanel({
  system,
  items,
  shopping,
  isControlMode,
  onDelete,
}: {
  system: ShoppingSystemDefinition
  items: ShoppingItem[]
  shopping: ShoppingModuleData
  isControlMode: boolean
  onDelete?: () => void
}) {
  const { t } = useTranslation()

  return (
    <Card className={cn(SHOPPING_DETAIL_CARD_CLASS, "flex h-full min-h-0 flex-col")}>
      <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <CardTitle>{system.name || system.id}</CardTitle>
          <div className="text-muted-foreground text-xs">
            {system.summary
              ? system.summary
              : t("shopping.systems.itemCount", {
                  count: items.length,
                  defaultValue: "{{count}} 个物品",
                })}
          </div>
        </div>
        {isControlMode && onDelete && (
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="outline" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="min-h-0 flex-1 overflow-y-auto">
        {system.keyQuestion && (
          <p className="text-muted-foreground mb-3 text-sm">{system.keyQuestion}</p>
        )}
        {system.secondaryGroups.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1">
            {system.secondaryGroups.map((g) => (
              <Badge key={g} variant="outline" className="text-[10px]">
                {g}
              </Badge>
            ))}
          </div>
        )}
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
            {t("shopping.systems.emptySystem", "当前系统下暂无物品")}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ---- Main component ----

export function ShoppingSystemsTab({
  shopping,
  items,
  isControlMode,
  onEditSystem,
  onDeleted,
}: {
  shopping: ShoppingModuleData
  items: ShoppingItem[]
  isControlMode: boolean
  onEditItem: (item: ShoppingItem | null) => void
  onEditSystem: (system: ShoppingSystemDefinition | null) => void
  onDeleted: () => void
}) {
  const { t } = useTranslation()
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(
    () => shopping.systemDefinitions[0]?.id ?? null,
  )

  const prevIdsRef = useRef<string[]>([])
  const [orderedIds, setOrderedIds] = useState<string[]>(() =>
    shopping.systemDefinitions.map((d) => d.id),
  )
  // Sync when parent data changes (new/deleted systems)
  useEffect(() => {
    const currentIds = shopping.systemDefinitions.map((d) => d.id)
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
  }, [shopping.systemDefinitions])

  const orderedDefinitions = useMemo(() => {
    return orderedIds
      .map((id) => shopping.systemDefinitions.find((d) => d.id === id))
      .filter(Boolean) as ShoppingSystemDefinition[]
  }, [orderedIds, shopping.systemDefinitions])

  const selectedSystem = useMemo(
    () =>
      orderedDefinitions.find((system) => system.id === selectedSystemId) ??
      orderedDefinitions[0] ??
      null,
    [orderedDefinitions, selectedSystemId],
  )

  const systemItems = useMemo(
    () => (selectedSystem ? items.filter((i) => i.systemTags.includes(selectedSystem.id)) : []),
    [items, selectedSystem],
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
      await reorderSystemDefinitions(newOrder)
      toast.success(t("shopping.systems.reordered", "系统顺序已更新"))
      onDeleted()
    } catch (err) {
      toast.error(String(err))
      setOrderedIds(oldOrder)
    }
  }

  const handleDeleteSystem = (system: ShoppingSystemDefinition) => {
    const displayName = system.name || system.id
    confirmUndoableDelete({
      confirmMessage: t("shopping.confirm.deleteSystem", {
        name: displayName,
        defaultValue: `确定删除 ${displayName} 吗？`,
      }),
      pendingMessage: t("shopping.toast.deletePendingSystem", {
        name: displayName,
        defaultValue: `已加入删除队列：${displayName}，5 秒内可撤销`,
      }),
      successMessage: t("shopping.toast.deleteSuccessSystem", {
        name: displayName,
        defaultValue: `已删除系统：${displayName}`,
      }),
      failureMessage: t("shopping.toast.deleteFailedSystem", "删除系统失败"),
      undoLabel: t("shopping.undo", "撤销"),
      undoneMessage: t("shopping.toast.deleteUndoneSystem", {
        name: displayName,
        defaultValue: `已撤销删除：${displayName}`,
      }),
      onDelete: () => deleteSystemDefinition(system.id),
      onDeleted: () => {
        if (selectedSystemId === system.id) setSelectedSystemId(null)
        onDeleted()
      },
    })
  }

  return (
    <ShoppingTabViewport>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h3 className="text-lg font-medium">{t("shopping.systems.title", "物件系统")}</h3>
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
          <Button size="sm" onClick={() => onEditSystem(null)}>
            <Plus className="mr-1 h-4 w-4" />
            {t("shopping.systems.addSystem", "新增系统")}
          </Button>
        )}
      </div>

      {orderedDefinitions.length === 0 ? (
        <div
          className={cn(
            SHOPPING_MUTED_PANEL_CLASS,
            "text-muted-foreground rounded-xl border p-6 text-center text-sm",
          )}
        >
          {t("shopping.systems.emptyHint", "还没有系统定义,点击「新增系统」开始")}
        </div>
      ) : (
        <ShoppingTabBody>
          {/* 左侧：系统卡片列表 */}
          <ShoppingSidebarPane contentClassName="gap-2">
            <DndContext onDragEnd={handleDragEnd}>
              <SortableContext
                items={orderedIds}
                strategy={verticalListSortingStrategy}
                disabled={!isControlMode}
              >
                {orderedDefinitions.map((sys) => {
                  const sysItems = items.filter((i) => i.systemTags.includes(sys.id))
                  return (
                    <div key={sys.id} className="flex w-full items-start gap-2">
                      <SortableShoppingCard id={sys.id} disabled={!isControlMode}>
                        <SystemMapCard
                          system={sys}
                          items={sysItems}
                          isSelected={selectedSystem?.id === sys.id}
                          isControlMode={isControlMode}
                          onSelect={setSelectedSystemId}
                          onEditSystem={onEditSystem}
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
            {selectedSystem ? (
              <SystemDetailPanel
                system={selectedSystem}
                items={systemItems}
                shopping={shopping}
                isControlMode={isControlMode}
                onDelete={isControlMode ? () => handleDeleteSystem(selectedSystem) : undefined}
              />
            ) : (
              <ShoppingEmptyDetailCard
                message={t("shopping.systems.selectPrompt", "从左侧选择一个系统查看详情")}
              />
            )}
          </ShoppingDetailPane>
        </ShoppingTabBody>
      )}
    </ShoppingTabViewport>
  )
}
