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
import { Textarea } from "@/components/ui/textarea"
import {
  createSystemDefinition,
  deleteSystemDefinition,
  updateOwnedItem,
  updatePlanItem,
  updateSystemDefinition,
} from "@/features/bettertolive/api/shopping-crud-api"
import type { ShoppingOwnedItem } from "@/features/bettertolive/types"
import { FormField } from "@/features/bettertolive/ui/shopping/shopping-page-shared"
import { ShoppingItemShuttle } from "@/features/bettertolive/ui/shopping/shopping-item-shuttle"
import type {
  ShoppingPlanWithLane,
  ShoppingSystemOverview,
} from "@/features/bettertolive/ui/shopping/shopping-types"
import { systemDisplayName } from "@/features/bettertolive/ui/shopping/shopping-page-data"

type EditingState = {
  isNew: boolean
  system: ShoppingSystemOverview | null
}

// 系统编辑对话框接受全量物品池作为穿梭框候选 — 见方案 §3
export type SystemDialogAllItems = {
  owned: ShoppingOwnedItem[]
  plan: ShoppingPlanWithLane[]
}

type FormState = {
  isNew: boolean
  id: string
  summary: string
  keyQuestion: string
  secondaryGroupsText: string
  selectedItemIds: string[]
}

const SYSTEM_LIMITS = {
  id: 40,
  summary: 180,
  keyQuestion: 180,
  group: 32,
  groups: 8,
} as const

function parseGroups(value: string): string[] {
  return value
    .split(/[,,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildForm(editing: EditingState, allItems: SystemDialogAllItems): FormState {
  if (!editing.isNew && editing.system) {
    const systemId = editing.system.id
    // 初始选中:任何 system 字段等于本系统的物品
    const selectedIds = [
      ...allItems.owned.filter((item) => item.system === systemId).map((item) => item.id),
      ...allItems.plan.filter((item) => item.system === systemId).map((item) => item.id),
    ]
    return {
      isNew: false,
      id: systemId,
      summary: editing.system.summary,
      keyQuestion: editing.system.keyQuestion,
      secondaryGroupsText: editing.system.secondaryGroups.join(", "),
      selectedItemIds: selectedIds,
    }
  }

  return {
    isNew: true,
    id: "",
    summary: "",
    keyQuestion: "",
    secondaryGroupsText: "",
    selectedItemIds: [],
  }
}

const schema = z.object({
  id: z.string().trim().min(1).max(SYSTEM_LIMITS.id),
  summary: z.string().trim().min(1).max(SYSTEM_LIMITS.summary),
  keyQuestion: z.string().trim().min(1).max(SYSTEM_LIMITS.keyQuestion),
  secondaryGroupsText: z.string(),
})

export function ShoppingSystemEditDialog({
  editing,
  existingSystemIds,
  allItems,
  onClose,
  onSaved,
}: {
  editing: EditingState | null
  existingSystemIds: string[]
  allItems: SystemDialogAllItems
  onClose: () => void
  onSaved: () => void
}) {
  if (!editing) return null

  const initialForm = buildForm(editing, allItems)

  const dialogKey = editing.isNew ? "new-system" : editing.system?.id

  return (
    <Dialog
      open
      key={dialogKey}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SystemDialogContent
        initialForm={initialForm}
        existingSystemIds={existingSystemIds}
        allItems={allItems}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Dialog>
  )
}

function SystemDialogContent({
  initialForm,
  existingSystemIds,
  allItems,
  onClose,
  onSaved,
}: {
  initialForm: FormState
  existingSystemIds: string[]
  allItems: SystemDialogAllItems
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)

  const update = (partial: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...partial }))
  }

  // 穿梭框候选 — 所有物品。提示当前归属系统
  const shuttleCandidates = useMemo(
    () => [
      ...allItems.owned.map((item) => ({
        id: item.id,
        name: item.name,
        hint: item.system ? systemDisplayName(item.system, t) : undefined,
      })),
      ...allItems.plan.map((item) => ({
        id: item.id,
        name: item.name,
        hint: item.system ? systemDisplayName(item.system, t) : undefined,
      })),
    ],
    [allItems, t],
  )

  const initialSelectedSet = useMemo(
    () => new Set(initialForm.selectedItemIds),
    [initialForm.selectedItemIds],
  )

  async function handleSave() {
    try {
      setSaving(true)
      setError(null)

      const parsed = schema.safeParse(form)
      if (!parsed.success) {
        setError(t("shopping.validation.invalidForm"))
        return
      }

      const nextId = parsed.data.id.trim()
      const normalizedCurrentId = form.isNew ? null : form.id.trim().toLocaleLowerCase()
      const hasDuplicate = existingSystemIds.some((systemId) => {
        const normalizedId = systemId.trim().toLocaleLowerCase()
        return normalizedId === nextId.toLocaleLowerCase() && normalizedId !== normalizedCurrentId
      })

      if (hasDuplicate) {
        setError(t("shopping.validation.duplicateName"))
        return
      }

      const groups = parseGroups(parsed.data.secondaryGroupsText)
      if (groups.length > SYSTEM_LIMITS.groups) {
        setError(
          t("shopping.validation.maxItems", {
            field: t("shopping.systems.form.secondaryGroups"),
            count: SYSTEM_LIMITS.groups,
          }),
        )
        return
      }
      if (groups.some((group) => group.length > SYSTEM_LIMITS.group)) {
        setError(
          t("shopping.validation.maxLength", {
            field: t("shopping.systems.form.secondaryGroups"),
            count: SYSTEM_LIMITS.group,
          }),
        )
        return
      }

      const payload = {
        id: nextId,
        summary: parsed.data.summary.trim(),
        keyQuestion: parsed.data.keyQuestion.trim(),
        secondaryGroups: groups,
      }

      // 1. 写系统定义
      if (form.isNew) {
        await createSystemDefinition(payload)
      } else {
        await updateSystemDefinition(payload)
      }

      // 2. 处理物品归属变化(set-only 策略:勾选 = 把物品 system 改成本系统,取消勾选 = 不动)
      //    见方案 §3 — 每个物品至少要属于一个系统,因此取消选中不会清空 system 字段
      const ownedById = new Map(allItems.owned.map((item) => [item.id, item]))
      const planById = new Map(allItems.plan.map((item) => [item.id, item]))
      const tasks: Promise<unknown>[] = []
      for (const id of form.selectedItemIds) {
        const wasIn = initialSelectedSet.has(id)
        if (wasIn) continue // 已经属于本系统,不动

        const ownedItem = ownedById.get(id)
        if (ownedItem && ownedItem.system !== nextId) {
          tasks.push(
            updateOwnedItem({
              ...ownedItem,
              depreciation: ownedItem.depreciation ?? null,
              system: nextId,
            }),
          )
          continue
        }
        const planItem = planById.get(id)
        if (planItem && planItem.system !== nextId) {
          tasks.push(
            updatePlanItem({
              ...planItem,
              laneId: planItem.laneId,
              depreciation: planItem.depreciation ?? null,
              currentPrice: planItem.currentPrice ?? null,
              buyBelowPrice: planItem.buyBelowPrice ?? null,
              overpayPrice: planItem.overpayPrice ?? null,
              system: nextId,
            }),
          )
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
    if (form.isNew) return
    if (!window.confirm(t("shopping.systems.confirmDelete"))) return

    try {
      setSaving(true)
      setError(null)
      await deleteSystemDefinition(form.id)
      onClose()
      onSaved()
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogContent className="flex max-h-[min(90vh,860px)] flex-col sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>
          {form.isNew
            ? t("shopping.systems.newTitle")
            : t("shopping.systems.editTitle", { title: form.id })}
        </DialogTitle>
        <DialogDescription>
          {form.isNew
            ? t("shopping.systems.newDescription")
            : t("shopping.systems.editDescription")}
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 flex-1 overflow-y-auto pr-1">
        <div className="space-y-4">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          <div className="grid items-start gap-4 md:grid-cols-2">
            <FormField label={t("shopping.systems.form.system")} required>
              <Input
                value={form.id}
                onChange={(event) => update({ id: event.target.value })}
                maxLength={SYSTEM_LIMITS.id}
                disabled={!form.isNew}
                placeholder={t("shopping.systems.form.systemPlaceholder")}
              />
            </FormField>
          </div>

          <FormField label={t("shopping.systems.form.summary")} required>
            <Textarea
              value={form.summary}
              onChange={(event) => update({ summary: event.target.value })}
              maxLength={SYSTEM_LIMITS.summary}
              rows={3}
            />
          </FormField>

          <FormField label={t("shopping.systems.form.keyQuestion")} required>
            <Textarea
              value={form.keyQuestion}
              onChange={(event) => update({ keyQuestion: event.target.value })}
              maxLength={SYSTEM_LIMITS.keyQuestion}
              rows={3}
            />
          </FormField>

          <FormField
            label={t("shopping.systems.form.secondaryGroups")}
            description={t("shopping.systems.form.secondaryGroupsHelp")}
          >
            <Textarea
              value={form.secondaryGroupsText}
              onChange={(event) => update({ secondaryGroupsText: event.target.value })}
              maxLength={SYSTEM_LIMITS.group * SYSTEM_LIMITS.groups + SYSTEM_LIMITS.groups * 2}
              rows={3}
            />
          </FormField>

          {/* 穿梭框 — 把别处的物品挪到本系统(set-only:取消选中 = 无动作,物品仍归原系统) */}
          <FormField
            label={t("shopping.systems.form.assignItems")}
            description={t("shopping.systems.form.assignItemsHelp")}
          >
            <ShoppingItemShuttle
              candidates={shuttleCandidates}
              selectedIds={form.selectedItemIds}
              onChange={(nextIds) => update({ selectedItemIds: nextIds })}
              leftTitle={t("shopping.shuttle.candidates")}
              rightTitle={t("shopping.shuttle.selected")}
              note={t("shopping.shuttle.systemAssignNote")}
            />
          </FormField>
        </div>
      </div>

      <DialogFooter className="flex items-center justify-between">
        {!form.isNew ? (
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
            {t("shopping.systems.form.cancel")}
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {t("shopping.systems.form.save")}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  )
}
