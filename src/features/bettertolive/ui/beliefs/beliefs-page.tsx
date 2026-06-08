import {
  Brain,
  Edit3,
  Filter,
  Lightbulb,
  Link2,
  MessagesSquare,
  Plus,
  Sparkles,
  Trash2,
  Waypoints,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import type { BeliefEntryForm } from "@/features/bettertolive/api/beliefs-crud-api"
import {
  createBeliefEntry,
  deleteBeliefEntry,
  updateBeliefEntry,
} from "@/features/bettertolive/api/beliefs-crud-api"
import type {
  BeliefCbtLayer,
  BeliefDomain,
  BeliefEntry,
  BeliefImpact,
  BeliefLayer,
  BeliefRelation,
  BeliefRevision,
  BeliefSource,
  BeliefStability,
  BeliefsModuleData,
  CognitiveDistortion,
  DefenseMechanism,
} from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  Surface,
} from "@/features/bettertolive/ui/shared/shared"
import { confirmUndoableDelete } from "@/features/bettertolive/ui/shopping/shopping-delete"
import { cn } from "@/lib/utils"

const BELIEF_DOMAINS = [
  "关系",
  "工作",
  "金钱",
  "自我",
  "社会",
  "时间",
  "意义",
] satisfies BeliefDomain[]

const BELIEF_LAYERS = ["世界观", "人生观", "价值观"] satisfies BeliefLayer[]

const BELIEF_STABILITIES = ["稳定", "正在松动", "正在形成", "已放弃"] satisfies BeliefStability[]

const BELIEF_SOURCES = [
  "亲身经历",
  "家庭继承",
  "社会环境",
  "主动反思",
  "创伤反应",
] satisfies BeliefSource[]

const BELIEF_IMPACTS = ["支撑性", "限制性", "中性", "冲突中"] satisfies BeliefImpact[]

const BELIEF_CBT_LAYERS = ["自动思维", "中间信念", "核心信念"] satisfies BeliefCbtLayer[]

const COGNITIVE_DISTORTIONS = [
  "全有或全无",
  "过度概括",
  "灾难化",
  "读心术",
  "应该陈述",
  "个人化",
  "情绪推理",
  "贴标签",
] satisfies CognitiveDistortion[]

const DEFENSE_MECHANISMS = [
  "否认",
  "投射",
  "合理化",
  "理智化",
  "反向形成",
  "升华",
] satisfies DefenseMechanism[]

const ALL_FILTER_VALUE = "__all__"
const NONE_SELECT_VALUE = "__none__"

type DistributionRow = {
  label: string
  count: number
}

type BeliefFilters = {
  domain: BeliefDomain | null
  layer: BeliefLayer | null
  stability: BeliefStability | null
  source: BeliefSource | null
}

export type EditingBelief = { isNew: boolean; entry: BeliefEntry | null }

const DEFAULT_FILTERS: BeliefFilters = {
  domain: null,
  layer: null,
  stability: null,
  source: null,
}

function createDistribution<T extends string>(
  order: readonly T[],
  entries: BeliefEntry[],
  getValue: (entry: BeliefEntry) => T,
) {
  const counts = new Map<T, number>()
  entries.forEach((entry) => {
    const value = getValue(entry)
    counts.set(value, (counts.get(value) ?? 0) + 1)
  })

  return order.map((label) => ({
    label,
    count: counts.get(label) ?? 0,
  }))
}

function createBeliefLookup(entries: BeliefEntry[]) {
  return new Map(entries.map((entry) => [entry.id, entry]))
}

function listToText(values: string[] | undefined) {
  return (values ?? []).join("，")
}

function textToList(value: string) {
  return value
    .split(/[,\n，]/)
    .map((item) => item.trim())
    .filter((item, index, items) => item.length > 0 && items.indexOf(item) === index)
}

function todayText() {
  return new Date().toISOString().slice(0, 10)
}

function labelFor(t: ReturnType<typeof useTranslation>["t"], group: string, value: string) {
  return t(`beliefs.enums.${group}.${value}`, value)
}

function updateFilter<K extends keyof BeliefFilters>(
  current: BeliefFilters,
  key: K,
  value: BeliefFilters[K],
) {
  return {
    ...current,
    [key]: value,
  }
}

function toggleValue<T extends string>(values: T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

export function BeliefsPage({
  beliefsModule,
  searchQuery,
  isStackedLayout = false,
  isControlMode = false,
  onRefresh,
}: {
  beliefsModule: BeliefsModuleData
  searchQuery: string
  isStackedLayout?: boolean
  isControlMode?: boolean
  onRefresh?: () => void
}) {
  const { t } = useTranslation()
  const isFixedLayout = !isStackedLayout
  const [filters, setFilters] = useState<BeliefFilters>(DEFAULT_FILTERS)
  const [editingBelief, setEditingBelief] = useState<EditingBelief | null>(null)
  const allEntries = beliefsModule.entries
  const entries = useMemo(
    () =>
      allEntries.filter(
        (entry) =>
          (!filters.domain || entry.domain === filters.domain) &&
          (!filters.layer || entry.layer === filters.layer) &&
          (!filters.stability || entry.stability === filters.stability) &&
          (!filters.source || entry.source === filters.source),
      ),
    [allEntries, filters],
  )
  const beliefById = createBeliefLookup(allEntries)
  const visibleEntryIds = new Set(entries.map((entry) => entry.id))
  const relations = beliefsModule.relations.filter(
    (relation) => visibleEntryIds.has(relation.fromId) || visibleEntryIds.has(relation.toId),
  )
  const classificationSections = [
    {
      key: "domain",
      title: t("beliefs.classification.domain.title", "领域"),
      description: t("beliefs.classification.domain.description", "它主要作用于哪个生活面。"),
      rows: createDistribution(BELIEF_DOMAINS, entries, (entry) => entry.domain),
      enumGroup: "domain",
    },
    {
      key: "layer",
      title: t("beliefs.classification.layer.title", "层次"),
      description: t("beliefs.classification.layer.description", "它在认知的哪一层。"),
      rows: createDistribution(BELIEF_LAYERS, entries, (entry) => entry.layer),
      enumGroup: "layer",
    },
    {
      key: "stability",
      title: t("beliefs.classification.stability.title", "稳定性"),
      description: t("beliefs.classification.stability.description", "它现在是否还在变化。"),
      rows: createDistribution(BELIEF_STABILITIES, entries, (entry) => entry.stability),
      enumGroup: "stability",
    },
    {
      key: "source",
      title: t("beliefs.classification.source.title", "来源"),
      description: t("beliefs.classification.source.description", "它从哪里长出来。"),
      rows: createDistribution(BELIEF_SOURCES, entries, (entry) => entry.source),
      enumGroup: "source",
    },
  ]
  const impactRows = createDistribution(BELIEF_IMPACTS, entries, (entry) => entry.impact)
  const conflictingBeliefs = entries.filter((entry) => entry.impact === "冲突中")
  const changingBeliefs = entries.filter(
    (entry) => entry.stability === "正在松动" || entry.stability === "正在形成",
  )

  const handleSaved = () => {
    setEditingBelief(null)
    onRefresh?.()
    toast.success(t("beliefs.toast.saved", "已保存"))
  }

  const handleDeleted = () => {
    setEditingBelief(null)
    onRefresh?.()
  }

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <PageIntro
        eyebrow={t("beliefs.page.eyebrow", "观念")}
        title={t("beliefs.page.title", "观念图谱")}
        description={t("beliefs.page.description", "4 维分类 + impact 分布 + 心理学解读")}
        searchQuery={searchQuery}
      />

      {isFixedLayout ? (
        <BeliefsFixedDashboard
          classificationSections={classificationSections}
          impactRows={impactRows}
          conflictingBeliefs={conflictingBeliefs}
          changingBeliefs={changingBeliefs}
          beliefById={beliefById}
          entries={entries}
          relations={relations}
          beliefsModule={beliefsModule}
          filters={filters}
          isControlMode={isControlMode}
          onFilterChange={setFilters}
          onCreate={() => setEditingBelief({ isNew: true, entry: null })}
          onEdit={(entry) => setEditingBelief({ isNew: false, entry })}
        />
      ) : (
        <BeliefsStackedView
          classificationSections={classificationSections}
          impactRows={impactRows}
          beliefById={beliefById}
          entries={entries}
          relations={relations}
          beliefsModule={beliefsModule}
          filters={filters}
          isControlMode={isControlMode}
          onFilterChange={setFilters}
          onCreate={() => setEditingBelief({ isNew: true, entry: null })}
          onEdit={(entry) => setEditingBelief({ isNew: false, entry })}
        />
      )}

      {editingBelief ? (
        <BeliefEditDialog
          key={editingBelief.entry?.id ?? "new-belief"}
          editing={editingBelief}
          onClose={() => setEditingBelief(null)}
          onSaved={handleSaved}
          onDeleted={handleDeleted}
        />
      ) : null}
    </div>
  )
}

function BeliefsFixedDashboard({
  classificationSections,
  impactRows,
  conflictingBeliefs,
  changingBeliefs,
  beliefById,
  entries,
  relations,
  beliefsModule,
  filters,
  isControlMode,
  onFilterChange,
  onCreate,
  onEdit,
}: {
  classificationSections: Array<{
    key: string
    title: string
    description: string
    rows: DistributionRow[]
    enumGroup: string
  }>
  impactRows: DistributionRow[]
  conflictingBeliefs: BeliefEntry[]
  changingBeliefs: BeliefEntry[]
  beliefById: Map<string, BeliefEntry>
  entries: BeliefEntry[]
  relations: BeliefRelation[]
  beliefsModule: BeliefsModuleData
  filters: BeliefFilters
  isControlMode: boolean
  onFilterChange: (filters: BeliefFilters) => void
  onCreate: () => void
  onEdit: (entry: BeliefEntry) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(300px,0.75fr)] grid-rows-[minmax(0,0.95fr)_minmax(0,1fr)] gap-3 overflow-hidden min-[1180px]:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(320px,0.86fr)]">
      <Surface className="flex min-h-0 flex-col overflow-hidden p-4 min-[1180px]:col-span-2">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <BeliefToolbar
            filters={filters}
            total={entries.length}
            isControlMode={isControlMode}
            onFilterChange={onFilterChange}
            onCreate={onCreate}
          />

          <div className="grid gap-2 min-[1180px]:grid-cols-4">
            {classificationSections.map((section) => (
              <ClassificationPanel
                key={section.key}
                title={section.title}
                description={section.description}
                rows={section.rows}
                enumGroup={section.enumGroup}
                total={entries.length}
              />
            ))}
          </div>

          <ImpactDistribution rows={impactRows} />

          <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-xs leading-5 text-[color:var(--text-muted)]">
            <span className="font-medium text-[color:var(--text-primary)]">
              {t("beliefs.attachment.title", "依恋观察")}：
            </span>
            {beliefsModule.attachmentReflection}
          </div>
        </div>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <SectionHeading
          icon={MessagesSquare}
          title={t("beliefs.questions.title", "反复出现的问题")}
          description={t("beliefs.questions.description", "把会反复追问自己的问题先收进来。")}
          compact
        />
        <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {beliefsModule.questions.length > 0 ? (
            beliefsModule.questions.map((question) => (
              <div
                key={question}
                className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-2.5 text-xs leading-5 text-[color:var(--text-secondary)]"
              >
                {question}
              </div>
            ))
          ) : (
            <EmptyState
              message={t("beliefs.empty.questions", "当前筛选下没有可展示的问题。")}
              compact
            />
          )}
        </div>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4 min-[1180px]:col-span-2">
        <Tabs defaultValue="entries" className="min-h-0 flex-1">
          <TabsList className="hide-scrollbar w-full justify-start gap-1 overflow-x-auto rounded-lg bg-[color:var(--chip-bg)] p-1">
            <TabsTrigger value="entries">{t("beliefs.tabs.entries", "观念清单")}</TabsTrigger>
            <TabsTrigger value="cards">{t("beliefs.tabs.cards", "三层骨架")}</TabsTrigger>
            <TabsTrigger value="relations">{t("beliefs.tabs.relations", "相互关系")}</TabsTrigger>
          </TabsList>

          <TabsContent value="entries" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-3">
              {entries.length > 0 ? (
                entries.map((entry) => (
                  <BeliefCard
                    key={entry.id}
                    entry={entry}
                    compact
                    isControlMode={isControlMode}
                    onEdit={() => onEdit(entry)}
                  />
                ))
              ) : (
                <EmptyState
                  message={t("beliefs.empty.entries", "当前筛选下没有可展示的观念条目。")}
                  compact
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="cards" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <BeliefSkeletonCards beliefsModule={beliefsModule} compact />
          </TabsContent>

          <TabsContent value="relations" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <BeliefRelationsList relations={relations} beliefById={beliefById} compact />
          </TabsContent>
        </Tabs>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <SignalSection
            title={t("beliefs.signals.conflict", "正在张力中")}
            entries={conflictingBeliefs}
            emptyMessage={t("beliefs.empty.conflicts", "当前筛选下没有冲突中的观念。")}
          />

          <SignalSection
            title={t("beliefs.signals.changing", "正在变化")}
            entries={changingBeliefs.slice(0, 4)}
            emptyMessage={t("beliefs.empty.changing", "当前筛选下没有正在变化的观念。")}
            subtle
          />
        </div>
      </Surface>
    </div>
  )
}

function BeliefsStackedView({
  classificationSections,
  impactRows,
  beliefById,
  entries,
  relations,
  beliefsModule,
  filters,
  isControlMode,
  onFilterChange,
  onCreate,
  onEdit,
}: {
  classificationSections: Array<{
    key: string
    title: string
    description: string
    rows: DistributionRow[]
    enumGroup: string
  }>
  impactRows: DistributionRow[]
  beliefById: Map<string, BeliefEntry>
  entries: BeliefEntry[]
  relations: BeliefRelation[]
  beliefsModule: BeliefsModuleData
  filters: BeliefFilters
  isControlMode: boolean
  onFilterChange: (filters: BeliefFilters) => void
  onCreate: () => void
  onEdit: (entry: BeliefEntry) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <Surface className="p-5">
        <SectionHeading
          icon={Waypoints}
          title={t("beliefs.classification.title", "4 维观念分类")}
          description={t(
            "beliefs.classification.description",
            "按 4 维分组、过滤、看认知地图；impact 跟着每条走，不进主筛选器。",
          )}
        />

        <div className="mt-5">
          <BeliefToolbar
            filters={filters}
            total={entries.length}
            isControlMode={isControlMode}
            onFilterChange={onFilterChange}
            onCreate={onCreate}
          />
        </div>

        <div className="mt-5 grid gap-3 min-[960px]:grid-cols-2 min-[1240px]:grid-cols-4">
          {classificationSections.map((section) => (
            <ClassificationPanel
              key={section.key}
              title={section.title}
              description={section.description}
              rows={section.rows}
              enumGroup={section.enumGroup}
              total={entries.length}
            />
          ))}
        </div>

        <div className="mt-4">
          <ImpactDistribution rows={impactRows} />
        </div>
      </Surface>

      <div className="grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
        <Surface className="p-5">
          <SectionHeading
            icon={Lightbulb}
            title={t("beliefs.entries.title", "观念清单")}
            description={t("beliefs.entries.description", "详情里始终显示 impact 与心理学解读。")}
          />
          <div className="mt-5 space-y-4">
            {entries.length > 0 ? (
              entries.map((entry) => (
                <BeliefCard
                  key={entry.id}
                  entry={entry}
                  isControlMode={isControlMode}
                  onEdit={() => onEdit(entry)}
                />
              ))
            ) : (
              <EmptyState
                message={t("beliefs.empty.entries", "当前筛选下没有可展示的观念条目。")}
                compact
              />
            )}
          </div>
        </Surface>

        <div className="space-y-4">
          <Surface className="p-5">
            <SectionHeading
              icon={MessagesSquare}
              title={t("beliefs.questions.title", "反复出现的问题")}
              description={t("beliefs.questions.description", "先把会反复追问自己的问题收进来。")}
            />
            <div className="mt-5 space-y-3">
              {beliefsModule.questions.length > 0 ? (
                beliefsModule.questions.map((question) => (
                  <div
                    key={question}
                    className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]"
                  >
                    {question}
                  </div>
                ))
              ) : (
                <EmptyState
                  message={t("beliefs.empty.questions", "当前筛选下没有可展示的问题。")}
                  compact
                />
              )}
            </div>
          </Surface>

          <Surface className="p-5">
            <SectionHeading
              icon={Link2}
              title={t("beliefs.relations.title", "相互关系")}
              description={t("beliefs.relations.description", "观念之间会相似、对立或派生。")}
            />
            <div className="mt-5">
              <BeliefRelationsList relations={relations} beliefById={beliefById} />
            </div>
          </Surface>
        </div>
      </div>

      <Surface className="p-5">
        <SectionHeading
          icon={Brain}
          title={t("beliefs.cards.title", "三层骨架")}
          description={t("beliefs.cards.description", "世界观、人生观和价值观的摘要骨架。")}
        />
        <div className="mt-5">
          <BeliefSkeletonCards beliefsModule={beliefsModule} />
        </div>
      </Surface>
    </div>
  )
}

function BeliefToolbar({
  filters,
  total,
  isControlMode,
  onFilterChange,
  onCreate,
}: {
  filters: BeliefFilters
  total: number
  isControlMode: boolean
  onFilterChange: (filters: BeliefFilters) => void
  onCreate: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-3 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-[color:var(--text-primary)]">
          <Filter className="size-4" />
          <span>{t("beliefs.filter.title", "四维筛选")}</span>
          <Badge
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
          >
            {t("beliefs.filter.count", "{{count}} 条", { count: total })}
          </Badge>
        </div>

        {isControlMode ? (
          <Button size="sm" onClick={onCreate}>
            <Plus className="size-3.5" />
            {t("beliefs.actions.create", "新增观念")}
          </Button>
        ) : null}
      </div>

      <div className="mt-3 grid gap-2 min-[720px]:grid-cols-2 min-[1180px]:grid-cols-4">
        <BeliefFilterSelect
          label={t("beliefs.classification.domain.title", "领域")}
          value={filters.domain}
          options={BELIEF_DOMAINS}
          enumGroup="domain"
          onChange={(value) => onFilterChange(updateFilter(filters, "domain", value))}
        />
        <BeliefFilterSelect
          label={t("beliefs.classification.layer.title", "层次")}
          value={filters.layer}
          options={BELIEF_LAYERS}
          enumGroup="layer"
          onChange={(value) => onFilterChange(updateFilter(filters, "layer", value))}
        />
        <BeliefFilterSelect
          label={t("beliefs.classification.stability.title", "稳定性")}
          value={filters.stability}
          options={BELIEF_STABILITIES}
          enumGroup="stability"
          onChange={(value) => onFilterChange(updateFilter(filters, "stability", value))}
        />
        <BeliefFilterSelect
          label={t("beliefs.classification.source.title", "来源")}
          value={filters.source}
          options={BELIEF_SOURCES}
          enumGroup="source"
          onChange={(value) => onFilterChange(updateFilter(filters, "source", value))}
        />
      </div>
    </div>
  )
}

function BeliefFilterSelect<T extends string>({
  label,
  value,
  options,
  enumGroup,
  onChange,
}: {
  label: string
  value: T | null
  options: readonly T[]
  enumGroup: string
  onChange: (value: T | null) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] text-[color:var(--text-muted)]">{label}</Label>
      <Select
        value={value ?? ALL_FILTER_VALUE}
        onValueChange={(nextValue) =>
          onChange(nextValue === ALL_FILTER_VALUE ? null : (nextValue as T))
        }
      >
        <SelectTrigger className="w-full border-[color:var(--chip-border)] bg-[color:var(--surface-bg)]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_FILTER_VALUE}>{t("beliefs.filter.all", "全部")}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {labelFor(t, enumGroup, option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function ClassificationPanel({
  title,
  description,
  rows,
  enumGroup,
  total,
}: {
  title: string
  description: string
  rows: DistributionRow[]
  enumGroup: string
  total: number
}) {
  const { t } = useTranslation()
  const visibleRows = rows.filter((row) => row.count > 0)

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
      <div className="text-sm font-medium text-[color:var(--text-primary)]">{title}</div>
      <p className="mt-1 min-h-[2.25rem] text-xs leading-5 text-[color:var(--text-muted)]">
        {description}
      </p>
      <div className="mt-4 space-y-3">
        {visibleRows.length > 0 ? (
          visibleRows.map((row) => {
            const width = total > 0 ? `${Math.max((row.count / total) * 100, 10)}%` : "0%"

            return (
              <div key={row.label} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate text-[color:var(--text-secondary)]">
                    {labelFor(t, enumGroup, row.label)}
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
            {t("beliefs.empty.distribution", "暂无分布数据。")}
          </div>
        )}
      </div>
    </div>
  )
}

function ImpactDistribution({ rows }: { rows: DistributionRow[] }) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4">
      <div className="text-sm font-medium text-[color:var(--text-primary)]">
        {t("beliefs.impact.title", "影响方向 (impact)")}
      </div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
        {t("beliefs.impact.description", "影响方向不是第 5 维分类，而是每条观念的内禀属性。")}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {rows
          .filter((row) => row.count > 0)
          .map((row) => (
            <Badge
              key={row.label}
              variant="outline"
              className={cn("border-[color:var(--chip-border)]", impactClass(row.label))}
            >
              {labelFor(t, "impact", row.label)} · {row.count}
            </Badge>
          ))}
      </div>
    </div>
  )
}

function BeliefSkeletonCards({
  beliefsModule,
  compact = false,
}: {
  beliefsModule: BeliefsModuleData
  compact?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className={cn("space-y-2", !compact && "grid gap-3 space-y-0 min-[960px]:grid-cols-3")}>
      {beliefsModule.cards.length > 0 ? (
        beliefsModule.cards.map((card) => (
          <div
            key={card.id}
            className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
              >
                {labelFor(t, "layer", card.label)}
              </Badge>
              <div className="text-[11px] text-[color:var(--text-muted)]">
                {card.keywords.join(" / ")}
              </div>
            </div>
            <h3 className="mt-2 text-sm font-medium text-[color:var(--text-primary)]">
              {card.summary}
            </h3>
            <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">{card.note}</p>
          </div>
        ))
      ) : (
        <EmptyState message={t("beliefs.empty.cards", "当前筛选下没有三层骨架。")} compact />
      )}
    </div>
  )
}

function BeliefRelationsList({
  relations,
  beliefById,
  compact = false,
}: {
  relations: BeliefRelation[]
  beliefById: Map<string, BeliefEntry>
  compact?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      {relations.length > 0 ? (
        relations.map((relation) => (
          <BeliefRelationCard
            key={relation.id}
            relation={relation}
            beliefById={beliefById}
            compact={compact}
          />
        ))
      ) : (
        <EmptyState message={t("beliefs.empty.relations", "当前筛选下没有观念关系。")} compact />
      )}
    </div>
  )
}

function SignalSection({
  title,
  entries,
  emptyMessage,
  subtle = false,
}: {
  title: string
  entries: BeliefEntry[]
  emptyMessage: string
  subtle?: boolean
}) {
  return (
    <div
      className={cn(
        "space-y-2",
        subtle && "border-t border-[color:var(--muted-surface-border)] pt-3",
      )}
    >
      <div className="text-xs font-medium tracking-wide text-[color:var(--text-primary)]">
        {title}
      </div>
      {entries.length > 0 ? (
        entries.map((entry) => <BeliefSignalCard key={entry.id} entry={entry} subtle={subtle} />)
      ) : (
        <EmptyState message={emptyMessage} compact />
      )}
    </div>
  )
}

function BeliefCard({
  entry,
  compact = false,
  isControlMode = false,
  onEdit,
}: {
  entry: BeliefEntry
  compact?: boolean
  isControlMode?: boolean
  onEdit?: () => void
}) {
  const { t } = useTranslation()
  const hasPsych =
    Boolean(entry.cbtLayer) ||
    (entry.cognitiveDistortions && entry.cognitiveDistortions.length > 0) ||
    Boolean(entry.defenseMechanism) ||
    Boolean(entry.attachmentNote)

  return (
    <article
      className={cn(
        "rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4",
        compact && "px-3 py-3",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge className="bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]">
            {labelFor(t, "domain", entry.domain)}
          </Badge>
          <Badge
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
          >
            {labelFor(t, "layer", entry.layer)}
          </Badge>
          <Badge
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
          >
            {labelFor(t, "stability", entry.stability)}
          </Badge>
          <ImpactBadge impact={entry.impact} />
        </div>
        {isControlMode && onEdit ? (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label={t("beliefs.actions.edit", "编辑")}
          >
            <Edit3 className="size-3.5" />
          </Button>
        ) : null}
      </div>

      <h3
        className={cn(
          "mt-3 text-base font-medium text-[color:var(--text-primary)]",
          compact && "text-sm",
        )}
      >
        {entry.title}
      </h3>
      <p
        className={cn(
          "mt-2 text-sm leading-6 text-[color:var(--text-secondary)]",
          compact && "text-xs leading-5",
        )}
      >
        {entry.statement}
      </p>
      <p
        className={cn(
          "mt-2 text-sm leading-6 text-[color:var(--text-muted)]",
          compact && "text-xs leading-5",
        )}
      >
        {entry.description}
      </p>

      <div className="mt-4 grid gap-2 min-[640px]:grid-cols-2">
        <BeliefMeta
          label={t("beliefs.field.source", "来源")}
          value={labelFor(t, "source", entry.source)}
        />
        <BeliefMeta
          label={t("beliefs.field.impact", "影响方向")}
          value={labelFor(t, "impact", entry.impact)}
          accent
        />
        {entry.secondaryDomains && entry.secondaryDomains.length > 0 ? (
          <BeliefMeta
            label={t("beliefs.field.secondaryDomains", "次要领域")}
            value={entry.secondaryDomains
              .map((domain) => labelFor(t, "domain", domain))
              .join(" / ")}
          />
        ) : null}
        {entry.cbtLayer ? (
          <BeliefMeta
            label={t("beliefs.field.cbtLayer", "CBT 层次")}
            value={labelFor(t, "cbtLayer", entry.cbtLayer)}
          />
        ) : null}
      </div>

      {hasPsych ? (
        <details
          className={cn(
            "mt-3 rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 py-2.5",
            compact && "px-3 py-2",
          )}
        >
          <summary className="flex cursor-pointer items-center gap-2 text-xs font-medium text-[color:var(--text-primary)]">
            <Brain className="size-3.5" />
            {t("beliefs.psych.title", "心理学解读 (可选)")}
          </summary>
          <div className="mt-3 space-y-2 text-xs leading-5 text-[color:var(--text-secondary)]">
            {entry.cognitiveDistortions && entry.cognitiveDistortions.length > 0 ? (
              <div>
                <span className="font-medium text-[color:var(--text-primary)]">
                  {t("beliefs.field.cognitiveDistortions", "认知扭曲")}：
                </span>
                <span className="ml-1 inline-flex flex-wrap gap-1.5">
                  {entry.cognitiveDistortions.map((distortion) => (
                    <Badge
                      key={distortion}
                      variant="outline"
                      className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
                    >
                      {labelFor(t, "cognitiveDistortion", distortion)}
                    </Badge>
                  ))}
                </span>
              </div>
            ) : null}
            {entry.defenseMechanism ? (
              <div>
                <span className="font-medium text-[color:var(--text-primary)]">
                  {t("beliefs.field.defenseMechanism", "防御机制")}：
                </span>
                <span className="ml-1 text-[color:var(--text-muted)]">
                  {labelFor(t, "defenseMechanism", entry.defenseMechanism)}
                </span>
              </div>
            ) : null}
            {entry.attachmentNote ? (
              <div>
                <span className="font-medium text-[color:var(--text-primary)]">
                  {t("beliefs.attachment.title", "依恋观察")}：
                </span>
                <span className="ml-1 text-[color:var(--text-muted)]">{entry.attachmentNote}</span>
              </div>
            ) : null}
          </div>
        </details>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {entry.tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
          >
            {tag}
          </Badge>
        ))}
      </div>

      {entry.revisionHistory.length > 0 ? (
        <div className="mt-3 space-y-2">
          {entry.revisionHistory.map((revision) => (
            <div
              key={revision.id}
              className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-3 py-2 text-xs leading-5 text-[color:var(--text-muted)]"
            >
              <span className="font-medium text-[color:var(--text-primary)]">{revision.date}</span>
              ：{revision.summary}
              <span className="ml-1 text-[10px] tracking-wide">
                (
                {revision.changedFields
                  .map((field) => labelFor(t, "revisionField", field))
                  .join(" / ")}
                )
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  )
}

function BeliefMeta({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-3 py-2">
      <div className="text-[11px] text-[color:var(--text-muted)]">{label}</div>
      <div
        className={cn(
          "mt-1 text-sm font-medium text-[color:var(--text-primary)]",
          accent && "text-[color:var(--tone-value-ink)]",
        )}
      >
        {value}
      </div>
    </div>
  )
}

function impactClass(impact: string) {
  return impact === "支撑性"
    ? "bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]"
    : impact === "限制性"
      ? "bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]"
      : impact === "冲突中"
        ? "bg-[color:var(--tone-past-bg)] text-[color:var(--tone-past-ink)]"
        : "bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
}

function ImpactBadge({ impact }: { impact: BeliefImpact }) {
  const { t } = useTranslation()
  return <Badge className={impactClass(impact)}>{labelFor(t, "impact", impact)}</Badge>
}

function BeliefRelationCard({
  relation,
  beliefById,
  compact = false,
}: {
  relation: BeliefRelation
  beliefById: Map<string, BeliefEntry>
  compact?: boolean
}) {
  const { t } = useTranslation()
  const from = beliefById.get(relation.fromId)
  const to = beliefById.get(relation.toId)
  const typeStyle =
    relation.type === "相似"
      ? "bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]"
      : relation.type === "派生"
        ? "bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]"
        : "bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]"

  return (
    <div
      className={cn(
        "rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4",
        compact && "px-3 py-3",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={typeStyle}>{labelFor(t, "relationType", relation.type)}</Badge>
        <span className={cn("text-sm text-[color:var(--text-muted)]", compact && "text-xs")}>
          {from?.title ?? relation.fromId} → {to?.title ?? relation.toId}
        </span>
      </div>
      <p
        className={cn(
          "mt-3 text-sm leading-6 text-[color:var(--text-secondary)]",
          compact && "text-xs leading-5",
        )}
      >
        {relation.note}
      </p>
    </div>
  )
}

function BeliefSignalCard({ entry, subtle = false }: { entry: BeliefEntry; subtle?: boolean }) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-3",
        subtle
          ? "border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)]"
          : "border-[color:var(--chip-border)] bg-[color:var(--chip-bg)]",
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge className="bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]">
          {labelFor(t, "domain", entry.domain)}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {labelFor(t, "stability", entry.stability)}
        </Badge>
        <ImpactBadge impact={entry.impact} />
      </div>
      <div className="mt-2 text-sm font-medium text-[color:var(--text-primary)]">{entry.title}</div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">{entry.statement}</p>
      {entry.attachmentNote ? (
        <p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[color:var(--text-muted)]">
          <Sparkles className="size-3" />
          {entry.attachmentNote}
        </p>
      ) : null}
    </div>
  )
}

function BeliefEditDialog({
  editing,
  onClose,
  onSaved,
  onDeleted,
}: {
  editing: EditingBelief
  onClose: () => void
  onSaved: () => void
  onDeleted: () => void
}) {
  const { t } = useTranslation()
  const seed = editing.entry
  const [title, setTitle] = useState(seed?.title ?? "")
  const [statement, setStatement] = useState(seed?.statement ?? "")
  const [description, setDescription] = useState(seed?.description ?? "")
  const [domain, setDomain] = useState<BeliefDomain>(seed?.domain ?? BELIEF_DOMAINS[0])
  const [layer, setLayer] = useState<BeliefLayer>(seed?.layer ?? BELIEF_LAYERS[0])
  const [stability, setStability] = useState<BeliefStability>(
    seed?.stability ?? BELIEF_STABILITIES[0],
  )
  const [source, setSource] = useState<BeliefSource>(seed?.source ?? BELIEF_SOURCES[0])
  const [impact, setImpact] = useState<BeliefImpact>(seed?.impact ?? BELIEF_IMPACTS[0])
  const [secondaryDomains, setSecondaryDomains] = useState<BeliefDomain[]>(
    seed?.secondaryDomains ?? [],
  )
  const [cbtLayer, setCbtLayer] = useState<BeliefCbtLayer | null>(seed?.cbtLayer ?? null)
  const [cognitiveDistortions, setCognitiveDistortions] = useState<CognitiveDistortion[]>(
    seed?.cognitiveDistortions ?? [],
  )
  const [defenseMechanism, setDefenseMechanism] = useState<DefenseMechanism | null>(
    seed?.defenseMechanism ?? null,
  )
  const [attachmentNote, setAttachmentNote] = useState(seed?.attachmentNote ?? "")
  const [tags, setTags] = useState(listToText(seed?.tags))

  const canSubmit = title.trim().length > 0 && statement.trim().length > 0

  const handleDomainChange = (nextDomain: BeliefDomain) => {
    setDomain(nextDomain)
    setSecondaryDomains((current) => current.filter((item) => item !== nextDomain))
  }

  const createAutoRevision = (): BeliefRevision | null => {
    if (!seed) return null

    const changedFields: BeliefRevision["changedFields"] = []
    if (
      seed.title !== title.trim() ||
      seed.statement !== statement.trim() ||
      seed.description !== description.trim() ||
      seed.domain !== domain ||
      seed.layer !== layer ||
      seed.source !== source ||
      listToText(seed.secondaryDomains) !==
        listToText(secondaryDomains.filter((item) => item !== domain)) ||
      (seed.cbtLayer ?? null) !== cbtLayer ||
      listToText(seed.cognitiveDistortions) !== listToText(cognitiveDistortions) ||
      (seed.defenseMechanism ?? null) !== defenseMechanism ||
      (seed.attachmentNote ?? "") !== attachmentNote.trim() ||
      listToText(seed.tags) !== listToText(textToList(tags))
    ) {
      changedFields.push("内容")
    }
    if (seed.stability !== stability) {
      changedFields.push("稳定性")
    }
    if (seed.impact !== impact) {
      changedFields.push("影响")
    }

    if (changedFields.length === 0) return null

    return {
      id: `${seed.id}-rev-${Date.now()}`,
      date: todayText(),
      summary: t("beliefs.revision.autoSummary", "管理模式更新了这条观念。"),
      changedFields,
    }
  }

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error(t("beliefs.error.required", "请填写标题和观念表述"))
      return
    }

    const autoRevision = createAutoRevision()
    const form: BeliefEntryForm = {
      id: seed?.id,
      title: title.trim(),
      statement: statement.trim(),
      description: description.trim(),
      domain,
      layer,
      stability,
      source,
      impact,
      secondaryDomains: secondaryDomains.filter((item) => item !== domain),
      cbtLayer: cbtLayer ?? undefined,
      cognitiveDistortions,
      defenseMechanism: defenseMechanism ?? undefined,
      attachmentNote: attachmentNote.trim() || undefined,
      revisionHistory: autoRevision
        ? [...(seed?.revisionHistory ?? []), autoRevision]
        : (seed?.revisionHistory ?? []),
      tags: textToList(tags),
    }

    try {
      if (editing.isNew) {
        await createBeliefEntry(form)
      } else {
        await updateBeliefEntry(form)
      }
      onSaved()
    } catch (error) {
      toast.error(String(error))
    }
  }

  const handleDelete = () => {
    if (!seed) return

    const scheduled = confirmUndoableDelete({
      confirmMessage: t("beliefs.confirm.deleteEntry", {
        name: seed.title,
        defaultValue: `确定删除 ${seed.title} 吗？`,
      }),
      pendingMessage: t("beliefs.toast.deletePending", {
        name: seed.title,
        defaultValue: `已加入删除队列：${seed.title}，5 秒内可撤销`,
      }),
      successMessage: t("beliefs.toast.deleteSuccess", {
        name: seed.title,
        defaultValue: `已删除观念：${seed.title}`,
      }),
      failureMessage: t("beliefs.toast.deleteFailed", "删除观念失败"),
      undoLabel: t("beliefs.undo", "撤销"),
      undoneMessage: t("beliefs.toast.deleteUndone", {
        name: seed.title,
        defaultValue: `已撤销删除：${seed.title}`,
      }),
      onDelete: () => deleteBeliefEntry(seed.id),
      onDeleted,
    })

    if (scheduled) {
      onClose()
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="border-foreground/10 bg-background flex max-h-[90vh] flex-col overflow-hidden border shadow-lg sm:max-w-[min(1080px,calc(100vw-3rem))]">
        <DialogHeader className="border-foreground/10 bg-background/95 supports-[backdrop-filter]:bg-background/90 sticky top-0 z-10 -mx-4 -mt-4 border-b px-4 pt-4 pr-12 pb-3 supports-[backdrop-filter]:backdrop-blur-xs">
          <DialogTitle>
            {editing.isNew
              ? t("beliefs.actions.create", "新增观念")
              : t("beliefs.actions.editEntry", "编辑观念")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto pr-1 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="border-foreground/10 bg-card/70 space-y-4 rounded-lg border p-4">
            <div className="text-foreground text-sm font-medium">
              {t("beliefs.form.basic", "基本内容")}
            </div>
            <FieldTextInput
              label={t("beliefs.field.title", "标题")}
              value={title}
              onChange={setTitle}
              required
            />
            <FieldTextarea
              label={t("beliefs.field.statement", "观念表述")}
              value={statement}
              onChange={setStatement}
              rows={4}
              required
            />
            <FieldTextarea
              label={t("beliefs.field.description", "说明")}
              value={description}
              onChange={setDescription}
              rows={5}
            />
            <FieldTextInput
              label={t("beliefs.field.tags", "标签")}
              value={tags}
              onChange={setTags}
              placeholder={t("beliefs.form.tagsPlaceholder", "用逗号分隔")}
            />
          </div>

          <div className="border-foreground/10 bg-card/70 space-y-4 rounded-lg border p-4">
            <div className="text-foreground text-sm font-medium">
              {t("beliefs.form.classification", "分类与解读")}
            </div>
            <div className="grid gap-3 min-[720px]:grid-cols-2">
              <EnumSelect
                label={t("beliefs.classification.domain.title", "领域")}
                value={domain}
                options={BELIEF_DOMAINS}
                enumGroup="domain"
                onChange={handleDomainChange}
              />
              <EnumSelect
                label={t("beliefs.classification.layer.title", "层次")}
                value={layer}
                options={BELIEF_LAYERS}
                enumGroup="layer"
                onChange={setLayer}
              />
              <EnumSelect
                label={t("beliefs.classification.stability.title", "稳定性")}
                value={stability}
                options={BELIEF_STABILITIES}
                enumGroup="stability"
                onChange={setStability}
              />
              <EnumSelect
                label={t("beliefs.classification.source.title", "来源")}
                value={source}
                options={BELIEF_SOURCES}
                enumGroup="source"
                onChange={setSource}
              />
              <EnumSelect
                label={t("beliefs.field.impact", "影响方向")}
                value={impact}
                options={BELIEF_IMPACTS}
                enumGroup="impact"
                onChange={setImpact}
              />
              <OptionalEnumSelect
                label={t("beliefs.field.cbtLayer", "CBT 层次")}
                value={cbtLayer}
                options={BELIEF_CBT_LAYERS}
                enumGroup="cbtLayer"
                onChange={setCbtLayer}
              />
              <OptionalEnumSelect
                label={t("beliefs.field.defenseMechanism", "防御机制")}
                value={defenseMechanism}
                options={DEFENSE_MECHANISMS}
                enumGroup="defenseMechanism"
                onChange={setDefenseMechanism}
              />
            </div>

            <CheckboxGroup
              label={t("beliefs.field.secondaryDomains", "次要领域")}
              values={secondaryDomains}
              options={BELIEF_DOMAINS.filter((item) => item !== domain)}
              enumGroup="domain"
              onToggle={(value) => setSecondaryDomains((current) => toggleValue(current, value))}
            />
            <CheckboxGroup
              label={t("beliefs.field.cognitiveDistortions", "认知扭曲")}
              values={cognitiveDistortions}
              options={COGNITIVE_DISTORTIONS}
              enumGroup="cognitiveDistortion"
              onToggle={(value) =>
                setCognitiveDistortions((current) => toggleValue(current, value))
              }
            />
            <FieldTextarea
              label={t("beliefs.field.attachmentNote", "依恋观察")}
              value={attachmentNote}
              onChange={setAttachmentNote}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="border-foreground/10 bg-background/95 supports-[backdrop-filter]:bg-background/90 sticky bottom-0 z-10 gap-2 supports-[backdrop-filter]:backdrop-blur-xs">
          {!editing.isNew ? (
            <Button variant="outline" onClick={handleDelete} className="mr-auto">
              <Trash2 className="size-3.5" />
              {t("beliefs.actions.delete", "删除")}
            </Button>
          ) : null}
          <Button variant="outline" onClick={onClose}>
            {t("beliefs.actions.cancel", "取消")}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {t("beliefs.actions.save", "保存")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function FieldTextInput({
  label,
  value,
  onChange,
  placeholder,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required ? " *" : ""}
      </Label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="border-foreground/15 bg-background w-full shadow-sm"
      />
    </div>
  )
}

function FieldTextarea({
  label,
  value,
  onChange,
  rows,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  rows: number
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required ? " *" : ""}
      </Label>
      <Textarea
        value={value}
        rows={rows}
        onChange={(event) => onChange(event.target.value)}
        className="border-foreground/15 bg-background w-full resize-none shadow-sm"
      />
    </div>
  )
}

function EnumSelect<T extends string>({
  label,
  value,
  options,
  enumGroup,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  enumGroup: string
  onChange: (value: T) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(nextValue) => onChange(nextValue as T)}>
        <SelectTrigger className="border-foreground/15 bg-background w-full shadow-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {labelFor(t, enumGroup, option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function OptionalEnumSelect<T extends string>({
  label,
  value,
  options,
  enumGroup,
  onChange,
}: {
  label: string
  value: T | null
  options: readonly T[]
  enumGroup: string
  onChange: (value: T | null) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select
        value={value ?? NONE_SELECT_VALUE}
        onValueChange={(nextValue) =>
          onChange(nextValue === NONE_SELECT_VALUE ? null : (nextValue as T))
        }
      >
        <SelectTrigger className="border-foreground/15 bg-background w-full shadow-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_SELECT_VALUE}>{t("beliefs.form.optional", "可选")}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {labelFor(t, enumGroup, option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function CheckboxGroup<T extends string>({
  label,
  values,
  options,
  enumGroup,
  onToggle,
}: {
  label: string
  values: T[]
  options: readonly T[]
  enumGroup: string
  onToggle: (value: T) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="border-foreground/10 bg-background/70 grid gap-2 rounded-lg border p-3 min-[720px]:grid-cols-2">
        {options.map((option) => (
          <label key={option} className="text-foreground flex items-center gap-2 text-sm">
            <Checkbox checked={values.includes(option)} onCheckedChange={() => onToggle(option)} />
            <span>{labelFor(t, enumGroup, option)}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
