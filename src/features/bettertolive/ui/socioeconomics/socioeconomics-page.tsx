import {
  Globe2,
  Grid3x3,
  Landmark,
  MapPin,
  NotebookPen,
  Pencil,
  Plus,
  Telescope,
} from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  EconConfidence,
  EconDomain,
  EconRelevance,
  SocioeconomicsEntry,
  SocioeconomicsGap,
  SocioeconomicsModuleData,
} from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  Surface,
} from "@/features/bettertolive/ui/shared/shared"
import {
  type EditingSocioeconomicsEntry,
  type EditingSocioeconomicsGap,
  type EditingSocioeconomicsPrompt,
  SocioeconomicsEntryEditDialog,
  SocioeconomicsGapEditDialog,
  SocioeconomicsPromptEditDialog,
} from "@/features/bettertolive/ui/socioeconomics/socioeconomics-edit-dialog"
import { translateSocioeconomicsEnum } from "@/features/bettertolive/ui/socioeconomics/socioeconomics-i18n"
import {
  ECON_CONFIDENCE_ORDER,
  ECON_CONFIDENCES,
  ECON_DOMAINS,
  ECON_LAYERS,
  ECON_RELEVANCES,
  ECON_SOURCES,
} from "@/features/bettertolive/ui/socioeconomics/socioeconomics-page-data"
import { SocioeconomicsControlModeBadge } from "@/features/bettertolive/ui/socioeconomics/socioeconomics-page-shared"
import { cn } from "@/lib/utils"

type SocioeconomicsEnumGroup = "domain" | "layer" | "confidence" | "source" | "relevance"

type DistributionRow = {
  label: string
  count: number
}

type ClassificationSection = {
  title: string
  description: string
  group: SocioeconomicsEnumGroup
  rows: DistributionRow[]
}

type SocioeconomicsActions = {
  isControlMode: boolean
  onCreateEntry: () => void
  onEditEntry: (entry: SocioeconomicsEntry) => void
  onCreateGap: () => void
  onEditGap: (gap: SocioeconomicsGap) => void
  onCreatePrompt: () => void
  onEditPrompt: (prompt: string, index: number) => void
}

function createDistribution<T extends string>(
  order: readonly T[],
  entries: SocioeconomicsEntry[],
  getValue: (entry: SocioeconomicsEntry) => T,
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

function createHeatmap(entries: SocioeconomicsEntry[]) {
  const matrix = new Map<EconDomain, Map<EconConfidence, number>>()
  ECON_DOMAINS.forEach((domain) => {
    const row = new Map<EconConfidence, number>()
    ECON_CONFIDENCES.forEach((conf) => row.set(conf, 0))
    matrix.set(domain, row)
  })

  entries.forEach((entry) => {
    const row = matrix.get(entry.domain)
    if (!row) return
    row.set(entry.confidence, (row.get(entry.confidence) ?? 0) + 1)
  })

  return matrix
}

function normalizeSocioeconomicsData(
  socioeconomics: SocioeconomicsModuleData,
): SocioeconomicsModuleData {
  const source = socioeconomics as Partial<SocioeconomicsModuleData>

  return {
    entries: source.entries ?? [],
    gaps: source.gaps ?? [],
    reviewPrompts: source.reviewPrompts ?? [],
  }
}

export function SocioeconomicsPage({
  socioeconomicsModule,
  sourceSocioeconomicsModule,
  searchQuery,
  isControlMode = false,
  isStackedLayout = false,
}: {
  socioeconomicsModule: SocioeconomicsModuleData
  sourceSocioeconomicsModule?: SocioeconomicsModuleData
  searchQuery: string
  isControlMode?: boolean
  isStackedLayout?: boolean
}) {
  const { t } = useTranslation()
  const isFixedLayout = !isStackedLayout
  const displayModule = normalizeSocioeconomicsData(socioeconomicsModule)
  const sourceModule = normalizeSocioeconomicsData(
    sourceSocioeconomicsModule ?? socioeconomicsModule,
  )
  const entries = displayModule.entries
  const [editingEntry, setEditingEntry] = useState<EditingSocioeconomicsEntry | null>(null)
  const [editingGap, setEditingGap] = useState<EditingSocioeconomicsGap | null>(null)
  const [editingPrompt, setEditingPrompt] = useState<EditingSocioeconomicsPrompt | null>(null)
  const classificationSections: ClassificationSection[] = [
    {
      title: t("socioeconomics.classification.domain.title", "领域"),
      description: t("socioeconomics.classification.domain.description", "属于经济运行的哪一块。"),
      group: "domain",
      rows: createDistribution(ECON_DOMAINS, entries, (entry) => entry.domain),
    },
    {
      title: t("socioeconomics.classification.layer.title", "层次"),
      description: t(
        "socioeconomics.classification.layer.description",
        "微观、中观、宏观三层视角。",
      ),
      group: "layer",
      rows: createDistribution(ECON_LAYERS, entries, (entry) => entry.layer),
    },
    {
      title: t("socioeconomics.classification.confidence.title", "掌握程度"),
      description: t(
        "socioeconomics.classification.confidence.description",
        "从听过名词到有自己的判断框架。",
      ),
      group: "confidence",
      rows: createDistribution(ECON_CONFIDENCES, entries, (entry) => entry.confidence),
    },
    {
      title: t("socioeconomics.classification.source.title", "来源"),
      description: t("socioeconomics.classification.source.description", "认知从哪里建立起来。"),
      group: "source",
      rows: createDistribution(ECON_SOURCES, entries, (entry) => entry.source),
    },
  ]
  const relevanceRows = createDistribution(ECON_RELEVANCES, entries, (entry) => entry.relevance)
  const heatmap = createHeatmap(entries)
  const reviewItems = [...entries]
    .filter((entry) => entry.relevance === "直接影响当前决策" || entry.confidence === "听过名词")
    .sort((a, b) => ECON_CONFIDENCE_ORDER[a.confidence] - ECON_CONFIDENCE_ORDER[b.confidence])
  const actions: SocioeconomicsActions = {
    isControlMode,
    onCreateEntry: () => setEditingEntry({ isNew: true, entry: null }),
    onEditEntry: (entry) => setEditingEntry({ isNew: false, entry }),
    onCreateGap: () => setEditingGap({ isNew: true, gap: null }),
    onEditGap: (gap) => setEditingGap({ isNew: false, gap }),
    onCreatePrompt: () => setEditingPrompt({ isNew: true, index: null, prompt: "" }),
    onEditPrompt: (prompt, index) =>
      setEditingPrompt({
        isNew: false,
        index: resolveSourcePromptIndex(
          sourceModule.reviewPrompts,
          displayModule.reviewPrompts,
          index,
        ),
        prompt,
      }),
  }

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <PageIntro
        eyebrow={t("socioeconomics.page.eyebrow", "社会经济")}
        title={t("socioeconomics.page.title", "看清外部经济世界怎么运转")}
        description={t(
          "socioeconomics.page.description",
          "按 4 维分类、看 relevance 决策距离，再用热力图找认知盲区。",
        )}
        searchQuery={searchQuery}
      />

      <SocioeconomicsToolbar actions={actions} />

      {isFixedLayout ? (
        <SocioeconomicsFixedDashboard
          classificationSections={classificationSections}
          relevanceRows={relevanceRows}
          heatmap={heatmap}
          entries={entries}
          reviewItems={reviewItems}
          socioeconomicsModule={displayModule}
          actions={actions}
        />
      ) : (
        <SocioeconomicsStackedView
          classificationSections={classificationSections}
          relevanceRows={relevanceRows}
          heatmap={heatmap}
          entries={entries}
          socioeconomicsModule={displayModule}
          actions={actions}
        />
      )}

      {editingEntry ? (
        <SocioeconomicsEntryEditDialog
          key={editingEntry.entry?.id ?? "new-entry"}
          editing={editingEntry}
          socioeconomics={sourceModule}
          onClose={() => setEditingEntry(null)}
        />
      ) : null}

      {editingGap ? (
        <SocioeconomicsGapEditDialog
          key={editingGap.gap?.id ?? "new-gap"}
          editing={editingGap}
          socioeconomics={sourceModule}
          onClose={() => setEditingGap(null)}
        />
      ) : null}

      {editingPrompt ? (
        <SocioeconomicsPromptEditDialog
          key={editingPrompt.index ?? "new-prompt"}
          editing={editingPrompt}
          socioeconomics={sourceModule}
          onClose={() => setEditingPrompt(null)}
        />
      ) : null}
    </div>
  )
}

function SocioeconomicsToolbar({ actions }: { actions: SocioeconomicsActions }) {
  const { t } = useTranslation()

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
      <SocioeconomicsControlModeBadge isControlMode={actions.isControlMode} />
      {actions.isControlMode ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={actions.onCreateEntry}>
            <Plus className="size-3.5" />
            {t("socioeconomics.actions.addEntry", "新增条目")}
          </Button>
          <Button size="sm" variant="outline" onClick={actions.onCreateGap}>
            <Plus className="size-3.5" />
            {t("socioeconomics.actions.addGap", "新增缺口")}
          </Button>
          <Button size="sm" variant="outline" onClick={actions.onCreatePrompt}>
            <Plus className="size-3.5" />
            {t("socioeconomics.actions.addPrompt", "新增提问")}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function SocioeconomicsFixedDashboard({
  classificationSections,
  relevanceRows,
  heatmap,
  entries,
  reviewItems,
  socioeconomicsModule,
  actions,
}: {
  classificationSections: ClassificationSection[]
  relevanceRows: DistributionRow[]
  heatmap: Map<EconDomain, Map<EconConfidence, number>>
  entries: SocioeconomicsEntry[]
  reviewItems: SocioeconomicsEntry[]
  socioeconomicsModule: SocioeconomicsModuleData
  actions: SocioeconomicsActions
}) {
  const { t } = useTranslation()

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,0.94fr)_minmax(0,1.1fr)_minmax(320px,0.88fr)] grid-rows-[minmax(0,0.9fr)_minmax(0,1fr)] gap-3 overflow-hidden">
      <Surface className="col-span-2 flex min-h-0 flex-col overflow-hidden p-4">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <div className="grid gap-2 min-[1240px]:grid-cols-4">
            {classificationSections.map((section) => (
              <ClassificationPanel
                key={section.title}
                title={section.title}
                description={section.description}
                group={section.group}
                rows={section.rows}
                total={entries.length}
              />
            ))}
          </div>

          <RelevancePanel rows={relevanceRows} compact />
        </div>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <SectionHeading
          icon={Grid3x3}
          title={t("socioeconomics.heatmap.title", "领域 × 掌握程度")}
          description={t("socioeconomics.heatmap.description", "颜色越深，掌握度越高。")}
          compact
        />
        <div className="mt-3 min-h-0 flex-1 overflow-auto pr-1">
          <Heatmap heatmap={heatmap} />
        </div>
      </Surface>

      <Surface className="col-span-2 flex min-h-0 flex-col overflow-hidden p-4">
        <Tabs defaultValue="entries" className="flex min-h-0 flex-1 flex-col">
          <TabsList className="w-full shrink-0 justify-start gap-1 rounded-lg bg-[color:var(--chip-bg)] p-1">
            <TabsTrigger value="entries">
              {t("socioeconomics.tabs.entries", "认知清单")}
            </TabsTrigger>
            <TabsTrigger value="gaps">{t("socioeconomics.tabs.gaps", "认知缺口")}</TabsTrigger>
            <TabsTrigger value="prompts">
              {t("socioeconomics.tabs.prompts", "复习提问")}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="entries" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-3">
              {entries.length > 0 ? (
                entries.map((entry) => (
                  <SocioeconomicsCard
                    key={entry.id}
                    entry={entry}
                    compact
                    onEdit={actions.isControlMode ? () => actions.onEditEntry(entry) : undefined}
                  />
                ))
              ) : (
                <EmptyState
                  message={t("socioeconomics.empty.entries", "当前筛选下没有可展示的认知条目。")}
                  compact
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="gaps" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {socioeconomicsModule.gaps.length > 0 ? (
                socioeconomicsModule.gaps.map((gap) => (
                  <GapCard
                    key={gap.id}
                    gap={gap}
                    compact
                    onEdit={actions.isControlMode ? () => actions.onEditGap(gap) : undefined}
                  />
                ))
              ) : (
                <EmptyState
                  message={t("socioeconomics.empty.gaps", "当前筛选下没有可展示的认知缺口。")}
                  compact
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="prompts" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {socioeconomicsModule.reviewPrompts.length > 0 ? (
                socioeconomicsModule.reviewPrompts.map((prompt, index) => (
                  <PromptCard
                    key={`${prompt}-${index}`}
                    prompt={prompt}
                    compact
                    onEdit={
                      actions.isControlMode ? () => actions.onEditPrompt(prompt, index) : undefined
                    }
                  />
                ))
              ) : (
                <EmptyState
                  message={t("socioeconomics.empty.prompts", "当前筛选下没有复习提问。")}
                  compact
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <SectionHeading
          icon={NotebookPen}
          title={t("socioeconomics.review.title", "该先补的几条")}
          description={t(
            "socioeconomics.review.description",
            "决策距离近 + 掌握度浅，是优先补课的位置。",
          )}
          compact
        />
        <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {reviewItems.length > 0 ? (
            reviewItems
              .slice(0, 6)
              .map((entry) => <ReviewSignalCard key={entry.id} entry={entry} />)
          ) : (
            <EmptyState
              message={t("socioeconomics.empty.review", "当前筛选下没有需要优先补课的条目。")}
              compact
            />
          )}
        </div>
      </Surface>
    </div>
  )
}

function SocioeconomicsStackedView({
  classificationSections,
  relevanceRows,
  heatmap,
  entries,
  socioeconomicsModule,
  actions,
}: {
  classificationSections: ClassificationSection[]
  relevanceRows: DistributionRow[]
  heatmap: Map<EconDomain, Map<EconConfidence, number>>
  entries: SocioeconomicsEntry[]
  socioeconomicsModule: SocioeconomicsModuleData
  actions: SocioeconomicsActions
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <Surface className="p-5">
        <SectionHeading
          icon={Landmark}
          title={t("socioeconomics.classification.title", "4 维认知分类")}
          description={t(
            "socioeconomics.classification.description",
            "按 4 维归类；relevance 跟着每条走，不进主筛选器。",
          )}
        />
        <div className="mt-5 grid gap-3 min-[960px]:grid-cols-2 min-[1240px]:grid-cols-4">
          {classificationSections.map((section) => (
            <ClassificationPanel
              key={section.title}
              title={section.title}
              description={section.description}
              group={section.group}
              rows={section.rows}
              total={entries.length}
            />
          ))}
        </div>
        <RelevancePanel rows={relevanceRows} className="mt-4" />
      </Surface>

      <Surface className="p-5">
        <SectionHeading
          icon={Grid3x3}
          title={t("socioeconomics.heatmap.title", "领域 × 掌握程度")}
          description={t(
            "socioeconomics.heatmap.stackedDescription",
            "一眼看清哪些领域我自以为懂、其实只到名词。",
          )}
        />
        <div className="mt-5 overflow-x-auto">
          <Heatmap heatmap={heatmap} />
        </div>
      </Surface>

      <div className="grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
        <Surface className="p-5">
          <SectionHeading
            icon={Telescope}
            title={t("socioeconomics.entries.title", "认知清单")}
            description={t("socioeconomics.entries.description", "每条都显示掌握度和决策距离。")}
          />
          <div className="mt-5 space-y-4">
            {entries.length > 0 ? (
              entries.map((entry) => (
                <SocioeconomicsCard
                  key={entry.id}
                  entry={entry}
                  onEdit={actions.isControlMode ? () => actions.onEditEntry(entry) : undefined}
                />
              ))
            ) : (
              <EmptyState
                message={t("socioeconomics.empty.entries", "当前筛选下没有可展示的认知条目。")}
                compact
              />
            )}
          </div>
        </Surface>

        <div className="space-y-4">
          <Surface className="p-5">
            <SectionHeading
              icon={MapPin}
              title={t("socioeconomics.gaps.title", "认知缺口")}
              description={t(
                "socioeconomics.gaps.description",
                "先把哪里只是听过名词、哪里还没形成判断写出来。",
              )}
            />
            <div className="mt-5 space-y-3">
              {socioeconomicsModule.gaps.length > 0 ? (
                socioeconomicsModule.gaps.map((gap) => (
                  <GapCard
                    key={gap.id}
                    gap={gap}
                    onEdit={actions.isControlMode ? () => actions.onEditGap(gap) : undefined}
                  />
                ))
              ) : (
                <EmptyState
                  message={t("socioeconomics.empty.gaps", "当前筛选下没有可展示的认知缺口。")}
                  compact
                />
              )}
            </div>
          </Surface>

          <Surface className="p-5">
            <SectionHeading
              icon={NotebookPen}
              title={t("socioeconomics.prompts.title", "复习提问")}
              description={t(
                "socioeconomics.prompts.description",
                "把它当作每个月对认知地图的一次例行盘点。",
              )}
            />
            <div className="mt-5 space-y-2">
              {socioeconomicsModule.reviewPrompts.length > 0 ? (
                socioeconomicsModule.reviewPrompts.map((prompt, index) => (
                  <PromptCard
                    key={`${prompt}-${index}`}
                    prompt={prompt}
                    onEdit={
                      actions.isControlMode ? () => actions.onEditPrompt(prompt, index) : undefined
                    }
                  />
                ))
              ) : (
                <EmptyState
                  message={t("socioeconomics.empty.prompts", "当前筛选下没有复习提问。")}
                  compact
                />
              )}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  )
}

function RelevancePanel({
  rows,
  className,
  compact = false,
}: {
  rows: DistributionRow[]
  className?: string
  compact?: boolean
}) {
  const { t } = useTranslation()
  const visibleRows = rows.filter((row) => row.count > 0)

  return (
    <div
      className={cn(
        "rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4",
        compact && "py-3",
        className,
      )}
    >
      <div className="text-sm font-medium text-[color:var(--text-primary)]">
        {t("socioeconomics.relevance.title", "决策距离")}
      </div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
        {t(
          "socioeconomics.relevance.description",
          "relevance 不进主筛选器，但是判断这条现在用不用得上的核心评估。",
        )}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {visibleRows.length > 0 ? (
          visibleRows.map((row) => (
            <RelevanceBadge
              key={row.label}
              relevance={row.label as EconRelevance}
              count={row.count}
            />
          ))
        ) : (
          <span className="text-xs text-[color:var(--text-muted)]">
            {t("socioeconomics.empty.distribution", "暂无分布数据。")}
          </span>
        )}
      </div>
    </div>
  )
}

function ClassificationPanel({
  title,
  description,
  group,
  rows,
  total,
}: {
  title: string
  description: string
  group: SocioeconomicsEnumGroup
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
                    {translateSocioeconomicsEnum(t, group, row.label)}
                  </span>
                  <span className="shrink-0 text-[color:var(--text-muted)]">{row.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--chip-bg)]">
                  <div
                    className="h-full rounded-full bg-[color:var(--socio-meter-bg)] opacity-80"
                    style={{ width }}
                  />
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-xs leading-5 text-[color:var(--text-muted)]">
            {t("socioeconomics.empty.distribution", "暂无分布数据。")}
          </div>
        )}
      </div>
    </div>
  )
}

function Heatmap({ heatmap }: { heatmap: Map<EconDomain, Map<EconConfidence, number>> }) {
  const { t } = useTranslation()

  return (
    <div className="min-w-[420px] space-y-1.5">
      <div className="grid grid-cols-[minmax(110px,1fr)_repeat(4,minmax(58px,1fr))] gap-1.5 text-[11px] text-[color:var(--text-muted)]">
        <div />
        {ECON_CONFIDENCES.map((conf) => (
          <div key={conf} className="px-1 text-center leading-tight">
            {translateSocioeconomicsEnum(t, "confidence", conf)}
          </div>
        ))}
      </div>
      {ECON_DOMAINS.map((domain) => {
        const row = heatmap.get(domain)
        return (
          <div
            key={domain}
            className="grid grid-cols-[minmax(110px,1fr)_repeat(4,minmax(58px,1fr))] gap-1.5"
          >
            <div className="flex items-center text-xs text-[color:var(--text-secondary)]">
              {translateSocioeconomicsEnum(t, "domain", domain)}
            </div>
            {ECON_CONFIDENCES.map((conf, index) => {
              const value = row?.get(conf) ?? 0
              const intensity = value === 0 ? 0 : Math.min(0.85, 0.26 + (index + 1) * 0.14)
              const heatColor = `var(--socio-heat-${index + 1})`

              return (
                <div
                  key={conf}
                  className="flex h-9 items-center justify-center rounded-md border border-[color:var(--chip-border)] text-xs font-medium"
                  style={{
                    backgroundColor:
                      value === 0
                        ? "var(--muted-surface-bg)"
                        : `color-mix(in srgb, ${heatColor} ${Math.round(intensity * 76)}%, var(--surface-bg))`,
                    color:
                      value === 0
                        ? "var(--text-muted)"
                        : intensity > 0.6
                          ? "var(--socio-heat-ink)"
                          : "var(--text-primary)",
                  }}
                >
                  {value > 0 ? value : "·"}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function SocioeconomicsCard({
  entry,
  compact = false,
  onEdit,
}: {
  entry: SocioeconomicsEntry
  compact?: boolean
  onEdit?: () => void
}) {
  const { t } = useTranslation()

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
            {translateSocioeconomicsEnum(t, "domain", entry.domain)}
          </Badge>
          <Badge
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
          >
            {translateSocioeconomicsEnum(t, "layer", entry.layer)}
          </Badge>
          <ConfidenceBadge confidence={entry.confidence} />
          <RelevanceBadge relevance={entry.relevance} />
        </div>
        {onEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("socioeconomics.actions.editEntry", "编辑条目")}
            onClick={onEdit}
          >
            <Pencil className="size-3.5" />
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
        {entry.summary}
      </p>
      {entry.understandingNote ? (
        <p
          className={cn(
            "mt-2 text-sm leading-6 text-[color:var(--text-muted)]",
            compact && "text-xs leading-5",
          )}
        >
          <span className="font-medium text-[color:var(--text-primary)]">
            {t("socioeconomics.fields.understandingNote", "理解笔记")}:
          </span>{" "}
          {entry.understandingNote}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2 min-[640px]:grid-cols-2">
        <SocioeconomicsMeta
          label={t("socioeconomics.fields.source", "来源")}
          value={translateSocioeconomicsEnum(t, "source", entry.source)}
        />
        <SocioeconomicsMeta
          label={t("socioeconomics.fields.relevance", "决策距离")}
          value={translateSocioeconomicsEnum(t, "relevance", entry.relevance)}
          accent
        />
      </div>

      {entry.relatedConcepts && entry.relatedConcepts.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {entry.relatedConcepts.map((concept) => (
            <Badge
              key={concept}
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
            >
              {concept}
            </Badge>
          ))}
        </div>
      ) : null}

      {entry.confidenceHistory && entry.confidenceHistory.length > 0 ? (
        <div className="mt-3 space-y-2">
          {entry.confidenceHistory.map((history) => (
            <div
              key={history.id}
              className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-3 py-2 text-xs leading-5 text-[color:var(--text-muted)]"
            >
              <span className="font-medium text-[color:var(--text-primary)]">{history.date}</span>:{" "}
              {translateSocioeconomicsEnum(t, "confidence", history.from)} {"->"}{" "}
              {translateSocioeconomicsEnum(t, "confidence", history.to)}
              <span className="ml-1">· {history.trigger}</span>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  )
}

function SocioeconomicsMeta({
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
          accent && "text-[color:var(--socio-priority-ink)]",
        )}
      >
        {value}
      </div>
    </div>
  )
}

function ConfidenceBadge({ confidence }: { confidence: EconConfidence }) {
  const { t } = useTranslation()
  const style =
    confidence === "有自己的判断框架"
      ? "bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]"
      : confidence === "能预判常见情境"
        ? "bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]"
        : confidence === "知道大致逻辑"
          ? "bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
          : "bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]"

  return <Badge className={style}>{translateSocioeconomicsEnum(t, "confidence", confidence)}</Badge>
}

function RelevanceBadge({ relevance, count }: { relevance: EconRelevance; count?: number }) {
  const { t } = useTranslation()

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]",
        relevance === "直接影响当前决策" &&
          "border-[color:var(--socio-priority-border)] bg-[color:var(--socio-priority-bg)] text-[color:var(--socio-priority-ink)]",
      )}
    >
      {translateSocioeconomicsEnum(t, "relevance", relevance)}
      {typeof count === "number" ? ` · ${count}` : null}
    </Badge>
  )
}

function GapCard({
  gap,
  compact = false,
  onEdit,
}: {
  gap: SocioeconomicsGap
  compact?: boolean
  onEdit?: () => void
}) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3",
        compact && "px-3 py-2.5",
      )}
    >
      <div className="flex items-start gap-3">
        <Globe2 className="mt-1 size-4 shrink-0 text-[color:var(--text-muted)]" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
            >
              {translateSocioeconomicsEnum(t, "domain", gap.domain)}
            </Badge>
            {onEdit ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("socioeconomics.actions.editGap", "编辑缺口")}
                onClick={onEdit}
              >
                <Pencil className="size-3.5" />
              </Button>
            ) : null}
          </div>
          <p
            className={cn(
              "mt-2 text-sm leading-6 text-[color:var(--text-secondary)]",
              compact && "text-xs leading-5",
            )}
          >
            {gap.summary}
          </p>
          <p
            className={cn(
              "mt-1.5 text-xs leading-5 text-[color:var(--text-muted)]",
              compact && "text-[11px]",
            )}
          >
            <span className="font-medium text-[color:var(--text-primary)]">
              {t("socioeconomics.fields.nextStep", "下一步")}:
            </span>{" "}
            {gap.nextStep}
          </p>
        </div>
      </div>
    </div>
  )
}

function PromptCard({
  prompt,
  compact = false,
  onEdit,
}: {
  prompt: string
  compact?: boolean
  onEdit?: () => void
}) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]",
        compact && "px-3 py-2.5 text-xs leading-5",
      )}
    >
      <span className="min-w-0">{prompt}</span>
      {onEdit ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("socioeconomics.actions.editPrompt", "编辑提问")}
          onClick={onEdit}
        >
          <Pencil className="size-3.5" />
        </Button>
      ) : null}
    </div>
  )
}

function resolveSourcePromptIndex(
  sourcePrompts: string[],
  visiblePrompts: string[],
  visibleIndex: number,
) {
  const prompt = visiblePrompts[visibleIndex]
  if (prompt === undefined) {
    return visibleIndex
  }

  const visibleOccurrence = visiblePrompts
    .slice(0, visibleIndex + 1)
    .filter((entry) => entry === prompt).length
  let sourceOccurrence = 0

  for (let index = 0; index < sourcePrompts.length; index += 1) {
    if (sourcePrompts[index] !== prompt) {
      continue
    }

    sourceOccurrence += 1
    if (sourceOccurrence === visibleOccurrence) {
      return index
    }
  }

  const fallbackIndex = sourcePrompts.indexOf(prompt)
  return fallbackIndex >= 0 ? fallbackIndex : visibleIndex
}

function ReviewSignalCard({ entry }: { entry: SocioeconomicsEntry }) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge className="bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]">
          {translateSocioeconomicsEnum(t, "domain", entry.domain)}
        </Badge>
        <ConfidenceBadge confidence={entry.confidence} />
      </div>
      <div className="mt-2 text-sm font-medium text-[color:var(--text-primary)]">{entry.title}</div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">
        {translateSocioeconomicsEnum(t, "relevance", entry.relevance)} · {entry.summary}
      </p>
    </div>
  )
}
