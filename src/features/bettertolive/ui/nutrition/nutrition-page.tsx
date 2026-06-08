import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { NutritionModuleData } from "@/features/bettertolive/types"
import { PageIntro } from "@/features/bettertolive/ui/shared/shared"
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

export function NutritionPage({
  editableNutrition,
  nutrition,
  searchQuery,
  isControlMode = false,
  isStackedLayout = false,
}: {
  editableNutrition?: NutritionModuleData
  nutrition: NutritionModuleData
  searchQuery: string
  isControlMode?: boolean
  isStackedLayout?: boolean
}) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("overview")
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
      <PageIntro
        eyebrow={t("nutrition.page.eyebrow", "饮食")}
        title={t("nutrition.page.title", "个人饮食工作台")}
        description={t(
          "nutrition.page.description",
          "食谱库 + 食品分类 + 营养成分表 + 每日计划 + 进食记录",
        )}
        searchQuery={searchQuery}
      />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className={cn("min-h-0 flex-1", isStackedLayout ? "overflow-visible" : "overflow-hidden")}
      >
        <TabsList className="hide-scrollbar max-w-full shrink-0 justify-start overflow-x-auto">
          <TabsTrigger value="overview">{t("nutrition.tabs.overview", "总览")}</TabsTrigger>
          <TabsTrigger value="dailyPlan">{t("nutrition.tabs.dailyPlan", "每日计划")}</TabsTrigger>
          <TabsTrigger value="recipes">{t("nutrition.tabs.recipes", "食谱库")}</TabsTrigger>
          <TabsTrigger value="foods">{t("nutrition.tabs.foods", "食品分类")}</TabsTrigger>
          <TabsTrigger value="nutrients">{t("nutrition.tabs.nutrients", "营养成分表")}</TabsTrigger>
          <TabsTrigger value="logs">{t("nutrition.tabs.logs", "进食记录")}</TabsTrigger>
        </TabsList>

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
          />
        </TabsContent>

        <TabsContent value="recipes" className={tabContentClassName}>
          <NutritionRecipesTab
            key={`recipes-${controlModeKey}`}
            nutrition={normalizedNutrition}
            editableNutrition={normalizedEditableNutrition}
            isControlMode={isControlMode}
          />
        </TabsContent>

        <TabsContent value="foods" className={tabContentClassName}>
          <NutritionFoodsTab
            key={`foods-${controlModeKey}`}
            nutrition={normalizedNutrition}
            editableNutrition={normalizedEditableNutrition}
            isControlMode={isControlMode}
          />
        </TabsContent>

        <TabsContent value="nutrients" className={tabContentClassName}>
          <NutritionNutrientsTab nutrition={normalizedNutrition} isControlMode={isControlMode} />
        </TabsContent>

        <TabsContent value="logs" className={tabContentClassName}>
          <NutritionLogsTab
            key={`logs-${controlModeKey}`}
            nutrition={normalizedNutrition}
            editableNutrition={normalizedEditableNutrition}
            isControlMode={isControlMode}
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
