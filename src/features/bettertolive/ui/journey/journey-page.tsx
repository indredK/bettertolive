import { BookHeart, Camera, CheckCheck, Route, Shield, Sprout, Waypoints } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  EmotionalWeight,
  FormativePower,
  GrowthNode,
  MemoryAnchor,
  MemoryEntry,
  MemoryType,
  PrivacyLevel,
  ProcessingStatus,
} from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  Surface,
} from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"

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

type DistributionRow = {
  label: string
  count: number
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

function getLinkedMemories(memoryIds: string[], memoryById: Map<string, MemoryEntry>) {
  return memoryIds
    .map((memoryId) => memoryById.get(memoryId))
    .filter((memory): memory is MemoryEntry => memory !== undefined)
}

export function JourneyPage({
  journey,
  searchQuery,
  isStackedLayout = false,
}: {
  journey: JourneyViewData
  searchQuery: string
  isStackedLayout?: boolean
}) {
  const isFixedLayout = !isStackedLayout
  const memoryById = createMemoryLookup(journey.memories)
  const classificationSections = [
    {
      title: "内容类型",
      description: "先看这段记忆以什么形式被记住。",
      rows: createDistribution(MEMORY_TYPES, journey.memories, (memory) => memory.type),
    },
    {
      title: "人生时期",
      description: "时期允许多选，主时期只用于时间线标注。",
      rows: createEraDistribution(journey.memories),
    },
    {
      title: "情感重量",
      description: "它现在碰起来轻不轻。",
      rows: createDistribution(
        EMOTIONAL_WEIGHT_ORDER,
        journey.memories,
        (memory) => memory.emotionalWeight,
      ),
    },
    {
      title: "整理状态",
      description: "不是所有过去都需要被整理完。",
      rows: createDistribution(
        PROCESSING_STATUS_ORDER,
        journey.memories,
        (memory) => memory.processing,
      ),
    },
    {
      title: "隐私级别",
      description: "敏感记忆先有清晰边界。",
      rows: createDistribution(PRIVACY_LEVEL_ORDER, journey.memories, (memory) => memory.privacy),
    },
  ]
  const formativePowerRows = FORMATIVE_POWER_ORDER.map((label) => ({
    label,
    count: journey.memories.filter((memory) => memory.formativePower === label).length,
  })).filter((row) => row.count > 0)

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <PageIntro
        eyebrow="成长记忆"
        title="把记忆分类，再看见成长发生在哪里"
        description="每条记忆用 5 个分类标签安放，用塑造力标出它如何影响今天的你。成长节点不是单条记忆，而是一组记忆显现出的变化模式。"
        searchQuery={searchQuery}
      />

      {isFixedLayout ? (
        <JourneyFixedDashboard
          classificationSections={classificationSections}
          formativePowerRows={formativePowerRows}
          journey={journey}
          memoryById={memoryById}
        />
      ) : null}

      {!isFixedLayout ? (
        <div className="space-y-4">
          <Surface className="p-5">
            <SectionHeading
              icon={Waypoints}
              title="5 维分类概览"
              description="这些维度负责组织和过滤人生档案；塑造力留在时间线和条目详情里。"
            />

            <div className="mt-5 grid gap-3 min-[960px]:grid-cols-2 min-[1240px]:grid-cols-5">
              {classificationSections.map((section) => (
                <ClassificationPanel
                  key={section.title}
                  title={section.title}
                  description={section.description}
                  rows={section.rows}
                  total={journey.memories.length}
                />
              ))}
            </div>

            {journey.eraSuggestions.length > 0 || formativePowerRows.length > 0 ? (
              <div className="mt-4 grid gap-3 min-[960px]:grid-cols-2">
                {journey.eraSuggestions.length > 0 ? (
                  <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4">
                    <div className="text-sm font-medium text-[color:var(--text-primary)]">
                      默认时期提示
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {journey.eraSuggestions.map((era) => (
                        <Badge
                          key={era}
                          variant="outline"
                          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
                        >
                          {era}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}

                {formativePowerRows.length > 0 ? (
                  <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4">
                    <div className="text-sm font-medium text-[color:var(--text-primary)]">
                      塑造力标注
                    </div>
                    <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
                      跟随单条记忆显示，用来解释影响深度，不作为主筛选维度。
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {formativePowerRows.map((row) => (
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
                ) : null}
              </div>
            ) : null}
          </Surface>

          <div className="grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]">
            <Surface className="p-5">
              <SectionHeading
                icon={Route}
                title="记忆时间线"
                description="时间线按主时期排列，条目里始终显示塑造力，便于看清哪些经历真正改变了你。"
              />

              <div className="mt-5 space-y-3">
                {journey.memories.length > 0 ? (
                  journey.memories.map((memory) => <MemoryCard key={memory.id} memory={memory} />)
                ) : (
                  <EmptyState message="当前筛选下还没有可展示的记忆。" compact />
                )}
              </div>
            </Surface>

            <Surface className="p-5">
              <SectionHeading
                icon={Sprout}
                title="成长节点"
                description="当多条记忆指向同一个变化方向，它们就组成一个成长节点。"
              />

              <div className="mt-5 space-y-4">
                {journey.growthNodes.length > 0 ? (
                  journey.growthNodes.map((node) => (
                    <GrowthNodeCard key={node.id} memoryById={memoryById} node={node} />
                  ))
                ) : (
                  <EmptyState message="当前筛选下还没有可展示的成长节点。" compact />
                )}
              </div>
            </Surface>
          </div>

          <div className="grid gap-4 min-[960px]:grid-cols-2">
            <Surface className="p-5">
              <SectionHeading
                icon={Camera}
                title="感官锚点"
                description="很多记忆不是从事件开始，而是被一个地点、一件物品或一张照片唤起来。"
              />

              <div className="mt-5 space-y-3">
                {journey.anchors.length > 0 ? (
                  journey.anchors.map((anchor) => (
                    <AnchorRow key={anchor.id} anchor={anchor} memoryById={memoryById} />
                  ))
                ) : (
                  <EmptyState message="当前筛选下还没有记忆锚点。" compact />
                )}
              </div>
            </Surface>

            <Surface className="p-5">
              <SectionHeading
                icon={BookHeart}
                title="回看问题"
                description="这些问题帮助你看见过去如何继续影响现在，而不是逼自己一次讲完。"
              />

              <div className="mt-5 space-y-3">
                {journey.reviewPrompts.length > 0 ? (
                  journey.reviewPrompts.map((prompt) => (
                    <div
                      key={prompt}
                      className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]"
                    >
                      {prompt}
                    </div>
                  ))
                ) : (
                  <EmptyState message="当前筛选下没有回看问题。" compact />
                )}
              </div>
            </Surface>
          </div>

          <Surface className="p-5">
            <SectionHeading
              icon={CheckCheck}
              title="当前还在生效的影响"
              description="这些线索从成长节点里浮出来，适合和观念、原则、关系页面交叉回看。"
            />

            <div className="mt-5 grid gap-3 min-[960px]:grid-cols-2">
              {journey.threads.length > 0 ? (
                journey.threads.map((thread) => (
                  <div
                    key={thread}
                    className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]"
                  >
                    {thread}
                  </div>
                ))
              ) : (
                <EmptyState message="当前筛选下没有可展示的影响线索。" compact />
              )}
            </div>
          </Surface>
        </div>
      ) : null}
    </div>
  )
}

function JourneyFixedDashboard({
  classificationSections,
  formativePowerRows,
  journey,
  memoryById,
}: {
  classificationSections: Array<{
    title: string
    description: string
    rows: DistributionRow[]
  }>
  formativePowerRows: DistributionRow[]
  journey: JourneyViewData
  memoryById: Map<string, MemoryEntry>
}) {
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
                title={section.title}
                rows={section.rows}
              />
            ))}
          </div>

          <div className="grid gap-2 min-[1240px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
            <CompactBadgeBlock title="塑造力标注" rows={formativePowerRows} />
            <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-3 py-3">
              <div className="text-xs font-medium text-[color:var(--text-primary)]">
                默认时期提示
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {journey.eraSuggestions.slice(0, 5).map((era) => (
                  <Badge
                    key={era}
                    variant="outline"
                    className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
                  >
                    {era}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {featuredMemories.length > 0 ? (
            featuredMemories.map((memory) => <CompactMemoryCard key={memory.id} memory={memory} />)
          ) : (
            <EmptyState message="当前筛选下还没有可展示的记忆。" compact />
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
            <TabsTrigger value="timeline">记忆时间线</TabsTrigger>
            <TabsTrigger value="growth">成长节点</TabsTrigger>
            <TabsTrigger value="signals">锚点与影响</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {journey.memories.length > 0 ? (
                journey.memories.map((memory) => (
                  <CompactMemoryCard key={memory.id} memory={memory} />
                ))
              ) : (
                <EmptyState message="当前筛选下还没有可展示的记忆。" compact />
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
                <EmptyState message="当前筛选下还没有可展示的成长节点。" compact />
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
                    title={`${anchor.type} · ${anchor.label}`}
                    detail={`${anchor.note} · ${linkedMemories.length} 条相关记忆`}
                  />
                )
              })}
              {journey.reviewPrompts.map((prompt) => (
                <CompactTextBlock key={prompt} title="回看问题" detail={prompt} />
              ))}
              {journey.threads.map((thread) => (
                <CompactTextBlock key={thread} title="仍在生效" detail={thread} />
              ))}
              {journey.anchors.length === 0 &&
              journey.reviewPrompts.length === 0 &&
              journey.threads.length === 0 ? (
                <EmptyState message="当前筛选下没有辅助线索。" compact />
              ) : null}
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
                title={`${anchor.type} · ${anchor.label}`}
                detail={`${anchor.note} · ${linkedMemories.length} 条相关记忆`}
              />
            )
          })}
          <div className="space-y-2 border-t border-[color:var(--muted-surface-border)] pt-3">
            {featuredPrompts.map((prompt) => (
              <CompactTextBlock key={prompt} title="回看问题" detail={prompt} />
            ))}
            {featuredThreads.map((thread) => (
              <CompactTextBlock key={thread} title="仍在生效" detail={thread} />
            ))}
          </div>
          {remainingMemoryCount > 0 ? (
            <RemainingLine label={`还有 ${remainingMemoryCount} 条记忆未展开`} />
          ) : null}
          {remainingGrowthCount > 0 ? (
            <RemainingLine label={`还有 ${remainingGrowthCount} 个成长节点未展开`} />
          ) : null}
        </div>
      </Surface>
    </div>
  )
}

function CompactDistributionPanel({ title, rows }: { title: string; rows: DistributionRow[] }) {
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
              {row.label} · {row.count}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-[color:var(--text-muted)]">暂无</span>
        )}
      </div>
    </div>
  )
}

function CompactBadgeBlock({ title, rows }: { title: string; rows: DistributionRow[] }) {
  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-3 py-3">
      <div className="text-xs font-medium text-[color:var(--text-primary)]">{title}</div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {rows.length > 0 ? (
          rows.map((row) => (
            <Badge
              key={row.label}
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
            >
              {row.label} · {row.count}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-[color:var(--text-muted)]">暂无</span>
        )}
      </div>
    </div>
  )
}

function CompactMemoryCard({ memory }: { memory: MemoryEntry }) {
  return (
    <article className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
        >
          {memory.type}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {memory.primaryEra}
        </Badge>
        <Badge className="bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]">
          塑造力 · {memory.formativePower ?? "未评估"}
        </Badge>
      </div>
      <div className="mt-2 truncate text-sm font-medium text-[color:var(--text-primary)]">
        {memory.title}
      </div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">{memory.summary}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {memory.emotionalWeight}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {memory.processing}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {memory.privacy}
        </Badge>
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
  const triggerMemory = memoryById.get(node.triggerMemoryId)

  return (
    <article className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge className="bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]">
          {node.domain}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {node.stability}
        </Badge>
      </div>
      <div className="mt-2 truncate text-sm font-medium text-[color:var(--text-primary)]">
        {node.title}
      </div>
      <div className="mt-1 grid gap-2 text-xs leading-5 text-[color:var(--text-secondary)]">
        <div>前：{node.before}</div>
        <div>后：{node.after}</div>
      </div>
      {triggerMemory ? (
        <div className="mt-2 rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-2.5 py-1 text-xs text-[color:var(--text-muted)]">
          触发：{triggerMemory.title}
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

function MemoryCard({ memory }: { memory: MemoryEntry }) {
  const formativePower = memory.formativePower ?? "未评估"
  const needsSecondLook = memory.privacy === "需二次确认"

  return (
    <article className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
        >
          {memory.type}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {memory.primaryEra}
        </Badge>
        {needsSecondLook ? (
          <Badge className="bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]">
            需确认
          </Badge>
        ) : null}
      </div>

      <h3 className="mt-3 text-base font-medium text-[color:var(--text-primary)]">
        {memory.title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{memory.summary}</p>
      <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
        留下来的影响：{memory.impact}
      </p>

      <div className="mt-4 grid gap-2 min-[640px]:grid-cols-2">
        <MemoryMeta label="情感重量" value={memory.emotionalWeight} />
        <MemoryMeta label="整理状态" value={memory.processing} />
        <MemoryMeta label="隐私级别" value={memory.privacy} />
        <MemoryMeta label="塑造力" value={formativePower} accent />
      </div>

      {memory.sensoryCue ? (
        <div className="mt-3 rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 py-2 text-xs leading-5 text-[color:var(--text-muted)]">
          感官线索：{memory.sensoryCue}
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
            来源：{source}
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
  const beforeMemories = getLinkedMemories(node.beforeMemoryIds, memoryById)
  const afterMemories = getLinkedMemories(node.afterMemoryIds, memoryById)
  const triggerMemory = memoryById.get(node.triggerMemoryId)

  return (
    <article className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]">
          {node.domain}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {node.stability}
        </Badge>
      </div>
      <h3 className="mt-3 text-base font-medium text-[color:var(--text-primary)]">{node.title}</h3>

      <div className="mt-4 grid gap-3 min-[640px]:grid-cols-2">
        <GrowthState label="变化前" value={node.before} />
        <GrowthState label="变化后" value={node.after} />
      </div>

      <div className="mt-3 rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 py-3 text-sm leading-6 text-[color:var(--text-secondary)]">
        关键转折：{node.keyEvent}
      </div>

      <div className="mt-3 space-y-2">
        <MemoryLinkGroup title="变化前记忆" memories={beforeMemories} />
        <MemoryLinkGroup title="变化后记忆" memories={afterMemories} />
        {triggerMemory ? <MemoryLinkGroup title="触发记忆" memories={[triggerMemory]} /> : null}
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
              {anchor.type}
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
