import type { TFunction } from "i18next"

import type {
  BodyFeedback,
  DailyPlan,
  DailyPlanEntry,
  FoodItem,
  FoodNutrientProfile,
  MealLog,
  MealScene,
  MealTrigger,
  NutritionModuleData,
  Recipe,
  ValueDensity,
} from "@/features/bettertolive/types"

// 稳定的业务枚举常量，语言无关；i18n 只负责展示。
export const NutritionBodyFeedback = {
  Satisfied: "满足舒服" as BodyFeedback,
  Normal: "普通" as BodyFeedback,
  Heavy: "偏重偏胀" as BodyFeedback,
  Uncomfortable: "不适" as BodyFeedback,
  WantsMore: "想再吃" as BodyFeedback,
} as const

export const NUTRITION_BODY_FEEDBACK_OPTIONS: BodyFeedback[] = [
  NutritionBodyFeedback.Satisfied,
  NutritionBodyFeedback.Normal,
  NutritionBodyFeedback.Heavy,
  NutritionBodyFeedback.Uncomfortable,
  NutritionBodyFeedback.WantsMore,
]

export const NutritionValueDensity = {
  High: "高" as ValueDensity,
  Medium: "中" as ValueDensity,
  Low: "低" as ValueDensity,
  NotWorthIt: "不划算" as ValueDensity,
} as const

export const NUTRITION_VALUE_DENSITY_OPTIONS: ValueDensity[] = [
  NutritionValueDensity.High,
  NutritionValueDensity.Medium,
  NutritionValueDensity.Low,
  NutritionValueDensity.NotWorthIt,
]

const NEEDS_CARE_BODY_FEEDBACK = new Set<BodyFeedback>([
  NutritionBodyFeedback.Heavy,
  NutritionBodyFeedback.Uncomfortable,
  NutritionBodyFeedback.WantsMore,
])

const NEEDS_CARE_VALUE_DENSITY = new Set<ValueDensity>([
  NutritionValueDensity.Low,
  NutritionValueDensity.NotWorthIt,
])

const NON_HUNGER_TRIGGERS = new Set<MealTrigger>(["情绪驱动", "习惯反射", "看到就想吃"])
const EXTERNAL_SCENES = new Set<MealScene>(["外卖", "路边/便利店", "旅行", "应酬/聚餐", "堂食"])
const HEAVY_SEASONING_HINTS = ["重盐", "汤底", "口渴", "火锅", "麻辣", "咸", "重口", "勾芡"]

export function logNeedsCare(
  bodyFeedback: BodyFeedback | undefined,
  valueDensity: ValueDensity | undefined,
) {
  return (
    NEEDS_CARE_BODY_FEEDBACK.has(bodyFeedback ?? ("" as BodyFeedback)) ||
    NEEDS_CARE_VALUE_DENSITY.has(valueDensity ?? ("" as ValueDensity))
  )
}

export type NutritionTotals = {
  energyKcal: number
  proteinG: number
  fatG: number
  saturatedFatG: number
  carbG: number
  fiberG: number
  sugarG: number
  addedSugarG: number
  sodiumMg: number
  calciumMg: number
  ironMg: number
  potassiumMg: number
  missingCount: number
}

export type NutrientKey = keyof Omit<NutritionTotals, "missingCount">
export type NutritionDailyPlanSignalId = "protein" | "fiber" | "sugar" | "sodium"
export type NutritionDailyPlanSignalState = "good" | "medium" | "low" | "high"
export type NutritionDailyPlanSignalTone = "positive" | "neutral" | "warning"
export type NutritionDailyPlanSignal = {
  id: NutritionDailyPlanSignalId
  state: NutritionDailyPlanSignalState
  tone: NutritionDailyPlanSignalTone
  value: number
}

export type NutritionRecipeSuggestionReason =
  | "proteinSupport"
  | "fiberSupport"
  | "soyProteinSupport"
  | "wholeFruitSupport"
  | "lightSupport"
  | "potassiumSupport"
  | "calciumSupport"
  | "lowerSugar"
  | "lowerSodium"

export type NutritionRecipeSuggestion = {
  recipe: Recipe
  totals: NutritionTotals
  reasons: NutritionRecipeSuggestionReason[]
  score: number
}

export type NutritionSemanticCueId =
  "wholeFruitStable" | "juiceDrinkPressure" | "soyProteinPresent" | "pantrySodiumPressure"

export type NutritionSemanticCue = {
  id: NutritionSemanticCueId
  tone: "positive" | "neutral" | "warning"
  names: string[]
}

export type NutritionLogFocusReasonId =
  | "balancedStructure"
  | "freeSugar"
  | "heavySodium"
  | "wholeFruit"
  | "juiceDrink"
  | "fruitWithSoy"
  | "pantrySodium"
  | "seasoning"
  | "processed"
  | "breakfastGap"
  | "externalGap"
  | "unstructuredExternal"
  | "juiceVsFruit"

type ResolvedFoodProfile = {
  food: FoodItem
  profile: FoodNutrientProfile
}

export const PRIMARY_NUTRIENT_KEYS = [
  "energyKcal",
  "proteinG",
  "fatG",
  "carbG",
  "fiberG",
  "sugarG",
  "sodiumMg",
] satisfies NutrientKey[]

export const QUALITY_NUTRIENT_KEYS = [
  "addedSugarG",
  "saturatedFatG",
  "calciumMg",
  "ironMg",
  "potassiumMg",
] satisfies NutrientKey[]

export const NUTRIENT_KEYS = [
  ...PRIMARY_NUTRIENT_KEYS,
  ...QUALITY_NUTRIENT_KEYS,
] satisfies NutrientKey[]

export const NUTRIENT_UNITS: Record<NutrientKey, string> = {
  energyKcal: "kcal",
  proteinG: "g",
  fatG: "g",
  saturatedFatG: "g",
  carbG: "g",
  fiberG: "g",
  sugarG: "g",
  addedSugarG: "g",
  sodiumMg: "mg",
  calciumMg: "mg",
  ironMg: "mg",
  potassiumMg: "mg",
}

export const NUTRIENT_FRACTION_DIGITS: Record<NutrientKey, number> = {
  energyKcal: 0,
  proteinG: 1,
  fatG: 1,
  saturatedFatG: 1,
  carbG: 1,
  fiberG: 1,
  sugarG: 1,
  addedSugarG: 1,
  sodiumMg: 0,
  calciumMg: 0,
  ironMg: 1,
  potassiumMg: 0,
}

export function getLocalDateKey(date = new Date()) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

export function findDailyPlanForDate(dailyPlans: DailyPlan[], dateKey = getLocalDateKey()) {
  return dailyPlans.find((plan) => plan.date === dateKey) ?? dailyPlans[0] ?? null
}

export const EMPTY_TOTALS: NutritionTotals = {
  energyKcal: 0,
  proteinG: 0,
  fatG: 0,
  saturatedFatG: 0,
  carbG: 0,
  fiberG: 0,
  sugarG: 0,
  addedSugarG: 0,
  sodiumMg: 0,
  calciumMg: 0,
  ironMg: 0,
  potassiumMg: 0,
  missingCount: 0,
}

const UNIT_GRAM_ESTIMATES: Record<string, number> = {
  个: 60,
  份: 100,
}

export function buildNutritionLookups(nutrition: NutritionModuleData) {
  return {
    foodById: new Map(nutrition.foods.map((food) => [food.id, food])),
    profileByFoodId: new Map(
      nutrition.nutrientProfiles.map((profile) => [profile.foodId, profile]),
    ),
    recipeById: new Map(nutrition.recipes.map((recipe) => [recipe.id, recipe])),
    categoryById: new Map(nutrition.foodCategories.map((category) => [category.id, category])),
  }
}

export function amountToBasisAmount(amount: number, unit: string, profile: FoodNutrientProfile) {
  const portionEstimate = profile.portionProfiles?.find(
    (portionProfile) => portionProfile.unit === unit,
  )?.estimatedGrams
  const normalizedAmount =
    unit === "个" || unit === "份"
      ? amount * (portionEstimate ?? UNIT_GRAM_ESTIMATES[unit] ?? 0)
      : amount

  if (profile.basisAmount === 0) {
    return 0
  }

  return normalizedAmount / profile.basisAmount
}

export function calculateFoodNutrition({
  amount,
  food,
  profile,
  unit,
}: {
  amount: number
  food: FoodItem
  profile?: FoodNutrientProfile
  unit: string
}): NutritionTotals {
  if (!food.nutrientProfileId || !profile) {
    return { ...EMPTY_TOTALS, missingCount: NUTRIENT_KEYS.length }
  }

  const ratio = amountToBasisAmount(amount, unit, profile)

  return {
    energyKcal: (profile.energyKcal ?? 0) * ratio,
    proteinG: (profile.proteinG ?? 0) * ratio,
    fatG: (profile.fatG ?? 0) * ratio,
    saturatedFatG: (profile.saturatedFatG ?? 0) * ratio,
    carbG: (profile.carbG ?? 0) * ratio,
    fiberG: (profile.fiberG ?? 0) * ratio,
    sugarG: (profile.sugarG ?? 0) * ratio,
    addedSugarG: (profile.addedSugarG ?? 0) * ratio,
    sodiumMg: (profile.sodiumMg ?? 0) * ratio,
    calciumMg: (profile.calciumMg ?? 0) * ratio,
    ironMg: (profile.ironMg ?? 0) * ratio,
    potassiumMg: (profile.potassiumMg ?? 0) * ratio,
    missingCount: NUTRIENT_KEYS.filter((key) => profile[key] === undefined).length,
  }
}

export function addNutritionTotals(base: NutritionTotals, next: NutritionTotals): NutritionTotals {
  return {
    energyKcal: base.energyKcal + next.energyKcal,
    proteinG: base.proteinG + next.proteinG,
    fatG: base.fatG + next.fatG,
    saturatedFatG: base.saturatedFatG + next.saturatedFatG,
    carbG: base.carbG + next.carbG,
    fiberG: base.fiberG + next.fiberG,
    sugarG: base.sugarG + next.sugarG,
    addedSugarG: base.addedSugarG + next.addedSugarG,
    sodiumMg: base.sodiumMg + next.sodiumMg,
    calciumMg: base.calciumMg + next.calciumMg,
    ironMg: base.ironMg + next.ironMg,
    potassiumMg: base.potassiumMg + next.potassiumMg,
    missingCount: base.missingCount + next.missingCount,
  }
}

export function calculateRecipeNutrition({
  foodById,
  profileByFoodId,
  recipe,
}: {
  foodById: Map<string, FoodItem>
  profileByFoodId: Map<string, FoodNutrientProfile>
  recipe: Recipe
}): NutritionTotals {
  return recipe.ingredients.reduce<NutritionTotals>((totals, ingredient) => {
    const food = foodById.get(ingredient.foodId)

    if (!food) {
      return addNutritionTotals(totals, { ...EMPTY_TOTALS, missingCount: 1 })
    }

    return addNutritionTotals(
      totals,
      calculateFoodNutrition({
        amount: ingredient.amount,
        food,
        profile: profileByFoodId.get(food.id),
        unit: ingredient.unit,
      }),
    )
  }, EMPTY_TOTALS)
}

export function calculateEntryNutrition({
  entry,
  foodById,
  profileByFoodId,
  recipeById,
}: {
  entry: DailyPlanEntry
  foodById: Map<string, FoodItem>
  profileByFoodId: Map<string, FoodNutrientProfile>
  recipeById: Map<string, Recipe>
}): NutritionTotals {
  if (entry.type === "text") {
    return { ...EMPTY_TOTALS, missingCount: 1 }
  }

  if (entry.type === "food") {
    const food = foodById.get(entry.foodId)

    if (!food) {
      return { ...EMPTY_TOTALS, missingCount: 1 }
    }

    return calculateFoodNutrition({
      amount: entry.amount,
      food,
      profile: profileByFoodId.get(food.id),
      unit: entry.unit,
    })
  }

  const recipe = recipeById.get(entry.recipeId)

  if (!recipe) {
    return { ...EMPTY_TOTALS, missingCount: 1 }
  }

  const recipeTotals = calculateRecipeNutrition({ foodById, profileByFoodId, recipe })
  const servingRatio = recipe.servings === 0 ? 0 : entry.servings / recipe.servings

  return {
    energyKcal: recipeTotals.energyKcal * servingRatio,
    proteinG: recipeTotals.proteinG * servingRatio,
    fatG: recipeTotals.fatG * servingRatio,
    saturatedFatG: recipeTotals.saturatedFatG * servingRatio,
    carbG: recipeTotals.carbG * servingRatio,
    fiberG: recipeTotals.fiberG * servingRatio,
    sugarG: recipeTotals.sugarG * servingRatio,
    addedSugarG: recipeTotals.addedSugarG * servingRatio,
    sodiumMg: recipeTotals.sodiumMg * servingRatio,
    calciumMg: recipeTotals.calciumMg * servingRatio,
    ironMg: recipeTotals.ironMg * servingRatio,
    potassiumMg: recipeTotals.potassiumMg * servingRatio,
    missingCount: recipeTotals.missingCount,
  }
}

export function calculateDailyPlanNutrition({
  foodById,
  plan,
  profileByFoodId,
  recipeById,
}: {
  foodById: Map<string, FoodItem>
  plan: DailyPlan
  profileByFoodId: Map<string, FoodNutrientProfile>
  recipeById: Map<string, Recipe>
}): NutritionTotals {
  return plan.slots.reduce<NutritionTotals>(
    (slotTotals, slot) =>
      slot.entries.reduce<NutritionTotals>(
        (entryTotals, entry) =>
          addNutritionTotals(
            entryTotals,
            calculateEntryNutrition({ entry, foodById, profileByFoodId, recipeById }),
          ),
        slotTotals,
      ),
    EMPTY_TOTALS,
  )
}

export function formatNutrientValue(value: number, digits = 0) {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  }).format(value)
}

export function formatEntryTitle({
  entry,
  foodById,
  recipeById,
  servingLabel,
  unitLabel,
}: {
  entry: DailyPlanEntry
  foodById: Map<string, FoodItem>
  recipeById: Map<string, Recipe>
  servingLabel: string
  unitLabel?: (unit: string) => string
}) {
  if (entry.type === "text") {
    return entry.title
  }

  if (entry.type === "food") {
    const food = foodById.get(entry.foodId)
    return food
      ? `${food.name} · ${entry.amount}${unitLabel?.(entry.unit) ?? entry.unit}`
      : entry.foodId
  }

  const recipe = recipeById.get(entry.recipeId)
  return recipe ? `${recipe.name} · ${entry.servings} ${servingLabel}` : entry.recipeId
}

export function buildDailyPlanSignals({
  foodById,
  plan,
  profileByFoodId,
  recipeById,
}: {
  foodById: Map<string, FoodItem>
  plan: DailyPlan
  profileByFoodId: Map<string, FoodNutrientProfile>
  recipeById: Map<string, Recipe>
}) {
  const totals = calculateDailyPlanNutrition({
    foodById,
    plan,
    profileByFoodId,
    recipeById,
  })
  const profiles = collectPlanProfiles(plan, profileByFoodId, recipeById)
  const primaryProteinCount = profiles.filter((profile) =>
    isPrimaryProteinSource(profile.proteinSource),
  ).length
  const freeSugarCount = profiles.filter((profile) => isFreeSugarRisk(profile)).length
  const highSodiumCount = profiles.filter((profile) => isHighSodiumRisk(profile)).length
  const highlyProcessedCount = profiles.filter(
    (profile) => profile.processingLevel === "高度加工",
  ).length

  const proteinSignal: NutritionDailyPlanSignal = {
    id: "protein",
    state:
      totals.proteinG >= 45 && primaryProteinCount >= 2
        ? "good"
        : totals.proteinG >= 24 && primaryProteinCount >= 1
          ? "medium"
          : "low",
    tone:
      totals.proteinG >= 45 && primaryProteinCount >= 2
        ? "positive"
        : totals.proteinG >= 24 && primaryProteinCount >= 1
          ? "neutral"
          : "warning",
    value: totals.proteinG,
  }

  const fiberSignal: NutritionDailyPlanSignal = {
    id: "fiber",
    state:
      totals.fiberG >= 18 && totals.potassiumMg >= 1200
        ? "good"
        : totals.fiberG >= 10
          ? "medium"
          : "low",
    tone:
      totals.fiberG >= 18 && totals.potassiumMg >= 1200
        ? "positive"
        : totals.fiberG >= 10
          ? "neutral"
          : "warning",
    value: totals.fiberG,
  }

  const sugarSignal: NutritionDailyPlanSignal = {
    id: "sugar",
    state:
      totals.addedSugarG >= 20 || freeSugarCount >= 2
        ? "high"
        : totals.addedSugarG >= 8 || freeSugarCount >= 1
          ? "medium"
          : "good",
    tone:
      totals.addedSugarG >= 20 || freeSugarCount >= 2
        ? "warning"
        : totals.addedSugarG >= 8 || freeSugarCount >= 1
          ? "neutral"
          : "positive",
    value: totals.addedSugarG,
  }

  const sodiumSignal: NutritionDailyPlanSignal = {
    id: "sodium",
    state:
      totals.sodiumMg >= 1800 || highSodiumCount >= 2
        ? "high"
        : totals.sodiumMg >= 900 || highSodiumCount >= 1 || highlyProcessedCount >= 1
          ? "medium"
          : "good",
    tone:
      totals.sodiumMg >= 1800 || highSodiumCount >= 2
        ? "warning"
        : totals.sodiumMg >= 900 || highSodiumCount >= 1 || highlyProcessedCount >= 1
          ? "neutral"
          : "positive",
    value: totals.sodiumMg,
  }

  return [proteinSignal, fiberSignal, sugarSignal, sodiumSignal]
}

export function buildReplacementSuggestions({
  foodById,
  plan,
  profileByFoodId,
  recipeById,
  recipes,
}: {
  foodById: Map<string, FoodItem>
  plan: DailyPlan
  profileByFoodId: Map<string, FoodNutrientProfile>
  recipeById: Map<string, Recipe>
  recipes: Recipe[]
}) {
  const plannedRecipeIds = new Set(
    plan.slots.flatMap((slot) =>
      slot.entries.flatMap((entry) => (entry.type === "recipe" ? [entry.recipeId] : [])),
    ),
  )
  const planMealRoles = new Set(plan.slots.map((slot) => slot.structure))
  const signalMap = new Map(
    buildDailyPlanSignals({ foodById, plan, profileByFoodId, recipeById }).map((signal) => [
      signal.id,
      signal,
    ]),
  )
  const needsProtein = signalMap.get("protein")?.state !== "good"
  const needsFiber = signalMap.get("fiber")?.state !== "good"
  const needsSugarRelief = signalMap.get("sugar")?.state !== "good"
  const needsSodiumRelief = signalMap.get("sodium")?.state !== "good"

  return recipes
    .filter((recipe) => recipe.repeatability !== "只想记录" && !plannedRecipeIds.has(recipe.id))
    .map((recipe): NutritionRecipeSuggestion => {
      const totals = calculateRecipeNutrition({ foodById, profileByFoodId, recipe })
      const profiles = collectRecipeProfiles(recipe, profileByFoodId)
      const reasons: NutritionRecipeSuggestionReason[] = []
      let score = recipe.repeatability === "常做" ? 12 : 6

      const matchingMealRoles = recipe.mealRoles.filter((role) => planMealRoles.has(role))
      if (matchingMealRoles.length > 0) {
        score += 40
      }

      if (needsProtein && totals.proteinG >= 20 && hasPrimaryProteinSource(profiles)) {
        reasons.push("proteinSupport")
        score += 60
      } else if (totals.proteinG >= 18 && hasPrimaryProteinSource(profiles)) {
        reasons.push("proteinSupport")
        score += 24
      }

      if (needsFiber && totals.fiberG >= 5) {
        reasons.push("fiberSupport")
        score += 52
      } else if (totals.fiberG >= 4) {
        reasons.push("fiberSupport")
        score += 20
      }

      if (
        needsProtein &&
        profiles.some(
          (profile) => profile.proteinSource === "豆制品" || profile.proteinSource === "豆类",
        )
      ) {
        reasons.push("soyProteinSupport")
        score += 18
      }

      if (
        needsSugarRelief &&
        collectResolvedRecipeProfiles(recipe, foodById, profileByFoodId).some(
          ({ food, profile }) =>
            (food.name.includes("苹果") || food.name.includes("香蕉")) &&
            profile.sugarKind === "天然存在",
        )
      ) {
        reasons.push("wholeFruitSupport")
        score += 16
      }

      if (needsSugarRelief && totals.addedSugarG <= 4) {
        reasons.push("lowerSugar")
        score += 26
      }

      if (needsSodiumRelief && totals.sodiumMg <= 600) {
        reasons.push("lowerSodium")
        score += 26
      }

      if (totals.addedSugarG <= 5 && totals.sodiumMg <= 700 && !hasHighlyProcessedRisk(profiles)) {
        reasons.push("lightSupport")
        score += needsSugarRelief || needsSodiumRelief ? 34 : 18
      }

      if (totals.potassiumMg >= 500) {
        reasons.push("potassiumSupport")
        score += needsFiber ? 18 : 10
      }

      if (totals.calciumMg >= 180) {
        reasons.push("calciumSupport")
        score += needsProtein ? 14 : 8
      }

      score -= totals.missingCount * 28

      if (totals.addedSugarG >= 12) {
        score -= 18
      }
      if (totals.sodiumMg >= 1000) {
        score -= 18
      }
      if (hasHighlyProcessedRisk(profiles)) {
        score -= 14
      }

      return {
        recipe,
        totals,
        reasons: dedupeReasons(reasons).slice(0, 3),
        score,
      }
    })
    .sort(
      (left, right) =>
        right.score - left.score ||
        left.totals.missingCount - right.totals.missingCount ||
        left.recipe.name.localeCompare(right.recipe.name),
    )
    .slice(0, 3)
}

export function buildNutritionSemanticCues({
  foodById,
  plan,
  profileByFoodId,
  recipeById,
}: {
  foodById: Map<string, FoodItem>
  plan: DailyPlan
  profileByFoodId: Map<string, FoodNutrientProfile>
  recipeById: Map<string, Recipe>
}) {
  const resolvedEntries = collectResolvedPlanProfiles({
    foodById,
    plan,
    profileByFoodId,
    recipeById,
  })
  const fruitFoods = resolvedEntries.filter(({ food, profile }) =>
    isWholeFruitCandidate(food, profile),
  )
  const juiceFoods = resolvedEntries.filter(({ food, profile }) =>
    isJuiceDrinkCandidate(food, profile),
  )
  const soyProteinFoods = resolvedEntries.filter(({ profile }) => isSoyProteinCandidate(profile))
  const pantrySodiumFoods = resolvedEntries.filter(({ food, profile }) =>
    isPantrySodiumCandidate(food, profile),
  )

  return [
    fruitFoods.length > 0
      ? {
          id: "wholeFruitStable",
          tone: "positive",
          names: uniqueFoodNames(fruitFoods),
        }
      : null,
    juiceFoods.length > 0
      ? {
          id: "juiceDrinkPressure",
          tone: "warning",
          names: uniqueFoodNames(juiceFoods),
        }
      : null,
    soyProteinFoods.length > 0
      ? {
          id: "soyProteinPresent",
          tone: "positive",
          names: uniqueFoodNames(soyProteinFoods),
        }
      : null,
    pantrySodiumFoods.length > 0
      ? {
          id: "pantrySodiumPressure",
          tone: "warning",
          names: uniqueFoodNames(pantrySodiumFoods),
        }
      : null,
  ].filter((entry): entry is NutritionSemanticCue => entry !== null)
}

export function resolveEntryFoodProfiles({
  entry,
  foodById,
  profileByFoodId,
  recipeById,
}: {
  entry: DailyPlanEntry
  foodById: Map<string, FoodItem>
  profileByFoodId: Map<string, FoodNutrientProfile>
  recipeById: Map<string, Recipe>
}) {
  return collectResolvedEntryProfiles({ entry, foodById, profileByFoodId, recipeById })
}

export function hasWholeFruitFood(entries: ResolvedFoodProfile[]) {
  return entries.some(({ food, profile }) => isWholeFruitCandidate(food, profile))
}

export function hasJuiceDrinkFood(entries: ResolvedFoodProfile[]) {
  return entries.some(({ food, profile }) => isJuiceDrinkCandidate(food, profile))
}

export function hasPantrySodiumFood(entries: ResolvedFoodProfile[]) {
  return entries.some(({ food, profile }) => isPantrySodiumCandidate(food, profile))
}

export function hasSoyProteinFood(entries: ResolvedFoodProfile[]) {
  return entries.some(({ profile }) => isSoyProteinCandidate(profile))
}

export function summarizeLogFoodSemantics({
  entryLog,
  foodById,
  profileByFoodId,
  recipeById,
}: {
  entryLog: MealLog
  foodById: Map<string, FoodItem>
  profileByFoodId: Map<string, FoodNutrientProfile>
  recipeById: Map<string, Recipe>
}) {
  const resolvedEntries = entryLog.entries.flatMap((entry) =>
    collectResolvedEntryProfiles({ entry, foodById, profileByFoodId, recipeById }),
  )
  const addedSugarTotal = entryLog.entries.reduce(
    (current, entry) =>
      calculateEntryNutrition({
        entry,
        foodById,
        profileByFoodId,
        recipeById,
      }).addedSugarG + current,
    0,
  )

  return {
    resolvedEntries,
    hasWholeFruit: hasWholeFruitFood(resolvedEntries),
    hasJuiceDrink: hasJuiceDrinkFood(resolvedEntries),
    hasPantrySodium: hasPantrySodiumFood(resolvedEntries),
    hasSoyProtein: hasSoyProteinFood(resolvedEntries),
    addedSugarTotal,
  }
}

function collectPlanProfiles(
  plan: DailyPlan,
  profileByFoodId: Map<string, FoodNutrientProfile>,
  recipeById: Map<string, Recipe>,
) {
  return plan.slots.flatMap((slot) =>
    slot.entries.flatMap((entry) => collectEntryProfiles(entry, profileByFoodId, recipeById)),
  )
}

function collectResolvedPlanProfiles({
  foodById,
  plan,
  profileByFoodId,
  recipeById,
}: {
  foodById: Map<string, FoodItem>
  plan: DailyPlan
  profileByFoodId: Map<string, FoodNutrientProfile>
  recipeById: Map<string, Recipe>
}) {
  return plan.slots.flatMap((slot) =>
    slot.entries.flatMap((entry) =>
      collectResolvedEntryProfiles({ entry, foodById, profileByFoodId, recipeById }),
    ),
  )
}

function collectEntryProfiles(
  entry: DailyPlanEntry,
  profileByFoodId: Map<string, FoodNutrientProfile>,
  recipeById: Map<string, Recipe>,
) {
  if (entry.type === "food") {
    const profile = profileByFoodId.get(entry.foodId)
    return profile ? [profile] : []
  }

  if (entry.type === "recipe") {
    const recipe = recipeById.get(entry.recipeId)
    return recipe ? collectRecipeProfiles(recipe, profileByFoodId) : []
  }

  return []
}

function collectResolvedEntryProfiles({
  entry,
  foodById,
  profileByFoodId,
  recipeById,
}: {
  entry: DailyPlanEntry
  foodById: Map<string, FoodItem>
  profileByFoodId: Map<string, FoodNutrientProfile>
  recipeById: Map<string, Recipe>
}) {
  if (entry.type === "food") {
    const food = foodById.get(entry.foodId)
    const profile = profileByFoodId.get(entry.foodId)
    return food && profile ? [{ food, profile }] : []
  }

  if (entry.type === "recipe") {
    const recipe = recipeById.get(entry.recipeId)
    return recipe ? collectResolvedRecipeProfiles(recipe, foodById, profileByFoodId) : []
  }

  return []
}

function collectRecipeProfiles(recipe: Recipe, profileByFoodId: Map<string, FoodNutrientProfile>) {
  return recipe.ingredients.flatMap((ingredient) => {
    const profile = profileByFoodId.get(ingredient.foodId)
    return profile ? [profile] : []
  })
}

function collectResolvedRecipeProfiles(
  recipe: Recipe,
  foodById: Map<string, FoodItem>,
  profileByFoodId: Map<string, FoodNutrientProfile>,
) {
  return recipe.ingredients.flatMap((ingredient) => {
    const food = foodById.get(ingredient.foodId)
    const profile = profileByFoodId.get(ingredient.foodId)

    return food && profile ? [{ food, profile }] : []
  })
}

function isPrimaryProteinSource(proteinSource: FoodNutrientProfile["proteinSource"]) {
  return Boolean(proteinSource && proteinSource !== "加工肉")
}

function hasPrimaryProteinSource(profiles: FoodNutrientProfile[]) {
  return profiles.some((profile) => isPrimaryProteinSource(profile.proteinSource))
}

function isFreeSugarRisk(profile: FoodNutrientProfile) {
  return profile.sugarKind === "游离糖/添加糖" || (profile.addedSugarG ?? 0) >= 8
}

function isHighSodiumRisk(profile: FoodNutrientProfile) {
  return profile.sodiumRiskLevel === "高" || (profile.sodiumMg ?? 0) >= 600
}

function hasHighlyProcessedRisk(profiles: FoodNutrientProfile[]) {
  return profiles.some((profile) => profile.processingLevel === "高度加工")
}

function dedupeReasons(reasons: NutritionRecipeSuggestionReason[]) {
  return Array.from(new Set(reasons))
}

function uniqueFoodNames(entries: ResolvedFoodProfile[]) {
  return Array.from(new Set(entries.map(({ food }) => food.name)))
}

function isWholeFruitCandidate(food: FoodItem, profile: FoodNutrientProfile) {
  return (
    food.name.includes("苹果") ||
    food.name.includes("香蕉") ||
    (food.categoryIds.includes("cat-produce") &&
      profile.sugarKind === "天然存在" &&
      profile.processingLevel === "原食材" &&
      profile.basisUnit === "g")
  )
}

function isJuiceDrinkCandidate(food: FoodItem, profile: FoodNutrientProfile) {
  return (
    food.name.includes("果汁") ||
    (profile.sugarKind === "游离糖/添加糖" && food.lifecycle === "饮品")
  )
}

function isPantrySodiumCandidate(food: FoodItem, profile: FoodNutrientProfile) {
  return (
    isHighSodiumRisk(profile) &&
    (food.name.includes("咸菜") ||
      food.name.includes("午餐肉") ||
      food.name.includes("酱油") ||
      food.name.includes("方便面"))
  )
}

function isSoyProteinCandidate(profile: FoodNutrientProfile) {
  return profile.proteinSource === "豆制品" || profile.proteinSource === "豆类"
}

export function buildNutritionWeeklyReview({
  nutrition,
  t,
}: {
  nutrition: NutritionModuleData
  t: TFunction
}): NutritionModuleData["weeklyReview"] {
  const lookups = buildNutritionLookups(nutrition)
  const logSummaries = nutrition.mealLogs.map((log) =>
    summarizeMealLog({
      log,
      foodById: lookups.foodById,
      profileByFoodId: lookups.profileByFoodId,
      recipeById: lookups.recipeById,
    }),
  )

  const balancedLogs = logSummaries.filter(
    (summary) =>
      summary.isBalancedStructure && summary.log.bodyFeedback === NutritionBodyFeedback.Satisfied,
  )
  const homeStableLogs = logSummaries.filter((summary) => summary.isHomeStable)
  const sweetTriggerLogs = logSummaries.filter((summary) => summary.isNonHungerSweet)
  const sodiumPressureLogs = logSummaries.filter(
    (summary) =>
      summary.hasHighSodiumPressure && summary.log.bodyFeedback === NutritionBodyFeedback.Heavy,
  )
  const wholeFruitStableLogs = logSummaries.filter((summary) => summary.hasWholeFruitStable)
  const juiceDrinkPressureLogs = logSummaries.filter((summary) => summary.hasJuiceDrinkPressure)
  const pantrySodiumLogs = logSummaries.filter((summary) => summary.hasPantrySodiumPressure)
  const breakfastLogs = logSummaries.filter((summary) => inferMealRole(summary.log) === "早餐")
  const breakfastStableLogs = breakfastLogs.filter((summary) => summary.isBalancedStructure)
  const externalGapLogs = logSummaries.filter((summary) => summary.isExternalGap)
  const unstructuredHeavyLogs = logSummaries.filter(
    (summary) => !summary.hasStructuredEntries && summary.hasHighSodiumPressure,
  )

  const highlights = [
    balancedLogs.length >= 2
      ? {
          id: "derived-balanced-structure",
          title: t("nutrition.logs.derived.highlights.balancedStructure.title"),
          summary: t("nutrition.logs.derived.highlights.balancedStructure.summary", {
            count: balancedLogs.length,
          }),
          evidence: balancedLogs.map((summary) => summary.log.id),
        }
      : null,
    sweetTriggerLogs.length > 0
      ? {
          id: "derived-sweet-trigger",
          title: t("nutrition.logs.derived.highlights.sweetTrigger.title"),
          summary: t("nutrition.logs.derived.highlights.sweetTrigger.summary", {
            count: sweetTriggerLogs.length,
          }),
          evidence: sweetTriggerLogs.map((summary) => summary.log.id),
        }
      : null,
    sodiumPressureLogs.length > 0
      ? {
          id: "derived-sodium-pressure",
          title: t("nutrition.logs.derived.highlights.sodiumPressure.title"),
          summary: t("nutrition.logs.derived.highlights.sodiumPressure.summary", {
            count: sodiumPressureLogs.length,
          }),
          evidence: sodiumPressureLogs.map((summary) => summary.log.id),
        }
      : null,
    homeStableLogs.length >= 2
      ? {
          id: "derived-home-stable",
          title: t("nutrition.logs.derived.highlights.homeStable.title"),
          summary: t("nutrition.logs.derived.highlights.homeStable.summary", {
            count: homeStableLogs.length,
          }),
          evidence: homeStableLogs.map((summary) => summary.log.id),
        }
      : null,
    wholeFruitStableLogs.length > 0
      ? {
          id: "derived-whole-fruit-stable",
          title: t("nutrition.logs.derived.highlights.wholeFruitStable.title"),
          summary: t("nutrition.logs.derived.highlights.wholeFruitStable.summary", {
            count: wholeFruitStableLogs.length,
          }),
          evidence: wholeFruitStableLogs.map((summary) => summary.log.id),
        }
      : null,
    pantrySodiumLogs.length > 0
      ? {
          id: "derived-pantry-sodium",
          title: t("nutrition.logs.derived.highlights.pantrySodium.title"),
          summary: t("nutrition.logs.derived.highlights.pantrySodium.summary", {
            count: pantrySodiumLogs.length,
          }),
          evidence: pantrySodiumLogs.map((summary) => summary.log.id),
        }
      : null,
  ].filter(
    (entry): entry is NutritionModuleData["weeklyReview"]["highlights"][number] => entry !== null,
  )

  const missingSignals = [
    breakfastLogs.length > 1 && breakfastStableLogs.length < breakfastLogs.length
      ? {
          id: "missing-breakfast-structure",
          label: t("nutrition.logs.derived.missingSignals.breakfast"),
          evidence: breakfastLogs
            .filter((summary) => !summary.isBalancedStructure)
            .map((summary) => summary.log.id),
        }
      : null,
    externalGapLogs.length >= 2
      ? {
          id: "missing-external-gap",
          label: t("nutrition.logs.derived.missingSignals.externalGap"),
          evidence: externalGapLogs.map((summary) => summary.log.id),
        }
      : null,
    unstructuredHeavyLogs.length > 0
      ? {
          id: "missing-unstructured-external",
          label: t("nutrition.logs.derived.missingSignals.unstructuredExternal"),
          evidence: unstructuredHeavyLogs.map((summary) => summary.log.id),
        }
      : null,
    juiceDrinkPressureLogs.length > 0
      ? {
          id: "missing-juice-vs-fruit",
          label: t("nutrition.logs.derived.missingSignals.juiceVsFruit"),
          evidence: juiceDrinkPressureLogs.map((summary) => summary.log.id),
        }
      : null,
  ].filter(
    (entry): entry is NutritionModuleData["weeklyReview"]["missingSignals"][number] =>
      entry !== null,
  )

  const crossViews = [
    buildSignalFeedbackCrossView(logSummaries, t),
    buildGapSceneCrossView(logSummaries, t),
    buildFruitSugarCrossView(logSummaries, t),
    buildPantrySodiumCrossView(logSummaries, t),
  ].filter((entry): entry is NonNullable<typeof entry> => entry !== null)

  return {
    highlights,
    missingSignals,
    crossViews,
  }
}

export function buildLogFocusReasonIds({
  foodById,
  log,
  profileByFoodId,
  recipeById,
  reviewFocus,
}: {
  foodById: Map<string, FoodItem>
  log: MealLog
  profileByFoodId: Map<string, FoodNutrientProfile>
  recipeById: Map<string, Recipe>
  reviewFocus:
    | {
        kind: "highlight"
        id: string
        evidence: string[]
      }
    | {
        kind: "missingSignal"
        id: string
        evidence: string[]
      }
    | {
        kind: "crossViewRow"
        id: string
        evidence: string[]
      }
    | null
}): NutritionLogFocusReasonId[] {
  if (!reviewFocus || !reviewFocus.evidence.includes(log.id)) {
    return []
  }

  const semantics = summarizeLogFoodSemantics({
    entryLog: log,
    foodById,
    profileByFoodId,
    recipeById,
  })
  const summary = summarizeMealLog({
    foodById,
    log,
    profileByFoodId,
    recipeById,
  })
  const isBreakfastGap = inferMealRole(log) === "早餐" && summary.hasStructureGap
  const isUnstructuredExternal =
    EXTERNAL_SCENES.has(log.scene ?? ("" as MealScene)) && !summary.hasStructuredEntries

  switch (reviewFocus.kind) {
    case "highlight":
      if (reviewFocus.id === "derived-whole-fruit-stable") {
        return ["wholeFruit"]
      }
      if (reviewFocus.id === "derived-pantry-sodium") {
        return ["pantrySodium", "processed"]
      }
      if (reviewFocus.id === "derived-sodium-pressure") {
        return ["heavySodium"]
      }
      if (reviewFocus.id === "derived-sweet-trigger") {
        return ["freeSugar"]
      }
      if (reviewFocus.id === "derived-balanced-structure") {
        return ["balancedStructure"]
      }
      return []
    case "missingSignal":
      if (reviewFocus.id === "missing-breakfast-structure" && isBreakfastGap) {
        return ["breakfastGap"]
      }
      if (reviewFocus.id === "missing-external-gap" && summary.isExternalGap) {
        return ["externalGap"]
      }
      if (reviewFocus.id === "missing-unstructured-external" && isUnstructuredExternal) {
        return ["unstructuredExternal"]
      }
      if (reviewFocus.id === "missing-juice-vs-fruit" && semantics.hasJuiceDrink) {
        return semantics.hasWholeFruit
          ? ["juiceVsFruit", "wholeFruit"]
          : ["juiceVsFruit", "juiceDrink"]
      }
      return []
    case "crossViewRow":
      if (reviewFocus.id.endsWith("balanced")) {
        return ["balancedStructure"]
      }
      if (reviewFocus.id.endsWith("free-sugar")) {
        return semantics.addedSugarTotal >= 8 ? ["freeSugar"] : ["juiceDrink"]
      }
      if (reviewFocus.id.endsWith("heavy-sodium")) {
        return ["heavySodium"]
      }
      if (reviewFocus.id.endsWith("whole-fruit")) {
        return ["wholeFruit"]
      }
      if (reviewFocus.id.endsWith("juice-drink")) {
        return ["juiceDrink"]
      }
      if (reviewFocus.id.endsWith("fruit-with-soy")) {
        return ["wholeFruit", "fruitWithSoy"]
      }
      if (reviewFocus.id.endsWith("overall")) {
        return ["pantrySodium"]
      }
      if (reviewFocus.id.endsWith("seasoning")) {
        return ["seasoning"]
      }
      if (reviewFocus.id.endsWith("processed")) {
        return ["processed"]
      }
      return []
    default:
      return []
  }
}

type NutritionLogSummary = {
  log: MealLog
  totals: NutritionTotals
  hasStructuredEntries: boolean
  resolvedEntries: ResolvedFoodProfile[]
  hasProteinAnchor: boolean
  hasFiberSupport: boolean
  hasHighSugarRisk: boolean
  hasHighSodiumRisk: boolean
  hasHighSodiumPressure: boolean
  isBalancedStructure: boolean
  isHomeStable: boolean
  isNonHungerSweet: boolean
  hasStructureGap: boolean
  isExternalGap: boolean
  hasWholeFruitStable: boolean
  hasJuiceDrinkPressure: boolean
  hasPantrySodiumPressure: boolean
  hasSoyProteinAnchor: boolean
}

function summarizeMealLog({
  foodById,
  log,
  profileByFoodId,
  recipeById,
}: {
  foodById: Map<string, FoodItem>
  log: MealLog
  profileByFoodId: Map<string, FoodNutrientProfile>
  recipeById: Map<string, Recipe>
}) {
  const totals = log.entries.reduce<NutritionTotals>(
    (currentTotals, entry) =>
      addNutritionTotals(
        currentTotals,
        calculateEntryNutrition({
          entry,
          foodById,
          profileByFoodId,
          recipeById,
        }),
      ),
    EMPTY_TOTALS,
  )
  const profiles = log.entries.flatMap((entry) =>
    collectEntryProfiles(entry, profileByFoodId, recipeById),
  )
  const resolvedEntries = log.entries.flatMap((entry) =>
    collectResolvedEntryProfiles({ entry, foodById, profileByFoodId, recipeById }),
  )
  const hasStructuredEntries = log.entries.some((entry) => entry.type !== "text")
  const hasProteinAnchor =
    hasStructuredEntries && totals.proteinG >= 16 && hasPrimaryProteinSource(profiles)
  const hasFiberSupport = hasStructuredEntries && (totals.fiberG >= 4 || totals.potassiumMg >= 450)
  const hasHighSugarRisk =
    totals.addedSugarG >= 8 || profiles.some((profile) => isFreeSugarRisk(profile))
  const hasHighSodiumRisk =
    totals.sodiumMg >= 800 || profiles.some((profile) => isHighSodiumRisk(profile))
  const hasHighSodiumPressure = hasHighSodiumRisk || matchesHeavySeasoningHint(log)
  const hasWholeFruitStable =
    hasStructuredEntries &&
    resolvedEntries.some(({ food, profile }) => isWholeFruitCandidate(food, profile)) &&
    !resolvedEntries.some(({ food, profile }) => isJuiceDrinkCandidate(food, profile))
  const hasJuiceDrinkPressure = resolvedEntries.some(({ food, profile }) =>
    isJuiceDrinkCandidate(food, profile),
  )
  const hasPantrySodiumPressure = resolvedEntries.some(({ food, profile }) =>
    isPantrySodiumCandidate(food, profile),
  )
  const hasSoyProteinAnchor =
    hasStructuredEntries && resolvedEntries.some(({ profile }) => isSoyProteinCandidate(profile))
  const isBalancedStructure =
    hasStructuredEntries &&
    hasProteinAnchor &&
    hasFiberSupport &&
    !hasHighSugarRisk &&
    !hasHighSodiumPressure
  const isHomeStable =
    log.scene === "在家做" &&
    log.bodyFeedback === NutritionBodyFeedback.Satisfied &&
    hasStructuredEntries
  const isNonHungerSweet =
    hasHighSugarRisk && NON_HUNGER_TRIGGERS.has(log.trigger ?? ("" as MealTrigger))
  const hasStructureGap = !hasStructuredEntries || !hasProteinAnchor || !hasFiberSupport
  const isExternalGap = EXTERNAL_SCENES.has(log.scene ?? ("" as MealScene)) && hasStructureGap

  return {
    log,
    totals,
    hasStructuredEntries,
    resolvedEntries,
    hasProteinAnchor,
    hasFiberSupport,
    hasHighSugarRisk,
    hasHighSodiumRisk,
    hasHighSodiumPressure,
    isBalancedStructure,
    isHomeStable,
    isNonHungerSweet,
    hasStructureGap,
    isExternalGap,
    hasWholeFruitStable,
    hasJuiceDrinkPressure,
    hasPantrySodiumPressure,
    hasSoyProteinAnchor,
  } satisfies NutritionLogSummary
}

function buildSignalFeedbackCrossView(logSummaries: NutritionLogSummary[], t: TFunction) {
  const rows = [
    createCrossViewRow(
      "signal-feedback:balanced",
      t("nutrition.logs.derived.crossViews.signalFeedback.rows.balanced"),
      logSummaries.filter((summary) => summary.isBalancedStructure),
    ),
    createCrossViewRow(
      "signal-feedback:free-sugar",
      t("nutrition.logs.derived.crossViews.signalFeedback.rows.freeSugar"),
      logSummaries.filter((summary) => summary.hasHighSugarRisk),
    ),
    createCrossViewRow(
      "signal-feedback:heavy-sodium",
      t("nutrition.logs.derived.crossViews.signalFeedback.rows.heavySodium"),
      logSummaries.filter((summary) => summary.hasHighSodiumPressure),
    ),
  ].filter((entry): entry is NonNullable<typeof entry> => entry !== null)

  if (rows.length === 0) {
    return null
  }

  return {
    id: "derived-signal-feedback",
    title: t("nutrition.logs.derived.crossViews.signalFeedback.title"),
    summary: t("nutrition.logs.derived.crossViews.signalFeedback.summary"),
    rows,
  }
}

function buildGapSceneCrossView(logSummaries: NutritionLogSummary[], t: TFunction) {
  const grouped = groupSummariesByScene(logSummaries.filter((summary) => summary.isExternalGap))

  if (grouped.length === 0) {
    return null
  }

  return {
    id: "derived-gap-scenes",
    title: t("nutrition.logs.derived.crossViews.gapScenes.title"),
    summary: t("nutrition.logs.derived.crossViews.gapScenes.summary"),
    rows: grouped.map(([scene, entries]) => ({
      id: `gap-scene:${scene}`,
      label: t(`nutrition.enum.scene.${scene}`),
      count: entries.length,
      evidence: entries.map((entry) => entry.log.id),
      bodyFeedback: dominantValue(entries.map((entry) => entry.log.bodyFeedback)),
    })),
  }
}

function buildFruitSugarCrossView(logSummaries: NutritionLogSummary[], t: TFunction) {
  const rows = [
    createCrossViewRow(
      "fruit-sugar:whole-fruit",
      t("nutrition.logs.derived.crossViews.fruitSugar.rows.wholeFruit"),
      logSummaries.filter((summary) => summary.hasWholeFruitStable),
      { includeValueDensity: true },
    ),
    createCrossViewRow(
      "fruit-sugar:juice-drink",
      t("nutrition.logs.derived.crossViews.fruitSugar.rows.juiceDrink"),
      logSummaries.filter((summary) => summary.hasJuiceDrinkPressure),
      { includeValueDensity: true },
    ),
    createCrossViewRow(
      "fruit-sugar:fruit-with-soy",
      t("nutrition.logs.derived.crossViews.fruitSugar.rows.fruitWithSoy"),
      logSummaries.filter((summary) => summary.hasWholeFruitStable && summary.hasSoyProteinAnchor),
      { includeValueDensity: true },
    ),
  ].filter((entry): entry is NonNullable<typeof entry> => entry !== null)

  if (rows.length === 0) {
    return null
  }

  return {
    id: "derived-fruit-sugar-pattern",
    title: t("nutrition.logs.derived.crossViews.fruitSugar.title"),
    summary: t("nutrition.logs.derived.crossViews.fruitSugar.summary"),
    rows,
  }
}

function buildPantrySodiumCrossView(logSummaries: NutritionLogSummary[], t: TFunction) {
  const rows = [
    createCrossViewRow(
      "pantry-sodium:overall",
      t("nutrition.logs.derived.crossViews.pantrySodium.rows.overall"),
      logSummaries.filter((summary) => summary.hasPantrySodiumPressure),
      { includeValueDensity: true },
    ),
    createCrossViewRow(
      "pantry-sodium:seasoning",
      t("nutrition.logs.derived.crossViews.pantrySodium.rows.seasoning"),
      logSummaries.filter((summary) =>
        summary.resolvedEntries.some(
          ({ food, profile }) =>
            food.name.includes("酱油") && isPantrySodiumCandidate(food, profile),
        ),
      ),
      { includeValueDensity: true },
    ),
    createCrossViewRow(
      "pantry-sodium:processed",
      t("nutrition.logs.derived.crossViews.pantrySodium.rows.processed"),
      logSummaries.filter((summary) =>
        summary.resolvedEntries.some(
          ({ food, profile }) =>
            (food.name.includes("午餐肉") ||
              food.name.includes("方便面") ||
              food.name.includes("咸菜")) &&
            isPantrySodiumCandidate(food, profile),
        ),
      ),
      { includeValueDensity: true },
    ),
  ].filter((entry): entry is NonNullable<typeof entry> => entry !== null)

  if (rows.length === 0) {
    return null
  }

  return {
    id: "derived-pantry-sodium-pattern",
    title: t("nutrition.logs.derived.crossViews.pantrySodium.title"),
    summary: t("nutrition.logs.derived.crossViews.pantrySodium.summary"),
    rows,
  }
}

function createCrossViewRow(
  id: string,
  label: string,
  summaries: NutritionLogSummary[],
  options?: {
    includeValueDensity?: boolean
  },
) {
  if (summaries.length === 0) {
    return null
  }

  return {
    id,
    label,
    count: summaries.length,
    evidence: summaries.map((summary) => summary.log.id),
    valueDensity: options?.includeValueDensity
      ? dominantValue(summaries.map((summary) => summary.log.valueDensity))
      : undefined,
    bodyFeedback: dominantValue(summaries.map((summary) => summary.log.bodyFeedback)),
  }
}

function groupSummariesByScene(summaries: NutritionLogSummary[]) {
  const grouped = new Map<MealScene, NutritionLogSummary[]>()

  summaries.forEach((summary) => {
    const scene = summary.log.scene
    if (!scene) {
      return
    }
    grouped.set(scene, [...(grouped.get(scene) ?? []), summary])
  })

  return Array.from(grouped.entries()).sort((left, right) => right[1].length - left[1].length)
}

function dominantValue<T extends string>(values: Array<T | undefined>) {
  const counts = new Map<T, number>()

  values.forEach((value) => {
    if (!value) {
      return
    }
    counts.set(value, (counts.get(value) ?? 0) + 1)
  })

  return Array.from(counts.entries()).sort((left, right) => right[1] - left[1])[0]?.[0]
}

function inferMealRole(log: MealLog) {
  if (log.plannedSlotId?.includes("breakfast")) {
    return "早餐"
  }
  if (log.plannedSlotId?.includes("lunch")) {
    return "午餐"
  }
  if (log.plannedSlotId?.includes("dinner")) {
    return "晚餐"
  }

  const parsedDate = new Date(log.dateTime)

  if (Number.isNaN(parsedDate.getTime())) {
    return undefined
  }

  const hour = parsedDate.getHours()

  if (hour < 10) {
    return "早餐"
  }
  if (hour < 15) {
    return "午餐"
  }
  if (hour < 20) {
    return "晚餐"
  }

  return "加餐"
}

function matchesHeavySeasoningHint(log: MealLog) {
  const text = [
    log.note,
    log.changeReason,
    ...log.entries.flatMap((entry) => (entry.type === "text" ? [entry.title, entry.note] : [])),
  ]
    .filter(Boolean)
    .join(" ")

  return HEAVY_SEASONING_HINTS.some((keyword) => text.includes(keyword))
}
