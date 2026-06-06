import { Plus, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select"
import { Textarea } from "@/components/ui/textarea"
import type {
  ShoppingItem,
  ShoppingModuleData,
  ShoppingStageItem,
  ShoppingStageTemplate,
} from "@/features/bettertolive/types"
import type { ShoppingStageTemplateForm } from "@/features/bettertolive/api/bettertolive-api"
import {
  createStageTemplate,
  deleteStageTemplate,
  updateStageTemplate,
} from "@/features/bettertolive/api/shopping-crud-api"
import { confirmUndoableDelete } from "@/features/bettertolive/ui/shopping/shopping-delete"
import { ShoppingItemShuttle } from "@/features/bettertolive/ui/shopping/shopping-item-shuttle"
import {
  SHOPPING_DIALOG_CONTENT_CLASS,
  SHOPPING_DIALOG_FIELD_CLASS,
  SHOPPING_DIALOG_FOOTER_CLASS,
  SHOPPING_DIALOG_HEADER_CLASS,
  SHOPPING_DIALOG_PANEL_CLASS,
  SHOPPING_DIALOG_SECTION_CLASS,
} from "@/features/bettertolive/ui/shopping/shopping-page-shared"
import { cn } from "@/lib/utils"

export type EditingStage = { isNew: boolean; stage: ShoppingStageTemplate | null }

type StageEditorDraft = Omit<ShoppingStageTemplateForm, "id">
type Tier = keyof ShoppingStageItem["tiers"]

export function ShoppingStageEditDialog({
  editing,
  shopping,
  onClose,
  onSaved,
  onDeleted,
}: {
  editing: EditingStage
  shopping: ShoppingModuleData
  onClose: () => void
  onSaved: () => void
  onDeleted?: () => void
}) {
  const { t } = useTranslation()
  const seed = editing.stage

  const itemMap = useMemo(
    () => new Map(shopping.items.map((item) => [item.id, item])),
    [shopping.items],
  )

  const [draft, setDraft] = useState<StageEditorDraft>(() => createInitialDraft(seed, itemMap))

  const handleDraftChange = (updater: (current: StageEditorDraft) => StageEditorDraft) => {
    setDraft((current) => normalizeStageDraft(updater(current), itemMap))
  }

  const selectedItemIds = useMemo(() => draft.items.map((si) => si.itemId), [draft.items])

  const syncItemsFromIds = (newIds: string[]) => {
    handleDraftChange((current) => {
      const currentIdSet = new Set(current.items.map((si) => si.itemId))
      const newIdSet = new Set(newIds)

      // Remove items not in new list
      const items = current.items.filter((si) => newIdSet.has(si.itemId))

      // Add new items with default tiers
      for (const id of newIds) {
        if (!currentIdSet.has(id)) {
          items.push({ itemId: id, tiers: { low: [], base: [], up: [] } })
        }
      }

      return { ...current, items }
    })
  }

  const removeStageItem = (itemId: string) => {
    handleDraftChange((current) => ({
      ...current,
      items: current.items.filter((stageItem) => stageItem.itemId !== itemId),
    }))
  }

  const updateTier = (itemId: string, tier: Tier, value: string[]) => {
    handleDraftChange((current) => ({
      ...current,
      items: current.items.map((stageItem) =>
        stageItem.itemId === itemId
          ? { ...stageItem, tiers: { ...stageItem.tiers, [tier]: value } }
          : stageItem,
      ),
    }))
  }

  const handleSubmit = async () => {
    if (!draft.name.trim()) {
      toast.error(t("shopping.error.nameRequired", "请填写名称"))
      return
    }

    const autoSystemDimensionIds = Array.from(
      new Set(
        draft.items
          .map((stageItem) => itemMap.get(stageItem.itemId))
          .filter(Boolean)
          .flatMap((item) => item!.systemTags),
      ),
    )

    const autoSpaceDimensionIds = Array.from(
      new Set(
        draft.items
          .map((stageItem) => itemMap.get(stageItem.itemId))
          .filter(Boolean)
          .flatMap((item) => item!.spaceTags),
      ),
    )

    const form: ShoppingStageTemplateForm = {
      id: seed?.id,
      name: draft.name.trim(),
      description: draft.description.trim(),
      focus: draft.focus.trim(),
      systemDimensionIds: autoSystemDimensionIds,
      spaceDimensionIds: autoSpaceDimensionIds,
      items: draft.items,
    }

    try {
      if (editing.isNew) {
        await createStageTemplate(form)
      } else {
        await updateStageTemplate(form)
      }
      onSaved()
    } catch (e) {
      toast.error(String(e))
    }
  }

  const handleDelete = () => {
    if (!seed) return

    const scheduled = confirmUndoableDelete({
      confirmMessage: t("shopping.confirm.deleteStage", `确定删除 ${seed.name} 吗？`),
      pendingMessage: t("shopping.toast.deletePendingStage", {
        name: seed.name,
        defaultValue: `已加入删除队列：${seed.name}，5 秒内可撤销`,
      }),
      successMessage: t("shopping.toast.deleteSuccessStage", {
        name: seed.name,
        defaultValue: `已删除阶段：${seed.name}`,
      }),
      failureMessage: t("shopping.toast.deleteFailedStage", "删除阶段失败"),
      undoLabel: t("shopping.undo", "撤销"),
      undoneMessage: t("shopping.toast.deleteUndoneStage", {
        name: seed.name,
        defaultValue: `已撤销删除：${seed.name}`,
      }),
      onDelete: () => deleteStageTemplate(seed.id),
      onDeleted,
    })

    if (scheduled) {
      onClose()
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[min(1180px,calc(100vw-3rem))]",
          SHOPPING_DIALOG_CONTENT_CLASS,
        )}
      >
        <DialogHeader className={SHOPPING_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew
              ? t("shopping.stage.create", "新增阶段")
              : t("shopping.stage.edit", "编辑阶段")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
          <div
            className={cn(SHOPPING_DIALOG_SECTION_CLASS, "flex min-h-0 flex-col overflow-hidden")}
          >
            <div className="shrink-0">
              <div className="text-sm font-medium">{t("shopping.stage.basicInfo", "基本属性")}</div>
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <Label>{t("shopping.stage.name", "名称")} *</Label>
                <Input
                  value={draft.name}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, name: event.target.value }))
                  }
                  className={SHOPPING_DIALOG_FIELD_CLASS}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("shopping.stage.description", "描述")}</Label>
                <Textarea
                  value={draft.description}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={4}
                  className={cn(SHOPPING_DIALOG_FIELD_CLASS, "min-h-24 resize-none")}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("shopping.stage.focus", "重点")}</Label>
                <Textarea
                  value={draft.focus}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, focus: event.target.value }))
                  }
                  rows={5}
                  className={cn(SHOPPING_DIALOG_FIELD_CLASS, "min-h-28 resize-none")}
                />
              </div>
            </div>
          </div>

          <div
            className={cn(SHOPPING_DIALOG_SECTION_CLASS, "flex min-h-0 flex-col overflow-hidden")}
          >
            <div className="flex shrink-0 items-center justify-between gap-3">
              <div className="text-sm font-medium">{t("shopping.stage.items", "阶段物品")}</div>
            </div>

            <ShoppingItemShuttle
              items={shopping.items}
              selectedIds={selectedItemIds}
              onChange={syncItemsFromIds}
              scope="stage"
              className="shrink-0"
            />

            <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {draft.items.length === 0 ? (
                <EmptyStageHint
                  title={t("shopping.stage.emptyDimensions", "先添加物品")}
                  description={t(
                    "shopping.stage.emptyShuttleHint",
                    "通过上方穿梭框添加阶段物品，然后为每个物品配置各档位子级",
                  )}
                />
              ) : (
                <div className="grid gap-3 pt-4 xl:grid-cols-2">
                  {draft.items.map((stageItem) => {
                    const item = itemMap.get(stageItem.itemId)
                    if (!item) return null
                    return (
                      <StageItemEditorCard
                        key={stageItem.itemId}
                        item={item}
                        stageItem={stageItem}
                        onRemoveItem={() => removeStageItem(stageItem.itemId)}
                        onUpdateTier={updateTier}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className={SHOPPING_DIALOG_FOOTER_CLASS}>
          {!editing.isNew && (
            <Button variant="outline" onClick={handleDelete} className="mr-auto">
              {t("shopping.delete", "删除")}
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            {t("shopping.cancel", "取消")}
          </Button>
          <Button onClick={handleSubmit}>{t("shopping.save", "保存")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StageItemEditorCard({
  item,
  stageItem,
  onRemoveItem,
  onUpdateTier,
}: {
  item: ShoppingItem
  stageItem: ShoppingStageItem
  onRemoveItem: () => void
  onUpdateTier: (itemId: string, tier: Tier, value: string[]) => void
}) {
  const { t } = useTranslation()

  const childOptions = useMemo<MultiSelectOption[]>(
    () =>
      item.children.map((child) => ({
        value: child.id,
        label: child.name,
      })),
    [item.children],
  )

  return (
    <div className={cn(SHOPPING_DIALOG_PANEL_CLASS, "space-y-4 p-4")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium">{item.name}</div>
          {item.children.length > 0 ? (
            <div className="text-muted-foreground mt-1 text-xs">
              {item.children.map((child) => child.name).join(" / ")}
            </div>
          ) : (
            <div className="text-muted-foreground mt-1 text-xs">
              {t("shopping.stage.noChildren", "该物品暂无子级")}
            </div>
          )}
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onRemoveItem}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-3">
        {(
          [
            ["low", t("shopping.stages.tier.low", "最低")],
            ["base", t("shopping.stages.tier.base", "基础")],
            ["up", t("shopping.stages.tier.up", "升级")],
          ] as Array<[Tier, string]>
        ).map(([tier, label]) => (
          <div key={tier} className="space-y-1.5">
            <Label>{label}</Label>
            <MultiSelect
              options={childOptions}
              value={stageItem.tiers[tier]}
              onChange={(value) => onUpdateTier(item.id, tier, value)}
              placeholder={
                item.children.length > 0
                  ? t("shopping.stage.selectTierChildren", "选择子级")
                  : t("shopping.stage.noChildren", "该物品暂无子级")
              }
              searchPlaceholder={t("shopping.search", "搜索...")}
              emptyMessage={t("shopping.stage.noMatchingChildren", "没有匹配的子级")}
              disabled={childOptions.length === 0}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

function EmptyStageHint({ title, description }: { title: string; description: string }) {
  return (
    <div className="border-foreground/15 bg-muted/15 rounded-xl border border-dashed px-5 py-10 text-center">
      <Plus className="text-muted-foreground mx-auto mb-2 h-5 w-5" />
      <div className="text-sm font-medium">{title}</div>
      <div className="text-muted-foreground mt-1 text-xs leading-5">{description}</div>
    </div>
  )
}

function createInitialDraft(
  seed: ShoppingStageTemplate | null,
  itemMap: Map<string, ShoppingItem>,
): StageEditorDraft {
  if (!seed) {
    return {
      name: "",
      description: "",
      focus: "",
      systemDimensionIds: [],
      spaceDimensionIds: [],
      items: [],
    }
  }

  return normalizeStageDraft(
    {
      name: seed.name,
      description: seed.description ?? "",
      focus: seed.focus ?? "",
      systemDimensionIds: [],
      spaceDimensionIds: [],
      items: seed.items.map((stageItem) => ({
        itemId: stageItem.itemId,
        tiers: {
          low: [...stageItem.tiers.low],
          base: [...stageItem.tiers.base],
          up: [...stageItem.tiers.up],
        },
      })),
    },
    itemMap,
  )
}

function normalizeStageDraft(
  draft: StageEditorDraft,
  itemMap: Map<string, ShoppingItem>,
): StageEditorDraft {
  const seenItemIds = new Set<string>()

  const items = draft.items
    .filter((stageItem) => {
      if (seenItemIds.has(stageItem.itemId)) return false
      seenItemIds.add(stageItem.itemId)
      return true
    })
    .map((stageItem) => {
      const item = itemMap.get(stageItem.itemId)
      if (!item) return null
      const validChildIds = new Set(item.children.map((child) => child.id))
      const normalizeTierIds = (tierIds: string[]) =>
        Array.from(new Set(tierIds.filter((childId) => validChildIds.has(childId))))
      return {
        itemId: stageItem.itemId,
        tiers: {
          low: normalizeTierIds(stageItem.tiers.low),
          base: normalizeTierIds(stageItem.tiers.base),
          up: normalizeTierIds(stageItem.tiers.up),
        },
      }
    })
    .filter((stageItem): stageItem is ShoppingStageItem => Boolean(stageItem))

  return {
    ...draft,
    systemDimensionIds: [],
    spaceDimensionIds: [],
    items,
  }
}
