import { Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  createSpaceDefinition,
  deletePageContent,
  updateOwnedItem,
  updatePlanItem,
  updateSpaceDefinition,
} from "@/features/bettertolive/api/shopping-crud-api"
import type { ShoppingOwnedItem } from "@/features/bettertolive/types"
import { FormField } from "@/features/bettertolive/ui/shopping/shopping-page-shared"
import { ShoppingItemShuttle } from "@/features/bettertolive/ui/shopping/shopping-item-shuttle"
import type {
  ShoppingPlanWithLane,
  SpaceOverview,
} from "@/features/bettertolive/ui/shopping/shopping-types"

type EditingState = {
  isNew: boolean
  space: SpaceOverview | null
}

// 空间编辑对话框接受全量物品池作为穿梭框候选 — 见方案 §4
export type SpaceDialogAllItems = {
  owned: ShoppingOwnedItem[]
  plan: ShoppingPlanWithLane[]
}

type FormState = {
  isNew: boolean
  id?: string
  originalName?: string
  name: string
  selectedItemIds: string[]
}

const SPACE_LIMITS = {
  name: 40,
} as const

const schema = z.object({
  name: z.string().trim().min(1).max(SPACE_LIMITS.name),
})

function renameSpaceValue(spaces: string[], oldName: string, newName: string) {
  return Array.from(new Set(spaces.map((space) => (space === oldName ? newName : space))))
}

function addSpaceValue(spaces: string[], name: string) {
  return Array.from(new Set([...spaces, name]))
}

function removeSpaceValue(spaces: string[], name: string) {
  return spaces.filter((space) => space !== name)
}

function buildForm(editing: EditingState, allItems: SpaceDialogAllItems): FormState {
  if (editing.isNew || !editing.space) {
    return {
      isNew: true,
      name: "",
      selectedItemIds: [],
    }
  }

  const name = editing.space.name
  // 初始选中:任何 spaces 里包含本空间名的物品
  const selectedIds = [
    ...allItems.owned.filter((item) => item.spaces.includes(name)).map((item) => item.id),
    ...allItems.plan.filter((item) => item.spaces.includes(name)).map((item) => item.id),
  ]

  return {
    isNew: false,
    id: editing.space.definitionId ?? undefined,
    originalName: name,
    name,
    selectedItemIds: selectedIds,
  }
}

export function ShoppingSpaceEditDialog({
  editing,
  existingSpaceNames,
  allItems,
  onClose,
  onSaved,
}: {
  editing: EditingState | null
  existingSpaceNames: string[]
  allItems: SpaceDialogAllItems
  onClose: () => void
  onSaved: () => void
}) {
  if (!editing) return null

  const initialForm = buildForm(editing, allItems)
  const dialogKey = editing.isNew
    ? "new-space"
    : (editing.space?.definitionId ?? editing.space?.name)

  return (
    <Dialog
      open
      key={dialogKey}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SpaceDialogContent
        initialForm={initialForm}
        existingSpaceNames={existingSpaceNames}
        allItems={allItems}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Dialog>
  )
}

function SpaceDialogContent({
  initialForm,
  existingSpaceNames,
  allItems,
  onClose,
  onSaved,
}: {
  initialForm: FormState
  existingSpaceNames: string[]
  allItems: SpaceDialogAllItems
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)

  // 穿梭框候选 — 把 owned + plan 拍扁,提示当前所属空间
  const shuttleCandidates = useMemo(
    () => [
      ...allItems.owned.map((item) => ({
        id: item.id,
        name: item.name,
        hint: item.spaces.length > 0 ? item.spaces.join(" / ") : undefined,
      })),
      ...allItems.plan.map((item) => ({
        id: item.id,
        name: item.name,
        hint: item.spaces.length > 0 ? item.spaces.join(" / ") : undefined,
      })),
    ],
    [allItems],
  )

  const initialSelectedSet = useMemo(
    () => new Set(initialForm.selectedItemIds),
    [initialForm.selectedItemIds],
  )

  async function handleSave() {
    try {
      setSaving(true)
      setError(null)

      const parsed = schema.safeParse({ name: form.name })
      if (!parsed.success) {
        setError(t("shopping.validation.invalidForm"))
        return
      }

      const nextName = parsed.data.name.trim()
      const normalizedCurrentName = form.originalName?.trim().toLocaleLowerCase()
      const hasDuplicate = existingSpaceNames.some((name) => {
        const normalizedName = name.trim().toLocaleLowerCase()
        return (
          normalizedName === nextName.toLocaleLowerCase() &&
          normalizedName !== normalizedCurrentName
        )
      })

      if (hasDuplicate) {
        setError(t("shopping.validation.duplicateName"))
        return
      }

      if (form.isNew) {
        await createSpaceDefinition({ name: nextName })

        // 新建空间也可以直接挑物品 — 给它们加上 spaces:[nextName]
        const ownedIds = new Set(allItems.owned.map((item) => item.id))
        const planIds = new Set(allItems.plan.map((item) => item.id))
        const tasks: Promise<unknown>[] = []
        for (const id of form.selectedItemIds) {
          if (ownedIds.has(id)) {
            const item = allItems.owned.find((row) => row.id === id)!
            tasks.push(
              updateOwnedItem({
                ...item,
                depreciation: item.depreciation ?? null,
                spaces: addSpaceValue(item.spaces, nextName),
              }),
            )
          } else if (planIds.has(id)) {
            const item = allItems.plan.find((row) => row.id === id)!
            tasks.push(
              updatePlanItem({
                ...item,
                laneId: item.laneId,
                depreciation: item.depreciation ?? null,
                currentPrice: item.currentPrice ?? null,
                buyBelowPrice: item.buyBelowPrice ?? null,
                overpayPrice: item.overpayPrice ?? null,
                spaces: addSpaceValue(item.spaces, nextName),
              }),
            )
          }
        }
        await Promise.all(tasks)

        onClose()
        onSaved()
        return
      }

      if (!form.originalName) {
        setError(t("shopping.validation.invalidForm"))
        return
      }

      // 1. 写空间定义本身(可能改名)
      if (form.id) {
        await updateSpaceDefinition({ id: form.id, name: nextName })
      } else {
        await createSpaceDefinition({ name: nextName })
      }

      // 2. 计算物品归属变化(基于 nextName,因为旧名将被改成新名)
      const nextSelected = new Set(form.selectedItemIds)
      const wasRenamed = nextName !== form.originalName

      const ownedById = new Map(allItems.owned.map((item) => [item.id, item]))
      const planById = new Map(allItems.plan.map((item) => [item.id, item]))
      const allIds = new Set([...ownedById.keys(), ...planById.keys()])

      const tasks: Promise<unknown>[] = []
      for (const id of allIds) {
        const ownedItem = ownedById.get(id)
        const planItem = planById.get(id)
        const wasIn = initialSelectedSet.has(id)
        const isIn = nextSelected.has(id)

        if (ownedItem) {
          let nextSpaces = ownedItem.spaces
          if (wasRenamed) {
            // 物品之前在该空间下,要把空间名改成新的
            nextSpaces = renameSpaceValue(nextSpaces, form.originalName, nextName)
          }
          if (isIn && !wasIn) {
            nextSpaces = addSpaceValue(nextSpaces, nextName)
          } else if (!isIn && wasIn) {
            // 取消选中 — 移除该空间名(也包括 rename 前的旧名,以防万一)
            nextSpaces = removeSpaceValue(nextSpaces, nextName)
            if (wasRenamed) {
              nextSpaces = removeSpaceValue(nextSpaces, form.originalName)
            }
          }
          if (nextSpaces !== ownedItem.spaces) {
            tasks.push(
              updateOwnedItem({
                ...ownedItem,
                depreciation: ownedItem.depreciation ?? null,
                spaces: nextSpaces,
              }),
            )
          }
        } else if (planItem) {
          let nextSpaces = planItem.spaces
          if (wasRenamed) {
            nextSpaces = renameSpaceValue(nextSpaces, form.originalName, nextName)
          }
          if (isIn && !wasIn) {
            nextSpaces = addSpaceValue(nextSpaces, nextName)
          } else if (!isIn && wasIn) {
            nextSpaces = removeSpaceValue(nextSpaces, nextName)
            if (wasRenamed) {
              nextSpaces = removeSpaceValue(nextSpaces, form.originalName)
            }
          }
          if (nextSpaces !== planItem.spaces) {
            tasks.push(
              updatePlanItem({
                ...planItem,
                laneId: planItem.laneId,
                depreciation: planItem.depreciation ?? null,
                currentPrice: planItem.currentPrice ?? null,
                buyBelowPrice: planItem.buyBelowPrice ?? null,
                overpayPrice: planItem.overpayPrice ?? null,
                spaces: nextSpaces,
              }),
            )
          }
        }
      }

      await Promise.all(tasks)

      onClose()
      onSaved()
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (form.isNew || !form.id) return
    if (!window.confirm(t("shopping.spaces.confirmDelete"))) return

    try {
      setSaving(true)
      setError(null)
      await deletePageContent(form.id)
      onClose()
      onSaved()
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogContent className="flex max-h-[min(90vh,800px)] flex-col sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>
          {form.isNew
            ? t("shopping.spaces.newTitle")
            : t("shopping.spaces.editTitle", { title: form.originalName ?? form.name })}
        </DialogTitle>
        <DialogDescription>
          {form.isNew ? t("shopping.spaces.newDescription") : t("shopping.spaces.editDescription")}
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-4">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          <FormField label={t("shopping.spaces.form.name")} required>
            <Input
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              maxLength={SPACE_LIMITS.name}
            />
          </FormField>

          {/* 穿梭框 — 选择属于本空间的物品。set + remove 策略:勾选 = 把空间名加到物品的 spaces 数组;取消 = 从 spaces 移除 */}
          <FormField
            label={t("shopping.spaces.form.assignItems")}
            description={t("shopping.spaces.form.assignItemsHelp")}
          >
            <ShoppingItemShuttle
              candidates={shuttleCandidates}
              selectedIds={form.selectedItemIds}
              onChange={(nextIds) => setForm((prev) => ({ ...prev, selectedItemIds: nextIds }))}
              leftTitle={t("shopping.shuttle.candidates")}
              rightTitle={t("shopping.shuttle.selected")}
            />
          </FormField>
        </div>
      </div>

      <DialogFooter className="flex items-center justify-between">
        {!form.isNew && form.id ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-red-500 hover:bg-red-50 hover:text-red-700"
            onClick={() => void handleDelete()}
            disabled={saving}
          >
            <Trash2 />
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("shopping.spaces.form.cancel")}
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {t("shopping.spaces.form.save")}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  )
}
