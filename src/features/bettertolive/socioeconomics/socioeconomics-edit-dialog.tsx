import { Trash2 } from "lucide-react"
import { type FormEvent, type ReactNode, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"

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
import { useSaveSocioeconomicsMutation } from "@/features/bettertolive/socioeconomics/queries"
import { confirmUndoableDelete } from "@/features/bettertolive/shared/shopping-delete"
import type {
  EconConfidence,
  EconConfidenceRevision,
  EconDomain,
  EconLayer,
  EconRelevance,
  EconSource,
  EconTopicArea,
  SocioeconomicsDiscipline,
  SocioeconomicsSourceRef,
  SocioeconomicsEntry,
  SocioeconomicsGap,
  SocioeconomicsModuleData,
} from "@/features/bettertolive/types"
import {
  ECON_CONFIDENCES,
  ECON_DOMAINS,
  ECON_LAYERS,
  ECON_RELEVANCES,
  ECON_SOURCES,
  ECON_TOPIC_AREAS,
  SOCIO_DISCIPLINES,
} from "@/features/bettertolive/socioeconomics/socioeconomics-page-data"
import { generateId } from "@/lib/id-utils"
import { joinListText, splitListText } from "@/lib/list-utils"
import {
  SOCIO_DIALOG_CONTENT_CLASS,
  SOCIO_DIALOG_FIELD_CLASS,
  SOCIO_DIALOG_FOOTER_CLASS,
  SOCIO_DIALOG_HEADER_CLASS,
  SOCIO_DIALOG_SECTION_CLASS,
} from "@/features/bettertolive/socioeconomics/socioeconomics-page-shared"
import { translateSocioeconomicsEnum } from "@/features/bettertolive/socioeconomics/socioeconomics-i18n"
import { cn } from "@/lib/utils"

export type EditingSocioeconomicsEntry = {
  isNew: boolean
  entry: SocioeconomicsEntry | null
}

export type EditingSocioeconomicsGap = {
  isNew: boolean
  gap: SocioeconomicsGap | null
}

export type EditingSocioeconomicsPrompt = {
  isNew: boolean
  index: number | null
  prompt: string
}

type EntryFormState = {
  title: string
  discipline: SocioeconomicsDiscipline
  topicArea: EconTopicArea
  domain: EconDomain
  layer: EconLayer
  confidence: EconConfidence
  source: EconSource
  relevance: EconRelevance
  summary: string
  understandingNote: string
  relatedConceptsText: string
  sourceRefsText: string
  tagsText: string
  confidenceHistoryText: string
}

type GapFormState = {
  domain: EconDomain
  summary: string
  nextStep: string
}

const SOCIOLOGY_DOMAINS = new Set<EconDomain>([
  "社会结构",
  "社会流动",
  "制度与组织",
  "城市与社区",
  "文化与规范",
])

const SOCIOLOGY_TAG_KEYWORDS = ["社会", "群体", "社区", "阶层", "规范", "制度", "文化", "城市"]

function inferEntryDiscipline(entry: SocioeconomicsEntry | null): SocioeconomicsDiscipline {
  if (!entry) return "经济学"
  if (entry.discipline) return entry.discipline

  if (
    SOCIOLOGY_DOMAINS.has(entry.domain) ||
    entry.tags?.some((tag) => SOCIOLOGY_TAG_KEYWORDS.some((keyword) => tag.includes(keyword)))
  ) {
    return "社会学"
  }

  return "经济学"
}

function inferEntryTopicArea(entry: SocioeconomicsEntry | null): EconTopicArea {
  if (!entry) return ECON_TOPIC_AREAS[0]
  if (entry.topicArea) return entry.topicArea
  if (inferEntryDiscipline(entry) === "社会学") return ECON_TOPIC_AREAS[0]

  if (entry.tags?.some((tag) => tag.includes("经济学家") || tag.includes("人物"))) {
    return "著名经济学家"
  }

  if (entry.tags?.some((tag) => tag.includes("模型") || tag.includes("原理"))) {
    return "经济原理与模型"
  }

  if (entry.domain === "财政与政策") {
    return "经济政策"
  }

  if (entry.layer === "微观") {
    return "微观经济学"
  }

  if (entry.layer === "宏观") {
    return "宏观经济学"
  }

  return "经济学基础概念"
}

function createInitialEntryForm(entry: SocioeconomicsEntry | null): EntryFormState {
  return {
    title: entry?.title ?? "",
    discipline: inferEntryDiscipline(entry),
    topicArea: inferEntryTopicArea(entry),
    domain: entry?.domain ?? ECON_DOMAINS[0],
    layer: entry?.layer ?? ECON_LAYERS[0],
    confidence: entry?.confidence ?? ECON_CONFIDENCES[0],
    source: entry?.source ?? ECON_SOURCES[0],
    relevance: entry?.relevance ?? ECON_RELEVANCES[0],
    summary: entry?.summary ?? "",
    understandingNote: entry?.understandingNote ?? "",
    relatedConceptsText: joinListText(entry?.relatedConcepts),
    sourceRefsText: formatSourceRefs(entry?.sourceRefs),
    tagsText: joinListText(entry?.tags),
    confidenceHistoryText: formatConfidenceHistory(entry?.confidenceHistory),
  }
}

function createInitialGapForm(gap: SocioeconomicsGap | null): GapFormState {
  return {
    domain: gap?.domain ?? ECON_DOMAINS[0],
    summary: gap?.summary ?? "",
    nextStep: gap?.nextStep ?? "",
  }
}

function formatSourceRefs(sourceRefs?: SocioeconomicsSourceRef[]) {
  return (sourceRefs ?? []).map((item) => `${item.label} | ${item.url}`).join("\n")
}

function parseSourceRefs(text: string): SocioeconomicsSourceRef[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [label = "", url = ""] = line.split("|").map((part) => part.trim())

      if (!label || !/^https?:\/\//.test(url)) {
        throw new Error("invalid-source-ref")
      }

      return {
        id: generateId(`socio-source-${index + 1}`),
        label,
        url,
      }
    })
}

function formatConfidenceHistory(history?: EconConfidenceRevision[]) {
  return (history ?? [])
    .map((item) => `${item.date} | ${item.from} -> ${item.to} | ${item.trigger}`)
    .join("\n")
}

function parseConfidenceHistory(text: string): EconConfidenceRevision[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const [date = "", transition = "", trigger = ""] = line.split("|").map((part) => part.trim())
      const [from = "", to = ""] = transition.split(/->|→/).map((part) => part.trim())

      if (
        !date ||
        !trigger ||
        !ECON_CONFIDENCES.includes(from as EconConfidence) ||
        !ECON_CONFIDENCES.includes(to as EconConfidence)
      ) {
        throw new Error("invalid-history-line")
      }

      return {
        id: generateId(`socio-history-${index + 1}`),
        date,
        from: from as EconConfidence,
        to: to as EconConfidence,
        trigger,
      }
    })
}

export function SocioeconomicsEntryEditDialog({
  editing,
  socioeconomics,
  onClose,
}: {
  editing: EditingSocioeconomicsEntry
  socioeconomics: SocioeconomicsModuleData
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveSocioeconomicsMutation = useSaveSocioeconomicsMutation()
  const [form, setForm] = useState<EntryFormState>(() => createInitialEntryForm(editing.entry))

  const updateForm = (patch: Partial<EntryFormState>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!form.title.trim() || !form.summary.trim()) {
      toast.error(t("socioeconomics.edit.validation.entryRequired"))
      return
    }

    let confidenceHistory: EconConfidenceRevision[]
    let sourceRefs: SocioeconomicsSourceRef[]

    try {
      confidenceHistory = parseConfidenceHistory(form.confidenceHistoryText)
    } catch {
      toast.error(t("socioeconomics.edit.validation.history"))
      return
    }

    try {
      sourceRefs = parseSourceRefs(form.sourceRefsText)
    } catch {
      toast.error(t("socioeconomics.edit.validation.sourceRefs"))
      return
    }

    const nextEntry: SocioeconomicsEntry = {
      id: editing.entry?.id ?? generateId("socio-knowledge"),
      title: form.title.trim(),
      discipline: form.discipline,
      topicArea: form.discipline === "经济学" ? form.topicArea : undefined,
      domain: form.domain,
      layer: form.layer,
      confidence: form.confidence,
      source: form.source,
      relevance: form.relevance,
      summary: form.summary.trim(),
      understandingNote: form.understandingNote.trim() || undefined,
      relatedConcepts: splitListText(form.relatedConceptsText),
      sourceRefs,
      confidenceHistory,
      tags: splitListText(form.tagsText),
    }
    const nextEntries = editing.isNew
      ? [nextEntry, ...socioeconomics.entries]
      : socioeconomics.entries.map((entry) => (entry.id === nextEntry.id ? nextEntry : entry))

    try {
      await saveSocioeconomicsMutation.mutateAsync({
        ...socioeconomics,
        entries: nextEntries,
      })
      toast.success(t("common.toast.saved"))
      onClose()
    } catch {
      toast.error(t("common.toast.saveFailed"))
    }
  }

  const handleDelete = () => {
    if (!editing.entry) return

    confirmUndoableDelete({
      confirmMessage: t("common.confirm.deleteItem", {
        name: editing.entry.title,
      }),
      pendingMessage: t("common.toast.deletePending", { name: editing.entry.title }),
      successMessage: t("common.toast.deleted"),
      failureMessage: t("common.toast.deleteFailed"),
      undoLabel: t("common.actions.undo"),
      undoneMessage: t("common.toast.deleteUndone", { name: editing.entry.title }),
      onDelete: () =>
        saveSocioeconomicsMutation.mutateAsync({
          ...socioeconomics,
          entries: socioeconomics.entries.filter((entry) => entry.id !== editing.entry?.id),
        }),
      onDeleted: () => onClose(),
    })
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent
        className={cn(
          SOCIO_DIALOG_CONTENT_CLASS,
          "flex max-h-[min(760px,calc(100dvh-2rem))] max-w-5xl flex-col overflow-hidden",
        )}
      >
        <DialogHeader className={SOCIO_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew
              ? t("socioeconomics.edit.entryCreateTitle")
              : t("socioeconomics.edit.entryEditTitle")}
          </DialogTitle>
          <DialogDescription>{t("socioeconomics.edit.entryDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
            <section className={SOCIO_DIALOG_SECTION_CLASS}>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label={t("socioeconomics.fields.title")}>
                  <Input
                    value={form.title}
                    onChange={(event) => updateForm({ title: event.target.value })}
                    className={SOCIO_DIALOG_FIELD_CLASS}
                  />
                </Field>

                <Field label={t("socioeconomics.fields.domain")}>
                  <EnumSelect
                    group="domain"
                    value={form.domain}
                    options={ECON_DOMAINS}
                    onValueChange={(domain) => updateForm({ domain })}
                  />
                </Field>

                <Field label={t("socioeconomics.fields.discipline")}>
                  <EnumSelect
                    group="discipline"
                    value={form.discipline}
                    options={SOCIO_DISCIPLINES}
                    onValueChange={(discipline) => updateForm({ discipline })}
                  />
                </Field>

                {form.discipline === "经济学" ? (
                  <Field label={t("socioeconomics.fields.topicArea")}>
                    <EnumSelect
                      group="topicArea"
                      value={form.topicArea}
                      options={ECON_TOPIC_AREAS}
                      onValueChange={(topicArea) => updateForm({ topicArea })}
                    />
                  </Field>
                ) : null}

                <Field label={t("socioeconomics.fields.layer")}>
                  <EnumSelect
                    group="layer"
                    value={form.layer}
                    options={ECON_LAYERS}
                    onValueChange={(layer) => updateForm({ layer })}
                  />
                </Field>

                <Field label={t("socioeconomics.fields.confidence")}>
                  <EnumSelect
                    group="confidence"
                    value={form.confidence}
                    options={ECON_CONFIDENCES}
                    onValueChange={(confidence) => updateForm({ confidence })}
                  />
                </Field>

                <Field label={t("socioeconomics.fields.source")}>
                  <EnumSelect
                    group="source"
                    value={form.source}
                    options={ECON_SOURCES}
                    onValueChange={(source) => updateForm({ source })}
                  />
                </Field>

                <Field label={t("socioeconomics.fields.relevance")}>
                  <EnumSelect
                    group="relevance"
                    value={form.relevance}
                    options={ECON_RELEVANCES}
                    onValueChange={(relevance) => updateForm({ relevance })}
                  />
                </Field>
              </div>
            </section>

            <section className={SOCIO_DIALOG_SECTION_CLASS}>
              <Field label={t("socioeconomics.fields.summary")}>
                <Textarea
                  value={form.summary}
                  onChange={(event) => updateForm({ summary: event.target.value })}
                  className={SOCIO_DIALOG_FIELD_CLASS}
                  rows={3}
                />
              </Field>

              <Field label={t("socioeconomics.fields.understandingNote")}>
                <Textarea
                  value={form.understandingNote}
                  onChange={(event) => updateForm({ understandingNote: event.target.value })}
                  className={SOCIO_DIALOG_FIELD_CLASS}
                  rows={3}
                />
              </Field>

              <div className="grid gap-4 lg:grid-cols-2">
                <Field label={t("socioeconomics.fields.relatedConcepts")}>
                  <Input
                    value={form.relatedConceptsText}
                    onChange={(event) => updateForm({ relatedConceptsText: event.target.value })}
                    className={SOCIO_DIALOG_FIELD_CLASS}
                  />
                </Field>

                <Field label={t("socioeconomics.fields.sourceRefs")}>
                  <Textarea
                    value={form.sourceRefsText}
                    onChange={(event) => updateForm({ sourceRefsText: event.target.value })}
                    className={SOCIO_DIALOG_FIELD_CLASS}
                    placeholder={t("socioeconomics.edit.sourceRefsPlaceholder")}
                    rows={3}
                  />
                </Field>

                <Field label={t("socioeconomics.fields.tags")}>
                  <Input
                    value={form.tagsText}
                    onChange={(event) => updateForm({ tagsText: event.target.value })}
                    className={SOCIO_DIALOG_FIELD_CLASS}
                  />
                </Field>
              </div>

              <Field label={t("socioeconomics.fields.confidenceHistory")}>
                <Textarea
                  value={form.confidenceHistoryText}
                  onChange={(event) => updateForm({ confidenceHistoryText: event.target.value })}
                  className={SOCIO_DIALOG_FIELD_CLASS}
                  placeholder={t("socioeconomics.edit.historyPlaceholder")}
                  rows={4}
                />
              </Field>
            </section>
          </div>

          <DialogFooter className={SOCIO_DIALOG_FOOTER_CLASS}>
            {!editing.isNew ? (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                <Trash2 className="size-4" />
                {t("common.actions.delete")}
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit" disabled={saveSocioeconomicsMutation.isPending}>
              {t("common.actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function SocioeconomicsGapEditDialog({
  editing,
  socioeconomics,
  onClose,
}: {
  editing: EditingSocioeconomicsGap
  socioeconomics: SocioeconomicsModuleData
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveSocioeconomicsMutation = useSaveSocioeconomicsMutation()
  const [form, setForm] = useState<GapFormState>(() => createInitialGapForm(editing.gap))

  const updateForm = (patch: Partial<GapFormState>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!form.summary.trim() || !form.nextStep.trim()) {
      toast.error(t("socioeconomics.edit.validation.gapRequired"))
      return
    }

    const nextGap: SocioeconomicsGap = {
      id: editing.gap?.id ?? generateId("socio-gap"),
      domain: form.domain,
      summary: form.summary.trim(),
      nextStep: form.nextStep.trim(),
    }
    const nextGaps = editing.isNew
      ? [nextGap, ...socioeconomics.gaps]
      : socioeconomics.gaps.map((gap) => (gap.id === nextGap.id ? nextGap : gap))

    try {
      await saveSocioeconomicsMutation.mutateAsync({
        ...socioeconomics,
        gaps: nextGaps,
      })
      toast.success(t("common.toast.saved"))
      onClose()
    } catch {
      toast.error(t("common.toast.saveFailed"))
    }
  }

  const handleDelete = () => {
    if (!editing.gap) return

    confirmUndoableDelete({
      confirmMessage: t("socioeconomics.confirm.deleteGap"),
      pendingMessage: t("common.toast.deletePending", { name: editing.gap.summary }),
      successMessage: t("common.toast.deleted"),
      failureMessage: t("common.toast.deleteFailed"),
      undoLabel: t("common.actions.undo"),
      undoneMessage: t("common.toast.deleteUndone", { name: editing.gap.summary }),
      onDelete: () =>
        saveSocioeconomicsMutation.mutateAsync({
          ...socioeconomics,
          gaps: socioeconomics.gaps.filter((gap) => gap.id !== editing.gap?.id),
        }),
      onDeleted: () => onClose(),
    })
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent
        className={cn(
          SOCIO_DIALOG_CONTENT_CLASS,
          "flex max-h-[min(620px,calc(100dvh-2rem))] max-w-2xl flex-col overflow-hidden",
        )}
      >
        <DialogHeader className={SOCIO_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew
              ? t("socioeconomics.edit.gapCreateTitle")
              : t("socioeconomics.edit.gapEditTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
            <section className={SOCIO_DIALOG_SECTION_CLASS}>
              <Field label={t("socioeconomics.fields.domain")}>
                <EnumSelect
                  group="domain"
                  value={form.domain}
                  options={ECON_DOMAINS}
                  onValueChange={(domain) => updateForm({ domain })}
                />
              </Field>

              <Field label={t("socioeconomics.fields.gapSummary")}>
                <Textarea
                  value={form.summary}
                  onChange={(event) => updateForm({ summary: event.target.value })}
                  className={SOCIO_DIALOG_FIELD_CLASS}
                  rows={4}
                />
              </Field>

              <Field label={t("socioeconomics.fields.nextStep")}>
                <Textarea
                  value={form.nextStep}
                  onChange={(event) => updateForm({ nextStep: event.target.value })}
                  className={SOCIO_DIALOG_FIELD_CLASS}
                  rows={4}
                />
              </Field>
            </section>
          </div>

          <DialogFooter className={SOCIO_DIALOG_FOOTER_CLASS}>
            {!editing.isNew ? (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                <Trash2 className="size-4" />
                {t("common.actions.delete")}
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit" disabled={saveSocioeconomicsMutation.isPending}>
              {t("common.actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

const promptFormSchema = z.object({
  prompt: z.string().min(1),
})

type PromptFormValues = z.infer<typeof promptFormSchema>

export function SocioeconomicsPromptEditDialog({
  editing,
  socioeconomics,
  onClose,
}: {
  editing: EditingSocioeconomicsPrompt
  socioeconomics: SocioeconomicsModuleData
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveSocioeconomicsMutation = useSaveSocioeconomicsMutation()
  const form = useForm<PromptFormValues>({
    resolver: zodResolver(promptFormSchema),
    defaultValues: { prompt: editing.prompt },
  })

  const handleFormSubmit = form.handleSubmit(async (values) => {
    const nextPrompts = editing.isNew
      ? [values.prompt.trim(), ...socioeconomics.reviewPrompts]
      : socioeconomics.reviewPrompts.map((item, index) =>
          index === editing.index ? values.prompt.trim() : item,
        )

    await saveSocioeconomicsMutation.mutateAsync({
      ...socioeconomics,
      reviewPrompts: nextPrompts,
    })
    toast.success(t("common.toast.saved"))
    onClose()
  })

  const canSubmit = form.formState.isValid

  const handleDelete = () => {
    if (editing.index === null) return

    confirmUndoableDelete({
      confirmMessage: t("socioeconomics.confirm.deletePrompt"),
      pendingMessage: t("common.toast.deletePending", { name: "" }),
      successMessage: t("common.toast.deleted"),
      failureMessage: t("common.toast.deleteFailed"),
      undoLabel: t("common.actions.undo"),
      undoneMessage: t("common.toast.deleteUndone", { name: "" }),
      onDelete: () =>
        saveSocioeconomicsMutation.mutateAsync({
          ...socioeconomics,
          reviewPrompts: socioeconomics.reviewPrompts.filter((_, index) => index !== editing.index),
        }),
      onDeleted: () => onClose(),
    })
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent
        className={cn(
          SOCIO_DIALOG_CONTENT_CLASS,
          "flex max-h-[min(480px,calc(100dvh-2rem))] max-w-xl flex-col overflow-hidden",
        )}
      >
        <DialogHeader className={SOCIO_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew
              ? t("socioeconomics.edit.promptCreateTitle")
              : t("socioeconomics.edit.promptEditTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-1 py-1 pr-2">
            <section className={SOCIO_DIALOG_SECTION_CLASS}>
              <Field label={t("socioeconomics.fields.prompt")}>
                <Controller
                  control={form.control}
                  name="prompt"
                  render={({ field }) => (
                    <Textarea
                      value={field.value}
                      onChange={field.onChange}
                      className={SOCIO_DIALOG_FIELD_CLASS}
                      rows={5}
                    />
                  )}
                />
              </Field>
            </section>
          </div>

          <DialogFooter className={SOCIO_DIALOG_FOOTER_CLASS}>
            {!editing.isNew ? (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                <Trash2 className="size-4" />
                {t("common.actions.delete")}
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit" disabled={saveSocioeconomicsMutation.isPending || !canSubmit}>
              {saveSocioeconomicsMutation.isPending
                ? t("common.actions.saving")
                : t("common.actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EnumSelect<T extends string>({
  group,
  options,
  value,
  onValueChange,
}: {
  group: string
  options: readonly T[]
  value: T
  onValueChange: (value: T) => void
}) {
  const { t } = useTranslation()

  return (
    <Select
      value={value}
      onValueChange={(nextValue) => {
        if (nextValue !== null) {
          onValueChange(nextValue)
        }
      }}
    >
      <SelectTrigger className={SOCIO_DIALOG_FIELD_CLASS}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {translateSocioeconomicsEnum(t, group, option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm leading-none font-medium">{label}</label>
      {children}
    </div>
  )
}
