import { Activity, MessageCircleMore, Users2, Waypoints } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type {
  InteractionFrequency,
  RelationshipDepth,
  RelationshipImpact,
  RelationshipMap,
  RelationshipPerson,
  RelationshipStage,
  RelationshipType,
  RelationshipUnsentNote,
  UnfinishedWeight,
} from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  SummarySurface,
  Surface,
} from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"

const RELATIONSHIP_TYPES = [
  "家人",
  "伴侣",
  "朋友",
  "同事",
  "过去重要的人",
  "导师/榜样",
] satisfies RelationshipType[]

const RELATIONSHIP_DEPTHS = ["亲密", "亲近", "熟人", "疏远", "断联"] satisfies RelationshipDepth[]

const RELATIONSHIP_STAGES = [
  "建立中",
  "稳定",
  "紧张",
  "修复中",
  "已结束",
  "等待中",
] satisfies RelationshipStage[]

const RELATIONSHIP_IMPACTS = ["滋养", "消耗", "中性", "混合"] satisfies RelationshipImpact[]

const INTERACTION_FREQUENCIES = [
  "每天",
  "每周",
  "每月",
  "每年",
  "几乎不",
  "已无联系",
] satisfies InteractionFrequency[]

const UNFINISHED_WEIGHTS = ["很重", "中等", "轻微", "无"] satisfies UnfinishedWeight[]

type DistributionRow = {
  label: string
  count: number
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

    if (!value) {
      return
    }

    counts.set(value, (counts.get(value) ?? 0) + 1)
  })

  return order.map((label) => ({
    label,
    count: counts.get(label) ?? 0,
  }))
}

function sortUnsentNotes(notes: RelationshipUnsentNote[]) {
  const order = new Map<UnfinishedWeight, number>([
    ["很重", 0],
    ["中等", 1],
    ["轻微", 2],
    ["无", 3],
  ])

  return [...notes].sort(
    (first, second) =>
      (order.get(first.unfinishedWeight ?? "无") ?? 3) -
      (order.get(second.unfinishedWeight ?? "无") ?? 3),
  )
}

export function RelationshipsPage({
  relationshipsModule,
  visibleRelationshipCount,
  searchQuery,
  isStackedLayout = false,
}: {
  relationshipsModule: RelationshipMap
  visibleRelationshipCount: number
  searchQuery: string
  isStackedLayout?: boolean
}) {
  const isFixedLayout = !isStackedLayout
  const relationships = getRelationships(relationshipsModule)
  const relationshipById = createRelationshipLookup(relationships)
  const nourishingCount = relationships.filter(
    (relationship) => relationship.impact === "滋养",
  ).length
  const drainingCount = relationships.filter(
    (relationship) => relationship.impact === "消耗",
  ).length
  const heavyUnfinishedCount = relationships.filter(
    (relationship) => relationship.unfinishedWeight === "很重",
  ).length
  const classificationSections = [
    {
      title: "类型",
      description: "这个人的纽带本质是什么。",
      rows: createDistribution(
        RELATIONSHIP_TYPES,
        relationships,
        (relationship) => relationship.type,
      ),
    },
    {
      title: "深度",
      description: "我在这段关系里有多敞开。",
      rows: createDistribution(
        RELATIONSHIP_DEPTHS,
        relationships,
        (relationship) => relationship.depth,
      ),
    },
    {
      title: "阶段",
      description: "这段关系现在在往哪里走。",
      rows: createDistribution(
        RELATIONSHIP_STAGES,
        relationships,
        (relationship) => relationship.stage,
      ),
    },
    {
      title: "影响",
      description: "它滋养、消耗，还是混合。",
      rows: createDistribution(
        RELATIONSHIP_IMPACTS,
        relationships,
        (relationship) => relationship.impact,
      ),
    },
    {
      title: "互动频率",
      description: "多久会联系一次。",
      rows: createDistribution(
        INTERACTION_FREQUENCIES,
        relationships,
        (relationship) => relationship.interaction,
      ),
    },
  ]
  const unfinishedRows = createDistribution(
    UNFINISHED_WEIGHTS,
    relationships,
    (relationship) => relationship.unfinishedWeight,
  )
  const sortedUnsentNotes = sortUnsentNotes(relationshipsModule.unsentNotes)

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <PageIntro
        eyebrow="关系深化"
        title="把重要关系放进状态、影响和未完成里看"
        description="关系不是联系人列表，而是会变化、有重量、会塑造日常感受的生命材料。"
        searchQuery={searchQuery}
      />

      <div
        className={cn(
          "grid gap-4 min-[960px]:grid-cols-2 min-[1240px]:grid-cols-4",
          isFixedLayout && "shrink-0",
        )}
      >
        <SummarySurface
          tone="value"
          title="关系条目"
          value={`${visibleRelationshipCount} 人`}
          detail={`${relationshipsModule.circles.length} 个圈层里正在呈现不同关系状态。`}
        />
        <SummarySurface
          tone="present"
          title="滋养关系"
          value={`${nourishingCount} 段`}
          detail="不是谁热闹，而是谁让你更能做自己。"
        />
        <SummarySurface
          tone="past"
          title="消耗关系"
          value={`${drainingCount} 段`}
          detail="消耗不是定罪，只是提醒需要看见边界。"
        />
        <SummarySurface
          tone="future"
          title="未完成很重"
          value={`${heavyUnfinishedCount} 段`}
          detail={`${relationshipsModule.unsentNotes.length} 条想说的话正在等待被安放。`}
        />
      </div>

      <div className={cn("space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}>
        <Surface className="p-5">
          <SectionHeading
            icon={Waypoints}
            title="5 维关系分类"
            description="这些维度负责分组和观察关系世界；unfinished_weight 留在详情和想说的话里。"
          />

          <div className="mt-5 grid gap-3 min-[960px]:grid-cols-2 min-[1240px]:grid-cols-5">
            {classificationSections.map((section) => (
              <ClassificationPanel
                key={section.title}
                title={section.title}
                description={section.description}
                rows={section.rows}
                total={relationships.length}
              />
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4">
            <div className="text-sm font-medium text-[color:var(--text-primary)]">
              unfinished_weight 标注
            </div>
            <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
              未完成重量是单段关系的评估属性，用来判断还有多少没说完的话，不进入主筛选器。
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
                    {row.label} · {row.count}
                  </Badge>
                ))}
            </div>
          </div>
        </Surface>

        <div className="grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]">
          <Surface className="p-5">
            <SectionHeading
              icon={Users2}
              title="关系档案"
              description="每段关系都带着状态、影响、互动事件、边界和未完成重量。"
            />

            <div className="mt-5 space-y-4">
              {relationshipsModule.circles.some((circle) => circle.entries.length > 0) ? (
                relationshipsModule.circles.map((circle) => (
                  <RelationshipCircleSection
                    key={circle.id}
                    circleTitle={circle.title}
                    entries={circle.entries}
                  />
                ))
              ) : (
                <EmptyState message="当前筛选下还没有可展示的关系条目。" compact />
              )}
            </div>
          </Surface>

          <div className="space-y-4">
            <Surface className="p-5">
              <SectionHeading
                icon={MessageCircleMore}
                title="想说的话"
                description="它支持写给现有关系、独立对象，也支持写给未来的自己。"
              />

              <div className="mt-5 space-y-3">
                {sortedUnsentNotes.length > 0 ? (
                  sortedUnsentNotes.map((note) => (
                    <UnsentNoteCard key={note.id} note={note} relationshipById={relationshipById} />
                  ))
                ) : (
                  <EmptyState message="当前筛选下没有未发送表达。" compact />
                )}
              </div>
            </Surface>

            <Surface className="p-5">
              <SectionHeading
                icon={Activity}
                title="跨关系模式"
                description="从单段关系跳出来，看自己在关系里反复扮演什么角色。"
              />

              <div className="mt-5 space-y-3">
                {relationshipsModule.patterns.length > 0 ? (
                  relationshipsModule.patterns.map((pattern) => (
                    <div
                      key={pattern.id}
                      className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                    >
                      <div className="text-sm font-medium text-[color:var(--text-primary)]">
                        {pattern.title}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                        {pattern.summary}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {pattern.cues.map((cue) => (
                          <Badge
                            key={cue}
                            variant="outline"
                            className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
                          >
                            {cue}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState message="当前筛选下没有可展示的关系模式。" compact />
                )}
              </div>
            </Surface>
          </div>
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

function RelationshipCircleSection({
  circleTitle,
  entries,
}: {
  circleTitle: string
  entries: RelationshipPerson[]
}) {
  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-base font-medium text-[color:var(--text-primary)]">{circleTitle}</h3>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
        >
          {entries.length} 人
        </Badge>
      </div>

      <div className="mt-4 space-y-3">
        {entries.length > 0 ? (
          entries.map((relationship) => (
            <RelationshipCard key={relationship.id} relationship={relationship} />
          ))
        ) : (
          <EmptyState message="当前筛选下这个圈层没有可展示的人物。" compact />
        )}
      </div>
    </div>
  )
}

function RelationshipCard({ relationship }: { relationship: RelationshipPerson }) {
  return (
    <article className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]">
          {relationship.type}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {relationship.depth}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {relationship.stage}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {relationship.impact}
        </Badge>
      </div>

      <div className="mt-3 flex flex-wrap items-baseline gap-2">
        <h4 className="text-base font-medium text-[color:var(--text-primary)]">
          {relationship.name}
        </h4>
        <span className="text-xs text-[color:var(--text-muted)]">{relationship.role}</span>
      </div>

      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
        {relationship.influence}
      </p>

      <div className="mt-4 grid gap-2 min-[640px]:grid-cols-2">
        <RelationshipMeta label="互动频率" value={relationship.interaction} />
        <RelationshipMeta
          label="unfinished_weight"
          value={relationship.unfinishedWeight ?? "无"}
          accent
        />
        <RelationshipMeta label="正面影响" value={relationship.positiveImpact} />
        <RelationshipMeta label="持续阴影" value={relationship.ongoingShadow} />
      </div>

      <div className="mt-3 rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-3 py-3 text-sm leading-6 text-[color:var(--text-secondary)]">
        <div>
          <span className="font-medium text-[color:var(--text-primary)]">当前：</span>
          {relationship.currentState}
        </div>
        <div className="mt-1">
          <span className="font-medium text-[color:var(--text-primary)]">边界：</span>
          {relationship.boundaryStatus}
        </div>
        <div className="mt-1">
          <span className="font-medium text-[color:var(--text-primary)]">没说出口：</span>
          {relationship.unspokenLine}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {relationship.emotionCues.map((cue) => (
          <Badge
            key={cue}
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
          >
            {cue}
          </Badge>
        ))}
      </div>

      {relationship.events.length > 0 ? (
        <div className="mt-4 space-y-2">
          {relationship.events.map((event) => (
            <div
              key={event.id}
              className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-3 py-2 text-xs leading-5 text-[color:var(--text-muted)]"
            >
              <span className="font-medium text-[color:var(--text-primary)]">
                {event.date} · {event.kind}
              </span>
              ：{event.title}。{event.summary}
            </div>
          ))}
        </div>
      ) : null}

      {relationship.history.length > 0 ? (
        <div className="mt-3 space-y-2">
          {relationship.history.map((history) => (
            <div
              key={history.id}
              className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-2 text-xs leading-5 text-[color:var(--text-muted)]"
            >
              <span className="font-medium text-[color:var(--text-primary)]">{history.date}</span>：
              {history.field} 从 {history.from} 变为 {history.to}。{history.note}
            </div>
          ))}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {relationship.tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
          >
            {tag}
          </Badge>
        ))}
      </div>
    </article>
  )
}

function RelationshipMeta({
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

function UnsentNoteCard({
  note,
  relationshipById,
}: {
  note: RelationshipUnsentNote
  relationshipById: Map<string, RelationshipPerson>
}) {
  const relationship = note.relationshipId ? relationshipById.get(note.relationshipId) : null

  return (
    <article className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
        >
          {note.targetType}
        </Badge>
        <Badge className="bg-[color:var(--tone-past-bg)] text-[color:var(--tone-past-ink)]">
          {note.unfinishedWeight ?? "无"}
        </Badge>
      </div>
      <div className="mt-3 text-sm font-medium text-[color:var(--text-primary)]">
        {note.to} · {note.theme}
      </div>
      {relationship ? (
        <div className="mt-1 text-xs text-[color:var(--text-muted)]">
          关联关系：{relationship.name}
        </div>
      ) : null}
      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{note.excerpt}</p>
    </article>
  )
}
