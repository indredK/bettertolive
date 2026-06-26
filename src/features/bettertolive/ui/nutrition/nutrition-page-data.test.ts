import type { TFunction } from "i18next"

import { nutritionMockData } from "@/features/bettertolive/api/mock/data/nutrition/nutrition.mock"
import {
  buildDailyPlanSignals,
  buildNutritionSemanticCues,
  buildNutritionLookups,
  buildNutritionWeeklyReview,
  buildReplacementSuggestions,
  hasSoyProteinFood,
  hasWholeFruitFood,
  resolveEntryFoodProfiles,
} from "@/features/bettertolive/ui/nutrition/nutrition-page-data"

function createTranslator(): TFunction {
  return ((key: string, options?: Record<string, unknown>) => {
    if (typeof options?.count === "number") {
      return `${key}:${options.count}`
    }

    return key
  }) as unknown as TFunction
}

describe("nutrition-page-data", () => {
  it("marks stacked free-sugar and salty plans with warning signals", () => {
    const lookups = buildNutritionLookups(nutritionMockData)
    const plan = {
      id: "plan-risky",
      date: "2026-06-23",
      slots: [
        {
          id: "slot-breakfast",
          structure: "早餐" as const,
          status: "planned" as const,
          entries: [
            {
              type: "food" as const,
              foodId: "food-juice",
              amount: 300,
              unit: "ml",
            },
            {
              type: "food" as const,
              foodId: "food-milk-tea",
              amount: 500,
              unit: "ml",
            },
          ],
        },
        {
          id: "slot-lunch",
          structure: "午餐" as const,
          status: "planned" as const,
          entries: [
            {
              type: "food" as const,
              foodId: "food-instant-noodle",
              amount: 1,
              unit: "份",
            },
          ],
        },
        {
          id: "slot-dinner",
          structure: "晚餐" as const,
          status: "planned" as const,
          entries: [
            {
              type: "food" as const,
              foodId: "food-luncheon-meat",
              amount: 100,
              unit: "g",
            },
          ],
        },
      ],
    }

    const signals = buildDailyPlanSignals({
      foodById: lookups.foodById,
      plan,
      profileByFoodId: lookups.profileByFoodId,
      recipeById: lookups.recipeById,
    })

    expect(signals.find((signal) => signal.id === "sugar")).toMatchObject({
      state: "high",
      tone: "warning",
    })
    expect(signals.find((signal) => signal.id === "sodium")).toMatchObject({
      state: "high",
      tone: "warning",
    })
  })

  it("prefers structured recipes when replacing a sugar and sodium heavy day", () => {
    const lookups = buildNutritionLookups(nutritionMockData)
    const plan = {
      id: "plan-relief",
      date: "2026-06-23",
      slots: [
        {
          id: "slot-drink",
          structure: "加餐" as const,
          status: "planned" as const,
          entries: [
            {
              type: "food" as const,
              foodId: "food-milk-tea",
              amount: 500,
              unit: "ml",
            },
          ],
        },
        {
          id: "slot-main",
          structure: "晚餐" as const,
          status: "planned" as const,
          entries: [
            {
              type: "food" as const,
              foodId: "food-instant-noodle",
              amount: 1,
              unit: "份",
            },
          ],
        },
      ],
    }

    const suggestions = buildReplacementSuggestions({
      foodById: lookups.foodById,
      plan,
      profileByFoodId: lookups.profileByFoodId,
      recipeById: lookups.recipeById,
      recipes: nutritionMockData.recipes,
    })

    expect(suggestions[0]?.recipe.id).toBe("recipe-steamed-fish")
    expect(suggestions[0]?.reasons).toEqual(["proteinSupport", "fiberSupport", "lowerSugar"])
  })

  it("derives recurring sweet-trigger and sodium-pressure review clues from meal logs", () => {
    const review = buildNutritionWeeklyReview({
      nutrition: nutritionMockData,
      t: createTranslator(),
    })

    expect(review.highlights.some((entry) => entry.id === "derived-sweet-trigger")).toBe(true)
    expect(review.highlights.some((entry) => entry.id === "derived-sodium-pressure")).toBe(true)
    expect(review.highlights.some((entry) => entry.id === "derived-whole-fruit-stable")).toBe(true)
    expect(review.highlights.some((entry) => entry.id === "derived-pantry-sodium")).toBe(true)
    expect(review.crossViews.some((entry) => entry.id === "derived-signal-feedback")).toBe(true)
    expect(review.crossViews.some((entry) => entry.id === "derived-fruit-sugar-pattern")).toBe(true)
    expect(review.crossViews.some((entry) => entry.id === "derived-pantry-sodium-pattern")).toBe(
      true,
    )
    expect(review.missingSignals.some((entry) => entry.id === "missing-juice-vs-fruit")).toBe(true)
    expect(
      review.missingSignals.some(
        (entry) =>
          entry.label === "nutrition.logs.derived.missingSignals.juiceVsFruit" &&
          entry.evidence.length > 0,
      ),
    ).toBe(true)
  })

  it("reads food semantics directly from the nutrition seed", () => {
    const lookups = buildNutritionLookups(nutritionMockData)

    expect(lookups.profileByFoodId.get("food-apple")?.sugarKind).toBe("天然存在")
    expect(lookups.profileByFoodId.get("food-juice")?.sugarKind).toBe("游离糖/添加糖")
    expect(lookups.profileByFoodId.get("food-edamame")?.proteinSource).toBe("豆类")
    expect(lookups.profileByFoodId.get("food-pickle")?.sodiumRiskLevel).toBe("高")
  })

  it("builds semantic cues for whole fruit, soy protein, and pantry sodium", () => {
    const lookups = buildNutritionLookups(nutritionMockData)
    const plan = nutritionMockData.dailyPlans.find((entry) => entry.id === "plan-2026-06-14")

    expect(plan).toBeTruthy()

    const cues = buildNutritionSemanticCues({
      foodById: lookups.foodById,
      plan: plan!,
      profileByFoodId: lookups.profileByFoodId,
      recipeById: lookups.recipeById,
    })

    expect(cues.some((cue) => cue.id === "wholeFruitStable")).toBe(true)
    expect(cues.some((cue) => cue.id === "soyProteinPresent")).toBe(true)
  })

  it("connects newly added foods into recipes, plans, and logs", () => {
    expect(nutritionMockData.recipes.some((recipe) => recipe.id === "recipe-oats-soy-apple")).toBe(
      true,
    )
    expect(
      nutritionMockData.recipes.some((recipe) => recipe.id === "recipe-edamame-rice-bowl"),
    ).toBe(true)
    expect(
      nutritionMockData.dailyPlans.some((plan) =>
        plan.slots.some((slot) =>
          slot.entries.some(
            (entry) => entry.type === "recipe" && entry.recipeId === "recipe-oats-soy-apple",
          ),
        ),
      ),
    ).toBe(true)
    expect(
      nutritionMockData.mealLogs.some((log) =>
        log.entries.some((entry) => entry.type === "food" && entry.foodId === "food-juice"),
      ),
    ).toBe(true)
    expect(
      nutritionMockData.mealLogs.some((log) =>
        log.entries.some((entry) => entry.type === "food" && entry.foodId === "food-pickle"),
      ),
    ).toBe(true)
  })

  it("derives fruit-sugar and pantry-sodium cross views with segmented rows", () => {
    const review = buildNutritionWeeklyReview({
      nutrition: nutritionMockData,
      t: createTranslator(),
    })

    const fruitSugarView = review.crossViews.find(
      (entry) => entry.id === "derived-fruit-sugar-pattern",
    )
    const pantrySodiumView = review.crossViews.find(
      (entry) => entry.id === "derived-pantry-sodium-pattern",
    )

    expect(fruitSugarView?.rows.map((row) => row.label)).toEqual([
      "nutrition.logs.derived.crossViews.fruitSugar.rows.wholeFruit",
      "nutrition.logs.derived.crossViews.fruitSugar.rows.juiceDrink",
      "nutrition.logs.derived.crossViews.fruitSugar.rows.fruitWithSoy",
    ])
    expect(fruitSugarView?.rows.map((row) => row.id)).toEqual([
      "fruit-sugar:whole-fruit",
      "fruit-sugar:juice-drink",
      "fruit-sugar:fruit-with-soy",
    ])
    expect(fruitSugarView?.rows.every((row) => row.evidence.length > 0)).toBe(true)
    expect(fruitSugarView?.rows.every((row) => row.valueDensity)).toBe(true)
    expect(pantrySodiumView?.rows.map((row) => row.label)).toEqual([
      "nutrition.logs.derived.crossViews.pantrySodium.rows.overall",
      "nutrition.logs.derived.crossViews.pantrySodium.rows.processed",
    ])
    expect(pantrySodiumView?.rows.map((row) => row.id)).toEqual([
      "pantry-sodium:overall",
      "pantry-sodium:processed",
    ])
  })

  it("resolves recipe-based log semantics for whole fruit and soy protein", () => {
    const lookups = buildNutritionLookups(nutritionMockData)
    const recipeLog = nutritionMockData.mealLogs.find((entry) => entry.id === "log-9")

    expect(recipeLog).toBeTruthy()

    const resolvedEntries = recipeLog!.entries.flatMap((entry) =>
      resolveEntryFoodProfiles({
        entry,
        foodById: lookups.foodById,
        profileByFoodId: lookups.profileByFoodId,
        recipeById: lookups.recipeById,
      }),
    )

    expect(hasWholeFruitFood(resolvedEntries)).toBe(true)
    expect(hasSoyProteinFood(resolvedEntries)).toBe(true)
  })
})
