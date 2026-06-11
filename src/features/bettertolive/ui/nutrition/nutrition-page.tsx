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
  const normalizedNutrition = normalizeNutritionData(nutrition)
  const normalizedEditableNutrition = normalizeNutritionData(editableNutrition ?? nutrition)
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
              <TabsTrigger value="overview">{t("nutrition.tabs.overview", "总览")}</TabsTrigger>
              <TabsTrigger value="dailyPlan">
                {t("nutrition.tabs.dailyPlan", "每日计划")}
              </TabsTrigger>
              <TabsTrigger value="recipes">{t("nutrition.tabs.recipes", "食谱库")}</TabsTrigger>
              <TabsTrigger value="foods">{t("nutrition.tabs.foods", "食品分类")}</TabsTrigger>
              <TabsTrigger value="nutrients">
                {t("nutrition.tabs.nutrients", "营养成分表")}
              </TabsTrigger>
              <TabsTrigger value="logs">{t("nutrition.tabs.logs", "进食记录")}</TabsTrigger>
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
                {t("nutrition.dailyPlanEdit.createTitle", "新增每日计划")}
              </AnimatedButton>
              <AnimatedButton
                show={activeTab === "recipes"}
                size="sm"
                onClick={() => setPendingCreateAction("recipe")}
              >
                <Plus className="size-4" />
                {t("nutrition.recipeEdit.createTitle", "新增食谱")}
              </AnimatedButton>
              <AnimatedButton
                show={activeTab === "foods"}
                size="sm"
                variant="outline"
                onClick={() => setPendingCreateAction("foodCategory")}
              >
                <Boxes className="size-4" />
                {t("nutrition.categoryEdit.createTitle", "新增食品分类")}
              </AnimatedButton>
              <AnimatedButton
                show={activeTab === "foods"}
                size="sm"
                onClick={() => setPendingCreateAction("food")}
              >
                <Plus className="size-4" />
                {t("nutrition.foodEdit.createTitle", "新增食品")}
              </AnimatedButton>
              <AnimatedButton
                show={activeTab === "logs"}
                size="sm"
                onClick={() => setPendingCreateAction("mealLog")}
              >
                <Plus className="size-4" />
                {t("nutrition.logEdit.createTitle", "新增进食记录")}
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
  const source = nutrition as Partial<NutritionModuleData>

  return {
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
  }
}
