import type {
  DailyPlan,
  DailyPlanEntry,
  FoodItem,
  FoodNutrientProfile,
  NutritionModuleData,
  Recipe,
} from "@/features/bettertolive/types"

export type NutritionTotals = {
  energyKcal: number
  proteinG: number
  fatG: number
  carbG: number
  fiberG: number
  sugarG: number
  sodiumMg: number
  missingCount: number
}

export type NutrientKey = keyof Omit<NutritionTotals, "missingCount">

export const NUTRIENT_KEYS = [
  "energyKcal",
  "proteinG",
  "fatG",
  "carbG",
  "fiberG",
  "sugarG",
  "sodiumMg",
] satisfies NutrientKey[]

export const NUTRIENT_UNITS: Record<NutrientKey, string> = {
  energyKcal: "kcal",
  proteinG: "g",
  fatG: "g",
  carbG: "g",
  fiberG: "g",
  sugarG: "g",
  sodiumMg: "mg",
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
  carbG: 0,
  fiberG: 0,
  sugarG: 0,
  sodiumMg: 0,
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
  const normalizedAmount =
    unit === "个" || unit === "份" ? amount * UNIT_GRAM_ESTIMATES[unit] : amount

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
    carbG: (profile.carbG ?? 0) * ratio,
    fiberG: (profile.fiberG ?? 0) * ratio,
    sugarG: (profile.sugarG ?? 0) * ratio,
    sodiumMg: (profile.sodiumMg ?? 0) * ratio,
    missingCount: NUTRIENT_KEYS.filter((key) => profile[key] === undefined).length,
  }
}

export function addNutritionTotals(base: NutritionTotals, next: NutritionTotals): NutritionTotals {
  return {
    energyKcal: base.energyKcal + next.energyKcal,
    proteinG: base.proteinG + next.proteinG,
    fatG: base.fatG + next.fatG,
    carbG: base.carbG + next.carbG,
    fiberG: base.fiberG + next.fiberG,
    sugarG: base.sugarG + next.sugarG,
    sodiumMg: base.sodiumMg + next.sodiumMg,
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
    carbG: recipeTotals.carbG * servingRatio,
    fiberG: recipeTotals.fiberG * servingRatio,
    sugarG: recipeTotals.sugarG * servingRatio,
    sodiumMg: recipeTotals.sodiumMg * servingRatio,
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
