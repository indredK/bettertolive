import { DndContext, type DragEndEvent } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Pencil, Plus, Power, PowerOff, TriangleAlert } from "lucide-react"
import { useEffect, useMemo, useReducer, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { AnimatedIconButton, Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type {
  ShoppingAttributeDefinition,
  ShoppingAttributeKind,
  ShoppingModuleData,
} from "@/features/bettertolive/types"
import {
  countItemsUsingAttribute,
  disableAttributeDefinition,
  enableAttributeDefinition,
  reorderAttributeDefinitions,
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
  shoppingAttributeDisplayName,
  shoppingAttributeEnabledDisplayName,
  shoppingAttributeKindDisplayName,
  shoppingAttributeSemanticDisplayName,
  shoppingAttributeStyleTokenDisplayName,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"
import { SortableShoppingCard } from "@/features/bettertolive/ui/shopping/_shared/shopping-sortable-card"
import { cn } from "@/lib/utils"

const ATTRIBUTE_KIND_META: ShoppingAttributeKind[] = [
  "depreciation",
  "lifecycle",
  "status",
  "channel",
]

// ===== 属性 mutation 的显式动作与状态分层 =====
// - server snapshot：来自 props（shopping.attributeDefinitions），唯一真值
// - optimistic patch：未提交的本地覆盖，commit/rollback 后丢弃
// - inFlight：记录每个目标正在进行的 mutation 种类（reorder 用专用 key）
type AttributeMutationKind = "reorder" | "enable" | "disable"

type AttributeMutationState = {
  patches: Record<string, Partial<ShoppingAttributeDefinition>>
  inFlight: Record<string, AttributeMutationKind>
}

type AttributeMutationAction =
  | {
      type: "begin"
      target: string
      kind: AttributeMutationKind
      patch?: Partial<ShoppingAttributeDefinition>
    }
  | { type: "settle"; target: string; patch?: Partial<ShoppingAttributeDefinition> }

const REORDER_TARGET = "__reorder__"

const INITIAL_MUTATION_STATE: AttributeMutationState = { patches: {}, inFlight: {} }

function attributeMutationReducer(
  state: AttributeMutationState,
  action: AttributeMutationAction,
): AttributeMutationState {
  switch (action.type) {
    case "begin":
      return {
        patches: action.patch
          ? {
              ...state.patches,
              [action.target]: { ...state.patches[action.target], ...action.patch },
            }
          : state.patches,
        inFlight: { ...state.inFlight, [action.target]: action.kind },
      }
    case "settle": {
      // 成功时可附带服务端返回的 patch（含新 version），失败时 patch 为空回退 snapshot
      const patches = { ...state.patches }
      if (action.patch) {
        patches[action.target] = { ...patches[action.target], ...action.patch }
      } else {
        delete patches[action.target]
      }
      const inFlight = { ...state.inFlight }
      delete inFlight[action.target]
      return { patches, inFlight }
    }
    default:
      return state
  }
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
  // 乐观更新补丁层 + mutation 边界：reducer 管理 optimistic patch 与 inFlight 显式状态
  const [mutation, dispatch] = useReducer(attributeMutationReducer, INITIAL_MUTATION_STATE)
  // 同步并发锁：reducer 状态要到下一次渲染才生效，无法用于同一 tick 内的重入判断
  const mutationInFlight = useRef(false)
  const definitions = useMemo(
    () =>
      shopping.attributeDefinitions.map((d) =>
        mutation.patches[d.id] ? { ...d, ...mutation.patches[d.id] } : d,
      ),
    [shopping.attributeDefinitions, mutation.patches],
  )
  const [selectedKind, setSelectedKind] = useState<ShoppingAttributeKind>("depreciation")
  const [selectedAttributeId, setSelectedAttributeId] = useState<string | null>(null)
  const [editing, setEditing] = useState<{
    isNew: boolean
    definition: ShoppingAttributeDefinition | null
    defaultKind?: ShoppingAttributeKind
  } | null>(null)
  const [disableConfirm, setDisableConfirm] = useState<{
    attribute: ShoppingAttributeDefinition
  } | null>(null)

  // 并发冲突（乐观锁版本不匹配）：刷新最新状态并提示重试
  const handleMutationError = (error: unknown) => {
    const message = String(error)
    if (message.includes("conflict")) {
      toast.error(t("shopping.attributes.conflict"))
      onRefresh()
    } else {
      toast.error(message)
    }
  }

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
    if (!selectedGroup || !over || active.id === over.id || mutationInFlight.current) return

    const oldOrder = [...orderedIds]
    const fromIndex = oldOrder.indexOf(String(active.id))
    const toIndex = oldOrder.indexOf(String(over.id))
    if (fromIndex === -1 || toIndex === -1) return

    const nextOrder = [...oldOrder]
    nextOrder.splice(fromIndex, 1)
    nextOrder.splice(toIndex, 0, String(active.id))
    setOrderedIds(nextOrder)

    mutationInFlight.current = true
    dispatch({ type: "begin", target: REORDER_TARGET, kind: "reorder" })
    try {
      await reorderAttributeDefinitions(selectedGroup.kind, nextOrder)
      toast.success(t("shopping.attributes.reordered"))
      onRefresh()
    } catch (error) {
      setOrderedIds(oldOrder)
      toast.error(String(error))
    } finally {
      dispatch({ type: "settle", target: REORDER_TARGET })
      mutationInFlight.current = false
    }
  }

  const executeDisable = async (attribute: ShoppingAttributeDefinition) => {
    if (mutationInFlight.current) return
    mutationInFlight.current = true
    dispatch({ type: "begin", target: attribute.id, kind: "disable", patch: { isEnabled: false } })
    try {
      const updated = await disableAttributeDefinition(attribute.id, attribute.version)
      dispatch({ type: "settle", target: attribute.id, patch: { version: updated.version } })
      toast.success(t("shopping.attributes.disableSuccess"))
      onRefresh()
    } catch (error) {
      dispatch({ type: "settle", target: attribute.id })
      handleMutationError(error)
    } finally {
      mutationInFlight.current = false
    }
  }

  const handleToggleEnabled = async (attribute: ShoppingAttributeDefinition) => {
    if (mutationInFlight.current) return
    if (!attribute.isEnabled) {
      mutationInFlight.current = true
      dispatch({ type: "begin", target: attribute.id, kind: "enable", patch: { isEnabled: true } })
      try {
        const updated = await enableAttributeDefinition(attribute.id, attribute.version)
        dispatch({ type: "settle", target: attribute.id, patch: { version: updated.version } })
        toast.success(t("shopping.attributes.enableSuccess"))
        onRefresh()
      } catch (error) {
        dispatch({ type: "settle", target: attribute.id })
        handleMutationError(error)
      } finally {
        mutationInFlight.current = false
      }
      return
    }

    // 禁用：查引用计数，有引用则弹确认
    try {
      const count = await countItemsUsingAttribute(attribute.kind, attribute.code)
      if (count === 0) {
        await executeDisable(attribute)
      } else {
        setDisableConfirm({ attribute })
      }
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
            {t("shopping.attributes.add")}
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
          {t("shopping.attributes.emptyHint")}
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
                    <div
                      className={cn(
                        SHOPPING_SELECTABLE_CARD_CLASS,
                        selectedAttribute?.id === attribute.id && SHOPPING_SELECTED_CARD_CLASS,
                        "flex w-full items-center gap-1 py-2 pr-1.5 pl-8",
                        !attribute.isEnabled && "opacity-50",
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedAttributeId(attribute.id)}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div
                          className={cn(
                            "truncate text-[13px] font-medium",
                            !attribute.isEnabled && "line-through",
                          )}
                        >
                          {shoppingAttributeDisplayName(attribute)}
                        </div>
                        <div className="text-muted-foreground truncate text-[11px]">
                          {attribute.code}
                        </div>
                      </button>

                      {isControlMode && (
                        <div className="flex shrink-0 items-center gap-0.5">
                          <AnimatedIconButton
                            show
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            label={t("shopping.attributes.edit")}
                            icon={<Pencil className="h-3.5 w-3.5" />}
                            onClick={(e) => {
                              e.stopPropagation()
                              setEditing({
                                isNew: false,
                                definition: attribute,
                                defaultKind: selectedKind,
                              })
                            }}
                          />
                          <AnimatedIconButton
                            show
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            label={
                              attribute.isEnabled
                                ? t("shopping.attributes.disable")
                                : t("shopping.attributes.enable")
                            }
                            icon={
                              attribute.isEnabled ? (
                                <PowerOff className="h-3.5 w-3.5" />
                              ) : (
                                <Power className="h-3.5 w-3.5" />
                              )
                            }
                            onClick={(e) => {
                              e.stopPropagation()
                              void handleToggleEnabled(attribute)
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </SortableShoppingCard>
                ))}
              </SortableContext>
            </DndContext>
          </ShoppingSidebarPane>

          <ShoppingDetailPane>
            {selectedAttribute ? (
              <Card className={cn(SHOPPING_DETAIL_CARD_CLASS, "flex h-full min-h-0 flex-col")}>
                <CardHeader className="flex shrink-0 flex-row items-start gap-3">
                  <div className="min-w-0">
                    <CardTitle
                      className={cn(!selectedAttribute.isEnabled && "text-muted-foreground")}
                    >
                      {shoppingAttributeDisplayName(selectedAttribute)}
                      {!selectedAttribute.isEnabled && (
                        <span className="ml-2 text-sm font-normal text-amber-500">
                          ({t("shopping.attributes.disabledBadge")})
                        </span>
                      )}
                    </CardTitle>
                    <div className="text-muted-foreground mt-0.5 text-xs">
                      {selectedAttribute.code}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
                  <div className={cn(SHOPPING_MUTED_PANEL_CLASS, "rounded-lg border p-3")}>
                    <div className="grid gap-3 md:grid-cols-2">
                      <DetailRow
                        label={t("shopping.attributes.kind")}
                        value={shoppingAttributeKindDisplayName(selectedAttribute.kind, t)}
                      />
                      <DetailRow
                        label={t("shopping.attributes.semanticKey")}
                        value={shoppingAttributeSemanticDisplayName(
                          selectedAttribute.semanticKey,
                          t,
                        )}
                      />
                      <DetailRow
                        label={t("shopping.attributes.labelEn")}
                        value={selectedAttribute.labelEn || t("shopping.attributes.none")}
                      />
                      <DetailRow
                        label={t("shopping.attributes.styleToken")}
                        value={shoppingAttributeStyleTokenDisplayName(
                          selectedAttribute.styleToken,
                          t,
                        )}
                      />
                      <DetailRow
                        label={t("shopping.attributes.rank")}
                        value={
                          selectedAttribute.rank != null
                            ? String(selectedAttribute.rank)
                            : t("shopping.attributes.none")
                        }
                      />
                      <div>
                        <div className="text-muted-foreground text-[11px]">
                          {t("shopping.attributes.state")}
                        </div>
                        {selectedAttribute.isEnabled ? (
                          <div className="text-sm font-medium text-green-600 dark:text-green-400">
                            {shoppingAttributeEnabledDisplayName(true, t)}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-sm font-medium text-amber-500">
                            <PowerOff className="h-3.5 w-3.5 shrink-0" />
                            {shoppingAttributeEnabledDisplayName(false, t)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="text-muted-foreground mb-1.5 text-[11px]">
                      {t("shopping.attributes.description")}
                    </div>
                    <div className="text-sm leading-6">
                      {selectedAttribute.description || t("shopping.attributes.none")}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <ShoppingEmptyDetailCard message={t("shopping.attributes.selectPrompt")} />
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
            toast.success(t("shopping.toast.saved"))
          }}
        />
      ) : null}

      {disableConfirm ? (
        <Dialog open onOpenChange={(open) => !open && setDisableConfirm(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <TriangleAlert className="h-5 w-5 text-amber-500" />
                {t("shopping.attributes.disableTitle", {
                  name: shoppingAttributeDisplayName(disableConfirm.attribute),
                })}
              </DialogTitle>
            </DialogHeader>
            <div className="text-muted-foreground space-y-3 text-sm">
              <p>{t("shopping.attributes.disableDescription")}</p>
              <ul className="space-y-1 text-xs">
                <li className="flex items-center gap-1.5">
                  <span className="text-green-600">✓</span>
                  {t("shopping.attributes.disableKeepLegacy")}
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-green-600">✓</span>
                  {t("shopping.attributes.disableShowWarning")}
                </li>
                <li className="flex items-center gap-1.5">
                  <span className="text-amber-500">✗</span>
                  {t("shopping.attributes.disableBlockNew")}
                </li>
              </ul>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDisableConfirm(null)}>
                {t("shopping.cancel")}
              </Button>
              <Button
                variant="destructive"
                onClick={async () => {
                  const attr = disableConfirm.attribute
                  setDisableConfirm(null)
                  await executeDisable(attr)
                }}
              >
                {t("shopping.attributes.disableConfirmButton")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
