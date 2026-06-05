import { Trash2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type {
  ShoppingOwnedItemForm,
  ShoppingPlanItemForm,
} from "@/features/bettertolive/api/bettertolive-api"
import {
  createOwnedItem,
  createPlanItem,
  deleteOwnedItem,
  deletePlanItem,
  updateOwnedItem,
  updatePlanItem,
} from "@/features/bettertolive/api/shopping-crud-api"
import type { ShoppingOwnedItem } from "@/features/bettertolive/models/workspace"
import { cn } from "@/lib/utils"
import type { ShoppingPlanWithLane } from "@/features/bettertolive/ui/shopping/shopping-system-detail-dialog"

export type EditingOwnedItem = {
  type: "owned"
  item: ShoppingOwnedItem
  isNew?: boolean
}

export type EditingPlanItem = {
  type: "plan"
  item: ShoppingPlanWithLane
  isNew?: boolean
}

export type EditingItem = EditingOwnedItem | EditingPlanItem

type LaneOption = { id: string; title: string }

type FormState =
  | (ShoppingOwnedItemForm & { isNew: boolean; itemType: "owned" })
  | (ShoppingPlanItemForm & { isNew: boolean; itemType: "plan" })

function buildOwnedForm(
  item: ShoppingOwnedItem,
  isNew: boolean,
): ShoppingOwnedItemForm & { isNew: boolean; itemType: "owned" } {
  return {
    isNew,
    itemType: "owned" as const,
    id: isNew ? undefined : item.id,
    name: item.name,
    system: item.system,
    category: item.category,
    spaces: [...item.spaces],
    stages: [...item.stages],
    necessity: item.necessity,
    lifecycle: item.lifecycle,
    depreciation: item.depreciation ?? null,
    quantity: item.quantity,
    status: item.status,
    replacementCue: item.replacementCue,
    note: item.note,
  }
}

function buildPlanForm(
  item: ShoppingPlanWithLane,
  isNew: boolean,
): ShoppingPlanItemForm & { isNew: boolean; itemType: "plan" } {
  return {
    isNew,
    itemType: "plan" as const,
    id: isNew ? undefined : item.id,
    laneId: item.laneId,
    name: item.name,
    system: item.system,
    category: item.category,
    spaces: [...item.spaces],
    stages: [...item.stages],
    necessity: item.necessity,
    lifecycle: item.lifecycle,
    depreciation: item.depreciation ?? null,
    reason: item.reason,
    targetLifestyle: item.targetLifestyle,
    currentPrice: item.currentPrice ?? null,
    buyBelowPrice: item.buyBelowPrice ?? null,
    overpayPrice: item.overpayPrice ?? null,
    note: item.note,
    tags: [...item.tags],
    keywords: [...item.keywords],
  }
}

function parseArray(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export function ShoppingItemEditDialog({
  editing,
  lanes,
  onClose,
  onSaved,
}: {
  editing: EditingItem | null
  lanes: LaneOption[]
  onClose: () => void
  onSaved: () => void
}) {
  if (!editing) return null

  const initialForm =
    editing.type === "owned"
      ? buildOwnedForm(editing.item, editing.isNew ?? false)
      : buildPlanForm(editing.item, editing.isNew ?? false)

  const dialogKey = `${editing.type}:${editing.item.id}:${editing.isNew ? "new" : "edit"}`

  return (
    <Dialog
      open
      key={dialogKey}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <ItemDialogContent
        initialForm={initialForm}
        editing={editing}
        lanes={lanes}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Dialog>
  )
}

function ItemDialogContent({
  initialForm,
  editing,
  lanes,
  onClose,
  onSaved,
}: {
  initialForm: FormState
  editing: EditingItem
  lanes: LaneOption[]
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const isOwned = editing.type === "owned"

  const update = (partial: Record<string, unknown>) => {
    setForm((prev) => ({ ...prev, ...partial }))
  }

  async function handleSave() {
    try {
      setSaving(true)
      setError(null)

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { isNew, itemType, id, ...formData } = form
      if (form.itemType === "owned") {
        if (id) {
          await updateOwnedItem({ ...formData, id } as ShoppingOwnedItemForm)
        } else {
          await createOwnedItem(formData as ShoppingOwnedItemForm)
        }
      } else {
        if (id) {
          await updatePlanItem({ ...formData, id } as ShoppingPlanItemForm)
        } else {
          await createPlanItem(formData as ShoppingPlanItemForm)
        }
      }

      onClose()
      onSaved()
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!editing.item.id || editing.isNew) return
    if (!window.confirm(t("shopping.admin.items.confirmDelete"))) return

    try {
      setError(null)
      if (editing.type === "owned") {
        await deleteOwnedItem(editing.item.id)
      } else {
        await deletePlanItem(editing.item.id)
      }
      onClose()
      onSaved()
    } catch (e) {
      setError(String(e))
    }
  }

  return (
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>
          {isOwned
            ? form.isNew
              ? t("shopping.admin.items.newOwnedTitle")
              : t("shopping.admin.items.editTitle", { name: editing.item.name })
            : form.isNew
              ? t("shopping.admin.items.newPlanTitle")
              : t("shopping.admin.items.editTitle", { name: editing.item.name })}
        </DialogTitle>
        <DialogDescription>
          {form.isNew
            ? t("shopping.admin.items.saveInstructions")
            : t("shopping.admin.items.editInstructions")}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label={t("shopping.admin.items.form.name")} required>
            <Input
              value={form.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder={t("shopping.admin.items.form.namePlaceholder")}
            />
          </FormField>

          {!isOwned ? (
            <FormField label={t("shopping.admin.items.form.laneId")} required>
              <Select
                value={"laneId" in form ? form.laneId : ""}
                onValueChange={(v) => update({ laneId: v ?? "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("shopping.admin.items.form.selectLane")} />
                </SelectTrigger>
                <SelectContent>
                  {lanes.map((lane) => (
                    <SelectItem key={lane.id} value={lane.id}>
                      {lane.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          ) : null}

          <FormField label={t("shopping.admin.items.form.systemId")} required>
            <Input
              value={form.system}
              onChange={(e) => update({ system: e.target.value })}
              placeholder={t("shopping.admin.items.form.systemPlaceholder")}
            />
          </FormField>
          <FormField label={t("shopping.admin.items.form.category")} required>
            <Input
              value={form.category}
              onChange={(e) => update({ category: e.target.value })}
              placeholder={t("shopping.admin.items.form.categoryPlaceholder")}
            />
          </FormField>
          <FormField label={t("shopping.admin.items.form.necessity")} required>
            <Input
              value={form.necessity}
              onChange={(e) => update({ necessity: e.target.value })}
              placeholder={t("shopping.admin.items.form.necessityPlaceholder")}
            />
          </FormField>
          <FormField label={t("shopping.admin.items.form.lifecycle")} required>
            <Input
              value={form.lifecycle}
              onChange={(e) => update({ lifecycle: e.target.value })}
              placeholder={t("shopping.admin.items.form.lifecyclePlaceholder")}
            />
          </FormField>
          <FormField label={t("shopping.admin.items.form.depreciation")}>
            <Input
              value={form.depreciation ?? ""}
              onChange={(e) => update({ depreciation: e.target.value || null })}
              placeholder={t("shopping.admin.items.form.depreciationPlaceholder")}
            />
          </FormField>
          <FormField label={t("shopping.admin.items.form.spaces")}>
            <Input
              value={("spaces" in form ? form.spaces : []).join(", ")}
              onChange={(e) => update({ spaces: parseArray(e.target.value) })}
              placeholder={t("shopping.admin.items.form.spacesPlaceholder")}
            />
          </FormField>
          <FormField label={t("shopping.admin.items.form.stages")}>
            <Input
              value={("stages" in form ? form.stages : []).join(", ")}
              onChange={(e) => update({ stages: parseArray(e.target.value) })}
              placeholder={t("shopping.admin.items.form.stagesPlaceholder")}
            />
          </FormField>

          {isOwned ? (
            <>
              <FormField label={t("shopping.admin.items.form.quantity")}>
                <Input
                  type="number"
                  value={"quantity" in form ? form.quantity : 1}
                  onChange={(e) => update({ quantity: Number(e.target.value) || 0 })}
                  min={0}
                />
              </FormField>
              <FormField label={t("shopping.admin.items.form.status")} required>
                <Input
                  value={"status" in form ? form.status : ""}
                  onChange={(e) => update({ status: e.target.value })}
                  placeholder={t("shopping.admin.items.form.statusPlaceholder")}
                />
              </FormField>
              <FormField label={t("shopping.admin.items.form.replacementCue")} required>
                <Input
                  value={"replacementCue" in form ? form.replacementCue : ""}
                  onChange={(e) => update({ replacementCue: e.target.value })}
                  placeholder={t("shopping.admin.items.form.cuePlaceholder")}
                />
              </FormField>
            </>
          ) : (
            <>
              <FormField label={t("shopping.admin.items.form.tags")}>
                <Input
                  value={("tags" in form ? form.tags : []).join(", ")}
                  onChange={(e) => update({ tags: parseArray(e.target.value) })}
                  placeholder={t("shopping.admin.items.form.tagsPlaceholder")}
                />
              </FormField>
              <FormField label={t("shopping.admin.items.form.keywords")}>
                <Input
                  value={("keywords" in form ? form.keywords : []).join(", ")}
                  onChange={(e) => update({ keywords: parseArray(e.target.value) })}
                  placeholder={t("shopping.admin.items.form.keywordsPlaceholder")}
                />
              </FormField>
              <FormField label={t("shopping.admin.items.form.reason")} required>
                <Input
                  value={"reason" in form ? form.reason : ""}
                  onChange={(e) => update({ reason: e.target.value })}
                  placeholder={t("shopping.admin.items.form.reasonPlaceholder")}
                />
              </FormField>
              <FormField label={t("shopping.admin.items.form.targetLifestyle")} required>
                <Input
                  value={"targetLifestyle" in form ? form.targetLifestyle : ""}
                  onChange={(e) => update({ targetLifestyle: e.target.value })}
                  placeholder={t("shopping.admin.items.form.lifestylePlaceholder")}
                />
              </FormField>
              <FormField label={t("shopping.admin.items.form.currentPrice")}>
                <Input
                  type="number"
                  value={"currentPrice" in form ? (form.currentPrice ?? "") : ""}
                  onChange={(e) =>
                    update({ currentPrice: e.target.value ? Number(e.target.value) : null })
                  }
                  placeholder={t("shopping.admin.items.form.pricePlaceholder")}
                  min={0}
                  step={0.01}
                />
              </FormField>
              <FormField label={t("shopping.admin.items.form.buyBelowPrice")}>
                <Input
                  type="number"
                  value={"buyBelowPrice" in form ? (form.buyBelowPrice ?? "") : ""}
                  onChange={(e) =>
                    update({ buyBelowPrice: e.target.value ? Number(e.target.value) : null })
                  }
                  placeholder={t("shopping.admin.items.form.pricePlaceholder")}
                  min={0}
                  step={0.01}
                />
              </FormField>
              <FormField label={t("shopping.admin.items.form.overpayPrice")}>
                <Input
                  type="number"
                  value={"overpayPrice" in form ? (form.overpayPrice ?? "") : ""}
                  onChange={(e) =>
                    update({ overpayPrice: e.target.value ? Number(e.target.value) : null })
                  }
                  placeholder={t("shopping.admin.items.form.pricePlaceholder")}
                  min={0}
                  step={0.01}
                />
              </FormField>
            </>
          )}

          <FormField label={t("shopping.admin.items.form.note")} className="md:col-span-2">
            <Input
              value={form.note}
              onChange={(e) => update({ note: e.target.value })}
              placeholder={t("shopping.admin.items.form.notePlaceholder")}
            />
          </FormField>
        </div>
      </div>

      <DialogFooter className="flex items-center justify-between">
        {!editing.isNew ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-red-500 hover:bg-red-50 hover:text-red-700"
            onClick={() => void handleDelete()}
          >
            <Trash2 />
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("shopping.admin.items.cancel")}
          </Button>
          <Button
            onClick={() => void handleSave()}
            disabled={
              saving ||
              !form.name ||
              !form.system ||
              (!isOwned && !("laneId" in form && form.laneId))
            }
          >
            {t("shopping.admin.items.save")}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  )
}

function FormField({
  label,
  required,
  className,
  children,
}: {
  label: string
  required?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={cn("space-y-1.5", className)}>
      <span className="text-xs font-medium text-[color:var(--text-secondary)]">
        {label}
        {required ? <span className="ml-0.5 text-red-400">*</span> : null}
      </span>
      {children}
    </label>
  )
}
