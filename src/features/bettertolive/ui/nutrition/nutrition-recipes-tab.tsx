import { ChefHat, Clock, Flame, Heart, ListChecks, MessageCircleHeart, Pencil } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { AnimatedIconButton } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { MealLog, NutritionModuleData, Recipe } from "@/features/bettertolive/types"
import {
  NutritionRecipeEditDialog,
  type EditingRecipe,
} from "@/features/bettertolive/ui/nutrition/nutrition-recipe-edit-dialog"
import {
  buildNutritionLookups,
  calculateRecipeNutrition,
  formatNutrientValue,
} from "@/features/bettertolive/ui/nutrition/nutrition-page-data"
import {
  NUTRITION_DETAIL_CARD_CLASS,
  NutritionDetailPane,
  NutritionEmptyDetailCard,
  NutritionMetricCard,
  NutritionSelectableCard,
  NutritionSidebarPane,
  NutritionTabBody,
  NutritionTabViewport,
  NutritionTagBar,
} from "@/features/bettertolive/ui/nutrition/nutrition-page-shared"
import { translateNutritionEnum } from "@/features/bettertolive/ui/nutrition/nutrition-i18n"
import {
  FilterAppliedChips,
  FilterPopoverButton,
  type FilterPopoverDimension,
} from "@/features/bettertolive/ui/shared/filter-popover"
import { cn } from "@/lib/utils"

const RECIPE_FILTERS = [
  { id: "all" },
  { id: "breakfast", mealRole: "早餐" },
  { id: "lunch", mealRole: "午餐" },
  { id: "dinner", mealRole: "晚餐" },
  { id: "snack", mealRole: "加餐" },
  { id: "frequent", repeatability: "常做" },
  { id: "easy", difficulty: "简单" },
  { id: "missingNutrition" },
  { id: "linkedMemory" },
  { id: "hasFeedback" },
] as const

type RecipeFilter = (typeof RECIPE_FILTERS)[number]
type RecipeFilterId = RecipeFilter["id"]

export function NutritionRecipesTab({
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
  const [activeRecipeId, setActiveRecipeId] = useState(nutrition.recipes[0]?.id ?? "")
  const [editingRecipe, setEditingRecipe] = useState<EditingRecipe | null>(null)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<RecipeFilterId>("all")
  const [activeTag, setActiveTag] = useState("all")
  const lookups = useMemo(() => buildNutritionLookups(nutrition), [nutrition])
  const recentLogByRecipeId = useMemo(() => buildRecentRecipeLogMap(nutrition), [nutrition])
  const recipeTags = useMemo(() => buildRecipeTags(nutrition), [nutrition])
  const effectiveActiveTag =
    activeTag === "all" || recipeTags.includes(activeTag) ? activeTag : "all"
  const filterDimensions = useMemo<FilterPopoverDimension[]>(() => {
    const dims: FilterPopoverDimension[] = [
      {
        key: "filter",
        label: t("nutrition.recipeFilters.title", "食谱类型"),
        allLabel: t("nutrition.recipeFilters.all", "全部"),
        value: filter,
        options: RECIPE_FILTERS.slice(1).map((f) => ({
          value: f.id,
          label: t(`nutrition.recipeFilters.${f.id}`, f.id),
        })),
      },
    ]
    if (recipeTags.length > 0) {
      dims.push({
        key: "tag",
        label: t("nutrition.recipes.tagFilter", "标签筛选"),
        allLabel: t("nutrition.recipes.allTags", "全部标签"),
        value: effectiveActiveTag,
        options: recipeTags.map((tag) => ({ value: tag, label: tag })),
      })
    }
    return dims
  }, [filter, effectiveActiveTag, recipeTags, t])

  const recipes = nutrition.recipes.filter((recipe) => {
    const text = [
      recipe.name,
      recipe.summary,
      recipe.tags.join(" "),
      recipe.mealRoles.join(" "),
      recipe.mealRoles.map((role) => translateNutritionEnum(t, "mealRole", role)).join(" "),
      recipe.difficulty,
      translateNutritionEnum(t, "difficulty", recipe.difficulty),
      recipe.repeatability,
      translateNutritionEnum(t, "repeatability", recipe.repeatability),
    ].join(" ")
    const matchesQuery = !query.trim() || text.toLowerCase().includes(query.trim().toLowerCase())
    const matchesTag = effectiveActiveTag === "all" || recipe.tags.includes(effectiveActiveTag)
    const totals = calculateRecipeNutrition({
      foodById: lookups.foodById,
      profileByFoodId: lookups.profileByFoodId,
      recipe,
    })
    const activeFilter = RECIPE_FILTERS.find((entry) => entry.id === filter) ?? RECIPE_FILTERS[0]
    const matchesFilter = recipeMatchesFilter({
      filter: activeFilter,
      hasRecentFeedback: recentLogByRecipeId.has(recipe.id),
      missingCount: totals.missingCount,
      recipe,
    })

    return matchesQuery && matchesFilter && matchesTag
  })
  const activeRecipe = recipes.find((recipe) => recipe.id === activeRecipeId) ?? recipes[0] ?? null

  useEffect(() => {
    if (!isControlMode || !createRequested) return
    setTimeout(() => setEditingRecipe({ isNew: true, recipe: null }), 0)
    onCreateHandled?.()
  }, [createRequested, isControlMode, onCreateHandled])

  return (
    <NutritionTabViewport>
      <NutritionTabBody>
        <NutritionSidebarPane>
          <div className="space-y-2">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("nutrition.recipes.search", "搜索食谱、标签或餐次")}
                className="border-foreground/15 bg-background min-w-0 flex-1"
              />
              <FilterPopoverButton
                className="shrink-0"
                popoverWidth="17.5rem"
                dimensions={filterDimensions}
                onChangeFilter={(key, value) => {
                  if (key === "filter") setFilter(value as RecipeFilterId)
                  else if (key === "tag") setActiveTag(value)
                }}
                onClearAll={() => {
                  setFilter("all")
                  setActiveTag("all")
                }}
              />
            </div>
            <FilterAppliedChips
              dimensions={filterDimensions}
              onChangeFilter={(key, value) => {
                if (key === "filter") setFilter(value as RecipeFilterId)
                else if (key === "tag") setActiveTag(value)
              }}
            />
          </div>
          <div className="mt-3 space-y-2">
            {recipes.map((recipe) => (
              <RecipeListCard
                key={recipe.id}
                isActive={recipe.id === activeRecipe?.id}
                onClick={() => setActiveRecipeId(recipe.id)}
                recipe={recipe}
                recentLog={recentLogByRecipeId.get(recipe.id) ?? null}
              />
            ))}
          </div>
        </NutritionSidebarPane>

        <NutritionDetailPane>
          {activeRecipe ? (
            <RecipeDetail
              nutrition={nutrition}
              recipe={activeRecipe}
              recentLog={recentLogByRecipeId.get(activeRecipe.id) ?? null}
              onEdit={
                isControlMode
                  ? () => setEditingRecipe({ isNew: false, recipe: activeRecipe })
                  : undefined
              }
            />
          ) : (
            <NutritionEmptyDetailCard message={t("nutrition.recipes.empty", "没有匹配的食谱。")} />
          )}
        </NutritionDetailPane>
      </NutritionTabBody>

      {isControlMode && editingRecipe ? (
        <NutritionRecipeEditDialog
          key={editingRecipe.recipe?.id ?? "new-recipe"}
          editing={editingRecipe}
          nutrition={sourceNutrition}
          onClose={() => setEditingRecipe(null)}
        />
      ) : null}
    </NutritionTabViewport>
  )
}

function RecipeListCard({
  isActive,
  onClick,
  recipe,
  recentLog,
}: {
  isActive: boolean
  onClick: () => void
  recipe: Recipe
  recentLog: MealLog | null
}) {
  const { t } = useTranslation()

  return (
    <NutritionSelectableCard isActive={isActive} onClick={onClick}>
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium">{recipe.name}</div>
        <Badge
          variant="outline"
          className="border-foreground/10 bg-muted text-muted-foreground text-[10px]"
        >
          {t(`nutrition.enum.difficulty.${recipe.difficulty}`, recipe.difficulty)}
        </Badge>
      </div>
      <p className="text-muted-foreground mt-2 line-clamp-2 text-xs leading-5">{recipe.summary}</p>
      <NutritionTagBar
        names={[
          ...recipe.mealRoles
            .slice(0, 2)
            .map((role) => translateNutritionEnum(t, "mealRole", role)),
          ...recipe.tags.slice(0, 2),
        ]}
        className="mt-2"
      />
      {recentLog?.bodyFeedback ? (
        <Badge
          variant="outline"
          className="border-ring/50 bg-accent text-accent-foreground mt-2 text-[10px]"
        >
          {translateNutritionEnum(t, "bodyFeedback", recentLog.bodyFeedback)}
        </Badge>
      ) : null}
    </NutritionSelectableCard>
  )
}

function RecipeDetail({
  nutrition,
  onEdit,
  recipe,
  recentLog,
}: {
  nutrition: NutritionModuleData
  onEdit?: () => void
  recipe: Recipe
  recentLog: MealLog | null
}) {
  const { t } = useTranslation()
  const lookups = useMemo(() => buildNutritionLookups(nutrition), [nutrition])
  const totals = calculateRecipeNutrition({
    foodById: lookups.foodById,
    profileByFoodId: lookups.profileByFoodId,
    recipe,
  })
  const totalMinutes = (recipe.prepMinutes ?? 0) + (recipe.cookMinutes ?? 0)
  const linkedFoodMemory = recipe.linkedFoodMemoryId
    ? (nutrition.foodMemories ?? []).find((memory) => memory.id === recipe.linkedFoodMemoryId)
    : null
  return (
    <Card
      className={cn(NUTRITION_DETAIL_CARD_CLASS, "flex h-full min-h-0 flex-col overflow-hidden")}
    >
      <CardContent className="flex min-h-0 flex-1 flex-col p-4">
        <div className="shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="outline" className="border-ring/50 bg-accent text-accent-foreground">
              {t("nutrition.recipes.personalLibrary", "个人食谱库")}
            </Badge>
            <AnimatedIconButton
              show={Boolean(onEdit)}
              type="button"
              variant="outline"
              size="sm"
              label={t("nutrition.recipeEdit.editAction", "编辑")}
              icon={<Pencil className="size-3.5" />}
              onClick={onEdit}
            >
              {t("nutrition.recipeEdit.editAction", "编辑")}
            </AnimatedIconButton>
          </div>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight">{recipe.name}</h3>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">{recipe.summary}</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {recipe.mealRoles.map((role) => (
              <Badge
                key={role}
                variant="outline"
                className="border-foreground/10 bg-muted text-muted-foreground"
              >
                {t(`nutrition.enum.mealRole.${role}`, role)}
              </Badge>
            ))}
            <Badge
              variant="outline"
              className="border-foreground/10 bg-muted text-muted-foreground"
            >
              {t(`nutrition.enum.difficulty.${recipe.difficulty}`, recipe.difficulty)}
            </Badge>
            <Badge
              variant="outline"
              className="border-foreground/10 bg-muted text-muted-foreground"
            >
              {t(`nutrition.enum.repeatability.${recipe.repeatability}`, recipe.repeatability)}
            </Badge>
            {recipe.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="border-foreground/10 bg-muted text-muted-foreground"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="mt-4 grid shrink-0 gap-2 sm:grid-cols-4">
          <NutritionMetricCard
            icon={Clock}
            label={t("nutrition.recipes.totalTime", "总时间")}
            value={totalMinutes}
            detail={t("nutrition.units.minutes", "min")}
          />
          <NutritionMetricCard
            icon={ChefHat}
            label={t("nutrition.recipes.servings", "份数")}
            value={recipe.servings}
          />
          <NutritionMetricCard
            icon={Flame}
            label={t("nutrition.nutrients.energyKcal", "能量")}
            value={formatNutrientValue(totals.energyKcal)}
            detail="kcal"
          />
          <NutritionMetricCard
            icon={ListChecks}
            label={t("nutrition.recipes.missing", "待补")}
            value={totals.missingCount}
            detail={t("nutrition.recipes.missingHint", "营养缺口")}
          />
        </div>

        <div className="border-foreground/10 bg-background/70 mt-4 shrink-0 rounded-2xl border p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <MessageCircleHeart className="size-4" />
                {t("nutrition.recipes.recentFeedback", "最近进食反馈")}
              </div>
              {recentLog ? (
                <>
                  <div className="text-muted-foreground mt-2 text-xs">
                    {formatLogDate(recentLog.dateTime)}
                  </div>
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-5">
                    {recentLog.note ||
                      recentLog.changeReason ||
                      t("nutrition.recipes.recentFeedbackNoNote", "这次记录没有额外备注。")}
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground mt-2 text-xs leading-5">
                  {t(
                    "nutrition.recipes.noRecentFeedback",
                    "还没有实际进食反馈，之后从计划生成记录或手动补记后会出现在这里。",
                  )}
                </p>
              )}
            </div>
            {recentLog ? (
              <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                {recentLog.scene ? (
                  <Badge
                    variant="outline"
                    className="border-foreground/10 bg-muted text-muted-foreground text-[10px]"
                  >
                    {translateNutritionEnum(t, "scene", recentLog.scene)}
                  </Badge>
                ) : null}
                {recentLog.valueDensity ? (
                  <Badge
                    variant="outline"
                    className="border-foreground/10 bg-muted text-muted-foreground text-[10px]"
                  >
                    {translateNutritionEnum(t, "valueDensity", recentLog.valueDensity)}
                  </Badge>
                ) : null}
                {recentLog.bodyFeedback ? (
                  <Badge
                    variant="outline"
                    className="border-ring/50 bg-accent text-accent-foreground text-[10px]"
                  >
                    {translateNutritionEnum(t, "bodyFeedback", recentLog.bodyFeedback)}
                  </Badge>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        {linkedFoodMemory ? (
          <div className="border-foreground/10 bg-muted/20 mt-4 shrink-0 rounded-2xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Heart className="size-4" />
                  {t("nutrition.recipes.foodMemory", "关联食物记忆")}
                </div>
                <div className="mt-2 font-medium">{linkedFoodMemory.name}</div>
                <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-5">
                  {linkedFoodMemory.story}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-1.5">
                <Badge
                  variant="outline"
                  className="border-foreground/10 bg-background/70 text-[10px]"
                >
                  {translateNutritionEnum(t, "foodMemoryType", linkedFoodMemory.type)}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-foreground/10 bg-background/70 text-[10px]"
                >
                  {translateNutritionEnum(
                    t,
                    "foodMemoryAvailability",
                    linkedFoodMemory.currentAvailability,
                  )}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-ring/50 bg-accent text-accent-foreground text-[10px]"
                >
                  {translateNutritionEnum(
                    t,
                    "foodMemoryEmotionalLoad",
                    linkedFoodMemory.emotionalLoad,
                  )}
                </Badge>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-4 grid min-h-0 flex-1 gap-3 overflow-hidden lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="min-h-0 overflow-y-auto pr-1">
            <h4 className="text-sm font-semibold">{t("nutrition.recipes.ingredients", "食材")}</h4>
            <div className="mt-3 space-y-2">
              {recipe.ingredients.map((ingredient) => {
                const food = lookups.foodById.get(ingredient.foodId)
                return (
                  <div
                    key={`${ingredient.foodId}-${ingredient.amount}`}
                    className="border-foreground/10 bg-background/70 rounded-xl border px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">{food?.name ?? ingredient.foodId}</span>
                      <span className="text-muted-foreground text-sm">
                        {ingredient.amount}
                        {translateNutritionEnum(t, "unit", ingredient.unit)}
                      </span>
                    </div>
                    {ingredient.note ? (
                      <p className="text-muted-foreground mt-1 text-xs leading-5">
                        {ingredient.note}
                      </p>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto pr-1">
            <h4 className="text-sm font-semibold">{t("nutrition.recipes.steps", "步骤")}</h4>
            <div className="mt-3 space-y-2">
              {recipe.steps.map((step, index) => (
                <div
                  key={step}
                  className="border-foreground/10 bg-muted/20 grid grid-cols-[auto_1fr] gap-3 rounded-xl border px-3 py-3"
                >
                  <span className="bg-background text-muted-foreground flex size-7 items-center justify-center rounded-full text-xs">
                    {index + 1}
                  </span>
                  <p className="text-sm leading-6">{step}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function buildRecentRecipeLogMap(nutrition: NutritionModuleData) {
  const logsByRecipeId = new Map<string, MealLog>()

  ;(nutrition.mealLogs ?? []).forEach((log) => {
    log.entries.forEach((entry) => {
      if (entry.type !== "recipe") {
        return
      }

      const currentLog = logsByRecipeId.get(entry.recipeId)

      if (!currentLog || getSortableTime(log.dateTime) > getSortableTime(currentLog.dateTime)) {
        logsByRecipeId.set(entry.recipeId, log)
      }
    })
  })

  return logsByRecipeId
}

function recipeMatchesFilter({
  filter,
  hasRecentFeedback,
  missingCount,
  recipe,
}: {
  filter: RecipeFilter
  hasRecentFeedback: boolean
  missingCount: number
  recipe: Recipe
}) {
  if (filter.id === "all") {
    return true
  }

  if ("mealRole" in filter) {
    return recipe.mealRoles.includes(filter.mealRole)
  }

  if ("repeatability" in filter) {
    return recipe.repeatability === filter.repeatability
  }

  if ("difficulty" in filter) {
    return recipe.difficulty === filter.difficulty
  }

  if (filter.id === "missingNutrition") {
    return missingCount > 0
  }

  if (filter.id === "linkedMemory") {
    return Boolean(recipe.linkedFoodMemoryId)
  }

  if (filter.id === "hasFeedback") {
    return hasRecentFeedback
  }

  return false
}

function buildRecipeTags(nutrition: NutritionModuleData) {
  return Array.from(new Set(nutrition.recipes.flatMap((recipe) => recipe.tags))).sort((a, b) =>
    a.localeCompare(b),
  )
}

function getSortableTime(value: string) {
  const time = new Date(value).getTime()
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time
}

function formatLogDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date)
}
