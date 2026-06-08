import type { NutritionModuleData } from "@/features/bettertolive/models/workspace"

export const emptyNutritionModuleData = {
  profile: {
    hardConstraints: [],
    softStances: [],
    currentIntent: {
      mode: "维持",
    },
  },
  foodCategories: [],
  foods: [],
  nutrientProfiles: [],
  recipes: [],
  dailyPlans: [],
  mealLogs: [],
  meals: [],
  weeklyReview: {
    highlights: [],
    missingSignals: [],
    crossViews: [],
  },
  foodMemories: [],
} satisfies NutritionModuleData
