import { Plus, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
/* eslint-disable react-hooks/incompatible-library */
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import { toast } from "sonner"

import { AnimatedIconButton, Button } from "@/components/ui/button"
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
import { confirmUndoableDelete } from "@/features/bettertolive/ui/shopping/_shared/shopping-delete"
import { ShoppingItemShuttle } from "@/features/bettertolive/ui/shopping/_shared/shopping-item-shuttle"
import {
  SHOPPING_DIALOG_CONTENT_CLASS,
  SHOPPING_DIALOG_FIELD_CLASS,
  SHOPPING_DIALOG_FOOTER_CLASS,
  SHOPPING_DIALOG_HEADER_CLASS,
  SHOPPING_DIALOG_PANEL_CLASS,
  SHOPPING_DIALOG_SECTION_CLASS,
} from "@/features/bettertolive/ui/shopping/_shared/shopping-page-shared"
import { cn } from "@/lib/utils"

const stageFormSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  focus: z.string(),
})

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
  const [isPending, setIsPending] = useState(false)

  const itemMap = useMemo(
    () => new Map(shopping.items.map((item) => [item.id, item])),
    [shopping.items],
  )

  const initialDraft = useMemo(() => createInitialDraft(seed, itemMap), [seed, itemMap])
  const form = useForm<z.infer<typeof stageFormSchema>>({
    resolver: zodResolver(stageFormSchema),
    defaultValues: {
      name: initialDraft.name,
      description: initialDraft.description,
      focus: initialDraft.focus,
    },
  })

  const [draft, setDraft] = useState<StageEditorDraft>(initialDraft)

  const stageName = form.watch("name")
  const stageDescription = form.watch("description")
  const stageFocus = form.watch("focus")

  const handleDraftChange = (updater: (current: StageEditorDraft) => StageEditorDraft) => {
    setDraft((current) => {
      const result = normalizeStageDraft(updater(current), itemMap)
      if (result.removedDuplicateIds.length > 0) {
        toast.warning(
          t("shopping.stage.duplicateItems", {
            defaultValue: `已自动去除重复物品：${result.removedDuplicateIds.join(", ")}`,
            ids: result.removedDuplicateIds.join(", "),
          }),
        )
      }
      return result.draft
    })
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

  const canSubmit = form.formState.isValid

  const handleSubmit = async () => {
    const values = form.getValues()
    if (!canSubmit) {
      toast.error(t("shopping.error.nameRequired"))
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

    const payload: ShoppingStageTemplateForm = {
      id: seed?.id,
      name: values.name.trim(),
      description: values.description.trim(),
      focus: values.focus.trim(),
      systemDimensionIds: autoSystemDimensionIds,
      spaceDimensionIds: autoSpaceDimensionIds,
      items: draft.items,
    }

    setIsPending(true)
    try {
      if (editing.isNew) {
        await createStageTemplate(payload)
      } else {
        await updateStageTemplate(payload)
      }
      onSaved()
    } catch (e) {
      toast.error(String(e))
    } finally {
      setIsPending(false)
    }
  }

  const handleDelete = () => {
    if (!seed) return

    const scheduled = confirmUndoableDelete({
      confirmMessage: t("shopping.confirm.deleteStage", {
        name: seed.name,
        defaultValue: `确定删除 ${seed.name} 吗？`,
      }),
      pendingMessage: t("shopping.toast.deletePendingStage", {
        name: seed.name,
        defaultValue: `已加入删除队列：${seed.name}，5 秒内可撤销`,
      }),
      successMessage: t("shopping.toast.deleteSuccessStage", {
        name: seed.name,
        defaultValue: `已删除阶段：${seed.name}`,
      }),
      failureMessage: t("shopping.toast.deleteFailedStage"),
      undoLabel: t("shopping.undo"),
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

  const handleOpenChange = (open: boolean) => {
    if (!open && form.formState.isDirty) {
      const confirmed = window.confirm(
        t("shopping.confirm.unsavedChanges", {
          defaultValue: "当前有未保存的修改，确定要关闭吗？",
        }),
      )
      if (!confirmed) return
    }
    if (!open) onClose()
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[min(1180px,calc(100vw-3rem))]",
          SHOPPING_DIALOG_CONTENT_CLASS,
        )}
      >
        <DialogHeader className={SHOPPING_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew ? t("shopping.stage.create") : t("shopping.stage.edit")}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleSubmit()
          }}
        >
          <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <div
              className={cn(SHOPPING_DIALOG_SECTION_CLASS, "flex min-h-0 flex-col overflow-hidden")}
            >
              <div className="shrink-0">
                <div className="text-sm font-medium">{t("shopping.stage.basicInfo")}</div>
              </div>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                <div className="space-y-1.5">
                  <Label>{t("shopping.stage.name")} *</Label>
                  <Input
                    autoFocus
                    value={stageName}
                    onChange={(event) =>
                      form.setValue("name", event.target.value, { shouldValidate: true })
                    }
                    className={SHOPPING_DIALOG_FIELD_CLASS}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("shopping.stage.description")}</Label>
                  <Textarea
                    value={stageDescription}
                    onChange={(event) =>
                      form.setValue("description", event.target.value, { shouldValidate: true })
                    }
                    rows={4}
                    className={cn(SHOPPING_DIALOG_FIELD_CLASS, "min-h-24 resize-none")}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("shopping.stage.focus")}</Label>
                  <Textarea
                    value={stageFocus}
                    onChange={(event) =>
                      form.setValue("focus", event.target.value, { shouldValidate: true })
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
                <div className="text-sm font-medium">{t("shopping.stage.items")}</div>
              </div>

              <ShoppingItemShuttle
                items={shopping.items}
                attributeDefinitions={shopping.attributeDefinitions}
                selectedIds={selectedItemIds}
                onChange={syncItemsFromIds}
                scope="stage"
                className="shrink-0"
              />

              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                {draft.items.length === 0 ? (
                  <EmptyStageHint
                    title={t("shopping.stage.emptyDimensions")}
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
        </form>

        <DialogFooter className={SHOPPING_DIALOG_FOOTER_CLASS}>
          {!editing.isNew && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="mr-auto"
            >
              {t("common.actions.delete")}
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {t("common.actions.cancel")}
          </Button>
          <Button type="submit" disabled={!canSubmit || isPending}>
            {isPending ? t("common.actions.saving") : t("common.actions.save")}
          </Button>
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
              {t("shopping.stage.noChildren")}
            </div>
          )}
        </div>
        <AnimatedIconButton
          show
          type="button"
          variant="ghost"
          size="icon-sm"
          label={t("shopping.stages.removeItem")}
          icon={<Trash2 className="h-4 w-4" />}
          onClick={onRemoveItem}
        />
      </div>

      <div className="grid gap-3">
        {(
          [
            ["low", t("shopping.stages.tier.low")],
            ["base", t("shopping.stages.tier.base")],
            ["up", t("shopping.stages.tier.up")],
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
                  ? t("shopping.stage.selectTierChildren")
                  : t("shopping.stage.noChildren")
              }
              searchPlaceholder={t("shopping.search")}
              emptyMessage={t("shopping.stage.noMatchingChildren")}
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
  ).draft
}

type NormalizeResult = {
  draft: StageEditorDraft
  removedDuplicateIds: string[]
}

function normalizeStageDraft(
  draft: StageEditorDraft,
  itemMap: Map<string, ShoppingItem>,
): NormalizeResult {
  const seenItemIds = new Set<string>()
  const removedDuplicateIds: string[] = []

  const items = draft.items
    .filter((stageItem) => {
      if (seenItemIds.has(stageItem.itemId)) {
        removedDuplicateIds.push(stageItem.itemId)
        return false
      }
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
    draft: {
      ...draft,
      systemDimensionIds: [],
      spaceDimensionIds: [],
      items,
    },
    removedDuplicateIds,
  }
}
