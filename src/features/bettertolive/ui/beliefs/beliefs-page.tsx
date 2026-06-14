import {
  Brain,
  Edit3,
  Lightbulb,
  Link2,
  MessagesSquare,
  Plus,
  Sparkles,
  Waypoints,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { ActionGroup, AnimatedButton, AnimatedIconButton } from "@/components/ui/button"
import { useWorkspaceUiStore } from "@/features/bettertolive/stores/workspace-ui-store"
import { type FilterPopoverDimension } from "@/features/bettertolive/ui/shared/filter-popover"
import { FilterablePanel } from "@/features/bettertolive/ui/shared/filterable-panel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  BeliefEntry,
  BeliefImpact,
  BeliefRelation,
  BeliefsModuleData,
} from "@/features/bettertolive/types"
import { EmptyState, SectionHeading, Surface } from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"
import { BeliefEditDialog } from "@/features/bettertolive/ui/beliefs/belief-edit-dialog"
import {
  BELIEF_DOMAINS,
  BELIEF_LAYERS,
  BELIEF_SOURCES,
  BELIEF_STABILITIES,
  BELIEF_IMPACTS,
  labelFor,
} from "@/features/bettertolive/ui/beliefs/beliefs-constants"

export type EditingBelief = { isNew: boolean; entry: BeliefEntry | null }

type DistributionRow = {
  label: string
  count: number
}

type BeliefFilters = {
  domain: string
  layer: string
  stability: string
  source: string
}

const DEFAULT_FILTERS: BeliefFilters = {
  domain: "all",
  layer: "all",
  stability: "all",
  source: "all",
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

export function BeliefsPage({
  beliefsModule,
  isStackedLayout = false,
  isControlMode = false,
  onRefresh,
}: {
  beliefsModule: BeliefsModuleData
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
          (filters.domain === "all" || entry.domain === filters.domain) &&
          (filters.layer === "all" || entry.layer === filters.layer) &&
          (filters.stability === "all" || entry.stability === filters.stability) &&
          (filters.source === "all" || entry.source === filters.source),
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
      title: t("beliefs.classification.domain.title"),
      description: t("beliefs.classification.domain.description"),
      rows: createDistribution(BELIEF_DOMAINS, entries, (entry) => entry.domain),
      enumGroup: "domain",
    },
    {
      key: "layer",
      title: t("beliefs.classification.layer.title"),
      description: t("beliefs.classification.layer.description"),
      rows: createDistribution(BELIEF_LAYERS, entries, (entry) => entry.layer),
      enumGroup: "layer",
    },
    {
      key: "stability",
      title: t("beliefs.classification.stability.title"),
      description: t("beliefs.classification.stability.description"),
      rows: createDistribution(BELIEF_STABILITIES, entries, (entry) => entry.stability),
      enumGroup: "stability",
    },
    {
      key: "source",
      title: t("beliefs.classification.source.title"),
      description: t("beliefs.classification.source.description"),
      rows: createDistribution(BELIEF_SOURCES, entries, (entry) => entry.source),
      enumGroup: "source",
    },
  ]
  const impactRows = createDistribution(BELIEF_IMPACTS, entries, (entry) => entry.impact)
  const conflictingBeliefs = entries.filter((entry) => entry.impact === "冲突中")
  const limitingBeliefs = entries.filter((entry) => entry.impact === "限制性")
  const changingBeliefs = entries.filter(
    (entry) => entry.stability === "正在松动" || entry.stability === "正在形成",
  )

  const handleSaved = () => {
    setEditingBelief(null)
    onRefresh?.()
    toast.success(t("common.toast.saved"))
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
      {isFixedLayout ? (
        <BeliefsFixedDashboard
          classificationSections={classificationSections}
          impactRows={impactRows}
          conflictingBeliefs={conflictingBeliefs}
          limitingBeliefs={limitingBeliefs}
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
  limitingBeliefs,
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
  limitingBeliefs: BeliefEntry[]
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
              {t("beliefs.attachment.title")}：
            </span>
            {beliefsModule.attachmentReflection}
          </div>
        </div>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <SectionHeading
          icon={MessagesSquare}
          title={t("beliefs.questions.title")}
          description={t("beliefs.questions.description")}
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
            <EmptyState message={t("beliefs.empty.questions")} compact />
          )}
        </div>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4 min-[1180px]:col-span-2">
        <Tabs defaultValue="entries" className="min-h-0 flex-1">
          <TabsList className="hide-scrollbar w-full justify-start gap-1 overflow-x-auto rounded-lg bg-[color:var(--chip-bg)] p-1">
            <TabsTrigger value="entries">{t("beliefs.tabs.entries")}</TabsTrigger>
            <TabsTrigger value="cards">{t("beliefs.tabs.cards")}</TabsTrigger>
            <TabsTrigger value="relations">{t("beliefs.tabs.relations")}</TabsTrigger>
            <TabsTrigger value="blindspots">{t("beliefs.tabs.blindspots")}</TabsTrigger>
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
                <EmptyState message={t("beliefs.empty.entries")} compact />
              )}
            </div>
          </TabsContent>

          <TabsContent value="cards" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <BeliefSkeletonCards beliefsModule={beliefsModule} compact />
          </TabsContent>

          <TabsContent value="relations" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <BeliefRelationsList relations={relations} beliefById={beliefById} compact />
          </TabsContent>

          <TabsContent value="blindspots" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="grid gap-3 min-[960px]:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs font-medium tracking-wide text-[color:var(--text-primary)]">
                  {t("beliefs.questions.title")}
                </div>
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
                  <EmptyState message={t("beliefs.empty.questions")} compact />
                )}
              </div>
              <SignalSection
                title={t("beliefs.signals.limiting")}
                entries={limitingBeliefs}
                emptyMessage={t("beliefs.empty.limiting")}
              />
            </div>
          </TabsContent>
        </Tabs>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <SignalSection
            title={t("beliefs.signals.conflict")}
            entries={conflictingBeliefs}
            emptyMessage={t("beliefs.empty.conflicts")}
          />

          <SignalSection
            title={t("beliefs.signals.changing")}
            entries={changingBeliefs.slice(0, 4)}
            emptyMessage={t("beliefs.empty.changing")}
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
          title={t("beliefs.classification.title")}
          description={t("beliefs.classification.description")}
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
            title={t("beliefs.entries.title")}
            description={t("beliefs.entries.description")}
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
              <EmptyState message={t("beliefs.empty.entries")} compact />
            )}
          </div>
        </Surface>

        <div className="space-y-4">
          <Surface className="p-5">
            <SectionHeading
              icon={MessagesSquare}
              title={t("beliefs.questions.title")}
              description={t("beliefs.questions.description")}
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
                <EmptyState message={t("beliefs.empty.questions")} compact />
              )}
            </div>
          </Surface>

          <Surface className="p-5">
            <SectionHeading
              icon={Link2}
              title={t("beliefs.relations.title")}
              description={t("beliefs.relations.description")}
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
          title={t("beliefs.cards.title")}
          description={t("beliefs.cards.description")}
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
  const searchQuery = useWorkspaceUiStore((state) => state.searchQuery)
  const setSearchQuery = useWorkspaceUiStore((state) => state.setSearchQuery)

  const filterDimensions: FilterPopoverDimension[] = [
    {
      key: "domain",
      label: t("beliefs.classification.domain.title"),
      allLabel: t("beliefs.filter.all"),
      value: filters.domain,
      options: BELIEF_DOMAINS.map((option) => ({
        value: option,
        label: labelFor(t, "domain", option),
      })),
    },
    {
      key: "layer",
      label: t("beliefs.classification.layer.title"),
      allLabel: t("beliefs.filter.all"),
      value: filters.layer,
      options: BELIEF_LAYERS.map((option) => ({
        value: option,
        label: labelFor(t, "layer", option),
      })),
    },
    {
      key: "stability",
      label: t("beliefs.classification.stability.title"),
      allLabel: t("beliefs.filter.all"),
      value: filters.stability,
      options: BELIEF_STABILITIES.map((option) => ({
        value: option,
        label: labelFor(t, "stability", option),
      })),
    },
    {
      key: "source",
      label: t("beliefs.classification.source.title"),
      allLabel: t("beliefs.filter.all"),
      value: filters.source,
      options: BELIEF_SOURCES.map((option) => ({
        value: option,
        label: labelFor(t, "source", option),
      })),
    },
  ]

  return (
    <FilterablePanel
      dimensions={filterDimensions}
      header={
        <ActionGroup justify="between" className="items-center">
          <Badge
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
          >
            {t("beliefs.filter.count", { count: total })}
          </Badge>
          <AnimatedButton show={isControlMode} size="sm" onClick={onCreate}>
            <Plus className="size-3.5" />
            {t("beliefs.actions.create")}
          </AnimatedButton>
        </ActionGroup>
      }
      searchQuery={searchQuery}
      onSearchQueryChange={setSearchQuery}
      onChangeFilter={(key, value) => onFilterChange({ ...filters, [key]: value })}
      onClearAll={() => onFilterChange(DEFAULT_FILTERS)}
      popoverWidth="20.5rem"
    />
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
            {t("common.empty.noData")}
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
        {t("beliefs.impact.title")}
      </div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
        {t("beliefs.impact.description")}
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
        <EmptyState message={t("beliefs.empty.cards")} compact />
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
        <EmptyState message={t("beliefs.empty.relations")} compact />
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
        <AnimatedIconButton
          show={isControlMode && Boolean(onEdit)}
          variant="ghost"
          size="icon-sm"
          label={t("common.actions.edit")}
          icon={<Edit3 className="size-3.5" />}
          onClick={onEdit}
        />
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
        <BeliefMeta label={t("beliefs.field.source")} value={labelFor(t, "source", entry.source)} />
        <BeliefMeta
          label={t("beliefs.field.impact")}
          value={labelFor(t, "impact", entry.impact)}
          accent
        />
        {entry.secondaryDomains && entry.secondaryDomains.length > 0 ? (
          <BeliefMeta
            label={t("beliefs.field.secondaryDomains")}
            value={entry.secondaryDomains
              .map((domain) => labelFor(t, "domain", domain))
              .join(" / ")}
          />
        ) : null}
        {entry.cbtLayer ? (
          <BeliefMeta
            label={t("beliefs.field.cbtLayer")}
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
            {t("beliefs.psych.title")}
          </summary>
          <div className="mt-3 space-y-2 text-xs leading-5 text-[color:var(--text-secondary)]">
            {entry.cognitiveDistortions && entry.cognitiveDistortions.length > 0 ? (
              <div>
                <span className="font-medium text-[color:var(--text-primary)]">
                  {t("beliefs.field.cognitiveDistortions")}：
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
                  {t("beliefs.field.defenseMechanism")}：
                </span>
                <span className="ml-1 text-[color:var(--text-muted)]">
                  {labelFor(t, "defenseMechanism", entry.defenseMechanism)}
                </span>
              </div>
            ) : null}
            {entry.attachmentNote ? (
              <div>
                <span className="font-medium text-[color:var(--text-primary)]">
                  {t("beliefs.attachment.title")}：
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
