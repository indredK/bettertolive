import { generateId } from "@/lib/id-utils"
import { Plus, Trash2 } from "lucide-react"
import type { FormEvent, ReactNode } from "react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { MultiSelect, type MultiSelectOption } from "@/components/ui/multi-select"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useSaveNutritionMutation } from "@/features/bettertolive/nutrition/queries"
import type {
  MealStructure,
  NutritionModuleData,
  Recipe,
  RecipeIngredient,
} from "@/features/bettertolive/types"
import {
  NUTRITION_DIALOG_CONTENT_CLASS,
  NUTRITION_DIALOG_FIELD_CLASS,
  NUTRITION_DIALOG_FOOTER_CLASS,
  NUTRITION_DIALOG_HEADER_CLASS,
  NUTRITION_DIALOG_SECTION_CLASS,
} from "@/features/bettertolive/nutrition/nutrition-page-shared"
import { cn } from "@/lib/utils"

export type EditingRecipe = {
  isNew: boolean
  recipe: Recipe | null
}

type RecipeIngredientForm = {
  foodId: string
  amount: string
  unit: RecipeIngredient["unit"]
  note: string
}

type RecipeFormState = {
  name: string
  summary: string
  servings: string
  mealRoles: MealStructure[]
  linkedFoodMemoryId: string
  ingredients: RecipeIngredientForm[]
  stepsText: string
  prepMinutes: string
  cookMinutes: string
  difficulty: Recipe["difficulty"]
  repeatability: Recipe["repeatability"]
  tagsText: string
}

const MEAL_ROLE_OPTIONS: MealStructure[] = [
  "早餐",
  "午餐",
  "晚餐",
  "加餐",
  "夜宵",
  "节庆餐",
  "饮品",
]
const INGREDIENT_UNIT_OPTIONS: RecipeIngredient["unit"][] = ["g", "ml", "个", "份"]
const DIFFICULTY_OPTIONS: Recipe["difficulty"][] = ["简单", "中等", "麻烦"]
const REPEATABILITY_OPTIONS: Recipe["repeatability"][] = ["常做", "偶尔", "只想记录"]
const NONE_VALUE = "__none__"

function normalizeSelectValue(value: string | null) {
  return value === null || value === NONE_VALUE ? "" : value
}

export function NutritionRecipeEditDialog({
  editing,
  nutrition,
  onClose,
}: {
  editing: EditingRecipe
  nutrition: NutritionModuleData
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveNutritionMutation = useSaveNutritionMutation()
  const [form, setForm] = useState<RecipeFormState>(() =>
    createInitialForm(editing.recipe, nutrition.foods[0]?.id ?? ""),
  )
  const foodOptions = useMemo(
    () => nutrition.foods.map((food) => ({ value: food.id, label: food.name })),
    [nutrition.foods],
  )
  const foodMemoryOptions = useMemo(
    () =>
      (nutrition.foodMemories ?? []).map((memory) => ({
        value: memory.id,
        label: `${memory.name} · ${t(`nutrition.enum.foodMemoryType.${memory.type}`, memory.type)}`,
      })),
    [nutrition.foodMemories, t],
  )
  const mealRoleOptions = useMemo<MultiSelectOption[]>(
    () =>
      MEAL_ROLE_OPTIONS.map((role) => ({
        value: role,
        label: t(`nutrition.enum.mealRole.${role}`, role),
      })),
    [t],
  )
  const linkedFoodMemoryOptions = [...foodMemoryOptions]

  if (
    form.linkedFoodMemoryId &&
    !linkedFoodMemoryOptions.some((option) => option.value === form.linkedFoodMemoryId)
  ) {
    linkedFoodMemoryOptions.push({
      value: form.linkedFoodMemoryId,
      label: t("nutrition.recipeEdit.missingFoodMemory"),
    })
  }
  const referencedByPlans = editing.recipe
    ? nutrition.dailyPlans.filter((plan) =>
        plan.slots.some((slot) =>
          slot.entries.some(
            (entry) => entry.type === "recipe" && entry.recipeId === editing.recipe?.id,
          ),
        ),
      )
    : []
  const referencedByLogs = editing.recipe
    ? nutrition.mealLogs.filter((log) =>
        log.entries.some(
          (entry) => entry.type === "recipe" && entry.recipeId === editing.recipe?.id,
        ),
      )
    : []
  const referenceCount = referencedByPlans.length + referencedByLogs.length

  const updateForm = (patch: Partial<RecipeFormState>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const updateIngredient = (index: number, patch: Partial<RecipeIngredientForm>) => {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, ingredientIndex) =>
        ingredientIndex === index ? { ...ingredient, ...patch } : ingredient,
      ),
    }))
  }

  const addIngredient = () => {
    setForm((current) => ({
      ...current,
      ingredients: [...current.ingredients, createEmptyIngredient(nutrition.foods[0]?.id ?? "")],
    }))
  }

  const removeIngredient = (index: number) => {
    setForm((current) => ({
      ...current,
      ingredients: current.ingredients.filter((_, ingredientIndex) => ingredientIndex !== index),
    }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error(t("nutrition.recipeEdit.validation.nameRequired"))
      return
    }

    if (form.mealRoles.length === 0) {
      toast.error(t("nutrition.recipeEdit.validation.mealRoleRequired"))
      return
    }

    const nextIngredients = form.ingredients
      .map((ingredient) => ({
        foodId: ingredient.foodId,
        amount: Number(ingredient.amount),
        unit: ingredient.unit,
        note: ingredient.note.trim() || undefined,
      }))
      .filter(
        (ingredient) =>
          ingredient.foodId && Number.isFinite(ingredient.amount) && ingredient.amount > 0,
      )

    if (nextIngredients.length === 0) {
      toast.error(t("nutrition.recipeEdit.validation.ingredientsRequired"))
      return
    }

    const steps = form.stepsText
      .split("\n")
      .map((step) => step.trim())
      .filter(Boolean)

    if (steps.length === 0) {
      toast.error(t("nutrition.recipeEdit.validation.stepsRequired"))
      return
    }

    const nextRecipeId = editing.recipe?.id ?? generateId("recipe")
    const nextRecipe: Recipe = {
      id: nextRecipeId,
      name: form.name.trim(),
      summary: form.summary.trim() || undefined,
      servings: parsePositiveNumber(form.servings, 1),
      mealRoles: form.mealRoles,
      ingredients: nextIngredients,
      steps,
      prepMinutes: parseOptionalPositiveNumber(form.prepMinutes),
      cookMinutes: parseOptionalPositiveNumber(form.cookMinutes),
      difficulty: form.difficulty,
      repeatability: form.repeatability,
      tags: splitTags(form.tagsText),
      ...(form.linkedFoodMemoryId ? { linkedFoodMemoryId: form.linkedFoodMemoryId } : {}),
    }
    const nextRecipes = editing.isNew
      ? [...nutrition.recipes, nextRecipe]
      : nutrition.recipes.map((recipe) => (recipe.id === nextRecipe.id ? nextRecipe : recipe))

    try {
      await saveNutritionMutation.mutateAsync({
        ...nutrition,
        recipes: nextRecipes,
      })
      toast.success(t("common.toast.saved"))
      onClose()
    } catch {
      toast.error(t("common.toast.saveFailed"))
    }
  }

  const handleDelete = async () => {
    if (!editing.recipe || referenceCount > 0) {
      return
    }

    try {
      await saveNutritionMutation.mutateAsync({
        ...nutrition,
        recipes: nutrition.recipes.filter((recipe) => recipe.id !== editing.recipe?.id),
      })
      toast.success(t("common.toast.deleted"))
      onClose()
    } catch {
      toast.error(t("common.toast.deleteFailed"))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent
        className={cn(
          NUTRITION_DIALOG_CONTENT_CLASS,
          "flex max-h-[min(780px,calc(100dvh-2rem))] max-w-5xl flex-col overflow-hidden",
        )}
      >
        <DialogHeader className={NUTRITION_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew
              ? t("nutrition.recipeEdit.createTitle")
              : t("nutrition.recipeEdit.editTitle")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "nutrition.recipeEdit.description",
              "食谱引用食品库食材，营养成分会从食材自动派生。",
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
            <section className={NUTRITION_DIALOG_SECTION_CLASS}>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
                <Field label={t("nutrition.recipeEdit.name")}>
                  <Input
                    value={form.name}
                    onChange={(event) => updateForm({ name: event.target.value })}
                    className={NUTRITION_DIALOG_FIELD_CLASS}
                    placeholder={t("nutrition.recipeEdit.namePlaceholder")}
                  />
                </Field>
                <NumberField
                  label={t("nutrition.recipeEdit.servings")}
                  value={form.servings}
                  onChange={(servings) => updateForm({ servings })}
                />
              </div>

              <Field label={t("nutrition.recipeEdit.summary")}>
                <Textarea
                  value={form.summary}
                  onChange={(event) => updateForm({ summary: event.target.value })}
                  className={cn(NUTRITION_DIALOG_FIELD_CLASS, "min-h-16")}
                  placeholder={t(
                    "nutrition.recipeEdit.summaryPlaceholder",
                    "这道食谱适合什么场景？",
                  )}
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t("nutrition.recipeEdit.mealRoles")}>
                  <MultiSelect
                    options={mealRoleOptions}
                    value={form.mealRoles}
                    onChange={(mealRoles) =>
                      updateForm({ mealRoles: mealRoles as MealStructure[] })
                    }
                    placeholder={t("nutrition.recipeEdit.mealRolesPlaceholder")}
                    searchPlaceholder={t("nutrition.recipeEdit.mealRolesSearch")}
                    emptyMessage={t("nutrition.recipeEdit.mealRolesEmpty")}
                  />
                </Field>

                <Field label={t("nutrition.recipeEdit.tags")}>
                  <Input
                    value={form.tagsText}
                    onChange={(event) => updateForm({ tagsText: event.target.value })}
                    className={NUTRITION_DIALOG_FIELD_CLASS}
                    placeholder={t("common.form.tagsPlaceholder")}
                  />
                </Field>
              </div>

              {linkedFoodMemoryOptions.length > 0 ? (
                <Field label={t("nutrition.recipeEdit.linkedFoodMemory")}>
                  <Select
                    value={form.linkedFoodMemoryId || NONE_VALUE}
                    onValueChange={(linkedFoodMemoryId) =>
                      updateForm({
                        linkedFoodMemoryId: normalizeSelectValue(linkedFoodMemoryId),
                      })
                    }
                  >
                    <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>
                        {t("nutrition.recipeEdit.noFoodMemory")}
                      </SelectItem>
                      {linkedFoodMemoryOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              ) : null}

              <div className="grid gap-4 md:grid-cols-4">
                <NumberField
                  label={t("nutrition.recipeEdit.prepMinutes")}
                  value={form.prepMinutes}
                  onChange={(prepMinutes) => updateForm({ prepMinutes })}
                />
                <NumberField
                  label={t("nutrition.recipeEdit.cookMinutes")}
                  value={form.cookMinutes}
                  onChange={(cookMinutes) => updateForm({ cookMinutes })}
                />
                <Field label={t("nutrition.recipeEdit.difficulty")}>
                  <Select
                    value={form.difficulty}
                    onValueChange={(difficulty) =>
                      updateForm({
                        difficulty: (normalizeSelectValue(difficulty) ||
                          form.difficulty) as Recipe["difficulty"],
                      })
                    }
                  >
                    <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t(`nutrition.enum.difficulty.${option}`, option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={t("nutrition.recipeEdit.repeatability")}>
                  <Select
                    value={form.repeatability}
                    onValueChange={(repeatability) =>
                      updateForm({
                        repeatability: (normalizeSelectValue(repeatability) ||
                          form.repeatability) as Recipe["repeatability"],
                      })
                    }
                  >
                    <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REPEATABILITY_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t(`nutrition.enum.repeatability.${option}`, option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </section>

            <section className={NUTRITION_DIALOG_SECTION_CLASS}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">{t("nutrition.recipeEdit.ingredients")}</h3>
                  <p className="text-muted-foreground mt-1 text-xs leading-5">
                    {t(
                      "nutrition.recipeEdit.ingredientsHint",
                      "食材来自食品库，后续营养会按用量派生。",
                    )}
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addIngredient}>
                  <Plus className="size-3.5" />
                  {t("nutrition.recipeEdit.addIngredient")}
                </Button>
              </div>

              <div className="space-y-2">
                {form.ingredients.map((ingredient, index) => (
                  <div
                    key={`${index}-${ingredient.foodId}`}
                    className="border-foreground/10 bg-background/70 grid gap-3 rounded-xl border p-3 lg:grid-cols-[minmax(180px,1fr)_120px_100px_minmax(160px,0.8fr)_auto]"
                  >
                    <Field label={t("nutrition.recipeEdit.food")}>
                      <Select
                        value={ingredient.foodId || NONE_VALUE}
                        onValueChange={(foodId) =>
                          updateIngredient(index, { foodId: normalizeSelectValue(foodId) })
                        }
                      >
                        <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={NONE_VALUE}>
                            {t("nutrition.recipeEdit.selectFood")}
                          </SelectItem>
                          {ingredient.foodId &&
                          !foodOptions.some((option) => option.value === ingredient.foodId) ? (
                            <SelectItem value={ingredient.foodId}>
                              {t("nutrition.recipeEdit.missingFood")}
                            </SelectItem>
                          ) : null}
                          {foodOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <NumberField
                      label={t("nutrition.recipeEdit.amount")}
                      value={ingredient.amount}
                      onChange={(amount) => updateIngredient(index, { amount })}
                    />
                    <Field label={t("nutrition.recipeEdit.unit")}>
                      <Select
                        value={ingredient.unit}
                        onValueChange={(unit) =>
                          updateIngredient(index, {
                            unit: (normalizeSelectValue(unit) ||
                              ingredient.unit) as RecipeIngredient["unit"],
                          })
                        }
                      >
                        <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {INGREDIENT_UNIT_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {t(`nutrition.enum.unit.${option}`, option)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label={t("nutrition.recipeEdit.ingredientNote")}>
                      <Input
                        value={ingredient.note}
                        onChange={(event) => updateIngredient(index, { note: event.target.value })}
                        className={NUTRITION_DIALOG_FIELD_CLASS}
                      />
                    </Field>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeIngredient(index)}
                        disabled={form.ingredients.length <= 1}
                        tooltip={t("common.actions.delete")}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={NUTRITION_DIALOG_SECTION_CLASS}>
              <Field label={t("nutrition.recipeEdit.steps")}>
                <Textarea
                  value={form.stepsText}
                  onChange={(event) => updateForm({ stepsText: event.target.value })}
                  className={cn(NUTRITION_DIALOG_FIELD_CLASS, "min-h-36")}
                  placeholder={t("nutrition.recipeEdit.stepsPlaceholder")}
                />
              </Field>
            </section>

            {!editing.isNew && referenceCount > 0 ? (
              <div className="border-foreground/15 bg-muted/25 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs leading-5">
                {t(
                  "nutrition.recipeEdit.deleteBlocked",
                  "该食谱已被 {{count}} 个计划或记录引用，暂不能删除。",
                  { count: referenceCount },
                )}
              </div>
            ) : null}
          </div>

          <DialogFooter className={NUTRITION_DIALOG_FOOTER_CLASS}>
            {!editing.isNew ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={referenceCount > 0 || saveNutritionMutation.isPending}
                className="mr-auto"
              >
                <Trash2 className="size-4" />
                {t("common.actions.delete")}
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit" disabled={saveNutritionMutation.isPending}>
              {saveNutritionMutation.isPending
                ? t("common.actions.saving")
                : t("common.actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function createInitialForm(recipe: Recipe | null, defaultFoodId: string): RecipeFormState {
  const ingredients =
    recipe?.ingredients.map((ingredient) => ({
      foodId: ingredient.foodId,
      amount: String(ingredient.amount),
      unit: ingredient.unit,
      note: ingredient.note ?? "",
    })) ?? []

  return {
    name: recipe?.name ?? "",
    summary: recipe?.summary ?? "",
    servings: String(recipe?.servings ?? 1),
    mealRoles: recipe?.mealRoles ?? ["午餐"],
    linkedFoodMemoryId: recipe?.linkedFoodMemoryId ?? "",
    ingredients: ingredients.length > 0 ? ingredients : [createEmptyIngredient(defaultFoodId)],
    stepsText: (recipe?.steps ?? []).join("\n"),
    prepMinutes: stringifyNumber(recipe?.prepMinutes),
    cookMinutes: stringifyNumber(recipe?.cookMinutes),
    difficulty: recipe?.difficulty ?? "简单",
    repeatability: recipe?.repeatability ?? "偶尔",
    tagsText: (recipe?.tags ?? []).join(", "),
  }
}

function createEmptyIngredient(defaultFoodId: string): RecipeIngredientForm {
  return {
    foodId: defaultFoodId,
    amount: "",
    unit: "g",
    note: "",
  }
}

function splitTags(value: string) {
  return value
    .split(/[,，]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function parseOptionalPositiveNumber(value: string) {
  if (!value.trim()) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined
}

function parsePositiveNumber(value: string, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

function stringifyNumber(value: number | undefined) {
  return typeof value === "number" ? String(value) : ""
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function NumberField({
  label,
  onChange,
  value,
}: {
  label: string
  onChange: (value: string) => void
  value: string
}) {
  return (
    <Field label={label}>
      <Input
        type="number"
        min={0}
        step="0.1"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={NUTRITION_DIALOG_FIELD_CLASS}
      />
    </Field>
  )
}
