import { Plus, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
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
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type { ShoppingPageContentForm } from "@/features/bettertolive/api/bettertolive-api"
import {
  createPageContent,
  deletePageContent,
  updatePageContent,
} from "@/features/bettertolive/api/shopping-crud-api"
import type {
  ShoppingOwnedItem,
  ShoppingStageChecklist,
  ShoppingStageChecklistSection,
  ShoppingStage,
} from "@/features/bettertolive/types"
import type { ShoppingSystem } from "@/features/bettertolive/types"
import { FormField } from "@/features/bettertolive/ui/shopping/shopping-page-shared"
import {
  SHOPPING_STAGE_OPTIONS,
  stageDisplayName,
  systemDisplayName,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"
import type { ShoppingPlanWithLane } from "@/features/bettertolive/ui/shopping/shopping-types"
import { cn } from "@/lib/utils"

// 阶段编辑对话框现在需要全量物品池(按系统过滤后作为各档位 picker 的候选)— 见方案 §5
export type StageDialogAllItems = {
  owned: ShoppingOwnedItem[]
  plan: ShoppingPlanWithLane[]
}

type StageFormState = {
  isNew: boolean
  id?: string
  title: string
  stage: string
  description: string
  focus: string
  sections: ShoppingStageChecklistSection[]
}

const STAGE_LIMITS = {
  title: 80,
  description: 240,
  focus: 240,
  sections: 16,
  itemsPerGroup: 24,
  // 注:itemLength 已删除 — 各档位现在存物品 ID 不是手写文本
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

function invalidOptionMessage(t: TFunction, field: string) {
  return t("shopping.validation.invalidOption", { field })
}

function buildStageSchema(t: TFunction, systemOptions: string[]) {
  const fields = {
    title: cleanFieldLabel(t("shopping.stages.form.title")),
    stage: cleanFieldLabel(t("shopping.stages.form.stage")),
    description: cleanFieldLabel(t("shopping.stages.form.description")),
    focus: cleanFieldLabel(t("shopping.stages.form.focus")),
    sections: cleanFieldLabel(t("shopping.stages.form.sections")),
  }

  const itemIdsArraySchema = (label: string) =>
    z.array(z.string().trim().min(1)).max(
      STAGE_LIMITS.itemsPerGroup,
      t("shopping.validation.maxItems", {
        field: label,
        count: STAGE_LIMITS.itemsPerGroup,
      }),
    )

  return z.object({
    title: z
      .string()
      .trim()
      .min(1, requiredMessage(t, fields.title))
      .max(STAGE_LIMITS.title, maxLengthMessage(t, fields.title, STAGE_LIMITS.title)),
    stage: z
      .string()
      .min(1, requiredMessage(t, fields.stage))
      .refine(
        (value): value is ShoppingStage => SHOPPING_STAGE_OPTIONS.includes(value as ShoppingStage),
        { message: invalidOptionMessage(t, fields.stage) },
      ),
    description: z
      .string()
      .trim()
      .max(
        STAGE_LIMITS.description,
        maxLengthMessage(t, fields.description, STAGE_LIMITS.description),
      ),
    focus: z
      .string()
      .trim()
      .max(STAGE_LIMITS.focus, maxLengthMessage(t, fields.focus, STAGE_LIMITS.focus)),
    sections: z
      .array(
        z.object({
          system: z
            .string()
            .min(1, requiredMessage(t, cleanFieldLabel(t("shopping.stages.table.system"))))
            .refine((value): value is ShoppingSystem => systemOptions.includes(value), {
              message: invalidOptionMessage(t, cleanFieldLabel(t("shopping.stages.table.system"))),
            }),
          minimumItemIds: itemIdsArraySchema(t("shopping.stages.table.minimum")),
          essentialItemIds: itemIdsArraySchema(t("shopping.stages.table.essentials")),
          upgradeItemIds: itemIdsArraySchema(t("shopping.stages.table.upgrades")),
        }),
      )
      .min(1, requiredMessage(t, fields.sections))
      .max(
        STAGE_LIMITS.sections,
        t("shopping.validation.maxItems", { field: fields.sections, count: STAGE_LIMITS.sections }),
      )
      .superRefine((sections, ctx) => {
        const usedSystems = new Set<string>()
        sections.forEach((section, index) => {
          if (usedSystems.has(section.system)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [index, "system"],
              message: t("shopping.validation.duplicateSystem"),
            })
          }
          usedSystems.add(section.system)

          if (
            section.minimumItemIds.length +
              section.essentialItemIds.length +
              section.upgradeItemIds.length ===
            0
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              path: [index],
              message: t("shopping.validation.emptySection"),
            })
          }
        })
      }),
  })
}

function createEmptySection(preferredSystem = ""): ShoppingStageChecklistSection {
  return {
    system: preferredSystem,
    minimumItemIds: [],
    essentialItemIds: [],
    upgradeItemIds: [],
  }
}

function buildForm(
  checklist: ShoppingStageChecklist | null,
  systemOptions: string[],
): StageFormState {
  if (!checklist) {
    return {
      isNew: true,
      title: "",
      stage: "",
      description: "",
      focus: "",
      sections: [createEmptySection(systemOptions[0] ?? "")],
    }
  }
  return {
    isNew: false,
    id: checklist.id,
    title: checklist.title,
    stage: checklist.stage,
    description: checklist.description,
    focus: checklist.focus,
    sections:
      checklist.sections.length > 0
        ? checklist.sections.map((section) => ({
            system: section.system,
            // 字段缺失或老数据 → 默认为空数组
            minimumItemIds: [...(section.minimumItemIds ?? [])],
            essentialItemIds: [...(section.essentialItemIds ?? [])],
            upgradeItemIds: [...(section.upgradeItemIds ?? [])],
          }))
        : [createEmptySection(systemOptions[0] ?? "")],
  }
}

export function ShoppingStageEditDialog({
  editing,
  systemOptions,
  allItems,
  onClose,
  onSaved,
}: {
  editing: { isNew: boolean; checklist: ShoppingStageChecklist | null } | null
  systemOptions: string[]
  allItems: StageDialogAllItems
  onClose: () => void
  onSaved: () => void
}) {
  if (!editing) return null

  const initialForm = buildForm(editing.checklist, systemOptions)
  const dialogKey = editing.checklist?.id ?? "new-stage"

  return (
    <Dialog
      open
      key={dialogKey}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <StageDialogContent
        initialForm={initialForm}
        systemOptions={systemOptions}
        allItems={allItems}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Dialog>
  )
}

function StageDialogContent({
  initialForm,
  systemOptions,
  allItems,
  onClose,
  onSaved,
}: {
  initialForm: StageFormState
  systemOptions: string[]
  allItems: StageDialogAllItems
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState<StageFormState>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 把全量物品按系统聚合,方便每个 section 拿 picker 候选
  const itemsBySystem = useMemo(() => {
    const map = new Map<string, Array<{ id: string; name: string }>>()
    for (const item of allItems.owned) {
      const list = map.get(item.system) ?? []
      list.push({ id: item.id, name: item.name })
      map.set(item.system, list)
    }
    for (const item of allItems.plan) {
      const list = map.get(item.system) ?? []
      list.push({ id: item.id, name: item.name })
      map.set(item.system, list)
    }
    return map
  }, [allItems])

  const update = (partial: Partial<StageFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }))
  }

  const updateSection = (
    sectionIndex: number,
    updater: (section: ShoppingStageChecklistSection) => ShoppingStageChecklistSection,
  ) => {
    setForm((prev) => ({
      ...prev,
      sections: prev.sections.map((section, index) =>
        index === sectionIndex ? updater(section) : section,
      ),
    }))
  }

  const addSection = () => {
    const usedSystems = new Set(form.sections.map((section) => section.system))
    const nextSystem =
      systemOptions.find((system) => !usedSystems.has(system)) ?? systemOptions[0] ?? ""

    setForm((prev) => ({
      ...prev,
      sections:
        prev.sections.length >= STAGE_LIMITS.sections
          ? prev.sections
          : [...prev.sections, createEmptySection(nextSystem)],
    }))
  }

  const removeSection = (sectionIndex: number) => {
    setForm((prev) => ({
      ...prev,
      sections:
        prev.sections.length <= 1
          ? [createEmptySection(systemOptions[0] ?? "")]
          : prev.sections.filter((_, index) => index !== sectionIndex),
    }))
  }

  // 切换 section 的系统时,清空三档 ID 数组(旧系统的 ID 不再有效)
  const changeSectionSystem = (sectionIndex: number, nextSystem: string) => {
    updateSection(sectionIndex, (section) => {
      const hasAny =
        section.minimumItemIds.length +
          section.essentialItemIds.length +
          section.upgradeItemIds.length >
        0
      if (hasAny) {
        if (!window.confirm(t("shopping.stages.form.confirmSystemReset"))) {
          return section
        }
      }
      return {
        system: nextSystem,
        minimumItemIds: [],
        essentialItemIds: [],
        upgradeItemIds: [],
      }
    })
  }

  async function handleSave() {
    try {
      setSaving(true)
      setError(null)

      const parsed = buildStageSchema(t, systemOptions).safeParse(form)
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? t("shopping.validation.invalidForm"))
        return
      }

      const apiForm: ShoppingPageContentForm = {
        id: form.isNew ? undefined : form.id,
        contentType: "stage_checklist",
        title: parsed.data.title || null,
        stage: parsed.data.stage || null,
        system: null,
        summary: parsed.data.description || null,
        reason: parsed.data.focus || null,
        body: JSON.stringify({
          description: parsed.data.description,
          focus: parsed.data.focus,
          // 新 shape:各档位存物品 ID 数组
          sections: parsed.data.sections.map((section) => ({
            system: section.system,
            minimumItemIds: section.minimumItemIds,
            essentialItemIds: section.essentialItemIds,
            upgradeItemIds: section.upgradeItemIds,
          })),
        }),
      }

      if (form.isNew) {
        await createPageContent(apiForm)
      } else {
        await updatePageContent({ ...apiForm, id: form.id! })
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
    if (!form.id || form.isNew) return
    if (!window.confirm(t("shopping.stages.confirmDelete"))) return
    try {
      setError(null)
      await deletePageContent(form.id)
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
          {form.isNew
            ? t("shopping.stages.newTitle")
            : t("shopping.stages.editTitle", { title: form.title })}
        </DialogTitle>
        <DialogDescription>
          {form.isNew ? t("shopping.stages.newDescription") : t("shopping.stages.editDescription")}
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
            <FormField label={t("shopping.stages.form.title")} required>
              <Input
                value={form.title}
                onChange={(e) => update({ title: e.target.value })}
                placeholder={t("shopping.stages.form.titlePlaceholder")}
                maxLength={STAGE_LIMITS.title}
              />
            </FormField>

            <FormField label={t("shopping.stages.form.stage")} required>
              <Select
                value={form.stage || undefined}
                onValueChange={(value) => update({ stage: value ?? "" })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("shopping.stages.form.stagePlaceholder")}>
                    {form.stage ? stageDisplayName(form.stage as ShoppingStage, t) : undefined}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SHOPPING_STAGE_OPTIONS.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stageDisplayName(stage, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label={t("shopping.stages.form.description")} className="md:col-span-2">
              <Textarea
                value={form.description}
                onChange={(e) => update({ description: e.target.value })}
                placeholder={t("shopping.stages.form.descriptionPlaceholder")}
                maxLength={STAGE_LIMITS.description}
                rows={3}
              />
            </FormField>

            <FormField label={t("shopping.stages.form.focus")} className="md:col-span-2">
              <Textarea
                value={form.focus}
                onChange={(e) => update({ focus: e.target.value })}
                placeholder={t("shopping.stages.form.focusPlaceholder")}
                maxLength={STAGE_LIMITS.focus}
                rows={3}
              />
            </FormField>

            <div className="space-y-3 md:col-span-2">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-[color:var(--text-secondary)]">
                    {t("shopping.stages.form.sections")}
                  </div>
                  <div className="text-[11px] leading-5 text-[color:var(--text-muted)]">
                    {t("shopping.stages.form.sectionsHelp")}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addSection}
                  disabled={form.sections.length >= STAGE_LIMITS.sections}
                >
                  <Plus />
                  {t("shopping.stages.form.addSection")}
                </Button>
              </div>

              <div className="space-y-3">
                {form.sections.map((section, sectionIndex) => {
                  const candidatesForSystem = itemsBySystem.get(section.system) ?? []
                  return (
                    <div
                      key={`${section.system}-${sectionIndex}`}
                      className="rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-4"
                    >
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 text-xs font-medium text-[color:var(--text-secondary)]">
                            {t("shopping.stages.table.system")}
                          </div>
                          <Select
                            value={section.system}
                            onValueChange={(value) =>
                              changeSectionSystem(sectionIndex, value ?? "")
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue>{systemDisplayName(section.system, t)}</SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {systemOptions.map((system) => (
                                <SelectItem key={system} value={system}>
                                  {systemDisplayName(system, t)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="mt-5 text-red-500 hover:bg-red-50 hover:text-red-700"
                          onClick={() => removeSection(sectionIndex)}
                        >
                          <Trash2 />
                        </Button>
                      </div>

                      {/* 三档 picker:从该系统下的物品中多选 */}
                      <div className="grid gap-4 md:grid-cols-3">
                        {(
                          [
                            ["minimumItemIds", t("shopping.stages.table.minimum")],
                            ["essentialItemIds", t("shopping.stages.table.essentials")],
                            ["upgradeItemIds", t("shopping.stages.table.upgrades")],
                          ] as const
                        ).map(([key, label]) => (
                          <StageItemPickerColumn
                            key={key}
                            label={label}
                            candidates={candidatesForSystem}
                            value={section[key]}
                            onChange={(nextIds) =>
                              updateSection(sectionIndex, (current) => ({
                                ...current,
                                [key]: nextIds,
                              }))
                            }
                            noItemsHint={t("shopping.stages.itemPicker.noItemsForSystem")}
                          />
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <DialogFooter className="flex items-center justify-between">
        {!form.isNew ? (
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
            {t("shopping.stages.form.cancel")}
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving || !form.title || !form.stage}>
            {t("shopping.stages.form.save")}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  )
}

// 单档物品 picker — checkbox grid 样式,复用 StageMultiSelectField 的设计语言(见方案 §5)
function StageItemPickerColumn({
  label,
  candidates,
  value,
  onChange,
  noItemsHint,
}: {
  label: string
  candidates: Array<{ id: string; name: string }>
  value: string[]
  onChange: (nextIds: string[]) => void
  noItemsHint: string
}) {
  const valueSet = new Set(value)
  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-[color:var(--text-secondary)]">{label}</div>
      <div className="space-y-1">
        {candidates.length === 0 ? (
          <p className="text-[11px] leading-5 text-[color:var(--text-muted)]">{noItemsHint}</p>
        ) : (
          candidates.map((item) => {
            const checked = valueSet.has(item.id)
            return (
              <Label
                key={item.id}
                className={cn(
                  "flex min-h-9 cursor-pointer items-start rounded-md border px-2 py-1.5 text-[12px] leading-5 transition-colors",
                  checked
                    ? "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)]/35 text-[color:var(--text-primary)]"
                    : "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)] hover:bg-[color:var(--muted-surface-bg)]",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => {
                    if (event.target.checked) {
                      onChange([...value, item.id])
                    } else {
                      onChange(value.filter((id) => id !== item.id))
                    }
                  }}
                  className="mt-0.5 size-3.5 rounded border-[color:var(--surface-border)]"
                />
                <span className="ml-2 truncate">{item.name}</span>
              </Label>
            )
          })
        )}
      </div>
    </div>
  )
}
