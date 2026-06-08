import {
  CalendarDays,
  CookingPot,
  Droplets,
  Leaf,
  ListChecks,
  Pencil,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import type { ReactNode } from "react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  Bar,
  BarChart,
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { NutritionModuleData } from "@/features/bettertolive/types"
import { NutritionProfileEditDialog } from "@/features/bettertolive/ui/nutrition/nutrition-profile-edit-dialog"
import {
  buildNutritionLookups,
  calculateDailyPlanNutrition,
  findDailyPlanForDate,
  formatEntryTitle,
  formatNutrientValue,
} from "@/features/bettertolive/ui/nutrition/nutrition-page-data"
import {
  NUTRITION_CONTROL_BADGE_CLASS,
  NUTRITION_DETAIL_CARD_CLASS,
  NutritionControlModeBadge,
  NutritionMetricCard,
} from "@/features/bettertolive/ui/nutrition/nutrition-page-shared"
import { translateNutritionEnum } from "@/features/bettertolive/ui/nutrition/nutrition-i18n"
import { cn } from "@/lib/utils"

export function NutritionOverviewTab({
  editableNutrition,
  isControlMode = false,
  nutrition,
}: {
  editableNutrition?: NutritionModuleData
  isControlMode?: boolean
  nutrition: NutritionModuleData
}) {
  const { t } = useTranslation()
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const sourceNutrition = editableNutrition ?? nutrition
  const lookups = useMemo(() => buildNutritionLookups(nutrition), [nutrition])
  const plan = findDailyPlanForDate(nutrition.dailyPlans)
  const totals = plan
    ? calculateDailyPlanNutrition({
        foodById: lookups.foodById,
        plan,
        profileByFoodId: lookups.profileByFoodId,
        recipeById: lookups.recipeById,
      })
    : null

  const plannedSlotCount = plan?.slots.filter((slot) => slot.entries.length > 0).length ?? 0
  const completionRatio = plan?.slots.length
    ? Math.round((plannedSlotCount / plan.slots.length) * 100)
    : 0
  const recipesReady = nutrition.recipes
    .filter((recipe) => recipe.repeatability !== "只想记录")
    .slice(0, 3)
  const currentIntent = nutrition.profile.currentIntent

  const nutrientBars = totals
    ? [
        { name: t("nutrition.nutrients.energyKcal", "能量"), value: totals.energyKcal },
        { name: t("nutrition.nutrients.proteinG", "蛋白质"), value: totals.proteinG * 8 },
        { name: t("nutrition.nutrients.fiberG", "膳食纤维"), value: totals.fiberG * 18 },
        { name: t("nutrition.nutrients.sugarG", "糖"), value: totals.sugarG * 8 },
      ]
    : []

  const pulseData = [
    {
      name: t("nutrition.overview.planCompletion", "计划度"),
      value: completionRatio,
      fill: "var(--color-chart-1)",
    },
  ]

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain pr-1">
      <div className="grid min-h-full grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.55fr)]">
        <Card className="border-foreground/10 from-background via-card to-muted/20 shadow-foreground/5 flex min-h-[920px] flex-col overflow-hidden border bg-linear-to-br shadow-lg md:min-h-[780px] xl:min-h-[640px]">
          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            <div className="border-foreground/10 relative overflow-hidden border-b px-5 py-4">
              <div className="from-muted via-accent/30 absolute inset-x-0 top-0 h-24 bg-linear-to-r to-transparent blur-2xl" />
              <div className="relative flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={NUTRITION_CONTROL_BADGE_CLASS}>
                      {t("nutrition.overview.eyebrow", "今日饮食总览")}
                    </Badge>
                    <NutritionControlModeBadge isControlMode={isControlMode} />
                  </div>
                  <div className="max-w-2xl space-y-2">
                    <h2 className="text-[1.45rem] font-semibold tracking-tight sm:text-[1.7rem]">
                      {t("nutrition.overview.heroTitle", "今天不是要完美，而是要能被照顾到")}
                    </h2>
                    <p className="text-muted-foreground line-clamp-3 max-w-xl text-sm leading-6">
                      {t(
                        "nutrition.overview.heroDescription",
                        "把食谱、食品、营养和真实进食收敛到一页里，先看今天怎么吃、缺什么、下一步能做什么。",
                      )}
                    </p>
                  </div>
                </div>

                <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 xl:w-auto xl:grid-cols-2">
                  <NutritionMetricCard
                    icon={CalendarDays}
                    label={t("nutrition.overview.todaySlots", "今日餐次")}
                    value={plan?.slots.length ?? 0}
                    detail={t("nutrition.overview.todaySlotsHint", "含早餐、午餐、晚餐和饮品")}
                  />
                  <NutritionMetricCard
                    icon={ListChecks}
                    label={t("nutrition.overview.arrangedSlots", "已安排")}
                    value={`${plannedSlotCount}/${plan?.slots.length ?? 0}`}
                    detail={t(
                      "nutrition.overview.arrangedSlotsHint",
                      "空餐次不制造压力，只提示预案",
                    )}
                  />
                  <NutritionMetricCard
                    icon={Leaf}
                    label={t("nutrition.overview.foods", "食品")}
                    value={nutrition.foods.length}
                    detail={t("nutrition.overview.foodsHint", "食品库是营养与食谱的底层")}
                  />
                  <NutritionMetricCard
                    icon={CookingPot}
                    label={t("nutrition.overview.recipes", "食谱")}
                    value={nutrition.recipes.length}
                    detail={t("nutrition.overview.recipesHint", "只放真的会做或想复刻的")}
                  />
                </div>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(300px,1fr)_minmax(360px,1fr)] gap-3 p-3 xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] xl:grid-rows-1">
              <OverviewPanel
                icon={CalendarDays}
                title={t("nutrition.overview.todayPlate", "今日餐盘")}
                subtitle={t("nutrition.overview.todayPlateDesc", "把计划按餐次排成能执行的一天。")}
              >
                <div className="grid h-full min-h-0 grid-cols-1 gap-3 overflow-y-auto pr-1">
                  {plan?.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="border-foreground/10 bg-background/70 rounded-xl border p-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium">
                          {translateNutritionEnum(t, "mealRole", slot.structure)}
                        </div>
                        <Badge
                          variant="outline"
                          className="border-foreground/10 bg-muted text-muted-foreground"
                        >
                          {t(`nutrition.status.${slot.status}`, slot.status)}
                        </Badge>
                      </div>
                      <div className="mt-2 space-y-1">
                        {slot.entries.length > 0 ? (
                          slot.entries.map((entry, index) => (
                            <div
                              key={`${slot.id}-${index}`}
                              className="text-muted-foreground text-sm"
                            >
                              {formatEntryTitle({
                                entry,
                                foodById: lookups.foodById,
                                recipeById: lookups.recipeById,
                                servingLabel: t("nutrition.units.serving", "份"),
                                unitLabel: (unit) => translateNutritionEnum(t, "unit", unit),
                              })}
                            </div>
                          ))
                        ) : (
                          <div className="text-muted-foreground text-sm">
                            {t("nutrition.overview.emptySlot", "还没安排，允许留白")}
                          </div>
                        )}
                      </div>
                      {slot.note ? (
                        <p className="text-muted-foreground mt-2 text-xs leading-5">{slot.note}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </OverviewPanel>

              <OverviewPanel
                icon={Droplets}
                title={t("nutrition.overview.nutritionPulse", "营养脉冲")}
                subtitle={t(
                  "nutrition.overview.nutritionPulseDesc",
                  "轻量估算，不把缺失数据算成 0。",
                )}
              >
                <div className="grid h-full min-h-0 grid-rows-[160px_minmax(0,1fr)] gap-3">
                  <div className="grid min-h-0 grid-cols-[140px_minmax(0,1fr)] gap-3">
                    <div className="min-h-0">
                      <ResponsiveContainer
                        width="100%"
                        height="100%"
                        initialDimension={{ width: 140, height: 160 }}
                      >
                        <RadialBarChart
                          data={pulseData}
                          cx="50%"
                          cy="50%"
                          innerRadius="64%"
                          outerRadius="92%"
                          startAngle={90}
                          endAngle={-270}
                        >
                          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                          <RadialBar dataKey="value" cornerRadius={12} background />
                        </RadialBarChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex min-w-0 flex-col justify-center">
                      <div className="text-3xl font-semibold tracking-tight">
                        {completionRatio}%
                      </div>
                      <p className="text-muted-foreground mt-2 text-sm leading-6">
                        {t(
                          "nutrition.overview.completionCopy",
                          "今天已经有了预案，剩下的是让它足够好执行。",
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="min-h-0">
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      initialDimension={{ width: 360, height: 180 }}
                    >
                      <BarChart
                        data={nutrientBars}
                        layout="vertical"
                        margin={{ left: 4, right: 16 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={68}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip cursor={{ fill: "var(--muted)" }} />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                          {nutrientBars.map((entry, index) => (
                            <Cell key={entry.name} fill={`var(--color-chart-${(index % 4) + 1})`} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </OverviewPanel>
            </div>
          </CardContent>
        </Card>

        <div className="grid min-h-[560px] gap-4 2xl:min-h-0 2xl:grid-rows-[minmax(0,0.72fr)_minmax(0,0.9fr)_minmax(0,1fr)]">
          <Card className={cn(NUTRITION_DETAIL_CARD_CLASS, "overflow-hidden")}>
            <CardContent className="flex h-full min-h-0 flex-col p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-4" />
                  <h3 className="text-sm font-semibold">
                    {t("nutrition.overview.profile", "饮食意图")}
                  </h3>
                </div>
                {isControlMode ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => setIsEditingProfile(true)}
                    aria-label={t("nutrition.profileEdit.title", "编辑饮食档案")}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                ) : null}
              </div>
              <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-5">
                {t(
                  "nutrition.overview.profileDesc",
                  "先看边界和当前目标，再安排今天能执行的吃法。",
                )}
              </p>

              <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                <div className="border-foreground/10 bg-background/70 rounded-xl border p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className={NUTRITION_CONTROL_BADGE_CLASS}>
                      {translateNutritionEnum(t, "dietaryIntentMode", currentIntent.mode)}
                    </Badge>
                    {currentIntent.window ? (
                      <span className="text-muted-foreground text-xs">
                        {t("nutrition.overview.intentWindow", "{{start}} 至 {{end}}", {
                          end:
                            currentIntent.window.end ??
                            t("nutrition.overview.intentOpenEnded", "持续中"),
                          start: currentIntent.window.start,
                        })}
                      </span>
                    ) : null}
                  </div>
                  {currentIntent.note ? (
                    <p className="text-muted-foreground mt-2 line-clamp-2 text-xs leading-5">
                      {currentIntent.note}
                    </p>
                  ) : null}
                </div>

                <ProfileChipGroup
                  emptyLabel={t("nutrition.overview.noConstraints", "暂无硬约束")}
                  label={t("nutrition.overview.hardConstraints", "硬约束")}
                  values={nutrition.profile.hardConstraints.map((constraint) => ({
                    id: constraint.id,
                    name: constraint.label,
                    type: translateNutritionEnum(t, "hardConstraintType", constraint.type),
                  }))}
                />
                <ProfileChipGroup
                  emptyLabel={t("nutrition.overview.noStances", "暂无软立场")}
                  label={t("nutrition.overview.softStances", "软立场")}
                  values={nutrition.profile.softStances.map((stance) => ({
                    id: stance.id,
                    name: stance.label,
                    type: translateNutritionEnum(t, "softStanceType", stance.type),
                  }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card className={cn(NUTRITION_DETAIL_CARD_CLASS, "overflow-hidden")}>
            <CardContent className="flex h-full min-h-0 flex-col p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="size-4" />
                <h3 className="text-sm font-semibold">
                  {t("nutrition.overview.actions", "可执行建议")}
                </h3>
              </div>
              <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {recipesReady.map((recipe) => (
                  <div
                    key={recipe.id}
                    className="border-foreground/10 bg-muted/20 rounded-xl border p-3"
                  >
                    <div className="font-medium">{recipe.name}</div>
                    <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-5">
                      {recipe.summary}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {recipe.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="border-foreground/10 bg-background/70 text-[10px]"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className={cn(NUTRITION_DETAIL_CARD_CLASS, "overflow-hidden")}>
            <CardContent className="flex h-full min-h-0 flex-col p-4">
              <h3 className="text-sm font-semibold">
                {t("nutrition.overview.review", "近期校准")}
              </h3>
              <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                {nutrition.weeklyReview.highlights.slice(0, 3).map((highlight) => (
                  <div
                    key={highlight.id}
                    className="border-foreground/10 bg-background/70 rounded-xl border p-3"
                  >
                    <div className="text-sm font-medium">{highlight.title}</div>
                    <p className="text-muted-foreground mt-1 line-clamp-3 text-xs leading-5">
                      {highlight.summary}
                    </p>
                  </div>
                ))}
                {totals?.missingCount ? (
                  <Badge
                    variant="outline"
                    className="border-foreground/10 bg-muted text-muted-foreground"
                  >
                    {t("nutrition.overview.missingNutrition", "{{count}} 项营养数据待补", {
                      count: totals.missingCount,
                    })}
                  </Badge>
                ) : null}
                {totals ? (
                  <div className="text-muted-foreground text-xs">
                    {t(
                      "nutrition.overview.energySummary",
                      "今日估算 {{kcal}} kcal · 蛋白 {{protein}} g",
                      {
                        kcal: formatNutrientValue(totals.energyKcal),
                        protein: formatNutrientValue(totals.proteinG, 1),
                      },
                    )}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isControlMode && isEditingProfile ? (
        <NutritionProfileEditDialog
          nutrition={sourceNutrition}
          onClose={() => setIsEditingProfile(false)}
        />
      ) : null}
    </div>
  )
}

function ProfileChipGroup({
  emptyLabel,
  label,
  values,
}: {
  emptyLabel: string
  label: string
  values: Array<{ id: string; name: string; type: string }>
}) {
  return (
    <div className="space-y-1">
      <div className="text-muted-foreground text-[11px] font-medium">{label}</div>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-1">
          {values.slice(0, 4).map((value) => (
            <Badge
              key={value.id}
              variant="outline"
              className="border-foreground/10 bg-muted text-muted-foreground max-w-full gap-1 text-[10px]"
            >
              <span>{value.type}</span>
              <span className="text-foreground max-w-32 truncate">{value.name}</span>
            </Badge>
          ))}
        </div>
      ) : (
        <div className="text-muted-foreground text-xs">{emptyLabel}</div>
      )}
    </div>
  )
}

function OverviewPanel({
  children,
  className,
  icon: Icon,
  subtitle,
  title,
}: {
  children: ReactNode
  className?: string
  icon: LucideIcon
  subtitle: string
  title: string
}) {
  return (
    <section
      className={cn(
        "border-foreground/10 bg-background/55 flex min-h-0 flex-col overflow-hidden rounded-2xl border p-4",
        className,
      )}
    >
      <div className="shrink-0">
        <div className="flex items-center gap-2">
          <Icon className="size-4" />
          <h3 className="font-semibold tracking-tight">{title}</h3>
        </div>
        <p className="text-muted-foreground mt-1 text-sm leading-6">{subtitle}</p>
      </div>
      <div className="mt-3 min-h-0 flex-1">{children}</div>
    </section>
  )
}
