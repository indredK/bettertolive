import { Brain, Lightbulb, Link2, MessagesSquare, Sparkles, Waypoints } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  BeliefDomain,
  BeliefEntry,
  BeliefImpact,
  BeliefLayer,
  BeliefRelation,
  BeliefSource,
  BeliefStability,
  BeliefsModuleData,
} from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  Surface,
} from "@/features/bettertolive/ui/shared/shared"
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

type DistributionRow = {
  label: string
  count: number
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
  searchQuery,
  isStackedLayout = false,
}: {
  beliefsModule: BeliefsModuleData
  searchQuery: string
  isStackedLayout?: boolean
}) {
  const isFixedLayout = !isStackedLayout
  const entries = beliefsModule.entries
  const beliefById = createBeliefLookup(entries)
  const classificationSections = [
    {
      title: "领域",
      description: "它主要作用于哪个生活面。",
      rows: createDistribution(BELIEF_DOMAINS, entries, (entry) => entry.domain),
    },
    {
      title: "层次",
      description: "它在认知的哪一层。",
      rows: createDistribution(BELIEF_LAYERS, entries, (entry) => entry.layer),
    },
    {
      title: "稳定性",
      description: "它现在是否还在变化。",
      rows: createDistribution(BELIEF_STABILITIES, entries, (entry) => entry.stability),
    },
    {
      title: "来源",
      description: "它从哪里长出来。",
      rows: createDistribution(BELIEF_SOURCES, entries, (entry) => entry.source),
    },
  ]
  const impactRows = createDistribution(BELIEF_IMPACTS, entries, (entry) => entry.impact)
  const conflictingBeliefs = entries.filter((entry) => entry.impact === "冲突中")
  const looseningBeliefs = entries.filter(
    (entry) => entry.stability === "正在松动" || entry.stability === "正在形成",
  )

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <PageIntro
        eyebrow="观念"
        title="把你怎么看世界和人生说清楚"
        description="不是口号区，而是按 4 维分类、看 impact 影响方向，再加心理学视角作为可选解读层。"
        searchQuery={searchQuery}
      />

      {isFixedLayout ? (
        <BeliefsFixedDashboard
          classificationSections={classificationSections}
          impactRows={impactRows}
          conflictingBeliefs={conflictingBeliefs}
          looseningBeliefs={looseningBeliefs}
          beliefById={beliefById}
          entries={entries}
          beliefsModule={beliefsModule}
        />
      ) : (
        <BeliefsStackedView
          classificationSections={classificationSections}
          impactRows={impactRows}
          beliefById={beliefById}
          entries={entries}
          beliefsModule={beliefsModule}
        />
      )}
    </div>
  )
}

function BeliefsFixedDashboard({
  classificationSections,
  impactRows,
  conflictingBeliefs,
  looseningBeliefs,
  beliefById,
  entries,
  beliefsModule,
}: {
  classificationSections: Array<{ title: string; description: string; rows: DistributionRow[] }>
  impactRows: DistributionRow[]
  conflictingBeliefs: BeliefEntry[]
  looseningBeliefs: BeliefEntry[]
  beliefById: Map<string, BeliefEntry>
  entries: BeliefEntry[]
  beliefsModule: BeliefsModuleData
}) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_minmax(320px,0.86fr)] grid-rows-[minmax(0,0.94fr)_minmax(0,1fr)] gap-3 overflow-hidden">
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
              影响方向 (impact)
            </div>
            <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
              影响方向不是第 5 维分类，而是每条观念的内禀属性 —— 看它在帮我，还是在限制我。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {impactRows
                .filter((row) => row.count > 0)
                .map((row) => (
                  <Badge
                    key={row.label}
                    variant="outline"
                    className={cn(
                      "border-[color:var(--chip-border)]",
                      row.label === "支撑性"
                        ? "bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]"
                        : row.label === "限制性"
                          ? "bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]"
                          : row.label === "冲突中"
                            ? "bg-[color:var(--tone-past-bg)] text-[color:var(--tone-past-ink)]"
                            : "bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]",
                    )}
                  >
                    {row.label} · {row.count}
                  </Badge>
                ))}
            </div>
          </div>

          <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-xs leading-5 text-[color:var(--text-muted)]">
            <span className="font-medium text-[color:var(--text-primary)]">依恋观察：</span>
            {beliefsModule.attachmentReflection}
          </div>
        </div>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <SectionHeading
          icon={MessagesSquare}
          title="反复出现的问题"
          description="把会反复追问自己的问题先收进来。"
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
            <EmptyState message="当前筛选下没有可展示的问题。" compact />
          )}
        </div>
      </Surface>

      <Surface className="col-span-2 flex min-h-0 flex-col overflow-hidden p-4">
        <Tabs defaultValue="entries" className="min-h-0 flex-1">
          <TabsList className="w-full justify-start gap-1 rounded-lg bg-[color:var(--chip-bg)] p-1">
            <TabsTrigger value="entries">观念清单</TabsTrigger>
            <TabsTrigger value="cards">三层骨架</TabsTrigger>
            <TabsTrigger value="relations">相互关系</TabsTrigger>
          </TabsList>

          <TabsContent value="entries" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-3">
              {entries.length > 0 ? (
                entries.map((entry) => <BeliefCard key={entry.id} entry={entry} compact />)
              ) : (
                <EmptyState message="当前筛选下没有可展示的观念条目。" compact />
              )}
            </div>
          </TabsContent>

          <TabsContent value="cards" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
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
                        {card.label}
                      </Badge>
                      <div className="text-[11px] text-[color:var(--text-muted)]">
                        {card.keywords.join(" / ")}
                      </div>
                    </div>
                    <h3 className="mt-2 text-sm font-medium text-[color:var(--text-primary)]">
                      {card.summary}
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
                      {card.note}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState message="当前筛选下没有三层骨架。" compact />
              )}
            </div>
          </TabsContent>

          <TabsContent value="relations" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {beliefsModule.relations.length > 0 ? (
                beliefsModule.relations.map((relation) => (
                  <BeliefRelationCard
                    key={relation.id}
                    relation={relation}
                    beliefById={beliefById}
                    compact
                  />
                ))
              ) : (
                <EmptyState message="当前筛选下没有观念关系。" compact />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <div className="space-y-2">
            <div className="text-xs font-medium tracking-wide text-[color:var(--text-primary)]">
              正在张力中
            </div>
            {conflictingBeliefs.length > 0 ? (
              conflictingBeliefs.map((entry) => <BeliefSignalCard key={entry.id} entry={entry} />)
            ) : (
              <EmptyState message="当前筛选下没有冲突中的观念。" compact />
            )}
          </div>

          <div className="space-y-2 border-t border-[color:var(--muted-surface-border)] pt-3">
            <div className="text-xs font-medium tracking-wide text-[color:var(--text-primary)]">
              正在变化
            </div>
            {looseningBeliefs.length > 0 ? (
              looseningBeliefs
                .slice(0, 4)
                .map((entry) => <BeliefSignalCard key={entry.id} entry={entry} subtle />)
            ) : (
              <EmptyState message="当前筛选下没有正在变化的观念。" compact />
            )}
          </div>
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
  beliefsModule,
}: {
  classificationSections: Array<{ title: string; description: string; rows: DistributionRow[] }>
  impactRows: DistributionRow[]
  beliefById: Map<string, BeliefEntry>
  entries: BeliefEntry[]
  beliefsModule: BeliefsModuleData
}) {
  return (
    <div className="space-y-4">
      <Surface className="p-5">
        <SectionHeading
          icon={Waypoints}
          title="4 维观念分类"
          description="按 4 维分组、过滤、看认知地图；impact 跟着每条走，不进主筛选器。"
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
          <div className="text-sm font-medium text-[color:var(--text-primary)]">影响方向</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {impactRows
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

      <div className="grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
        <Surface className="p-5">
          <SectionHeading
            icon={Lightbulb}
            title="观念清单"
            description="详情里始终显示 impact 与心理学解读折叠区。"
          />
          <div className="mt-5 space-y-4">
            {entries.length > 0 ? (
              entries.map((entry) => <BeliefCard key={entry.id} entry={entry} />)
            ) : (
              <EmptyState message="当前筛选下没有可展示的观念条目。" compact />
            )}
          </div>
        </Surface>

        <div className="space-y-4">
          <Surface className="p-5">
            <SectionHeading
              icon={MessagesSquare}
              title="反复出现的问题"
              description="先把会反复追问自己的问题收进来。"
            />
            <div className="mt-5 space-y-3">
              {beliefsModule.questions.length > 0 ? (
                beliefsModule.questions.map((q) => (
                  <div
                    key={q}
                    className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]"
                  >
                    {q}
                  </div>
                ))
              ) : (
                <EmptyState message="当前筛选下没有可展示的问题。" compact />
              )}
            </div>
          </Surface>

          <Surface className="p-5">
            <SectionHeading
              icon={Link2}
              title="相互关系"
              description="观念之间会互相支撑、互相对立、互相派生。"
            />
            <div className="mt-5 space-y-3">
              {beliefsModule.relations.length > 0 ? (
                beliefsModule.relations.map((relation) => (
                  <BeliefRelationCard
                    key={relation.id}
                    relation={relation}
                    beliefById={beliefById}
                  />
                ))
              ) : (
                <EmptyState message="当前筛选下没有观念关系。" compact />
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

function BeliefCard({ entry, compact = false }: { entry: BeliefEntry; compact?: boolean }) {
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
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
        >
          {entry.stability}
        </Badge>
        <ImpactBadge impact={entry.impact} />
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
        <BeliefMeta label="来源" value={entry.source} />
        <BeliefMeta label="影响方向" value={entry.impact} accent />
        {entry.secondaryDomains && entry.secondaryDomains.length > 0 ? (
          <BeliefMeta label="次要领域" value={entry.secondaryDomains.join(" / ")} />
        ) : null}
        {entry.cbtLayer ? <BeliefMeta label="CBT 层次" value={entry.cbtLayer} /> : null}
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
            心理学解读 (可选)
          </summary>
          <div className="mt-3 space-y-2 text-xs leading-5 text-[color:var(--text-secondary)]">
            {entry.cognitiveDistortions && entry.cognitiveDistortions.length > 0 ? (
              <div>
                <span className="font-medium text-[color:var(--text-primary)]">认知扭曲：</span>
                <span className="ml-1 inline-flex flex-wrap gap-1.5">
                  {entry.cognitiveDistortions.map((distortion) => (
                    <Badge
                      key={distortion}
                      variant="outline"
                      className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
                    >
                      {distortion}
                    </Badge>
                  ))}
                </span>
              </div>
            ) : null}
            {entry.defenseMechanism ? (
              <div>
                <span className="font-medium text-[color:var(--text-primary)]">防御机制：</span>
                <span className="ml-1 text-[color:var(--text-muted)]">
                  {entry.defenseMechanism}
                </span>
              </div>
            ) : null}
            {entry.attachmentNote ? (
              <div>
                <span className="font-medium text-[color:var(--text-primary)]">依恋观察：</span>
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
                ({revision.changedFields.join(" / ")})
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

function ImpactBadge({ impact }: { impact: BeliefImpact }) {
  const style =
    impact === "支撑性"
      ? "bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]"
      : impact === "限制性"
        ? "bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]"
        : impact === "冲突中"
          ? "bg-[color:var(--tone-past-bg)] text-[color:var(--tone-past-ink)]"
          : "bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"

  return <Badge className={style}>{impact}</Badge>
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
        <Badge className={typeStyle}>{relation.type}</Badge>
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
          {entry.domain}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {entry.stability}
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
