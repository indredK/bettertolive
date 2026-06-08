import { Boxes, Leaf, Pencil, Plus, Search } from "lucide-react"
import type { TFunction } from "i18next"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  NutritionControlModeBadge,
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
  editableNutrition,
  isControlMode = false,
  nutrition,
}: {
  editableNutrition?: NutritionModuleData
  isControlMode?: boolean
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

  return (
    <NutritionTabViewport>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <h3 className="text-lg font-medium">{t("nutrition.foods.title", "食品分类")}</h3>
          <NutritionControlModeBadge isControlMode={isControlMode} />
        </div>
      </div>
      <NutritionTabBody>
        <NutritionSidebarPane className="xl:w-86">
          <div className="flex gap-2">
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("nutrition.foods.search", "搜索食品、分类或储存方式")}
              className="border-foreground/15 bg-background"
            />
            {isControlMode ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setEditingFood({ isNew: true, food: null })}
                  aria-label={t("nutrition.foodEdit.createTitle", "新增食品")}
                >
                  <Plus className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setEditingCategory({ isNew: true, category: null })}
                  aria-label={t("nutrition.categoryEdit.createTitle", "新增食品分类")}
                >
                  <Boxes className="size-4" />
                </Button>
              </>
            ) : null}
          </div>

          <div className="mt-3 space-y-3">
            <NutritionSelectableCard
              isActive={effectiveCategoryId === ALL_CATEGORY_ID}
              onClick={() => setActiveCategoryId(ALL_CATEGORY_ID)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium">{t("nutrition.foods.allFoods", "全部食品")}</div>
                <Badge
                  variant="outline"
                  className="border-foreground/10 bg-muted text-muted-foreground text-[10px]"
                >
                  {nutrition.foods.length}
                </Badge>
              </div>
              <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-5">
                {t("nutrition.foods.allFoodsDesc", "跨分类查看和搜索整个食品库。")}
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
                      {activeCategory?.name ?? t("nutrition.foods.allFoods", "全部食品")}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-sm leading-6">
                      {activeCategory?.description ??
                        t("nutrition.foods.allFoodsDesc", "跨分类查看和搜索整个食品库。")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-foreground/10 bg-muted text-muted-foreground"
                    >
                      {foods.length}
                    </Badge>
                    {isControlMode && activeCategory ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="icon-sm"
                        onClick={() =>
                          setEditingCategory({ isNew: false, category: activeCategory })
                        }
                        aria-label={t("nutrition.categoryEdit.editTitle", "编辑食品分类")}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                    ) : null}
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
              <NutritionEmptyDetailCard message={t("nutrition.foods.empty", "没有匹配的食品。")} />
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
              {t("nutrition.foods.baseLibrary", "食品基础库")}
            </Badge>
            {onEdit ? (
              <Button type="button" variant="outline" size="sm" onClick={onEdit}>
                <Pencil className="size-3.5" />
                {t("nutrition.foodEdit.editAction", "编辑")}
              </Button>
            ) : null}
          </div>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight">{food.name}</h3>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            {food.note || t("nutrition.foods.noNote", "暂无备注，后续可补充储存、使用和限制信息。")}
          </p>
          <NutritionTagBar names={categoryNames} className="mt-3" />
        </div>

        <div className="mt-4 grid shrink-0 gap-2 sm:grid-cols-4">
          <NutritionMetricCard
            icon={Boxes}
            label={t("nutrition.foods.unit", "默认单位")}
            value={t(`nutrition.enum.unit.${food.defaultUnit}`, food.defaultUnit)}
          />
          <NutritionMetricCard
            icon={Leaf}
            label={t("nutrition.foods.storage", "储存")}
            value={food.storage ? t(`nutrition.enum.storage.${food.storage}`, food.storage) : "-"}
          />
          <NutritionMetricCard
            label={t("nutrition.foods.lifecycle", "周期")}
            value={
              food.lifecycle ? t(`nutrition.enum.lifecycle.${food.lifecycle}`, food.lifecycle) : "-"
            }
          />
          <NutritionMetricCard
            icon={Search}
            label={t("nutrition.foods.nutrition", "营养")}
            value={
              profile
                ? t("nutrition.foods.hasProfile", "已录入")
                : t("nutrition.foods.missingProfile", "待补")
            }
          />
        </div>

        <div className="mt-4 grid min-h-0 flex-1 gap-3 overflow-y-auto pr-1 lg:grid-cols-2">
          <div className="border-foreground/10 bg-background/70 rounded-2xl border p-4">
            <h4 className="text-sm font-semibold">
              {t("nutrition.foods.dietaryTags", "饮食标签")}
            </h4>
            {dietaryTagNames.length > 0 ? (
              <NutritionTagBar names={dietaryTagNames} className="mt-3" />
            ) : (
              <p className="text-muted-foreground mt-3 text-xs leading-5">
                {t("nutrition.foods.noDietaryTags", "暂无饮食标签或过敏原。")}
              </p>
            )}
          </div>
          <div className="border-foreground/10 bg-background/70 rounded-2xl border p-4">
            <h4 className="text-sm font-semibold">
              {t("nutrition.foods.nutrientProfile", "营养档案")}
            </h4>
            {profile ? (
              <div className="mt-3 space-y-2 text-sm">
                <NutrientLine
                  label={t("nutrition.nutrients.energyKcal", "能量")}
                  value={formatProfileNutrient(profile.energyKcal, "kcal", 0, t)}
                />
                <NutrientLine
                  label={t("nutrition.nutrients.proteinG", "蛋白质")}
                  value={formatProfileNutrient(profile.proteinG, "g", 1, t)}
                />
                <NutrientLine
                  label={t("nutrition.nutrients.carbG", "碳水")}
                  value={formatProfileNutrient(profile.carbG, "g", 1, t)}
                />
                <NutrientLine
                  label={t("nutrition.nutrients.sodiumMg", "钠")}
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
    return t("nutrition.nutrients.pending", "待补")
  }

  return `${formatNutrientValue(value, digits)} ${unit}`
}
