import { generateId } from "@/lib/id-utils"
import { Trash2 } from "lucide-react"
import type { TFunction } from "i18next"
import type { FormEvent, ReactNode } from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

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
import { useSavePrinciplesMutation } from "@/features/bettertolive/queries/use-save-principles-mutation"
import { confirmUndoableDelete } from "@/features/bettertolive/ui/shopping/_shared/shopping-delete"
import type {
  PrincipleCost,
  PrincipleDomain,
  PrincipleEntry,
  PrinciplePerspective,
  PrincipleRevision,
  PrincipleSource,
  PrincipleStatus,
  PrincipleStrength,
  PrincipleType,
  PrinciplesModuleData,
} from "@/features/bettertolive/types"
import {
  PRINCIPLE_COSTS,
  PRINCIPLE_DOMAINS,
  PRINCIPLE_PERSPECTIVES,
  PRINCIPLE_SOURCES,
  PRINCIPLE_STATUSES,
  PRINCIPLE_STRENGTHS,
  PRINCIPLE_TYPES,
  PRINCIPLES_DIALOG_CONTENT_CLASS,
  PRINCIPLES_DIALOG_FIELD_CLASS,
  PRINCIPLES_DIALOG_FOOTER_CLASS,
  PRINCIPLES_DIALOG_HEADER_CLASS,
  PRINCIPLES_DIALOG_SECTION_CLASS,
  translatePrincipleEnum,
} from "@/features/bettertolive/ui/principles/principles-page-data"
import { cn } from "@/lib/utils"

export type EditingPrinciple = {
  isNew: boolean
  principle: PrincipleEntry | null
}

type PrincipleFormState = {
  title: string
  statement: string
  description: string
  perspective: PrinciplePerspective
  domain: PrincipleDomain
  type: PrincipleType
  strength: PrincipleStrength
  source: PrincipleSource
  status: PrincipleStatus
  cost: PrincipleCost
  boundary: string
  protectedValue: string
  decisionCue: string
  tagsText: string
}

function normalizeSelectValue(value: string | null) {
  return value ?? ""
}

export function PrincipleEditDialog({
  editing,
  principlesModule,
  onClose,
  onSaved,
}: {
  editing: EditingPrinciple
  principlesModule: PrinciplesModuleData
  onClose: () => void
  onSaved?: () => void
}) {
  const { t } = useTranslation()
  const savePrinciplesMutation = useSavePrinciplesMutation()
  const [form, setForm] = useState<PrincipleFormState>(() => createInitialForm(editing.principle))

  const updateForm = (patch: Partial<PrincipleFormState>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (
      !form.title.trim() ||
      !form.statement.trim() ||
      !form.domain.trim() ||
      !form.boundary.trim()
    ) {
      toast.error(t("principles.edit.validation.required"))
      return
    }

    const nextId = editing.principle?.id ?? generateId("principle")
    const nextEntry = createEntryFromForm({
      existingEntry: editing.principle,
      form,
      id: nextId,
      t,
    })
    const nextEntries = editing.isNew
      ? [...principlesModule.entries, nextEntry]
      : principlesModule.entries.map((entry) => (entry.id === nextId ? nextEntry : entry))

    try {
      await savePrinciplesMutation.mutateAsync({
        ...principlesModule,
        entries: nextEntries,
        boundaries: deriveBoundaryList(nextEntries),
      })
      toast.success(t("common.toast.saved"))
      onSaved?.()
    } catch {
      toast.error(t("common.toast.saveFailed"))
    }
  }

  const handleDelete = () => {
    const seed = editing.principle
    if (!seed) return

    confirmUndoableDelete({
      confirmMessage: t("common.confirm.deleteItem", { name: seed.title }),
      pendingMessage: t("common.toast.deletePending", { name: seed.title }),
      successMessage: t("common.toast.deleted"),
      failureMessage: t("common.toast.deleteFailed"),
      undoLabel: t("common.actions.undo"),
      undoneMessage: t("common.toast.deleteUndone", { name: seed.title }),
      onDelete: async () => {
        const nextEntries = principlesModule.entries.filter((entry) => entry.id !== seed.id)
        await savePrinciplesMutation.mutateAsync({
          ...principlesModule,
          entries: nextEntries,
          boundaries: deriveBoundaryList(nextEntries),
          relations: principlesModule.relations.filter(
            (relation) => relation.fromId !== seed.id && relation.toId !== seed.id,
          ),
        })
      },
      onDeleted: () => onSaved?.(),
    })
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent
        className={cn(
          PRINCIPLES_DIALOG_CONTENT_CLASS,
          "flex max-h-[min(760px,calc(100dvh-2rem))] max-w-5xl flex-col overflow-hidden",
        )}
      >
        <DialogHeader className={PRINCIPLES_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew ? t("principles.edit.createTitle") : t("principles.edit.editTitle")}
          </DialogTitle>
          <DialogDescription>{t("principles.edit.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
            <section className={PRINCIPLES_DIALOG_SECTION_CLASS}>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                <Field label={t("principles.edit.title")}>
                  <Input
                    value={form.title}
                    onChange={(event) => updateForm({ title: event.target.value })}
                    className={PRINCIPLES_DIALOG_FIELD_CLASS}
                    placeholder={t("principles.edit.titlePlaceholder")}
                  />
                </Field>

                <Field label={t("principles.edit.cost")}>
                  <Select
                    value={form.cost}
                    onValueChange={(cost) =>
                      updateForm({
                        cost: (normalizeSelectValue(cost) || form.cost) as PrincipleCost,
                      })
                    }
                  >
                    <SelectTrigger className={PRINCIPLES_DIALOG_FIELD_CLASS}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRINCIPLE_COSTS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {translatePrincipleEnum(t, "cost", option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label={t("principles.edit.statement")}>
                <Textarea
                  value={form.statement}
                  onChange={(event) => updateForm({ statement: event.target.value })}
                  className={cn(PRINCIPLES_DIALOG_FIELD_CLASS, "min-h-24")}
                  placeholder={t(
                    "principles.edit.statementPlaceholder",
                    "把这条原则写成可以指导行动的一句话。",
                  )}
                />
              </Field>

              <Field label={t("principles.edit.descriptionLabel")}>
                <Textarea
                  value={form.description}
                  onChange={(event) => updateForm({ description: event.target.value })}
                  className={cn(PRINCIPLES_DIALOG_FIELD_CLASS, "min-h-24")}
                />
              </Field>
            </section>

            <section className={PRINCIPLES_DIALOG_SECTION_CLASS}>
              <div className="grid gap-4 md:grid-cols-6">
                <EnumField
                  label={t("principles.edit.perspective")}
                  group="perspective"
                  options={PRINCIPLE_PERSPECTIVES}
                  value={form.perspective}
                  onValueChange={(perspective) =>
                    updateForm({ perspective: perspective as PrinciplePerspective })
                  }
                />
                <Field label={t("principles.edit.domain")}>
                  <Input
                    value={form.domain}
                    onChange={(event) => updateForm({ domain: event.target.value })}
                    className={PRINCIPLES_DIALOG_FIELD_CLASS}
                    list="principle-domain-suggestions"
                    placeholder={t(
                      "principles.edit.domainPlaceholder",
                      "例如：关系 / 工作 / 自定义类别",
                    )}
                  />
                  <datalist id="principle-domain-suggestions">
                    {PRINCIPLE_DOMAINS.map((domain) => (
                      <option key={domain} value={domain} />
                    ))}
                  </datalist>
                </Field>
                <EnumField
                  label={t("principles.edit.type")}
                  group="type"
                  options={PRINCIPLE_TYPES}
                  value={form.type}
                  onValueChange={(type) => updateForm({ type: type as PrincipleType })}
                />
                <EnumField
                  label={t("principles.edit.strength")}
                  group="strength"
                  options={PRINCIPLE_STRENGTHS}
                  value={form.strength}
                  onValueChange={(strength) =>
                    updateForm({ strength: strength as PrincipleStrength })
                  }
                />
                <EnumField
                  label={t("principles.edit.source")}
                  group="source"
                  options={PRINCIPLE_SOURCES}
                  value={form.source}
                  onValueChange={(source) => updateForm({ source: source as PrincipleSource })}
                />
                <EnumField
                  label={t("principles.edit.status")}
                  group="status"
                  options={PRINCIPLE_STATUSES}
                  value={form.status}
                  onValueChange={(status) => updateForm({ status: status as PrincipleStatus })}
                />
              </div>
            </section>

            <section className={PRINCIPLES_DIALOG_SECTION_CLASS}>
              <div className="grid gap-4 lg:grid-cols-3">
                <Field label={t("principles.edit.boundary")}>
                  <Textarea
                    value={form.boundary}
                    onChange={(event) => updateForm({ boundary: event.target.value })}
                    className={cn(PRINCIPLES_DIALOG_FIELD_CLASS, "min-h-24")}
                  />
                </Field>
                <Field label={t("principles.edit.protectedValue")}>
                  <Textarea
                    value={form.protectedValue}
                    onChange={(event) => updateForm({ protectedValue: event.target.value })}
                    className={cn(PRINCIPLES_DIALOG_FIELD_CLASS, "min-h-24")}
                  />
                </Field>
                <Field label={t("principles.edit.decisionCue")}>
                  <Textarea
                    value={form.decisionCue}
                    onChange={(event) => updateForm({ decisionCue: event.target.value })}
                    className={cn(PRINCIPLES_DIALOG_FIELD_CLASS, "min-h-24")}
                  />
                </Field>
              </div>

              <Field label={t("principles.edit.tags")}>
                <Input
                  value={form.tagsText}
                  onChange={(event) => updateForm({ tagsText: event.target.value })}
                  className={PRINCIPLES_DIALOG_FIELD_CLASS}
                  placeholder={t("common.form.tagsPlaceholder")}
                />
              </Field>
            </section>
          </div>

          <DialogFooter className={PRINCIPLES_DIALOG_FOOTER_CLASS}>
            {!editing.isNew && (
              <Button
                type="button"
                variant="outline"
                onClick={handleDelete}
                disabled={savePrinciplesMutation.isPending}
                className="mr-auto"
              >
                <Trash2 className="size-4" />
                {t("common.actions.delete")}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit" disabled={savePrinciplesMutation.isPending}>
              {savePrinciplesMutation.isPending
                ? t("common.actions.saving")
                : t("common.actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function EnumField({
  group,
  label,
  onValueChange,
  options,
  value,
}: {
  group: "perspective" | "domain" | "type" | "strength" | "source" | "status"
  label: string
  onValueChange: (value: string) => void
  options: string[]
  value: string
}) {
  const { t } = useTranslation()

  return (
    <Field label={label}>
      <Select value={value} onValueChange={(nextValue) => onValueChange(nextValue ?? value)}>
        <SelectTrigger className={PRINCIPLES_DIALOG_FIELD_CLASS}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {translatePrincipleEnum(t, group, option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function createInitialForm(principle: PrincipleEntry | null): PrincipleFormState {
  return {
    title: principle?.title ?? "",
    statement: principle?.statement ?? "",
    description: principle?.description ?? "",
    perspective: principle?.perspective ?? inferPrinciplePerspective(principle),
    domain: principle?.domain ?? "关系",
    type: principle?.type ?? "边界",
    strength: principle?.strength ?? "强烈偏好",
    source: principle?.source ?? "主动推导",
    status: principle?.status ?? "正在测试",
    cost: principle?.cost ?? "中等代价",
    boundary: principle?.boundary ?? "",
    protectedValue: principle?.protectedValue ?? "",
    decisionCue: principle?.decisionCue ?? "",
    tagsText: principle?.tags.join("，") ?? "",
  }
}

function createEntryFromForm({
  existingEntry,
  form,
  id,
  t,
}: {
  existingEntry: PrincipleEntry | null
  form: PrincipleFormState
  id: string
  t: TFunction
}): PrincipleEntry {
  const nextBase = {
    id,
    title: form.title.trim(),
    statement: form.statement.trim(),
    description: form.description.trim(),
    perspective: form.perspective,
    domain: form.domain.trim(),
    type: form.type,
    strength: form.strength,
    source: form.source,
    status: form.status,
    cost: form.cost,
    boundary: form.boundary.trim(),
    protectedValue: form.protectedValue.trim(),
    decisionCue: form.decisionCue.trim(),
    tags: normalizeList(form.tagsText),
  }
  const revision = existingEntry ? createRevision(existingEntry, nextBase, t) : null

  return {
    ...nextBase,
    revisionHistory: revision
      ? [revision, ...(existingEntry?.revisionHistory ?? [])]
      : (existingEntry?.revisionHistory ?? []),
  }
}

function inferPrinciplePerspective(principle: PrincipleEntry | null): PrinciplePerspective {
  if (principle?.perspective) {
    return principle.perspective
  }

  if (principle?.source === "观察他人" || principle?.source === "家庭继承") {
    return "他人原则"
  }

  return "个人原则"
}

function createRevision(
  previous: PrincipleEntry,
  next: Omit<PrincipleEntry, "revisionHistory">,
  t: TFunction,
): PrincipleRevision | null {
  const changedFields: PrincipleRevision["changedFields"] = []

  if (
    previous.title !== next.title ||
    previous.statement !== next.statement ||
    previous.description !== next.description ||
    previous.boundary !== next.boundary ||
    previous.protectedValue !== next.protectedValue ||
    previous.decisionCue !== next.decisionCue
  ) {
    changedFields.push("内容")
  }
  if (previous.strength !== next.strength) {
    changedFields.push("强度")
  }
  if (previous.status !== next.status) {
    changedFields.push("状态")
  }
  if (changedFields.length === 0) {
    return null
  }

  return {
    id: generateId("revision"),
    date: new Date().toISOString().slice(0, 10),
    summary: t("principles.edit.revision.summary", {
      fields: changedFields
        .map((field) => translatePrincipleEnum(t, "revisionField", field))
        .join(t("principles.edit.revision.separator")),
    }),
    changedFields,
  }
}

function deriveBoundaryList(entries: PrincipleEntry[]) {
  const boundaries: string[] = []

  entries.forEach((entry) => {
    const boundary = entry.boundary.trim()

    if (
      (entry.type !== "边界" && entry.type !== "底线") ||
      entry.status === "已放弃" ||
      !boundary
    ) {
      return
    }

    if (!boundaries.includes(boundary)) {
      boundaries.push(boundary)
    }
  })

  return boundaries
}

function normalizeList(value: string) {
  const normalized: string[] = []

  value
    .split(/[，,]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .forEach((entry) => {
      if (!normalized.includes(entry)) {
        normalized.push(entry)
      }
    })

  return normalized
}
