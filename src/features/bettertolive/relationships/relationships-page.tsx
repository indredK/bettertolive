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
import { ActionGroup, AnimatedButton, AnimatedIconButton, Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSaveRelationshipsMutation } from "@/features/bettertolive/relationships/queries"
import { useWorkspaceUiStore } from "@/features/bettertolive/stores/workspace-ui-store"
import type {
  RelationshipCircle,
  RelationshipConnection,
  RelationshipConnectionStrength,
  RelationshipImpact,
  RelationshipMap,
  RelationshipPattern,
  RelationshipPerson,
  RelationshipUnsentNote,
  UnfinishedWeight,
} from "@/features/bettertolive/types"
import {
  buildRelationshipConnectionPerspectives,
  createRelationshipLookup,
  createRelationshipConnectionPairKey,
  getRelationshipsFromCircles,
  normalizeRelationshipsModuleData,
  removeConnectionsForRelationship,
  syncUnsentLineRefs,
} from "@/features/bettertolive/models/relationship-connections"
import {
  Cytoscape2DGraph,
  type CytoscapeThemeTokens,
} from "@/features/bettertolive/shared/cytoscape-2d-graph"
import { ReactForceGraph3DGraph } from "@/features/bettertolive/shared/react-force-graph-3d-graph"
import { type FilterPopoverDimension } from "@/features/bettertolive/shared/filter-popover"
import { FilterablePanel } from "@/features/bettertolive/shared/filterable-panel"
import { EmptyState, SectionHeading, Surface } from "@/features/bettertolive/shared/shared"
import { confirmUndoableDelete } from "@/features/bettertolive/shared/shopping-delete"
import {
  type EditingRelationship,
  type EditingRelationshipPattern,
  type EditingUnsentNote,
  RelationshipEditDialog,
  RelationshipPatternEditDialog,
  UnsentNoteEditDialog,
} from "@/features/bettertolive/relationships/relationship-edit-dialogs"
import {
  INTERACTION_FREQUENCIES,
  RELATIONSHIP_DEPTHS,
  RELATIONSHIP_IMPACTS,
  RELATIONSHIP_STAGES,
  RELATIONSHIP_TYPES,
  UNFINISHED_WEIGHTS,
  translateRelationshipEnum,
  type RelationshipEnumGroup,
} from "@/features/bettertolive/relationships/relationships-page-data"
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

import { readGraphPalette, readGraphImpactMarks, readGraphWeightMarks } from "@/lib/graph-tokens"

function getGraphMarkPalette() {
  return readGraphPalette()
}

const IMPACT_VALUES: RelationshipImpact[] = ["滋养", "消耗", "混合", "中性"]
const WEIGHT_VALUES: UnfinishedWeight[] = ["很重", "中等", "轻微", "无"]

/** Read graph impact color marks from CSS variables, paired with enum values. */
function getGraphImpactMarks() {
  const tokens = readGraphImpactMarks()
  return tokens.map((token, i) => ({
    bg: token.bg,
    border: token.border,
    key: `impact-${IMPACT_VALUES[i]}`,
    value: IMPACT_VALUES[i],
  }))
}

/** Read graph weight color marks from CSS variables, paired with enum values. */
function getGraphWeightMarks() {
  const tokens = readGraphWeightMarks()
  return tokens.map((token, i) => ({
    bg: token.bg,
    border: token.border,
    key: `weight-${["heavy", "medium", "light", "none"][i]}`,
    value: WEIGHT_VALUES[i],
  }))
}

function createRelationshipsGraphStylesheet(
  theme: CytoscapeThemeTokens,
  markMode: RelationshipGraphMarkMode,
) {
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
    ...createRelationshipNodeMarkStyles(theme, markMode),
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
        "target-arrow-shape": "none",
        width: "mapData(weight, 1, 5, 1.8, 3.2)",
      },
    },
    {
      selector: "edge[linkKind = 'explicit']",
      style: {
        "line-color": theme.tonePresentBorder,
        opacity: 0.9,
        width: "mapData(weight, 1, 6, 2.2, 4.2)",
      },
    },
  ]
}

function createRelationshipNodeMarkStyles(
  theme: CytoscapeThemeTokens,
  markMode: RelationshipGraphMarkMode,
) {
  if (markMode === "impact") {
    return [
      {
        selector: "node[kind = 'relationship'][graphMarkKey = 'impact-滋养']",
        style: {
          "background-color": theme.tonePresentBg,
          "border-color": theme.tonePresentBorder,
        },
      },
      {
        selector: "node[kind = 'relationship'][graphMarkKey = 'impact-消耗']",
        style: {
          "background-color": theme.toneFutureBg,
          "border-color": theme.toneFutureBorder,
        },
      },
      {
        selector: "node[kind = 'relationship'][graphMarkKey = 'impact-混合']",
        style: {
          "background-color": theme.toneValueBg,
          "border-color": theme.toneValueBorder,
        },
      },
      {
        selector: "node[kind = 'relationship'][graphMarkKey = 'impact-中性']",
        style: {
          "background-color": theme.surfaceBg,
          "border-color": theme.mutedSurfaceBorder,
        },
      },
    ]
  }

  if (markMode === "weight") {
    return getGraphWeightMarks().map((mark) => ({
      selector: `node[kind = 'relationship'][graphMarkKey = '${mark.key}']`,
      style: {
        "background-color": mark.bg,
        "border-color": mark.border,
      },
    }))
  }

  const keys =
    markMode === "stage"
      ? RELATIONSHIP_STAGES.map((stage) => `stage-${stage}`)
      : getGraphMarkPalette().map((_, index) => `circle-${index}`)

  return keys.map((key, index) => {
    const color = getGraphMarkPalette()[index % getGraphMarkPalette().length]

    return {
      selector: `node[kind = 'relationship'][graphMarkKey = '${key}']`,
      style: {
        "background-color": color.bg,
        "border-color": color.border,
      },
    }
  })
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
  isStackedLayout?: boolean
  isControlMode?: boolean
  onRefresh?: () => void
}) {
  const { t } = useTranslation()
  const saveRelationshipsMutation = useSaveRelationshipsMutation()
  const normalizedRelationshipsModule = useMemo(
    () => normalizeRelationshipsModuleData(relationshipsModule),
    [relationshipsModule],
  )
  const sourceRelationshipsModule = useMemo(
    () => normalizeRelationshipsModuleData(editableRelationshipsModule ?? relationshipsModule),
    [editableRelationshipsModule, relationshipsModule],
  )
  const relationships = useMemo(
    () => getRelationshipsFromCircles(normalizedRelationshipsModule.circles),
    [normalizedRelationshipsModule.circles],
  )
  const relationshipById = useMemo(() => createRelationshipLookup(relationships), [relationships])
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(
    () => relationships[0]?.id ?? null,
  )
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    () => normalizedRelationshipsModule.unsentNotes[0]?.id ?? null,
  )
  const [selectedPatternId, setSelectedPatternId] = useState<string | null>(
    () => normalizedRelationshipsModule.patterns[0]?.id ?? null,
  )
  const [editingRelationship, setEditingRelationship] = useState<EditingRelationship | null>(null)
  const [editingNote, setEditingNote] = useState<EditingUnsentNote | null>(null)
  const [editingPattern, setEditingPattern] = useState<EditingRelationshipPattern | null>(null)

  const selectedRelationship =
    relationships.find((relationship) => relationship.id === selectedRelationshipId) ??
    relationships[0] ??
    null
  const selectedNote =
    normalizedRelationshipsModule.unsentNotes.find((note) => note.id === selectedNoteId) ??
    normalizedRelationshipsModule.unsentNotes[0] ??
    null
  const selectedPattern =
    normalizedRelationshipsModule.patterns.find((pattern) => pattern.id === selectedPatternId) ??
    normalizedRelationshipsModule.patterns[0] ??
    null

  const classificationSections = useMemo(
    () =>
      [
        {
          key: "type",
          title: t("relationships.overview.typeTitle"),
          description: t("relationships.overview.typeDescription"),
          rows: createDistribution(
            RELATIONSHIP_TYPES,
            relationships,
            (relationship) => relationship.type,
          ),
        },
        {
          key: "depth",
          title: t("relationships.overview.depthTitle"),
          description: t("relationships.overview.depthDescription"),
          rows: createDistribution(
            RELATIONSHIP_DEPTHS,
            relationships,
            (relationship) => relationship.depth,
          ),
        },
        {
          key: "stage",
          title: t("relationships.overview.stageTitle"),
          description: t("relationships.overview.stageDescription"),
          rows: createDistribution(
            RELATIONSHIP_STAGES,
            relationships,
            (relationship) => relationship.stage,
          ),
        },
        {
          key: "impact",
          title: t("relationships.overview.impactTitle"),
          description: t("relationships.overview.impactDescription"),
          rows: createDistribution(
            RELATIONSHIP_IMPACTS,
            relationships,
            (relationship) => relationship.impact,
          ),
        },
        {
          key: "interaction",
          title: t("relationships.overview.interactionTitle"),
          description: t("relationships.overview.interactionDescription"),
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
    () => sortUnsentNotes(normalizedRelationshipsModule.unsentNotes),
    [normalizedRelationshipsModule.unsentNotes],
  )

  const handleDeleted = () => {
    onRefresh?.()
  }

  const deleteRelationship = (relationship: RelationshipPerson) => {
    const nextModule = removeRelationship(sourceRelationshipsModule, relationship.id)

    confirmUndoableDelete({
      confirmMessage: t("common.confirm.deleteItem", {
        name: relationship.name,
      }),
      pendingMessage: t("relationships.toast.deleteRelationshipPending", {
        name: relationship.name,
      }),
      successMessage: t("relationships.toast.deleteRelationshipSuccess", {
        name: relationship.name,
      }),
      failureMessage: t("relationships.toast.deleteRelationshipFailed"),
      undoLabel: t("common.actions.undo"),
      undoneMessage: t("relationships.toast.deleteRelationshipUndone", {
        name: relationship.name,
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
      confirmMessage: t("relationships.confirm.deleteNote"),
      pendingMessage: t("relationships.toast.deleteNotePending"),
      successMessage: t("relationships.toast.deleteNoteSuccess"),
      failureMessage: t("relationships.toast.deleteNoteFailed"),
      undoLabel: t("common.actions.undo"),
      undoneMessage: t("relationships.toast.deleteNoteUndone"),
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
      confirmMessage: t("relationships.confirm.deletePattern"),
      pendingMessage: t("relationships.toast.deletePatternPending"),
      successMessage: t("relationships.toast.deletePatternSuccess"),
      failureMessage: t("relationships.toast.deletePatternFailed"),
      undoLabel: t("common.actions.undo"),
      undoneMessage: t("relationships.toast.deletePatternUndone"),
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
          <TabsTrigger value="overview">{t("relationships.tabs.overview")}</TabsTrigger>
          <TabsTrigger value="graph">{t("relationships.tabs.graph")}</TabsTrigger>
          <TabsTrigger value="directory">{t("relationships.tabs.directory")}</TabsTrigger>
          <TabsTrigger value="unsent">{t("relationships.tabs.unsent")}</TabsTrigger>
          <TabsTrigger value="patterns">{t("relationships.tabs.patterns")}</TabsTrigger>
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
            onEditRelationship={(relationship, circleId) =>
              setEditingRelationship({ isNew: false, circleId, relationship })
            }
            relationshipById={relationshipById}
            relationshipsModule={normalizedRelationshipsModule}
          />
        </TabsContent>

        <TabsContent value="directory" className={tabContentClassName(isStackedLayout)}>
          <RelationshipsDirectoryTab
            isControlMode={isControlMode}
            relationshipsModule={normalizedRelationshipsModule}
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
            patterns={normalizedRelationshipsModule.patterns}
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
            title={t("relationships.overview.classificationHeading")}
            description={t("relationships.overview.classificationDescription")}
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
              {t("relationships.overview.unfinishedHeading")}
            </div>
            <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
              {t("relationships.overview.unfinishedDescription")}
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
            label={t("relationships.overview.nourishing")}
            value={nourishingCount}
            detail={t("relationships.overview.nourishingDetail")}
          />
          <InsightMetric
            label={t("relationships.overview.draining")}
            value={drainingCount}
            detail={t("relationships.overview.drainingDetail")}
          />
          <InsightMetric
            label={t("relationships.overview.repairing")}
            value={repairCount}
            detail={t("relationships.overview.repairingDetail")}
          />
          <InsightMetric
            label={t("relationships.overview.heavy")}
            value={highWeightCount}
            detail={t("relationships.overview.heavyDetail")}
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
            {t("common.empty.noData")}
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

type RelationshipGraphLegendItem = {
  bg: string
  border: string
  key: string
  label: string
}

type RelationshipGraphNodeMeta = {
  circle: RelationshipCircle | null
  connections: Array<{
    connection: RelationshipConnection
    otherRelationship: RelationshipPerson
    roles: Array<{
      id: string
      note: string
      otherRole: string
      selfRole: string
    }>
  }>
  connectedRelationships: RelationshipPerson[]
  kind: "relationship"
  matchedPatterns: RelationshipPattern[]
  relatedNotes: RelationshipUnsentNote[]
  relationship: RelationshipPerson
}

type RelationshipGraphMode = "2d" | "3d"
type RelationshipGraphMarkMode = "circle" | "impact" | "stage" | "weight"
type RelationshipGraphScope =
  | { mode: "global" }
  | { maxDepth: number; mode: "centered"; rootId: string }

function RelationshipsGraphTab({
  onEditRelationship,
  relationshipById,
  relationshipsModule,
}: {
  onEditRelationship: (relationship: RelationshipPerson, circleId: string) => void
  relationshipById: Map<string, RelationshipPerson>
  relationshipsModule: RelationshipMap
}) {
  const { t } = useTranslation()
  const [graphMode, setGraphMode] = useState<RelationshipGraphMode>("3d")
  const [graphMarkMode, setGraphMarkMode] = useState<RelationshipGraphMarkMode>("circle")
  const [graphScope, setGraphScope] = useState<RelationshipGraphScope>({ mode: "global" })
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const handleClearGraphFocus = () => {
    setGraphScope({ mode: "global" })
    setSelectedNodeId(null)
  }
  const handleExitCenterView = () => {
    setGraphScope({ mode: "global" })
  }
  const handleGraphNodeSelect = (nodeId: string | null) => {
    if (!nodeId) {
      if (graphScope.mode === "centered") {
        return
      }

      handleClearGraphFocus()
      return
    }

    setSelectedNodeId(nodeId)
  }
  const effectiveGraphScope =
    graphScope.mode === "centered" && !relationshipById.has(graphScope.rootId)
      ? ({ mode: "global" } satisfies RelationshipGraphScope)
      : graphScope
  const graphModel = useMemo(
    () =>
      createRelationshipsGraphModel({
        markMode: graphMarkMode,
        relationshipById,
        relationshipsModule,
        scope: effectiveGraphScope,
        translateGraphLabel: (group, value) => translateRelationshipEnum(t, group, value),
      }),
    [effectiveGraphScope, graphMarkMode, relationshipById, relationshipsModule, t],
  )
  const effectiveSelectedNodeId =
    selectedNodeId && graphModel.metaByNodeId.has(selectedNodeId) ? selectedNodeId : null
  const selectedNode = effectiveSelectedNodeId
    ? (graphModel.metaByNodeId.get(effectiveSelectedNodeId) ?? null)
    : null
  const graphMarkOptions = useMemo(
    () =>
      [
        {
          description: t("relationships.graph.markModes.circleDescription"),
          label: t("relationships.graph.markModes.circle"),
          mode: "circle",
        },
        {
          description: t("relationships.graph.markModes.weightDescription"),
          label: t("relationships.graph.markModes.weight"),
          mode: "weight",
        },
        {
          description: t("relationships.graph.markModes.impactDescription"),
          label: t("relationships.graph.markModes.impact"),
          mode: "impact",
        },
        {
          description: t("relationships.graph.markModes.stageDescription"),
          label: t("relationships.graph.markModes.stage"),
          mode: "stage",
        },
      ] satisfies Array<{
        description: string
        label: string
        mode: RelationshipGraphMarkMode
      }>,
    [t],
  )
  const currentGraphMarkOption = graphMarkOptions.find((option) => option.mode === graphMarkMode)
  const graphStylesheet = useMemo(
    () => (theme: CytoscapeThemeTokens) => createRelationshipsGraphStylesheet(theme, graphMarkMode),
    [graphMarkMode],
  )
  const isCenteredGraphScope = effectiveGraphScope.mode === "centered"
  const canClearGraphFocus = Boolean(effectiveSelectedNodeId) && !isCenteredGraphScope
  const canCenterSelectedRelationship = Boolean(selectedNode) && !isCenteredGraphScope

  const handleCenterSelectedRelationship = () => {
    if (!selectedNode || isCenteredGraphScope) {
      return
    }

    setSelectedNodeId(selectedNode.relationship.id)
    setGraphScope({
      maxDepth: 2,
      mode: "centered",
      rootId: selectedNode.relationship.id,
    })
  }

  if (graphModel.nodeCount === 0) {
    return <EmptyState message={t("relationships.empty.graph")} compact />
  }

  return (
    <div className="h-full min-h-0 pr-1">
      <div className="grid min-h-0 gap-4 xl:h-full xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.78fr)]">
        <div className="flex min-h-0 flex-col gap-3 xl:h-full">
          <div className="rounded-2xl border border-[color:var(--muted-surface-border)] bg-[color:var(--surface-bg)]/80 p-3 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 min-[920px]:flex-row min-[920px]:items-center min-[920px]:justify-between">
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
                  >
                    {effectiveGraphScope.mode === "centered"
                      ? t("relationships.graph.centeredMode")
                      : t("relationships.graph.globalMode")}
                  </Badge>
                  {effectiveGraphScope.mode === "centered" ? (
                    <Badge
                      variant="outline"
                      className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
                    >
                      {t("relationships.graph.centerDepth", {
                        count: effectiveGraphScope.maxDepth,
                      })}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-xs leading-5 text-[color:var(--text-muted)]">
                  {currentGraphMarkOption?.description ??
                    t("relationships.graph.markModes.defaultDescription")}
                </p>
              </div>

              <div className="flex flex-col gap-2 min-[920px]:items-end">
                <ActionGroup
                  gap="compact"
                  wrap={false}
                  className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] p-1"
                >
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2.5"
                    disabled={!canClearGraphFocus}
                    onClick={handleClearGraphFocus}
                  >
                    {t("relationships.graph.clearFocus")}
                  </Button>
                  {isCenteredGraphScope ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-7 px-2.5"
                      onClick={handleExitCenterView}
                    >
                      {t("relationships.graph.exitCenter")}
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2.5"
                      disabled={!canCenterSelectedRelationship}
                      onClick={handleCenterSelectedRelationship}
                    >
                      {t("relationships.graph.center")}
                    </Button>
                  )}
                  <Button
                    type="button"
                    size="sm"
                    variant={graphMode === "2d" ? "secondary" : "ghost"}
                    className="h-7 px-2.5"
                    onClick={() => setGraphMode("2d")}
                  >
                    2D
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={graphMode === "3d" ? "secondary" : "ghost"}
                    className="h-7 px-2.5"
                    onClick={() => setGraphMode("3d")}
                  >
                    3D
                  </Button>
                </ActionGroup>

                <ActionGroup
                  gap="compact"
                  wrap={false}
                  className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] p-1"
                >
                  {graphMarkOptions.map((option) => (
                    <Button
                      key={option.mode}
                      type="button"
                      size="sm"
                      variant={graphMarkMode === option.mode ? "secondary" : "ghost"}
                      className="h-7 px-2.5"
                      onClick={() => setGraphMarkMode(option.mode)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </ActionGroup>
              </div>
            </div>
          </div>

          {graphMode === "2d" ? (
            <Cytoscape2DGraph
              canvasClassName="h-full min-h-[520px] xl:min-h-0"
              className="min-h-0 flex-1"
              elements={graphModel.elements}
              exitFullscreenLabel={t("relationships.graph.controls.exitFullscreen")}
              fullscreenLabel={t("relationships.graph.controls.fullscreen")}
              layout={graphModel.layout2d}
              legend={
                <RelationshipGraphLegend
                  items={graphModel.legendItems}
                  title={currentGraphMarkOption?.label ?? t("relationships.graph.markModes.circle")}
                />
              }
              legendPosition="bottom-left"
              nodesDraggable={effectiveGraphScope.mode === "global"}
              selectedNodeId={effectiveSelectedNodeId}
              stylesheet={graphStylesheet}
              onNodeSelect={handleGraphNodeSelect}
            />
          ) : (
            <ReactForceGraph3DGraph
              canvasClassName="h-full min-h-[520px] xl:min-h-0"
              className="min-h-0 flex-1"
              enableNodeDrag={effectiveGraphScope.mode === "global"}
              elements={graphModel.elements}
              exitFullscreenLabel={t("relationships.graph.controls.exitFullscreen")}
              fullscreenLabel={t("relationships.graph.controls.fullscreen")}
              layout={RELATIONSHIP_GRAPH_LAYOUT}
              legend={
                <RelationshipGraphLegend
                  items={graphModel.legendItems}
                  title={currentGraphMarkOption?.label ?? t("relationships.graph.markModes.circle")}
                />
              }
              legendPosition="bottom-left"
              selectedNodeId={effectiveSelectedNodeId}
              stylesheet={graphStylesheet}
              onNodeSelect={handleGraphNodeSelect}
            />
          )}
        </div>

        <Surface className="flex min-h-[360px] flex-col overflow-hidden p-0 xl:min-h-0">
          <div className="shrink-0 border-b border-[color:var(--muted-surface-border)] px-4 py-4">
            <div className="flex items-center gap-2 text-[color:var(--text-primary)]">
              <Network className="size-4" />
              <h4 className="text-sm font-semibold tracking-tight">
                {t("relationships.graph.detailTitle")}
              </h4>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden">
            {selectedNode ? (
              <RelationshipGraphDetail
                node={selectedNode}
                onEditRelationship={onEditRelationship}
              />
            ) : (
              <EmptyState message={t("relationships.graph.emptySelection")} compact />
            )}
          </div>
        </Surface>
      </div>
    </div>
  )
}

function RelationshipGraphLegend({
  items,
  title,
}: {
  items: RelationshipGraphLegendItem[]
  title: string
}) {
  return (
    <div className="max-w-[24rem] space-y-2">
      <div className="text-[10px] font-medium tracking-wide text-[color:var(--text-muted)] uppercase">
        {title}
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {items.slice(0, 8).map((item) => (
          <Badge
            key={item.key}
            variant="outline"
            className="border px-2 py-0.5 text-[11px] text-[color:var(--text-secondary)]"
            style={{
              backgroundColor: item.bg,
              borderColor: item.border,
            }}
          >
            {item.label}
          </Badge>
        ))}
      </div>
    </div>
  )
}

function RelationshipGraphDetail({
  node,
  onEditRelationship,
}: {
  node: RelationshipGraphNodeMeta
  onEditRelationship: (relationship: RelationshipPerson, circleId: string) => void
}) {
  return (
    <RelationshipGraphRelationshipDetail
      circle={node.circle}
      connections={node.connections}
      connectedRelationships={node.connectedRelationships}
      matchedPatterns={node.matchedPatterns}
      onEdit={onEditRelationship}
      relatedNotes={node.relatedNotes}
      relationship={node.relationship}
    />
  )
}

function RelationshipGraphRelationshipDetail({
  circle,
  connections,
  connectedRelationships,
  matchedPatterns,
  onEdit,
  relatedNotes,
  relationship,
}: {
  circle: RelationshipCircle | null
  connections: RelationshipGraphNodeMeta["connections"]
  connectedRelationships: RelationshipPerson[]
  matchedPatterns: RelationshipPattern[]
  onEdit: (relationship: RelationshipPerson, circleId: string) => void
  relatedNotes: RelationshipUnsentNote[]
  relationship: RelationshipPerson
}) {
  const { t } = useTranslation()

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="shrink-0 space-y-4 border-b border-[color:var(--muted-surface-border)] bg-[color:var(--surface-bg)]/95 px-4 py-4 supports-[backdrop-filter]:backdrop-blur-xs">
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]">
            {t("relationships.graph.legend.relationship")}
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
          <ActionGroup justify="end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="shrink-0"
              onClick={() => onEdit(relationship, circle?.id ?? "")}
            >
              <Pencil className="h-4 w-4" />
              {t("common.actions.edit")}
            </Button>
          </ActionGroup>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 pr-5">
        <p className="text-sm leading-6 text-[color:var(--text-secondary)]">
          {relationship.influence}
        </p>

        <div className="grid gap-3 min-[640px]:grid-cols-2">
          <RelationshipMeta
            label={t("relationships.labels.depth")}
            value={translateRelationshipEnum(t, "depth", relationship.depth)}
          />
          <RelationshipMeta
            label={t("relationships.labels.stage")}
            value={translateRelationshipEnum(t, "stage", relationship.stage)}
          />
          <RelationshipMeta
            label={t("relationships.labels.interaction")}
            value={translateRelationshipEnum(t, "interaction", relationship.interaction)}
          />
          <RelationshipMeta
            label={t("relationships.labels.impact")}
            value={translateRelationshipEnum(t, "impact", relationship.impact)}
          />
        </div>

        <DetailTextBlock
          title={t("relationships.labels.currentState")}
          body={relationship.currentState}
        />
        <DetailTextBlock
          title={t("relationships.labels.unspoken")}
          body={relationship.unspokenLine}
        />
        <div className="grid gap-3">
          <RelationshipGraphConnectionList connections={connections} />
          <RelationshipGraphSignalList
            emptyLabel={t("relationships.graph.signals.noConnectedPeople")}
            items={connectedRelationships.map((item) => item.name)}
            title={t("relationships.graph.signals.connectedPeople")}
          />
          <RelationshipGraphSignalList
            emptyLabel={t("relationships.graph.signals.noPatterns")}
            items={matchedPatterns.map((pattern) => pattern.title)}
            title={t("relationships.graph.signals.patterns")}
          />
          <RelationshipGraphSignalList
            emptyLabel={t("relationships.graph.signals.noNotes")}
            items={relatedNotes.map((note) => note.theme)}
            title={t("relationships.graph.signals.notes")}
          />
        </div>
        <BadgeRow items={relationship.emotionCues} />
        <BadgeRow items={relationship.tags} muted />
      </div>
    </div>
  )
}

function RelationshipGraphConnectionList({
  connections,
}: {
  connections: RelationshipGraphNodeMeta["connections"]
}) {
  const { t } = useTranslation()

  return (
    <div className="rounded-2xl border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3">
      <div className="text-xs font-medium text-[color:var(--text-primary)]">
        {t("relationships.graph.signals.connections")}
      </div>
      {connections.length > 0 ? (
        <div className="mt-2 space-y-2">
          {connections.map((entry) => (
            <div
              key={entry.connection.id}
              className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-3 py-2"
            >
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-medium text-[color:var(--text-primary)]">
                  {entry.otherRelationship.name}
                </div>
                <Badge
                  variant="outline"
                  className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[10px] text-[color:var(--text-muted)]"
                >
                  {translateRelationshipEnum(t, "connectionStrength", entry.connection.strength)}
                </Badge>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {entry.roles.map((role) => (
                  <Badge
                    key={role.id}
                    variant="outline"
                    className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
                  >
                    {role.selfRole} / {role.otherRole}
                  </Badge>
                ))}
              </div>
              {entry.connection.note || entry.roles.some((role) => role.note) ? (
                <p className="mt-2 text-xs leading-5 text-[color:var(--text-muted)]">
                  {[entry.connection.note, ...entry.roles.map((role) => role.note).filter(Boolean)]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-xs text-[color:var(--text-muted)]">
          {t("relationships.graph.signals.noConnections")}
        </p>
      )}
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

type RelationshipDirectoryFilters = {
  depth: string
  impact: string
  interaction: string
  stage: string
  type: string
}

const DEFAULT_RELATIONSHIP_DIRECTORY_FILTERS: RelationshipDirectoryFilters = {
  type: "all",
  depth: "all",
  stage: "all",
  impact: "all",
  interaction: "all",
}

const RELATIONSHIP_DIRECTORY_FILTER_DIMENSIONS = [
  {
    key: "type",
    labelKey: "relationships.filter.type",
    defaultLabel: "类型",
    options: RELATIONSHIP_TYPES,
    group: "type",
  },
  {
    key: "depth",
    labelKey: "relationships.filter.depth",
    defaultLabel: "深度",
    options: RELATIONSHIP_DEPTHS,
    group: "depth",
  },
  {
    key: "stage",
    labelKey: "relationships.filter.stage",
    defaultLabel: "阶段",
    options: RELATIONSHIP_STAGES,
    group: "stage",
  },
  {
    key: "impact",
    labelKey: "relationships.filter.impact",
    defaultLabel: "影响",
    options: RELATIONSHIP_IMPACTS,
    group: "impact",
  },
  {
    key: "interaction",
    labelKey: "relationships.filter.interaction",
    defaultLabel: "互动频率",
    options: INTERACTION_FREQUENCIES,
    group: "interaction",
  },
] as const satisfies ReadonlyArray<{
  defaultLabel: string
  group: RelationshipEnumGroup
  key: keyof RelationshipDirectoryFilters
  labelKey: string
  options: readonly string[]
}>

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
  const searchQuery = useWorkspaceUiStore((state) => state.searchQuery)
  const setSearchQuery = useWorkspaceUiStore((state) => state.setSearchQuery)
  const [filters, setFilters] = useState(DEFAULT_RELATIONSHIP_DIRECTORY_FILTERS)
  const selectedCircleId =
    selectedRelationship &&
    relationshipsModule.circles.find((circle) =>
      circle.entries.some((entry) => entry.id === selectedRelationship.id),
    )?.id
  const filteredCircles = relationshipsModule.circles.map((circle) => ({
    ...circle,
    entries: circle.entries.filter(
      (relationship) =>
        matchesFilter(filters.type, relationship.type) &&
        matchesFilter(filters.depth, relationship.depth) &&
        matchesFilter(filters.stage, relationship.stage) &&
        matchesFilter(filters.impact, relationship.impact) &&
        matchesFilter(filters.interaction, relationship.interaction),
    ),
  }))
  const filteredRelationshipCount = filteredCircles.reduce(
    (count, circle) => count + circle.entries.length,
    0,
  )
  const filterDimensions = useMemo<FilterPopoverDimension[]>(
    () =>
      RELATIONSHIP_DIRECTORY_FILTER_DIMENSIONS.map((dimension) => ({
        key: dimension.key,
        label: t(dimension.labelKey, dimension.defaultLabel),
        allLabel: t("relationships.filter.all"),
        value: filters[dimension.key],
        options: dimension.options.map((option) => ({
          value: option,
          label: translateRelationshipEnum(t, dimension.group, option),
        })),
      })),
    [filters, t],
  )

  return (
    <TwoPaneLayout>
      <FilterablePanel
        className="flex min-h-0 flex-col overflow-visible lg:w-[22rem] lg:shrink-0 lg:overflow-hidden"
        header={
          <div className="flex items-center justify-between gap-2">
            <ListHeader
              icon={Users2}
              title={t("relationships.directory.title")}
              count={filteredRelationshipCount}
            />
            <AnimatedIconButton
              show={isControlMode}
              size="icon-sm"
              variant="outline"
              label={t("relationships.directory.add")}
              icon={<Plus className="size-3.5" />}
              onClick={onCreate}
            />
          </div>
        }
        bodyClassName="min-h-0 flex-1 space-y-2.5 overflow-visible pr-1 lg:overflow-y-auto"
        dimensions={filterDimensions}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onChangeFilter={(key, value) =>
          setFilters((current) => ({
            ...current,
            [key]: value,
          }))
        }
        onClearAll={() => setFilters(DEFAULT_RELATIONSHIP_DIRECTORY_FILTERS)}
        popoverWidth="20.5rem"
      >
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
          <EmptyState message={t("relationships.empty.directory")} compact />
        ) : null}
      </FilterablePanel>

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
          <EmptyDetail message={t("relationships.empty.selectRelationship")} />
        )}
      </div>
    </TwoPaneLayout>
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
        "w-full rounded-lg border px-2.5 py-2 text-left transition-colors",
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
        <ActionGroup justify="end">
          <AnimatedButton show={isControlMode} size="sm" variant="outline" onClick={onEdit}>
            <Pencil className="h-4 w-4" />
            {t("common.actions.edit")}
          </AnimatedButton>
          <AnimatedButton show={isControlMode} size="sm" variant="destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            {t("common.actions.delete")}
          </AnimatedButton>
        </ActionGroup>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-visible pt-4 pr-1 lg:overflow-y-auto">
        <p className="text-sm leading-6 text-[color:var(--text-secondary)]">
          {relationship.influence}
        </p>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <RelationshipMeta
            label={t("relationships.labels.depth")}
            value={translateRelationshipEnum(t, "depth", relationship.depth)}
          />
          <RelationshipMeta
            label={t("relationships.labels.stage")}
            value={translateRelationshipEnum(t, "stage", relationship.stage)}
          />
          <RelationshipMeta
            label={t("relationships.labels.interaction")}
            value={translateRelationshipEnum(t, "interaction", relationship.interaction)}
          />
          <RelationshipMeta
            label={t("relationships.labels.impact")}
            value={translateRelationshipEnum(t, "impact", relationship.impact)}
          />
        </div>

        <DetailTextBlock
          title={t("relationships.labels.currentState")}
          body={relationship.currentState}
        />
        <DetailTextBlock
          title={t("relationships.labels.boundary")}
          body={relationship.boundaryStatus}
        />
        <DetailTextBlock
          title={t("relationships.labels.unspoken")}
          body={relationship.unspokenLine}
        />

        <div className="grid gap-3 lg:grid-cols-2">
          <DetailTextBlock
            title={t("relationships.labels.positiveImpact")}
            body={relationship.positiveImpact}
          />
          <DetailTextBlock
            title={t("relationships.labels.ongoingShadow")}
            body={relationship.ongoingShadow}
          />
        </div>

        <BadgeRow items={relationship.emotionCues} />
        <BadgeRow items={relationship.tags} muted />

        <TimelineSection
          title={t("relationships.labels.events")}
          emptyMessage={t("relationships.empty.events")}
          items={relationship.events.map((event) => ({
            id: event.id,
            title: `${event.date} · ${translateRelationshipEnum(t, "eventKind", event.kind)}`,
            body: `${event.title}。${event.summary}`,
          }))}
        />
        <TimelineSection
          title={t("relationships.labels.history")}
          emptyMessage={t("relationships.empty.history")}
          items={relationship.history.map((history) => ({
            id: history.id,
            title: `${history.date} · ${translateRelationshipEnum(t, "changeField", history.field)}`,
            body: `${history.from} → ${history.to}。${history.note}`,
          }))}
        />
        <TimelineSection
          title={t("relationships.labels.relatedNotes")}
          emptyMessage={t("relationships.empty.relatedNotes")}
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
        <div className="flex items-center justify-between gap-2">
          <ListHeader
            icon={MessageCircleMore}
            title={t("relationships.unsent.title")}
            count={notes.length}
          />
          <AnimatedIconButton
            show={isControlMode}
            size="icon-sm"
            variant="outline"
            label={t("relationships.unsent.add")}
            icon={<Plus className="size-3.5" />}
            onClick={onCreate}
          />
        </div>
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
                  })}
                </div>
              ) : null}
              <p className="text-base leading-7 text-[color:var(--text-secondary)]">
                {selectedNote.excerpt}
              </p>
            </div>
          </Surface>
        ) : (
          <EmptyDetail message={t("relationships.empty.selectNote")} />
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
        <div className="flex items-center justify-between gap-2">
          <ListHeader
            icon={Activity}
            title={t("relationships.patterns.title")}
            count={patterns.length}
          />
          <AnimatedIconButton
            show={isControlMode}
            size="icon-sm"
            variant="outline"
            label={t("relationships.patterns.add")}
            icon={<Plus className="size-3.5" />}
            onClick={onCreate}
          />
        </div>
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
              kicker={t("relationships.patterns.kicker")}
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
          <EmptyDetail message={t("relationships.empty.selectPattern")} />
        )}
      </div>
    </TwoPaneLayout>
  )
}

function ListHeader({
  count,
  icon: Icon,
  title,
}: {
  count: number
  icon: LucideIcon
  title: string
}) {
  return (
    <div className="flex shrink-0 items-center gap-2">
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
      <ActionGroup justify="end">
        <AnimatedButton show={isControlMode} size="sm" variant="outline" onClick={onEdit}>
          <Pencil className="h-4 w-4" />
          {t("common.actions.edit")}
        </AnimatedButton>
        <AnimatedButton show={isControlMode} size="sm" variant="destructive" onClick={onDelete}>
          <Trash2 className="h-4 w-4" />
          {t("common.actions.delete")}
        </AnimatedButton>
      </ActionGroup>
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

function createRelationshipsGraphModel({
  markMode,
  relationshipById,
  relationshipsModule,
  scope,
  translateGraphLabel,
}: {
  markMode: RelationshipGraphMarkMode
  relationshipById: Map<string, RelationshipPerson>
  relationshipsModule: RelationshipMap
  scope: RelationshipGraphScope
  translateGraphLabel: (group: RelationshipEnumGroup, value: string) => string
}) {
  const network = createRelationshipNetwork(relationshipsModule, relationshipById)
  const scopedNodeIds =
    scope.mode === "centered"
      ? collectCenteredRelationshipIds(network, scope.rootId, scope.maxDepth)
      : new Set(network.nodes.map((node) => node.relationship.id))
  const positions2d =
    scope.mode === "centered"
      ? computeCenteredRingPositions2d(network, scope.rootId, scopedNodeIds)
      : new Map<string, { x: number; y: number }>()
  const positions3d =
    scope.mode === "centered"
      ? computeCenteredRingPositions3d(network, scope.rootId, positions2d)
      : new Map<string, { x: number; y: number; z: number }>()
  const elements: Array<{
    data: Record<string, boolean | number | string>
    position?: { x: number; y: number }
  }> = []
  const metaByNodeId = new Map<string, RelationshipGraphNodeMeta>()
  const circleIndexById = new Map(
    relationshipsModule.circles.map((circle, index) => [circle.id, index]),
  )
  let connectedNotesCount = 0

  const scopedNodes = network.nodes.filter((node) => scopedNodeIds.has(node.relationship.id))
  const legendItems = createRelationshipGraphLegendItems({
    circles: relationshipsModule.circles,
    markMode,
    nodes: scopedNodes,
    translateGraphLabel,
  })

  scopedNodes.forEach((node) => {
    const relationshipWeight = Math.max(
      1,
      1 +
        node.relatedNotes.length * 0.8 +
        node.matchedPatterns.length * 0.65 +
        node.relationship.events.length * 0.35 +
        node.relationship.tags.length * 0.2 +
        node.connections.length * 0.55,
    )
    const position2d = positions2d.get(node.relationship.id)
    const position3d = positions3d.get(node.relationship.id)
    const graphMark = createRelationshipGraphMark({
      circleIndex: node.circle ? (circleIndexById.get(node.circle.id) ?? 0) : 0,
      markMode,
      relationship: node.relationship,
    })

    connectedNotesCount += node.relatedNotes.length
    elements.push({
      data: {
        circle: node.circle?.title ?? "",
        graphMarkKey: graphMark.key,
        id: node.relationship.id,
        impact: node.relationship.impact,
        kind: "relationship",
        label: node.relationship.name,
        stage: node.relationship.stage,
        type: node.relationship.type,
        unfinishedWeight: node.relationship.unfinishedWeight ?? "无",
        weight: relationshipWeight,
        ...(position3d
          ? {
              x: position3d.x,
              y: position3d.y,
              z: position3d.z,
            }
          : {}),
      },
      position: position2d,
    })
    metaByNodeId.set(node.relationship.id, {
      circle: node.circle,
      connections: node.connections,
      connectedRelationships: [],
      kind: "relationship",
      matchedPatterns: node.matchedPatterns,
      relatedNotes: node.relatedNotes,
      relationship: node.relationship,
    })
  })

  network.edges
    .filter((edge) => scopedNodeIds.has(edge.sourceId) && scopedNodeIds.has(edge.targetId))
    .forEach((edge) => {
      elements.push({
        data: {
          connectionStrength: edge.explicitStrength ?? "",
          id: edge.id,
          label: edge.label,
          linkKind: edge.linkKind,
          source: edge.sourceId,
          target: edge.targetId,
          weight: edge.weight,
        },
      })
    })

  metaByNodeId.forEach((meta, relationshipId) => {
    meta.connectedRelationships = [
      ...(network.connectedIdsByRelationshipId.get(relationshipId) ?? []),
    ]
      .filter((connectedId) => scopedNodeIds.has(connectedId))
      .map((connectedId) => relationshipById.get(connectedId))
      .filter((relationship): relationship is RelationshipPerson => Boolean(relationship))
  })

  return {
    connectedNotesCount,
    edgeCount: network.edges.filter(
      (edge) => scopedNodeIds.has(edge.sourceId) && scopedNodeIds.has(edge.targetId),
    ).length,
    elements,
    layout2d:
      scope.mode === "centered"
        ? { fit: true, name: "preset", padding: RELATIONSHIP_GRAPH_LAYOUT.padding }
        : RELATIONSHIP_GRAPH_LAYOUT,
    legendItems,
    metaByNodeId,
    nodeCount: metaByNodeId.size,
  }
}

function createRelationshipGraphMark({
  circleIndex,
  markMode,
  relationship,
}: {
  circleIndex: number
  markMode: RelationshipGraphMarkMode
  relationship: RelationshipPerson
}) {
  if (markMode === "impact") {
    const value = relationship.impact
    const mark = getGraphImpactMarks().find((item) => item.value === value)
    return {
      key: mark?.key ?? "impact-中性",
      label: value,
    }
  }

  if (markMode === "weight") {
    const value = relationship.unfinishedWeight ?? "无"
    const mark = getGraphWeightMarks().find((item) => item.value === value)
    return {
      key: mark?.key ?? "weight-none",
      label: value,
    }
  }

  if (markMode === "stage") {
    return {
      key: `stage-${relationship.stage}`,
      label: relationship.stage,
    }
  }

  return {
    key: `circle-${circleIndex % getGraphMarkPalette().length}`,
    label: "circle",
  }
}

function createRelationshipGraphLegendItems({
  circles,
  markMode,
  nodes,
  translateGraphLabel,
}: {
  circles: RelationshipCircle[]
  markMode: RelationshipGraphMarkMode
  nodes: ReturnType<typeof createRelationshipNetwork>["nodes"]
  translateGraphLabel: (group: RelationshipEnumGroup, value: string) => string
}): RelationshipGraphLegendItem[] {
  if (markMode === "impact") {
    const usedValues = new Set(nodes.map((node) => node.relationship.impact))
    return getGraphImpactMarks()
      .filter((mark) => usedValues.has(mark.value))
      .map((mark) => ({
        bg: mark.bg,
        border: mark.border,
        key: mark.key,
        label: translateGraphLabel("impact", mark.value),
      }))
  }

  if (markMode === "weight") {
    const usedValues = new Set(nodes.map((node) => node.relationship.unfinishedWeight ?? "无"))
    return getGraphWeightMarks()
      .filter((mark) => usedValues.has(mark.value))
      .map((mark) => ({
        bg: mark.bg,
        border: mark.border,
        key: mark.key,
        label: translateGraphLabel("unfinishedWeight", mark.value),
      }))
  }

  if (markMode === "stage") {
    const usedValues = new Set(nodes.map((node) => node.relationship.stage))
    return RELATIONSHIP_STAGES.filter((stage) => usedValues.has(stage)).map((stage, index) => {
      const color = getGraphMarkPalette()[index % getGraphMarkPalette().length]

      return {
        bg: color.bg,
        border: color.border,
        key: `stage-${stage}`,
        label: translateGraphLabel("stage", stage),
      }
    })
  }

  const usedCircleIds = new Set(nodes.map((node) => node.circle?.id).filter(Boolean))

  return circles.flatMap((circle, index) => {
    if (!usedCircleIds.has(circle.id)) {
      return []
    }

    const color = getGraphMarkPalette()[index % getGraphMarkPalette().length]

    return [
      {
        bg: color.bg,
        border: color.border,
        key: `circle-${circle.id}`,
        label: circle.title,
      },
    ]
  })
}

function createRelationshipNetwork(
  relationshipsModule: RelationshipMap,
  relationshipById: Map<string, RelationshipPerson>,
) {
  const nodes = getRelationshipsFromCircles(relationshipsModule.circles).map((relationship) => ({
    circle:
      relationshipsModule.circles.find((circle) =>
        circle.entries.some((entry) => entry.id === relationship.id),
      ) ?? null,
    connections: buildRelationshipConnectionPerspectives(
      relationshipsModule.connections,
      relationship.id,
    )
      .map((connection) => {
        const otherRelationship = relationshipById.get(connection.otherRelationshipId)
        const storedConnection = relationshipsModule.connections.find(
          (entry) => entry.id === connection.id,
        )

        if (!otherRelationship || !storedConnection) {
          return null
        }

        return {
          connection: storedConnection,
          otherRelationship,
          roles: connection.roles,
        }
      })
      .filter((connection): connection is RelationshipGraphNodeMeta["connections"][number] =>
        Boolean(connection),
      ),
    matchedPatterns: [] as RelationshipPattern[],
    relatedNotes: [] as RelationshipUnsentNote[],
    relationship,
  }))
  const nodeById = new Map(nodes.map((node) => [node.relationship.id, node]))
  const notesByRelationshipId = new Map<string, RelationshipUnsentNote[]>()
  const connectedIdsByRelationshipId = new Map<string, Set<string>>()
  const edgeByKey = new Map<
    string,
    {
      explicitStrength?: RelationshipConnectionStrength
      id: string
      label: string
      sourceId: string
      targetId: string
      weight: number
    }
  >()

  relationshipsModule.unsentNotes.forEach((note) => {
    if (!note.relationshipId || !nodeById.has(note.relationshipId)) {
      return
    }

    const bucket = notesByRelationshipId.get(note.relationshipId) ?? []
    bucket.push(note)
    notesByRelationshipId.set(note.relationshipId, bucket)
  })

  relationshipsModule.connections.forEach((connection) => {
    addRelationshipEdge(
      {
        explicitStrength: connection.strength,
        kind: "explicit",
        label:
          connection.roles.map((role) => `${role.sourceRole}/${role.targetRole}`).join(" · ") ||
          connection.note ||
          "explicit",
        sourceId: connection.sourceId,
        targetId: connection.targetId,
        weight: connectionWeightFromStrength(connection),
      },
      edgeByKey,
      connectedIdsByRelationshipId,
    )
  })

  nodes.forEach((node) => {
    node.relatedNotes = notesByRelationshipId.get(node.relationship.id) ?? []
  })

  return {
    connectedIdsByRelationshipId,
    edges: [...edgeByKey.values()].map((edge) => ({
      explicitStrength: edge.explicitStrength,
      id: edge.id,
      label: edge.label,
      linkKind: "explicit" as const,
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      weight: edge.weight,
    })),
    nodes,
  }
}

function addRelationshipEdge(
  edge: {
    explicitStrength?: RelationshipConnectionStrength
    kind: "explicit"
    label: string
    sourceId: string
    targetId: string
    weight: number
  },
  edgeByKey: Map<
    string,
    {
      explicitStrength?: RelationshipConnectionStrength
      id: string
      label: string
      sourceId: string
      targetId: string
      weight: number
    }
  >,
  connectedIdsByRelationshipId: Map<string, Set<string>>,
) {
  const [sourceId, targetId] = [edge.sourceId, edge.targetId].sort()
  const key = createRelationshipConnectionPairKey(sourceId, targetId)
  const existing = edgeByKey.get(key)

  edgeByKey.set(key, {
    explicitStrength: edge.explicitStrength ?? existing?.explicitStrength,
    id: key,
    label:
      existing?.label && existing.label !== edge.label
        ? `${existing.label} · ${edge.label}`
        : edge.label,
    sourceId,
    targetId,
    weight: (existing?.weight ?? 0) + edge.weight,
  })

  addConnectedRelationshipId(connectedIdsByRelationshipId, sourceId, targetId)
  addConnectedRelationshipId(connectedIdsByRelationshipId, targetId, sourceId)
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

function collectCenteredRelationshipIds(
  network: ReturnType<typeof createRelationshipNetwork>,
  rootId: string,
  maxDepth: number,
) {
  return bfsRelationshipIds(network.connectedIdsByRelationshipId, rootId, maxDepth)
}

function bfsRelationshipIds(adjacency: Map<string, Set<string>>, rootId: string, maxDepth: number) {
  const visited = new Set<string>([rootId])
  const queue: Array<{ depth: number; id: string }> = [{ depth: 0, id: rootId }]

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current || current.depth >= maxDepth) {
      continue
    }

    const nextIds = [...(adjacency.get(current.id) ?? [])].sort()

    nextIds.forEach((nextId) => {
      if (visited.has(nextId)) {
        return
      }

      visited.add(nextId)
      queue.push({ depth: current.depth + 1, id: nextId })
    })
  }

  return visited
}

function computeCenteredRingPositions2d(
  network: ReturnType<typeof createRelationshipNetwork>,
  rootId: string,
  scopedNodeIds: Set<string>,
) {
  const depthById = computeRelationshipDepths(network, rootId, scopedNodeIds)
  const positions = new Map<string, { x: number; y: number }>()
  const radiusByDepth = new Map<number, number>([
    [0, 0],
    [1, 220],
    [2, 420],
    [3, 560],
  ])

  positions.set(rootId, { x: 0, y: 0 })

  const grouped = groupRelationshipIdsByDepth(depthById, scopedNodeIds)
  grouped.forEach((ids, depth) => {
    if (depth === 0) {
      return
    }

    const radius = radiusByDepth.get(depth) ?? 220 + (depth - 1) * 180

    ids.forEach((id, index) => {
      const angle = -Math.PI / 2 + (Math.PI * 2 * index) / Math.max(ids.length, 1)
      positions.set(id, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      })
    })
  })

  return positions
}

function computeCenteredRingPositions3d(
  network: ReturnType<typeof createRelationshipNetwork>,
  rootId: string,
  positions2d: Map<string, { x: number; y: number }>,
) {
  const depthById = computeRelationshipDepths(network, rootId, new Set(positions2d.keys()))
  const positions = new Map<string, { x: number; y: number; z: number }>()

  positions2d.forEach((position, id) => {
    const depth = depthById.get(id) ?? 2
    positions.set(id, {
      x: position.x,
      y: position.y,
      z: depth === 0 ? 0 : depth === 1 ? 28 : depth === 2 ? -28 : 42,
    })
  })

  return positions
}

function computeRelationshipDepths(
  network: ReturnType<typeof createRelationshipNetwork>,
  rootId: string,
  scopedNodeIds: Set<string>,
) {
  const depthById = new Map<string, number>([[rootId, 0]])
  const queue: Array<{ depth: number; id: string }> = [{ depth: 0, id: rootId }]
  const adjacency = network.connectedIdsByRelationshipId

  while (queue.length > 0) {
    const current = queue.shift()
    if (!current) {
      continue
    }

    const nextIds = [...(adjacency.get(current.id) ?? [])]
      .filter((id) => scopedNodeIds.has(id))
      .sort()

    nextIds.forEach((nextId) => {
      if (depthById.has(nextId)) {
        return
      }

      depthById.set(nextId, current.depth + 1)
      queue.push({ depth: current.depth + 1, id: nextId })
    })
  }

  scopedNodeIds.forEach((id) => {
    if (!depthById.has(id)) {
      depthById.set(id, 2)
    }
  })

  return depthById
}

function groupRelationshipIdsByDepth(depthById: Map<string, number>, scopedNodeIds: Set<string>) {
  const grouped = new Map<number, string[]>()

  const sortedIds = [...scopedNodeIds].sort()

  sortedIds.forEach((id) => {
    const depth = depthById.get(id) ?? 2
    const bucket = grouped.get(depth) ?? []
    bucket.push(id)
    grouped.set(depth, bucket)
  })

  return grouped
}

function connectionWeightFromStrength(connection: RelationshipConnection) {
  const base = connection.strength === "强" ? 4.4 : connection.strength === "中" ? 3.1 : 2.1
  return base + connection.roles.length * 0.4
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
    connections: removeConnectionsForRelationship(relationshipsModule.connections, relationshipId),
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

function tabContentClassName(isStackedLayout: boolean) {
  return cn("mt-3", isStackedLayout ? "overflow-visible" : "min-h-0 flex-1 overflow-hidden")
}
