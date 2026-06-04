import { BookOpenText, CheckCheck, Lock, ScrollText, Shield, Waypoints } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  EmotionalLoad,
  LegacyCategory,
  LegacyItem,
  LegacyModuleData,
  LegacyRecipient,
  LegacyStatus,
  LegacyUrgency,
  LegacyVisibility,
} from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  Surface,
} from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"

const LEGACY_CATEGORIES = [
  "重要交代",
  "留给某人的话",
  "人生回顾",
  "未完成的事",
  "纪念偏好",
] satisfies LegacyCategory[]

const LEGACY_RECIPIENTS = ["特定的人", "家人", "朋友", "公开", "仅自己"] satisfies LegacyRecipient[]

const LEGACY_URGENCIES = ["关键信息", "重要", "锦上添花", "可选"] satisfies LegacyUrgency[]

const LEGACY_VISIBILITIES = [
  "现在",
  "某个时间后",
  "我离世后",
  "条件触发",
  "永不交付",
] satisfies LegacyVisibility[]

const LEGACY_STATUSES = [
  "草稿",
  "基本完成",
  "已完成",
  "会持续更新",
  "最终版",
] satisfies LegacyStatus[]

const EMOTIONAL_LOADS = ["很重", "中等", "轻微", "平静"] satisfies EmotionalLoad[]

type DistributionRow = {
  label: string
  count: number
}

function createDistribution<T extends string>(
  order: readonly T[],
  items: LegacyItem[],
  getValue: (item: LegacyItem) => T | undefined,
) {
  const counts = new Map<T, number>()

  items.forEach((item) => {
    const value = getValue(item)

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

export function LegacyPage({
  legacy,
  searchQuery,
  isStackedLayout = false,
}: {
  legacy: LegacyModuleData
  searchQuery: string
  isStackedLayout?: boolean
}) {
  const isFixedLayout = !isStackedLayout
  const items = legacy.items
  const delayedDeliveryCount = items.filter(
    (item) => item.visibility === "我离世后" || item.visibility === "条件触发",
  ).length
  const heavyLoadCount = items.filter((item) => item.emotionalLoad === "很重").length
  const lockedCount = items.filter((item) => item.isLocked || item.status === "最终版").length
  const classificationSections = [
    {
      title: "内容类别",
      description: "这份内容最主要想达成什么。",
      rows: createDistribution(LEGACY_CATEGORIES, items, (item) => item.category),
    },
    {
      title: "接收者",
      description: "写给谁，不等于什么时候交付。",
      rows: createDistribution(LEGACY_RECIPIENTS, items, (item) => item.recipient),
    },
    {
      title: "紧急度",
      description: "哪些信息需要优先被知道。",
      rows: createDistribution(LEGACY_URGENCIES, items, (item) => item.urgency),
    },
    {
      title: "可见时机",
      description: "现在、未来、离世后或条件触发。",
      rows: createDistribution(LEGACY_VISIBILITIES, items, (item) => item.visibility),
    },
    {
      title: "完成状态",
      description: "草稿、完成、持续更新或最终版。",
      rows: createDistribution(LEGACY_STATUSES, items, (item) => item.status),
    },
  ]
  const emotionalLoadRows = createDistribution(EMOTIONAL_LOADS, items, (item) => item.emotionalLoad)

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <PageIntro
        eyebrow="生命整理"
        title="把重要的话提前安放好"
        description="这页承接告别、托付、人生回顾和纪念偏好。它保持冷静和私密，不把沉重内容做成催促。"
        searchQuery={searchQuery}
      />

      {isFixedLayout ? (
        <LegacyFixedDashboard
          classificationSections={classificationSections}
          delayedDeliveryCount={delayedDeliveryCount}
          emotionalLoadRows={emotionalLoadRows}
          heavyLoadCount={heavyLoadCount}
          items={items}
          legacy={legacy}
          lockedCount={lockedCount}
        />
      ) : null}

      {!isFixedLayout ? (
        <div className="space-y-4">
          <Surface className="p-5">
            <SectionHeading
              icon={Waypoints}
              title="5 维生命整理分类"
              description="这些维度负责分组、过滤和看整理进度；emotional_load 只跟着单份内容走。"
            />

            <div className="mt-5 grid gap-3 min-[960px]:grid-cols-2 min-[1240px]:grid-cols-5">
              {classificationSections.map((section) => (
                <ClassificationPanel
                  key={section.title}
                  title={section.title}
                  description={section.description}
                  rows={section.rows}
                  total={items.length}
                />
              ))}
            </div>

            <div className="mt-4 grid gap-3 min-[960px]:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <AssessmentPanel
                title="emotional_load"
                description="评估写这一份需要多少心力，不进入主筛选器，也不做推送催促。"
                rows={emotionalLoadRows}
              />
              <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
                <div className="text-sm font-medium text-[color:var(--text-primary)]">
                  交付边界提示
                </div>
                <p className="mt-2 text-xs leading-5 text-[color:var(--text-muted)]">
                  visibility=我离世后 或 条件触发
                  的内容，需要在条目中写明触发和验证方式；status=最终版
                  的内容保持锁定，修改前先主动确认。
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
                  >
                    不默认展开全文
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
                  >
                    不自动汇总私密内容
                  </Badge>
                </div>
              </div>
            </div>
          </Surface>

          <div className="grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]">
            <Surface className="p-5">
              <SectionHeading
                icon={ScrollText}
                title="生命整理条目"
                description="条目保留分类、交付条件、情感负荷和锁定状态，让不同性质的内容不被揉成一份遗书。"
              />

              <div className="mt-5 space-y-4">
                {items.length > 0 ? (
                  items.map((item) => <LegacyItemCard key={item.id} item={item} />)
                ) : (
                  <EmptyState message="当前筛选下没有生命整理内容。" compact />
                )}
              </div>
            </Surface>

            <div className="space-y-4">
              <Surface className="p-5">
                <SectionHeading
                  icon={Shield}
                  title="信任与交付边界"
                  description="用户需要清楚知道内容会如何被看见、分析、导出和交付。"
                />

                <div className="mt-5 space-y-3">
                  {legacy.trustBoundaries.length > 0 ? (
                    legacy.trustBoundaries.map((boundary) => (
                      <div
                        key={boundary.id}
                        className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3"
                      >
                        <div className="text-sm font-medium text-[color:var(--text-primary)]">
                          {boundary.title}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                          {boundary.detail}
                        </p>
                      </div>
                    ))
                  ) : (
                    <EmptyState message="当前筛选下没有边界说明。" compact />
                  )}
                </div>
              </Surface>

              <Surface className="p-5">
                <SectionHeading
                  icon={BookOpenText}
                  title="回看问题"
                  description="它们帮助用户慢慢整理，不把沉重内容变成完成压力。"
                />

                <div className="mt-5 space-y-3">
                  {legacy.reviewPrompts.length > 0 ? (
                    legacy.reviewPrompts.map((prompt) => (
                      <div
                        key={prompt}
                        className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]"
                      >
                        {prompt}
                      </div>
                    ))
                  ) : (
                    <EmptyState message="当前筛选下没有回看问题。" compact />
                  )}
                </div>
              </Surface>

              <Surface className="p-5">
                <SectionHeading
                  icon={CheckCheck}
                  title="完成度观察"
                  description="看覆盖和边界是否清楚，不做“你还没写完”的催促。"
                />

                <div className="mt-5 grid gap-3">
                  <CompletionLine
                    label="最终版锁定"
                    value={`${lockedCount} 份`}
                    detail="锁定内容修改前需要主动解锁。"
                  />
                  <CompletionLine
                    label="需要交付描述"
                    value={`${delayedDeliveryCount} 份`}
                    detail="离世后与条件触发内容要写明条件。"
                  />
                  <CompletionLine
                    label="情感负荷很重"
                    value={`${heavyLoadCount} 份`}
                    detail="适合在状态稳定时再打开。"
                  />
                </div>
              </Surface>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function LegacyFixedDashboard({
  classificationSections,
  delayedDeliveryCount,
  emotionalLoadRows,
  heavyLoadCount,
  items,
  legacy,
  lockedCount,
}: {
  classificationSections: Array<{
    title: string
    description: string
    rows: DistributionRow[]
  }>
  delayedDeliveryCount: number
  emotionalLoadRows: DistributionRow[]
  heavyLoadCount: number
  items: LegacyItem[]
  legacy: LegacyModuleData
  lockedCount: number
}) {
  const featuredItems = items.slice(0, 4)
  const remainingItemCount = Math.max(items.length - featuredItems.length, 0)
  const visibleTrustBoundaries = legacy.trustBoundaries.slice(0, 3)
  const visiblePrompts = legacy.reviewPrompts.slice(0, 3)

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,0.95fr)_minmax(0,1.12fr)_minmax(320px,0.82fr)] grid-rows-[minmax(0,0.86fr)_minmax(0,1fr)] gap-3 overflow-hidden">
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

          <div className="grid gap-2 min-[1240px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <CompactAssessmentPanel
              title="emotional_load"
              description="不进入主筛选器，只提示打开这份内容需要多少心力。"
              rows={emotionalLoadRows}
            />
            <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3">
              <div className="text-xs font-medium text-[color:var(--text-primary)]">交付与锁定</div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge className="bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]">
                  延后/条件 {delayedDeliveryCount}
                </Badge>
                <Badge className="bg-[color:var(--tone-past-bg)] text-[color:var(--tone-past-ink)]">
                  最终锁定 {lockedCount}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
                >
                  不自动汇总私密内容
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {featuredItems.length > 0 ? (
            featuredItems.map((item) => <LegacyCompactItemCard key={item.id} item={item} />)
          ) : (
            <EmptyState message="当前筛选下没有生命整理内容。" compact />
          )}
          <div className="space-y-2 border-t border-[color:var(--muted-surface-border)] pt-3">
            {visibleTrustBoundaries.map((boundary) => (
              <CompactTextBlock key={boundary.id} title={boundary.title} detail={boundary.detail} />
            ))}
          </div>
        </div>
      </Surface>

      <Surface className="col-span-2 flex min-h-0 flex-col overflow-hidden p-4">
        <Tabs defaultValue="entries" className="min-h-0 flex-1">
          <TabsList className="w-full justify-start gap-1 rounded-lg bg-[color:var(--chip-bg)] p-1">
            <TabsTrigger value="entries">生命整理条目</TabsTrigger>
            <TabsTrigger value="boundaries">交付边界</TabsTrigger>
            <TabsTrigger value="review">回看问题</TabsTrigger>
          </TabsList>

          <TabsContent value="entries" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {items.length > 0 ? (
                items.map((item) => <LegacyCompactItemCard key={item.id} item={item} />)
              ) : (
                <EmptyState message="当前筛选下没有生命整理内容。" compact />
              )}
            </div>
          </TabsContent>

          <TabsContent value="boundaries" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {legacy.trustBoundaries.length > 0 ? (
                legacy.trustBoundaries.map((boundary) => (
                  <CompactTextBlock
                    key={boundary.id}
                    title={boundary.title}
                    detail={boundary.detail}
                  />
                ))
              ) : (
                <EmptyState message="当前筛选下没有边界说明。" compact />
              )}
            </div>
          </TabsContent>

          <TabsContent value="review" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {legacy.reviewPrompts.length > 0 ? (
                legacy.reviewPrompts.map((prompt) => (
                  <div
                    key={prompt}
                    className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 py-2 text-xs leading-5 text-[color:var(--text-secondary)]"
                  >
                    {prompt}
                  </div>
                ))
              ) : (
                <EmptyState message="当前筛选下没有回看问题。" compact />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <div className="grid min-h-0 flex-1 gap-2 overflow-y-auto pr-1">
          <CompletionLine
            label="最终版锁定"
            value={`${lockedCount} 份`}
            detail="锁定内容修改前需要主动解锁。"
          />
          <CompletionLine
            label="情感负荷很重"
            value={`${heavyLoadCount} 份`}
            detail="适合在状态稳定时再打开。"
          />
          <div className="space-y-2 border-t border-[color:var(--muted-surface-border)] pt-3">
            {visiblePrompts.map((prompt) => (
              <div
                key={prompt}
                className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 py-2 text-xs leading-5 text-[color:var(--text-secondary)]"
              >
                {prompt}
              </div>
            ))}
            {remainingItemCount > 0 ? (
              <RemainingLine label={`还有 ${remainingItemCount} 份内容未展开`} />
            ) : null}
          </div>
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

function CompactAssessmentPanel({
  title,
  description,
  rows,
}: {
  title: string
  description: string
  rows: DistributionRow[]
}) {
  const visibleRows = rows.filter((row) => row.count > 0)

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-3 py-3">
      <div className="text-xs font-medium text-[color:var(--text-primary)]">{title}</div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">{description}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {visibleRows.map((row) => (
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
  )
}

function LegacyCompactItemCard({ item }: { item: LegacyItem }) {
  const recipientLabel =
    item.recipient === "特定的人" && item.recipientName
      ? `${item.recipient} · ${item.recipientName}`
      : item.recipient

  return (
    <article className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
        >
          {item.category}
        </Badge>
        <Badge className="bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]">
          {item.visibility}
        </Badge>
        {item.isLocked ? (
          <Badge className="gap-1 bg-[color:var(--tone-past-bg)] text-[color:var(--tone-past-ink)]">
            <Lock className="size-3" />锁
          </Badge>
        ) : null}
      </div>
      <div className="mt-2 truncate text-sm font-medium text-[color:var(--text-primary)]">
        {item.title}
      </div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">{item.summary}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {recipientLabel}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          emotional_load · {item.emotionalLoad ?? "待自评"}
        </Badge>
        {item.deliveryCondition ? (
          <Badge
            variant="outline"
            className="border-[color:var(--tone-future-border)] bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]"
          >
            有交付条件
          </Badge>
        ) : null}
      </div>
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

function AssessmentPanel({
  title,
  description,
  rows,
}: {
  title: string
  description: string
  rows: DistributionRow[]
}) {
  const visibleRows = rows.filter((row) => row.count > 0)

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4">
      <div className="text-sm font-medium text-[color:var(--text-primary)]">{title}</div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">{description}</p>
      <div className="mt-3 flex flex-wrap gap-2">
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
          <span className="text-xs text-[color:var(--text-muted)]">暂无记录</span>
        )}
      </div>
    </div>
  )
}

function LegacyItemCard({ item }: { item: LegacyItem }) {
  const recipientLabel =
    item.recipient === "特定的人" && item.recipientName
      ? `${item.recipient} · ${item.recipientName}`
      : item.recipient

  return (
    <article className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
        >
          {item.category}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {recipientLabel}
        </Badge>
        <Badge className="bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]">
          {item.urgency}
        </Badge>
        <Badge className="bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]">
          {item.visibility}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
        >
          {item.status}
        </Badge>
        {item.isLocked ? (
          <Badge className="gap-1 bg-[color:var(--tone-past-bg)] text-[color:var(--tone-past-ink)]">
            <Lock className="size-3" />
            已锁定
          </Badge>
        ) : null}
      </div>

      <h3 className="mt-3 text-base font-medium text-[color:var(--text-primary)]">{item.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{item.summary}</p>

      <div className="mt-3 rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 py-3 text-sm leading-6 text-[color:var(--text-muted)]">
        {item.contentPreview}
      </div>

      {item.deliveryCondition ? (
        <div className="mt-3 rounded-lg border border-[color:var(--tone-future-border)] bg-[color:var(--tone-future-bg)] px-3 py-3 text-xs leading-5 text-[color:var(--tone-future-ink)]">
          交付条件：{item.deliveryCondition}
        </div>
      ) : null}

      <div className="mt-4 grid gap-2 min-[640px]:grid-cols-2 min-[1240px]:grid-cols-3">
        <LegacyMeta label="emotional_load" value={item.emotionalLoad ?? "待自评"} accent />
        <LegacyMeta label="更新时间" value={item.updatedAt} />
        <LegacyMeta label="回看提示" value={item.reviewCue} />
        <LegacyMeta label="接收对象" value={recipientLabel} />
        <LegacyMeta label="关系引用" value={item.relatedRelationshipId ?? "未关联"} />
        <LegacyMeta
          label="修改状态"
          value={item.isLocked ? "需主动解锁" : "可继续编辑"}
          accent={item.isLocked}
        />
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
          >
            {tag}
          </Badge>
        ))}
      </div>
    </article>
  )
}

function LegacyMeta({
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

function CompletionLine({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-[color:var(--text-primary)]">{label}</span>
        <span className="shrink-0 text-sm font-semibold text-[color:var(--text-primary)]">
          {value}
        </span>
      </div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">{detail}</p>
    </div>
  )
}
