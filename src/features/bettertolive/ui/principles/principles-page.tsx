import { Activity, CheckCheck, Scale, Shield, Waypoints } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  PrincipleCost,
  PrincipleDomain,
  PrincipleEntry,
  PrincipleRelation,
  PrincipleSource,
  PrincipleStatus,
  PrincipleStrength,
  PrincipleType,
  PrinciplesModuleData,
} from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  Surface,
} from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"

const PRINCIPLE_DOMAINS = [
  "关系",
  "工作",
  "金钱",
  "健康",
  "时间",
  "诚信",
] satisfies PrincipleDomain[]

const PRINCIPLE_TYPES = ["边界", "标准", "底线"] satisfies PrincipleType[]

const PRINCIPLE_STRENGTHS = ["不可退让", "强烈偏好", "参考指引"] satisfies PrincipleStrength[]

const PRINCIPLE_SOURCES = [
  "受伤后确立",
  "观察他人",
  "主动推导",
  "家庭继承",
] satisfies PrincipleSource[]

const PRINCIPLE_STATUSES = ["生效中", "正在测试", "已修订", "已放弃"] satisfies PrincipleStatus[]

const PRINCIPLE_COSTS = ["高代价", "中等代价", "低代价", "零代价"] satisfies PrincipleCost[]

type DistributionRow = {
  label: string
  count: number
}

function createDistribution<T extends string>(
  order: readonly T[],
  principles: PrincipleEntry[],
  getValue: (principle: PrincipleEntry) => T,
) {
  const counts = new Map<T, number>()

  principles.forEach((principle) => {
    const value = getValue(principle)
    counts.set(value, (counts.get(value) ?? 0) + 1)
  })

  return order.map((label) => ({
    label,
    count: counts.get(label) ?? 0,
  }))
}

function createPrincipleLookup(principles: PrincipleEntry[]) {
  return new Map(principles.map((principle) => [principle.id, principle]))
}

export function PrinciplesPage({
  principlesModule,
  searchQuery,
  isStackedLayout = false,
}: {
  principlesModule: PrinciplesModuleData
  searchQuery: string
  isStackedLayout?: boolean
}) {
  const isFixedLayout = !isStackedLayout
  const principles = principlesModule.entries
  const principleById = createPrincipleLookup(principles)
  const classificationSections = [
    {
      title: "领域",
      description: "它最主要保护哪个生活面。",
      rows: createDistribution(PRINCIPLE_DOMAINS, principles, (principle) => principle.domain),
    },
    {
      title: "类型",
      description: "它是底线、边界，还是标准。",
      rows: createDistribution(PRINCIPLE_TYPES, principles, (principle) => principle.type),
    },
    {
      title: "强度",
      description: "它有多不可退让。",
      rows: createDistribution(PRINCIPLE_STRENGTHS, principles, (principle) => principle.strength),
    },
    {
      title: "来源",
      description: "它从哪里长出来。",
      rows: createDistribution(PRINCIPLE_SOURCES, principles, (principle) => principle.source),
    },
    {
      title: "状态",
      description: "它现在是否仍在生效。",
      rows: createDistribution(PRINCIPLE_STATUSES, principles, (principle) => principle.status),
    },
  ]
  const costRows = createDistribution(PRINCIPLE_COSTS, principles, (principle) => principle.cost)

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <PageIntro
        eyebrow="原则"
        title="把原则、边界和底线整理成决策体系"
        description="这页不只是列出原则，而是看清它保护什么、从哪来、稳不稳、守住它要付出什么。"
        searchQuery={searchQuery}
      />

      {isFixedLayout ? (
        <PrinciplesFixedDashboard
          classificationSections={classificationSections}
          costRows={costRows}
          principleById={principleById}
          principles={principles}
          principlesModule={principlesModule}
        />
      ) : (
        <div className="space-y-4">
          <Surface className="p-5">
            <SectionHeading
              icon={Waypoints}
              title="5 维原则分类"
              description="这些维度负责分组和观察决策体系；cost 留在详情和校准区里。"
            />

            <div className="mt-5 grid gap-3 min-[960px]:grid-cols-2 min-[1240px]:grid-cols-5">
              {classificationSections.map((section) => (
                <ClassificationPanel
                  key={section.title}
                  title={section.title}
                  description={section.description}
                  rows={section.rows}
                  total={principles.length}
                />
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4">
              <div className="text-sm font-medium text-[color:var(--text-primary)]">cost 标注</div>
              <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
                代价是单条原则的评估属性，用来判断守住它需要准备什么，不放进主筛选器。
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {costRows
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

          <div className="grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.14fr)_minmax(0,0.86fr)]">
            <Surface className="p-5">
              <SectionHeading
                icon={Scale}
                title="原则清单"
                description="详情里始终显示 cost，让每条原则的真实代价浮上来。"
              />

              <div className="mt-5 space-y-4">
                {principles.length > 0 ? (
                  principles.map((principle) => (
                    <PrincipleCard key={principle.id} principle={principle} />
                  ))
                ) : (
                  <EmptyState message="当前筛选下还没有可展示的原则条目。" compact />
                )}
              </div>
            </Surface>

            <div className="space-y-4">
              <Surface className="p-5">
                <SectionHeading
                  icon={Shield}
                  title="不想再退让的地方"
                  description="底线不是用来表演坚定，而是提前说明哪里真的不能再被突破。"
                />

                <div className="mt-5 space-y-3">
                  {principlesModule.boundaries.length > 0 ? (
                    principlesModule.boundaries.map((boundary) => (
                      <BoundaryCard key={boundary} boundary={boundary} />
                    ))
                  ) : (
                    <EmptyState message="当前筛选下没有可展示的底线。" compact />
                  )}
                </div>
              </Surface>

              <Surface className="p-5">
                <SectionHeading
                  icon={Activity}
                  title="决策校准"
                  description="面对具体选择时，先调出相关原则，再看强度和代价。"
                />

                <div className="mt-5 space-y-3">
                  {principlesModule.decisionPrompts.length > 0 ? (
                    principlesModule.decisionPrompts.map((prompt) => (
                      <DecisionPromptCard key={prompt} prompt={prompt} />
                    ))
                  ) : (
                    <EmptyState message="当前筛选下没有决策校准问题。" compact />
                  )}
                </div>
              </Surface>
            </div>
          </div>

          <Surface className="p-5">
            <SectionHeading
              icon={Waypoints}
              title="支撑与冲突"
              description="原则体系不是散点，很多原则会互相支撑，也可能在真实生活里互相拉扯。"
            />

            <div className="mt-5 grid gap-3 min-[960px]:grid-cols-2">
              {principlesModule.relations.length > 0 ? (
                principlesModule.relations.map((relation) => (
                  <RelationCard
                    key={relation.id}
                    principleById={principleById}
                    relation={relation}
                  />
                ))
              ) : (
                <EmptyState message="当前筛选下没有原则关系。" compact />
              )}
            </div>
          </Surface>
        </div>
      )}
    </div>
  )
}

function PrinciplesFixedDashboard({
  classificationSections,
  costRows,
  principleById,
  principles,
  principlesModule,
}: {
  classificationSections: Array<{
    title: string
    description: string
    rows: DistributionRow[]
  }>
  costRows: DistributionRow[]
  principleById: Map<string, PrincipleEntry>
  principles: PrincipleEntry[]
  principlesModule: PrinciplesModuleData
}) {
  const featuredHighPriorityPrinciples = [...principles]
    .sort((first, second) => {
      const firstScore = (first.strength === "不可退让" ? 2 : 0) + (first.cost === "高代价" ? 1 : 0)
      const secondScore =
        (second.strength === "不可退让" ? 2 : 0) + (second.cost === "高代价" ? 1 : 0)

      return secondScore - firstScore
    })
    .slice(0, 3)
  const evolvingPrinciples = principles.filter(
    (principle) => principle.status === "正在测试" || principle.status === "已修订",
  )

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,0.96fr)_minmax(0,1.08fr)_minmax(320px,0.88fr)] grid-rows-[minmax(0,0.9fr)_minmax(0,1fr)] gap-3 overflow-hidden">
      <Surface className="col-span-2 flex min-h-0 flex-col overflow-hidden p-4">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <div className="grid gap-2 min-[1240px]:grid-cols-5">
            {classificationSections.map((section) => (
              <ClassificationPanel
                key={section.title}
                title={section.title}
                description={section.description}
                rows={section.rows}
                total={principles.length}
              />
            ))}
          </div>

          <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4">
            <div className="text-sm font-medium text-[color:var(--text-primary)]">cost 标注</div>
            <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
              代价是单条原则的评估属性，用来判断守住它需要准备什么，不放进主筛选器。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {costRows
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
        </div>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {principlesModule.boundaries.length > 0 ? (
            principlesModule.boundaries.map((boundary) => (
              <BoundaryCard key={boundary} boundary={boundary} compact />
            ))
          ) : (
            <EmptyState message="当前筛选下没有可展示的底线。" compact />
          )}
        </div>
      </Surface>

      <Surface className="col-span-2 flex min-h-0 flex-col overflow-hidden p-4">
        <Tabs defaultValue="entries" className="min-h-0 flex-1">
          <TabsList className="w-full justify-start gap-1 rounded-lg bg-[color:var(--chip-bg)] p-1">
            <TabsTrigger value="entries">原则清单</TabsTrigger>
            <TabsTrigger value="prompts">决策校准</TabsTrigger>
            <TabsTrigger value="relations">支撑冲突</TabsTrigger>
          </TabsList>

          <TabsContent value="entries" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-3">
              {principles.length > 0 ? (
                principles.map((principle) => (
                  <PrincipleCard key={principle.id} principle={principle} compact />
                ))
              ) : (
                <EmptyState message="当前筛选下还没有可展示的原则条目。" compact />
              )}
            </div>
          </TabsContent>

          <TabsContent value="prompts" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {principlesModule.decisionPrompts.length > 0 ? (
                principlesModule.decisionPrompts.map((prompt) => (
                  <DecisionPromptCard key={prompt} prompt={prompt} compact />
                ))
              ) : (
                <EmptyState message="当前筛选下没有决策校准问题。" compact />
              )}
            </div>
          </TabsContent>

          <TabsContent value="relations" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {principlesModule.relations.length > 0 ? (
                principlesModule.relations.map((relation) => (
                  <RelationCard
                    key={relation.id}
                    principleById={principleById}
                    relation={relation}
                    compact
                  />
                ))
              ) : (
                <EmptyState message="当前筛选下没有原则关系。" compact />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <div className="space-y-2">
            {featuredHighPriorityPrinciples.length > 0 ? (
              featuredHighPriorityPrinciples.map((principle) => (
                <PrincipleSignalCard key={principle.id} principle={principle} />
              ))
            ) : (
              <EmptyState message="当前筛选下没有高优先级原则。" compact />
            )}
          </div>

          <div className="space-y-2 border-t border-[color:var(--muted-surface-border)] pt-3">
            {evolvingPrinciples.length > 0 ? (
              evolvingPrinciples
                .slice(0, 3)
                .map((principle) => (
                  <PrincipleSignalCard key={principle.id} principle={principle} subtle />
                ))
            ) : (
              <EmptyState message="当前筛选下没有正在变化的原则。" compact />
            )}
          </div>
        </div>
      </Surface>
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

function PrincipleCard({
  principle,
  compact = false,
}: {
  principle: PrincipleEntry
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
          {principle.domain}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {principle.type}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
        >
          {principle.strength}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
        >
          {principle.status}
        </Badge>
      </div>

      <h3
        className={cn(
          "mt-3 text-base font-medium text-[color:var(--text-primary)]",
          compact && "text-sm",
        )}
      >
        {principle.title}
      </h3>
      <p
        className={cn(
          "mt-2 text-sm leading-6 text-[color:var(--text-secondary)]",
          compact && "text-xs leading-5",
        )}
      >
        {principle.statement}
      </p>
      <p
        className={cn(
          "mt-2 text-sm leading-6 text-[color:var(--text-muted)]",
          compact && "text-xs leading-5",
        )}
      >
        {principle.description}
      </p>

      <div className="mt-4 grid gap-2 min-[640px]:grid-cols-2">
        <PrincipleMeta label="来源" value={principle.source} />
        <PrincipleMeta label="cost" value={principle.cost} accent />
        <PrincipleMeta label="保护对象" value={principle.protectedValue} />
        <PrincipleMeta label="触发校准" value={principle.decisionCue} />
      </div>

      <div className="mt-3 rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 py-3 text-sm leading-6 text-[color:var(--text-secondary)]">
        <span className="font-medium text-[color:var(--text-primary)]">边界：</span>
        {principle.boundary}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {principle.tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
          >
            {tag}
          </Badge>
        ))}
      </div>

      {principle.revisionHistory.length > 0 ? (
        <div className="mt-4 space-y-2">
          {principle.revisionHistory.map((revision) => (
            <div
              key={revision.id}
              className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-3 py-2 text-xs leading-5 text-[color:var(--text-muted)]"
            >
              <span className="font-medium text-[color:var(--text-primary)]">{revision.date}</span>
              ：{revision.summary}
            </div>
          ))}
        </div>
      ) : null}
    </article>
  )
}

function PrincipleMeta({
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

function RelationCard({
  relation,
  principleById,
  compact = false,
}: {
  relation: PrincipleRelation
  principleById: Map<string, PrincipleEntry>
  compact?: boolean
}) {
  const fromPrinciple = principleById.get(relation.fromId)
  const toPrinciple = principleById.get(relation.toId)

  return (
    <div
      className={cn(
        "rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4",
        compact && "px-3 py-3",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          className={cn(
            relation.type === "支撑"
              ? "bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]"
              : "bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]",
          )}
        >
          {relation.type}
        </Badge>
        <span className={cn("text-sm text-[color:var(--text-muted)]", compact && "text-xs")}>
          {fromPrinciple?.title ?? relation.fromId} → {toPrinciple?.title ?? relation.toId}
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

function BoundaryCard({ boundary, compact = false }: { boundary: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3",
        compact && "gap-2 px-3 py-2.5",
      )}
    >
      <CheckCheck className="mt-1 size-4 shrink-0 text-[color:var(--text-muted)]" />
      <p
        className={cn(
          "text-sm leading-6 text-[color:var(--text-secondary)]",
          compact && "text-xs leading-5",
        )}
      >
        {boundary}
      </p>
    </div>
  )
}

function DecisionPromptCard({ prompt, compact = false }: { prompt: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]",
        compact && "px-3 py-2 text-xs leading-5",
      )}
    >
      {prompt}
    </div>
  )
}

function PrincipleSignalCard({
  principle,
  subtle = false,
}: {
  principle: PrincipleEntry
  subtle?: boolean
}) {
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
          {principle.domain}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {principle.strength}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {principle.cost}
        </Badge>
      </div>
      <div className="mt-2 text-sm font-medium text-[color:var(--text-primary)]">
        {principle.title}
      </div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">
        {principle.decisionCue}
      </p>
    </div>
  )
}
