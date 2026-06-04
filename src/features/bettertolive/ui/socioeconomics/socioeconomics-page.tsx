import { Globe2, Grid3x3, Landmark, MapPin, NotebookPen, Telescope } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  EconConfidence,
  EconDomain,
  EconLayer,
  EconRelevance,
  EconSource,
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
import { cn } from "@/lib/utils"

const ECON_DOMAINS = [
  "货币与物价",
  "个人财务",
  "劳动力市场",
  "产业与公司",
  "财政与政策",
  "金融市场",
  "全球与宏观",
] satisfies EconDomain[]

const ECON_LAYERS = ["微观", "中观", "宏观"] satisfies EconLayer[]

const ECON_CONFIDENCES = [
  "听过名词",
  "知道大致逻辑",
  "能预判常见情境",
  "有自己的判断框架",
] satisfies EconConfidence[]

const ECON_SOURCES = [
  "系统学习",
  "新闻媒体",
  "亲身经历",
  "他人叙述",
  "专业讨论",
] satisfies EconSource[]

const ECON_RELEVANCES = [
  "直接影响当前决策",
  "影响中期规划",
  "影响长期方向",
  "纯认知储备",
] satisfies EconRelevance[]

type DistributionRow = {
  label: string
  count: number
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

export function SocioeconomicsPage({
  socioeconomicsModule,
  searchQuery,
  isStackedLayout = false,
}: {
  socioeconomicsModule: SocioeconomicsModuleData
  searchQuery: string
  isStackedLayout?: boolean
}) {
  const isFixedLayout = !isStackedLayout
  const entries = socioeconomicsModule.entries
  const classificationSections = [
    {
      title: "领域",
      description: "属于经济运行的哪一块。",
      rows: createDistribution(ECON_DOMAINS, entries, (entry) => entry.domain),
    },
    {
      title: "层次",
      description: "微观、中观、宏观三层视角。",
      rows: createDistribution(ECON_LAYERS, entries, (entry) => entry.layer),
    },
    {
      title: "掌握程度",
      description: "从听过名词到有自己的判断框架。",
      rows: createDistribution(ECON_CONFIDENCES, entries, (entry) => entry.confidence),
    },
    {
      title: "来源",
      description: "认知从哪里建立起来。",
      rows: createDistribution(ECON_SOURCES, entries, (entry) => entry.source),
    },
  ]
  const relevanceRows = createDistribution(ECON_RELEVANCES, entries, (entry) => entry.relevance)
  const heatmap = createHeatmap(entries)
  const reviewItems = [...entries]
    .filter((entry) => entry.relevance === "直接影响当前决策" || entry.confidence === "听过名词")
    .sort((a, b) => {
      const order: Record<EconConfidence, number> = {
        听过名词: 0,
        知道大致逻辑: 1,
        能预判常见情境: 2,
        有自己的判断框架: 3,
      }
      return order[a.confidence] - order[b.confidence]
    })

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <PageIntro
        eyebrow="社会经济"
        title="看清外部经济世界怎么运转"
        description="按 4 维分类、看 relevance 决策距离，再用热力图找认知盲区。"
        searchQuery={searchQuery}
      />

      {isFixedLayout ? (
        <SocioeconomicsFixedDashboard
          classificationSections={classificationSections}
          relevanceRows={relevanceRows}
          heatmap={heatmap}
          entries={entries}
          reviewItems={reviewItems}
          socioeconomicsModule={socioeconomicsModule}
        />
      ) : (
        <SocioeconomicsStackedView
          classificationSections={classificationSections}
          relevanceRows={relevanceRows}
          heatmap={heatmap}
          entries={entries}
          socioeconomicsModule={socioeconomicsModule}
        />
      )}
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
}: {
  classificationSections: Array<{ title: string; description: string; rows: DistributionRow[] }>
  relevanceRows: DistributionRow[]
  heatmap: Map<EconDomain, Map<EconConfidence, number>>
  entries: SocioeconomicsEntry[]
  reviewItems: SocioeconomicsEntry[]
  socioeconomicsModule: SocioeconomicsModuleData
}) {
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
                rows={section.rows}
                total={entries.length}
              />
            ))}
          </div>

          <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4">
            <div className="text-sm font-medium text-[color:var(--text-primary)]">
              决策距离 (relevance)
            </div>
            <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
              decisions 不进主筛选器，但是判断“这条现在用不用得上”的核心评估。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {relevanceRows
                .filter((row) => row.count > 0)
                .map((row) => (
                  <Badge
                    key={row.label}
                    variant="outline"
                    className={cn(
                      "border-[color:var(--chip-border)]",
                      row.label === "直接影响当前决策"
                        ? "bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]"
                        : row.label === "影响中期规划"
                          ? "bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]"
                          : row.label === "影响长期方向"
                            ? "bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]"
                            : "bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]",
                    )}
                  >
                    {row.label} · {row.count}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <SectionHeading
          icon={Grid3x3}
          title="领域 × 掌握程度"
          description="颜色越深，掌握度越高。"
          compact
        />
        <div className="mt-3 min-h-0 flex-1 overflow-auto pr-1">
          <Heatmap heatmap={heatmap} />
        </div>
      </Surface>

      <Surface className="col-span-2 flex min-h-0 flex-col overflow-hidden p-4">
        <Tabs defaultValue="entries" className="min-h-0 flex-1">
          <TabsList className="w-full justify-start gap-1 rounded-lg bg-[color:var(--chip-bg)] p-1">
            <TabsTrigger value="entries">认知清单</TabsTrigger>
            <TabsTrigger value="gaps">认知缺口</TabsTrigger>
            <TabsTrigger value="prompts">复习提问</TabsTrigger>
          </TabsList>

          <TabsContent value="entries" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-3">
              {entries.length > 0 ? (
                entries.map((entry) => <SocioeconomicsCard key={entry.id} entry={entry} compact />)
              ) : (
                <EmptyState message="当前筛选下没有可展示的认知条目。" compact />
              )}
            </div>
          </TabsContent>

          <TabsContent value="gaps" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {socioeconomicsModule.gaps.length > 0 ? (
                socioeconomicsModule.gaps.map((gap) => <GapCard key={gap.id} gap={gap} compact />)
              ) : (
                <EmptyState message="当前筛选下没有可展示的认知缺口。" compact />
              )}
            </div>
          </TabsContent>

          <TabsContent value="prompts" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {socioeconomicsModule.reviewPrompts.length > 0 ? (
                socioeconomicsModule.reviewPrompts.map((prompt) => (
                  <div
                    key={prompt}
                    className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-2.5 text-xs leading-5 text-[color:var(--text-secondary)]"
                  >
                    {prompt}
                  </div>
                ))
              ) : (
                <EmptyState message="当前筛选下没有复习提问。" compact />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <SectionHeading
          icon={NotebookPen}
          title="该先补的几条"
          description="决策距离近 + 掌握度浅，是优先补课的位置。"
          compact
        />
        <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {reviewItems.length > 0 ? (
            reviewItems
              .slice(0, 6)
              .map((entry) => <ReviewSignalCard key={entry.id} entry={entry} />)
          ) : (
            <EmptyState message="当前筛选下没有需要优先补课的条目。" compact />
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
}: {
  classificationSections: Array<{ title: string; description: string; rows: DistributionRow[] }>
  relevanceRows: DistributionRow[]
  heatmap: Map<EconDomain, Map<EconConfidence, number>>
  entries: SocioeconomicsEntry[]
  socioeconomicsModule: SocioeconomicsModuleData
}) {
  return (
    <div className="space-y-4">
      <Surface className="p-5">
        <SectionHeading
          icon={Landmark}
          title="4 维认知分类"
          description="按 4 维归类；relevance 跟着每条走，不进主筛选器。"
        />
        <div className="mt-5 grid gap-3 min-[960px]:grid-cols-2 min-[1240px]:grid-cols-4">
          {classificationSections.map((section) => (
            <ClassificationPanel
              key={section.title}
              title={section.title}
              description={section.description}
              rows={section.rows}
              total={entries.length}
            />
          ))}
        </div>
        <div className="mt-4 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4">
          <div className="text-sm font-medium text-[color:var(--text-primary)]">决策距离</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {relevanceRows
              .filter((row) => row.count > 0)
              .map((row) => (
                <Badge
                  key={row.label}
                  variant="outline"
                  className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
                >
                  {row.label} · {row.count}
                </Badge>
              ))}
          </div>
        </div>
      </Surface>

      <Surface className="p-5">
        <SectionHeading
          icon={Grid3x3}
          title="领域 × 掌握程度"
          description="一眼看清哪些领域我自以为懂、其实只到名词。"
        />
        <div className="mt-5 overflow-x-auto">
          <Heatmap heatmap={heatmap} />
        </div>
      </Surface>

      <div className="grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
        <Surface className="p-5">
          <SectionHeading
            icon={Telescope}
            title="认知清单"
            description="每条都显示掌握度和决策距离。"
          />
          <div className="mt-5 space-y-4">
            {entries.length > 0 ? (
              entries.map((entry) => <SocioeconomicsCard key={entry.id} entry={entry} />)
            ) : (
              <EmptyState message="当前筛选下没有可展示的认知条目。" compact />
            )}
          </div>
        </Surface>

        <div className="space-y-4">
          <Surface className="p-5">
            <SectionHeading
              icon={MapPin}
              title="认知缺口"
              description="先把哪里只是听过名词、哪里还没形成判断写出来。"
            />
            <div className="mt-5 space-y-3">
              {socioeconomicsModule.gaps.length > 0 ? (
                socioeconomicsModule.gaps.map((gap) => <GapCard key={gap.id} gap={gap} />)
              ) : (
                <EmptyState message="当前筛选下没有可展示的认知缺口。" compact />
              )}
            </div>
          </Surface>

          <Surface className="p-5">
            <SectionHeading
              icon={NotebookPen}
              title="复习提问"
              description="把它当作每个月对认知地图的一次例行盘点。"
            />
            <div className="mt-5 space-y-2">
              {socioeconomicsModule.reviewPrompts.length > 0 ? (
                socioeconomicsModule.reviewPrompts.map((prompt) => (
                  <div
                    key={prompt}
                    className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]"
                  >
                    {prompt}
                  </div>
                ))
              ) : (
                <EmptyState message="当前筛选下没有复习提问。" compact />
              )}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  )
}

function ClassificationPanel({
  title,
  description,
  rows,
  total,
}: {
  title: string
  description: string
  rows: DistributionRow[]
  total: number
}) {
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
                    {row.label}
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
          <div className="text-xs leading-5 text-[color:var(--text-muted)]">暂无分布数据。</div>
        )}
      </div>
    </div>
  )
}

function Heatmap({ heatmap }: { heatmap: Map<EconDomain, Map<EconConfidence, number>> }) {
  const confidenceOrder: EconConfidence[] = [
    "听过名词",
    "知道大致逻辑",
    "能预判常见情境",
    "有自己的判断框架",
  ]

  return (
    <div className="min-w-[420px] space-y-1.5">
      <div className="grid grid-cols-[minmax(110px,1fr)_repeat(4,minmax(58px,1fr))] gap-1.5 text-[11px] text-[color:var(--text-muted)]">
        <div />
        {confidenceOrder.map((conf) => (
          <div key={conf} className="px-1 text-center leading-tight">
            {conf}
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
              {domain}
            </div>
            {confidenceOrder.map((conf) => {
              const value = row?.get(conf) ?? 0
              const intensity =
                value === 0 ? 0 : Math.min(0.85, 0.25 + (confidenceOrder.indexOf(conf) + 1) * 0.15)
              return (
                <div
                  key={conf}
                  className="flex h-9 items-center justify-center rounded-md border border-[color:var(--chip-border)] text-xs font-medium"
                  style={{
                    backgroundColor:
                      value === 0
                        ? "var(--muted-surface-bg)"
                        : `color-mix(in srgb, var(--text-primary) ${Math.round(intensity * 60)}%, var(--surface-bg))`,
                    color:
                      value === 0
                        ? "var(--text-muted)"
                        : intensity > 0.55
                          ? "var(--surface-bg)"
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
}: {
  entry: SocioeconomicsEntry
  compact?: boolean
}) {
  return (
    <article
      className={cn(
        "rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4",
        compact && "px-3 py-3",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]">
          {entry.domain}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {entry.layer}
        </Badge>
        <ConfidenceBadge confidence={entry.confidence} />
        <RelevanceBadge relevance={entry.relevance} />
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
          <span className="font-medium text-[color:var(--text-primary)]">理解度：</span>
          {entry.understandingNote}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2 min-[640px]:grid-cols-2">
        <SocioeconomicsMeta label="来源" value={entry.source} />
        <SocioeconomicsMeta label="决策距离" value={entry.relevance} accent />
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
              <span className="font-medium text-[color:var(--text-primary)]">{history.date}</span>：
              {history.from} → {history.to}
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
          accent && "text-[color:var(--tone-value-ink)]",
        )}
      >
        {value}
      </div>
    </div>
  )
}

function ConfidenceBadge({ confidence }: { confidence: EconConfidence }) {
  const style =
    confidence === "有自己的判断框架"
      ? "bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]"
      : confidence === "能预判常见情境"
        ? "bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]"
        : confidence === "知道大致逻辑"
          ? "bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
          : "bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]"

  return <Badge className={style}>{confidence}</Badge>
}

function RelevanceBadge({ relevance }: { relevance: EconRelevance }) {
  return (
    <Badge
      variant="outline"
      className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
    >
      {relevance}
    </Badge>
  )
}

function GapCard({ gap, compact = false }: { gap: SocioeconomicsGap; compact?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3",
        compact && "px-3 py-2.5",
      )}
    >
      <div className="flex items-start gap-3">
        <Globe2 className="mt-1 size-4 shrink-0 text-[color:var(--text-muted)]" />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
            >
              {gap.domain}
            </Badge>
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
            <span className="font-medium text-[color:var(--text-primary)]">下一步：</span>
            {gap.nextStep}
          </p>
        </div>
      </div>
    </div>
  )
}

function ReviewSignalCard({ entry }: { entry: SocioeconomicsEntry }) {
  return (
    <div className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge className="bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]">
          {entry.domain}
        </Badge>
        <ConfidenceBadge confidence={entry.confidence} />
      </div>
      <div className="mt-2 text-sm font-medium text-[color:var(--text-primary)]">{entry.title}</div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">
        {entry.relevance} · {entry.summary}
      </p>
    </div>
  )
}
