import { Boxes, Plus } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { AnimatedVisibility } from "@/components/ui/animated-visibility"
import { ActionGroup, AnimatedButton } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { NutritionModuleData } from "@/features/bettertolive/types"
import { NutritionDailyPlanTab } from "@/features/bettertolive/ui/nutrition/nutrition-daily-plan-tab"
import { NutritionFoodsTab } from "@/features/bettertolive/ui/nutrition/nutrition-foods-tab"
import { NutritionLogsTab } from "@/features/bettertolive/ui/nutrition/nutrition-logs-tab"
import { NutritionNutrientsTab } from "@/features/bettertolive/ui/nutrition/nutrition-nutrients-tab"
import { NutritionOverviewTab } from "@/features/bettertolive/ui/nutrition/nutrition-overview-tab"
import { buildNutritionWeeklyReview } from "@/features/bettertolive/ui/nutrition/nutrition-page-data"
import { NutritionRecipesTab } from "@/features/bettertolive/ui/nutrition/nutrition-recipes-tab"
import { cn } from "@/lib/utils"

const EMPTY_NUTRITION_PROFILE: NutritionModuleData["profile"] = {
  hardConstraints: [],
  softStances: [],
  currentIntent: {
    mode: "维持",
  },
}

const EMPTY_WEEKLY_REVIEW: NutritionModuleData["weeklyReview"] = {
  highlights: [],
  missingSignals: [],
  crossViews: [],
}

type NutritionCreateAction = "dailyPlan" | "food" | "foodCategory" | "mealLog" | "recipe"

export function NutritionPage({
  editableNutrition,
  nutrition,
  isControlMode = false,
  isStackedLayout = false,
}: {
  editableNutrition?: NutritionModuleData
  nutrition: NutritionModuleData
  isControlMode?: boolean
  isStackedLayout?: boolean
}) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("overview")
  const [pendingCreateAction, setPendingCreateAction] = useState<NutritionCreateAction | null>(null)
  const normalizedNutrition = normalizeNutritionDataWithReview(nutrition, t)
  const normalizedEditableNutrition = normalizeNutritionDataWithReview(
    editableNutrition ?? nutrition,
    t,
  )
  const controlModeKey = isControlMode ? "control" : "browse"
  const tabContentClassName = cn(
    "min-h-0",
    isStackedLayout ? "overflow-visible" : "h-full overflow-hidden",
  )

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col gap-6",
        isStackedLayout ? "min-h-full" : "h-full overflow-hidden",
      )}
    >
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className={cn(
          "min-h-0 flex-1 flex-col",
          isStackedLayout ? "overflow-visible" : "overflow-hidden",
        )}
      >
        <ActionGroup>
          <div className="min-w-0 flex-1 overflow-hidden">
            <TabsList className="hide-scrollbar max-w-full shrink-0 justify-start overflow-x-auto">
              <TabsTrigger value="overview">{t("nutrition.tabs.overview")}</TabsTrigger>
              <TabsTrigger value="dailyPlan">{t("nutrition.tabs.dailyPlan")}</TabsTrigger>
              <TabsTrigger value="recipes">{t("nutrition.tabs.recipes")}</TabsTrigger>
              <TabsTrigger value="foods">{t("nutrition.tabs.foods")}</TabsTrigger>
              <TabsTrigger value="nutrients">{t("nutrition.tabs.nutrients")}</TabsTrigger>
              <TabsTrigger value="logs">{t("nutrition.tabs.logs")}</TabsTrigger>
            </TabsList>
          </div>

          <AnimatedVisibility show={isControlMode} className="shrink-0">
            <ActionGroup>
              <AnimatedButton
                show={activeTab === "dailyPlan"}
                size="sm"
                onClick={() => setPendingCreateAction("dailyPlan")}
              >
                <Plus className="size-4" />
                {t("nutrition.dailyPlanEdit.createTitle")}
              </AnimatedButton>
              <AnimatedButton
                show={activeTab === "recipes"}
                size="sm"
                onClick={() => setPendingCreateAction("recipe")}
              >
                <Plus className="size-4" />
                {t("nutrition.recipeEdit.createTitle")}
              </AnimatedButton>
              <AnimatedButton
                show={activeTab === "foods"}
                size="sm"
                variant="outline"
                onClick={() => setPendingCreateAction("foodCategory")}
              >
                <Boxes className="size-4" />
                {t("nutrition.categoryEdit.createTitle")}
              </AnimatedButton>
              <AnimatedButton
                show={activeTab === "foods"}
                size="sm"
                onClick={() => setPendingCreateAction("food")}
              >
                <Plus className="size-4" />
                {t("nutrition.foodEdit.createTitle")}
              </AnimatedButton>
              <AnimatedButton
                show={activeTab === "logs"}
                size="sm"
                onClick={() => setPendingCreateAction("mealLog")}
              >
                <Plus className="size-4" />
                {t("nutrition.logEdit.createTitle")}
              </AnimatedButton>
            </ActionGroup>
          </AnimatedVisibility>
        </ActionGroup>

        <TabsContent value="overview" className={tabContentClassName}>
          <NutritionOverviewTab
            key={`overview-${controlModeKey}`}
            nutrition={normalizedNutrition}
            editableNutrition={normalizedEditableNutrition}
            isControlMode={isControlMode}
          />
        </TabsContent>

        <TabsContent value="dailyPlan" className={tabContentClassName}>
          <NutritionDailyPlanTab
            key={`daily-plan-${controlModeKey}`}
            nutrition={normalizedNutrition}
            editableNutrition={normalizedEditableNutrition}
            isControlMode={isControlMode}
            createRequested={pendingCreateAction === "dailyPlan"}
            onCreateHandled={() =>
              setPendingCreateAction((current) => (current === "dailyPlan" ? null : current))
            }
          />
        </TabsContent>

        <TabsContent value="recipes" className={tabContentClassName}>
          <NutritionRecipesTab
            key={`recipes-${controlModeKey}`}
            nutrition={normalizedNutrition}
            editableNutrition={normalizedEditableNutrition}
            isControlMode={isControlMode}
            createRequested={pendingCreateAction === "recipe"}
            onCreateHandled={() =>
              setPendingCreateAction((current) => (current === "recipe" ? null : current))
            }
          />
        </TabsContent>

        <TabsContent value="foods" className={tabContentClassName}>
          <NutritionFoodsTab
            key={`foods-${controlModeKey}`}
            nutrition={normalizedNutrition}
            editableNutrition={normalizedEditableNutrition}
            isControlMode={isControlMode}
            createFoodRequested={pendingCreateAction === "food"}
            createCategoryRequested={pendingCreateAction === "foodCategory"}
            onFoodCreateHandled={() =>
              setPendingCreateAction((current) => (current === "food" ? null : current))
            }
            onCategoryCreateHandled={() =>
              setPendingCreateAction((current) => (current === "foodCategory" ? null : current))
            }
          />
        </TabsContent>

        <TabsContent value="nutrients" className={tabContentClassName}>
          <NutritionNutrientsTab nutrition={normalizedNutrition} />
        </TabsContent>

        <TabsContent value="logs" className={tabContentClassName}>
          <NutritionLogsTab
            key={`logs-${controlModeKey}`}
            nutrition={normalizedNutrition}
            editableNutrition={normalizedEditableNutrition}
            isControlMode={isControlMode}
            createRequested={pendingCreateAction === "mealLog"}
            onCreateHandled={() =>
              setPendingCreateAction((current) => (current === "mealLog" ? null : current))
            }
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function normalizeNutritionData(nutrition: NutritionModuleData): NutritionModuleData {
  const base = {
    profile: {
      hardConstraints: nutrition.profile?.hardConstraints ?? [],
      softStances: nutrition.profile?.softStances ?? [],
      currentIntent: {
        ...nutrition.profile?.currentIntent,
        mode: nutrition.profile?.currentIntent?.mode ?? EMPTY_NUTRITION_PROFILE.currentIntent.mode,
      },
    },
    foodCategories: nutrition.foodCategories ?? [],
    foods: nutrition.foods ?? [],
    nutrientProfiles: nutrition.nutrientProfiles ?? [],
    recipes: nutrition.recipes ?? [],
    dailyPlans: nutrition.dailyPlans ?? [],
    mealLogs: nutrition.mealLogs ?? [],
    meals: nutrition.meals ?? [],
    weeklyReview: nutrition.weeklyReview
      ? {
          highlights: nutrition.weeklyReview.highlights ?? [],
          missingSignals: nutrition.weeklyReview.missingSignals ?? [],
          crossViews: nutrition.weeklyReview.crossViews ?? [],
        }
      : EMPTY_WEEKLY_REVIEW,
    foodMemories: nutrition.foodMemories ?? [],
  } satisfies NutritionModuleData

  return base
}

function normalizeNutritionDataWithReview(
  nutrition: NutritionModuleData,
  t: ReturnType<typeof useTranslation>["t"],
) {
  const source = nutrition as Partial<NutritionModuleData>
  const normalized = normalizeNutritionData({
    profile: {
      hardConstraints: source.profile?.hardConstraints ?? [],
      softStances: source.profile?.softStances ?? [],
      currentIntent: {
        ...source.profile?.currentIntent,
        mode: source.profile?.currentIntent?.mode ?? EMPTY_NUTRITION_PROFILE.currentIntent.mode,
      },
    },
    foodCategories: source.foodCategories ?? [],
    foods: source.foods ?? [],
    nutrientProfiles: source.nutrientProfiles ?? [],
    recipes: source.recipes ?? [],
    dailyPlans: source.dailyPlans ?? [],
    mealLogs: source.mealLogs ?? [],
    meals: source.meals ?? [],
    weeklyReview: source.weeklyReview
      ? {
          highlights: source.weeklyReview.highlights ?? [],
          missingSignals: source.weeklyReview.missingSignals ?? [],
          crossViews: source.weeklyReview.crossViews ?? [],
        }
      : EMPTY_WEEKLY_REVIEW,
    foodMemories: source.foodMemories ?? [],
  })

  return {
    ...normalized,
    weeklyReview: buildNutritionWeeklyReview({ nutrition: normalized, t }),
  }
}
