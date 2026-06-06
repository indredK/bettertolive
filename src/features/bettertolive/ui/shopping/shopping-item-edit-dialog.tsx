import { Trash2 } from "lucide-react"
import { useState } from "react"
import type { TFunction } from "i18next"
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
import { MultiSelect } from "@/components/ui/multi-select"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
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
import { FormField } from "@/features/bettertolive/ui/shopping/shopping-page-shared"
import type { ShoppingPlanWithLane } from "@/features/bettertolive/ui/shopping/shopping-types"
import type {
  ShoppingDepreciation,
  ShoppingLifecycle,
  ShoppingSystem,
} from "@/features/bettertolive/types"
import { ShoppingOwnedStatus } from "@/features/bettertolive/types"
import {
  depreciationDisplayName,
  laneDisplayName,
  lifecycleDisplayName,
  normalizeOwnedStatusValue,
  ownedStatusDisplayName,
  SHOPPING_DEPRECIATION_OPTIONS,
  SHOPPING_LIFECYCLE_OPTIONS,
  SHOPPING_OWNED_STATUS_OPTIONS,
  systemDisplayName,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"

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

type FormState = {
  isNew: boolean
  itemType: "owned" | "plan"
  id?: string | null
  name: string
  system: string
  category: string
  spaces: string[]
  lifecycle: string
  depreciation?: string | null
  note: string
  // owned-only
  quantity: number
  status: ShoppingOwnedStatus
  replacementCue: string
  // plan-only
  laneId: string
  reason: string
  targetLifestyle: string
  currentPrice: number | null
  buyBelowPrice: number | null
  overpayPrice: number | null
  keywords: string[]
}

const ITEM_LIMITS = {
  name: 80,
  category: 80,
  spacesPerItem: 24,
  spacesCount: 8,
  quantity: 9999,
  replacementCue: 240,
  // 注:tags 限制已删除 — 物品的标签由 system/spaces/stages 在显示层渲染
  keywordsPerItem: 40,
  keywordsCount: 16,
  reason: 280,
  targetLifestyle: 160,
  price: 999999,
  note: 500,
} as const

function cleanFieldLabel(label: string) {
  return label.replace(/\s*\([^)]*\)$/, "")
}

function requiredMessage(t: TFunction, field: string) {
  return t("shopping.validation.required", { field })
}

function maxLengthMessage(t: TFunction, field: string, count: number) {
  return t("shopping.validation.maxLength", { field, count })
}

function maxItemsMessage(t: TFunction, field: string, count: number) {
  return t("shopping.validation.maxItems", { field, count })
}

function invalidOptionMessage(t: TFunction, field: string) {
  return t("shopping.validation.invalidOption", { field })
}

function nonNegativeMessage(t: TFunction, field: string) {
  return t("shopping.validation.nonNegative", { field })
}

function maxNumberMessage(t: TFunction, field: string, count: number) {
  return t("shopping.validation.maxNumber", { field, count })
}

function enumFieldSchema<T extends string>(options: readonly T[], t: TFunction, field: string) {
  return z
    .string()
    .min(1, requiredMessage(t, field))
    .refine((value): value is T => options.includes(value as T), {
      message: invalidOptionMessage(t, field),
    })
}

function arrayFieldSchema(t: TFunction, field: string, itemMaxLength: number, maxItems: number) {
  return z
    .array(
      z
        .string()
        .trim()
        .min(1)
        .max(itemMaxLength, maxLengthMessage(t, field, itemMaxLength)),
    )
    .max(maxItems, maxItemsMessage(t, field, maxItems))
}

function buildItemSchema(t: TFunction, systemOptions: string[]) {
  const fields = {
    laneId: cleanFieldLabel(t("shopping.admin.items.form.laneId")),
    name: cleanFieldLabel(t("shopping.admin.items.form.name")),
    system: cleanFieldLabel(t("shopping.admin.items.form.systemId")),
    category: cleanFieldLabel(t("shopping.admin.items.form.category")),
    spaces: cleanFieldLabel(t("shopping.admin.items.form.spaces")),
    lifecycle: cleanFieldLabel(t("shopping.admin.items.form.lifecycle")),
    status: cleanFieldLabel(t("shopping.admin.items.form.status")),
    replacementCue: cleanFieldLabel(t("shopping.admin.items.form.replacementCue")),
    keywords: cleanFieldLabel(t("shopping.admin.items.form.keywords")),
    reason: cleanFieldLabel(t("shopping.admin.items.form.reason")),
    targetLifestyle: cleanFieldLabel(t("shopping.admin.items.form.targetLifestyle")),
    currentPrice: cleanFieldLabel(t("shopping.admin.items.form.currentPrice")),
    buyBelowPrice: cleanFieldLabel(t("shopping.admin.items.form.buyBelowPrice")),
    overpayPrice: cleanFieldLabel(t("shopping.admin.items.form.overpayPrice")),
    note: cleanFieldLabel(t("shopping.admin.items.form.note")),
  }

  return z
    .object({
      laneId: z.string().trim().min(1, requiredMessage(t, fields.laneId)),
      name: z
        .string()
        .trim()
        .min(1, requiredMessage(t, fields.name))
        .max(ITEM_LIMITS.name, maxLengthMessage(t, fields.name, ITEM_LIMITS.name)),
      system: enumFieldSchema(systemOptions, t, fields.system),
      category: z
        .string()
        .trim()
        .min(1, requiredMessage(t, fields.category))
        .max(ITEM_LIMITS.category, maxLengthMessage(t, fields.category, ITEM_LIMITS.category)),
      spaces: arrayFieldSchema(
        t,
        fields.spaces,
        ITEM_LIMITS.spacesPerItem,
        ITEM_LIMITS.spacesCount,
      ),
      lifecycle: enumFieldSchema(SHOPPING_LIFECYCLE_OPTIONS, t, fields.lifecycle),
      depreciation: z
        .string()
        .nullable()
        .optional()
        .refine(
          (value) =>
            !value || SHOPPING_DEPRECIATION_OPTIONS.includes(value as ShoppingDepreciation),
          {
            message: invalidOptionMessage(
              t,
              cleanFieldLabel(t("shopping.admin.items.form.depreciation")),
            ),
          },
        ),
      quantity: z.number().int().min(0).max(ITEM_LIMITS.quantity),
      status: enumFieldSchema(SHOPPING_OWNED_STATUS_OPTIONS, t, fields.status),
      replacementCue: z
        .string()
        .trim()
        .min(1, requiredMessage(t, fields.replacementCue))
        .max(
          ITEM_LIMITS.replacementCue,
          maxLengthMessage(t, fields.replacementCue, ITEM_LIMITS.replacementCue),
        ),
      keywords: arrayFieldSchema(
        t,
        fields.keywords,
        ITEM_LIMITS.keywordsPerItem,
        ITEM_LIMITS.keywordsCount,
      ),
      reason: z
        .string()
        .trim()
        .min(1, requiredMessage(t, fields.reason))
        .max(ITEM_LIMITS.reason, maxLengthMessage(t, fields.reason, ITEM_LIMITS.reason)),
      targetLifestyle: z
        .string()
        .trim()
        .min(1, requiredMessage(t, fields.targetLifestyle))
        .max(
          ITEM_LIMITS.targetLifestyle,
          maxLengthMessage(t, fields.targetLifestyle, ITEM_LIMITS.targetLifestyle),
        ),
      currentPrice: z
        .number()
        .nullable()
        .refine((value) => value === null || value >= 0, {
          message: nonNegativeMessage(t, fields.currentPrice),
        })
        .refine((value) => value === null || value <= ITEM_LIMITS.price, {
          message: maxNumberMessage(t, fields.currentPrice, ITEM_LIMITS.price),
        }),
      buyBelowPrice: z
        .number()
        .nullable()
        .refine((value) => value === null || value >= 0, {
          message: nonNegativeMessage(t, fields.buyBelowPrice),
        })
        .refine((value) => value === null || value <= ITEM_LIMITS.price, {
          message: maxNumberMessage(t, fields.buyBelowPrice, ITEM_LIMITS.price),
        }),
      overpayPrice: z
        .number()
        .nullable()
        .refine((value) => value === null || value >= 0, {
          message: nonNegativeMessage(t, fields.overpayPrice),
        })
        .refine((value) => value === null || value <= ITEM_LIMITS.price, {
          message: maxNumberMessage(t, fields.overpayPrice, ITEM_LIMITS.price),
        }),
      note: z
        .string()
        .trim()
        .max(ITEM_LIMITS.note, maxLengthMessage(t, fields.note, ITEM_LIMITS.note)),
    })
    .refine(
      (value) =>
        value.buyBelowPrice === null ||
        value.overpayPrice === null ||
        value.buyBelowPrice <= value.overpayPrice,
      {
        message: t("shopping.validation.priceOrder"),
        path: ["buyBelowPrice"],
      },
    )
}

function buildOwnedForm(item: ShoppingOwnedItem, isNew: boolean): FormState {
  return {
    isNew,
    itemType: "owned",
    id: isNew ? undefined : item.id,
    name: item.name,
    system: item.system,
    category: item.category,
    spaces: [...item.spaces],
    lifecycle: item.lifecycle,
    depreciation: item.depreciation ?? null,
    note: item.note,
    quantity: item.quantity,
    status: normalizeOwnedStatusValue(item.status) as ShoppingOwnedStatus,
    replacementCue: item.replacementCue,
    laneId: "",
    reason: "",
    targetLifestyle: "",
    currentPrice: null,
    buyBelowPrice: null,
    overpayPrice: null,
    keywords: [],
  }
}

function buildPlanForm(item: ShoppingPlanWithLane, isNew: boolean): FormState {
  return {
    isNew,
    itemType: "plan",
    id: isNew ? undefined : item.id,
    name: item.name,
    system: item.system,
    category: item.category,
    spaces: [...item.spaces],
    lifecycle: item.lifecycle,
    depreciation: item.depreciation ?? null,
    note: item.note,
    quantity: 1,
    status: ShoppingOwnedStatus.StableUse,
    replacementCue: "",
    laneId: item.laneId,
    reason: item.reason,
    targetLifestyle: item.targetLifestyle,
    currentPrice: item.currentPrice ?? null,
    buyBelowPrice: item.buyBelowPrice ?? null,
    overpayPrice: item.overpayPrice ?? null,
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
  systemOptions,
  spaceOptions,
  onClose,
  onSaved,
}: {
  editing: EditingItem | null
  lanes: LaneOption[]
  systemOptions: string[]
  spaceOptions: string[]
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
        systemOptions={systemOptions}
        spaceOptions={spaceOptions}
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
  systemOptions,
  spaceOptions,
  onClose,
  onSaved,
}: {
  initialForm: FormState
  editing: EditingItem
  lanes: LaneOption[]
  systemOptions: string[]
  spaceOptions: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)
  const isOwned = form.itemType === "owned"

  const update = <T extends Partial<FormState>>(partial: T) => {
    setForm((prev) => ({ ...prev, ...partial }))
  }

  function handleTypeSwitch(nextType: "owned" | "plan") {
    if (form.itemType === nextType) return
    setForm((prev) => ({ ...prev, itemType: nextType }))
  }

  function toOwnedForm(
    id: string | undefined | null,
    formData: ShoppingOwnedItemForm,
  ): ShoppingOwnedItemForm {
    return id ? { ...formData, id } : formData
  }

  function toPlanForm(
    id: string | undefined | null,
    formData: ShoppingPlanItemForm,
  ): ShoppingPlanItemForm {
    return id ? { ...formData, id } : formData
  }

  async function handleSave() {
    try {
      setSaving(true)
      setError(null)

      const typeChanged = editing.type !== form.itemType
      const { id, ...formData } = form

      const parsed = buildItemSchema(t, systemOptions).safeParse(formData)
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? t("shopping.validation.invalidForm"))
        return
      }

      if (form.itemType === "owned") {
        const apiForm = toOwnedForm(typeChanged ? undefined : id, {
          ...(parsed.data as unknown as ShoppingOwnedItemForm),
          status: normalizeOwnedStatusValue(parsed.data.status) as ShoppingOwnedStatus,
        })

        if (typeChanged && editing.item.id && !editing.isNew) {
          // 类型变了:先删旧的(plan),再建新的(owned)
          if (editing.type === "plan") await deletePlanItem(editing.item.id)
          else await deleteOwnedItem(editing.item.id)
          await createOwnedItem(apiForm)
        } else if (id) {
          await updateOwnedItem(apiForm)
        } else {
          await createOwnedItem(apiForm)
        }
      } else {
        const apiForm = toPlanForm(typeChanged ? undefined : id, {
          ...(parsed.data as unknown as ShoppingPlanItemForm),
        })

        if (typeChanged && editing.item.id && !editing.isNew) {
          // 类型变了:先删旧的(owned),再建新的(plan)
          if (editing.type === "owned") await deleteOwnedItem(editing.item.id)
          else await deletePlanItem(editing.item.id)
          await createPlanItem(apiForm)
        } else if (id) {
          await updatePlanItem(apiForm)
        } else {
          await createPlanItem(apiForm)
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
      if (form.itemType === "owned") {
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
    <DialogContent className="flex max-h-[min(90vh,900px)] flex-col sm:max-w-3xl">
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

      <div className="min-h-0 overflow-y-auto pr-1">
        <div className="space-y-4">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          <div className="grid items-start gap-4 md:grid-cols-2">
            <FormField label={t("shopping.admin.items.form.name")} required>
              <Input
                value={form.name}
                onChange={(e) => update({ name: e.target.value })}
                placeholder={t("shopping.admin.items.form.namePlaceholder")}
                maxLength={ITEM_LIMITS.name}
              />
            </FormField>

            <FormField label={t("shopping.admin.items.form.itemType")} required>
              <Select
                value={form.itemType}
                onValueChange={(v) => {
                  if (v && v !== form.itemType) handleTypeSwitch(v)
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {form.itemType === "owned"
                      ? t("shopping.admin.items.itemType.owned")
                      : t("shopping.admin.items.itemType.plan")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owned">{t("shopping.admin.items.itemType.owned")}</SelectItem>
                  <SelectItem value="plan">{t("shopping.admin.items.itemType.plan")}</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            <FormField label={t("shopping.admin.items.form.laneId")} required>
              <Select value={form.laneId} onValueChange={(v) => update({ laneId: v ?? "" })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("shopping.admin.items.form.selectLane")}>
                    {form.laneId
                      ? laneDisplayName(
                          form.laneId,
                          lanes.find((l) => l.id === form.laneId)?.title ?? form.laneId,
                          t,
                        )
                      : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {lanes.map((lane) => (
                    <SelectItem key={lane.id} value={lane.id}>
                      {laneDisplayName(lane.id, lane.title, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label={t("shopping.admin.items.form.status")} required>
              <Select
                value={form.status}
                onValueChange={(value) => update({ status: value as ShoppingOwnedStatus })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("shopping.admin.items.form.statusPlaceholder")}>
                    {form.status ? ownedStatusDisplayName(form.status, t) : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SHOPPING_OWNED_STATUS_OPTIONS.map((status) => (
                    <SelectItem key={status} value={status}>
                      {ownedStatusDisplayName(status, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <FormField label={t("shopping.admin.items.form.systemId")} required>
                <Select
                  value={`${form.system}`}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, system: v as ShoppingSystem }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("shopping.admin.items.form.systemPlaceholder")}>
                      {form.system ? systemDisplayName(form.system, t) : null}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {systemOptions.map((s) => (
                      <SelectItem key={s} value={s}>
                        {systemDisplayName(s, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormField>
              <FormField
                label={t("shopping.admin.items.form.spaces")}
                description={t("shopping.admin.items.form.help.spaces")}
              >
                <MultiSelect
                  options={spaceOptions.map((s) => ({ value: s, label: s }))}
                  value={form.spaces}
                  onChange={(spaces) => update({ spaces })}
                  placeholder={t("shopping.admin.items.form.spacesPlaceholder")}
                  searchPlaceholder={t("shopping.stages.itemPicker.search")}
                  emptyMessage={t("shopping.stages.itemPicker.noItemsForSystem")}
                />
              </FormField>
            </div>
            <FormField label={t("shopping.admin.items.form.category")} required>
              <Input
                value={form.category}
                onChange={(e) => update({ category: e.target.value })}
                placeholder={t("shopping.admin.items.form.categoryPlaceholder")}
                maxLength={ITEM_LIMITS.category}
              />
            </FormField>
            {/* 注:necessity 字段已删除 — 物品的必要程度由阶段模板的档位(最低/基础/升级)承载 */}
            <FormField label={t("shopping.admin.items.form.lifecycle")} required>
              <Select
                value={`${form.lifecycle}`}
                onValueChange={(v) =>
                  setForm((prev) => ({ ...prev, lifecycle: v as ShoppingLifecycle }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("shopping.admin.items.form.lifecyclePlaceholder")}>
                    {form.lifecycle
                      ? lifecycleDisplayName(form.lifecycle as ShoppingLifecycle, t)
                      : null}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SHOPPING_LIFECYCLE_OPTIONS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {lifecycleDisplayName(l, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField label={t("shopping.admin.items.form.depreciation")}>
              <Select
                value={form.depreciation ?? "unset"}
                onValueChange={(v) =>
                  update({
                    depreciation: v && v !== "unset" ? (v as ShoppingDepreciation) : undefined,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("shopping.admin.items.form.depreciationPlaceholder")}>
                    {form.depreciation
                      ? depreciationDisplayName(form.depreciation as ShoppingDepreciation, t)
                      : "—"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unset">—</SelectItem>
                  {SHOPPING_DEPRECIATION_OPTIONS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {depreciationDisplayName(d, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <FormField
              label={t("shopping.admin.items.form.replacementCue")}
              required
              className="md:col-span-2"
            >
              <Textarea
                value={form.replacementCue}
                onChange={(e) => update({ replacementCue: e.target.value })}
                placeholder={t("shopping.admin.items.form.cuePlaceholder")}
                maxLength={ITEM_LIMITS.replacementCue}
                rows={3}
              />
            </FormField>

            <FormField
              label={t("shopping.admin.items.form.keywords")}
              description={t("shopping.admin.items.form.help.keywords")}
            >
              <Textarea
                value={form.keywords.join(", ")}
                onChange={(e) => update({ keywords: parseArray(e.target.value) })}
                placeholder={t("shopping.admin.items.form.keywordsPlaceholder")}
                maxLength={ITEM_LIMITS.keywordsPerItem * ITEM_LIMITS.keywordsCount}
                rows={3}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-4 md:col-span-2">
              <FormField label={t("shopping.admin.items.form.reason")} required>
                <Textarea
                  value={form.reason}
                  onChange={(e) => update({ reason: e.target.value })}
                  placeholder={t("shopping.admin.items.form.reasonPlaceholder")}
                  maxLength={ITEM_LIMITS.reason}
                  rows={3}
                />
              </FormField>
              <FormField label={t("shopping.admin.items.form.targetLifestyle")} required>
                <Textarea
                  value={form.targetLifestyle}
                  onChange={(e) => update({ targetLifestyle: e.target.value })}
                  placeholder={t("shopping.admin.items.form.lifestylePlaceholder")}
                  maxLength={ITEM_LIMITS.targetLifestyle}
                  rows={3}
                />
              </FormField>
            </div>

            <div className="grid grid-cols-3 gap-4 md:col-span-2">
              <FormField label={t("shopping.admin.items.form.currentPrice")}>
                <Input
                  type="number"
                  value={form.currentPrice ?? ""}
                  onChange={(e) =>
                    update({ currentPrice: e.target.value ? Number(e.target.value) : null })
                  }
                  placeholder={t("shopping.admin.items.form.pricePlaceholder")}
                  min={0}
                  max={ITEM_LIMITS.price}
                  step={0.01}
                />
              </FormField>
              <FormField label={t("shopping.admin.items.form.buyBelowPrice")}>
                <Input
                  type="number"
                  value={form.buyBelowPrice ?? ""}
                  onChange={(e) =>
                    update({ buyBelowPrice: e.target.value ? Number(e.target.value) : null })
                  }
                  placeholder={t("shopping.admin.items.form.pricePlaceholder")}
                  min={0}
                  max={ITEM_LIMITS.price}
                  step={0.01}
                />
              </FormField>
              <FormField label={t("shopping.admin.items.form.overpayPrice")}>
                <Input
                  type="number"
                  value={form.overpayPrice ?? ""}
                  onChange={(e) =>
                    update({ overpayPrice: e.target.value ? Number(e.target.value) : null })
                  }
                  placeholder={t("shopping.admin.items.form.pricePlaceholder")}
                  min={0}
                  max={ITEM_LIMITS.price}
                  step={0.01}
                />
              </FormField>
            </div>

            <FormField label={t("shopping.admin.items.form.note")} className="md:col-span-2">
              <Textarea
                value={form.note}
                onChange={(e) => update({ note: e.target.value })}
                placeholder={t("shopping.admin.items.form.notePlaceholder")}
                maxLength={ITEM_LIMITS.note}
                rows={4}
              />
            </FormField>
          </div>
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
            disabled={saving || !form.name || !form.system || !form.laneId}
          >
            {t("shopping.admin.items.save")}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  )
}
