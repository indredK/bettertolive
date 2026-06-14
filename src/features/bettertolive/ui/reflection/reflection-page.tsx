import { CalendarDays, Hash, NotebookPen, Pencil, Plus, Sparkles, Trash2 } from "lucide-react"
import type { FormEvent, ReactNode } from "react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { AnimatedButton, AnimatedIconButton, Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { splitListText } from "@/lib/list-utils"
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
import { confirmUndoableDelete } from "@/features/bettertolive/ui/shopping/_shared/shopping-delete"
import type {
  ReflectionDraftExample,
  ReflectionEntry,
  ReflectionModuleData,
} from "@/features/bettertolive/types"
import { EmptyState, SectionHeading, Surface } from "@/features/bettertolive/ui/shared/shared"
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

type CountRow = {
  label: string
  count: number
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

function createCountRows(values: string[]) {
  const counts = new Map<string, number>()
  values.forEach((value) => {
    const normalized = value.trim()
    if (!normalized) return
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1)
  })

  return [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((first, second) => second.count - first.count || first.label.localeCompare(second.label))
}

function getReflectionMonth(entry: ReflectionEntry) {
  return entry.date.slice(0, 7)
}

export function ReflectionPage({
  draftExample,
  editableReflectionModule,
  reflections,
  isControlMode = false,
  isStackedLayout = false,
}: {
  draftExample: ReflectionDraftExample
  editableReflectionModule: ReflectionModuleData
  reflections: ReflectionEntry[]
  isControlMode?: boolean
  isStackedLayout?: boolean
}) {
  const { t } = useTranslation()
  const saveReflectionMutation = useSaveReflectionMutation()
  const [editingReflection, setEditingReflection] = useState<EditingReflection | null>(null)
  const isFixedLayout = !isStackedLayout
  const sortedReflections = useMemo(() => sortReflections(reflections), [reflections])
  const tagRows = useMemo(
    () => createCountRows(sortedReflections.flatMap((entry) => entry.tags)),
    [sortedReflections],
  )
  const monthRows = useMemo(
    () => createCountRows(sortedReflections.map((entry) => getReflectionMonth(entry))),
    [sortedReflections],
  )
  const reflectionPrompts = [
    t("reflection.prompts.keep"),
    t("reflection.prompts.pattern"),
    t("reflection.prompts.next"),
  ]

  const handleDelete = (entry: ReflectionEntry) => {
    confirmUndoableDelete({
      confirmMessage: t("common.confirm.deleteItem", {
        name: entry.title,
      }),
      pendingMessage: t("common.toast.deletePending", { name: entry.title }),
      successMessage: t("common.toast.deleted"),
      failureMessage: t("common.toast.deleteFailed"),
      undoLabel: t("common.actions.undo"),
      undoneMessage: t("common.toast.deleteUndone", { name: entry.title }),
      onDelete: () =>
        saveReflectionMutation.mutateAsync({
          ...editableReflectionModule,
          entries: editableReflectionModule.entries.filter((item) => item.id !== entry.id),
        }),
    })
    return Promise.resolve()
  }

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <Tabs
        defaultValue="overview"
        className={cn("min-h-0 flex-1 flex-col", isFixedLayout && "overflow-hidden")}
      >
        <TabsList className="hide-scrollbar max-w-full shrink-0 justify-start overflow-x-auto">
          <TabsTrigger value="overview">{t("reflection.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="records">{t("reflection.tabs.records")}</TabsTrigger>
          <TabsTrigger value="themes">{t("reflection.tabs.themes")}</TabsTrigger>
          <TabsTrigger value="writing">{t("reflection.tabs.writing")}</TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          className={cn("mt-3", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          <div
            className={cn(
              "grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.85fr)]",
              isFixedLayout && "h-full min-h-0 overflow-hidden",
            )}
          >
            <ReflectionDraftPanel draftExample={draftExample} isFixedLayout={isFixedLayout} />
            <ReflectionRecordsPanel
              entries={sortedReflections.slice(0, 5)}
              isControlMode={isControlMode}
              isDeleting={saveReflectionMutation.isPending}
              isFixedLayout={isFixedLayout}
              onCreate={() => setEditingReflection({ isNew: true, entry: null })}
              onDelete={handleDelete}
              onEdit={(entry) => setEditingReflection({ isNew: false, entry })}
            />
          </div>
        </TabsContent>

        <TabsContent
          value="records"
          className={cn("mt-3", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          <ReflectionRecordsPanel
            entries={sortedReflections}
            isControlMode={isControlMode}
            isDeleting={saveReflectionMutation.isPending}
            isFixedLayout={isFixedLayout}
            onCreate={() => setEditingReflection({ isNew: true, entry: null })}
            onDelete={handleDelete}
            onEdit={(entry) => setEditingReflection({ isNew: false, entry })}
          />
        </TabsContent>

        <TabsContent
          value="themes"
          className={cn("mt-3", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          <ReflectionThemesPanel
            isFixedLayout={isFixedLayout}
            monthRows={monthRows}
            tagRows={tagRows}
          />
        </TabsContent>

        <TabsContent
          value="writing"
          className={cn("mt-3", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          <ReflectionWritingPanel
            draftExample={draftExample}
            isFixedLayout={isFixedLayout}
            prompts={reflectionPrompts}
          />
        </TabsContent>
      </Tabs>

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

function ReflectionDraftPanel({
  draftExample,
  isFixedLayout,
}: {
  draftExample: ReflectionDraftExample
  isFixedLayout: boolean
}) {
  const { t } = useTranslation()

  return (
    <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col")}>
      <SectionHeading
        icon={NotebookPen}
        title={t("reflection.sections.draft.title")}
        description={t(
          "reflection.sections.draft.description",
          "先保留一个足够具体的表达样子，真正保存的是右侧反思记录。",
        )}
      />

      <div className={cn("mt-5 space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}>
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
  )
}

function ReflectionRecordsPanel({
  entries,
  isControlMode,
  isDeleting,
  isFixedLayout,
  onCreate,
  onDelete,
  onEdit,
}: {
  entries: ReflectionEntry[]
  isControlMode: boolean
  isDeleting: boolean
  isFixedLayout: boolean
  onCreate: () => void
  onDelete: (entry: ReflectionEntry) => Promise<void>
  onEdit: (entry: ReflectionEntry) => void
}) {
  const { t } = useTranslation()

  return (
    <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col")}>
      <div className="flex items-start justify-between gap-3">
        <SectionHeading
          icon={Sparkles}
          title={t("reflection.sections.recent.title")}
          description={t(
            "reflection.sections.recent.description",
            "先展示最近写过的内容，再决定之后如何组织回看。",
          )}
        />
        <AnimatedButton show={isControlMode} type="button" size="sm" onClick={onCreate}>
          <Plus className="size-4" />
          {t("reflection.actions.create")}
        </AnimatedButton>
      </div>

      <div className={cn("mt-5 space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}>
        {entries.length > 0 ? (
          entries.map((entry) => (
            <ReflectionEntryCard
              key={entry.id}
              entry={entry}
              isControlMode={isControlMode}
              isDeleting={isDeleting}
              onDelete={() => void onDelete(entry)}
              onEdit={() => onEdit(entry)}
            />
          ))
        ) : (
          <EmptyState message={t("reflection.empty.records")} />
        )}
      </div>
    </Surface>
  )
}

function ReflectionThemesPanel({
  isFixedLayout,
  monthRows,
  tagRows,
}: {
  isFixedLayout: boolean
  monthRows: CountRow[]
  tagRows: CountRow[]
}) {
  const { t } = useTranslation()

  return (
    <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col overflow-hidden")}>
      <SectionHeading
        icon={Hash}
        title={t("reflection.sections.themes.title")}
        description={t(
          "reflection.sections.themes.description",
          "把标签和月份放在一起看，哪些话题正在反复出现会更清楚。",
        )}
      />
      <div
        className={cn(
          "mt-5 grid gap-4 min-[960px]:grid-cols-2",
          isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1",
        )}
      >
        <CountRowsCard
          emptyMessage={t("reflection.empty.tags")}
          icon={Hash}
          rows={tagRows}
          title={t("reflection.sections.themes.tags")}
        />
        <CountRowsCard
          emptyMessage={t("reflection.empty.months")}
          icon={CalendarDays}
          rows={monthRows}
          title={t("reflection.sections.themes.months")}
        />
      </div>
    </Surface>
  )
}

function ReflectionWritingPanel({
  draftExample,
  isFixedLayout,
  prompts,
}: {
  draftExample: ReflectionDraftExample
  isFixedLayout: boolean
  prompts: string[]
}) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "grid gap-4 min-[960px]:grid-cols-[minmax(0,1fr)_360px]",
        isFixedLayout && "h-full min-h-0 overflow-hidden",
      )}
    >
      <ReflectionDraftPanel draftExample={draftExample} isFixedLayout={isFixedLayout} />
      <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col overflow-hidden")}>
        <SectionHeading
          icon={Sparkles}
          title={t("reflection.sections.writingPrompts.title")}
          description={t(
            "reflection.sections.writingPrompts.description",
            "写之前不必完整回答，先用问题把注意力放回自己身上。",
          )}
        />
        <div
          className={cn("mt-5 space-y-3", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}
        >
          {prompts.map((prompt) => (
            <div
              key={prompt}
              className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]"
            >
              {prompt}
            </div>
          ))}
        </div>
      </Surface>
    </div>
  )
}

function CountRowsCard({
  emptyMessage,
  icon: Icon,
  rows,
  title,
}: {
  emptyMessage: string
  icon: typeof Hash
  rows: CountRow[]
  title: string
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0)

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
      <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--text-primary)]">
        <Icon className="size-4" />
        {title}
      </div>
      <div className="mt-4 space-y-3">
        {rows.length > 0 ? (
          rows.slice(0, 10).map((row) => (
            <div key={row.label} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate text-[color:var(--text-secondary)]">
                  {row.label}
                </span>
                <span className="text-xs text-[color:var(--text-muted)]">{row.count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[color:var(--chip-bg)]">
                <div
                  className="h-1.5 rounded-full bg-[color:var(--text-secondary)]"
                  style={{ width: `${total > 0 ? Math.max((row.count / total) * 100, 8) : 0}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <EmptyState message={emptyMessage} compact />
        )}
      </div>
    </div>
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
        <div className="flex shrink-0 items-center gap-1">
          <AnimatedIconButton
            show={isControlMode}
            type="button"
            variant="ghost"
            size="icon-sm"
            label={t("reflection.actions.edit")}
            icon={<Pencil className="size-4" />}
            onClick={onEdit}
          />
          <AnimatedIconButton
            show={isControlMode}
            type="button"
            variant="ghost"
            size="icon-sm"
            label={t("common.actions.delete")}
            icon={<Trash2 className="size-4" />}
            disabled={isDeleting}
            onClick={onDelete}
          />
        </div>
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
      toast.error(t("reflection.validation.required"))
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
      toast.success(t("common.toast.saved"))
      onClose()
    } catch {
      toast.error(t("common.toast.saveFailed"))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="flex max-h-[min(720px,calc(100dvh-2rem))] max-w-2xl flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            {editing.isNew ? t("reflection.edit.createTitle") : t("reflection.edit.editTitle")}
          </DialogTitle>
          <DialogDescription>{t("reflection.edit.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
            <div className="grid gap-4 sm:grid-cols-[180px_minmax(0,1fr)]">
              <Field label={t("reflection.fields.date")}>
                <Input
                  value={form.date}
                  onChange={(event) => updateForm({ date: event.target.value })}
                  placeholder={t("reflection.placeholders.date")}
                />
              </Field>
              <Field label={t("reflection.fields.title")}>
                <Input
                  value={form.title}
                  onChange={(event) => updateForm({ title: event.target.value })}
                  placeholder={t("reflection.placeholders.title")}
                />
              </Field>
            </div>

            <Field label={t("reflection.fields.excerpt")}>
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

            <Field label={t("reflection.fields.tags")}>
              <Input
                value={form.tagsText}
                onChange={(event) => updateForm({ tagsText: event.target.value })}
                placeholder={t("reflection.placeholders.tags")}
              />
            </Field>
          </div>

          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit" disabled={saveReflectionMutation.isPending}>
              {t("common.actions.save")}
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
