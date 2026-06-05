import {
  Activity,
  BookHeart,
  CheckCheck,
  Salad,
  Shield,
  Utensils,
  Wallet,
  Waypoints,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type {
  BodyFeedback,
  MealComposition,
  MealOrigin,
  MealScene,
  MealStructure,
  MealTrigger,
  NutritionCrossView,
  NutritionFoodMemory,
  NutritionMealEntry,
  NutritionModuleData,
  ValueDensity,
} from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  Surface,
} from "@/features/bettertolive/ui/shared/shared"
import i18next from "@/i18n/config"
import { formatCurrency } from "@/features/bettertolive/ui/shared/formatters"
import { cn } from "@/lib/utils"

const MEAL_SCENES = [
  "在家做",
  "外卖",
  "堂食",
  "路边/便利店",
  "应酬/聚餐",
  "旅行",
  "加餐零食",
] satisfies MealScene[]

const MEAL_STRUCTURES = [
  "早餐",
  "午餐",
  "晚餐",
  "加餐",
  "夜宵",
  "节庆餐",
  "饮品",
] satisfies MealStructure[]

const MEAL_COMPOSITIONS = [
  "主食为主",
  "蛋白为主",
  "蔬果为主",
  "综合搭配",
  "几乎只有碳水",
  "几乎只有油盐糖",
] satisfies MealComposition[]

const MEAL_ORIGINS = [
  "家常",
  "地方菜系",
  "异国料理",
  "工业速食",
  "自给自种",
  "节令食材",
] satisfies MealOrigin[]

const MEAL_TRIGGERS = [
  "准时按点",
  "真饿了",
  "社交场合",
  "情绪驱动",
  "习惯反射",
  "不想浪费",
  "看到就想吃",
] satisfies MealTrigger[]

const VALUE_DENSITY_ORDER = ["高", "中", "低", "不划算"] satisfies ValueDensity[]

const BODY_FEEDBACK_ORDER = [
  "满足舒服",
  "普通",
  "偏重偏胀",
  "不适",
  "想再吃",
] satisfies BodyFeedback[]

type DistributionRow = {
  label: string
  count: number
}

function createDistribution<T extends string>(
  order: readonly T[],
  meals: NutritionMealEntry[],
  getValue: (meal: NutritionMealEntry) => T | undefined,
) {
  const counts = new Map<T, number>()

  meals.forEach((meal) => {
    const value = getValue(meal)

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

export function NutritionPage({
  nutrition,
  searchQuery,
  isStackedLayout = false,
}: {
  nutrition: NutritionModuleData
  searchQuery: string
  isStackedLayout?: boolean
}) {
  const isFixedLayout = !isStackedLayout
  const meals = nutrition.meals
  const weeklyReview = nutrition.weeklyReview
  const foodMemories = nutrition.foodMemories
  const classificationSections = [
    {
      title: "场景",
      description: "食物从哪里来，你参与了多少。",
      rows: createDistribution(MEAL_SCENES, meals, (meal) => meal.scene),
    },
    {
      title: "结构",
      description: "它在一天里扮演什么角色。",
      rows: createDistribution(MEAL_STRUCTURES, meals, (meal) => meal.structure),
    },
    {
      title: "构成主轴",
      description: "不用精算克数，只看大致骨架。",
      rows: createDistribution(MEAL_COMPOSITIONS, meals, (meal) => meal.composition),
    },
    {
      title: "来源/风味",
      description: "家常、地方、异国或工业速食。",
      rows: createDistribution(MEAL_ORIGINS, meals, (meal) => meal.origin),
    },
    {
      title: "触发",
      description: "为什么是这一刻吃这一份。",
      rows: createDistribution(MEAL_TRIGGERS, meals, (meal) => meal.trigger),
    },
  ]
  const valueDensityRows = createDistribution(
    VALUE_DENSITY_ORDER,
    meals,
    (meal) => meal.valueDensity,
  )
  const bodyFeedbackRows = createDistribution(
    BODY_FEEDBACK_ORDER,
    meals,
    (meal) => meal.bodyFeedback,
  )
  const beverageRows = meals
    .filter((meal) => meal.structure === "饮品" && meal.beverageKind)
    .map((meal) => meal.beverageKind)
    .reduce<DistributionRow[]>((rows, beverageKind) => {
      const currentRow = rows.find((row) => row.label === beverageKind)

      if (currentRow) {
        currentRow.count += 1
        return rows
      }

      if (!beverageKind) {
        return rows
      }

      return [...rows, { label: beverageKind, count: 1 }]
    }, [])

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <PageIntro
        eyebrow="饮食"
        title="看见吃这件事在生活里的位置"
        description="这页不做卡路里精算，而是把场景、结构、构成、来源、触发和身体反馈放在一起看。"
        searchQuery={searchQuery}
      />

      {isFixedLayout ? (
        <NutritionFixedDashboard
          beverageRows={beverageRows}
          bodyFeedbackRows={bodyFeedbackRows}
          classificationSections={classificationSections}
          foodMemories={foodMemories}
          meals={meals}
          nutrition={nutrition}
          valueDensityRows={valueDensityRows}
          weeklyReview={weeklyReview}
        />
      ) : null}

      {!isFixedLayout ? (
        <div className="space-y-4">
          <Surface className="p-5">
            <SectionHeading
              icon={Waypoints}
              title="5 维饮食分类"
              description="这些维度负责分组和观察饮食结构；value_density 与 body_feedback 留在条目详情和交叉视图里。"
            />

            <div className="mt-5 grid gap-3 min-[960px]:grid-cols-2 min-[1240px]:grid-cols-5">
              {classificationSections.map((section) => (
                <ClassificationPanel
                  key={section.title}
                  title={section.title}
                  description={section.description}
                  rows={section.rows}
                  total={meals.length}
                />
              ))}
            </div>

            <div className="mt-4 grid gap-3 min-[960px]:grid-cols-3">
              <AssessmentPanel
                title="饮品子标签"
                description="structure=饮品 时，用它区分咖啡因、酒精、糖等影响。"
                rows={beverageRows}
              />
              <AssessmentPanel
                title="value_density"
                description="判断这一顿钱花得值不值，不进入主筛选器。"
                rows={valueDensityRows}
              />
              <AssessmentPanel
                title="body_feedback"
                description="饭后一段时间再看身体怎么说，不做道德提醒。"
                rows={bodyFeedbackRows}
              />
            </div>
          </Surface>

          <div className="grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.16fr)_minmax(0,0.84fr)]">
            <Surface className="p-5">
              <SectionHeading
                icon={Utensils}
                title="最近进食"
                description="条目里始终显示两个评估属性，让“这一顿”本身可被判断。"
              />

              <div className="mt-5 space-y-4">
                {meals.length > 0 ? (
                  meals.map((meal) => (
                    <MealCard key={meal.id} meal={meal} foodMemories={foodMemories} />
                  ))
                ) : (
                  <EmptyState message="当前筛选下没有进食记录。" compact />
                )}
              </div>
            </Surface>

            <div className="space-y-4">
              <Surface className="p-5">
                <SectionHeading
                  icon={Shield}
                  title="饮食档案"
                  description="立场与意图是用户档案级设置，不塞进每顿饭的录入流程。"
                />

                <DietaryProfilePanel nutrition={nutrition} />
              </Surface>

              <Surface className="p-5">
                <SectionHeading
                  icon={Salad}
                  title="周回顾"
                  description="看结构性发现，而不是给单顿贴好坏标签。"
                />

                <div className="mt-5 space-y-3">
                  {weeklyReview.highlights.length > 0 ? (
                    weeklyReview.highlights.map((highlight) => (
                      <div
                        key={highlight.id}
                        className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3"
                      >
                        <div className="text-sm font-medium text-[color:var(--text-primary)]">
                          {highlight.title}
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                          {highlight.summary}
                        </p>
                      </div>
                    ))
                  ) : (
                    <EmptyState message="当前筛选下没有周回顾发现。" compact />
                  )}
                </div>

                {weeklyReview.missingSignals.length > 0 ? (
                  <div className="mt-4 rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-4 py-4">
                    <div className="text-sm font-medium text-[color:var(--text-primary)]">
                      本周几乎没出现的
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {weeklyReview.missingSignals.map((signal) => (
                        <Badge
                          key={signal}
                          variant="outline"
                          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
                        >
                          {signal}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </Surface>
            </div>
          </div>

          <div className="grid gap-4 min-[960px]:grid-cols-2">
            <Surface className="p-5">
              <SectionHeading
                icon={Activity}
                title="交叉视图"
                description="评估属性不做主筛选，但适合放到回顾里和场景、触发交叉看。"
              />

              <div className="mt-5 space-y-4">
                {weeklyReview.crossViews.length > 0 ? (
                  weeklyReview.crossViews.map((crossView) => (
                    <CrossViewCard key={crossView.id} crossView={crossView} />
                  ))
                ) : (
                  <EmptyState message="当前筛选下没有交叉视图。" compact />
                )}
              </div>
            </Surface>

            <Surface className="p-5">
              <SectionHeading
                icon={BookHeart}
                title="食物记忆"
                description="它记录一类食物在你心里的位置，不属于任何一次进食。"
              />

              <div className="mt-5 space-y-3">
                {foodMemories.length > 0 ? (
                  foodMemories.map((foodMemory) => (
                    <FoodMemoryCard key={foodMemory.id} foodMemory={foodMemory} />
                  ))
                ) : (
                  <EmptyState message="当前筛选下还没有食物记忆。" compact />
                )}
              </div>
            </Surface>
          </div>

          <Surface className="p-5">
            <SectionHeading
              icon={CheckCheck}
              title="模块边界"
              description="饮食模块承接自我观察，不替代食谱库、营养计算器或专业营养建议。"
            />

            <div className="mt-5 grid gap-3 min-[960px]:grid-cols-3">
              {[
                {
                  title: "不做食谱库",
                  detail: "在家做可以记录做法，但核心不是收藏菜谱，而是看自己如何吃。",
                },
                {
                  title: "不精算卡路里",
                  detail: "用 composition 和周回顾看结构性缺口，默认保持轻量。",
                },
                {
                  title: "不做指责提示",
                  detail: "硬约束只做事实标注，情绪性进食也只被记录，不被审判。",
                },
              ].map((entry) => (
                <div
                  key={entry.title}
                  className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]"
                >
                  <div className="font-medium text-[color:var(--text-primary)]">{entry.title}</div>
                  <div className="mt-1">{entry.detail}</div>
                </div>
              ))}
            </div>
          </Surface>
        </div>
      ) : null}
    </div>
  )
}

function NutritionFixedDashboard({
  beverageRows,
  bodyFeedbackRows,
  classificationSections,
  foodMemories,
  meals,
  nutrition,
  valueDensityRows,
  weeklyReview,
}: {
  beverageRows: DistributionRow[]
  bodyFeedbackRows: DistributionRow[]
  classificationSections: Array<{
    title: string
    description: string
    rows: DistributionRow[]
  }>
  foodMemories: NutritionFoodMemory[]
  meals: NutritionMealEntry[]
  nutrition: NutritionModuleData
  valueDensityRows: DistributionRow[]
  weeklyReview: NutritionModuleData["weeklyReview"]
}) {
  const featuredMeals = meals.slice(0, 3)
  const featuredHighlights = weeklyReview.highlights.slice(0, 2)
  const featuredCrossViews = weeklyReview.crossViews.slice(0, 2)
  const featuredFoodMemories = foodMemories.slice(0, 2)
  const remainingMealCount = Math.max(meals.length - featuredMeals.length, 0)

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,0.96fr)_minmax(0,1.08fr)_minmax(320px,0.86fr)] grid-rows-[minmax(0,0.9fr)_minmax(0,1fr)] gap-3 overflow-hidden">
      <Surface className="col-span-2 min-h-0 overflow-hidden p-4">
        <SectionHeading
          compact
          icon={Waypoints}
          title="5 维饮食分类"
          description="先把一周吃法压成结构分布，再看具体条目。"
        />

        <div className="mt-3 grid gap-2 min-[1240px]:grid-cols-5">
          {classificationSections.map((section) => (
            <CompactDistributionPanel
              key={section.title}
              title={section.title}
              rows={section.rows}
            />
          ))}
        </div>

        <div className="mt-3 grid gap-2 min-[1240px]:grid-cols-3">
          <CompactBadgeBlock title="饮品子标签" rows={beverageRows} />
          <CompactBadgeBlock title="value_density" rows={valueDensityRows} />
          <CompactBadgeBlock title="body_feedback" rows={bodyFeedbackRows} />
        </div>
      </Surface>

      <Surface className="row-span-2 min-h-0 overflow-hidden p-4">
        <SectionHeading
          compact
          icon={Utensils}
          title="最近进食"
          description="只展开近期几顿，避免记录区变成流水账。"
        />

        <div className="mt-3 grid gap-2">
          {featuredMeals.length > 0 ? (
            featuredMeals.map((meal) => <CompactMealCard key={meal.id} meal={meal} />)
          ) : (
            <EmptyState message="当前筛选下没有进食记录。" compact />
          )}
          {remainingMealCount > 0 ? (
            <RemainingLine label={`还有 ${remainingMealCount} 次进食未展开`} />
          ) : null}
        </div>
      </Surface>

      <Surface className="min-h-0 overflow-hidden p-4">
        <SectionHeading
          compact
          icon={Shield}
          title="饮食档案与周回顾"
          description="档案级约束和结构性发现放在一起看。"
        />

        <div className="mt-3 grid gap-2">
          <CompactTextBlock
            title="当前意图"
            detail={`${nutrition.profile.currentIntent.mode}${
              nutrition.profile.currentIntent.note
                ? `：${nutrition.profile.currentIntent.note}`
                : ""
            }`}
          />
          {featuredHighlights.map((highlight) => (
            <CompactTextBlock
              key={highlight.id}
              title={highlight.title}
              detail={highlight.summary}
            />
          ))}
          {weeklyReview.missingSignals.length > 0 ? (
            <div className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 py-2">
              <div className="text-xs font-medium text-[color:var(--text-primary)]">
                本周几乎没出现的
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {weeklyReview.missingSignals.slice(0, 4).map((signal) => (
                  <Badge
                    key={signal}
                    variant="outline"
                    className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
                  >
                    {signal}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </Surface>

      <Surface className="min-h-0 overflow-hidden p-4">
        <SectionHeading
          compact
          icon={Activity}
          title="交叉视图与食物记忆"
          description="评估属性和记忆内容合并成扫描区。"
        />

        <div className="mt-3 grid gap-2">
          {featuredCrossViews.map((crossView) => (
            <CompactCrossViewCard key={crossView.id} crossView={crossView} />
          ))}
          {featuredFoodMemories.map((foodMemory) => (
            <CompactFoodMemoryCard key={foodMemory.id} foodMemory={foodMemory} />
          ))}
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
  const visibleRows = rows.filter((row) => row.count > 0).slice(0, 4)

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-3 py-3">
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

function CompactMealCard({ meal }: { meal: NutritionMealEntry }) {
  return (
    <article className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-[color:var(--text-primary)]">{meal.date}</span>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
        >
          {meal.scene}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {meal.structure}
        </Badge>
      </div>
      <div className="mt-2 truncate text-sm font-medium text-[color:var(--text-primary)]">
        {meal.title}
      </div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">{meal.note}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {meal.composition ?? "饮品"}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {meal.valueDensity ?? "待评估"}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {meal.bodyFeedback ?? "待反馈"}
        </Badge>
      </div>
    </article>
  )
}

function CompactCrossViewCard({ crossView }: { crossView: NutritionCrossView }) {
  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3">
      <div className="text-xs font-medium text-[color:var(--text-primary)]">{crossView.title}</div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">
        {crossView.summary}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {crossView.rows.slice(0, 3).map((row) => (
          <Badge
            key={`${crossView.id}-${row.label}`}
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
          >
            {row.label} · {row.count}
          </Badge>
        ))}
      </div>
    </div>
  )
}

function CompactFoodMemoryCard({ foodMemory }: { foodMemory: NutritionFoodMemory }) {
  return (
    <article className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs font-medium text-[color:var(--text-primary)]">
          {foodMemory.name}
        </span>
        <Badge className="bg-[color:var(--tone-past-bg)] text-[color:var(--tone-past-ink)]">
          {foodMemory.emotionalLoad}
        </Badge>
      </div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">
        {foodMemory.story}
      </p>
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

function MealCard({
  meal,
  foodMemories,
}: {
  meal: NutritionMealEntry
  foodMemories: NutritionFoodMemory[]
}) {
  const locale =
    typeof i18next.resolvedLanguage === "string" ? i18next.resolvedLanguage : i18next.language
  const relatedFoodMemory = foodMemories.find(
    (foodMemory) => foodMemory.id === meal.relatedFoodMemoryId,
  )

  return (
    <article className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-[color:var(--text-primary)]">{meal.date}</span>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
        >
          {meal.scene}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {meal.structure}
        </Badge>
        {meal.beverageKind ? (
          <Badge className="bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]">
            {meal.beverageKind}
          </Badge>
        ) : null}
      </div>

      <h3 className="mt-3 text-base font-medium text-[color:var(--text-primary)]">{meal.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{meal.note}</p>

      <div className="mt-4 grid gap-2 min-[640px]:grid-cols-2 min-[1240px]:grid-cols-4">
        <MealMeta label="构成" value={meal.composition ?? "饮品不填"} />
        <MealMeta label="来源/风味" value={meal.origin} />
        <MealMeta label="触发" value={meal.trigger} />
        <MealMeta label="花费参考" value={meal.cost ? formatCurrency(meal.cost, locale) : "未填"} />
        <MealMeta label="value_density" value={meal.valueDensity ?? "待补"} accent />
        <MealMeta label="body_feedback" value={meal.bodyFeedback ?? "待补"} accent />
        <MealMeta label="关联记账" value={meal.relatedFinanceEntryId ?? "未关联"} />
        <MealMeta label="关联情绪" value={meal.relatedEmotionEntryId ?? "未关联"} />
      </div>

      {meal.companions && meal.companions.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {meal.companions.map((companion) => (
            <Badge
              key={companion}
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
            >
              同吃：{companion}
            </Badge>
          ))}
        </div>
      ) : null}

      {relatedFoodMemory ? (
        <div className="mt-3 rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 py-2 text-xs leading-5 text-[color:var(--text-muted)]">
          关联食物记忆：{relatedFoodMemory.name}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap gap-2">
        {meal.detailSignals.map((signal) => (
          <Badge
            key={signal}
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
          >
            {signal}
          </Badge>
        ))}
      </div>
    </article>
  )
}

function MealMeta({
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

function DietaryProfilePanel({ nutrition }: { nutrition: NutritionModuleData }) {
  const { profile } = nutrition

  return (
    <div className="mt-5 space-y-4">
      <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
        <div className="text-sm font-medium text-[color:var(--text-primary)]">当前意图</div>
        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
          {profile.currentIntent.mode}
          {profile.currentIntent.note ? `：${profile.currentIntent.note}` : ""}
        </p>
        {profile.currentIntent.window ? (
          <div className="mt-2 text-xs text-[color:var(--text-muted)]">
            {profile.currentIntent.window.start}
            {profile.currentIntent.window.end ? ` 至 ${profile.currentIntent.window.end}` : " 开始"}
          </div>
        ) : null}
      </div>

      <ProfileGroup title="硬约束" entries={profile.hardConstraints} />
      <ProfileGroup title="软立场" entries={profile.softStances} />
    </div>
  )
}

function ProfileGroup({
  title,
  entries,
}: {
  title: string
  entries: Array<{ id: string; type: string; label: string; note: string }>
}) {
  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
      <div className="text-sm font-medium text-[color:var(--text-primary)]">{title}</div>
      <div className="mt-3 space-y-3">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <div key={entry.id} className="text-sm leading-6 text-[color:var(--text-secondary)]">
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
                >
                  {entry.type}
                </Badge>
                <span className="font-medium text-[color:var(--text-primary)]">{entry.label}</span>
              </div>
              <div className="mt-1">{entry.note}</div>
            </div>
          ))
        ) : (
          <div className="text-xs text-[color:var(--text-muted)]">暂无设置</div>
        )}
      </div>
    </div>
  )
}

function CrossViewCard({ crossView }: { crossView: NutritionCrossView }) {
  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]">
          {crossView.id.includes("value") ? (
            <Wallet className="size-4" />
          ) : (
            <Activity className="size-4" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-[color:var(--text-primary)]">
            {crossView.title}
          </div>
          <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
            {crossView.summary}
          </p>
          <div className="mt-3 space-y-2">
            {crossView.rows.map((row) => (
              <div
                key={`${crossView.id}-${row.label}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-3 py-2 text-xs"
              >
                <span className="text-[color:var(--text-secondary)]">{row.label}</span>
                <span className="text-[color:var(--text-muted)]">
                  {row.count} 次{row.valueDensity ? ` · ${row.valueDensity}` : ""}
                  {row.bodyFeedback ? ` · ${row.bodyFeedback}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function FoodMemoryCard({ foodMemory }: { foodMemory: NutritionFoodMemory }) {
  return (
    <article className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium text-[color:var(--text-primary)]">{foodMemory.name}</span>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
        >
          {foodMemory.type}
        </Badge>
        <Badge className="bg-[color:var(--tone-past-bg)] text-[color:var(--tone-past-ink)]">
          {foodMemory.emotionalLoad}
        </Badge>
      </div>
      {foodMemory.flavorDescription ? (
        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
          味道：{foodMemory.flavorDescription}
        </p>
      ) : null}
      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
        {foodMemory.story}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {foodMemory.currentAvailability}
        </Badge>
        {(foodMemory.relatedPeople ?? []).map((person) => (
          <Badge
            key={person}
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
          >
            关联人物：{person}
          </Badge>
        ))}
        {(foodMemory.relatedMemoryIds ?? []).map((memoryId) => (
          <Badge
            key={memoryId}
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
          >
            成长记忆：{memoryId}
          </Badge>
        ))}
      </div>
      {foodMemory.recipe ? (
        <div className="mt-3 rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-3 py-2 text-xs leading-5 text-[color:var(--text-muted)]">
          做法记录：{foodMemory.recipe}
        </div>
      ) : null}
    </article>
  )
}
