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
import type {
  PrincipleCost,
  PrincipleDomain,
  PrincipleEntry,
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

    if (!form.title.trim() || !form.statement.trim() || !form.boundary.trim()) {
      toast.error(t("principles.edit.validation.required", "请填写标题、原则表达和边界"))
      return
    }

    const nextId = editing.principle?.id ?? createId("principle")
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
      toast.success(t("principles.edit.saved", "原则已保存"))
      onSaved?.()
    } catch {
      toast.error(t("principles.edit.saveFailed", "原则保存失败"))
    }
  }

  const handleDelete = async () => {
    const seed = editing.principle
    if (!seed) return

    if (!window.confirm(t("principles.edit.confirmDelete", "确定删除这条原则吗？"))) {
      return
    }

    try {
      const nextEntries = principlesModule.entries.filter((entry) => entry.id !== seed.id)

      await savePrinciplesMutation.mutateAsync({
        ...principlesModule,
        entries: nextEntries,
        boundaries: deriveBoundaryList(nextEntries),
        relations: principlesModule.relations.filter(
          (relation) => relation.fromId !== seed.id && relation.toId !== seed.id,
        ),
      })
      toast.success(t("principles.edit.deleted", "原则已删除"))
      onSaved?.()
    } catch {
      toast.error(t("principles.edit.deleteFailed", "原则删除失败"))
    }
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
            {editing.isNew
              ? t("principles.edit.createTitle", "新增原则")
              : t("principles.edit.editTitle", "编辑原则")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "principles.edit.description",
              "5 个分类维度用于组织决策体系，cost 只作为单条原则的代价评估。",
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
            <section className={PRINCIPLES_DIALOG_SECTION_CLASS}>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                <Field label={t("principles.edit.title", "标题")}>
                  <Input
                    value={form.title}
                    onChange={(event) => updateForm({ title: event.target.value })}
                    className={PRINCIPLES_DIALOG_FIELD_CLASS}
                    placeholder={t("principles.edit.titlePlaceholder", "例如：不在深夜做重要决定")}
                  />
                </Field>

                <Field label={t("principles.edit.cost", "代价")}>
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

              <Field label={t("principles.edit.statement", "原则表达")}>
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

              <Field label={t("principles.edit.descriptionLabel", "说明")}>
                <Textarea
                  value={form.description}
                  onChange={(event) => updateForm({ description: event.target.value })}
                  className={cn(PRINCIPLES_DIALOG_FIELD_CLASS, "min-h-24")}
                />
              </Field>
            </section>

            <section className={PRINCIPLES_DIALOG_SECTION_CLASS}>
              <div className="grid gap-4 md:grid-cols-5">
                <EnumField
                  label={t("principles.edit.domain", "领域")}
                  group="domain"
                  options={PRINCIPLE_DOMAINS}
                  value={form.domain}
                  onValueChange={(domain) => updateForm({ domain: domain as PrincipleDomain })}
                />
                <EnumField
                  label={t("principles.edit.type", "类型")}
                  group="type"
                  options={PRINCIPLE_TYPES}
                  value={form.type}
                  onValueChange={(type) => updateForm({ type: type as PrincipleType })}
                />
                <EnumField
                  label={t("principles.edit.strength", "强度")}
                  group="strength"
                  options={PRINCIPLE_STRENGTHS}
                  value={form.strength}
                  onValueChange={(strength) =>
                    updateForm({ strength: strength as PrincipleStrength })
                  }
                />
                <EnumField
                  label={t("principles.edit.source", "来源")}
                  group="source"
                  options={PRINCIPLE_SOURCES}
                  value={form.source}
                  onValueChange={(source) => updateForm({ source: source as PrincipleSource })}
                />
                <EnumField
                  label={t("principles.edit.status", "状态")}
                  group="status"
                  options={PRINCIPLE_STATUSES}
                  value={form.status}
                  onValueChange={(status) => updateForm({ status: status as PrincipleStatus })}
                />
              </div>
            </section>

            <section className={PRINCIPLES_DIALOG_SECTION_CLASS}>
              <div className="grid gap-4 lg:grid-cols-3">
                <Field label={t("principles.edit.boundary", "边界")}>
                  <Textarea
                    value={form.boundary}
                    onChange={(event) => updateForm({ boundary: event.target.value })}
                    className={cn(PRINCIPLES_DIALOG_FIELD_CLASS, "min-h-24")}
                  />
                </Field>
                <Field label={t("principles.edit.protectedValue", "保护对象")}>
                  <Textarea
                    value={form.protectedValue}
                    onChange={(event) => updateForm({ protectedValue: event.target.value })}
                    className={cn(PRINCIPLES_DIALOG_FIELD_CLASS, "min-h-24")}
                  />
                </Field>
                <Field label={t("principles.edit.decisionCue", "触发校准")}>
                  <Textarea
                    value={form.decisionCue}
                    onChange={(event) => updateForm({ decisionCue: event.target.value })}
                    className={cn(PRINCIPLES_DIALOG_FIELD_CLASS, "min-h-24")}
                  />
                </Field>
              </div>

              <Field label={t("principles.edit.tags", "标签")}>
                <Input
                  value={form.tagsText}
                  onChange={(event) => updateForm({ tagsText: event.target.value })}
                  className={PRINCIPLES_DIALOG_FIELD_CLASS}
                  placeholder={t("principles.edit.tagsPlaceholder", "用逗号分隔")}
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
                {t("principles.edit.delete", "删除")}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              {t("principles.edit.cancel", "取消")}
            </Button>
            <Button type="submit" disabled={savePrinciplesMutation.isPending}>
              {savePrinciplesMutation.isPending
                ? t("principles.edit.saving", "保存中")
                : t("principles.edit.save", "保存")}
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
  group: "domain" | "type" | "strength" | "source" | "status"
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
    domain: form.domain,
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
    id: createId("revision"),
    date: new Date().toISOString().slice(0, 10),
    summary: t("principles.edit.revision.summary", {
      defaultValue: "更新了{{fields}}。",
      fields: changedFields
        .map((field) => translatePrincipleEnum(t, "revisionField", field))
        .join(t("principles.edit.revision.separator", "、")),
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

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now().toString(36)}`
}
