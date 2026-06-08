import {
  Archive,
  BookHeart,
  Camera,
  CheckCheck,
  Database,
  FileQuestion,
  Filter,
  Lock,
  Pencil,
  Plus,
  Route,
  Shield,
  Sprout,
  Waypoints,
} from "lucide-react"
import type { TFunction } from "i18next"
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
import type {
  EmotionalWeight,
  FormativePower,
  GrowthModuleData,
  GrowthNode,
  MemoryAnchor,
  MemoryEntry,
  MemoryWorkspaceModuleData,
  MemoryType,
  PrivacyLevel,
  ProcessingStatus,
} from "@/features/bettertolive/types"
import {
  JourneyEditDialog,
  type EditingJourneyItem,
} from "@/features/bettertolive/ui/journey/journey-edit-dialog"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  Surface,
} from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"

const ALL_FILTER_VALUE = "__all__"

const MEMORY_TYPES = ["事件", "地点", "物件", "人物", "照片", "领悟"] satisfies MemoryType[]

const EMOTIONAL_WEIGHT_ORDER = ["轻", "中性", "重", "很重"] satisfies EmotionalWeight[]

const PROCESSING_STATUS_ORDER = [
  "已整理",
  "正在理解",
  "暂不触碰",
  "决定不再细究",
  "开放问题",
  "想留给某人",
  "记不清的裂缝",
] satisfies ProcessingStatus[]

const PRIVACY_LEVEL_ORDER = [
  "仅自己",
  "需二次确认",
  "指定的人",
  "未来可公开",
  "离世后可看",
] satisfies PrivacyLevel[]

const FORMATIVE_POWER_ORDER = ["极深", "较深", "中等", "轻微", "无"] satisfies FormativePower[]

type JourneyViewData = {
  growthNodes: GrowthNode[]
  threads: string[]
  memories: MemoryEntry[]
  anchors: MemoryAnchor[]
  eraSuggestions: string[]
  reviewPrompts: string[]
}

type JourneyFilters = {
  type: string
  era: string
  emotionalWeight: string
  processing: string
  privacy: string
}

type DistributionRow = {
  label: string
  count: number
}

type JourneyEnumGroup =
  | "memoryType"
  | "emotionalWeight"
  | "processing"
  | "privacy"
  | "formativePower"
  | "sourceModule"
  | "growthDomain"
  | "growthStability"

type FilterOption = {
  value: string
  label: string
  count?: number
}

function createEmptyFilters(): JourneyFilters {
  return {
    type: ALL_FILTER_VALUE,
    era: ALL_FILTER_VALUE,
    emotionalWeight: ALL_FILTER_VALUE,
    processing: ALL_FILTER_VALUE,
    privacy: ALL_FILTER_VALUE,
  }
}

function createMemoryLookup(memories: MemoryEntry[]) {
  return new Map(memories.map((memory) => [memory.id, memory]))
}

function createDistribution<T extends string>(
  order: readonly T[],
  memories: MemoryEntry[],
  getValue: (memory: MemoryEntry) => T | T[],
) {
  const counts = new Map<T, number>()

  memories.forEach((memory) => {
    const values = getValue(memory)
    const valueList = Array.isArray(values) ? values : [values]
    valueList.forEach((value) => {
      counts.set(value, (counts.get(value) ?? 0) + 1)
    })
  })

  return order.map((label) => ({
    label,
    count: counts.get(label) ?? 0,
  }))
}

function createEraDistribution(memories: MemoryEntry[]) {
  const counts = new Map<string, number>()

  memories.forEach((memory) => {
    memory.era.forEach((era) => {
      counts.set(era, (counts.get(era) ?? 0) + 1)
    })
  })

  return [...counts.entries()]
    .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0], "zh-CN"))
    .map(([label, count]) => ({ label, count }))
}

function createFilterOptions(
  rows: DistributionRow[],
  allLabel: string,
  options: {
    includeZero?: boolean
    suggestions?: string[]
  } = {},
): FilterOption[] {
  const rowByLabel = new Map(rows.map((row) => [row.label, row.count]))
  const labels = new Set<string>()

  rows.forEach((row) => {
    if (options.includeZero || row.count > 0) {
      labels.add(row.label)
    }
  })

  options.suggestions?.forEach((suggestion) => labels.add(suggestion))

  return [
    { value: ALL_FILTER_VALUE, label: allLabel },
    ...[...labels].map((label) => ({
      value: label,
      label,
      count: rowByLabel.get(label) ?? 0,
    })),
  ]
}

function hasActiveFilters(filters: JourneyFilters) {
  return Object.values(filters).some((value) => value !== ALL_FILTER_VALUE)
}

function applyJourneyFilters(journey: JourneyViewData, filters: JourneyFilters) {
  const activeFilters = hasActiveFilters(filters)
  const memories = journey.memories.filter((memory) => {
    const typeMatches = filters.type === ALL_FILTER_VALUE || memory.type === filters.type
    const eraMatches = filters.era === ALL_FILTER_VALUE || memory.era.includes(filters.era)
    const emotionalWeightMatches =
      filters.emotionalWeight === ALL_FILTER_VALUE ||
      memory.emotionalWeight === filters.emotionalWeight
    const processingMatches =
      filters.processing === ALL_FILTER_VALUE || memory.processing === filters.processing
    const privacyMatches =
      filters.privacy === ALL_FILTER_VALUE || memory.privacy === filters.privacy

    return (
      typeMatches && eraMatches && emotionalWeightMatches && processingMatches && privacyMatches
    )
  })
  const visibleMemoryIds = new Set(memories.map((memory) => memory.id))
  const growthNodes = activeFilters
    ? journey.growthNodes.filter((node) =>
        [...node.beforeMemoryIds, ...node.afterMemoryIds, node.triggerMemoryId].some((memoryId) =>
          visibleMemoryIds.has(memoryId),
        ),
      )
    : journey.growthNodes
  const anchors = activeFilters
    ? journey.anchors.filter((anchor) =>
        anchor.linkedMemoryIds.some((memoryId) => visibleMemoryIds.has(memoryId)),
      )
    : journey.anchors

  return {
    ...journey,
    memories,
    growthNodes,
    anchors,
  }
}

function getLinkedMemories(memoryIds: string[], memoryById: Map<string, MemoryEntry>) {
  return memoryIds
    .map((memoryId) => memoryById.get(memoryId))
    .filter((memory): memory is MemoryEntry => memory !== undefined)
}

function translateJourneyEnum(t: TFunction, group: JourneyEnumGroup, value: string | undefined) {
  if (!value) return ""

  return t(`journey.enum.${group}.${value}`, value)
}

function getFilterEnumGroup(filterId: keyof JourneyFilters): JourneyEnumGroup | null {
  switch (filterId) {
    case "type":
      return "memoryType"
    case "emotionalWeight":
      return "emotionalWeight"
    case "processing":
      return "processing"
    case "privacy":
      return "privacy"
    case "era":
      return null
  }
}

export function JourneyPage({
  journey,
  editableGrowth,
  editableMemory,
  searchQuery,
  isControlMode = false,
  isStackedLayout = false,
}: {
  journey: JourneyViewData
  editableGrowth: GrowthModuleData
  editableMemory: MemoryWorkspaceModuleData
  searchQuery: string
  isControlMode?: boolean
  isStackedLayout?: boolean
}) {
  const { t } = useTranslation()
  const [filters, setFilters] = useState<JourneyFilters>(() => createEmptyFilters())
  const [editingJourneyItem, setEditingJourneyItem] = useState<EditingJourneyItem | null>(null)
  const isFixedLayout = !isStackedLayout
  const editableJourney = useMemo(
    () => ({
      ...editableGrowth,
      ...editableMemory,
    }),
    [editableGrowth, editableMemory],
  )
  const editableMemoryById = useMemo(
    () => createMemoryLookup(editableMemory.memories),
    [editableMemory.memories],
  )
  const unfilteredTypeRows = useMemo(
    () => createDistribution(MEMORY_TYPES, journey.memories, (memory) => memory.type),
    [journey.memories],
  )
  const unfilteredEraRows = useMemo(
    () => createEraDistribution(journey.memories),
    [journey.memories],
  )
  const unfilteredEmotionalWeightRows = useMemo(
    () =>
      createDistribution(
        EMOTIONAL_WEIGHT_ORDER,
        journey.memories,
        (memory) => memory.emotionalWeight,
      ),
    [journey.memories],
  )
  const unfilteredProcessingRows = useMemo(
    () =>
      createDistribution(PROCESSING_STATUS_ORDER, journey.memories, (memory) => memory.processing),
    [journey.memories],
  )
  const unfilteredPrivacyRows = useMemo(
    () => createDistribution(PRIVACY_LEVEL_ORDER, journey.memories, (memory) => memory.privacy),
    [journey.memories],
  )
  const filteredJourney = useMemo(() => applyJourneyFilters(journey, filters), [filters, journey])
  const memoryById = useMemo(
    () => createMemoryLookup(filteredJourney.memories),
    [filteredJourney.memories],
  )
  const classificationSections = useMemo(
    () => [
      {
        enumGroup: "memoryType" as const,
        title: t("journey.classification.type.title"),
        description: t("journey.classification.type.description"),
        rows: createDistribution(MEMORY_TYPES, filteredJourney.memories, (memory) => memory.type),
      },
      {
        enumGroup: null,
        title: t("journey.classification.era.title"),
        description: t("journey.classification.era.description"),
        rows: createEraDistribution(filteredJourney.memories),
      },
      {
        enumGroup: "emotionalWeight" as const,
        title: t("journey.classification.emotionalWeight.title"),
        description: t("journey.classification.emotionalWeight.description"),
        rows: createDistribution(
          EMOTIONAL_WEIGHT_ORDER,
          filteredJourney.memories,
          (memory) => memory.emotionalWeight,
        ),
      },
      {
        enumGroup: "processing" as const,
        title: t("journey.classification.processing.title"),
        description: t("journey.classification.processing.description"),
        rows: createDistribution(
          PROCESSING_STATUS_ORDER,
          filteredJourney.memories,
          (memory) => memory.processing,
        ),
      },
      {
        enumGroup: "privacy" as const,
        title: t("journey.classification.privacy.title"),
        description: t("journey.classification.privacy.description"),
        rows: createDistribution(
          PRIVACY_LEVEL_ORDER,
          filteredJourney.memories,
          (memory) => memory.privacy,
        ),
      },
    ],
    [filteredJourney.memories, t],
  )
  const formativePowerRows = FORMATIVE_POWER_ORDER.map((label) => ({
    label,
    count: filteredJourney.memories.filter((memory) => memory.formativePower === label).length,
  })).filter((row) => row.count > 0)
  const filterGroups = [
    {
      id: "type",
      label: t("journey.filters.type"),
      options: createFilterOptions(unfilteredTypeRows, t("journey.filters.allTypes"), {
        includeZero: true,
      }),
    },
    {
      id: "era",
      label: t("journey.filters.era"),
      options: createFilterOptions(unfilteredEraRows, t("journey.filters.allEras"), {
        suggestions: journey.eraSuggestions,
      }),
    },
    {
      id: "emotionalWeight",
      label: t("journey.filters.emotionalWeight"),
      options: createFilterOptions(
        unfilteredEmotionalWeightRows,
        t("journey.filters.allEmotionalWeights"),
        { includeZero: true },
      ),
    },
    {
      id: "processing",
      label: t("journey.filters.processing"),
      options: createFilterOptions(unfilteredProcessingRows, t("journey.filters.allProcessing"), {
        includeZero: true,
      }),
    },
    {
      id: "privacy",
      label: t("journey.filters.privacy"),
      options: createFilterOptions(unfilteredPrivacyRows, t("journey.filters.allPrivacy"), {
        includeZero: true,
      }),
    },
  ] satisfies Array<{
    id: keyof JourneyFilters
    label: string
    options: FilterOption[]
  }>

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <PageIntro
        eyebrow={t("journey.page.eyebrow")}
        title={t("journey.page.title")}
        description={t("journey.page.description")}
        searchQuery={searchQuery}
      />

      <JourneyHero journey={journey} />

      <JourneyFilterBar
        filterGroups={filterGroups}
        filters={filters}
        isCompact={isFixedLayout}
        resultCount={filteredJourney.memories.length}
        totalCount={journey.memories.length}
        onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
        onReset={() => setFilters(createEmptyFilters())}
      />

      {isControlMode ? (
        <JourneyControlPanel
          journey={editableJourney}
          memoryById={editableMemoryById}
          isCompact={isFixedLayout}
          onEdit={setEditingJourneyItem}
        />
      ) : null}

      {isFixedLayout ? (
        <JourneyFixedDashboard
          classificationSections={classificationSections}
          formativePowerRows={formativePowerRows}
          journey={filteredJourney}
          memoryById={memoryById}
          hasActiveFilters={hasActiveFilters(filters)}
        />
      ) : (
        <JourneyStackedView
          classificationSections={classificationSections}
          formativePowerRows={formativePowerRows}
          journey={filteredJourney}
          memoryById={memoryById}
        />
      )}

      {editingJourneyItem ? (
        <JourneyEditDialog
          editing={editingJourneyItem}
          growth={editableGrowth}
          memory={editableMemory}
          onClose={() => setEditingJourneyItem(null)}
        />
      ) : null}
    </div>
  )
}

function JourneyHero({ journey }: { journey: JourneyViewData }) {
  const { t } = useTranslation()
  const heroStats = [
    { label: t("journey.hero.memories"), value: journey.memories.length },
    { label: t("journey.hero.growthNodes"), value: journey.growthNodes.length },
    { label: t("journey.hero.anchors"), value: journey.anchors.length },
  ]

  return (
    <Surface className="shrink-0 border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] p-5">
      <div className="grid gap-2 min-[560px]:grid-cols-3">
        {heroStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-3 py-3"
          >
            <div className="text-[11px] text-[color:var(--text-muted)]">{stat.label}</div>
            <div className="mt-1 text-lg font-semibold text-[color:var(--text-primary)]">
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    </Surface>
  )
}

function JourneyFilterBar({
  filterGroups,
  filters,
  isCompact,
  resultCount,
  totalCount,
  onChange,
  onReset,
}: {
  filterGroups: Array<{
    id: keyof JourneyFilters
    label: string
    options: FilterOption[]
  }>
  filters: JourneyFilters
  isCompact: boolean
  resultCount: number
  totalCount: number
  onChange: (key: keyof JourneyFilters, value: string) => void
  onReset: () => void
}) {
  const { t } = useTranslation()
  const hasFilters = hasActiveFilters(filters)

  return (
    <Surface className={cn("shrink-0 p-3", isCompact && "p-2.5")}>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 px-1 text-xs font-medium text-[color:var(--text-primary)]">
          <Filter className="size-3.5" />
          {t("journey.filters.title")}
        </div>
        {filterGroups.map((group) => (
          <label key={group.id} className="min-w-[150px] flex-1">
            <span className="sr-only">{group.label}</span>
            <Select
              value={filters[group.id]}
              onValueChange={(value) => {
                if (value !== null) {
                  onChange(group.id, value)
                }
              }}
            >
              <SelectTrigger className="h-8 w-full border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]">
                <SelectValue placeholder={group.label} />
              </SelectTrigger>
              <SelectContent>
                {group.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <JourneyFilterOptionLabel
                      count={option.count}
                      filterId={group.id}
                      label={option.label}
                    />
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        ))}
        <Badge
          variant="outline"
          className="h-8 shrink-0 border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {t("journey.filters.resultCount", { count: resultCount, total: totalCount })}
        </Badge>
        {hasFilters ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
            onClick={onReset}
          >
            {t("journey.filters.reset")}
          </Button>
        ) : null}
      </div>
    </Surface>
  )
}

function JourneyFilterOptionLabel({
  count,
  filterId,
  label,
}: {
  count?: number
  filterId: keyof JourneyFilters
  label: string
}) {
  const { t } = useTranslation()
  const enumGroup = getFilterEnumGroup(filterId)
  const displayLabel = enumGroup ? translateJourneyEnum(t, enumGroup, label) : label

  if (typeof count !== "number") {
    return <span>{displayLabel}</span>
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <span className="truncate">{displayLabel}</span>
      <span className="shrink-0 text-[color:var(--text-muted)]">{count}</span>
    </span>
  )
}

function JourneyStackedView({
  classificationSections,
  formativePowerRows,
  journey,
  memoryById,
}: {
  classificationSections: Array<{
    enumGroup: JourneyEnumGroup | null
    title: string
    description: string
    rows: DistributionRow[]
  }>
  formativePowerRows: DistributionRow[]
  journey: JourneyViewData
  memoryById: Map<string, MemoryEntry>
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <Surface className="p-5">
        <SectionHeading
          icon={Waypoints}
          title={t("journey.sections.classification.title")}
          description={t("journey.sections.classification.description")}
        />

        <div className="mt-5 grid gap-3 min-[960px]:grid-cols-2 min-[1240px]:grid-cols-5">
          {classificationSections.map((section) => (
            <ClassificationPanel
              key={section.title}
              title={section.title}
              description={section.description}
              enumGroup={section.enumGroup}
              rows={section.rows}
              total={journey.memories.length}
            />
          ))}
        </div>

        {journey.eraSuggestions.length > 0 || formativePowerRows.length > 0 ? (
          <div className="mt-4 grid gap-3 min-[960px]:grid-cols-2">
            {journey.eraSuggestions.length > 0 ? (
              <BadgeBlock
                title={t("journey.sections.eraSuggestions.title")}
                rows={journey.eraSuggestions.map((era) => ({ label: era, count: 0 }))}
                showCount={false}
              />
            ) : null}

            {formativePowerRows.length > 0 ? (
              <BadgeBlock
                title={t("journey.sections.formativePower.title")}
                description={t("journey.sections.formativePower.description")}
                enumGroup="formativePower"
                rows={formativePowerRows}
              />
            ) : null}
          </div>
        ) : null}
      </Surface>

      <div className="grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
        <Surface className="p-5">
          <SectionHeading
            icon={Route}
            title={t("journey.sections.timeline.title")}
            description={t("journey.sections.timeline.description")}
          />

          <div className="mt-5 space-y-3">
            {journey.memories.length > 0 ? (
              journey.memories.map((memory) => <MemoryCard key={memory.id} memory={memory} />)
            ) : (
              <EmptyState message={t("journey.empty.memories")} compact />
            )}
          </div>
        </Surface>

        <Surface className="p-5">
          <SectionHeading
            icon={Sprout}
            title={t("journey.sections.growth.title")}
            description={t("journey.sections.growth.description")}
          />

          <div className="mt-5 space-y-4">
            {journey.growthNodes.length > 0 ? (
              journey.growthNodes.map((node) => (
                <GrowthNodeCard key={node.id} memoryById={memoryById} node={node} />
              ))
            ) : (
              <EmptyState message={t("journey.empty.growthNodes")} compact />
            )}
          </div>
        </Surface>
      </div>

      <div className="grid gap-4 min-[960px]:grid-cols-2">
        <Surface className="p-5">
          <SectionHeading
            icon={Camera}
            title={t("journey.sections.anchors.title")}
            description={t("journey.sections.anchors.description")}
          />

          <div className="mt-5 space-y-3">
            {journey.anchors.length > 0 ? (
              journey.anchors.map((anchor) => (
                <AnchorRow key={anchor.id} anchor={anchor} memoryById={memoryById} />
              ))
            ) : (
              <EmptyState message={t("journey.empty.anchors")} compact />
            )}
          </div>
        </Surface>

        <Surface className="p-5">
          <SectionHeading
            icon={BookHeart}
            title={t("journey.sections.reviewPrompts.title")}
            description={t("journey.sections.reviewPrompts.description")}
          />

          <div className="mt-5 space-y-3">
            {journey.reviewPrompts.length > 0 ? (
              journey.reviewPrompts.map((prompt) => <TextBlock key={prompt} detail={prompt} />)
            ) : (
              <EmptyState message={t("journey.empty.reviewPrompts")} compact />
            )}
          </div>
        </Surface>
      </div>

      <Surface className="p-5">
        <SectionHeading
          icon={CheckCheck}
          title={t("journey.sections.threads.title")}
          description={t("journey.sections.threads.description")}
        />

        <div className="mt-5 grid gap-3 min-[960px]:grid-cols-2">
          {journey.threads.length > 0 ? (
            journey.threads.map((thread) => <TextBlock key={thread} detail={thread} />)
          ) : (
            <EmptyState message={t("journey.empty.threads")} compact />
          )}
        </div>
      </Surface>
    </div>
  )
}

function JourneyFixedDashboard({
  classificationSections,
  formativePowerRows,
  journey,
  memoryById,
  hasActiveFilters,
}: {
  classificationSections: Array<{
    enumGroup: JourneyEnumGroup | null
    title: string
    description: string
    rows: DistributionRow[]
  }>
  formativePowerRows: DistributionRow[]
  journey: JourneyViewData
  memoryById: Map<string, MemoryEntry>
  hasActiveFilters: boolean
}) {
  const { t } = useTranslation()
  const featuredMemories = journey.memories.slice(0, 3)
  const featuredGrowthNodes = journey.growthNodes.slice(0, 2)
  const featuredAnchors = journey.anchors.slice(0, 2)
  const featuredThreads = journey.threads.slice(0, 2)
  const featuredPrompts = journey.reviewPrompts.slice(0, 2)
  const remainingMemoryCount = Math.max(journey.memories.length - featuredMemories.length, 0)
  const remainingGrowthCount = Math.max(journey.growthNodes.length - featuredGrowthNodes.length, 0)

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,0.95fr)_minmax(0,1.06fr)_minmax(320px,0.9fr)] grid-rows-[minmax(0,0.9fr)_minmax(0,1fr)] gap-3 overflow-hidden">
      <Surface className="col-span-2 flex min-h-0 flex-col overflow-hidden p-4">
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          <div className="grid gap-2 min-[1240px]:grid-cols-5">
            {classificationSections.map((section) => (
              <CompactDistributionPanel
                key={section.title}
                enumGroup={section.enumGroup}
                title={section.title}
                rows={section.rows}
              />
            ))}
          </div>

          <div className="grid gap-2 min-[1240px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <CompactBadgeBlock
              enumGroup="formativePower"
              title={t("journey.sections.formativePower.title")}
              rows={formativePowerRows}
            />
            <BadgeBlock
              compact
              title={t("journey.sections.eraSuggestions.title")}
              rows={journey.eraSuggestions.slice(0, 5).map((era) => ({ label: era, count: 0 }))}
              showCount={false}
            />
          </div>
        </div>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {featuredMemories.length > 0 ? (
            featuredMemories.map((memory) => <CompactMemoryCard key={memory.id} memory={memory} />)
          ) : (
            <EmptyState
              message={hasActiveFilters ? t("journey.empty.memories") : t("journey.empty.noData")}
              compact
            />
          )}
          <div className="space-y-2 border-t border-[color:var(--muted-surface-border)] pt-3">
            {featuredGrowthNodes.map((node) => (
              <CompactGrowthNodeCard key={node.id} memoryById={memoryById} node={node} />
            ))}
          </div>
        </div>
      </Surface>

      <Surface className="col-span-2 flex min-h-0 flex-col overflow-hidden p-4">
        <Tabs defaultValue="timeline" className="min-h-0 flex-1">
          <TabsList className="w-full justify-start gap-1 rounded-lg bg-[color:var(--chip-bg)] p-1">
            <TabsTrigger value="timeline">{t("journey.tabs.timeline")}</TabsTrigger>
            <TabsTrigger value="growth">{t("journey.tabs.growth")}</TabsTrigger>
            <TabsTrigger value="signals">{t("journey.tabs.signals")}</TabsTrigger>
            <TabsTrigger value="library">{t("journey.tabs.library")}</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {journey.memories.length > 0 ? (
                journey.memories.map((memory) => (
                  <CompactMemoryCard key={memory.id} memory={memory} />
                ))
              ) : (
                <EmptyState message={t("journey.empty.memories")} compact />
              )}
            </div>
          </TabsContent>

          <TabsContent value="growth" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {journey.growthNodes.length > 0 ? (
                journey.growthNodes.map((node) => (
                  <CompactGrowthNodeCard key={node.id} memoryById={memoryById} node={node} />
                ))
              ) : (
                <EmptyState message={t("journey.empty.growthNodes")} compact />
              )}
            </div>
          </TabsContent>

          <TabsContent value="signals" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {journey.anchors.map((anchor) => {
                const linkedMemories = getLinkedMemories(anchor.linkedMemoryIds, memoryById)

                return (
                  <CompactTextBlock
                    key={anchor.id}
                    title={t("journey.compact.anchorTitle", {
                      type: translateJourneyEnum(t, "memoryType", anchor.type),
                      label: anchor.label,
                    })}
                    detail={t("journey.compact.relatedMemoryCount", {
                      note: anchor.note,
                      count: linkedMemories.length,
                    })}
                  />
                )
              })}
              {journey.reviewPrompts.map((prompt) => (
                <CompactTextBlock
                  key={prompt}
                  title={t("journey.sections.reviewPrompts.title")}
                  detail={prompt}
                />
              ))}
              {journey.threads.map((thread) => (
                <CompactTextBlock
                  key={thread}
                  title={t("journey.sections.threads.compactTitle")}
                  detail={thread}
                />
              ))}
              {journey.anchors.length === 0 &&
              journey.reviewPrompts.length === 0 &&
              journey.threads.length === 0 ? (
                <EmptyState message={t("journey.empty.signals")} compact />
              ) : null}
            </div>
          </TabsContent>

          <TabsContent value="library" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="grid gap-2 min-[960px]:grid-cols-2">
              {journey.memories.length > 0 ? (
                journey.memories.map((memory) => (
                  <CompactTextBlock
                    key={memory.id}
                    title={memory.title}
                    detail={t("journey.library.memoryDetail", {
                      era: memory.primaryEra,
                      type: translateJourneyEnum(t, "memoryType", memory.type),
                      privacy: translateJourneyEnum(t, "privacy", memory.privacy),
                    })}
                  />
                ))
              ) : (
                <EmptyState message={t("journey.empty.memories")} compact />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {featuredAnchors.map((anchor) => {
            const linkedMemories = getLinkedMemories(anchor.linkedMemoryIds, memoryById)

            return (
              <CompactTextBlock
                key={anchor.id}
                title={t("journey.compact.anchorTitle", {
                  type: translateJourneyEnum(t, "memoryType", anchor.type),
                  label: anchor.label,
                })}
                detail={t("journey.compact.relatedMemoryCount", {
                  note: anchor.note,
                  count: linkedMemories.length,
                })}
              />
            )
          })}
          <div className="space-y-2 border-t border-[color:var(--muted-surface-border)] pt-3">
            {featuredPrompts.map((prompt) => (
              <CompactTextBlock
                key={prompt}
                title={t("journey.sections.reviewPrompts.title")}
                detail={prompt}
              />
            ))}
            {featuredThreads.map((thread) => (
              <CompactTextBlock
                key={thread}
                title={t("journey.sections.threads.compactTitle")}
                detail={thread}
              />
            ))}
          </div>
          {remainingMemoryCount > 0 ? (
            <RemainingLine
              label={t("journey.remaining.memories", { count: remainingMemoryCount })}
            />
          ) : null}
          {remainingGrowthCount > 0 ? (
            <RemainingLine label={t("journey.remaining.growth", { count: remainingGrowthCount })} />
          ) : null}
        </div>
      </Surface>
    </div>
  )
}

function JourneyControlPanel({
  journey,
  memoryById,
  isCompact,
  onEdit,
}: {
  journey: JourneyViewData
  memoryById: Map<string, MemoryEntry>
  isCompact: boolean
  onEdit: (editing: EditingJourneyItem) => void
}) {
  const { t } = useTranslation()
  const memoriesWithoutFormativePower = journey.memories.filter((memory) => !memory.formativePower)
  const secondConfirmMemories = journey.memories.filter((memory) => memory.privacy === "需二次确认")
  const unresolvedMemoryIds = new Set<string>()

  journey.growthNodes.forEach((node) => {
    ;[...node.beforeMemoryIds, ...node.afterMemoryIds, node.triggerMemoryId].forEach((memoryId) => {
      if (!memoryById.has(memoryId)) {
        unresolvedMemoryIds.add(memoryId)
      }
    })
  })

  const metrics = [
    {
      icon: Database,
      label: t("journey.control.metrics.memories"),
      value: journey.memories.length,
    },
    {
      icon: Sprout,
      label: t("journey.control.metrics.growthNodes"),
      value: journey.growthNodes.length,
    },
    {
      icon: Lock,
      label: t("journey.control.metrics.secondConfirm"),
      value: secondConfirmMemories.length,
    },
    {
      icon: Archive,
      label: t("journey.control.metrics.missingLinks"),
      value: unresolvedMemoryIds.size,
    },
  ]

  return (
    <Surface className={cn("shrink-0 p-3", isCompact && "p-2.5")}>
      <div className="grid gap-3 min-[960px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--text-primary)]">
            <Database className="size-4" />
            {t("journey.control.title")}
          </div>
          <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
            {t("journey.control.description")}
          </p>
        </div>
        <div className="grid gap-2 min-[640px]:grid-cols-4">
          {metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-2"
            >
              <div className="flex items-center gap-1.5 text-[11px] text-[color:var(--text-muted)]">
                <metric.icon className="size-3.5" />
                {metric.label}
              </div>
              <div className="mt-1 text-base font-semibold text-[color:var(--text-primary)]">
                {metric.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onEdit({ kind: "memory", isNew: true, memory: null })}
        >
          <Plus className="size-3.5" />
          {t("journey.actions.addMemory")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onEdit({ kind: "growth", isNew: true, node: null })}
        >
          <Plus className="size-3.5" />
          {t("journey.actions.addGrowth")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onEdit({ kind: "anchor", isNew: true, anchor: null })}
        >
          <Plus className="size-3.5" />
          {t("journey.actions.addAnchor")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onEdit({ kind: "reviewPrompt", isNew: true, index: null, value: "" })}
        >
          <Plus className="size-3.5" />
          {t("journey.actions.addPrompt")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onEdit({ kind: "thread", isNew: true, index: null, value: "" })}
        >
          <Plus className="size-3.5" />
          {t("journey.actions.addThread")}
        </Button>
      </div>

      <div className="mt-3 grid gap-2 min-[960px]:grid-cols-2 min-[1280px]:grid-cols-3">
        <JourneyManagementList
          title={t("journey.management.memories")}
          emptyLabel={t("journey.empty.memories")}
          rows={journey.memories.map((memory) => ({
            id: memory.id,
            title: memory.title,
            detail: `${translateJourneyEnum(t, "memoryType", memory.type)} · ${memory.primaryEra}`,
            onEdit: () => onEdit({ kind: "memory", isNew: false, memory }),
          }))}
        />
        <JourneyManagementList
          title={t("journey.management.growthNodes")}
          emptyLabel={t("journey.empty.growthNodes")}
          rows={journey.growthNodes.map((node) => ({
            id: node.id,
            title: node.title,
            detail: `${translateJourneyEnum(t, "growthDomain", node.domain)} · ${translateJourneyEnum(
              t,
              "growthStability",
              node.stability,
            )}`,
            onEdit: () => onEdit({ kind: "growth", isNew: false, node }),
          }))}
        />
        <JourneyManagementList
          title={t("journey.management.anchors")}
          emptyLabel={t("journey.empty.anchors")}
          rows={journey.anchors.map((anchor) => ({
            id: anchor.id,
            title: anchor.label,
            detail: `${translateJourneyEnum(t, "memoryType", anchor.type)} · ${anchor.linkedMemoryIds.length}`,
            onEdit: () => onEdit({ kind: "anchor", isNew: false, anchor }),
          }))}
        />
        <JourneyManagementList
          title={t("journey.management.prompts")}
          emptyLabel={t("journey.empty.reviewPrompts")}
          rows={journey.reviewPrompts.map((prompt, index) => ({
            id: `prompt-${index}`,
            title: prompt,
            onEdit: () => onEdit({ kind: "reviewPrompt", isNew: false, index, value: prompt }),
          }))}
        />
        <JourneyManagementList
          title={t("journey.management.threads")}
          emptyLabel={t("journey.empty.threads")}
          rows={journey.threads.map((thread, index) => ({
            id: `thread-${index}`,
            title: thread,
            onEdit: () => onEdit({ kind: "thread", isNew: false, index, value: thread }),
          }))}
        />
      </div>

      {memoriesWithoutFormativePower.length > 0 || unresolvedMemoryIds.size > 0 ? (
        <div className="mt-3 grid gap-2 min-[960px]:grid-cols-2">
          {memoriesWithoutFormativePower.length > 0 ? (
            <TextBlock
              title={t("journey.control.missingPowerTitle")}
              detail={memoriesWithoutFormativePower.map((memory) => memory.title).join(" / ")}
            />
          ) : null}
          {unresolvedMemoryIds.size > 0 ? (
            <TextBlock
              title={t("journey.control.missingLinksTitle")}
              detail={[...unresolvedMemoryIds].join(" / ")}
            />
          ) : null}
        </div>
      ) : null}
    </Surface>
  )
}

function JourneyManagementList({
  title,
  emptyLabel,
  rows,
}: {
  title: string
  emptyLabel: string
  rows: Array<{
    id: string
    title: string
    detail?: string
    onEdit: () => void
  }>
}) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3">
      <div className="flex items-center gap-2 text-xs font-medium text-[color:var(--text-primary)]">
        <FileQuestion className="size-3.5" />
        {title}
      </div>
      <div className="mt-2 max-h-44 space-y-1.5 overflow-y-auto pr-1">
        {rows.length > 0 ? (
          rows.map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-2.5 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-xs font-medium text-[color:var(--text-primary)]">
                  {row.title}
                </div>
                {row.detail ? (
                  <div className="mt-0.5 truncate text-[11px] text-[color:var(--text-muted)]">
                    {row.detail}
                  </div>
                ) : null}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={t("journey.actions.edit")}
                onClick={row.onEdit}
              >
                <Pencil className="size-3.5" />
              </Button>
            </div>
          ))
        ) : (
          <div className="rounded-lg border border-dashed border-[color:var(--chip-border)] px-2.5 py-2 text-xs text-[color:var(--text-muted)]">
            {emptyLabel}
          </div>
        )}
      </div>
    </div>
  )
}

function CompactDistributionPanel({
  enumGroup,
  title,
  rows,
}: {
  enumGroup?: JourneyEnumGroup | null
  title: string
  rows: DistributionRow[]
}) {
  const { t } = useTranslation()
  const visibleRows = rows.filter((row) => row.count > 0).slice(0, 3)

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3">
      <div className="text-xs font-medium text-[color:var(--text-primary)]">{title}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {visibleRows.length > 0 ? (
          visibleRows.map((row) => (
            <Badge
              key={row.label}
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
            >
              {enumGroup ? translateJourneyEnum(t, enumGroup, row.label) : row.label} · {row.count}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-[color:var(--text-muted)]">{t("journey.empty.none")}</span>
        )}
      </div>
    </div>
  )
}

function CompactBadgeBlock({
  enumGroup,
  title,
  rows,
}: {
  enumGroup?: JourneyEnumGroup | null
  title: string
  rows: DistributionRow[]
}) {
  return <BadgeBlock compact enumGroup={enumGroup} title={title} rows={rows} />
}

function BadgeBlock({
  enumGroup,
  title,
  description,
  rows,
  showCount = true,
  compact = false,
}: {
  enumGroup?: JourneyEnumGroup | null
  title: string
  description?: string
  rows: DistributionRow[]
  showCount?: boolean
  compact?: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-3 py-3">
      <div className="text-xs font-medium text-[color:var(--text-primary)]">{title}</div>
      {description ? (
        <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">{description}</p>
      ) : null}
      <div className={cn("mt-2 flex flex-wrap gap-1.5", !compact && "mt-3")}>
        {rows.length > 0 ? (
          rows.map((row) => (
            <Badge
              key={row.label}
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
            >
              {showCount
                ? t("journey.filters.optionWithCount", {
                    label: enumGroup ? translateJourneyEnum(t, enumGroup, row.label) : row.label,
                    count: row.count,
                  })
                : enumGroup
                  ? translateJourneyEnum(t, enumGroup, row.label)
                  : row.label}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-[color:var(--text-muted)]">{t("journey.empty.none")}</span>
        )}
      </div>
    </div>
  )
}

function CompactMemoryCard({ memory }: { memory: MemoryEntry }) {
  const { t } = useTranslation()

  return (
    <article className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
        >
          {translateJourneyEnum(t, "memoryType", memory.type)}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {memory.primaryEra}
        </Badge>
        <Badge className="bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]">
          {t("journey.memory.formativePowerBadge", {
            value: memory.formativePower
              ? translateJourneyEnum(t, "formativePower", memory.formativePower)
              : t("journey.memory.unrated"),
          })}
        </Badge>
      </div>
      <div className="mt-2 truncate text-sm font-medium text-[color:var(--text-primary)]">
        {memory.title}
      </div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">{memory.summary}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {[
          ["emotionalWeight", memory.emotionalWeight],
          ["processing", memory.processing],
          ["privacy", memory.privacy],
        ].map(([group, value]) => (
          <Badge
            key={value}
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
          >
            {translateJourneyEnum(t, group as JourneyEnumGroup, value)}
          </Badge>
        ))}
      </div>
    </article>
  )
}

function CompactGrowthNodeCard({
  node,
  memoryById,
}: {
  node: GrowthNode
  memoryById: Map<string, MemoryEntry>
}) {
  const { t } = useTranslation()
  const triggerMemory = memoryById.get(node.triggerMemoryId)

  return (
    <article className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge className="bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]">
          {translateJourneyEnum(t, "growthDomain", node.domain)}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {translateJourneyEnum(t, "growthStability", node.stability)}
        </Badge>
      </div>
      <div className="mt-2 truncate text-sm font-medium text-[color:var(--text-primary)]">
        {node.title}
      </div>
      <div className="mt-1 grid gap-2 text-xs leading-5 text-[color:var(--text-secondary)]">
        <div>{t("journey.growth.beforeInline", { value: node.before })}</div>
        <div>{t("journey.growth.afterInline", { value: node.after })}</div>
      </div>
      {triggerMemory ? (
        <div className="mt-2 rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-2.5 py-1 text-xs text-[color:var(--text-muted)]">
          {t("journey.growth.triggerInline", { value: triggerMemory.title })}
        </div>
      ) : null}
    </article>
  )
}

function CompactTextBlock({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-2">
      <div className="text-xs font-medium text-[color:var(--text-primary)]">{title}</div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">{detail}</p>
    </div>
  )
}

function RemainingLine({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 py-2 text-xs text-[color:var(--text-muted)]">
      {label}
    </div>
  )
}

function ClassificationPanel({
  enumGroup,
  title,
  description,
  rows,
  total,
}: {
  enumGroup: JourneyEnumGroup | null
  title: string
  description: string
  rows: DistributionRow[]
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
                    {enumGroup ? translateJourneyEnum(t, enumGroup, row.label) : row.label}
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
            {t("journey.empty.distribution")}
          </div>
        )}
      </div>
    </div>
  )
}

function MemoryCard({ memory }: { memory: MemoryEntry }) {
  const { t } = useTranslation()
  const formativePower = memory.formativePower
    ? translateJourneyEnum(t, "formativePower", memory.formativePower)
    : t("journey.memory.unrated")
  const needsSecondLook = memory.privacy === "需二次确认"

  return (
    <article className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
        >
          {translateJourneyEnum(t, "memoryType", memory.type)}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {memory.primaryEra}
        </Badge>
        {needsSecondLook ? (
          <Badge className="bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]">
            {t("journey.memory.needsConfirm")}
          </Badge>
        ) : null}
      </div>

      <h3 className="mt-3 text-base font-medium text-[color:var(--text-primary)]">
        {memory.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{memory.summary}</p>
      <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
        {t("journey.memory.impactPrefix", { value: memory.impact })}
      </p>

      <div className="mt-4 grid gap-2 min-[640px]:grid-cols-2">
        <MemoryMeta
          label={t("journey.memory.emotionalWeight")}
          value={translateJourneyEnum(t, "emotionalWeight", memory.emotionalWeight)}
        />
        <MemoryMeta
          label={t("journey.memory.processing")}
          value={translateJourneyEnum(t, "processing", memory.processing)}
        />
        <MemoryMeta
          label={t("journey.memory.privacy")}
          value={translateJourneyEnum(t, "privacy", memory.privacy)}
        />
        <MemoryMeta label={t("journey.memory.formativePower")} value={formativePower} accent />
      </div>

      {memory.sensoryCue ? (
        <div className="mt-3 rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 py-2 text-xs leading-5 text-[color:var(--text-muted)]">
          {t("journey.memory.sensoryCuePrefix", { value: memory.sensoryCue })}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {memory.era.map((era) => (
          <Badge
            key={era}
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
          >
            {era}
          </Badge>
        ))}
        {memory.sourceModules.map((source) => (
          <Badge
            key={source}
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
          >
            {t("journey.memory.sourcePrefix", {
              value: translateJourneyEnum(t, "sourceModule", source),
            })}
          </Badge>
        ))}
      </div>
    </article>
  )
}

function MemoryMeta({
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

function GrowthNodeCard({
  node,
  memoryById,
}: {
  node: GrowthNode
  memoryById: Map<string, MemoryEntry>
}) {
  const { t } = useTranslation()
  const beforeMemories = getLinkedMemories(node.beforeMemoryIds, memoryById)
  const afterMemories = getLinkedMemories(node.afterMemoryIds, memoryById)
  const triggerMemory = memoryById.get(node.triggerMemoryId)

  return (
    <article className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]">
          {translateJourneyEnum(t, "growthDomain", node.domain)}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {translateJourneyEnum(t, "growthStability", node.stability)}
        </Badge>
      </div>
      <h3 className="mt-3 text-base font-medium text-[color:var(--text-primary)]">{node.title}</h3>

      <div className="mt-4 grid gap-3 min-[640px]:grid-cols-2">
        <GrowthState label={t("journey.growth.before")} value={node.before} />
        <GrowthState label={t("journey.growth.after")} value={node.after} />
      </div>

      <div className="mt-3 rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 py-3 text-sm leading-6 text-[color:var(--text-secondary)]">
        {t("journey.growth.keyEventPrefix", { value: node.keyEvent })}
      </div>

      <div className="mt-3 space-y-2">
        <MemoryLinkGroup title={t("journey.growth.beforeMemories")} memories={beforeMemories} />
        <MemoryLinkGroup title={t("journey.growth.afterMemories")} memories={afterMemories} />
        {triggerMemory ? (
          <MemoryLinkGroup title={t("journey.growth.triggerMemory")} memories={[triggerMemory]} />
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {node.evidence.map((entry) => (
          <Badge
            key={entry}
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
          >
            {entry}
          </Badge>
        ))}
      </div>
    </article>
  )
}

function GrowthState({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-3 py-3">
      <div className="text-xs text-[color:var(--text-muted)]">{label}</div>
      <div className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{value}</div>
    </div>
  )
}

function MemoryLinkGroup({ title, memories }: { title: string; memories: MemoryEntry[] }) {
  if (memories.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      <span className="text-[color:var(--text-muted)]">{title}</span>
      {memories.map((memory) => (
        <span
          key={memory.id}
          className="inline-flex max-w-full items-center rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-2.5 py-1 text-[color:var(--text-secondary)]"
          title={memory.summary}
        >
          {memory.title}
        </span>
      ))}
    </div>
  )
}

function AnchorRow({
  anchor,
  memoryById,
}: {
  anchor: MemoryAnchor
  memoryById: Map<string, MemoryEntry>
}) {
  const { t } = useTranslation()
  const memories = getLinkedMemories(anchor.linkedMemoryIds, memoryById)

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]">
          {anchor.type === "人物" ? <Shield className="size-4" /> : <Camera className="size-4" />}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
            >
              {translateJourneyEnum(t, "memoryType", anchor.type)}
            </Badge>
            <h3 className="text-sm font-medium text-[color:var(--text-primary)]">{anchor.label}</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{anchor.note}</p>
          {memories.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {memories.map((memory) => (
                <Badge
                  key={memory.id}
                  variant="outline"
                  className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
                >
                  {memory.title}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function TextBlock({ title, detail }: { title?: string; detail: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]">
      {title ? <div className="font-medium text-[color:var(--text-primary)]">{title}</div> : null}
      <div className={cn(title && "mt-1")}>{detail}</div>
    </div>
  )
}
