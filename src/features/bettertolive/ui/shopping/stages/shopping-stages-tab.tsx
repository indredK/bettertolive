import { Pencil, Trash2 } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { DndContext, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

import { AnimatedIconButton } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  ShoppingItem,
  ShoppingModuleData,
  ShoppingStageItem,
  ShoppingStageTemplate,
} from "@/features/bettertolive/types"
import {
  deleteStageTemplate,
  reorderStageTemplates,
} from "@/features/bettertolive/api/shopping-crud-api"
import { confirmUndoableDelete } from "@/features/bettertolive/ui/shopping/_shared/shopping-delete"
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
  buildStageDimensionGroups,
  type ShoppingStageViewMode,
} from "@/features/bettertolive/ui/shopping/stages/shopping-stage-utils"
import { SortableShoppingCard } from "@/features/bettertolive/ui/shopping/_shared/shopping-sortable-card"
import { cn } from "@/lib/utils"

export function ShoppingStagesTab({
  shopping,
  stageTemplates,
  searchQuery,
  isControlMode,
  onEditStage,
  onDeleted,
}: {
  shopping: ShoppingModuleData
  stageTemplates: ShoppingStageTemplate[]
  searchQuery: string
  isControlMode: boolean
  onEditStage: (stage: ShoppingStageTemplate | null) => void
  onDeleted: () => void
}) {
  const { t } = useTranslation()
  const [rawActiveStageId, setRawActiveStageId] = useState<string | null>(
    stageTemplates[0]?.id ?? null,
  )
  const [viewMode, setViewMode] = useState<ShoppingStageViewMode>("system")

  const prevIdsRef = useRef<string[]>([])
  const [orderedIds, setOrderedIds] = useState<string[]>(() =>
    stageTemplates.map((stage) => stage.id),
  )

  useEffect(() => {
    const currentIds = stageTemplates.map((stage) => stage.id)
    const prevKey = prevIdsRef.current.join(",")
    const curKey = currentIds.join(",")
    if (curKey !== prevKey) {
      setOrderedIds((prev) => {
        const currentSet = new Set(currentIds)
        const localSet = new Set(prev)
        if (currentSet.size !== localSet.size || !currentIds.every((id) => localSet.has(id))) {
          prevIdsRef.current = currentIds
          return currentIds
        }
        return prev
      })
    }
  }, [stageTemplates])

  const orderedStageTemplates = useMemo(
    () =>
      orderedIds
        .map((id) => stageTemplates.find((stage) => stage.id === id))
        .filter(Boolean) as ShoppingStageTemplate[],
    [orderedIds, stageTemplates],
  )

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const visibleStageTemplates = useMemo(() => {
    if (!normalizedQuery) return orderedStageTemplates
    return orderedStageTemplates.filter((stage) =>
      `${stage.name} ${stage.description ?? ""}`.toLowerCase().includes(normalizedQuery),
    )
  }, [normalizedQuery, orderedStageTemplates])

  const activeStageId = useMemo(() => {
    if (visibleStageTemplates.length === 0) return null
    if (rawActiveStageId && visibleStageTemplates.some((stage) => stage.id === rawActiveStageId)) {
      return rawActiveStageId
    }
    return visibleStageTemplates[0]?.id ?? null
  }, [visibleStageTemplates, rawActiveStageId])

  const activeStage = useMemo(
    () => visibleStageTemplates.find((stage) => stage.id === activeStageId) ?? null,
    [activeStageId, visibleStageTemplates],
  )

  const handleDelete = (id: string, name: string) => {
    confirmUndoableDelete({
      confirmMessage: t("shopping.confirm.deleteStage", {
        name,
        defaultValue: `确定删除 ${name} 吗？`,
      }),
      pendingMessage: t("shopping.toast.deletePendingStage", {
        name,
        defaultValue: `已加入删除队列：${name}，5 秒内可撤销`,
      }),
      successMessage: t("shopping.toast.deleteSuccessStage", {
        name,
        defaultValue: `已删除阶段：${name}`,
      }),
      failureMessage: t("shopping.toast.deleteFailedStage"),
      undoLabel: t("shopping.undo"),
      undoneMessage: t("shopping.toast.deleteUndoneStage", {
        name,
        defaultValue: `已撤销删除：${name}`,
      }),
      onDelete: () => deleteStageTemplate(id),
      onDeleted,
    })
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)
    const visibleIds = visibleStageTemplates.map((stage) => stage.id)
    const visibleSet = new Set(visibleIds)
    const visibleOldIndex = visibleIds.indexOf(activeId)
    const visibleNewIndex = visibleIds.indexOf(overId)
    if (visibleOldIndex === -1 || visibleNewIndex === -1) return

    const visibleOrder = [...visibleIds]
    visibleOrder.splice(visibleOldIndex, 1)
    visibleOrder.splice(visibleNewIndex, 0, activeId)

    let nextVisibleIndex = 0
    const nextOrder = orderedIds.map((id) =>
      visibleSet.has(id) ? visibleOrder[nextVisibleIndex++] : id,
    )
    const previousOrder = [...orderedIds]
    setOrderedIds(nextOrder)

    try {
      await reorderStageTemplates(nextOrder)
      toast.success(t("shopping.stages.reordered"))
      onDeleted()
    } catch (err) {
      toast.error(String(err))
      setOrderedIds(previousOrder)
    }
  }

  return (
    <ShoppingTabViewport>
      {visibleStageTemplates.length === 0 ? (
        <div
          className={cn(
            SHOPPING_MUTED_PANEL_CLASS,
            "text-muted-foreground rounded-xl border p-6 text-center text-sm",
          )}
        >
          {normalizedQuery ? t("shopping.stages.noMatchingStages") : t("shopping.stages.empty")}
        </div>
      ) : (
        <ShoppingTabBody>
          {/* 左侧:阶段列表 */}
          <ShoppingSidebarPane contentClassName="gap-2">
            <DndContext onDragEnd={handleDragEnd}>
              <SortableContext
                items={visibleStageTemplates.map((stage) => stage.id)}
                strategy={verticalListSortingStrategy}
                disabled={!isControlMode}
              >
                {visibleStageTemplates.map((stage) => (
                  <SortableShoppingCard key={stage.id} id={stage.id} disabled={!isControlMode}>
                    <div
                      className={cn(
                        SHOPPING_SELECTABLE_CARD_CLASS,
                        activeStageId === stage.id && SHOPPING_SELECTED_CARD_CLASS,
                      )}
                    >
                      <div className="flex items-start gap-2 py-2.5 pr-3 pl-8">
                        <button
                          type="button"
                          onClick={() => setRawActiveStageId(stage.id)}
                          className="focus-visible:ring-ring flex min-w-0 flex-1 appearance-none flex-col gap-1 border-0 bg-transparent p-0 text-left outline-none focus-visible:ring-2"
                        >
                          <span className="truncate text-[13px] font-medium">{stage.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {t("shopping.stages.itemInlineCount", {
                              count: stage.items.length,
                              defaultValue: "{{count}} 个物品",
                            })}
                          </span>
                        </button>
                        <AnimatedIconButton
                          show={isControlMode}
                          size="icon-sm"
                          variant="ghost"
                          className="h-6 w-6 shrink-0"
                          label={t("shopping.stages.edit")}
                          icon={<Pencil className="size-3" />}
                          onClick={() => onEditStage(stage)}
                        />
                      </div>
                    </div>
                  </SortableShoppingCard>
                ))}
              </SortableContext>
            </DndContext>
          </ShoppingSidebarPane>

          {/* 右侧:阶段详情 + 视图切换 */}
          {activeStage && (
            <ShoppingDetailPane>
              <Card className={cn(SHOPPING_DETAIL_CARD_CLASS, "flex h-full min-h-0 flex-col")}>
                <CardHeader className="flex shrink-0 flex-row items-center justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle>{activeStage.name}</CardTitle>
                    {activeStage.description && (
                      <div className="text-muted-foreground text-xs">{activeStage.description}</div>
                    )}
                    {activeStage.focus && (
                      <div className="text-muted-foreground text-xs">{activeStage.focus}</div>
                    )}
                  </div>
                  <AnimatedIconButton
                    show={isControlMode}
                    variant="outline"
                    size="sm"
                    label={t("shopping.stages.delete")}
                    icon={<Trash2 className="h-4 w-4" />}
                    onClick={() => handleDelete(activeStage.id, activeStage.name)}
                  />
                </CardHeader>
                <CardContent className="flex min-h-0 flex-1 flex-col overflow-hidden">
                  <Tabs
                    value={viewMode}
                    onValueChange={(v) => setViewMode(v as ShoppingStageViewMode)}
                    className="min-h-0 flex-1 overflow-hidden"
                  >
                    <TabsList className="mb-3 shrink-0">
                      <TabsTrigger value="system">{t("shopping.stages.systemView")}</TabsTrigger>
                      <TabsTrigger value="space">{t("shopping.stages.spaceView")}</TabsTrigger>
                    </TabsList>

                    <div className="min-h-0 flex-1 overflow-y-auto">
                      <StageItemsView
                        stage={activeStage}
                        allItems={shopping.items}
                        viewMode={viewMode}
                        shopping={shopping}
                      />
                    </div>
                  </Tabs>
                </CardContent>
              </Card>
            </ShoppingDetailPane>
          )}
          {!activeStage && (
            <ShoppingDetailPane>
              <ShoppingEmptyDetailCard message={t("shopping.stages.selectPrompt")} />
            </ShoppingDetailPane>
          )}
        </ShoppingTabBody>
      )}
    </ShoppingTabViewport>
  )
}

function StageItemsView({
  stage,
  allItems,
  viewMode,
  shopping,
}: {
  stage: ShoppingStageTemplate
  allItems: ShoppingItem[]
  viewMode: ShoppingStageViewMode
  shopping: ShoppingModuleData
}) {
  const { t } = useTranslation()
  const groups = useMemo(() => {
    return buildStageDimensionGroups(stage, allItems, shopping, viewMode)
  }, [allItems, shopping, stage, viewMode])

  const hasAnyEntries = groups.some((group) => group.entries.length > 0)

  if (stage.items.length === 0) {
    return <div className="text-muted-foreground text-xs">{t("shopping.stages.noItems")}</div>
  }

  if (!hasAnyEntries) {
    return (
      <div className="text-muted-foreground text-xs">{t("shopping.stages.noVisibleGroups")}</div>
    )
  }

  return (
    <div className="space-y-4">
      {groups
        .filter((g) => g.entries.length > 0)
        .map((g) => (
          <div key={g.key}>
            <div className="mb-2 text-sm font-medium">{g.label}</div>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {g.entries.map(({ item, stageItem }) => (
                <StageItemCard key={item.id} item={item} stageItem={stageItem} />
              ))}
            </div>
          </div>
        ))}
    </div>
  )
}

function StageItemCard({ item, stageItem }: { item: ShoppingItem; stageItem: ShoppingStageItem }) {
  const { t } = useTranslation()
  const renderTier = (label: string, ids: string[]) => {
    const names = ids
      .map((id) => item.children.find((c) => c.id === id)?.name ?? id)
      .filter(Boolean)
    if (names.length === 0) return null
    return (
      <div className="text-muted-foreground text-xs">
        <span className="font-medium">{label}:</span> {names.join(", ")}
      </div>
    )
  }
  return (
    <div className={cn(SHOPPING_SELECTABLE_CARD_CLASS, "p-3")}>
      <div className="font-medium">{item.name}</div>
      <div className="mt-1 space-y-0.5">
        {renderTier(t("shopping.stages.tier.low"), stageItem.tiers.low)}
        {renderTier(t("shopping.stages.tier.base"), stageItem.tiers.base)}
        {renderTier(t("shopping.stages.tier.up"), stageItem.tiers.up)}
      </div>
    </div>
  )
}
