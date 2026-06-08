import { Trash2 } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useSaveSocioeconomicsMutation } from "@/features/bettertolive/queries/use-save-socioeconomics-mutation"
import type {
  EconConfidence,
  EconConfidenceRevision,
  EconDomain,
  EconLayer,
  EconRelevance,
  EconSource,
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
  createSocioeconomicsId,
  joinListText,
  splitListText,
} from "@/features/bettertolive/ui/socioeconomics/socioeconomics-page-data"
import {
  SOCIO_DIALOG_CONTENT_CLASS,
  SOCIO_DIALOG_FIELD_CLASS,
  SOCIO_DIALOG_FOOTER_CLASS,
  SOCIO_DIALOG_HEADER_CLASS,
  SOCIO_DIALOG_SECTION_CLASS,
} from "@/features/bettertolive/ui/socioeconomics/socioeconomics-page-shared"
import { translateSocioeconomicsEnum } from "@/features/bettertolive/ui/socioeconomics/socioeconomics-i18n"
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
  domain: EconDomain
  layer: EconLayer
  confidence: EconConfidence
  source: EconSource
  relevance: EconRelevance
  summary: string
  understandingNote: string
  relatedConceptsText: string
  tagsText: string
  confidenceHistoryText: string
}

type GapFormState = {
  domain: EconDomain
  summary: string
  nextStep: string
}

function createInitialEntryForm(entry: SocioeconomicsEntry | null): EntryFormState {
  return {
    title: entry?.title ?? "",
    domain: entry?.domain ?? ECON_DOMAINS[0],
    layer: entry?.layer ?? ECON_LAYERS[0],
    confidence: entry?.confidence ?? ECON_CONFIDENCES[0],
    source: entry?.source ?? ECON_SOURCES[0],
    relevance: entry?.relevance ?? ECON_RELEVANCES[0],
    summary: entry?.summary ?? "",
    understandingNote: entry?.understandingNote ?? "",
    relatedConceptsText: joinListText(entry?.relatedConcepts),
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
        id: createSocioeconomicsId(`socio-history-${index + 1}`),
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
      toast.error(t("socioeconomics.edit.validation.entryRequired", "请填写标题和摘要"))
      return
    }

    let confidenceHistory: EconConfidenceRevision[]

    try {
      confidenceHistory = parseConfidenceHistory(form.confidenceHistoryText)
    } catch {
      toast.error(
        t(
          "socioeconomics.edit.validation.history",
          "掌握修订历史格式需要是：日期 | 原等级 -> 新等级 | 触发原因",
        ),
      )
      return
    }

    const nextEntry: SocioeconomicsEntry = {
      id: editing.entry?.id ?? createSocioeconomicsId("socio-knowledge"),
      title: form.title.trim(),
      domain: form.domain,
      layer: form.layer,
      confidence: form.confidence,
      source: form.source,
      relevance: form.relevance,
      summary: form.summary.trim(),
      understandingNote: form.understandingNote.trim() || undefined,
      relatedConcepts: splitListText(form.relatedConceptsText),
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
      toast.success(t("socioeconomics.toast.saved", "已保存"))
      onClose()
    } catch {
      toast.error(t("socioeconomics.toast.saveFailed", "保存失败"))
    }
  }

  const handleDelete = async () => {
    if (!editing.entry) return

    const confirmed = window.confirm(
      t("socioeconomics.confirm.deleteEntry", {
        title: editing.entry.title,
        defaultValue: `确定删除「${editing.entry.title}」吗？`,
      }),
    )

    if (!confirmed) return

    try {
      await saveSocioeconomicsMutation.mutateAsync({
        ...socioeconomics,
        entries: socioeconomics.entries.filter((entry) => entry.id !== editing.entry?.id),
      })
      toast.success(t("socioeconomics.toast.deleted", "已删除"))
      onClose()
    } catch {
      toast.error(t("socioeconomics.toast.deleteFailed", "删除失败"))
    }
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
              ? t("socioeconomics.edit.entryCreateTitle", "新增认知条目")
              : t("socioeconomics.edit.entryEditTitle", "编辑认知条目")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "socioeconomics.edit.entryDescription",
              "每条认知都需要完整标注领域、层次、掌握程度、来源和决策距离。",
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
            <section className={SOCIO_DIALOG_SECTION_CLASS}>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label={t("socioeconomics.fields.title", "标题")}>
                  <Input
                    value={form.title}
                    onChange={(event) => updateForm({ title: event.target.value })}
                    className={SOCIO_DIALOG_FIELD_CLASS}
                  />
                </Field>

                <Field label={t("socioeconomics.fields.domain", "领域")}>
                  <EnumSelect
                    group="domain"
                    value={form.domain}
                    options={ECON_DOMAINS}
                    onValueChange={(domain) => updateForm({ domain: domain as EconDomain })}
                  />
                </Field>

                <Field label={t("socioeconomics.fields.layer", "层次")}>
                  <EnumSelect
                    group="layer"
                    value={form.layer}
                    options={ECON_LAYERS}
                    onValueChange={(layer) => updateForm({ layer: layer as EconLayer })}
                  />
                </Field>

                <Field label={t("socioeconomics.fields.confidence", "掌握程度")}>
                  <EnumSelect
                    group="confidence"
                    value={form.confidence}
                    options={ECON_CONFIDENCES}
                    onValueChange={(confidence) =>
                      updateForm({ confidence: confidence as EconConfidence })
                    }
                  />
                </Field>

                <Field label={t("socioeconomics.fields.source", "来源")}>
                  <EnumSelect
                    group="source"
                    value={form.source}
                    options={ECON_SOURCES}
                    onValueChange={(source) => updateForm({ source: source as EconSource })}
                  />
                </Field>

                <Field label={t("socioeconomics.fields.relevance", "决策距离")}>
                  <EnumSelect
                    group="relevance"
                    value={form.relevance}
                    options={ECON_RELEVANCES}
                    onValueChange={(relevance) =>
                      updateForm({ relevance: relevance as EconRelevance })
                    }
                  />
                </Field>
              </div>
            </section>

            <section className={SOCIO_DIALOG_SECTION_CLASS}>
              <Field label={t("socioeconomics.fields.summary", "摘要")}>
                <Textarea
                  value={form.summary}
                  onChange={(event) => updateForm({ summary: event.target.value })}
                  className={SOCIO_DIALOG_FIELD_CLASS}
                  rows={3}
                />
              </Field>

              <Field label={t("socioeconomics.fields.understandingNote", "理解笔记")}>
                <Textarea
                  value={form.understandingNote}
                  onChange={(event) => updateForm({ understandingNote: event.target.value })}
                  className={SOCIO_DIALOG_FIELD_CLASS}
                  rows={3}
                />
              </Field>

              <div className="grid gap-4 lg:grid-cols-2">
                <Field label={t("socioeconomics.fields.relatedConcepts", "相关概念")}>
                  <Input
                    value={form.relatedConceptsText}
                    onChange={(event) => updateForm({ relatedConceptsText: event.target.value })}
                    className={SOCIO_DIALOG_FIELD_CLASS}
                  />
                </Field>

                <Field label={t("socioeconomics.fields.tags", "标签")}>
                  <Input
                    value={form.tagsText}
                    onChange={(event) => updateForm({ tagsText: event.target.value })}
                    className={SOCIO_DIALOG_FIELD_CLASS}
                  />
                </Field>
              </div>

              <Field label={t("socioeconomics.fields.confidenceHistory", "掌握修订历史")}>
                <Textarea
                  value={form.confidenceHistoryText}
                  onChange={(event) => updateForm({ confidenceHistoryText: event.target.value })}
                  className={SOCIO_DIALOG_FIELD_CLASS}
                  placeholder={t(
                    "socioeconomics.edit.historyPlaceholder",
                    "2026-03-04 | 听过名词 -> 知道大致逻辑 | 看完一组材料",
                  )}
                  rows={4}
                />
              </Field>
            </section>
          </div>

          <DialogFooter className={SOCIO_DIALOG_FOOTER_CLASS}>
            {!editing.isNew ? (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                <Trash2 className="size-4" />
                {t("socioeconomics.actions.delete", "删除")}
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onClose}>
              {t("socioeconomics.actions.cancel", "取消")}
            </Button>
            <Button type="submit" disabled={saveSocioeconomicsMutation.isPending}>
              {t("socioeconomics.actions.save", "保存")}
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
      toast.error(t("socioeconomics.edit.validation.gapRequired", "请填写缺口和下一步"))
      return
    }

    const nextGap: SocioeconomicsGap = {
      id: editing.gap?.id ?? createSocioeconomicsId("socio-gap"),
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
      toast.success(t("socioeconomics.toast.saved", "已保存"))
      onClose()
    } catch {
      toast.error(t("socioeconomics.toast.saveFailed", "保存失败"))
    }
  }

  const handleDelete = async () => {
    if (!editing.gap) return

    const confirmed = window.confirm(t("socioeconomics.confirm.deleteGap", "确定删除这条缺口吗？"))
    if (!confirmed) return

    try {
      await saveSocioeconomicsMutation.mutateAsync({
        ...socioeconomics,
        gaps: socioeconomics.gaps.filter((gap) => gap.id !== editing.gap?.id),
      })
      toast.success(t("socioeconomics.toast.deleted", "已删除"))
      onClose()
    } catch {
      toast.error(t("socioeconomics.toast.deleteFailed", "删除失败"))
    }
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
              ? t("socioeconomics.edit.gapCreateTitle", "新增认知缺口")
              : t("socioeconomics.edit.gapEditTitle", "编辑认知缺口")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
            <section className={SOCIO_DIALOG_SECTION_CLASS}>
              <Field label={t("socioeconomics.fields.domain", "领域")}>
                <EnumSelect
                  group="domain"
                  value={form.domain}
                  options={ECON_DOMAINS}
                  onValueChange={(domain) => updateForm({ domain: domain as EconDomain })}
                />
              </Field>

              <Field label={t("socioeconomics.fields.gapSummary", "缺口")}>
                <Textarea
                  value={form.summary}
                  onChange={(event) => updateForm({ summary: event.target.value })}
                  className={SOCIO_DIALOG_FIELD_CLASS}
                  rows={4}
                />
              </Field>

              <Field label={t("socioeconomics.fields.nextStep", "下一步")}>
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
                {t("socioeconomics.actions.delete", "删除")}
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onClose}>
              {t("socioeconomics.actions.cancel", "取消")}
            </Button>
            <Button type="submit" disabled={saveSocioeconomicsMutation.isPending}>
              {t("socioeconomics.actions.save", "保存")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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
  const [prompt, setPrompt] = useState(editing.prompt)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!prompt.trim()) {
      toast.error(t("socioeconomics.edit.validation.promptRequired", "请填写复习提问"))
      return
    }

    const nextPrompts = editing.isNew
      ? [prompt.trim(), ...socioeconomics.reviewPrompts]
      : socioeconomics.reviewPrompts.map((item, index) =>
          index === editing.index ? prompt.trim() : item,
        )

    try {
      await saveSocioeconomicsMutation.mutateAsync({
        ...socioeconomics,
        reviewPrompts: nextPrompts,
      })
      toast.success(t("socioeconomics.toast.saved", "已保存"))
      onClose()
    } catch {
      toast.error(t("socioeconomics.toast.saveFailed", "保存失败"))
    }
  }

  const handleDelete = async () => {
    if (editing.index === null) return

    const confirmed = window.confirm(
      t("socioeconomics.confirm.deletePrompt", "确定删除这条复习提问吗？"),
    )
    if (!confirmed) return

    try {
      await saveSocioeconomicsMutation.mutateAsync({
        ...socioeconomics,
        reviewPrompts: socioeconomics.reviewPrompts.filter((_, index) => index !== editing.index),
      })
      toast.success(t("socioeconomics.toast.deleted", "已删除"))
      onClose()
    } catch {
      toast.error(t("socioeconomics.toast.deleteFailed", "删除失败"))
    }
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
              ? t("socioeconomics.edit.promptCreateTitle", "新增复习提问")
              : t("socioeconomics.edit.promptEditTitle", "编辑复习提问")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-1 py-1 pr-2">
            <section className={SOCIO_DIALOG_SECTION_CLASS}>
              <Field label={t("socioeconomics.fields.prompt", "复习提问")}>
                <Textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  className={SOCIO_DIALOG_FIELD_CLASS}
                  rows={5}
                />
              </Field>
            </section>
          </div>

          <DialogFooter className={SOCIO_DIALOG_FOOTER_CLASS}>
            {!editing.isNew ? (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                <Trash2 className="size-4" />
                {t("socioeconomics.actions.delete", "删除")}
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onClose}>
              {t("socioeconomics.actions.cancel", "取消")}
            </Button>
            <Button type="submit" disabled={saveSocioeconomicsMutation.isPending}>
              {t("socioeconomics.actions.save", "保存")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EnumSelect({
  group,
  options,
  value,
  onValueChange,
}: {
  group: string
  options: readonly string[]
  value: string
  onValueChange: (value: string) => void
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
