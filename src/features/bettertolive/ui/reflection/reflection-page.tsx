import { NotebookPen, Pencil, Plus, Sparkles, Trash2 } from "lucide-react"
import type { FormEvent, ReactNode } from "react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
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
import { Textarea } from "@/components/ui/textarea"
import { useSaveReflectionMutation } from "@/features/bettertolive/queries/use-save-reflection-mutation"
import type {
  ReflectionDraftExample,
  ReflectionEntry,
  ReflectionModuleData,
} from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  Surface,
} from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"

type EditingReflection = {
  isNew: boolean
  entry: ReflectionEntry | null
}

type ReflectionFormState = {
  date: string
  title: string
  excerpt: string
  tagsText: string
}

function createReflectionId() {
  const randomId =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return `reflection-${randomId}`
}

function padTimePart(value: number) {
  return String(value).padStart(2, "0")
}

function createNowLabel() {
  const now = new Date()

  return (
    [now.getFullYear(), padTimePart(now.getMonth() + 1), padTimePart(now.getDate())].join("-") +
    ` ${padTimePart(now.getHours())}:${padTimePart(now.getMinutes())}`
  )
}

function splitListText(text: string) {
  return text
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function createInitialReflectionForm(entry: ReflectionEntry | null): ReflectionFormState {
  return {
    date: entry?.date ?? createNowLabel(),
    title: entry?.title ?? "",
    excerpt: entry?.excerpt ?? "",
    tagsText: (entry?.tags ?? []).join("，"),
  }
}

function createReflectionEntry(form: ReflectionFormState, id: string): ReflectionEntry {
  return {
    id,
    date: form.date.trim(),
    title: form.title.trim(),
    excerpt: form.excerpt.trim(),
    tags: splitListText(form.tagsText),
  }
}

function sortReflections(entries: ReflectionEntry[]) {
  return [...entries].sort((first, second) =>
    second.date.localeCompare(first.date, "zh-CN", { numeric: true }),
  )
}

export function ReflectionPage({
  draftExample,
  editableReflectionModule,
  reflections,
  searchQuery,
  isControlMode = false,
  isStackedLayout = false,
}: {
  draftExample: ReflectionDraftExample
  editableReflectionModule: ReflectionModuleData
  reflections: ReflectionEntry[]
  searchQuery: string
  isControlMode?: boolean
  isStackedLayout?: boolean
}) {
  const { t } = useTranslation()
  const saveReflectionMutation = useSaveReflectionMutation()
  const [editingReflection, setEditingReflection] = useState<EditingReflection | null>(null)
  const isFixedLayout = !isStackedLayout
  const sortedReflections = useMemo(() => sortReflections(reflections), [reflections])

  const handleDelete = async (entry: ReflectionEntry) => {
    const confirmed = window.confirm(
      t("reflection.confirm.delete", {
        title: entry.title,
        defaultValue: `确定删除「${entry.title}」吗？`,
      }),
    )

    if (!confirmed) return

    try {
      await saveReflectionMutation.mutateAsync({
        ...editableReflectionModule,
        entries: editableReflectionModule.entries.filter((item) => item.id !== entry.id),
      })
      toast.success(t("reflection.toast.deleted", "已删除"))
    } catch {
      toast.error(t("reflection.toast.deleteFailed", "删除失败"))
    }
  }

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
        <PageIntro
          eyebrow={t("reflection.page.eyebrow", "反思")}
          title={t("reflection.page.title", "先把此刻写下来")}
          description={t(
            "reflection.page.description",
            "表达不需要完整，真实比完整更重要。这里会成为你最自然的输入入口。",
          )}
          searchQuery={searchQuery}
        />
        <ReflectionControlModeBadge isControlMode={isControlMode} />
      </div>

      <div
        className={cn(
          "grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.85fr)]",
          isFixedLayout && "min-h-0 flex-1 overflow-hidden",
        )}
      >
        <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col")}>
          <SectionHeading
            icon={NotebookPen}
            title={t("reflection.sections.draft.title", "写作起点")}
            description={t(
              "reflection.sections.draft.description",
              "先保留一个足够具体的表达样子，真正保存的是右侧反思记录。",
            )}
          />

          <div
            className={cn("mt-5 space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}
          >
            <div className="min-h-[240px] rounded-lg border border-dashed border-[color:var(--chip-border)] bg-[color:var(--muted-surface-bg)] p-5 text-sm leading-7 whitespace-pre-wrap text-[color:var(--text-secondary)]">
              {draftExample.content}
            </div>

            <div className="flex flex-wrap gap-2">
              {draftExample.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </Surface>

        <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col")}>
          <div className="flex items-start justify-between gap-3">
            <SectionHeading
              icon={Sparkles}
              title={t("reflection.sections.recent.title", "最近反思")}
              description={t(
                "reflection.sections.recent.description",
                "先展示最近写过的内容，再决定之后如何组织回看。",
              )}
            />
            {isControlMode ? (
              <Button
                type="button"
                size="sm"
                onClick={() => setEditingReflection({ isNew: true, entry: null })}
              >
                <Plus className="size-4" />
                {t("reflection.actions.create", "新增反思")}
              </Button>
            ) : null}
          </div>

          <div
            className={cn("mt-5 space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}
          >
            {sortedReflections.length > 0 ? (
              sortedReflections.map((entry) => (
                <ReflectionEntryCard
                  key={entry.id}
                  entry={entry}
                  isControlMode={isControlMode}
                  isDeleting={saveReflectionMutation.isPending}
                  onDelete={() => void handleDelete(entry)}
                  onEdit={() => setEditingReflection({ isNew: false, entry })}
                />
              ))
            ) : (
              <EmptyState message={t("reflection.empty.records", "当前筛选下还没有反思记录。")} />
            )}
          </div>
        </Surface>
      </div>

      {editingReflection ? (
        <ReflectionEditDialog
          key={editingReflection.entry?.id ?? "new-reflection"}
          editing={editingReflection}
          reflectionModule={editableReflectionModule}
          onClose={() => setEditingReflection(null)}
        />
      ) : null}
    </div>
  )
}

function ReflectionControlModeBadge({ isControlMode }: { isControlMode: boolean }) {
  const { t } = useTranslation()

  return (
    <span
      className={cn(
        "rounded-full border px-2 py-0.5 text-[11px]",
        isControlMode
          ? "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]"
          : "border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]",
      )}
    >
      {isControlMode
        ? t("reflection.controlMode.on", "控制模式")
        : t("reflection.controlMode.off", "浏览模式")}
    </span>
  )
}

function ReflectionEntryCard({
  entry,
  isControlMode,
  isDeleting,
  onDelete,
  onEdit,
}: {
  entry: ReflectionEntry
  isControlMode: boolean
  isDeleting: boolean
  onDelete: () => void
  onEdit: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-[color:var(--text-muted)]">{entry.date}</div>
          <h3 className="mt-2 text-base font-medium text-[color:var(--text-primary)]">
            {entry.title}
          </h3>
        </div>
        {isControlMode ? (
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("reflection.actions.edit", "编辑反思")}
              title={t("reflection.actions.edit", "编辑反思")}
              onClick={onEdit}
            >
              <Pencil className="size-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={t("reflection.actions.delete", "删除")}
              title={t("reflection.actions.delete", "删除")}
              disabled={isDeleting}
              onClick={onDelete}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{entry.excerpt}</p>
      {entry.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {entry.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
            >
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function ReflectionEditDialog({
  editing,
  reflectionModule,
  onClose,
}: {
  editing: EditingReflection
  reflectionModule: ReflectionModuleData
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveReflectionMutation = useSaveReflectionMutation()
  const [form, setForm] = useState<ReflectionFormState>(() =>
    createInitialReflectionForm(editing.entry),
  )

  const updateForm = (patch: Partial<ReflectionFormState>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!form.date.trim() || !form.title.trim() || !form.excerpt.trim()) {
      toast.error(t("reflection.validation.required", "请填写时间、标题和反思内容"))
      return
    }

    const id = editing.entry?.id ?? createReflectionId()
    const nextEntry = createReflectionEntry(form, id)
    const entries = editing.entry
      ? reflectionModule.entries.map((entry) => (entry.id === id ? nextEntry : entry))
      : [nextEntry, ...reflectionModule.entries]

    try {
      await saveReflectionMutation.mutateAsync({
        ...reflectionModule,
        entries: sortReflections(entries),
      })
      toast.success(t("reflection.toast.saved", "已保存"))
      onClose()
    } catch {
      toast.error(t("reflection.toast.saveFailed", "保存失败"))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="flex max-h-[min(720px,calc(100dvh-2rem))] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {editing.isNew
              ? t("reflection.edit.createTitle", "新增反思")
              : t("reflection.edit.editTitle", "编辑反思")}
          </DialogTitle>
          <DialogDescription>
            {t("reflection.edit.description", "保留时间、标题、正文摘要和少量标签即可。")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
            <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
              <Field label={t("reflection.fields.date", "时间")}>
                <Input
                  value={form.date}
                  onChange={(event) => updateForm({ date: event.target.value })}
                  placeholder={t("reflection.placeholders.date", "例如：2026-06-08 21:10")}
                />
              </Field>
              <Field label={t("reflection.fields.title", "标题")}>
                <Input
                  value={form.title}
                  onChange={(event) => updateForm({ title: event.target.value })}
                  placeholder={t("reflection.placeholders.title", "例如：今天真正想保留的东西")}
                />
              </Field>
            </div>

            <Field label={t("reflection.fields.excerpt", "反思内容")}>
              <Textarea
                value={form.excerpt}
                onChange={(event) => updateForm({ excerpt: event.target.value })}
                placeholder={t(
                  "reflection.placeholders.excerpt",
                  "今天发生了什么？我看见了什么？以后回看时需要记住什么？",
                )}
                className="min-h-36"
              />
            </Field>

            <Field label={t("reflection.fields.tags", "标签")}>
              <Input
                value={form.tagsText}
                onChange={(event) => updateForm({ tagsText: event.target.value })}
                placeholder={t("reflection.placeholders.tags", "用逗号分隔，例如：节奏，工作")}
              />
            </Field>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("reflection.actions.cancel", "取消")}
            </Button>
            <Button type="submit" disabled={saveReflectionMutation.isPending}>
              {t("reflection.actions.save", "保存")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}
