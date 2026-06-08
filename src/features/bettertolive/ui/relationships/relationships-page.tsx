import {
  Activity,
  MessageCircleMore,
  Network,
  Pencil,
  Plus,
  Trash2,
  Users2,
  Waypoints,
  type LucideIcon,
} from "lucide-react"
import type { ReactNode } from "react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSaveRelationshipsMutation } from "@/features/bettertolive/queries/use-save-relationships-mutation"
import type {
  RelationshipCircle,
  RelationshipMap,
  RelationshipPattern,
  RelationshipPerson,
  RelationshipUnsentNote,
  UnfinishedWeight,
} from "@/features/bettertolive/types"
import {
  CytoscapeGraph,
  type CytoscapeThemeTokens,
} from "@/features/bettertolive/ui/shared/cytoscape-graph"
import { EmptyState, SectionHeading, Surface } from "@/features/bettertolive/ui/shared/shared"
import { confirmUndoableDelete } from "@/features/bettertolive/ui/shopping/shopping-delete"
import {
  type EditingRelationship,
  type EditingRelationshipPattern,
  type EditingUnsentNote,
  RelationshipEditDialog,
  RelationshipPatternEditDialog,
  UnsentNoteEditDialog,
} from "@/features/bettertolive/ui/relationships/relationship-edit-dialogs"
import {
  INTERACTION_FREQUENCIES,
  RELATIONSHIP_DEPTHS,
  RELATIONSHIP_IMPACTS,
  RELATIONSHIP_SELECT_CONTENT_CLASS,
  RELATIONSHIP_STAGES,
  RELATIONSHIP_TYPES,
  UNFINISHED_WEIGHTS,
  translateRelationshipEnum,
  type RelationshipEnumGroup,
} from "@/features/bettertolive/ui/relationships/relationships-page-data"
import { cn } from "@/lib/utils"

type DistributionRow = {
  label: string
  count: number
}

type ClassificationSection = {
  key: string
  title: string
  description: string
  rows: DistributionRow[]
}

const WEIGHT_ORDER = new Map<UnfinishedWeight, number>([
  ["很重", 0],
  ["中等", 1],
  ["轻微", 2],
  ["无", 3],
])

const RELATIONSHIP_GRAPH_LAYOUT = {
  animate: false,
  edgeElasticity: 110,
  fit: true,
  gravity: 0.28,
  idealEdgeLength: 138,
  name: "cose",
  nodeRepulsion: 16000,
  numIter: 950,
  padding: 56,
} as const

function createRelationshipsGraphStylesheet(theme: CytoscapeThemeTokens) {
  return [
    {
      selector: "node",
      style: {
        "background-color": theme.surfaceBg,
        "border-color": theme.surfaceBorder,
        "border-width": 1.3,
        color: theme.textPrimary,
        "font-family": "Geist Variable",
        "font-size": 13,
        label: "data(label)",
        "line-height": 1.24,
        "min-zoomed-font-size": 11,
        "overlay-opacity": 0,
        "padding-bottom": 10,
        "padding-left": 10,
        "padding-right": 10,
        "padding-top": 10,
        "text-halign": "center",
        "text-max-width": 140,
        "text-outline-width": 0,
        "text-valign": "center",
        "text-wrap": "wrap",
      },
    },
    {
      selector: "node[kind = 'relationship']",
      style: {
        "background-color": theme.mutedSurfaceBg,
        "border-width": 1.5,
        height: "mapData(weight, 1, 5, 64, 92)",
        shape: "round-rectangle",
        width: "mapData(weight, 1, 5, 124, 166)",
      },
    },
    {
      selector: "node[kind = 'relationship'][impact = '滋养']",
      style: {
        "background-color": theme.tonePresentBg,
        "border-color": theme.tonePresentBorder,
      },
    },
    {
      selector: "node[kind = 'relationship'][impact = '消耗']",
      style: {
        "background-color": theme.toneFutureBg,
        "border-color": theme.toneFutureBorder,
      },
    },
    {
      selector: "node[kind = 'relationship'][impact = '混合']",
      style: {
        "background-color": theme.toneValueBg,
        "border-color": theme.toneValueBorder,
      },
    },
    {
      selector: "node[kind = 'relationship'][impact = '中性']",
      style: {
        "background-color": theme.surfaceBg,
        "border-color": theme.mutedSurfaceBorder,
      },
    },
    {
      selector: "node:selected",
      style: {
        "border-color": theme.accent,
        "border-width": 2.7,
        "shadow-blur": 18,
        "shadow-color": theme.accent,
        "shadow-opacity": 0.28,
        "shadow-offset-x": 0,
        "shadow-offset-y": 8,
      },
    },
    {
      selector: "edge",
      style: {
        "curve-style": "bezier",
        "line-color": theme.chipBorder,
        opacity: 0.72,
        "overlay-opacity": 0,
        "target-arrow-color": theme.chipBorder,
        "target-arrow-shape": "triangle",
        width: "mapData(weight, 1, 5, 1.8, 3.2)",
      },
    },
    {
      selector: "edge[linkKind = 'sameCircle']",
      style: {
        "line-color": theme.tonePastBorder,
        "target-arrow-color": theme.tonePastBorder,
      },
    },
    {
      selector: "edge[linkKind = 'pattern']",
      style: {
        "line-color": theme.toneValueBorder,
        "line-style": "dashed",
        "target-arrow-color": theme.toneValueBorder,
      },
    },
    {
      selector: "edge[linkKind = 'mixed']",
      style: {
        "line-color": theme.accent,
        "target-arrow-color": theme.accent,
        width: "mapData(weight, 1, 6, 2.2, 4.4)",
      },
    },
  ]
}

export function RelationshipsPage({
  editableRelationshipsModule,
  relationshipsModule,
  isStackedLayout = false,
  isControlMode = false,
  onRefresh,
}: {
  editableRelationshipsModule?: RelationshipMap
  relationshipsModule: RelationshipMap
  searchQuery: string
  isStackedLayout?: boolean
  isControlMode?: boolean
  onRefresh?: () => void
}) {
  const { t } = useTranslation()
  const saveRelationshipsMutation = useSaveRelationshipsMutation()
  const sourceRelationshipsModule = editableRelationshipsModule ?? relationshipsModule
  const relationships = useMemo(() => getRelationships(relationshipsModule), [relationshipsModule])
  const relationshipById = useMemo(() => createRelationshipLookup(relationships), [relationships])
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(
    () => relationships[0]?.id ?? null,
  )
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    () => relationshipsModule.unsentNotes[0]?.id ?? null,
  )
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(
    () => relationshipsModule.patterns[0]?.id ?? null,
  )
  const [editingRelationship, setEditingRelationship] = useState<EditingRelationship | null>(null)
  const [editingNote, setEditingNote] = useState<EditingUnsentNote | null>(null)
  const [editingPattern, setEditingPattern] = useState<EditingRelationshipPattern | null>(null)

  const selectedRelationship =
    relationships.find((relationship) => relationship.id === selectedRelationshipId) ??
    relationships[0] ??
    null
  const selectedNote =
    relationshipsModule.unsentNotes.find((note) => note.id === selectedNoteId) ??
    relationshipsModule.unsentNotes[0] ??
    null
  const selectedPattern =
    relationshipsModule.patterns.find((pattern) => pattern.id === selectedPatternId) ??
    relationshipsModule.patterns[0] ??
    null

  const classificationSections = useMemo(
    () =>
      [
        {
          key: "type",
          title: t("relationships.overview.typeTitle", "类型"),
          description: t("relationships.overview.typeDescription", "这个人的纽带本质是什么。"),
          rows: createDistribution(
            RELATIONSHIP_TYPES,
            relationships,
            (relationship) => relationship.type,
          ),
        },
        {
          key: "depth",
          title: t("relationships.overview.depthTitle", "深度"),
          description: t("relationships.overview.depthDescription", "我在这段关系里有多敞开。"),
          rows: createDistribution(
            RELATIONSHIP_DEPTHS,
            relationships,
            (relationship) => relationship.depth,
          ),
        },
        {
          key: "stage",
          title: t("relationships.overview.stageTitle", "阶段"),
          description: t("relationships.overview.stageDescription", "这段关系现在在往哪里走。"),
          rows: createDistribution(
            RELATIONSHIP_STAGES,
            relationships,
            (relationship) => relationship.stage,
          ),
        },
        {
          key: "impact",
          title: t("relationships.overview.impactTitle", "影响"),
          description: t("relationships.overview.impactDescription", "它滋养、消耗，还是混合。"),
          rows: createDistribution(
            RELATIONSHIP_IMPACTS,
            relationships,
            (relationship) => relationship.impact,
          ),
        },
        {
          key: "interaction",
          title: t("relationships.overview.interactionTitle", "互动频率"),
          description: t("relationships.overview.interactionDescription", "多久会联系一次。"),
          rows: createDistribution(
            INTERACTION_FREQUENCIES,
            relationships,
            (relationship) => relationship.interaction,
          ),
        },
      ] satisfies ClassificationSection[],
    [relationships, t],
  )
  const unfinishedRows = useMemo(
    () =>
      createDistribution(
        UNFINISHED_WEIGHTS,
        relationships,
        (relationship) => relationship.unfinishedWeight,
      ),
    [relationships],
  )
  const sortedUnsentNotes = useMemo(
    () => sortUnsentNotes(relationshipsModule.unsentNotes),
    [relationshipsModule.unsentNotes],
  )

  const handleDeleted = () => {
    onRefresh?.()
  }

  const deleteRelationship = (relationship: RelationshipPerson) => {
    const nextModule = removeRelationship(sourceRelationshipsModule, relationship.id)

    confirmUndoableDelete({
      confirmMessage: t("relationships.confirm.deleteRelationship", {
        name: relationship.name,
        defaultValue: `确定删除 ${relationship.name} 吗？`,
      }),
      pendingMessage: t("relationships.toast.deleteRelationshipPending", {
        name: relationship.name,
        defaultValue: `已加入删除队列：${relationship.name}，5 秒内可撤销`,
      }),
      successMessage: t("relationships.toast.deleteRelationshipSuccess", {
        name: relationship.name,
        defaultValue: `已删除关系：${relationship.name}`,
      }),
      failureMessage: t("relationships.toast.deleteRelationshipFailed", "删除关系失败"),
      undoLabel: t("relationships.common.undo", "撤销"),
      undoneMessage: t("relationships.toast.deleteRelationshipUndone", {
        name: relationship.name,
        defaultValue: `已撤销删除：${relationship.name}`,
      }),
      onDelete: () => saveRelationshipsMutation.mutateAsync(nextModule),
      onDeleted: () => {
        setSelectedRelationshipId(null)
        handleDeleted()
      },
    })
  }

  const deleteNote = (note: RelationshipUnsentNote) => {
    const nextModule = syncUnsentLineRefs({
      ...sourceRelationshipsModule,
      unsentNotes: sourceRelationshipsModule.unsentNotes.filter((entry) => entry.id !== note.id),
    })

    confirmUndoableDelete({
      confirmMessage: t("relationships.confirm.deleteNote", "确定删除这条想说的话吗？"),
      pendingMessage: t("relationships.toast.deleteNotePending", "已加入删除队列，5 秒内可撤销"),
      successMessage: t("relationships.toast.deleteNoteSuccess", "已删除想说的话"),
      failureMessage: t("relationships.toast.deleteNoteFailed", "删除想说的话失败"),
      undoLabel: t("relationships.common.undo", "撤销"),
      undoneMessage: t("relationships.toast.deleteNoteUndone", "已撤销删除"),
      onDelete: () => saveRelationshipsMutation.mutateAsync(nextModule),
      onDeleted: () => {
        setSelectedNoteId(null)
        handleDeleted()
      },
    })
  }

  const deletePattern = (pattern: RelationshipPattern) => {
    const nextModule = {
      ...sourceRelationshipsModule,
      patterns: sourceRelationshipsModule.patterns.filter((entry) => entry.id !== pattern.id),
    }

    confirmUndoableDelete({
      confirmMessage: t("relationships.confirm.deletePattern", "确定删除这个关系模式吗？"),
      pendingMessage: t("relationships.toast.deletePatternPending", "已加入删除队列，5 秒内可撤销"),
      successMessage: t("relationships.toast.deletePatternSuccess", "已删除关系模式"),
      failureMessage: t("relationships.toast.deletePatternFailed", "删除关系模式失败"),
      undoLabel: t("relationships.common.undo", "撤销"),
      undoneMessage: t("relationships.toast.deletePatternUndone", "已撤销删除"),
      onDelete: () => saveRelationshipsMutation.mutateAsync(nextModule),
      onDeleted: () => {
        setSelectedPatternId(null)
        handleDeleted()
      },
    })
  }

  return (
    <div
      className={cn(
        "space-y-5",
        !isStackedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className={cn("min-h-0 flex-1", !isStackedLayout && "flex flex-col overflow-hidden")}
      >
        <TabsList className="hide-scrollbar max-w-full shrink-0 justify-start overflow-x-auto">
          <TabsTrigger value="overview">{t("relationships.tabs.overview", "总览")}</TabsTrigger>
          <TabsTrigger value="graph">{t("relationships.tabs.graph", "关系图谱")}</TabsTrigger>
          <TabsTrigger value="directory">
            {t("relationships.tabs.directory", "关系档案")}
          </TabsTrigger>
          <TabsTrigger value="unsent">{t("relationships.tabs.unsent", "想说的话")}</TabsTrigger>
          <TabsTrigger value="patterns">
            {t("relationships.tabs.patterns", "跨关系模式")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className={tabContentClassName(isStackedLayout)}>
          <RelationshipsOverviewTab
            classificationSections={classificationSections}
            relationships={relationships}
            unfinishedRows={unfinishedRows}
          />
        </TabsContent>

        <TabsContent value="graph" className={tabContentClassName(isStackedLayout)}>
          <RelationshipsGraphTab
            isControlMode={isControlMode}
            onEditRelationship={(relationship, circleId) =>
              setEditingRelationship({ isNew: false, circleId, relationship })
            }
            relationshipById={relationshipById}
            relationships={relationships}
            relationshipsModule={relationshipsModule}
          />
        </TabsContent>

        <TabsContent value="directory" className={tabContentClassName(isStackedLayout)}>
          <RelationshipsDirectoryTab
            isControlMode={isControlMode}
            relationshipsModule={relationshipsModule}
            selectedRelationship={selectedRelationship}
            sortedUnsentNotes={sortedUnsentNotes}
            onCreate={() =>
              setEditingRelationship({
                isNew: true,
                circleId: sourceRelationshipsModule.circles[0]?.id ?? "",
                relationship: null,
              })
            }
            onDelete={deleteRelationship}
            onEdit={(relationship, circleId) =>
              setEditingRelationship({ isNew: false, circleId, relationship })
            }
            onSelect={setSelectedRelationshipId}
          />
        </TabsContent>

        <TabsContent value="unsent" className={tabContentClassName(isStackedLayout)}>
          <UnsentNotesTab
            isControlMode={isControlMode}
            notes={sortedUnsentNotes}
            relationshipById={relationshipById}
            selectedNote={selectedNote}
            onCreate={() => setEditingNote({ isNew: true, note: null })}
            onDelete={deleteNote}
            onEdit={(note) => setEditingNote({ isNew: false, note })}
            onSelect={setSelectedNoteId}
          />
        </TabsContent>

        <TabsContent value="patterns" className={tabContentClassName(isStackedLayout)}>
          <PatternsTab
            isControlMode={isControlMode}
            patterns={relationshipsModule.patterns}
            selectedPattern={selectedPattern}
            onCreate={() => setEditingPattern({ isNew: true, pattern: null })}
            onDelete={deletePattern}
            onEdit={(pattern) => setEditingPattern({ isNew: false, pattern })}
            onSelect={setSelectedPatternId}
          />
        </TabsContent>
      </Tabs>

      {editingRelationship ? (
        <RelationshipEditDialog
          key={editingRelationship.relationship?.id ?? "new-relationship"}
          editing={editingRelationship}
          relationshipsModule={sourceRelationshipsModule}
          onClose={() => setEditingRelationship(null)}
          onSaved={handleDeleted}
        />
      ) : null}

      {editingNote ? (
        <UnsentNoteEditDialog
          key={editingNote.note?.id ?? "new-unsent-note"}
          editing={editingNote}
          relationshipsModule={sourceRelationshipsModule}
          onClose={() => setEditingNote(null)}
          onSaved={handleDeleted}
        />
      ) : null}

      {editingPattern ? (
        <RelationshipPatternEditDialog
          key={editingPattern.pattern?.id ?? "new-pattern"}
          editing={editingPattern}
          relationshipsModule={sourceRelationshipsModule}
          onClose={() => setEditingPattern(null)}
          onSaved={handleDeleted}
        />
      ) : null}
    </div>
  )
}

function RelationshipsOverviewTab({
  classificationSections,
  relationships,
  unfinishedRows,
}: {
  classificationSections: ClassificationSection[]
  relationships: RelationshipPerson[]
  unfinishedRows: DistributionRow[]
}) {
  const { t } = useTranslation()
  const highWeightCount = relationships.filter((item) => item.unfinishedWeight === "很重").length
  const repairCount = relationships.filter(
    (item) => item.stage === "紧张" || item.stage === "修复中",
  ).length
  const nourishingCount = relationships.filter((item) => item.impact === "滋养").length
  const drainingCount = relationships.filter((item) => item.impact === "消耗").length

  return (
    <div className="h-full min-h-0 overflow-y-auto pr-1">
      <div className="grid min-h-full gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Surface className="p-5">
          <SectionHeading
            icon={Waypoints}
            title={t("relationships.overview.classificationHeading", "5 维关系分类")}
            description={t(
              "relationships.overview.classificationDescription",
              "这些维度负责分组和观察关系世界；未完成重量留在详情和想说的话里。",
            )}
          />

          <div className="mt-5 grid gap-3 min-[760px]:grid-cols-2 min-[1280px]:grid-cols-5">
            {classificationSections.map((section) => (
              <ClassificationPanel
                key={section.key}
                section={section}
                total={relationships.length}
              />
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4">
            <div className="text-sm font-medium text-[color:var(--text-primary)]">
              {t("relationships.overview.unfinishedHeading", "未完成重量")}
            </div>
            <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
              {t(
                "relationships.overview.unfinishedDescription",
                "未完成重量是单段关系的评估属性，用来判断还有多少没说完的话，不进入主筛选器。",
              )}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {unfinishedRows
                .filter((row) => row.count > 0)
                .map((row) => (
                  <Badge
                    key={row.label}
                    variant="outline"
                    className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
                  >
                    {translateRelationshipEnum(t, "unfinishedWeight", row.label)} · {row.count}
                  </Badge>
                ))}
            </div>
          </div>
        </Surface>

        <div className="grid gap-3 min-[760px]:grid-cols-4 xl:grid-cols-1">
          <InsightMetric
            label={t("relationships.overview.nourishing", "滋养")}
            value={nourishingCount}
            detail={t("relationships.overview.nourishingDetail", "让人恢复或更有力量的关系")}
          />
          <InsightMetric
            label={t("relationships.overview.draining", "消耗")}
            value={drainingCount}
            detail={t("relationships.overview.drainingDetail", "需要边界或重新判断的关系")}
          />
          <InsightMetric
            label={t("relationships.overview.repairing", "紧张 / 修复")}
            value={repairCount}
            detail={t("relationships.overview.repairingDetail", "当前最适合被温和检查的关系")}
          />
          <InsightMetric
            label={t("relationships.overview.heavy", "很重")}
            value={highWeightCount}
            detail={t("relationships.overview.heavyDetail", "优先写下或处理的未完成表达")}
          />
        </div>
      </div>
    </div>
  )
}

function ClassificationPanel({
  section,
  total,
}: {
  section: ClassificationSection
  total: number
}) {
  const { t } = useTranslation()
  const visibleRows = section.rows.filter((row) => row.count > 0)

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
      <div className="text-sm font-medium text-[color:var(--text-primary)]">{section.title}</div>
      <p className="mt-1 min-h-[2.25rem] text-xs leading-5 text-[color:var(--text-muted)]">
        {section.description}
      </p>
      <div className="mt-4 space-y-3">
        {visibleRows.length > 0 ? (
          visibleRows.map((row) => {
            const width = total > 0 ? `${Math.max((row.count / total) * 100, 10)}%` : "0%"

            return (
              <div key={row.label} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate text-[color:var(--text-secondary)]">
                    {translateRelationshipEnum(t, section.key as RelationshipEnumGroup, row.label)}
                  </span>
                  <span className="shrink-0 text-[color:var(--text-muted)]">{row.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--chip-bg)]">
                  <div
                    className="h-full rounded-full bg-[color:var(--text-primary)] opacity-70"
                    style={{ width }}
                  />
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-xs leading-5 text-[color:var(--text-muted)]">
            {t("relationships.empty.distribution", "暂无分布数据。")}
          </div>
        )}
      </div>
    </div>
  )
}

function InsightMetric({ detail, label, value }: { detail: string; label: string; value: number }) {
  return (
    <Surface className="p-4">
      <div className="text-[11px] font-medium tracking-wide text-[color:var(--text-muted)] uppercase">
        {label}
      </div>
      <div className="mt-3 text-3xl font-semibold text-[color:var(--text-primary)] tabular-nums">
        {value}
      </div>
      <p className="mt-2 text-xs leading-5 text-[color:var(--text-secondary)]">{detail}</p>
    </Surface>
  )
}

function GraphMetric({ detail, label, value }: { detail: string; label: string; value: number }) {
  return (
    <div className="rounded-xl border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-2">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-[10px] tracking-[0.14em] text-[color:var(--text-muted)] uppercase">
          {label}
        </div>
        <div className="text-lg font-semibold text-[color:var(--text-primary)] tabular-nums">
          {value}
        </div>
      </div>
      <p className="mt-1 text-[11px] leading-4 text-[color:var(--text-muted)]">{detail}</p>
    </div>
  )
}

type RelationshipGraphNodeMeta = {
  circle: RelationshipCircle | null
  connectedRelationships: RelationshipPerson[]
  kind: "relationship"
  matchedPatterns: RelationshipPattern[]
  relatedNotes: RelationshipUnsentNote[]
  relationship: RelationshipPerson
}

function RelationshipsGraphTab({
  isControlMode,
  onEditRelationship,
  relationshipById,
  relationships,
  relationshipsModule,
}: {
  isControlMode: boolean
  onEditRelationship: (relationship: RelationshipPerson, circleId: string) => void
  relationshipById: Map<string, RelationshipPerson>
  relationships: RelationshipPerson[]
  relationshipsModule: RelationshipMap
}) {
  const { t } = useTranslation()
  const graphModel = useMemo(
    () => createRelationshipsGraphModel(relationshipsModule, relationshipById),
    [relationshipById, relationshipsModule],
  )
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const effectiveSelectedNodeId =
    selectedNodeId && graphModel.metaByNodeId.has(selectedNodeId) ? selectedNodeId : null

  if (graphModel.nodeCount === 0) {
    return (
      <EmptyState
        message={t("relationships.empty.graph", "当前还没有可展示的关系连接。")}
        compact
      />
    )
  }

  const selectedNode = effectiveSelectedNodeId
    ? (graphModel.metaByNodeId.get(effectiveSelectedNodeId) ?? null)
    : null

  return (
    <div className="h-full min-h-0 pr-1">
      <div className="grid min-h-0 gap-4 xl:h-full xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.78fr)]">
        <div className="flex min-h-0 flex-col gap-3 xl:h-full">
          <div className="grid gap-3 min-[720px]:grid-cols-4">
            <GraphMetric
              detail={t("relationships.graph.metrics.relationshipsDetail", "图谱里只展示人物节点")}
              label={t("relationships.graph.metrics.relationships", "人物")}
              value={relationships.length}
            />
            <GraphMetric
              detail={t("relationships.graph.metrics.circlesDetail", "圈层只作为人物分组线索")}
              label={t("relationships.graph.metrics.circles", "圈层")}
              value={relationshipsModule.circles.length}
            />
            <GraphMetric
              detail={t("relationships.graph.metrics.notesDetail", "表达只影响人物节点权重")}
              label={t("relationships.graph.metrics.notes", "表达线索")}
              value={graphModel.connectedNotesCount}
            />
            <GraphMetric
              detail={t("relationships.graph.metrics.linksDetail", "同圈层或共同模式的人物连接")}
              label={t("relationships.graph.metrics.links", "连接")}
              value={graphModel.edgeCount}
            />
          </div>

          <CytoscapeGraph
            canvasClassName="h-full min-h-[520px] xl:min-h-0"
            className="min-h-0 flex-1"
            elements={graphModel.elements}
            exitFullscreenLabel={t("relationships.graph.controls.exitFullscreen", "退出全屏")}
            fullscreenLabel={t("relationships.graph.controls.fullscreen", "全屏")}
            layout={RELATIONSHIP_GRAPH_LAYOUT}
            legend={
              <div className="flex max-w-[24rem] flex-wrap items-center gap-1.5">
                <Badge className="bg-[color:var(--tone-present-bg)] px-2 py-0.5 text-[11px] text-[color:var(--tone-present-ink)]">
                  {translateRelationshipEnum(t, "impact", "滋养")}
                </Badge>
                <Badge className="bg-[color:var(--tone-future-bg)] px-2 py-0.5 text-[11px] text-[color:var(--tone-future-ink)]">
                  {translateRelationshipEnum(t, "impact", "消耗")}
                </Badge>
                <Badge className="bg-[color:var(--tone-value-bg)] px-2 py-0.5 text-[11px] text-[color:var(--tone-value-ink)]">
                  {translateRelationshipEnum(t, "impact", "混合")}
                </Badge>
                <Badge className="bg-[color:var(--surface-bg)] px-2 py-0.5 text-[11px] text-[color:var(--text-secondary)]">
                  {translateRelationshipEnum(t, "impact", "中性")}
                </Badge>
              </div>
            }
            legendPosition="bottom-left"
            selectedNodeId={effectiveSelectedNodeId}
            stylesheet={createRelationshipsGraphStylesheet}
            onNodeSelect={setSelectedNodeId}
          />
        </div>

        <Surface className="flex min-h-[360px] flex-col overflow-hidden p-4 xl:min-h-0">
          <div className="flex items-center gap-2 text-[color:var(--text-primary)]">
            <Network className="size-4" />
            <h4 className="text-sm font-semibold tracking-tight">
              {t("relationships.graph.detailTitle", "节点说明")}
            </h4>
          </div>

          <div className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            {selectedNode ? (
              <RelationshipGraphDetail
                isControlMode={isControlMode}
                node={selectedNode}
                onEditRelationship={onEditRelationship}
              />
            ) : (
              <EmptyState
                message={t(
                  "relationships.graph.emptySelection",
                  "选中一个节点后，这里会显示详细说明。",
                )}
                compact
              />
            )}
          </div>
        </Surface>
      </div>
    </div>
  )
}

function RelationshipGraphDetail({
  isControlMode,
  node,
  onEditRelationship,
}: {
  isControlMode: boolean
  node: RelationshipGraphNodeMeta
  onEditRelationship: (relationship: RelationshipPerson, circleId: string) => void
}) {
  return (
    <RelationshipGraphRelationshipDetail
      circle={node.circle}
      connectedRelationships={node.connectedRelationships}
      isControlMode={isControlMode}
      matchedPatterns={node.matchedPatterns}
      onEdit={onEditRelationship}
      relatedNotes={node.relatedNotes}
      relationship={node.relationship}
    />
  )
}

function RelationshipGraphRelationshipDetail({
  circle,
  connectedRelationships,
  isControlMode,
  matchedPatterns,
  onEdit,
  relatedNotes,
  relationship,
}: {
  circle: RelationshipCircle | null
  connectedRelationships: RelationshipPerson[]
  isControlMode: boolean
  matchedPatterns: RelationshipPattern[]
  onEdit: (relationship: RelationshipPerson, circleId: string) => void
  relatedNotes: RelationshipUnsentNote[]
  relationship: RelationshipPerson
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]">
          {t("relationships.graph.legend.relationship", "关系人物")}
        </Badge>
        {circle ? (
          <Badge
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
          >
            {circle.title}
          </Badge>
        ) : null}
      </div>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h4 className="text-lg font-semibold text-[color:var(--text-primary)]">
            {relationship.name}
          </h4>
          <p className="mt-1 text-sm text-[color:var(--text-muted)]">{relationship.role}</p>
        </div>
        {isControlMode ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => onEdit(relationship, circle?.id ?? "")}
          >
            <Pencil className="h-4 w-4" />
            {t("relationships.common.edit", "编辑")}
          </Button>
        ) : null}
      </div>

      <p className="text-sm leading-6 text-[color:var(--text-secondary)]">
        {relationship.influence}
      </p>

      <div className="grid gap-3 min-[640px]:grid-cols-2">
        <RelationshipMeta
          label={t("relationships.labels.depth", "深度")}
          value={translateRelationshipEnum(t, "depth", relationship.depth)}
        />
        <RelationshipMeta
          label={t("relationships.labels.stage", "阶段")}
          value={translateRelationshipEnum(t, "stage", relationship.stage)}
        />
        <RelationshipMeta
          label={t("relationships.labels.interaction", "互动频率")}
          value={translateRelationshipEnum(t, "interaction", relationship.interaction)}
        />
        <RelationshipMeta
          label={t("relationships.labels.impact", "影响")}
          value={translateRelationshipEnum(t, "impact", relationship.impact)}
        />
      </div>

      <DetailTextBlock
        title={t("relationships.labels.currentState", "当前")}
        body={relationship.currentState}
      />
      <DetailTextBlock
        title={t("relationships.labels.unspoken", "没说出口")}
        body={relationship.unspokenLine}
      />
      <div className="grid gap-3">
        <RelationshipGraphSignalList
          emptyLabel={t("relationships.graph.signals.noConnectedPeople", "暂无相连人物")}
          items={connectedRelationships.map((item) => item.name)}
          title={t("relationships.graph.signals.connectedPeople", "图中相连")}
        />
        <RelationshipGraphSignalList
          emptyLabel={t("relationships.graph.signals.noPatterns", "暂无共同模式")}
          items={matchedPatterns.map((pattern) => pattern.title)}
          title={t("relationships.graph.signals.patterns", "匹配模式")}
        />
        <RelationshipGraphSignalList
          emptyLabel={t("relationships.graph.signals.noNotes", "暂无表达线索")}
          items={relatedNotes.map((note) => note.theme)}
          title={t("relationships.graph.signals.notes", "表达线索")}
        />
      </div>
      <BadgeRow items={relationship.emotionCues} />
      <BadgeRow items={relationship.tags} muted />
    </div>
  )
}

function RelationshipGraphSignalList({
  emptyLabel,
  items,
  title,
}: {
  emptyLabel: string
  items: string[]
  title: string
}) {
  return (
    <div className="rounded-2xl border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3">
      <div className="text-xs font-medium text-[color:var(--text-primary)]">{title}</div>
      {items.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {items.slice(0, 6).map((item, index) => (
            <Badge
              key={`${item}-${index}`}
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
            >
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-[color:var(--text-muted)]">{emptyLabel}</p>
      )}
    </div>
  )
}

function RelationshipsDirectoryTab({
  isControlMode,
  onCreate,
  onDelete,
  onEdit,
  onSelect,
  relationshipsModule,
  selectedRelationship,
  sortedUnsentNotes,
}: {
  isControlMode: boolean
  onCreate: () => void
  onDelete: (relationship: RelationshipPerson) => void
  onEdit: (relationship: RelationshipPerson, circleId: string) => void
  onSelect: (id: string) => void
  relationshipsModule: RelationshipMap
  selectedRelationship: RelationshipPerson | null
  sortedUnsentNotes: RelationshipUnsentNote[]
}) {
  const { t } = useTranslation()
  const [typeFilter, setTypeFilter] = useState("all")
  const [depthFilter, setDepthFilter] = useState("all")
  const [stageFilter, setStageFilter] = useState("all")
  const [impactFilter, setImpactFilter] = useState("all")
  const [interactionFilter, setInteractionFilter] = useState("all")
  const selectedCircleId =
    selectedRelationship &&
    relationshipsModule.circles.find((circle) =>
      circle.entries.some((entry) => entry.id === selectedRelationship.id),
    )?.id
  const hasActiveFilters =
    typeFilter !== "all" ||
    depthFilter !== "all" ||
    stageFilter !== "all" ||
    impactFilter !== "all" ||
    interactionFilter !== "all"
  const filteredCircles = relationshipsModule.circles.map((circle) => ({
    ...circle,
    entries: circle.entries.filter(
      (relationship) =>
        matchesFilter(typeFilter, relationship.type) &&
        matchesFilter(depthFilter, relationship.depth) &&
        matchesFilter(stageFilter, relationship.stage) &&
        matchesFilter(impactFilter, relationship.impact) &&
        matchesFilter(interactionFilter, relationship.interaction),
    ),
  }))
  const filteredRelationshipCount = filteredCircles.reduce(
    (count, circle) => count + circle.entries.length,
    0,
  )

  return (
    <TwoPaneLayout>
      <Surface className="flex min-h-0 flex-col overflow-visible p-3 lg:w-[22rem] lg:shrink-0 lg:overflow-hidden">
        <ListHeader
          icon={Users2}
          title={t("relationships.directory.title", "关系档案")}
          count={filteredRelationshipCount}
          isControlMode={isControlMode}
          onCreate={onCreate}
        />
        <div className="mt-3 shrink-0 space-y-2">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
            <DimensionFilterSelect
              label={t("relationships.filter.type", "类型")}
              value={typeFilter}
              options={RELATIONSHIP_TYPES}
              group="type"
              onValueChange={setTypeFilter}
            />
            <DimensionFilterSelect
              label={t("relationships.filter.depth", "深度")}
              value={depthFilter}
              options={RELATIONSHIP_DEPTHS}
              group="depth"
              onValueChange={setDepthFilter}
            />
            <DimensionFilterSelect
              label={t("relationships.filter.stage", "阶段")}
              value={stageFilter}
              options={RELATIONSHIP_STAGES}
              group="stage"
              onValueChange={setStageFilter}
            />
            <DimensionFilterSelect
              label={t("relationships.filter.impact", "影响")}
              value={impactFilter}
              options={RELATIONSHIP_IMPACTS}
              group="impact"
              onValueChange={setImpactFilter}
            />
            <DimensionFilterSelect
              label={t("relationships.filter.interaction", "互动频率")}
              value={interactionFilter}
              options={INTERACTION_FREQUENCIES}
              group="interaction"
              onValueChange={setInteractionFilter}
            />
          </div>
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-[color:var(--text-muted)]"
              onClick={() => {
                setTypeFilter("all")
                setDepthFilter("all")
                setStageFilter("all")
                setImpactFilter("all")
                setInteractionFilter("all")
              }}
            >
              {t("relationships.filter.clear", "清空筛选")}
            </Button>
          ) : null}
        </div>
        <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-visible pr-1 lg:overflow-y-auto">
          {filteredCircles.map((circle) => (
            <div key={circle.id} className="space-y-2">
              <div className="flex items-center justify-between gap-2 px-1">
                <div className="min-w-0 truncate text-xs font-medium text-[color:var(--text-muted)]">
                  {circle.title}
                </div>
                <Badge
                  variant="outline"
                  className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[10px] text-[color:var(--text-muted)]"
                >
                  {circle.entries.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {circle.entries.map((relationship) => (
                  <RelationshipListButton
                    key={relationship.id}
                    isSelected={selectedRelationship?.id === relationship.id}
                    relationship={relationship}
                    onClick={() => onSelect(relationship.id)}
                  />
                ))}
              </div>
            </div>
          ))}
          {filteredRelationshipCount === 0 ? (
            <EmptyState
              message={t("relationships.empty.directory", "当前筛选下没有关系。")}
              compact
            />
          ) : null}
        </div>
      </Surface>

      <div className="min-h-[360px] flex-1 lg:min-h-0">
        {selectedRelationship ? (
          <RelationshipDetailPanel
            isControlMode={isControlMode}
            relationship={selectedRelationship}
            relatedNotes={sortedUnsentNotes.filter(
              (note) => note.relationshipId === selectedRelationship.id,
            )}
            onDelete={() => onDelete(selectedRelationship)}
            onEdit={() =>
              onEdit(
                selectedRelationship,
                selectedCircleId ?? relationshipsModule.circles[0]?.id ?? "",
              )
            }
          />
        ) : (
          <EmptyDetail
            message={t("relationships.empty.selectRelationship", "从左侧选择一段关系。")}
          />
        )}
      </div>
    </TwoPaneLayout>
  )
}

function DimensionFilterSelect({
  group,
  label,
  onValueChange,
  options,
  value,
}: {
  group: RelationshipEnumGroup
  label: string
  onValueChange: (value: string) => void
  options: readonly string[]
  value: string
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
      <SelectTrigger className="h-8 w-full min-w-0 border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-xs text-[color:var(--text-secondary)]">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent className={RELATIONSHIP_SELECT_CONTENT_CLASS} align="start">
        <SelectItem value="all">{t("relationships.filter.all", "全部")}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option} value={option}>
            {translateRelationshipEnum(t, group, option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function RelationshipListButton({
  isSelected,
  onClick,
  relationship,
}: {
  isSelected: boolean
  onClick: () => void
  relationship: RelationshipPerson
}) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full rounded-lg border px-3 py-3 text-left transition-colors",
        isSelected
          ? "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)]"
          : "border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] hover:border-[color:var(--surface-border)]",
      )}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0 truncate text-sm font-medium text-[color:var(--text-primary)]">
          {relationship.name}
        </div>
        <Badge
          variant="outline"
          className="shrink-0 border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[10px] text-[color:var(--text-muted)]"
        >
          {translateRelationshipEnum(t, "impact", relationship.impact)}
        </Badge>
      </div>
      <div className="mt-1 flex flex-wrap gap-1.5">
        <span className="text-[11px] text-[color:var(--text-muted)]">
          {translateRelationshipEnum(t, "type", relationship.type)}
        </span>
        <span className="text-[11px] text-[color:var(--text-muted)]">·</span>
        <span className="text-[11px] text-[color:var(--text-muted)]">
          {translateRelationshipEnum(t, "stage", relationship.stage)}
        </span>
      </div>
    </button>
  )
}

function RelationshipDetailPanel({
  isControlMode,
  onDelete,
  onEdit,
  relationship,
  relatedNotes,
}: {
  isControlMode: boolean
  onDelete: () => void
  onEdit: () => void
  relationship: RelationshipPerson
  relatedNotes: RelationshipUnsentNote[]
}) {
  const { t } = useTranslation()

  return (
    <Surface className="flex min-h-0 flex-col overflow-visible p-4 lg:h-full lg:overflow-hidden">
      <div className="flex shrink-0 flex-col gap-3 border-b border-[color:var(--muted-surface-border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]">
              {translateRelationshipEnum(t, "type", relationship.type)}
            </Badge>
            <Badge
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
            >
              {translateRelationshipEnum(
                t,
                "unfinishedWeight",
                relationship.unfinishedWeight ?? "无",
              )}
            </Badge>
          </div>
          <h3 className="mt-3 text-lg font-semibold text-[color:var(--text-primary)]">
            {relationship.name}
          </h3>
          <div className="mt-1 text-sm text-[color:var(--text-muted)]">{relationship.role}</div>
        </div>
        {isControlMode ? (
          <div className="flex shrink-0 gap-2">
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
              {t("relationships.common.edit", "编辑")}
            </Button>
            <Button size="sm" variant="outline" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
              {t("relationships.common.delete", "删除")}
            </Button>
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-visible pt-4 pr-1 lg:overflow-y-auto">
        <p className="text-sm leading-6 text-[color:var(--text-secondary)]">
          {relationship.influence}
        </p>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <RelationshipMeta
            label={t("relationships.labels.depth", "深度")}
            value={translateRelationshipEnum(t, "depth", relationship.depth)}
          />
          <RelationshipMeta
            label={t("relationships.labels.stage", "阶段")}
            value={translateRelationshipEnum(t, "stage", relationship.stage)}
          />
          <RelationshipMeta
            label={t("relationships.labels.interaction", "互动频率")}
            value={translateRelationshipEnum(t, "interaction", relationship.interaction)}
          />
          <RelationshipMeta
            label={t("relationships.labels.impact", "影响")}
            value={translateRelationshipEnum(t, "impact", relationship.impact)}
          />
        </div>

        <DetailTextBlock
          title={t("relationships.labels.currentState", "当前")}
          body={relationship.currentState}
        />
        <DetailTextBlock
          title={t("relationships.labels.boundary", "边界")}
          body={relationship.boundaryStatus}
        />
        <DetailTextBlock
          title={t("relationships.labels.unspoken", "没说出口")}
          body={relationship.unspokenLine}
        />

        <div className="grid gap-3 lg:grid-cols-2">
          <DetailTextBlock
            title={t("relationships.labels.positiveImpact", "正面影响")}
            body={relationship.positiveImpact}
          />
          <DetailTextBlock
            title={t("relationships.labels.ongoingShadow", "持续阴影")}
            body={relationship.ongoingShadow}
          />
        </div>

        <BadgeRow items={relationship.emotionCues} />
        <BadgeRow items={relationship.tags} muted />

        <TimelineSection
          title={t("relationships.labels.events", "关键互动事件")}
          emptyMessage={t("relationships.empty.events", "暂无关键互动事件。")}
          items={relationship.events.map((event) => ({
            id: event.id,
            title: `${event.date} · ${translateRelationshipEnum(t, "eventKind", event.kind)}`,
            body: `${event.title}。${event.summary}`,
          }))}
        />
        <TimelineSection
          title={t("relationships.labels.history", "变化历史")}
          emptyMessage={t("relationships.empty.history", "暂无深度或阶段变化。")}
          items={relationship.history.map((history) => ({
            id: history.id,
            title: `${history.date} · ${translateRelationshipEnum(t, "changeField", history.field)}`,
            body: `${history.from} → ${history.to}。${history.note}`,
          }))}
        />
        <TimelineSection
          title={t("relationships.labels.relatedNotes", "相关想说的话")}
          emptyMessage={t("relationships.empty.relatedNotes", "暂无关联表达。")}
          items={relatedNotes.map((note) => ({
            id: note.id,
            title: `${note.to} · ${note.theme}`,
            body: note.excerpt,
          }))}
        />
      </div>
    </Surface>
  )
}

function RelationshipMeta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 py-2">
      <div className="text-[11px] text-[color:var(--text-muted)]">{label}</div>
      <div className="mt-1 text-sm font-medium text-[color:var(--text-primary)]">{value}</div>
    </div>
  )
}

function UnsentNotesTab({
  isControlMode,
  notes,
  onCreate,
  onDelete,
  onEdit,
  onSelect,
  relationshipById,
  selectedNote,
}: {
  isControlMode: boolean
  notes: RelationshipUnsentNote[]
  onCreate: () => void
  onDelete: (note: RelationshipUnsentNote) => void
  onEdit: (note: RelationshipUnsentNote) => void
  onSelect: (id: string) => void
  relationshipById: Map<string, RelationshipPerson>
  selectedNote: RelationshipUnsentNote | null
}) {
  const { t } = useTranslation()

  return (
    <TwoPaneLayout>
      <Surface className="flex min-h-0 flex-col overflow-visible p-3 lg:w-80 lg:shrink-0 lg:overflow-hidden">
        <ListHeader
          icon={MessageCircleMore}
          title={t("relationships.unsent.title", "想说的话")}
          count={notes.length}
          isControlMode={isControlMode}
          onCreate={onCreate}
        />
        <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-visible pr-1 lg:overflow-y-auto">
          {notes.map((note) => (
            <button
              key={note.id}
              type="button"
              onClick={() => onSelect(note.id)}
              className={cn(
                "w-full rounded-lg border px-3 py-3 text-left transition-colors",
                selectedNote?.id === note.id
                  ? "border-[color:var(--tone-past-border)] bg-[color:var(--tone-past-bg)]"
                  : "border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] hover:border-[color:var(--surface-border)]",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0 truncate text-sm font-medium text-[color:var(--text-primary)]">
                  {note.to}
                </div>
                <Badge
                  variant="outline"
                  className="shrink-0 border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[10px] text-[color:var(--text-muted)]"
                >
                  {translateRelationshipEnum(t, "unfinishedWeight", note.unfinishedWeight ?? "无")}
                </Badge>
              </div>
              <div className="mt-1 truncate text-xs text-[color:var(--text-muted)]">
                {note.theme}
              </div>
            </button>
          ))}
        </div>
      </Surface>

      <div className="min-h-[360px] flex-1 lg:min-h-0">
        {selectedNote ? (
          <Surface className="flex min-h-0 flex-col overflow-visible p-4 lg:h-full lg:overflow-hidden">
            <DetailHeader
              isControlMode={isControlMode}
              kicker={translateRelationshipEnum(t, "targetType", selectedNote.targetType)}
              title={`${selectedNote.to} · ${selectedNote.theme}`}
              onDelete={() => onDelete(selectedNote)}
              onEdit={() => onEdit(selectedNote)}
            />
            <div className="min-h-0 flex-1 space-y-4 overflow-visible pt-4 pr-1 lg:overflow-y-auto">
              <Badge className="w-fit bg-[color:var(--tone-past-bg)] text-[color:var(--tone-past-ink)]">
                {translateRelationshipEnum(
                  t,
                  "unfinishedWeight",
                  selectedNote.unfinishedWeight ?? "无",
                )}
              </Badge>
              {selectedNote.relationshipId && relationshipById.get(selectedNote.relationshipId) ? (
                <div className="text-sm text-[color:var(--text-muted)]">
                  {t("relationships.unsent.relatedRelationship", {
                    name: relationshipById.get(selectedNote.relationshipId)?.name,
                    defaultValue: `关联关系：${relationshipById.get(selectedNote.relationshipId)?.name}`,
                  })}
                </div>
              ) : null}
              <p className="text-base leading-7 text-[color:var(--text-secondary)]">
                {selectedNote.excerpt}
              </p>
            </div>
          </Surface>
        ) : (
          <EmptyDetail message={t("relationships.empty.selectNote", "从左侧选择一条表达。")} />
        )}
      </div>
    </TwoPaneLayout>
  )
}

function PatternsTab({
  isControlMode,
  onCreate,
  onDelete,
  onEdit,
  onSelect,
  patterns,
  selectedPattern,
}: {
  isControlMode: boolean
  onCreate: () => void
  onDelete: (pattern: RelationshipPattern) => void
  onEdit: (pattern: RelationshipPattern) => void
  onSelect: (id: string) => void
  patterns: RelationshipPattern[]
  selectedPattern: RelationshipPattern | null
}) {
  const { t } = useTranslation()

  return (
    <TwoPaneLayout>
      <Surface className="flex min-h-0 flex-col overflow-visible p-3 lg:w-80 lg:shrink-0 lg:overflow-hidden">
        <ListHeader
          icon={Activity}
          title={t("relationships.patterns.title", "跨关系模式")}
          count={patterns.length}
          isControlMode={isControlMode}
          onCreate={onCreate}
        />
        <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-visible pr-1 lg:overflow-y-auto">
          {patterns.map((pattern) => (
            <button
              key={pattern.id}
              type="button"
              onClick={() => onSelect(pattern.id)}
              className={cn(
                "w-full rounded-lg border px-3 py-3 text-left transition-colors",
                selectedPattern?.id === pattern.id
                  ? "border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)]"
                  : "border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] hover:border-[color:var(--surface-border)]",
              )}
            >
              <div className="truncate text-sm font-medium text-[color:var(--text-primary)]">
                {pattern.title}
              </div>
              <div className="mt-1 line-clamp-2 text-xs leading-5 text-[color:var(--text-muted)]">
                {pattern.summary}
              </div>
            </button>
          ))}
        </div>
      </Surface>

      <div className="min-h-[360px] flex-1 lg:min-h-0">
        {selectedPattern ? (
          <Surface className="flex min-h-0 flex-col overflow-visible p-4 lg:h-full lg:overflow-hidden">
            <DetailHeader
              isControlMode={isControlMode}
              kicker={t("relationships.patterns.kicker", "关系模式")}
              title={selectedPattern.title}
              onDelete={() => onDelete(selectedPattern)}
              onEdit={() => onEdit(selectedPattern)}
            />
            <div className="min-h-0 flex-1 space-y-4 overflow-visible pt-4 pr-1 lg:overflow-y-auto">
              <p className="text-base leading-7 text-[color:var(--text-secondary)]">
                {selectedPattern.summary}
              </p>
              <BadgeRow items={selectedPattern.cues} />
            </div>
          </Surface>
        ) : (
          <EmptyDetail message={t("relationships.empty.selectPattern", "从左侧选择一个模式。")} />
        )}
      </div>
    </TwoPaneLayout>
  )
}

function ListHeader({
  count,
  icon: Icon,
  isControlMode,
  onCreate,
  title,
}: {
  count: number
  icon: LucideIcon
  isControlMode: boolean
  onCreate: () => void
  title: string
}) {
  return (
    <div className="flex shrink-0 items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2 text-[color:var(--text-primary)]">
        <Icon className="size-4 shrink-0" />
        <div className="truncate text-sm font-semibold">{title}</div>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[10px] text-[color:var(--text-muted)]"
        >
          {count}
        </Badge>
      </div>
      {isControlMode ? (
        <Button size="icon-sm" variant="outline" onClick={onCreate}>
          <Plus className="size-3.5" />
        </Button>
      ) : null}
    </div>
  )
}

function DetailHeader({
  isControlMode,
  kicker,
  onDelete,
  onEdit,
  title,
}: {
  isControlMode: boolean
  kicker: string
  onDelete: () => void
  onEdit: () => void
  title: string
}) {
  const { t } = useTranslation()

  return (
    <div className="flex shrink-0 flex-col gap-3 border-b border-[color:var(--muted-surface-border)] pb-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
        >
          {kicker}
        </Badge>
        <h3 className="mt-3 text-lg font-semibold text-[color:var(--text-primary)]">{title}</h3>
      </div>
      {isControlMode ? (
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            {t("relationships.common.edit", "编辑")}
          </Button>
          <Button size="sm" variant="outline" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            {t("relationships.common.delete", "删除")}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function DetailTextBlock({ body, title }: { body: string; title: string }) {
  if (!body.trim()) return null

  return (
    <div className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 py-3">
      <div className="text-[11px] font-medium text-[color:var(--text-muted)]">{title}</div>
      <p className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)]">{body}</p>
    </div>
  )
}

function TimelineSection({
  emptyMessage,
  items,
  title,
}: {
  emptyMessage: string
  items: Array<{ id: string; title: string; body: string }>
  title: string
}) {
  return (
    <section className="space-y-2">
      <div className="text-xs font-semibold tracking-wide text-[color:var(--text-muted)] uppercase">
        {title}
      </div>
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-3 py-2"
            >
              <div className="text-xs font-medium text-[color:var(--text-primary)]">
                {item.title}
              </div>
              <div className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
                {item.body}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState message={emptyMessage} compact />
      )}
    </section>
  )
}

function BadgeRow({ items, muted = false }: { items: string[]; muted?: boolean }) {
  if (items.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge
          key={item}
          variant="outline"
          className={cn(
            "border-[color:var(--chip-border)]",
            muted
              ? "bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
              : "bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]",
          )}
        >
          {item}
        </Badge>
      ))}
    </div>
  )
}

function TwoPaneLayout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-0 flex-col gap-3 lg:h-full lg:flex-row">{children}</div>
}

function EmptyDetail({ message }: { message: string }) {
  return (
    <Surface className="flex min-h-[260px] items-center justify-center p-8 lg:h-full lg:min-h-0">
      <p className="text-sm text-[color:var(--text-muted)]">{message}</p>
    </Surface>
  )
}

function createRelationshipsGraphModel(
  relationshipsModule: RelationshipMap,
  relationshipById: Map<string, RelationshipPerson>,
) {
  const metaByNodeId = new Map<string, RelationshipGraphNodeMeta>()
  const connectedIdsByRelationshipId = new Map<string, Set<string>>()
  const edgeByKey = new Map<
    string,
    {
      linkKind: string
      source: string
      target: string
      weight: number
    }
  >()
  const elements: Array<{ data: Record<string, string | number> }> = []
  let connectedNotesCount = 0

  const notesByRelationshipId = new Map<string, RelationshipUnsentNote[]>()
  relationshipsModule.unsentNotes.forEach((note) => {
    if (!note.relationshipId || !relationshipById.has(note.relationshipId)) {
      return
    }

    connectedNotesCount += 1
    const bucket = notesByRelationshipId.get(note.relationshipId) ?? []
    bucket.push(note)
    notesByRelationshipId.set(note.relationshipId, bucket)
  })

  const patternsByRelationshipId = new Map<string, RelationshipPattern[]>()
  relationshipsModule.patterns.forEach((pattern) => {
    const matchedRelationships = inferPatternMatches(pattern, relationshipById)

    matchedRelationships.forEach((relationship) => {
      const bucket = patternsByRelationshipId.get(relationship.id) ?? []
      bucket.push(pattern)
      patternsByRelationshipId.set(relationship.id, bucket)
    })

    addRelationshipPairEdges(
      matchedRelationships,
      {
        linkKind: "pattern",
        weight: 1.15,
      },
      edgeByKey,
      connectedIdsByRelationshipId,
    )
  })

  relationshipsModule.circles.forEach((circle) => {
    addRelationshipPairEdges(
      circle.entries,
      {
        linkKind: "sameCircle",
        weight: Math.max(1, Math.min(2.2, circle.entries.length / 3)),
      },
      edgeByKey,
      connectedIdsByRelationshipId,
    )

    circle.entries.forEach((relationship) => {
      const relatedNotes = notesByRelationshipId.get(relationship.id) ?? []
      const matchedPatterns = patternsByRelationshipId.get(relationship.id) ?? []
      const relationshipWeight = Math.max(
        1,
        1 +
          relatedNotes.length * 0.8 +
          matchedPatterns.length * 0.65 +
          relationship.events.length * 0.35 +
          relationship.tags.length * 0.2,
      )

      elements.push({
        data: {
          circle: circle.title,
          id: relationship.id,
          impact: relationship.impact,
          kind: "relationship",
          label: relationship.name,
          type: relationship.type,
          weight: relationshipWeight,
        },
      })
      metaByNodeId.set(relationship.id, {
        circle,
        connectedRelationships: [],
        kind: "relationship",
        matchedPatterns,
        relatedNotes,
        relationship,
      })
    })
  })

  edgeByKey.forEach((edge, key) => {
    elements.push({
      data: {
        id: key,
        linkKind: edge.linkKind,
        source: edge.source,
        target: edge.target,
        weight: edge.weight,
      },
    })
  })

  metaByNodeId.forEach((meta, relationshipId) => {
    meta.connectedRelationships = [...(connectedIdsByRelationshipId.get(relationshipId) ?? [])]
      .map((connectedId) => relationshipById.get(connectedId))
      .filter((relationship): relationship is RelationshipPerson => Boolean(relationship))
  })

  return {
    connectedNotesCount,
    edgeCount: edgeByKey.size,
    elements,
    metaByNodeId,
    nodeCount: metaByNodeId.size,
  }
}

function addRelationshipPairEdges(
  relationships: RelationshipPerson[],
  edge: {
    linkKind: string
    weight: number
  },
  edgeByKey: Map<
    string,
    {
      linkKind: string
      source: string
      target: string
      weight: number
    }
  >,
  connectedIdsByRelationshipId: Map<string, Set<string>>,
) {
  const uniqueRelationships = [
    ...new Map(relationships.map((relationship) => [relationship.id, relationship])).values(),
  ]

  for (let firstIndex = 0; firstIndex < uniqueRelationships.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < uniqueRelationships.length;
      secondIndex += 1
    ) {
      const first = uniqueRelationships[firstIndex]
      const second = uniqueRelationships[secondIndex]
      const [source, target] = [first.id, second.id].sort()
      const key = `${source}::${target}`
      const existing = edgeByKey.get(key)

      edgeByKey.set(key, {
        linkKind: existing && existing.linkKind !== edge.linkKind ? "mixed" : edge.linkKind,
        source,
        target,
        weight: (existing?.weight ?? 0) + edge.weight,
      })

      addConnectedRelationshipId(connectedIdsByRelationshipId, source, target)
      addConnectedRelationshipId(connectedIdsByRelationshipId, target, source)
    }
  }
}

function addConnectedRelationshipId(
  connectedIdsByRelationshipId: Map<string, Set<string>>,
  relationshipId: string,
  connectedRelationshipId: string,
) {
  const bucket = connectedIdsByRelationshipId.get(relationshipId) ?? new Set<string>()
  bucket.add(connectedRelationshipId)
  connectedIdsByRelationshipId.set(relationshipId, bucket)
}

function inferPatternMatches(
  pattern: RelationshipPattern,
  relationshipById: Map<string, RelationshipPerson>,
) {
  const patternTerms = normalizeTerms([pattern.title, pattern.summary, ...pattern.cues])

  return [...relationshipById.values()].filter((relationship) => {
    const relationshipTerms = normalizeTerms([
      relationship.name,
      relationship.role,
      relationship.currentState,
      relationship.influence,
      relationship.unspokenLine,
      relationship.positiveImpact,
      relationship.ongoingShadow,
      relationship.boundaryStatus,
      ...relationship.tags,
      ...relationship.emotionCues,
    ])

    return patternTerms.some((term) => relationshipTerms.some((source) => source.includes(term)))
  })
}

function normalizeTerms(values: string[]) {
  return values
    .flatMap((value) => value.split(/[，,、。\n\s]+/))
    .map((value) => value.trim().toLowerCase())
    .filter((value) => value.length >= 2)
}

function getRelationships(relationshipsModule: RelationshipMap) {
  return relationshipsModule.circles.flatMap((circle) => circle.entries)
}

function createRelationshipLookup(relationships: RelationshipPerson[]) {
  return new Map(relationships.map((relationship) => [relationship.id, relationship]))
}

function createDistribution<T extends string>(
  order: readonly T[],
  relationships: RelationshipPerson[],
  getValue: (relationship: RelationshipPerson) => T | undefined,
) {
  const counts = new Map<T, number>()

  relationships.forEach((relationship) => {
    const value = getValue(relationship)

    if (!value) return

    counts.set(value, (counts.get(value) ?? 0) + 1)
  })

  return order.map((label) => ({
    label,
    count: counts.get(label) ?? 0,
  }))
}

function sortUnsentNotes(notes: RelationshipUnsentNote[]) {
  return [...notes].sort(
    (first, second) =>
      (WEIGHT_ORDER.get(first.unfinishedWeight ?? "无") ?? 3) -
      (WEIGHT_ORDER.get(second.unfinishedWeight ?? "无") ?? 3),
  )
}

function matchesFilter(filterValue: string, value: string) {
  return filterValue === "all" || value === filterValue
}

function removeRelationship(relationshipsModule: RelationshipMap, relationshipId: string) {
  const withoutRelationship = {
    ...relationshipsModule,
    circles: relationshipsModule.circles.map((circle) => ({
      ...circle,
      entries: circle.entries.filter((entry) => entry.id !== relationshipId),
    })),
    unsentNotes: relationshipsModule.unsentNotes.map((note) =>
      note.relationshipId === relationshipId
        ? {
            ...note,
            targetType: "独立对象" as const,
            relationshipId: undefined,
          }
        : note,
    ),
  }

  return syncUnsentLineRefs(withoutRelationship)
}

function syncUnsentLineRefs(relationshipsModule: RelationshipMap): RelationshipMap {
  return {
    ...relationshipsModule,
    circles: relationshipsModule.circles.map((circle) => ({
      ...circle,
      entries: circle.entries.map((relationship) => ({
        ...relationship,
        unsentLineIds: relationshipsModule.unsentNotes
          .filter((note) => note.relationshipId === relationship.id)
          .map((note) => note.id),
      })),
    })),
  }
}

function tabContentClassName(isStackedLayout: boolean) {
  return cn("mt-3", isStackedLayout ? "overflow-visible" : "min-h-0 flex-1 overflow-hidden")
}
