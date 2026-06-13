import { DndContext, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Pencil, Plus, Power, PowerOff } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { AnimatedIconButton, Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  ShoppingAttributeDefinition,
  ShoppingAttributeKind,
  ShoppingModuleData,
} from "@/features/bettertolive/types"
import {
  disableAttributeDefinition,
  listAttributeDefinitionsForManagement,
  reorderAttributeDefinitions,
  updateAttributeDefinition,
} from "@/features/bettertolive/api/shopping-crud-api"
import { ShoppingAttributeEditDialog } from "@/features/bettertolive/ui/shopping/attributes/shopping-attribute-edit-dialog"
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
  depreciationStyle,
  shoppingAttributeDisplayName,
  lifecycleStyle,
  shoppingAttributeEnabledDisplayName,
  shoppingAttributeKindDisplayName,
  shoppingAttributeSemanticDisplayName,
  shoppingAttributeStyleTokenDisplayName,
  statusStyle,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"
import { SortableShoppingCard } from "@/features/bettertolive/ui/shopping/_shared/shopping-sortable-card"
import { cn } from "@/lib/utils"

const ATTRIBUTE_KIND_META: ShoppingAttributeKind[] = [
  "depreciation",
  "lifecycle",
  "status",
  "channel",
]

function attributeBadgeClassName(attribute: ShoppingAttributeDefinition) {
  if (attribute.kind === "status") return statusStyle(attribute.code, [attribute])
  if (attribute.kind === "lifecycle") return lifecycleStyle(attribute.code, [attribute])
  if (attribute.kind === "depreciation") return depreciationStyle(attribute.code, [attribute])
  if (attribute.styleToken === "accent")
    return "border-foreground/10 bg-accent text-accent-foreground"
  if (attribute.styleToken === "secondary") {
    return "border-foreground/10 bg-secondary text-secondary-foreground"
  }
  if (attribute.styleToken === "card") return "border-foreground/10 bg-card text-card-foreground"
  return "border-foreground/10 bg-muted text-muted-foreground"
}

export function ShoppingAttributesTab({
  shopping,
  isControlMode,
  onRefresh,
}: {
  shopping: ShoppingModuleData
  isControlMode: boolean
  onRefresh: () => void
}) {
  const { t } = useTranslation()
  const [definitions, setDefinitions] = useState<ShoppingAttributeDefinition[]>(
    shopping.attributeDefinitions,
  )
  const [selectedKind, setSelectedKind] = useState<ShoppingAttributeKind>("depreciation")
  const [selectedAttributeId, setSelectedAttributeId] = useState<string | null>(null)
  const [editing, setEditing] = useState<{
    isNew: boolean
    definition: ShoppingAttributeDefinition | null
    defaultKind?: ShoppingAttributeKind
  } | null>(null)

  useEffect(() => {
    let cancelled = false

    const loadDefinitions = async () => {
      try {
        const items = await listAttributeDefinitionsForManagement()
        if (!cancelled) {
          setDefinitions(items)
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(String(error))
        }
      }
    }

    void loadDefinitions()

    return () => {
      cancelled = true
    }
  }, [shopping.attributeDefinitions])

  const grouped = useMemo(() => {
    return ATTRIBUTE_KIND_META.map((kind) => ({
      kind,
      label: shoppingAttributeKindDisplayName(kind, t),
      items: definitions
        .filter((definition) => definition.kind === kind)
        .sort(
          (left, right) =>
            left.sortOrder - right.sortOrder || left.label.localeCompare(right.label),
        ),
    }))
  }, [definitions, t])

  const selectedGroup = grouped.find((group) => group.kind === selectedKind) ?? grouped[0]

  const prevIdsRef = useRef<string[]>([])
  const [orderedIds, setOrderedIds] = useState<string[]>(() =>
    selectedGroup ? selectedGroup.items.map((item) => item.id) : [],
  )

  useEffect(() => {
    const currentIds = selectedGroup?.items.map((item) => item.id) ?? []
    const currentKey = currentIds.join(",")
    const prevKey = prevIdsRef.current.join(",")
    if (currentKey !== prevKey) {
      prevIdsRef.current = currentIds
      setOrderedIds(currentIds)
    }
  }, [selectedGroup])

  const orderedItems = useMemo(() => {
    const items = selectedGroup?.items ?? []
    return orderedIds
      .map((id) => items.find((item) => item.id === id))
      .filter(Boolean) as ShoppingAttributeDefinition[]
  }, [orderedIds, selectedGroup])

  const selectedAttribute =
    orderedItems.find((attribute) => attribute.id === selectedAttributeId) ??
    orderedItems[0] ??
    null

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!selectedGroup || !over || active.id === over.id) return

    const oldOrder = [...orderedIds]
    const fromIndex = oldOrder.indexOf(String(active.id))
    const toIndex = oldOrder.indexOf(String(over.id))
    if (fromIndex === -1 || toIndex === -1) return

    const nextOrder = [...oldOrder]
    nextOrder.splice(fromIndex, 1)
    nextOrder.splice(toIndex, 0, String(active.id))
    setOrderedIds(nextOrder)

    try {
      await reorderAttributeDefinitions(selectedGroup.kind, nextOrder)
      toast.success(t("shopping.attributes.reordered", "属性顺序已更新"))
      onRefresh()
    } catch (error) {
      toast.error(String(error))
      setOrderedIds(oldOrder)
    }
  }

  const handleToggleEnabled = async (attribute: ShoppingAttributeDefinition) => {
    try {
      if (attribute.isEnabled) {
        await disableAttributeDefinition(attribute.id)
      } else {
        await updateAttributeDefinition({
          ...attribute,
          labelEn: attribute.labelEn ?? null,
          semanticKey: attribute.semanticKey ?? null,
          styleToken: attribute.styleToken ?? null,
          description: attribute.description ?? "",
          rank: attribute.rank ?? null,
          isEnabled: true,
        })
      }
      onRefresh()
    } catch (error) {
      toast.error(String(error))
    }
  }

  return (
    <ShoppingTabViewport>
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {grouped.map((group) => (
            <Button
              key={group.kind}
              type="button"
              variant={selectedKind === group.kind ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setSelectedKind(group.kind)
                setSelectedAttributeId(null)
              }}
            >
              {group.label}
              <span className="text-xs opacity-70">{group.items.length}</span>
            </Button>
          ))}
        </div>
        {isControlMode ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() =>
              setEditing({ isNew: true, definition: null, defaultKind: selectedGroup?.kind })
            }
          >
            <Plus className="size-4" />
            {t("shopping.attributes.add", "新增")}
          </Button>
        ) : null}
      </div>

      {selectedGroup && selectedGroup.items.length === 0 && !isControlMode ? (
        <div
          className={cn(
            SHOPPING_MUTED_PANEL_CLASS,
            "text-muted-foreground rounded-xl border p-6 text-center text-sm",
          )}
        >
          {t("shopping.attributes.emptyHint", "当前分类下还没有属性定义")}
        </div>
      ) : (
        <ShoppingTabBody>
          <ShoppingSidebarPane contentClassName="gap-2">
            <div className="text-sm font-medium">{selectedGroup?.label}</div>

            <DndContext onDragEnd={handleDragEnd}>
              <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
                {orderedItems.map((attribute) => (
                  <SortableShoppingCard
                    key={attribute.id}
                    id={attribute.id}
                    disabled={!isControlMode}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedAttributeId(attribute.id)}
                      className={cn(
                        SHOPPING_SELECTABLE_CARD_CLASS,
                        selectedAttribute?.id === attribute.id && SHOPPING_SELECTED_CARD_CLASS,
                        "flex w-full flex-col gap-2 py-2.5 pr-3 pl-8 text-left",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <div className="truncate text-[13px] font-medium">
                            {shoppingAttributeDisplayName(attribute)}
                          </div>
                          <div className="text-muted-foreground truncate text-[11px]">
                            {attribute.code}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "px-1.5 py-0 text-[10px]",
                            attributeBadgeClassName(attribute),
                          )}
                        >
                          {attribute.semanticKey
                            ? shoppingAttributeSemanticDisplayName(attribute.semanticKey, t)
                            : shoppingAttributeKindDisplayName(attribute.kind, t)}
                        </Badge>
                      </div>
                    </button>
                  </SortableShoppingCard>
                ))}
              </SortableContext>
            </DndContext>
          </ShoppingSidebarPane>

          <ShoppingDetailPane>
            {selectedAttribute ? (
              <Card className={cn(SHOPPING_DETAIL_CARD_CLASS, "flex h-full min-h-0 flex-col")}>
                <CardHeader className="flex shrink-0 flex-row items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle>{shoppingAttributeDisplayName(selectedAttribute)}</CardTitle>
                    <div className="text-muted-foreground mt-0.5 text-xs">
                      {selectedAttribute.code}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <AnimatedIconButton
                      show={isControlMode}
                      variant="outline"
                      size="sm"
                      label={t("shopping.attributes.edit", "编辑属性")}
                      icon={<Pencil className="h-4 w-4" />}
                      onClick={() =>
                        setEditing({
                          isNew: false,
                          definition: selectedAttribute,
                          defaultKind: selectedKind,
                        })
                      }
                    />
                    <AnimatedIconButton
                      show={isControlMode}
                      variant="outline"
                      size="sm"
                      label={
                        selectedAttribute.isEnabled
                          ? t("shopping.attributes.disable", "停用属性")
                          : t("shopping.attributes.enable", "启用属性")
                      }
                      icon={
                        selectedAttribute.isEnabled ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )
                      }
                      onClick={() => void handleToggleEnabled(selectedAttribute)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
                  <div className={cn(SHOPPING_MUTED_PANEL_CLASS, "rounded-lg border p-3")}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <DetailRow
                        label={t("shopping.attributes.kind", "分类")}
                        value={shoppingAttributeKindDisplayName(selectedAttribute.kind, t)}
                      />
                      <DetailRow
                        label={t("shopping.attributes.semanticKey", "语义键")}
                        value={shoppingAttributeSemanticDisplayName(
                          selectedAttribute.semanticKey,
                          t,
                        )}
                      />
                      <DetailRow
                        label={t("shopping.attributes.labelEn", "英文名")}
                        value={selectedAttribute.labelEn || t("shopping.attributes.none", "未设置")}
                      />
                      <DetailRow
                        label={t("shopping.attributes.styleToken", "样式")}
                        value={shoppingAttributeStyleTokenDisplayName(
                          selectedAttribute.styleToken,
                          t,
                        )}
                      />
                      <DetailRow
                        label={t("shopping.attributes.rank", "等级 / 排序权重")}
                        value={
                          selectedAttribute.rank != null
                            ? String(selectedAttribute.rank)
                            : t("shopping.attributes.none", "未设置")
                        }
                      />
                      <DetailRow
                        label={t("shopping.attributes.state", "状态")}
                        value={shoppingAttributeEnabledDisplayName(selectedAttribute.isEnabled, t)}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="text-muted-foreground mb-1.5 text-[11px]">
                      {t("shopping.attributes.description", "说明")}
                    </div>
                    <div className="text-sm leading-6">
                      {selectedAttribute.description || t("shopping.attributes.none", "未设置")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ShoppingEmptyDetailCard
                message={t("shopping.attributes.selectPrompt", "从左侧选择一个属性查看详情")}
              />
            )}
          </ShoppingDetailPane>
        </ShoppingTabBody>
      )}

      {editing ? (
        <ShoppingAttributeEditDialog
          editing={editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            onRefresh()
            toast.success(t("shopping.toast.saved", "已保存"))
          }}
        />
      ) : null}
    </ShoppingTabViewport>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-muted-foreground text-[11px]">{label}</div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  )
}
