import { Plus, Trash2 } from "lucide-react"
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
  itemsPerGroup: 12,
  itemLength: 60,
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
          minimum: z
            .array(
              z
                .string()
                .trim()
                .min(1)
                .max(
                  STAGE_LIMITS.itemLength,
                  maxLengthMessage(t, t("shopping.stages.table.minimum"), STAGE_LIMITS.itemLength),
                ),
            )
            .max(
              STAGE_LIMITS.itemsPerGroup,
              t("shopping.validation.maxItems", {
                field: t("shopping.stages.table.minimum"),
                count: STAGE_LIMITS.itemsPerGroup,
              }),
            ),
          essentials: z
            .array(
              z
                .string()
                .trim()
                .min(1)
                .max(
                  STAGE_LIMITS.itemLength,
                  maxLengthMessage(
                    t,
                    t("shopping.stages.table.essentials"),
                    STAGE_LIMITS.itemLength,
                  ),
                ),
            )
            .max(
              STAGE_LIMITS.itemsPerGroup,
              t("shopping.validation.maxItems", {
                field: t("shopping.stages.table.essentials"),
                count: STAGE_LIMITS.itemsPerGroup,
              }),
            ),
          upgrades: z
            .array(
              z
                .string()
                .trim()
                .min(1)
                .max(
                  STAGE_LIMITS.itemLength,
                  maxLengthMessage(t, t("shopping.stages.table.upgrades"), STAGE_LIMITS.itemLength),
                ),
            )
            .max(
              STAGE_LIMITS.itemsPerGroup,
              t("shopping.validation.maxItems", {
                field: t("shopping.stages.table.upgrades"),
                count: STAGE_LIMITS.itemsPerGroup,
              }),
            ),
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

          if (section.minimum.length + section.essentials.length + section.upgrades.length === 0) {
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
    minimum: [""],
    essentials: [],
    upgrades: [],
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
            minimum: section.minimum.length > 0 ? [...section.minimum] : [""],
            essentials: [...section.essentials],
            upgrades: [...section.upgrades],
          }))
        : [createEmptySection(systemOptions[0] ?? "")],
  }
}
export function ShoppingStageEditDialog({
  editing,
  systemOptions,
  onClose,
  onSaved,
}: {
  editing: { isNew: boolean; checklist: ShoppingStageChecklist | null } | null
  systemOptions: string[]
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
        onClose={onClose}
        onSaved={onSaved}
      />
    </Dialog>
  )
}

function StageDialogContent({
  initialForm,
  systemOptions,
  onClose,
  onSaved,
}: {
  initialForm: StageFormState
  systemOptions: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState<StageFormState>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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

  const addSectionItem = (
    sectionIndex: number,
    key: keyof Pick<ShoppingStageChecklistSection, "minimum" | "essentials" | "upgrades">,
  ) => {
    updateSection(sectionIndex, (section) => ({
      ...section,
      [key]:
        section[key].length >= STAGE_LIMITS.itemsPerGroup ? section[key] : [...section[key], ""],
    }))
  }

  const updateSectionItem = (
    sectionIndex: number,
    key: keyof Pick<ShoppingStageChecklistSection, "minimum" | "essentials" | "upgrades">,
    itemIndex: number,
    value: string,
  ) => {
    updateSection(sectionIndex, (section) => ({
      ...section,
      [key]: section[key].map((item, index) => (index === itemIndex ? value : item)),
    }))
  }

  const removeSectionItem = (
    sectionIndex: number,
    key: keyof Pick<ShoppingStageChecklistSection, "minimum" | "essentials" | "upgrades">,
    itemIndex: number,
  ) => {
    updateSection(sectionIndex, (section) => {
      const nextItems = section[key].filter((_, index) => index !== itemIndex)
      return {
        ...section,
        [key]: key === "minimum" && nextItems.length === 0 ? [""] : nextItems,
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
          sections: parsed.data.sections.map((section) => ({
            ...section,
            minimum: section.minimum.map((item) => item.trim()).filter(Boolean),
            essentials: section.essentials.map((item) => item.trim()).filter(Boolean),
            upgrades: section.upgrades.map((item) => item.trim()).filter(Boolean),
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
                {form.sections.map((section, sectionIndex) => (
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
                            updateSection(sectionIndex, (current) => ({
                              ...current,
                              system: value as ShoppingSystem,
                            }))
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

                    <div className="grid gap-4 md:grid-cols-3">
                      {(
                        [
                          ["minimum", t("shopping.stages.table.minimum")],
                          ["essentials", t("shopping.stages.table.essentials")],
                          ["upgrades", t("shopping.stages.table.upgrades")],
                        ] as const
                      ).map(([key, label]) => (
                        <div key={key} className="space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <div className="text-xs font-medium text-[color:var(--text-secondary)]">
                              {label}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => addSectionItem(sectionIndex, key)}
                              disabled={section[key].length >= STAGE_LIMITS.itemsPerGroup}
                            >
                              <Plus />
                              {t("shopping.stages.form.addItem")}
                            </Button>
                          </div>

                          <div className="space-y-2">
                            {section[key].map((item, itemIndex) => (
                              <div key={`${key}-${itemIndex}`} className="flex items-start gap-2">
                                <Input
                                  value={item}
                                  onChange={(e) =>
                                    updateSectionItem(sectionIndex, key, itemIndex, e.target.value)
                                  }
                                  maxLength={STAGE_LIMITS.itemLength}
                                  placeholder={t("shopping.stages.form.itemPlaceholder")}
                                />
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="text-[color:var(--text-muted)]"
                                  onClick={() => removeSectionItem(sectionIndex, key, itemIndex)}
                                >
                                  <Trash2 />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
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
