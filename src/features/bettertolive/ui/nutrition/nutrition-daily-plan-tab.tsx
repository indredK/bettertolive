import { generateId } from "@/lib/id-utils"
import { CalendarRange, CircleCheck, ClipboardCheck, Pencil, Utensils } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { AnimatedButton, AnimatedIconButton } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useSaveNutritionMutation } from "@/features/bettertolive/queries/use-save-nutrition-mutation"
import type {
  DailyMealSlot,
  DailyPlan,
  DailyPlanEntry,
  MealLog,
  MealStructure,
  NutritionModuleData,
} from "@/features/bettertolive/types"
import {
  NutritionDailyPlanEditDialog,
  type EditingDailyPlan,
} from "@/features/bettertolive/ui/nutrition/nutrition-daily-plan-edit-dialog"
import {
  NUTRIENT_KEYS,
  NUTRIENT_UNITS,
  buildDailyPlanSignals,
  buildNutritionSemanticCues,
  buildNutritionLookups,
  buildReplacementSuggestions,
  calculateDailyPlanNutrition,
  findDailyPlanForDate,
  formatEntryTitle,
  formatNutrientValue,
} from "@/features/bettertolive/ui/nutrition/nutrition-page-data"
import {
  NUTRITION_DETAIL_CARD_CLASS,
  NutritionDetailPane,
  NutritionMetricCard,
  NutritionSelectableCard,
  NutritionSidebarPane,
  NutritionTabBody,
  NutritionTabViewport,
} from "@/features/bettertolive/ui/nutrition/nutrition-page-shared"
import { translateNutritionEnum } from "@/features/bettertolive/ui/nutrition/nutrition-i18n"
import { cn } from "@/lib/utils"

export function NutritionDailyPlanTab({
  createRequested = false,
  editableNutrition,
  isControlMode = false,
  onCreateHandled,
  nutrition,
}: {
  createRequested?: boolean
  editableNutrition?: NutritionModuleData
  isControlMode?: boolean
  onCreateHandled?: () => void
  nutrition: NutritionModuleData
}) {
  const { t } = useTranslation()
  const sourceNutrition = editableNutrition ?? nutrition
  const [activePlanId, setActivePlanId] = useState(
    () => findDailyPlanForDate(nutrition.dailyPlans)?.id ?? "",
  )
  const [editingPlan, setEditingPlan] = useState<EditingDailyPlan | null>(null)
  const saveNutritionMutation = useSaveNutritionMutation()
  const activePlan =
    nutrition.dailyPlans.find((plan) => plan.id === activePlanId) ??
    findDailyPlanForDate(nutrition.dailyPlans)
  const lookups = useMemo(() => buildNutritionLookups(nutrition), [nutrition])
  const generatedSourceLogBySlotId = useMemo(
    () =>
      new Map<string, MealLog>(
        sourceNutrition.mealLogs.flatMap(
          (log): Array<[string, MealLog]> => (log.plannedSlotId ? [[log.plannedSlotId, log]] : []),
        ),
      ),
    [sourceNutrition.mealLogs],
  )

  useEffect(() => {
    if (!isControlMode || !createRequested) return
    setTimeout(() => setEditingPlan({ isNew: true, plan: null }), 0)
    onCreateHandled?.()
  }, [createRequested, isControlMode, onCreateHandled])

  const handleGenerateMealLog = async (plan: DailyPlan, slot: DailyMealSlot) => {
    if (!isControlMode || slot.entries.length === 0 || generatedSourceLogBySlotId.has(slot.id)) {
      return
    }

    const nextLog: MealLog = {
      id: generateId("meal-log"),
      dateTime: toOffsetDateTime(defaultSlotDateTime(plan.date, slot.structure)),
      plannedSlotId: slot.id,
      entries: slot.entries.map(clonePlanEntry),
      trigger: "准时按点",
      ...(slot.note ? { note: slot.note } : {}),
    }
    const eatenStatus: DailyMealSlot["status"] = "eaten"
    const nextDailyPlans: DailyPlan[] = sourceNutrition.dailyPlans.map(
      (currentPlan): DailyPlan =>
        currentPlan.id === plan.id
          ? {
              ...currentPlan,
              slots: currentPlan.slots.map(
                (currentSlot): DailyMealSlot =>
                  currentSlot.id === slot.id
                    ? { ...currentSlot, status: eatenStatus }
                    : currentSlot,
              ),
            }
          : currentPlan,
    )

    try {
      await saveNutritionMutation.mutateAsync({
        ...sourceNutrition,
        dailyPlans: nextDailyPlans,
        mealLogs: [nextLog, ...sourceNutrition.mealLogs],
      })
      toast.success(t("nutrition.dailyPlan.logGenerated"))
    } catch {
      toast.error(t("nutrition.dailyPlan.logGenerateFailed"))
    }
  }

  if (!activePlan) {
    return (
      <NutritionTabViewport>
        <Card
          className={cn(
            NUTRITION_DETAIL_CARD_CLASS,
            "flex min-h-[320px] items-center justify-center",
          )}
        >
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <p className="text-muted-foreground text-sm">{t("nutrition.dailyPlan.emptyPlan")}</p>
          </CardContent>
        </Card>
        {isControlMode && editingPlan ? (
          <NutritionDailyPlanEditDialog
            editing={editingPlan}
            nutrition={sourceNutrition}
            onClose={() => setEditingPlan(null)}
          />
        ) : null}
      </NutritionTabViewport>
    )
  }

  return (
    <NutritionTabViewport>
      <NutritionTabBody>
        <NutritionSidebarPane>
          <div className="mb-3 flex items-center justify-between gap-2 px-1">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <CalendarRange className="size-4" />
              {t("nutrition.dailyPlan.week")}
            </div>
          </div>
          <div className="space-y-2">
            {nutrition.dailyPlans.map((plan) => (
              <PlanListCard
                key={plan.id}
                isActive={plan.id === activePlan.id}
                onClick={() => setActivePlanId(plan.id)}
                plan={plan}
              />
            ))}
          </div>
        </NutritionSidebarPane>

        <NutritionDetailPane>
          <div className="grid h-full min-h-0 gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)]">
            <Card
              className={cn(NUTRITION_DETAIL_CARD_CLASS, "flex min-h-0 flex-col overflow-hidden")}
            >
              <CardContent className="flex min-h-0 flex-1 flex-col p-4">
                <div className="flex shrink-0 flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-muted-foreground text-xs">
                      {t("nutrition.dailyPlan.selectedDate")}
                    </div>
                    <h3 className="mt-1 text-lg font-semibold tracking-tight">{activePlan.date}</h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-foreground/10 bg-muted text-muted-foreground"
                    >
                      {t("nutrition.dailyPlan.planNote")}
                    </Badge>
                    <AnimatedIconButton
                      show={isControlMode}
                      type="button"
                      variant="outline"
                      size="sm"
                      label={t("common.actions.edit")}
                      icon={<Pencil className="size-3.5" />}
                      onClick={() => setEditingPlan({ isNew: false, plan: activePlan })}
                    >
                      {t("common.actions.edit")}
                    </AnimatedIconButton>
                  </div>
                </div>

                <div className="mt-4 grid min-h-0 flex-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2 2xl:grid-cols-3">
                  {activePlan.slots.map((slot) => (
                    <div
                      key={slot.id}
                      className="border-foreground/10 bg-background/70 flex min-h-[190px] flex-col rounded-2xl border p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-medium">
                          <Utensils className="size-4" />
                          {translateNutritionEnum(t, "mealRole", slot.structure)}
                        </div>
                        <Badge
                          variant="outline"
                          className="border-foreground/10 bg-muted text-muted-foreground"
                        >
                          {t(`nutrition.status.${slot.status}`)}
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <AnimatedButton
                          show={isControlMode}
                          type="button"
                          variant={
                            generatedSourceLogBySlotId.has(slot.id) ? "secondary" : "outline"
                          }
                          size="sm"
                          disabled={
                            slot.entries.length === 0 ||
                            generatedSourceLogBySlotId.has(slot.id) ||
                            saveNutritionMutation.isPending
                          }
                          onClick={() => handleGenerateMealLog(activePlan, slot)}
                        >
                          <ClipboardCheck className="size-3.5" />
                          {generatedSourceLogBySlotId.has(slot.id)
                            ? t("nutrition.dailyPlan.logGeneratedAction")
                            : t("nutrition.dailyPlan.generateLog")}
                        </AnimatedButton>
                      </div>

                      <div className="mt-4 min-h-0 flex-1 space-y-2">
                        {slot.entries.length > 0 ? (
                          slot.entries.map((entry, index) => (
                            <div
                              key={`${slot.id}-${index}`}
                              className="border-foreground/10 bg-muted/20 rounded-xl border px-3 py-2 text-sm"
                            >
                              {formatEntryTitle({
                                entry,
                                foodById: lookups.foodById,
                                recipeById: lookups.recipeById,
                                servingLabel: t("nutrition.units.serving"),
                                unitLabel: (unit) => translateNutritionEnum(t, "unit", unit),
                              })}
                            </div>
                          ))
                        ) : (
                          <div className="border-foreground/15 text-muted-foreground rounded-xl border border-dashed px-3 py-6 text-center text-sm">
                            {t("nutrition.dailyPlan.emptySlot")}
                          </div>
                        )}
                      </div>

                      {slot.note ? (
                        <p className="text-muted-foreground mt-3 text-xs leading-5">{slot.note}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <DailyNutritionPanel plan={activePlan} nutrition={nutrition} />
          </div>
        </NutritionDetailPane>
      </NutritionTabBody>

      {isControlMode && editingPlan ? (
        <NutritionDailyPlanEditDialog
          key={editingPlan.plan?.id ?? "new-daily-plan"}
          editing={editingPlan}
          nutrition={sourceNutrition}
          onClose={() => setEditingPlan(null)}
        />
      ) : null}
    </NutritionTabViewport>
  )
}

function clonePlanEntry(entry: DailyPlanEntry): DailyPlanEntry {
  if (entry.type === "recipe") {
    return { type: "recipe", recipeId: entry.recipeId, servings: entry.servings }
  }

  if (entry.type === "food") {
    return { type: "food", foodId: entry.foodId, amount: entry.amount, unit: entry.unit }
  }

  return { type: "text", title: entry.title, note: entry.note }
}

function defaultSlotDateTime(date: string, structure: MealStructure) {
  const fallbackTimeByRole: Record<MealStructure, string> = {
    早餐: "08:00",
    午餐: "12:30",
    晚餐: "18:30",
    加餐: "15:30",
    夜宵: "22:00",
    节庆餐: "18:30",
    饮品: "10:00",
  }

  return `${date}T${fallbackTimeByRole[structure]}`
}

function toOffsetDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? "+" : "-"
  const absoluteOffset = Math.abs(offsetMinutes)
  const hours = String(Math.floor(absoluteOffset / 60)).padStart(2, "0")
  const minutes = String(absoluteOffset % 60).padStart(2, "0")

  return `${value.length === 16 ? `${value}:00` : value}${sign}${hours}:${minutes}`
}

function PlanListCard({
  isActive,
  onClick,
  plan,
}: {
  isActive: boolean
  onClick: () => void
  plan: DailyPlan
}) {
  const { t } = useTranslation()
  const plannedCount = plan.slots.filter((slot) => slot.entries.length > 0).length

  return (
    <NutritionSelectableCard isActive={isActive} onClick={onClick}>
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium">{plan.date}</div>
        <Badge
          variant="outline"
          className={cn(
            "text-[10px]",
            isActive
              ? "border-ring/50 bg-accent text-accent-foreground"
              : "border-foreground/10 bg-muted text-muted-foreground",
          )}
        >
          {plannedCount}/{plan.slots.length}
        </Badge>
      </div>
      <p className="text-muted-foreground mt-2 line-clamp-2 text-xs leading-5">
        {plan.note || t("nutrition.dailyPlan.noNote")}
      </p>
    </NutritionSelectableCard>
  )
}

function DailyNutritionPanel({
  nutrition,
  plan,
}: {
  nutrition: NutritionModuleData
  plan: DailyPlan
}) {
  const { t } = useTranslation()
  const lookups = useMemo(() => buildNutritionLookups(nutrition), [nutrition])
  const totals = calculateDailyPlanNutrition({
    foodById: lookups.foodById,
    plan,
    profileByFoodId: lookups.profileByFoodId,
    recipeById: lookups.recipeById,
  })
  const emptySlotCount = plan.slots.filter((slot) => slot.entries.length === 0).length
  const replacementRecipes = buildReplacementSuggestions({
    foodById: lookups.foodById,
    plan,
    profileByFoodId: lookups.profileByFoodId,
    recipeById: lookups.recipeById,
    recipes: nutrition.recipes,
  })
  const planSignals = buildDailyPlanSignals({
    foodById: lookups.foodById,
    plan,
    profileByFoodId: lookups.profileByFoodId,
    recipeById: lookups.recipeById,
  })
  const semanticCues = buildNutritionSemanticCues({
    foodById: lookups.foodById,
    plan,
    profileByFoodId: lookups.profileByFoodId,
    recipeById: lookups.recipeById,
  })

  return (
    <Card className={cn(NUTRITION_DETAIL_CARD_CLASS, "flex min-h-0 flex-col overflow-hidden")}>
      <CardContent className="flex min-h-0 flex-1 flex-col p-4">
        <div className="flex shrink-0 items-center gap-2">
          <CircleCheck className="size-4" />
          <h3 className="text-sm font-semibold">{t("nutrition.dailyPlan.nutritionSummary")}</h3>
        </div>

        <div className="mt-4 grid shrink-0 grid-cols-2 gap-2 xl:grid-cols-1 2xl:grid-cols-2">
          <NutritionMetricCard
            label={t("nutrition.nutrients.energyKcal")}
            value={formatNutrientValue(totals.energyKcal)}
            detail="kcal"
          />
          <NutritionMetricCard
            label={t("nutrition.nutrients.proteinG")}
            value={formatNutrientValue(totals.proteinG, 1)}
            detail="g"
          />
        </div>

        <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          <section className="border-foreground/10 bg-background/70 rounded-2xl border p-3">
            <h4 className="text-sm font-semibold">{t("nutrition.dailyPlan.gaps")}</h4>
            <div className="mt-3 grid gap-2">
              <GapLine
                label={t("nutrition.dailyPlan.emptySlots")}
                value={emptySlotCount}
                detail={t("nutrition.dailyPlan.emptySlotsHint")}
              />
              <GapLine
                label={t("nutrition.dailyPlan.pendingNutrition")}
                value={totals.missingCount}
                detail={t("nutrition.dailyPlan.pendingNutritionHint")}
              />
              {planSignals.map((signal) => (
                <GapLine
                  key={signal.id}
                  detail={buildSignalInsightDetail(signal, semanticCues, t)}
                  label={t(`nutrition.dailyPlan.signalLabels.${signal.id}`)}
                  value={formatSignalValue(signal)}
                  tone={signal.tone}
                />
              ))}
            </div>
          </section>

          {NUTRIENT_KEYS.map((key) => (
            <div
              key={key}
              className="border-foreground/10 bg-background/70 flex items-center justify-between gap-3 rounded-xl border px-3 py-2 text-sm"
            >
              <span className="text-muted-foreground">{t(`nutrition.nutrients.${key}`)}</span>
              <span className="font-medium">
                {formatNutrientValue(
                  totals[key],
                  key === "energyKcal" || key === "sodiumMg" ? 0 : 1,
                )}
                <span className="text-muted-foreground ml-1 text-xs">{NUTRIENT_UNITS[key]}</span>
              </span>
            </div>
          ))}
          {totals.missingCount > 0 ? (
            <div className="border-foreground/15 bg-muted/25 text-muted-foreground rounded-xl border border-dashed px-3 py-3 text-xs leading-5">
              {t("nutrition.dailyPlan.missingNutrition", {
                count: totals.missingCount,
              })}
            </div>
          ) : null}
          <section className="border-foreground/10 bg-background/70 rounded-2xl border p-3">
            <h4 className="text-sm font-semibold">
              {t("nutrition.dailyPlan.replacementSuggestions")}
            </h4>
            <p className="text-muted-foreground mt-1 text-xs leading-5">
              {t("nutrition.dailyPlan.replacementHint")}
            </p>
            <div className="mt-3 space-y-2">
              {replacementRecipes.length > 0 ? (
                replacementRecipes.map((entry) => (
                  <div
                    key={entry.recipe.id}
                    className="border-foreground/10 bg-muted/20 rounded-xl border px-3 py-2"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium">{entry.recipe.name}</div>
                        <div className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                          {entry.recipe.mealRoles
                            .map((role) => translateNutritionEnum(t, "mealRole", role))
                            .join(" / ")}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className="border-foreground/10 bg-background/70 text-[10px]"
                      >
                        {formatNutrientValue(entry.totals.energyKcal)}
                        <span className="ml-1">kcal</span>
                      </Badge>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {entry.recipe.tags.slice(0, 3).map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="border-foreground/10 bg-background/70 text-[10px]"
                        >
                          {tag}
                        </Badge>
                      ))}
                      {entry.reasons.map((reason) => (
                        <Badge
                          key={reason}
                          variant="outline"
                          className="border-foreground/10 bg-background/70 text-[10px]"
                        >
                          {t(`nutrition.dailyPlan.reasonLabels.${reason}`)}
                        </Badge>
                      ))}
                      {entry.totals.missingCount > 0 ? (
                        <Badge
                          variant="outline"
                          className="border-foreground/10 bg-muted text-muted-foreground text-[10px]"
                        >
                          {t("nutrition.dailyPlan.missingShort", {
                            count: entry.totals.missingCount,
                          })}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                ))
              ) : (
                <div className="border-foreground/15 text-muted-foreground rounded-xl border border-dashed px-3 py-4 text-center text-xs leading-5">
                  {t("nutrition.dailyPlan.noReplacement")}
                </div>
              )}
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  )
}

function buildSignalInsightDetail(
  signal: ReturnType<typeof buildDailyPlanSignals>[number],
  semanticCues: ReturnType<typeof buildNutritionSemanticCues>,
  t: ReturnType<typeof useTranslation>["t"],
) {
  if (signal.id === "sugar") {
    const wholeFruitCue = semanticCues.find((cue) => cue.id === "wholeFruitStable")
    const juiceCue = semanticCues.find((cue) => cue.id === "juiceDrinkPressure")

    if (wholeFruitCue && juiceCue) {
      return t("nutrition.dailyPlan.insights.sugar.withFruitAndJuice", {
        fruit: wholeFruitCue.names[0],
        juice: juiceCue.names[0],
      })
    }
  }

  if (signal.id === "protein") {
    const soyCue = semanticCues.find((cue) => cue.id === "soyProteinPresent")

    if (soyCue) {
      return t("nutrition.dailyPlan.insights.protein.withSoyAnchor", {
        food: soyCue.names[0],
      })
    }
  }

  if (signal.id === "sodium") {
    const pantryCue = semanticCues.find((cue) => cue.id === "pantrySodiumPressure")

    if (pantryCue) {
      return t("nutrition.dailyPlan.insights.sodium.withPantryPressure", {
        foods: pantryCue.names.slice(0, 2).join(" / "),
      })
    }
  }

  return t(`nutrition.dailyPlan.insights.${signal.id}.${signal.state}`)
}

function GapLine({
  detail,
  label,
  tone = "neutral",
  value,
}: {
  detail: string
  label: string
  tone?: "neutral" | "positive" | "warning"
  value: number | string
}) {
  const valueClassName =
    tone === "positive"
      ? "text-emerald-600 dark:text-emerald-400"
      : tone === "warning"
        ? "text-amber-600 dark:text-amber-400"
        : ""

  return (
    <div className="border-foreground/10 bg-muted/20 rounded-xl border px-3 py-2">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className={cn("font-semibold", valueClassName)}>{value}</span>
      </div>
      <p className="text-muted-foreground mt-1 text-xs leading-5">{detail}</p>
    </div>
  )
}

function formatSignalValue(signal: ReturnType<typeof buildDailyPlanSignals>[number]) {
  if (signal.id === "sodium") {
    return `${formatNutrientValue(signal.value)} mg`
  }

  return `${formatNutrientValue(signal.value, 1)} g`
}
