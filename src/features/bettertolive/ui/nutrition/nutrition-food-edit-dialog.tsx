import { Trash2 } from "lucide-react"
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
import { useSaveNutritionMutation } from "@/features/bettertolive/queries/use-save-nutrition-mutation"
import type {
  FoodItem,
  FoodNutrientProfile,
  NutritionModuleData,
} from "@/features/bettertolive/types"
import {
  NUTRITION_DIALOG_CONTENT_CLASS,
  NUTRITION_DIALOG_FIELD_CLASS,
  NUTRITION_DIALOG_FOOTER_CLASS,
  NUTRITION_DIALOG_HEADER_CLASS,
  NUTRITION_DIALOG_SECTION_CLASS,
} from "@/features/bettertolive/ui/nutrition/nutrition-page-shared"
import { translateNutritionEnum } from "@/features/bettertolive/ui/nutrition/nutrition-i18n"
import { cn } from "@/lib/utils"

export type EditingFood = {
  isNew: boolean
  food: FoodItem | null
}

type FoodFormState = {
  name: string
  categoryIds: string[]
  defaultUnit: FoodItem["defaultUnit"]
  storage: FoodItem["storage"] | ""
  lifecycle: FoodItem["lifecycle"] | ""
  allergenTagsText: string
  dietaryTagsText: string
  note: string
  energyKcal: string
  proteinG: string
  fatG: string
  carbG: string
  fiberG: string
  sugarG: string
  sodiumMg: string
  source: FoodNutrientProfile["source"]
  confidence: FoodNutrientProfile["confidence"]
}

const DEFAULT_UNIT_OPTIONS: FoodItem["defaultUnit"][] = ["g", "ml", "个", "份"]
const STORAGE_OPTIONS: Array<NonNullable<FoodItem["storage"]>> = ["常温", "冷藏", "冷冻", "即食"]
const LIFECYCLE_OPTIONS: Array<NonNullable<FoodItem["lifecycle"]>> = [
  "新鲜短期",
  "常备",
  "干货",
  "调味",
  "饮品",
]
const SOURCE_OPTIONS: FoodNutrientProfile["source"][] = ["手动", "包装", "食物成分表", "外部导入"]
const CONFIDENCE_OPTIONS: FoodNutrientProfile["confidence"][] = ["高", "中", "低"]
const NONE_VALUE = "__none__"

function normalizeSelectValue(value: string | null) {
  return value === null || value === NONE_VALUE ? "" : value
}

export function NutritionFoodEditDialog({
  editing,
  nutrition,
  onClose,
}: {
  editing: EditingFood
  nutrition: NutritionModuleData
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveNutritionMutation = useSaveNutritionMutation()
  const existingProfile = editing.food
    ? nutrition.nutrientProfiles.find((profile) => profile.foodId === editing.food?.id)
    : undefined
  const referencedByRecipes = editing.food
    ? nutrition.recipes.filter((recipe) =>
        recipe.ingredients.some((ingredient) => ingredient.foodId === editing.food?.id),
      )
    : []
  const referencedByPlans = editing.food
    ? nutrition.dailyPlans.filter((plan) =>
        plan.slots.some((slot) =>
          slot.entries.some((entry) => entry.type === "food" && entry.foodId === editing.food?.id),
        ),
      )
    : []
  const referencedByLogs = editing.food
    ? nutrition.mealLogs.filter((log) =>
        log.entries.some((entry) => entry.type === "food" && entry.foodId === editing.food?.id),
      )
    : []
  const referenceCount =
    referencedByRecipes.length + referencedByPlans.length + referencedByLogs.length
  const categoryOptions = useMemo<MultiSelectOption[]>(
    () =>
      nutrition.foodCategories.map((category) => ({
        value: category.id,
        label: `${category.name} · ${translateNutritionEnum(t, "foodCategoryDimension", category.dimension)}`,
      })),
    [nutrition.foodCategories, t],
  )
  const [form, setForm] = useState<FoodFormState>(() =>
    createInitialForm(editing.food, existingProfile),
  )

  const updateForm = (patch: Partial<FoodFormState>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error(t("nutrition.foodEdit.validation.nameRequired"))
      return
    }

    if (form.categoryIds.length === 0) {
      toast.error(t("nutrition.foodEdit.validation.categoryRequired"))
      return
    }

    const nextFoodId = editing.food?.id ?? createId("food")
    const nextProfile = createNextProfile({
      existingProfile,
      foodId: nextFoodId,
      form,
    })
    const nextFood: FoodItem = {
      id: nextFoodId,
      name: form.name.trim(),
      categoryIds: form.categoryIds,
      defaultUnit: form.defaultUnit,
      storage: form.storage || undefined,
      lifecycle: form.lifecycle || undefined,
      allergenTags: splitTags(form.allergenTagsText),
      dietaryTags: splitTags(form.dietaryTagsText),
      nutrientProfileId: nextProfile?.id,
      note: form.note.trim() || undefined,
    }
    const nextFoods = editing.isNew
      ? [...nutrition.foods, nextFood]
      : nutrition.foods.map((food) => (food.id === nextFood.id ? nextFood : food))
    const nextProfilesWithoutCurrent = nutrition.nutrientProfiles.filter(
      (profile) => profile.foodId !== nextFood.id,
    )

    try {
      await saveNutritionMutation.mutateAsync({
        ...nutrition,
        foods: nextFoods,
        nutrientProfiles: nextProfile
          ? [...nextProfilesWithoutCurrent, nextProfile]
          : nextProfilesWithoutCurrent,
      })
      toast.success(t("nutrition.foodEdit.saved"))
      onClose()
    } catch {
      toast.error(t("nutrition.foodEdit.saveFailed"))
    }
  }

  const handleDelete = async () => {
    if (!editing.food || referenceCount > 0) {
      return
    }

    try {
      await saveNutritionMutation.mutateAsync({
        ...nutrition,
        foods: nutrition.foods.filter((food) => food.id !== editing.food?.id),
        nutrientProfiles: nutrition.nutrientProfiles.filter(
          (profile) => profile.foodId !== editing.food?.id,
        ),
      })
      toast.success(t("nutrition.foodEdit.deleted"))
      onClose()
    } catch {
      toast.error(t("nutrition.foodEdit.deleteFailed"))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent
        className={cn(
          NUTRITION_DIALOG_CONTENT_CLASS,
          "flex max-h-[min(760px,calc(100dvh-2rem))] max-w-4xl flex-col overflow-hidden",
        )}
      >
        <DialogHeader className={NUTRITION_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew
              ? t("nutrition.foodEdit.createTitle")
              : t("nutrition.foodEdit.editTitle")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "nutrition.foodEdit.description",
              "食品是饮食模块的基础数据源，会被食谱、每日计划和营养成分表复用。",
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
            <section className={NUTRITION_DIALOG_SECTION_CLASS}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t("nutrition.foodEdit.name")}>
                  <Input
                    value={form.name}
                    onChange={(event) => updateForm({ name: event.target.value })}
                    className={NUTRITION_DIALOG_FIELD_CLASS}
                    placeholder={t(
                      "nutrition.foodEdit.namePlaceholder",
                      "例如：鸡蛋、番茄、杂粮饭",
                    )}
                  />
                </Field>

                <Field label={t("nutrition.foodEdit.defaultUnit")}>
                  <Select
                    value={form.defaultUnit}
                    onValueChange={(value) =>
                      updateForm({
                        defaultUnit: (normalizeSelectValue(value) ||
                          form.defaultUnit) as FoodItem["defaultUnit"],
                      })
                    }
                  >
                    <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEFAULT_UNIT_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t(`nutrition.enum.unit.${option}`, option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label={t("nutrition.foodEdit.categories")}>
                <MultiSelect
                  options={categoryOptions}
                  value={form.categoryIds}
                  onChange={(categoryIds) => updateForm({ categoryIds })}
                  placeholder={t("nutrition.foodEdit.categoriesPlaceholder")}
                  searchPlaceholder={t("nutrition.foodEdit.categoriesSearch")}
                  emptyMessage={t("nutrition.foodEdit.categoriesEmpty")}
                />
              </Field>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t("nutrition.foodEdit.storage")}>
                  <Select
                    value={form.storage || NONE_VALUE}
                    onValueChange={(value) =>
                      updateForm({
                        storage: normalizeSelectValue(value) as FoodFormState["storage"],
                      })
                    }
                  >
                    <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>{t("nutrition.common.optional")}</SelectItem>
                      {STORAGE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t(`nutrition.enum.storage.${option}`, option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label={t("nutrition.foodEdit.lifecycle")}>
                  <Select
                    value={form.lifecycle || NONE_VALUE}
                    onValueChange={(value) =>
                      updateForm({
                        lifecycle: normalizeSelectValue(value) as FoodFormState["lifecycle"],
                      })
                    }
                  >
                    <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>{t("nutrition.common.optional")}</SelectItem>
                      {LIFECYCLE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t(`nutrition.enum.lifecycle.${option}`, option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t("nutrition.foodEdit.dietaryTags")}>
                  <Input
                    value={form.dietaryTagsText}
                    onChange={(event) => updateForm({ dietaryTagsText: event.target.value })}
                    className={NUTRITION_DIALOG_FIELD_CLASS}
                    placeholder={t("nutrition.foodEdit.tagsPlaceholder")}
                  />
                </Field>
                <Field label={t("nutrition.foodEdit.allergenTags")}>
                  <Input
                    value={form.allergenTagsText}
                    onChange={(event) => updateForm({ allergenTagsText: event.target.value })}
                    className={NUTRITION_DIALOG_FIELD_CLASS}
                    placeholder={t("nutrition.foodEdit.tagsPlaceholder")}
                  />
                </Field>
              </div>

              <Field label={t("nutrition.foodEdit.note")}>
                <Textarea
                  value={form.note}
                  onChange={(event) => updateForm({ note: event.target.value })}
                  className={NUTRITION_DIALOG_FIELD_CLASS}
                  placeholder={t("nutrition.foodEdit.notePlaceholder")}
                />
              </Field>
            </section>

            <section className={NUTRITION_DIALOG_SECTION_CLASS}>
              <div>
                <h3 className="text-sm font-semibold">
                  {t("nutrition.foodEdit.nutritionSection")}
                </h3>
                <p className="text-muted-foreground mt-1 text-xs leading-5">
                  {t(
                    "nutrition.foodEdit.nutritionDescription",
                    "按每 100g / 100ml 维护。留空时不会按 0 计算，而是在营养表显示待补。",
                  )}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-4">
                <NumberField
                  label={t("nutrition.nutrients.energyKcal")}
                  value={form.energyKcal}
                  onChange={(energyKcal) => updateForm({ energyKcal })}
                  suffix="kcal"
                />
                <NumberField
                  label={t("nutrition.nutrients.proteinG")}
                  value={form.proteinG}
                  onChange={(proteinG) => updateForm({ proteinG })}
                  suffix="g"
                />
                <NumberField
                  label={t("nutrition.nutrients.fatG")}
                  value={form.fatG}
                  onChange={(fatG) => updateForm({ fatG })}
                  suffix="g"
                />
                <NumberField
                  label={t("nutrition.nutrients.carbG")}
                  value={form.carbG}
                  onChange={(carbG) => updateForm({ carbG })}
                  suffix="g"
                />
                <NumberField
                  label={t("nutrition.nutrients.fiberG")}
                  value={form.fiberG}
                  onChange={(fiberG) => updateForm({ fiberG })}
                  suffix="g"
                />
                <NumberField
                  label={t("nutrition.nutrients.sugarG")}
                  value={form.sugarG}
                  onChange={(sugarG) => updateForm({ sugarG })}
                  suffix="g"
                />
                <NumberField
                  label={t("nutrition.nutrients.sodiumMg")}
                  value={form.sodiumMg}
                  onChange={(sodiumMg) => updateForm({ sodiumMg })}
                  suffix="mg"
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t("nutrition.foodEdit.source")}>
                  <Select
                    value={form.source}
                    onValueChange={(value) =>
                      updateForm({
                        source: (normalizeSelectValue(value) ||
                          form.source) as FoodNutrientProfile["source"],
                      })
                    }
                  >
                    <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t(`nutrition.enum.source.${option}`, option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label={t("nutrition.foodEdit.confidence")}>
                  <Select
                    value={form.confidence}
                    onValueChange={(value) =>
                      updateForm({
                        confidence: (normalizeSelectValue(value) ||
                          form.confidence) as FoodNutrientProfile["confidence"],
                      })
                    }
                  >
                    <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONFIDENCE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {t(`nutrition.enum.confidence.${option}`, option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
            </section>

            {!editing.isNew && referenceCount > 0 ? (
              <div className="border-foreground/15 bg-muted/25 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs leading-5">
                {t(
                  "nutrition.foodEdit.deleteBlocked",
                  "该食品已被 {{count}} 个食谱、计划或记录引用，暂不能删除。",
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
                {t("nutrition.foodEdit.delete")}
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onClose}>
              {t("nutrition.common.cancel")}
            </Button>
            <Button type="submit" disabled={saveNutritionMutation.isPending}>
              {saveNutritionMutation.isPending
                ? t("nutrition.common.saving")
                : t("nutrition.common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function createInitialForm(
  food: FoodItem | null,
  profile: FoodNutrientProfile | undefined,
): FoodFormState {
  return {
    name: food?.name ?? "",
    categoryIds: food?.categoryIds ?? [],
    defaultUnit: food?.defaultUnit ?? "g",
    storage: food?.storage ?? "",
    lifecycle: food?.lifecycle ?? "",
    allergenTagsText: (food?.allergenTags ?? []).join(", "),
    dietaryTagsText: (food?.dietaryTags ?? []).join(", "),
    note: food?.note ?? "",
    energyKcal: stringifyNumber(profile?.energyKcal),
    proteinG: stringifyNumber(profile?.proteinG),
    fatG: stringifyNumber(profile?.fatG),
    carbG: stringifyNumber(profile?.carbG),
    fiberG: stringifyNumber(profile?.fiberG),
    sugarG: stringifyNumber(profile?.sugarG),
    sodiumMg: stringifyNumber(profile?.sodiumMg),
    source: profile?.source ?? "手动",
    confidence: profile?.confidence ?? "中",
  }
}

function createNextProfile({
  existingProfile,
  foodId,
  form,
}: {
  existingProfile?: FoodNutrientProfile
  foodId: string
  form: FoodFormState
}): FoodNutrientProfile | null {
  const nutrientValues = {
    energyKcal: parseOptionalNumber(form.energyKcal),
    proteinG: parseOptionalNumber(form.proteinG),
    fatG: parseOptionalNumber(form.fatG),
    carbG: parseOptionalNumber(form.carbG),
    fiberG: parseOptionalNumber(form.fiberG),
    sugarG: parseOptionalNumber(form.sugarG),
    sodiumMg: parseOptionalNumber(form.sodiumMg),
  }
  const hasAnyNutrient = Object.values(nutrientValues).some((value) => value !== undefined)

  if (!hasAnyNutrient) {
    return null
  }

  return {
    id: existingProfile?.id ?? createId("nutrient"),
    foodId,
    basisAmount: 100,
    basisUnit: form.defaultUnit === "ml" ? "ml" : "g",
    ...nutrientValues,
    source: form.source,
    confidence: form.confidence,
  }
}

function splitTags(value: string) {
  return value
    .split(/[,，]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) {
    return undefined
  }

  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function stringifyNumber(value: number | undefined) {
  return typeof value === "number" ? String(value) : ""
}

function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }

  return `${prefix}-${Date.now()}`
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
  suffix,
  value,
}: {
  label: string
  onChange: (value: string) => void
  suffix: string
  value: string
}) {
  return (
    <Field label={label}>
      <div className="relative">
        <Input
          type="number"
          min={0}
          step="0.1"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={cn(NUTRITION_DIALOG_FIELD_CLASS, "pr-12")}
        />
        <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
          {suffix}
        </span>
      </div>
    </Field>
  )
}
