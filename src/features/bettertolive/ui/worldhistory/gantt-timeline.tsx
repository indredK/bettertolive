import { useMemo, useRef, useState, useCallback } from "react"
import { m, AnimatePresence } from "motion/react"
import { Plus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { EmptyState } from "@/features/bettertolive/ui/shared/shared"
import { confirmUndoableDelete } from "@/features/bettertolive/ui/shopping/shopping-delete"
import type {
  CivilizationProfile,
  WorldHistoryTimelineEvent,
} from "@/features/bettertolive/models/workspace"

interface GanttTimelineProps {
  civilization: CivilizationProfile | undefined
  events: WorldHistoryTimelineEvent[]
  isEditing?: boolean
  onAddEvent?: () => void
  onUpdateEvent?: (
    id: string,
    patch: Partial<Pick<WorldHistoryTimelineEvent, "year" | "label" | "summary">>,
  ) => void
  onDeleteEvent?: (id: string) => void
}

type TimelineMode = "gantt" | "tree"

export function GanttTimeline({
  civilization,
  events,
  isEditing = false,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
}: GanttTimelineProps) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<TimelineMode>("gantt")

  function formatYear(year: number): string {
    return year < 0
      ? `${t("worldhistory.gantt.bc", "公元前")}${Math.abs(year)}`
      : `${t("worldhistory.gantt.ad", "公元")}${year}`
  }
  const [tooltipEvent, setTooltipEvent] = useState<WorldHistoryTimelineEvent | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  const color = civilization?.color ?? "var(--primary)"

  const sortedEvents = useMemo(() => [...events].sort((a, b) => a.year - b.year), [events])

  const handleEventHover = useCallback((event: WorldHistoryTimelineEvent, e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    setTooltipEvent(event)
    setTooltipPos({ x: e.clientX - rect.left + 12, y: e.clientY - rect.top - 20 })
  }, [])

  const yearRange = useMemo(() => {
    if (sortedEvents.length === 0) return { min: -3500, max: 2000, span: 5500 }
    const years = sortedEvents.map((e) => e.year)
    const min = Math.min(...years) - 200
    const max = Math.max(...years) + 200
    return { min, max, span: max - min }
  }, [sortedEvents])

  const ganttPosition = (year: number) => ((year - yearRange.min) / yearRange.span) * 100

  // 编辑态强制使用树视图（便于逐条改写/删除/新增）
  const effectiveMode: TimelineMode = isEditing ? "tree" : mode

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <h3 className="font-serif text-base font-semibold tracking-wide text-[color:var(--text-primary)]">
          {civilization?.icon} {civilization?.name} {t("worldhistory.gantt.suffix", "演进时间轴")}
        </h3>
        {isEditing ? (
          <Button size="sm" onClick={onAddEvent}>
            <Plus className="size-3" />
            {t("worldhistory.gantt.addEvent", "新增事件")}
          </Button>
        ) : (
          <Tabs value={mode} onValueChange={(v) => setMode(v as TimelineMode)}>
            <TabsList>
              <TabsTrigger value="gantt">
                {t("worldhistory.gantt.ganttMode", "甘特横轴")}
              </TabsTrigger>
              <TabsTrigger value="tree">{t("worldhistory.gantt.treeMode", "因果树")}</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </div>

      <div
        ref={containerRef}
        className="relative min-h-0 flex-1 overflow-auto rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--muted-surface-bg)] p-4"
      >
        {effectiveMode === "gantt" ? (
          <div className="relative min-h-full">
            {/* 时间刻度 */}
            <div className="absolute inset-x-0 top-0 h-8 border-b border-[color:var(--surface-border)]">
              <div className="flex h-full items-end pb-1">
                {Array.from({ length: 6 }).map((_, i) => {
                  const yr = Math.round(yearRange.min + (yearRange.span / 5) * i)
                  return (
                    <div
                      key={i}
                      className="absolute font-mono text-[9px] text-[color:var(--text-muted)]"
                      style={{ left: `${(i / 5) * 100}%`, transform: "translateX(-50%)" }}
                    >
                      {yr < 0 ? `前${Math.abs(yr)}` : `${yr}`}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 当前文明事件轴 */}
            <div className="relative mt-12 h-20">
              <div className="absolute top-8 h-px w-full bg-[color:var(--surface-border)]" />
              {sortedEvents.map((event) => {
                const pct = ganttPosition(event.year)
                return (
                  <div
                    key={event.id}
                    className="absolute flex flex-col items-center"
                    style={{ left: `${pct}%`, top: 0, transform: "translateX(-50%)" }}
                  >
                    <div className="h-3 w-1 rounded-full" style={{ backgroundColor: color }} />
                    <div
                      className="mt-1 size-2.5 cursor-pointer rounded-full shadow-sm transition-transform hover:scale-125"
                      style={{ backgroundColor: color }}
                      onMouseEnter={(e) => handleEventHover(event, e)}
                      onMouseLeave={() => setTooltipEvent(null)}
                    />
                    <div className="mt-1 h-10 w-px bg-[color:var(--surface-border)]" />
                    <span className="mt-0.5 max-w-[60px] text-center font-sans text-[9px] leading-tight text-[color:var(--text-secondary)]">
                      {event.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* 因果树模式：当前文明的纵向链路；编辑态可逐条改写 / 删除 */
          <div className="ml-4 border-l-2 border-[color:var(--surface-border)] pl-6">
            {sortedEvents.map((event) => (
              <div
                key={event.id}
                className="relative mb-3 last:mb-0"
                onMouseEnter={(e) => (isEditing ? undefined : handleEventHover(event, e))}
                onMouseLeave={() => setTooltipEvent(null)}
              >
                <div
                  className="absolute top-1.5 -left-[29px] size-2 rounded-full ring-1 ring-[color:var(--surface-bg)]"
                  style={{ backgroundColor: color }}
                />
                {isEditing && onUpdateEvent && onDeleteEvent ? (
                  <div className="space-y-1.5 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={event.year}
                        onChange={(e) => onUpdateEvent(event.id, { year: Number(e.target.value) })}
                        className="w-24 font-mono text-[10px]"
                      />
                      <Input
                        value={event.label}
                        onChange={(e) => onUpdateEvent(event.id, { label: e.target.value })}
                        placeholder={t("worldhistory.event.namePlaceholder", "事件名称")}
                        className="flex-1 font-serif text-xs"
                      />
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          confirmUndoableDelete({
                            confirmMessage: t(
                              "worldhistory.event.deleteAria",
                              "确定删除这个事件吗？",
                            ),
                            pendingMessage: "已加入删除队列，5 秒内可撤销",
                            successMessage: "已删除事件",
                            failureMessage: "删除事件失败",
                            undoLabel: "撤销",
                            undoneMessage: "已撤销删除",
                            onDelete: () => Promise.resolve(onDeleteEvent(event.id)),
                          })
                        }}
                        className="shrink-0 text-[color:var(--text-muted)] hover:text-[color:var(--destructive)]"
                        aria-label={t("worldhistory.event.deleteAria", "删除事件")}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                    <Textarea
                      value={event.summary}
                      onChange={(e) => onUpdateEvent(event.id, { summary: e.target.value })}
                      placeholder={t("worldhistory.event.summaryPlaceholder", "事件摘要")}
                      rows={2}
                      className="font-sans text-[11px]"
                    />
                  </div>
                ) : (
                  <>
                    <div className="font-mono text-[10px] text-[color:var(--text-muted)]">
                      {formatYear(event.year)}
                    </div>
                    <div className="font-serif text-xs font-semibold text-[color:var(--text-primary)]">
                      {event.label}
                    </div>
                    <div className="mt-0.5 font-sans text-[11px] leading-relaxed text-[color:var(--text-secondary)]">
                      {event.summary}
                    </div>
                  </>
                )}
              </div>
            ))}
            {sortedEvents.length === 0 && (
              <EmptyState message={t("worldhistory.gantt.noEvents", "暂无事件")} compact />
            )}
          </div>
        )}

        {/* 悬浮提示（非编辑态） */}
        <AnimatePresence>
          {tooltipEvent && (
            <m.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="pointer-events-none absolute z-[50] w-56 rounded-lg border border-[color:var(--surface-border)] p-3 shadow-xl"
              style={{
                left: tooltipPos.x,
                top: tooltipPos.y,
                backgroundColor: "var(--hero-bg)",
                color: "var(--hero-ink)",
              }}
            >
              <div className="mb-1 font-mono text-[10px]" style={{ color: "var(--hero-muted)" }}>
                {formatYear(tooltipEvent.year)}
              </div>
              <div
                className="font-serif text-xs font-semibold"
                style={{ color: "var(--hero-ink)" }}
              >
                {tooltipEvent.label}
              </div>
              <div
                className="mt-1 font-sans text-[11px] leading-relaxed"
                style={{ color: "var(--hero-muted)" }}
              >
                {tooltipEvent.summary}
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
