import {
  BookOpenText,
  CalendarClock,
  Clock3,
  Hash,
  Pencil,
  Plus,
  Sparkles,
  Target,
  Trash2,
  type LucideIcon,
} from "lucide-react"
import type { FormEvent, ReactNode } from "react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useSaveEventsMutation } from "@/features/bettertolive/queries/use-save-events-mutation"
import type { EventEntry, EventsModuleData } from "@/features/bettertolive/types"
import { EmptyState, SectionHeading, Surface } from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"

type EditingEvent = {
  isNew: boolean
  event: EventEntry | null
}

type EventFormState = {
  date: string
  title: string
  excerpt: string
  theme: string
  tagsText: string
}

type ThemeRow = {
  label: string
  count: number
}

function createEventId() {
  const randomId =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return `event-${randomId}`
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

function createInitialEventForm(event: EventEntry | null): EventFormState {
  return {
    date: event?.date ?? createNowLabel(),
    title: event?.title ?? "",
    excerpt: event?.content ?? event?.excerpt ?? "",
    theme: event?.theme ?? "",
    tagsText: (event?.tags ?? []).join("，"),
  }
}

function splitListText(text: string) {
  return text
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeOccurredAt(value: string) {
  const normalized = value.trim().replace(" ", "T")

  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized)) {
    return undefined
  }

  return normalized.length === 16 ? `${normalized}:00` : normalized
}

function getEventSortValue(event: EventEntry) {
  return event.occurredAt ?? event.date
}

function sortEvents(entries: EventEntry[]) {
  return [...entries].sort((a, b) =>
    getEventSortValue(b).localeCompare(getEventSortValue(a), "zh-CN"),
  )
}

function createThemeRows(events: EventEntry[]): ThemeRow[] {
  const counts = new Map<string, number>()

  events.forEach((event) => {
    counts.set(event.theme, (counts.get(event.theme) ?? 0) + 1)
  })

  return [...counts.entries()]
    .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0], "zh-CN"))
    .map(([label, count]) => ({ label, count }))
}

function getDateBucket(event: EventEntry) {
  const value = event.date || event.occurredAt || ""
  return value.split(" ")[0]?.split("T")[0] ?? value
}

export function EventsPage({
  editableEventsModule,
  events,
  isControlMode = false,
  isStackedLayout = false,
}: {
  editableEventsModule: EventsModuleData
  events: EventEntry[]
  isControlMode?: boolean
  isStackedLayout?: boolean
}) {
  const { t } = useTranslation()
  const [editingEvent, setEditingEvent] = useState<EditingEvent | null>(null)
  const isFixedLayout = !isStackedLayout
  const sortedEvents = useMemo(() => sortEvents(events), [events])
  const themeRows = useMemo(() => createThemeRows(events), [events])
  const dateCount = useMemo(
    () => new Set(events.map((event) => getDateBucket(event))).size,
    [events],
  )
  const latestEvent = sortedEvents[0]

  const openCreateDialog = () => {
    setEditingEvent({ isNew: true, event: null })
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
          <TabsTrigger value="overview">{t("events.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="timeline">{t("events.tabs.timeline")}</TabsTrigger>
          <TabsTrigger value="themes">{t("events.tabs.themes")}</TabsTrigger>
          <TabsTrigger value="review">{t("events.tabs.review")}</TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          className={cn("mt-3", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          {isFixedLayout ? (
            <EventsFixedDashboard
              events={sortedEvents}
              themeRows={themeRows}
              dateCount={dateCount}
              latestEvent={latestEvent}
              isControlMode={isControlMode}
              onCreate={openCreateDialog}
              onEdit={(event) => setEditingEvent({ isNew: false, event })}
            />
          ) : (
            <EventsStackedView
              events={sortedEvents}
              themeRows={themeRows}
              dateCount={dateCount}
              latestEvent={latestEvent}
              isControlMode={isControlMode}
              onCreate={openCreateDialog}
              onEdit={(event) => setEditingEvent({ isNew: false, event })}
            />
          )}
        </TabsContent>

        <TabsContent
          value="timeline"
          className={cn("mt-3", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          <Surface className={cn("p-4", isFixedLayout && "flex h-full min-h-0 flex-col")}>
            <SectionHeading
              icon={BookOpenText}
              title={t("events.timeline.title")}
              description={t("events.timeline.description")}
              compact
            />
            <div className={cn("mt-3", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}>
              <EventTimeline
                events={sortedEvents}
                isControlMode={isControlMode}
                onEdit={(event) => setEditingEvent({ isNew: false, event })}
              />
            </div>
          </Surface>
        </TabsContent>

        <TabsContent
          value="themes"
          className={cn("mt-3", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          <Surface className={cn("p-4", isFixedLayout && "flex h-full min-h-0 flex-col")}>
            <SectionHeading
              icon={Target}
              title={t("events.themes.title")}
              description={t("events.themes.description")}
              compact
            />
            <div className={cn("mt-3", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}>
              <ThemeList rows={themeRows} />
            </div>
          </Surface>
        </TabsContent>

        <TabsContent
          value="review"
          className={cn("mt-3", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          <div
            className={cn(
              "grid gap-3 min-[960px]:grid-cols-[360px_minmax(0,1fr)]",
              isFixedLayout && "h-full min-h-0 overflow-hidden",
            )}
          >
            <EventsQuickPanel
              count={sortedEvents.length}
              dateCount={dateCount}
              isControlMode={isControlMode}
              latestEvent={latestEvent}
              onCreate={openCreateDialog}
            />
            <Surface
              className={cn("p-4", isFixedLayout && "flex min-h-0 flex-col overflow-hidden")}
            >
              <SectionHeading
                icon={Sparkles}
                title={t("events.review.title")}
                description={t("events.review.description")}
                compact
              />
              <div
                className={cn(
                  "mt-3 space-y-2",
                  isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1",
                )}
              >
                {themeRows.slice(0, 4).map((row) => (
                  <div
                    key={row.label}
                    className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3 text-sm text-[color:var(--text-secondary)]"
                  >
                    {t("events.review.themeLine", {
                      theme: row.label,
                      count: row.count,
                    })}
                  </div>
                ))}
                {themeRows.length === 0 ? (
                  <EmptyState message={t("events.empty.review")} compact />
                ) : null}
              </div>
            </Surface>
          </div>
        </TabsContent>
      </Tabs>

      {editingEvent ? (
        <EventEditDialog
          key={editingEvent.event?.id ?? "new-event"}
          editing={editingEvent}
          eventsModule={editableEventsModule}
          onClose={() => setEditingEvent(null)}
        />
      ) : null}
    </div>
  )
}

function EventsFixedDashboard({
  events,
  themeRows,
  dateCount,
  latestEvent,
  isControlMode,
  onCreate,
  onEdit,
}: {
  events: EventEntry[]
  themeRows: ThemeRow[]
  dateCount: number
  latestEvent: EventEntry | undefined
  isControlMode: boolean
  onCreate: () => void
  onEdit: (event: EventEntry) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.4fr)_minmax(320px,0.82fr)] gap-3 overflow-hidden">
      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <SectionHeading
          icon={BookOpenText}
          title={t("events.timeline.title")}
          description={t("events.timeline.description")}
          compact
        />
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
          <EventTimeline events={events} isControlMode={isControlMode} onEdit={onEdit} />
        </div>
      </Surface>

      <div className="flex min-h-0 flex-col gap-3 overflow-hidden">
        <EventsQuickPanel
          count={events.length}
          dateCount={dateCount}
          isControlMode={isControlMode}
          latestEvent={latestEvent}
          onCreate={onCreate}
        />
        <Surface className="flex min-h-0 flex-1 flex-col overflow-hidden p-4">
          <SectionHeading
            icon={Target}
            title={t("events.themes.title")}
            description={t("events.themes.description")}
            compact
          />
          <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <ThemeList rows={themeRows} />
          </div>
        </Surface>
      </div>
    </div>
  )
}

function EventsStackedView({
  events,
  themeRows,
  dateCount,
  latestEvent,
  isControlMode,
  onCreate,
  onEdit,
}: {
  events: EventEntry[]
  themeRows: ThemeRow[]
  dateCount: number
  latestEvent: EventEntry | undefined
  isControlMode: boolean
  onCreate: () => void
  onEdit: (event: EventEntry) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      <EventsQuickPanel
        count={events.length}
        dateCount={dateCount}
        isControlMode={isControlMode}
        latestEvent={latestEvent}
        onCreate={onCreate}
      />

      <Surface className="p-4">
        <SectionHeading
          icon={BookOpenText}
          title={t("events.timeline.title")}
          description={t("events.timeline.description")}
          compact
        />
        <div className="mt-3">
          <EventTimeline events={events} isControlMode={isControlMode} onEdit={onEdit} />
        </div>
      </Surface>

      <Surface className="p-4">
        <SectionHeading
          icon={Target}
          title={t("events.themes.title")}
          description={t("events.themes.description")}
          compact
        />
        <div className="mt-3">
          <ThemeList rows={themeRows} />
        </div>
      </Surface>
    </div>
  )
}

function EventsQuickPanel({
  count,
  dateCount,
  isControlMode,
  latestEvent,
  onCreate,
}: {
  count: number
  dateCount: number
  isControlMode: boolean
  latestEvent: EventEntry | undefined
  onCreate: () => void
}) {
  const { t } = useTranslation()

  return (
    <Surface className="shrink-0 p-4">
      <div className="flex items-start justify-between gap-3">
        <SectionHeading
          icon={Sparkles}
          title={t("events.capture.title")}
          description={t("events.capture.description")}
          compact
        />
        {isControlMode ? (
          <Button type="button" size="sm" onClick={onCreate}>
            <Plus data-icon="inline-start" />
            {t("events.actions.create")}
          </Button>
        ) : null}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <MetricTile icon={BookOpenText} label={t("events.metrics.events")} value={String(count)} />
        <MetricTile
          icon={CalendarClock}
          label={t("events.metrics.days")}
          value={String(dateCount)}
        />
      </div>

      <div className="mt-3 rounded-lg border border-[color:var(--event-accent-border)] bg-[color:var(--event-accent-bg)] px-3 py-3 text-[color:var(--event-accent-ink)]">
        <div className="flex items-center gap-2 text-xs font-medium">
          <Clock3 className="size-3.5" />
          {t("events.capture.latest")}
        </div>
        {latestEvent ? (
          <div className="mt-2">
            <div className="text-sm font-semibold text-[color:var(--text-primary)]">
              {latestEvent.title}
            </div>
            <p className="mt-1 line-clamp-2 text-xs leading-5 text-[color:var(--text-secondary)]">
              {latestEvent.excerpt}
            </p>
          </div>
        ) : (
          <p className="mt-2 text-xs leading-5 text-[color:var(--text-muted)]">
            {t("events.empty.latest")}
          </p>
        )}
      </div>
    </Surface>
  )
}

function MetricTile({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3">
      <div className="flex items-center gap-2 text-xs text-[color:var(--text-muted)]">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-[color:var(--text-primary)]">{value}</div>
    </div>
  )
}

function EventTimeline({
  events,
  isControlMode,
  onEdit,
}: {
  events: EventEntry[]
  isControlMode: boolean
  onEdit: (event: EventEntry) => void
}) {
  const { t } = useTranslation()

  if (events.length === 0) {
    return <EmptyState message={t("events.empty.timeline")} compact />
  }

  return (
    <div className="relative space-y-3 pl-4 before:absolute before:top-2 before:bottom-2 before:left-[7px] before:w-px before:bg-[color:var(--muted-surface-border)]">
      {events.map((event) => (
        <EventTimelineCard
          key={event.id}
          event={event}
          isControlMode={isControlMode}
          onEdit={() => onEdit(event)}
        />
      ))}
    </div>
  )
}

function EventTimelineCard({
  event,
  isControlMode,
  onEdit,
}: {
  event: EventEntry
  isControlMode: boolean
  onEdit: () => void
}) {
  const { t } = useTranslation()

  return (
    <article className="relative">
      <div className="absolute top-4 -left-4 flex size-4 items-center justify-center rounded-full bg-[color:var(--event-marker-bg)] text-[color:var(--event-marker-ink)] shadow-sm">
        <span className="size-1.5 rounded-full bg-current" />
      </div>
      <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[color:var(--text-muted)] uppercase">{event.date}</span>
              <Badge
                variant="outline"
                className="border-[color:var(--event-accent-border)] bg-[color:var(--event-accent-bg)] text-[color:var(--event-accent-ink)]"
              >
                {event.theme}
              </Badge>
            </div>
            <h3 className="mt-2 text-base font-semibold text-[color:var(--text-primary)]">
              {event.title}
            </h3>
          </div>

          {isControlMode ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title={t("events.actions.edit")}
              aria-label={t("events.actions.edit")}
              onClick={onEdit}
            >
              <Pencil className="size-3.5" />
            </Button>
          ) : null}
        </div>

        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{event.excerpt}</p>

        {event.tags && event.tags.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {event.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-2 py-0.5 text-[11px] text-[color:var(--text-muted)]"
              >
                <Hash className="size-3" />
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  )
}

function ThemeList({ rows }: { rows: ThemeRow[] }) {
  const { t } = useTranslation()
  const total = rows.reduce((sum, row) => sum + row.count, 0)

  if (rows.length === 0) {
    return <EmptyState message={t("events.empty.themes")} compact />
  }

  return (
    <div className="space-y-2">
      {rows.map((row) => {
        const width = total > 0 ? `${Math.max((row.count / total) * 100, 8)}%` : "0%"

        return (
          <div
            key={row.label}
            className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3"
          >
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate font-medium text-[color:var(--text-primary)]">
                {row.label}
              </span>
              <span className="text-xs text-[color:var(--text-muted)]">{row.count}</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[color:var(--chip-bg)]">
              <div
                className="h-full rounded-full bg-[color:var(--event-marker-bg)]"
                style={{ width }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EventEditDialog({
  editing,
  eventsModule,
  onClose,
}: {
  editing: EditingEvent
  eventsModule: EventsModuleData
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveEventsMutation = useSaveEventsMutation()
  const [form, setForm] = useState<EventFormState>(() => createInitialEventForm(editing.event))

  const updateForm = (patch: Partial<EventFormState>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!form.date.trim() || !form.title.trim() || !form.excerpt.trim()) {
      toast.error(t("events.validation.required"))
      return
    }

    const now = new Date().toISOString()
    const content = form.excerpt.trim()
    const nextEvent: EventEntry = {
      id: editing.event?.id ?? createEventId(),
      type: "event",
      createdAt: editing.event?.createdAt ?? now,
      occurredAt: normalizeOccurredAt(form.date),
      status: editing.event?.status ?? "active",
      date: form.date.trim(),
      title: form.title.trim(),
      content,
      excerpt: content,
      theme: form.theme.trim() || t("events.defaults.theme"),
      tags: splitListText(form.tagsText),
    }
    const nextEntries = editing.isNew
      ? [nextEvent, ...eventsModule.entries]
      : eventsModule.entries.map((entry) => (entry.id === nextEvent.id ? nextEvent : entry))

    try {
      await saveEventsMutation.mutateAsync({
        ...eventsModule,
        entries: sortEvents(nextEntries),
      })
      toast.success(t("events.toast.saved"))
      onClose()
    } catch {
      toast.error(t("events.toast.saveFailed"))
    }
  }

  const handleDelete = async () => {
    if (!editing.event) return

    const confirmed = window.confirm(
      t("events.confirm.delete", {
        title: editing.event.title,
      }),
    )

    if (!confirmed) return

    try {
      await saveEventsMutation.mutateAsync({
        ...eventsModule,
        entries: eventsModule.entries.filter((entry) => entry.id !== editing.event?.id),
      })
      toast.success(t("events.toast.deleted"))
      onClose()
    } catch {
      toast.error(t("events.toast.deleteFailed"))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="flex max-h-[min(680px,calc(100dvh-2rem))] max-w-2xl flex-col overflow-hidden border border-[color:var(--surface-border)] bg-[color:var(--dialog-bg)]">
        <DialogHeader className="sticky top-0 z-10 -mx-4 -mt-4 border-b border-[color:var(--surface-border)] bg-[color:var(--dialog-bg)] px-4 pt-4 pr-12 pb-3">
          <DialogTitle>
            {editing.isNew ? t("events.edit.createTitle") : t("events.edit.editTitle")}
          </DialogTitle>
          <DialogDescription>{t("events.edit.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="space-y-4 py-1">
            <EventDialogField label={t("events.fields.date")}>
              <Input
                value={form.date}
                placeholder={t("events.placeholders.date")}
                onChange={(event) => updateForm({ date: event.target.value })}
              />
            </EventDialogField>

            <EventDialogField label={t("events.fields.title")}>
              <Input
                value={form.title}
                placeholder={t("events.placeholders.title")}
                onChange={(event) => updateForm({ title: event.target.value })}
              />
            </EventDialogField>

            <EventDialogField label={t("events.fields.excerpt")}>
              <Textarea
                value={form.excerpt}
                className="min-h-32 resize-none"
                placeholder={t("events.placeholders.excerpt")}
                onChange={(event) => updateForm({ excerpt: event.target.value })}
              />
            </EventDialogField>

            <div className="grid gap-3 min-[640px]:grid-cols-2">
              <EventDialogField label={t("events.fields.theme")}>
                <Input
                  value={form.theme}
                  placeholder={t("events.placeholders.theme")}
                  onChange={(event) => updateForm({ theme: event.target.value })}
                />
              </EventDialogField>

              <EventDialogField label={t("events.fields.tags")}>
                <Input
                  value={form.tagsText}
                  placeholder={t("events.placeholders.tags")}
                  onChange={(event) => updateForm({ tagsText: event.target.value })}
                />
              </EventDialogField>
            </div>
          </div>

          <DialogFooter className="sticky bottom-0 z-10 mt-5 gap-2 border-[color:var(--surface-border)] bg-[color:var(--dialog-bg)]">
            {editing.event ? (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                <Trash2 data-icon="inline-start" />
                {t("events.actions.delete")}
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onClose}>
              {t("events.actions.cancel")}
            </Button>
            <Button type="submit" disabled={saveEventsMutation.isPending}>
              {t("events.actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EventDialogField({ children, label }: { children: ReactNode; label: string }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-[color:var(--text-primary)]">{label}</span>
      {children}
    </label>
  )
}
