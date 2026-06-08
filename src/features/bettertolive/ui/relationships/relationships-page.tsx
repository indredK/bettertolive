import {
  Activity,
  MessageCircleMore,
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
  RelationshipMap,
  RelationshipPattern,
  RelationshipPerson,
  RelationshipUnsentNote,
  UnfinishedWeight,
} from "@/features/bettertolive/types"
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

export function RelationshipsPage({
  editableRelationshipsModule,
  relationshipsModule,
  searchQuery,
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
      <RelationshipPageHeader
        searchQuery={searchQuery}
        isControlMode={isControlMode}
        totalRelationships={relationships.length}
        totalNotes={relationshipsModule.unsentNotes.length}
        onCreateRelationship={() =>
          setEditingRelationship({
            isNew: true,
            circleId: sourceRelationshipsModule.circles[0]?.id ?? "",
            relationship: null,
          })
        }
        onCreateNote={() => setEditingNote({ isNew: true, note: null })}
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className={cn("min-h-0 flex-1", !isStackedLayout && "flex flex-col overflow-hidden")}
      >
        <TabsList className="hide-scrollbar max-w-full shrink-0 justify-start overflow-x-auto">
          <TabsTrigger value="overview">{t("relationships.tabs.overview", "总览")}</TabsTrigger>
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

function RelationshipPageHeader({
  isControlMode,
  onCreateNote,
  onCreateRelationship,
  searchQuery,
  totalNotes,
  totalRelationships,
}: {
  isControlMode: boolean
  onCreateNote: () => void
  onCreateRelationship: () => void
  searchQuery: string
  totalNotes: number
  totalRelationships: number
}) {
  const { t } = useTranslation()

  return (
    <Surface className="shrink-0 overflow-hidden p-4">
      <div className="flex flex-col gap-4 min-[900px]:flex-row min-[900px]:items-start min-[900px]:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]">
              {t("relationships.page.eyebrow", "关系深化")}
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "border-[color:var(--chip-border)]",
                isControlMode
                  ? "bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]"
                  : "bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]",
              )}
            >
              {isControlMode
                ? t("relationships.controlMode.on", "控制模式")
                : t("relationships.controlMode.off", "浏览模式")}
            </Badge>
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[color:var(--text-primary)]">
              {t("relationships.page.title", "关系状态与未完成表达")}
            </h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-[color:var(--text-muted)]">
              {t(
                "relationships.page.description",
                "用 5 个分类维度看关系世界，用未完成重量承接那些还没说出口的话。",
              )}
            </p>
          </div>
          {searchQuery.trim() ? (
            <Badge
              variant="outline"
              className="w-fit border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
            >
              {t("relationships.page.currentFilter", {
                query: searchQuery.trim(),
                defaultValue: `当前筛选：${searchQuery.trim()}`,
              })}
            </Badge>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2 min-[900px]:w-[360px]">
          <HeaderMetric
            label={t("relationships.page.relationshipCount", "关系")}
            value={totalRelationships}
          />
          <HeaderMetric label={t("relationships.page.noteCount", "表达")} value={totalNotes} />
          {isControlMode ? (
            <div className="col-span-2 flex flex-wrap justify-end gap-2">
              <Button size="sm" onClick={onCreateRelationship}>
                <Plus className="h-4 w-4" />
                {t("relationships.actions.addRelationship", "新增关系")}
              </Button>
              <Button size="sm" variant="outline" onClick={onCreateNote}>
                <MessageCircleMore className="h-4 w-4" />
                {t("relationships.actions.addNote", "新增表达")}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </Surface>
  )
}

function HeaderMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 py-2">
      <div className="text-[11px] text-[color:var(--text-muted)]">{label}</div>
      <div className="mt-1 text-lg font-semibold text-[color:var(--text-primary)] tabular-nums">
        {value}
      </div>
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
      <Surface className="flex min-h-0 flex-col overflow-visible p-3 lg:w-80 lg:shrink-0 lg:overflow-hidden">
        <ListHeader
          icon={Users2}
          title={t("relationships.directory.title", "关系档案")}
          count={filteredRelationshipCount}
          isControlMode={isControlMode}
          onCreate={onCreate}
        />
        <div className="mt-3 shrink-0 space-y-2">
          <div className="grid grid-cols-2 gap-2">
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
            <div className="col-span-2">
              <DimensionFilterSelect
                label={t("relationships.filter.interaction", "互动频率")}
                value={interactionFilter}
                options={INTERACTION_FREQUENCIES}
                group="interaction"
                onValueChange={setInteractionFilter}
              />
            </div>
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
      <SelectTrigger className="h-8 border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-xs">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
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
