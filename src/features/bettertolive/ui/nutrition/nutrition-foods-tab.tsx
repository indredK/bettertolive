import { Boxes, Leaf, Pencil, Search } from "lucide-react"
import type { TFunction } from "i18next"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { AnimatedIconButton } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type {
  FoodCategoryDefinition,
  FoodItem,
  NutritionModuleData,
} from "@/features/bettertolive/types"
import {
  NutritionFoodCategoryEditDialog,
  type EditingFoodCategory,
} from "@/features/bettertolive/ui/nutrition/nutrition-food-category-edit-dialog"
import {
  NutritionFoodEditDialog,
  type EditingFood,
} from "@/features/bettertolive/ui/nutrition/nutrition-food-edit-dialog"
import {
  buildNutritionLookups,
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
import { cn } from "@/lib/utils"

const ALL_CATEGORY_ID = "all"

export function NutritionFoodsTab({
  createCategoryRequested = false,
  createFoodRequested = false,
  editableNutrition,
  isControlMode = false,
  onCategoryCreateHandled,
  onFoodCreateHandled,
  nutrition,
}: {
  createCategoryRequested?: boolean
  createFoodRequested?: boolean
  editableNutrition?: NutritionModuleData
  isControlMode?: boolean
  onCategoryCreateHandled?: () => void
  onFoodCreateHandled?: () => void
  nutrition: NutritionModuleData
}) {
  const { t } = useTranslation()
  const sourceNutrition = editableNutrition ?? nutrition
  const [activeCategoryId, setActiveCategoryId] = useState(ALL_CATEGORY_ID)
  const [activeFoodId, setActiveFoodId] = useState("")
  const [editingCategory, setEditingCategory] = useState<EditingFoodCategory | null>(null)
  const [editingFood, setEditingFood] = useState<EditingFood | null>(null)
  const [query, setQuery] = useState("")
  const lookups = useMemo(() => buildNutritionLookups(nutrition), [nutrition])
  const selectedCategory =
    activeCategoryId === ALL_CATEGORY_ID
      ? null
      : (nutrition.foodCategories.find((category) => category.id === activeCategoryId) ?? null)
  const effectiveCategoryId = selectedCategory?.id ?? ALL_CATEGORY_ID
  const activeCategory = effectiveCategoryId === ALL_CATEGORY_ID ? null : selectedCategory
  const foods = nutrition.foods.filter((food) => {
    const categoryText = food.categoryIds
      .map((id) => {
        const category = lookups.categoryById.get(id)
        return category
          ? `${category.name} ${translateNutritionEnum(t, "foodCategoryDimension", category.dimension)}`
          : id
      })
      .join(" ")
    const text = [
      food.name,
      categoryText,
      food.storage,
      food.storage ? translateNutritionEnum(t, "storage", food.storage) : "",
      food.lifecycle,
      food.lifecycle ? translateNutritionEnum(t, "lifecycle", food.lifecycle) : "",
      food.dietaryTags.join(" "),
      food.allergenTags.join(" "),
      food.note,
    ].join(" ")
    const matchesQuery = !query.trim() || text.toLowerCase().includes(query.trim().toLowerCase())
    const matchesCategory =
      effectiveCategoryId === ALL_CATEGORY_ID ||
      (activeCategory ? food.categoryIds.includes(activeCategory.id) : true)
    return matchesQuery && matchesCategory
  })
  const activeFood = foods.find((food) => food.id === activeFoodId) ?? foods[0] ?? null

  useEffect(() => {
    if (!isControlMode || !createFoodRequested) return
    setTimeout(() => setEditingFood({ isNew: true, food: null }), 0)
    onFoodCreateHandled?.()
  }, [createFoodRequested, isControlMode, onFoodCreateHandled])

  useEffect(() => {
    if (!isControlMode || !createCategoryRequested) return
    setTimeout(() => setEditingCategory({ isNew: true, category: null }), 0)
    onCategoryCreateHandled?.()
  }, [createCategoryRequested, isControlMode, onCategoryCreateHandled])

  return (
    <NutritionTabViewport>
      <NutritionTabBody>
        <NutritionSidebarPane className="xl:w-86">
          <div>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("nutrition.foods.search")}
              className="border-foreground/15 bg-background"
            />
          </div>

          <div className="mt-3 space-y-3">
            <NutritionSelectableCard
              isActive={effectiveCategoryId === ALL_CATEGORY_ID}
              onClick={() => setActiveCategoryId(ALL_CATEGORY_ID)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{t("nutrition.foods.allFoods")}</div>
                <Badge
                  variant="outline"
                  className="border-foreground/10 bg-muted text-muted-foreground text-[10px]"
                >
                  {nutrition.foods.length}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-5">
                {t("nutrition.foods.allFoodsDesc")}
              </p>
            </NutritionSelectableCard>

            {groupCategories(nutrition.foodCategories).map(([dimension, categories]) => (
              <div key={dimension}>
                <div className="text-muted-foreground mb-2 px-1 text-xs font-medium">
                  {translateNutritionEnum(t, "foodCategoryDimension", dimension)}
                </div>
                <div className="grid gap-2">
                  {categories.map((category) => (
                    <CategoryCard
                      key={category.id}
                      category={category}
                      count={
                        nutrition.foods.filter((food) => food.categoryIds.includes(category.id))
                          .length
                      }
                      isActive={category.id === effectiveCategoryId}
                      onClick={() => setActiveCategoryId(category.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </NutritionSidebarPane>

        <NutritionDetailPane>
          <div className="grid h-full min-h-0 gap-3 xl:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
            <Card
              className={cn(NUTRITION_DETAIL_CARD_CLASS, "flex min-h-0 flex-col overflow-hidden")}
            >
              <CardContent className="flex min-h-0 flex-1 flex-col p-4">
                <div className="flex shrink-0 items-center justify-between gap-3">
                  <div>
                    <h3 className="font-semibold tracking-tight">
                      {activeCategory?.name ?? t("nutrition.foods.allFoods")}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm leading-6">
                      {activeCategory?.description ?? t("nutrition.foods.allFoodsDesc")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-foreground/10 bg-muted text-muted-foreground"
                    >
                      {foods.length}
                    </Badge>
                    <AnimatedIconButton
                      show={isControlMode && Boolean(activeCategory)}
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      label={t("nutrition.categoryEdit.editTitle")}
                      icon={<Pencil className="size-3.5" />}
                      onClick={() =>
                        setEditingCategory({ isNew: false, category: activeCategory! })
                      }
                    />
                  </div>
                </div>

                <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
                  {foods.map((food) => (
                    <FoodListCard
                      key={food.id}
                      food={food}
                      isActive={food.id === activeFood?.id}
                      nutrition={nutrition}
                      onClick={() => setActiveFoodId(food.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>

            {activeFood ? (
              <FoodDetail
                food={activeFood}
                nutrition={nutrition}
                onEdit={
                  isControlMode
                    ? () => setEditingFood({ isNew: false, food: activeFood })
                    : undefined
                }
              />
            ) : (
              <NutritionEmptyDetailCard message={t("nutrition.foods.empty")} />
            )}
          </div>
        </NutritionDetailPane>
      </NutritionTabBody>

      {isControlMode && editingFood ? (
        <NutritionFoodEditDialog
          key={editingFood.food?.id ?? "new-food"}
          editing={editingFood}
          nutrition={sourceNutrition}
          onClose={() => setEditingFood(null)}
        />
      ) : null}
      {isControlMode && editingCategory ? (
        <NutritionFoodCategoryEditDialog
          key={editingCategory.category?.id ?? "new-food-category"}
          editing={editingCategory}
          nutrition={sourceNutrition}
          onClose={() => setEditingCategory(null)}
        />
      ) : null}
    </NutritionTabViewport>
  )
}

function groupCategories(categories: FoodCategoryDefinition[]) {
  const groups = new Map<string, FoodCategoryDefinition[]>()

  categories
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .forEach((category) => {
      groups.set(category.dimension, [...(groups.get(category.dimension) ?? []), category])
    })

  return Array.from(groups.entries())
}

function CategoryCard({
  category,
  count,
  isActive,
  onClick,
}: {
  category: FoodCategoryDefinition
  count: number
  isActive: boolean
  onClick: () => void
}) {
  return (
    <NutritionSelectableCard isActive={isActive} onClick={onClick}>
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium">{category.name}</div>
        <Badge
          variant="outline"
          className="border-foreground/10 bg-muted text-muted-foreground text-[10px]"
        >
          {count}
        </Badge>
      </div>
      <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-5">
        {category.description}
      </p>
    </NutritionSelectableCard>
  )
}

function FoodListCard({
  food,
  isActive,
  nutrition,
  onClick,
}: {
  food: FoodItem
  isActive: boolean
  nutrition: NutritionModuleData
  onClick: () => void
}) {
  const { t } = useTranslation()
  const lookups = useMemo(() => buildNutritionLookups(nutrition), [nutrition])
  const categoryNames = food.categoryIds.map((id) => lookups.categoryById.get(id)?.name ?? id)

  return (
    <NutritionSelectableCard isActive={isActive} onClick={onClick}>
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium">{food.name}</div>
        <Badge
          variant="outline"
          className="border-foreground/10 bg-muted text-muted-foreground text-[10px]"
        >
          {food.storage
            ? t(`nutrition.enum.storage.${food.storage}`, food.storage)
            : t(`nutrition.enum.unit.${food.defaultUnit}`, food.defaultUnit)}
        </Badge>
      </div>
      <NutritionTagBar names={categoryNames.slice(0, 4)} className="mt-2" />
    </NutritionSelectableCard>
  )
}

function FoodDetail({
  food,
  nutrition,
  onEdit,
}: {
  food: FoodItem
  nutrition: NutritionModuleData
  onEdit?: () => void
}) {
  const { t } = useTranslation()
  const lookups = useMemo(() => buildNutritionLookups(nutrition), [nutrition])
  const profile = lookups.profileByFoodId.get(food.id)
  const categoryNames = food.categoryIds.map((id) => lookups.categoryById.get(id)?.name ?? id)
  const dietaryTagNames = [...food.dietaryTags, ...food.allergenTags]

  return (
    <Card
      className={cn(NUTRITION_DETAIL_CARD_CLASS, "flex h-full min-h-0 flex-col overflow-hidden")}
    >
      <CardContent className="flex min-h-0 flex-1 flex-col p-4">
        <div className="shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="outline" className="border-ring/50 bg-accent text-accent-foreground">
              {t("nutrition.foods.baseLibrary")}
            </Badge>
            <AnimatedIconButton
              show={Boolean(onEdit)}
              type="button"
              variant="outline"
              size="sm"
              label={t("nutrition.foodEdit.editAction")}
              icon={<Pencil className="size-3.5" />}
              onClick={onEdit}
            >
              {t("nutrition.foodEdit.editAction")}
            </AnimatedIconButton>
          </div>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight">{food.name}</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            {food.note || t("nutrition.foods.noNote")}
          </p>
          <NutritionTagBar names={categoryNames} className="mt-3" />
        </div>

        <div className="mt-4 grid shrink-0 gap-2 sm:grid-cols-4">
          <NutritionMetricCard
            icon={Boxes}
            label={t("nutrition.foods.unit")}
            value={t(`nutrition.enum.unit.${food.defaultUnit}`, food.defaultUnit)}
          />
          <NutritionMetricCard
            icon={Leaf}
            label={t("nutrition.foods.storage")}
            value={food.storage ? t(`nutrition.enum.storage.${food.storage}`, food.storage) : "-"}
          />
          <NutritionMetricCard
            label={t("nutrition.foods.lifecycle")}
            value={
              food.lifecycle ? t(`nutrition.enum.lifecycle.${food.lifecycle}`, food.lifecycle) : "-"
            }
          />
          <NutritionMetricCard
            icon={Search}
            label={t("nutrition.foods.nutrition")}
            value={profile ? t("nutrition.foods.hasProfile") : t("nutrition.foods.missingProfile")}
          />
        </div>

        <div className="mt-4 grid min-h-0 flex-1 gap-3 overflow-y-auto pr-1 lg:grid-cols-2">
          <div className="border-foreground/10 bg-background/70 rounded-2xl border p-4">
            <h4 className="text-sm font-semibold">{t("nutrition.foods.dietaryTags")}</h4>
            {dietaryTagNames.length > 0 ? (
              <NutritionTagBar names={dietaryTagNames} className="mt-3" />
            ) : (
              <p className="text-muted-foreground mt-3 text-xs leading-5">
                {t("nutrition.foods.noDietaryTags")}
              </p>
            )}
          </div>
          <div className="border-foreground/10 bg-background/70 rounded-2xl border p-4">
            <h4 className="text-sm font-semibold">{t("nutrition.foods.nutrientProfile")}</h4>
            {profile ? (
              <div className="mt-3 space-y-2 text-sm">
                <NutrientLine
                  label={t("nutrition.nutrients.energyKcal")}
                  value={formatProfileNutrient(profile.energyKcal, "kcal", 0, t)}
                />
                <NutrientLine
                  label={t("nutrition.nutrients.proteinG")}
                  value={formatProfileNutrient(profile.proteinG, "g", 1, t)}
                />
                <NutrientLine
                  label={t("nutrition.nutrients.carbG")}
                  value={formatProfileNutrient(profile.carbG, "g", 1, t)}
                />
                <NutrientLine
                  label={t("nutrition.nutrients.sodiumMg")}
                  value={formatProfileNutrient(profile.sodiumMg, "mg", 0, t)}
                />
                <p className="text-muted-foreground pt-2 text-xs">
                  {profile.basisAmount}
                  {translateNutritionEnum(t, "unit", profile.basisUnit)} ·{" "}
                  {t(`nutrition.enum.source.${profile.source}`, profile.source)} ·{" "}
                  {t(`nutrition.enum.confidence.${profile.confidence}`, profile.confidence)}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground mt-3 text-sm leading-6">
                {t(
                  "nutrition.foods.profileMissingCopy",
                  "这项食品仍可进入食谱和计划，但营养表会显示待补。",
                )}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function NutrientLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}

function formatProfileNutrient(
  value: number | undefined,
  unit: string,
  digits: number,
  t: TFunction,
) {
  if (typeof value !== "number") {
    return t("nutrition.nutrients.pending")
  }

  return `${formatNutrientValue(value, digits)} ${unit}`
}
