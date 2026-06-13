import { useEffect, useMemo, useRef, useState } from "react"
import { m, AnimatePresence } from "motion/react"
import { ChevronLeft, ChevronRight, Play, Square, Pencil, Check, X } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"

import { ActionGroup, AnimatedIconButton } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Surface } from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"
import type {
  CausalNode,
  CivilizationId,
  CivilizationProfile,
  ComparisonPreset,
  WorldHistoryModuleData,
  WorldHistoryTimelineEvent,
} from "@/features/bettertolive/models/workspace"
import { useWorldHistoryQuery } from "@/features/bettertolive/queries/use-world-history-query"
import { useSaveWorldHistoryMutation } from "@/features/bettertolive/queries/use-save-world-history-mutation"
import { StarMapCanvas } from "./star-map-canvas"
import { GanttTimeline } from "./gantt-timeline"
import { CognitiveArena } from "./cognitive-arena"
import { KIND_TO_DIMENSION, NODE_KIND_ORDER } from "./world-history-shared"

interface WorldHistoryPageProps {
  isStackedLayout: boolean
  // 编辑/浏览模式由右上角工具栏的全局开关统一驱动
  isControlMode?: boolean
}

type PanelView = "star" | "gantt" | "arena"

const PANEL_TABS: { key: PanelView; label: string }[] = [
  { key: "star", label: "🌌 星图" },
  { key: "gantt", label: "📊 演进" },
  { key: "arena", label: "⚖️ 对质" },
]

function cloneModule(data: WorldHistoryModuleData): WorldHistoryModuleData {
  return JSON.parse(JSON.stringify(data)) as WorldHistoryModuleData
}

function genId(prefix: string): string {
  const rand =
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.round(Math.random() * 1_000_000)}`
  return `${prefix}-${rand}`
}

function CivilizationSelector({
  civilizations,
  activeId,
  onSelect,
}: {
  civilizations: CivilizationProfile[]
  activeId: CivilizationId
  onSelect: (id: CivilizationId) => void
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {civilizations.map((civ) => {
        const isActive = activeId === civ.id
        return (
          <button
            key={civ.id}
            type="button"
            onClick={() => onSelect(civ.id)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-serif text-xs transition-all",
              isActive
                ? "text-white shadow-sm"
                : "border border-[color:var(--chip-border)] text-[color:var(--text-secondary)] hover:border-[color:var(--primary)] hover:bg-[color:var(--chip-bg)] hover:text-[color:var(--primary)]",
            )}
            style={isActive ? { backgroundColor: civ.color } : undefined}
          >
            <span>{civ.icon}</span>
            <span>{civ.name}</span>
          </button>
        )
      })}
    </div>
  )
}

export function WorldHistoryPage({
  isStackedLayout,
  isControlMode = false,
}: WorldHistoryPageProps) {
  const { t } = useTranslation()
  const { data } = useWorldHistoryQuery()
  const saveMutation = useSaveWorldHistoryMutation()

  const [activeCivilizationId, setActiveCivilizationId] = useState<CivilizationId>("greek")
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [panelView, setPanelView] = useState<PanelView>("star")
  const [narrativeActive, setNarrativeActive] = useState(false)

  const [draft, setDraft] = useState<WorldHistoryModuleData | null>(null)
  const isEditing = isControlMode

  // 编辑态读 draft，否则读查询数据
  const view = isEditing && draft ? draft : data

  // 防抖自动保存所需引用（避免把 mutation / draft 放进 effect 依赖）
  const draftRef = useRef<WorldHistoryModuleData | null>(null)
  const saveRef = useRef(saveMutation)
  const wasEditingRef = useRef(false)

  // 同步 ref（在 effect 中更新，避免渲染期间写 ref）
  useEffect(() => {
    draftRef.current = draft
    saveRef.current = saveMutation
  })

  // 进入编辑：从最新数据初始化草稿；退出编辑：落盘后清空草稿
  useEffect(() => {
    const was = wasEditingRef.current
    wasEditingRef.current = isEditing
    if (!was && isEditing) {
      setDraft(cloneModule(data))
      setNarrativeActive(false)
    } else if (was && !isEditing && draftRef.current) {
      saveRef.current.mutate(draftRef.current)
      setDraft(null)
    }
  }, [isEditing, data])

  // 编辑期间防抖自动保存（输入停顿 600ms 后写盘）
  useEffect(() => {
    if (!isEditing || !draft) return
    const timer = setTimeout(() => {
      saveRef.current.mutate(draft, {
        onError: () => toast.error(t("worldhistory.actions.save", "保存失败，请重试")),
      })
    }, 600)
    return () => clearTimeout(timer)
  }, [draft, isEditing, t])

  const civilizations = view.civilizations
  const activeCiv = useMemo(
    () => civilizations.find((c) => c.id === activeCivilizationId),
    [civilizations, activeCivilizationId],
  )
  const activeNodes = useMemo(
    () => view.causalNodes.filter((n) => n.civilizationId === activeCivilizationId),
    [view.causalNodes, activeCivilizationId],
  )
  const activeLinks = useMemo(
    () => view.causalLinks.filter((l) => l.civilizationId === activeCivilizationId),
    [view.causalLinks, activeCivilizationId],
  )
  const activeEvents = useMemo(
    () => view.timelineEvents.filter((e) => e.civilizationId === activeCivilizationId),
    [view.timelineEvents, activeCivilizationId],
  )

  // 联动：选中节点 → 高亮对质场对应维度
  const selectedNode = activeNodes.find((n) => n.id === selectedNodeId) ?? null
  const highlightedDimension = selectedNode ? KIND_TO_DIMENSION[selectedNode.kind] : null

  // 叙事链：按因果链顺序排列当前文明节点
  const narrativeChain = useMemo(
    () =>
      NODE_KIND_ORDER.map((kind) => activeNodes.find((n) => n.kind === kind)).filter(
        (n): n is CausalNode => Boolean(n),
      ),
    [activeNodes],
  )
  const narrativeIndex = narrativeChain.findIndex((n) => n.id === selectedNodeId)

  function switchCivilization(id: CivilizationId) {
    setActiveCivilizationId(id)
    setSelectedNodeId(null)
    setNarrativeActive(false)
  }

  function toggleNode(id: string) {
    setSelectedNodeId((prev) => (prev === id ? null : id))
  }

  function startNarrative() {
    if (narrativeChain.length === 0) return
    setNarrativeActive(true)
    setPanelView("star")
    setSelectedNodeId(narrativeChain[0].id)
  }

  function stepNarrative(delta: number) {
    if (narrativeChain.length === 0) return
    const current = narrativeIndex < 0 ? 0 : narrativeIndex
    const next = Math.min(Math.max(current + delta, 0), narrativeChain.length - 1)
    setSelectedNodeId(narrativeChain[next].id)
  }

  // ---- 编辑态：草稿增删改 ----

  function beginEdit() {
    setDraft(cloneModule(data))
    setNarrativeActive(false)
  }

  function cancelEdit() {
    setDraft(null)
  }

  async function saveEdit() {
    if (!draft) return
    try {
      await saveMutation.mutateAsync(draft)
      setDraft(null)
      toast.success(t("worldhistory.actions.save", "已保存"))
    } catch {
      toast.error(t("worldhistory.actions.save", "保存失败，请重试"))
    }
  }

  function patchDraft(patch: (d: WorldHistoryModuleData) => WorldHistoryModuleData) {
    setDraft((prev) => (prev ? patch(prev) : prev))
  }

  function updateNode(
    nodeId: string,
    patch: Partial<Pick<CausalNode, "label" | "description" | "causalExplanation">>,
  ) {
    patchDraft((d) => ({
      ...d,
      causalNodes: d.causalNodes.map((n) => (n.id === nodeId ? { ...n, ...patch } : n)),
    }))
  }

  function updateCivSummary(value: string) {
    patchDraft((d) => ({
      ...d,
      civilizations: d.civilizations.map((c) =>
        c.id === activeCivilizationId ? { ...c, summary: value } : c,
      ),
    }))
  }

  function addEvent() {
    const event: WorldHistoryTimelineEvent = {
      id: genId("t"),
      civilizationId: activeCivilizationId,
      year: 0,
      label: t("worldhistory.event.newLabel", "新事件"),
      summary: "",
    }
    patchDraft((d) => ({ ...d, timelineEvents: [...d.timelineEvents, event] }))
  }

  function updateEvent(
    id: string,
    patch: Partial<Pick<WorldHistoryTimelineEvent, "year" | "label" | "summary">>,
  ) {
    patchDraft((d) => ({
      ...d,
      timelineEvents: d.timelineEvents.map((e) => (e.id === id ? { ...e, ...patch } : e)),
    }))
  }

  function deleteEvent(id: string) {
    patchDraft((d) => ({ ...d, timelineEvents: d.timelineEvents.filter((e) => e.id !== id) }))
  }

  function addPreset(civA: CivilizationId, civB: CivilizationId) {
    const preset: ComparisonPreset = {
      id: genId("preset"),
      title: t("worldhistory.preset.newLabel", "新判词"),
      civA,
      civB,
      thesis: "",
      analysis: "",
      conclusion: "",
    }
    patchDraft((d) => ({ ...d, comparisonPresets: [...d.comparisonPresets, preset] }))
  }

  function updatePreset(
    id: string,
    patch: Partial<Pick<ComparisonPreset, "title" | "thesis" | "analysis" | "conclusion">>,
  ) {
    patchDraft((d) => ({
      ...d,
      comparisonPresets: d.comparisonPresets.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }))
  }

  function deletePreset(id: string) {
    patchDraft((d) => ({
      ...d,
      comparisonPresets: d.comparisonPresets.filter((p) => p.id !== id),
    }))
  }

  const showNarrativeBar = !isEditing && panelView === "star" && narrativeChain.length > 0

  return (
    <div className={cn("flex flex-col gap-4 font-sans", isStackedLayout ? "" : "h-full min-h-0")}>
      {/* 标题 + 文明切换 + 编辑入口 */}
      <div
        className={cn(
          "flex shrink-0 items-start justify-between gap-3",
          isStackedLayout ? "flex-col" : "flex-row",
        )}
      >
        <div>
          <h2 className="font-serif text-xl font-semibold tracking-tight text-[color:var(--text-primary)]">
            {t("worldhistory.title", "人类文明地缘因果星图")}
          </h2>
          <p className="mt-1 font-sans text-xs text-[color:var(--text-muted)]">
            {t("worldhistory.subtitle", "地缘唯物主义视角下的跨文化比较")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CivilizationSelector
            civilizations={civilizations}
            activeId={activeCivilizationId}
            onSelect={switchCivilization}
          />
          <ActionGroup gap="compact" wrap={false}>
            <AnimatedIconButton
              show={!isEditing}
              variant="ghost"
              size="icon-sm"
              label={t("worldhistory.actions.edit", "编辑")}
              icon={<Pencil className="size-3.5" />}
              onClick={beginEdit}
            />
            <AnimatedIconButton
              show={isEditing}
              variant="default"
              size="icon-sm"
              disabled={saveMutation.isPending}
              label={
                saveMutation.isPending
                  ? t("worldhistory.actions.saving", "保存中…")
                  : t("worldhistory.actions.save", "保存")
              }
              icon={<Check className="size-3.5" />}
              onClick={saveEdit}
            />
            <AnimatedIconButton
              show={isEditing}
              variant="outline"
              size="icon-sm"
              label={t("worldhistory.actions.cancel", "取消")}
              icon={<X className="size-3.5" />}
              onClick={cancelEdit}
            />
          </ActionGroup>
        </div>
      </div>

      {/* 当前文明摘要 */}
      <AnimatePresence mode="wait">
        {activeCiv && (
          <m.div
            key={activeCiv.id}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="shrink-0 rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-4"
          >
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg font-serif text-lg"
                style={{
                  backgroundColor: `color-mix(in srgb, ${activeCiv.color} 12%, transparent)`,
                  color: activeCiv.color,
                }}
              >
                {activeCiv.icon}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <h3 className="font-serif text-sm font-semibold text-[color:var(--text-primary)]">
                    {activeCiv.name}
                  </h3>
                  <span className="font-mono text-[10px] text-[color:var(--text-muted)]">
                    {activeCiv.nameEn}
                  </span>
                </div>
                <div className="mt-1 font-mono text-[10px] text-[color:var(--text-muted)]">
                  {activeCiv.era} · {activeCiv.location}
                </div>
                {isEditing ? (
                  <textarea
                    value={activeCiv.summary}
                    onChange={(e) => updateCivSummary(e.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-md border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-2 py-1 font-sans text-xs leading-relaxed text-[color:var(--text-secondary)]"
                  />
                ) : (
                  <p className="mt-2 font-sans text-xs leading-relaxed text-[color:var(--text-secondary)]">
                    {activeCiv.summary}
                  </p>
                )}
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* 面板切换 + 叙事导览 */}
      <div className="flex shrink-0 flex-col gap-2">
        <Tabs value={panelView} onValueChange={(v) => setPanelView(v as PanelView)}>
          <TabsList className="w-full">
            {PANEL_TABS.map((tab) => (
              <TabsTrigger key={tab.key} value={tab.key} className="flex-1">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {showNarrativeBar && (
          <Surface className="flex items-center justify-between gap-2 bg-[color:var(--muted-surface-bg)] px-3 py-1.5">
            {narrativeActive ? (
              <>
                <button
                  type="button"
                  onClick={() => stepNarrative(-1)}
                  disabled={narrativeIndex <= 0}
                  className="flex items-center gap-1 font-mono text-[11px] text-[color:var(--text-secondary)] disabled:opacity-40"
                >
                  <ChevronLeft className="size-3.5" />
                  {t("worldhistory.narrative.prev", "上一步")}
                </button>
                <span className="font-mono text-[11px] text-[color:var(--text-muted)]">
                  {t("worldhistory.narrative.counter", "因果链 {{current}} / {{total}}", {
                    current: Math.max(narrativeIndex, 0) + 1,
                    total: narrativeChain.length,
                  })}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => stepNarrative(1)}
                    disabled={narrativeIndex >= narrativeChain.length - 1}
                    className="flex items-center gap-1 font-mono text-[11px] text-[color:var(--text-secondary)] disabled:opacity-40"
                  >
                    {t("worldhistory.narrative.next", "下一步")}
                    <ChevronRight className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setNarrativeActive(false)}
                    className="flex items-center gap-1 font-mono text-[11px] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
                  >
                    <Square className="size-3" />
                    {t("worldhistory.narrative.stop", "结束")}
                  </button>
                </div>
              </>
            ) : (
              <button
                type="button"
                onClick={startNarrative}
                className="flex items-center gap-1.5 font-mono text-[11px] text-[color:var(--primary)]"
              >
                <Play className="size-3" />
                {t("worldhistory.narrative.start", "沿因果链逐步导览")}
              </button>
            )}
          </Surface>
        )}
      </div>

      {/* 当前面板：桌面内部独立滚动，窄屏给定最小高度随整页滚动 */}
      <Surface
        className={cn("overflow-hidden p-4", isStackedLayout ? "min-h-[60vh]" : "min-h-0 flex-1")}
      >
        {panelView === "star" && (
          <StarMapCanvas
            civilization={activeCiv}
            nodes={activeNodes}
            links={activeLinks}
            selectedNodeId={selectedNodeId}
            onSelectNode={toggleNode}
            isEditing={isEditing}
            onUpdateNode={updateNode}
          />
        )}
        {panelView === "gantt" && (
          <GanttTimeline
            civilization={activeCiv}
            events={activeEvents}
            isEditing={isEditing}
            onAddEvent={addEvent}
            onUpdateEvent={updateEvent}
            onDeleteEvent={deleteEvent}
          />
        )}
        {panelView === "arena" && (
          <CognitiveArena
            civilizations={civilizations}
            activeCivilizationId={activeCivilizationId}
            comparisonPresets={view.comparisonPresets}
            highlightedDimension={highlightedDimension}
            isEditing={isEditing}
            onAddPreset={addPreset}
            onUpdatePreset={updatePreset}
            onDeletePreset={deletePreset}
          />
        )}
      </Surface>
    </div>
  )
}
