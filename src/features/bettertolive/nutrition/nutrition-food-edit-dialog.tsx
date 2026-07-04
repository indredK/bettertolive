import type { ReactNode } from "react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
/* eslint-disable react-hooks/incompatible-library */
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

import { useDirtyConfirm } from "@/features/bettertolive/hooks/use-dirty-confirm"

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
import { confirmUndoableDelete } from "@/features/bettertolive/shared/shopping-delete"
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
} from "@/features/bettertolive/nutrition/nutrition-page-shared"
import { translateNutritionEnum } from "@/features/bettertolive/nutrition/nutrition-i18n"
import { generateId } from "@/lib/id-utils"
import { joinListText, splitListText } from "@/lib/list-utils"
import { cn } from "@/lib/utils"

export type EditingFood = {
  isNew: boolean
  food: FoodItem | null
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
const SUGAR_KIND_OPTIONS: NonNullable<FoodNutrientProfile["sugarKind"]>[] = [
  "天然存在",
  "游离糖/添加糖",
  "混合",
  "未知",
]
const PROTEIN_SOURCE_OPTIONS: NonNullable<FoodNutrientProfile["proteinSource"]>[] = [
  "蛋类",
  "奶类",
  "豆制品",
  "豆类",
  "鱼虾海鲜",
  "禽肉",
  "畜肉",
  "加工肉",
]
const PROCESSING_LEVEL_OPTIONS: NonNullable<FoodNutrientProfile["processingLevel"]>[] = [
  "原食材",
  "轻加工",
  "中度加工",
  "高度加工",
]
const SODIUM_RISK_OPTIONS: NonNullable<FoodNutrientProfile["sodiumRiskLevel"]>[] = [
  "低",
  "中",
  "高",
]
const PORTION_UNIT_OPTIONS: Array<"个" | "份"> = ["个", "份"]
const NONE_VALUE = "__none__"
type PersistedPortionProfile = {
  unit: "个" | "份"
  estimatedGrams: number
  note?: string
}

const nutrientFieldNames = [
  "energyKcal",
  "proteinG",
  "fatG",
  "saturatedFatG",
  "carbG",
  "fiberG",
  "sugarG",
  "addedSugarG",
  "sodiumMg",
  "calciumMg",
  "ironMg",
  "potassiumMg",
] as const satisfies ReadonlyArray<keyof FoodFormValues>

const portionProfileSchema = z.object({
  unit: z.enum(PORTION_UNIT_OPTIONS),
  estimatedGrams: z.string(),
  note: z.string(),
})

const foodFormSchema = z
  .object({
    name: z.string().trim().min(1),
    categoryIds: z.array(z.string()).min(1),
    defaultUnit: z.enum(DEFAULT_UNIT_OPTIONS),
    storage: z.union([z.enum(STORAGE_OPTIONS), z.literal("")]),
    lifecycle: z.union([z.enum(LIFECYCLE_OPTIONS), z.literal("")]),
    allergenTagsText: z.string(),
    dietaryTagsText: z.string(),
    note: z.string(),
    energyKcal: z.string(),
    proteinG: z.string(),
    fatG: z.string(),
    saturatedFatG: z.string(),
    carbG: z.string(),
    fiberG: z.string(),
    sugarG: z.string(),
    addedSugarG: z.string(),
    sodiumMg: z.string(),
    calciumMg: z.string(),
    ironMg: z.string(),
    potassiumMg: z.string(),
    sugarKind: z.union([z.enum(SUGAR_KIND_OPTIONS), z.literal("")]),
    proteinSource: z.union([z.enum(PROTEIN_SOURCE_OPTIONS), z.literal("")]),
    processingLevel: z.union([z.enum(PROCESSING_LEVEL_OPTIONS), z.literal("")]),
    sodiumRiskLevel: z.union([z.enum(SODIUM_RISK_OPTIONS), z.literal("")]),
    portionProfiles: z.array(portionProfileSchema),
    source: z.enum(SOURCE_OPTIONS),
    confidence: z.enum(CONFIDENCE_OPTIONS),
  })
  .superRefine((values, context) => {
    for (const fieldName of nutrientFieldNames) {
      const rawValue = values[fieldName]
      if (!rawValue.trim()) {
        continue
      }
      if (!Number.isFinite(Number(rawValue))) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [fieldName],
          message: "invalid-number",
        })
        continue
      }
      if (Number(rawValue) < 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: [fieldName],
          message: "negative-number",
        })
      }
    }

    values.portionProfiles.forEach((portionProfile, index) => {
      if (!portionProfile.estimatedGrams.trim()) {
        return
      }
      if (!Number.isFinite(Number(portionProfile.estimatedGrams))) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["portionProfiles", index, "estimatedGrams"],
          message: "invalid-number",
        })
        return
      }
      if (Number(portionProfile.estimatedGrams) <= 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["portionProfiles", index, "estimatedGrams"],
          message: "portion-positive",
        })
      }
    })
  })

type FoodFormValues = z.infer<typeof foodFormSchema>

function createInitialForm(
  food: FoodItem | null,
  profile: FoodNutrientProfile | undefined,
): FoodFormValues {
  const portionProfiles = PORTION_UNIT_OPTIONS.map((unit) => {
    const portionProfile = profile?.portionProfiles?.find((entry) => entry.unit === unit)
    return {
      unit,
      estimatedGrams: stringifyNumber(portionProfile?.estimatedGrams),
      note: portionProfile?.note ?? "",
    }
  })

  return {
    name: food?.name ?? "",
    categoryIds: food?.categoryIds ?? [],
    defaultUnit: food?.defaultUnit ?? "g",
    storage: food?.storage ?? "",
    lifecycle: food?.lifecycle ?? "",
    allergenTagsText: joinListText(food?.allergenTags),
    dietaryTagsText: joinListText(food?.dietaryTags),
    note: food?.note ?? "",
    energyKcal: stringifyNumber(profile?.energyKcal),
    proteinG: stringifyNumber(profile?.proteinG),
    fatG: stringifyNumber(profile?.fatG),
    saturatedFatG: stringifyNumber(profile?.saturatedFatG),
    carbG: stringifyNumber(profile?.carbG),
    fiberG: stringifyNumber(profile?.fiberG),
    sugarG: stringifyNumber(profile?.sugarG),
    addedSugarG: stringifyNumber(profile?.addedSugarG),
    sodiumMg: stringifyNumber(profile?.sodiumMg),
    calciumMg: stringifyNumber(profile?.calciumMg),
    ironMg: stringifyNumber(profile?.ironMg),
    potassiumMg: stringifyNumber(profile?.potassiumMg),
    sugarKind: profile?.sugarKind ?? "",
    proteinSource: profile?.proteinSource ?? "",
    processingLevel: profile?.processingLevel ?? "",
    sodiumRiskLevel: profile?.sodiumRiskLevel ?? "",
    portionProfiles,
    source: profile?.source ?? "手动",
    confidence: profile?.confidence ?? "中",
  }
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

  const form = useForm<FoodFormValues>({
    resolver: zodResolver(foodFormSchema),
    defaultValues: createInitialForm(editing.food, existingProfile),
    mode: "onChange",
  })

  const categoryIds = form.watch("categoryIds")
  const canSubmit = form.formState.isValid

  const handleSubmit = form.handleSubmit(
    async (values) => {
      const nextFoodId = editing.food?.id ?? generateId("food")
      const nextProfile = createNextProfile({
        existingProfile,
        foodId: nextFoodId,
        form: values,
      })

      const nextFood: FoodItem = {
        id: nextFoodId,
        name: values.name.trim(),
        categoryIds: values.categoryIds,
        defaultUnit: values.defaultUnit,
        storage: values.storage || undefined,
        lifecycle: values.lifecycle || undefined,
        allergenTags: splitListText(values.allergenTagsText, /[,，\n]/),
        dietaryTags: splitListText(values.dietaryTagsText, /[,，\n]/),
        nutrientProfileId: nextProfile?.id,
        note: values.note.trim() || undefined,
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
        toast.success(t("common.toast.saved"))
        onClose()
      } catch {
        toast.error(t("common.toast.saveFailed"))
      }
    },
    () => {
      toast.error(t("common.validation.invalidForm"))
    },
  )

  const handleDelete = () => {
    if (!editing.food || referenceCount > 0) {
      return
    }

    confirmUndoableDelete({
      confirmMessage: t("common.confirm.deleteItem", { name: editing.food.name }),
      pendingMessage: t("common.toast.deletePending", { name: editing.food.name }),
      successMessage: t("common.toast.deleted"),
      failureMessage: t("common.toast.deleteFailed"),
      undoLabel: t("common.actions.undo"),
      undoneMessage: t("common.toast.deleteUndone", { name: editing.food.name }),
      onDelete: () =>
        saveNutritionMutation.mutateAsync({
          ...nutrition,
          foods: nutrition.foods.filter((food) => food.id !== editing.food?.id),
          nutrientProfiles: nutrition.nutrientProfiles.filter(
            (profile) => profile.foodId !== editing.food?.id,
          ),
        }),
      onDeleted: () => onClose(),
    })
  }

  const { handleOpenChange, dirtyConfirmDialog } = useDirtyConfirm({
    isDirty: form.formState.isDirty,
    confirmMessage: t("common.confirm.unsavedChanges"),
    cancelLabel: t("common.actions.cancel"),
    confirmLabel: t("common.actions.confirm"),
  })
  const requestClose = () => {
    if (saveNutritionMutation.isPending) {
      return
    }
    handleOpenChange(onClose)(false)
  }

  return (
    <>
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open && saveNutritionMutation.isPending) {
            return
          }
          handleOpenChange(onClose)(open)
        }}
      >
        <DialogContent
          className={cn(
            NUTRITION_DIALOG_CONTENT_CLASS,
            "flex max-h-[min(820px,calc(100dvh-2rem))] max-w-5xl flex-col overflow-hidden",
          )}
        >
          <DialogHeader className={NUTRITION_DIALOG_HEADER_CLASS}>
            <DialogTitle>
              {editing.isNew
                ? t("nutrition.foodEdit.createTitle")
                : t("nutrition.foodEdit.editTitle")}
            </DialogTitle>
            <DialogDescription>{t("nutrition.foodEdit.description")}</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(event) => {
              event.preventDefault()
              void handleSubmit()
            }}
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
              <section className={NUTRITION_DIALOG_SECTION_CLASS}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field
                    error={getFieldErrorMessage(form.formState.errors.name?.message, t, {
                      field: t("nutrition.foodEdit.name"),
                    })}
                    label={t("nutrition.foodEdit.name")}
                  >
                    <Controller
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <Input
                          value={field.value}
                          onChange={field.onChange}
                          className={NUTRITION_DIALOG_FIELD_CLASS}
                          placeholder={t("nutrition.foodEdit.namePlaceholder")}
                        />
                      )}
                    />
                  </Field>

                  <Field label={t("nutrition.foodEdit.defaultUnit")}>
                    <Controller
                      control={form.control}
                      name="defaultUnit"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            if (value !== null) {
                              field.onChange(value)
                            }
                          }}
                        >
                          <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DEFAULT_UNIT_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {t(`nutrition.enum.unit.${option}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                </div>

                <Field
                  error={getFieldErrorMessage(form.formState.errors.categoryIds?.message, t, {
                    field: t("nutrition.foodEdit.categories"),
                  })}
                  label={t("nutrition.foodEdit.categories")}
                >
                  <MultiSelect
                    options={categoryOptions}
                    value={categoryIds}
                    onChange={(nextCategoryIds) =>
                      form.setValue("categoryIds", nextCategoryIds, {
                        shouldDirty: true,
                        shouldTouch: true,
                        shouldValidate: true,
                      })
                    }
                    placeholder={t("nutrition.foodEdit.categoriesPlaceholder")}
                    searchPlaceholder={t("nutrition.foodEdit.categoriesSearch")}
                    emptyMessage={t("nutrition.foodEdit.categoriesEmpty")}
                  />
                </Field>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={t("nutrition.foodEdit.storage")}>
                    <Controller
                      control={form.control}
                      name="storage"
                      render={({ field }) => (
                        <Select
                          value={field.value || NONE_VALUE}
                          onValueChange={(value) => field.onChange(normalizeSelectValue(value))}
                        >
                          <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE_VALUE}>
                              {t("nutrition.common.optional")}
                            </SelectItem>
                            {STORAGE_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {t(`nutrition.enum.storage.${option}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>

                  <Field label={t("nutrition.foodEdit.lifecycle")}>
                    <Controller
                      control={form.control}
                      name="lifecycle"
                      render={({ field }) => (
                        <Select
                          value={field.value || NONE_VALUE}
                          onValueChange={(value) => field.onChange(normalizeSelectValue(value))}
                        >
                          <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE_VALUE}>
                              {t("nutrition.common.optional")}
                            </SelectItem>
                            {LIFECYCLE_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {t(`nutrition.enum.lifecycle.${option}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={t("nutrition.foodEdit.dietaryTags")}>
                    <Controller
                      control={form.control}
                      name="dietaryTagsText"
                      render={({ field }) => (
                        <Input
                          value={field.value}
                          onChange={field.onChange}
                          className={NUTRITION_DIALOG_FIELD_CLASS}
                          placeholder={t("common.form.tagsPlaceholder")}
                        />
                      )}
                    />
                  </Field>

                  <Field label={t("nutrition.foodEdit.allergenTags")}>
                    <Controller
                      control={form.control}
                      name="allergenTagsText"
                      render={({ field }) => (
                        <Input
                          value={field.value}
                          onChange={field.onChange}
                          className={NUTRITION_DIALOG_FIELD_CLASS}
                          placeholder={t("common.form.tagsPlaceholder")}
                        />
                      )}
                    />
                  </Field>
                </div>

                <Field label={t("nutrition.foodEdit.note")}>
                  <Controller
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <Textarea
                        value={field.value}
                        onChange={field.onChange}
                        className={NUTRITION_DIALOG_FIELD_CLASS}
                        placeholder={t("nutrition.foodEdit.notePlaceholder")}
                      />
                    )}
                  />
                </Field>
              </section>

              <section className={NUTRITION_DIALOG_SECTION_CLASS}>
                <div>
                  <h3 className="text-sm font-semibold">
                    {t("nutrition.foodEdit.nutritionSection")}
                  </h3>
                  <p className="text-muted-foreground mt-1 text-xs leading-5">
                    {t("nutrition.foodEdit.nutritionDescription")}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                  <ControlledNumberField
                    control={form.control}
                    label={t("nutrition.nutrients.energyKcal")}
                    name="energyKcal"
                    suffix="kcal"
                  />
                  <ControlledNumberField
                    control={form.control}
                    label={t("nutrition.nutrients.proteinG")}
                    name="proteinG"
                    suffix="g"
                  />
                  <ControlledNumberField
                    control={form.control}
                    label={t("nutrition.nutrients.fatG")}
                    name="fatG"
                    suffix="g"
                  />
                  <ControlledNumberField
                    control={form.control}
                    label={t("nutrition.nutrients.saturatedFatG")}
                    name="saturatedFatG"
                    suffix="g"
                  />
                  <ControlledNumberField
                    control={form.control}
                    label={t("nutrition.nutrients.carbG")}
                    name="carbG"
                    suffix="g"
                  />
                  <ControlledNumberField
                    control={form.control}
                    label={t("nutrition.nutrients.fiberG")}
                    name="fiberG"
                    suffix="g"
                  />
                  <ControlledNumberField
                    control={form.control}
                    label={t("nutrition.nutrients.sugarG")}
                    name="sugarG"
                    suffix="g"
                  />
                  <ControlledNumberField
                    control={form.control}
                    label={t("nutrition.nutrients.addedSugarG")}
                    name="addedSugarG"
                    suffix="g"
                  />
                  <ControlledNumberField
                    control={form.control}
                    label={t("nutrition.nutrients.sodiumMg")}
                    name="sodiumMg"
                    suffix="mg"
                  />
                  <ControlledNumberField
                    control={form.control}
                    label={t("nutrition.nutrients.calciumMg")}
                    name="calciumMg"
                    suffix="mg"
                  />
                  <ControlledNumberField
                    control={form.control}
                    label={t("nutrition.nutrients.ironMg")}
                    name="ironMg"
                    suffix="mg"
                    step="0.1"
                  />
                  <ControlledNumberField
                    control={form.control}
                    label={t("nutrition.nutrients.potassiumMg")}
                    name="potassiumMg"
                    suffix="mg"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <ControlledSelectField
                    control={form.control}
                    label={t("nutrition.foodEdit.sugarKind")}
                    name="sugarKind"
                    options={SUGAR_KIND_OPTIONS.map((option) => ({
                      label: translateNutritionEnum(t, "sugarKind", option),
                      value: option,
                    }))}
                  />
                  <ControlledSelectField
                    control={form.control}
                    label={t("nutrition.foodEdit.proteinSource")}
                    name="proteinSource"
                    options={PROTEIN_SOURCE_OPTIONS.map((option) => ({
                      label: translateNutritionEnum(t, "proteinSource", option),
                      value: option,
                    }))}
                  />
                  <ControlledSelectField
                    control={form.control}
                    label={t("nutrition.foodEdit.processingLevel")}
                    name="processingLevel"
                    options={PROCESSING_LEVEL_OPTIONS.map((option) => ({
                      label: translateNutritionEnum(t, "processingLevel", option),
                      value: option,
                    }))}
                  />
                  <ControlledSelectField
                    control={form.control}
                    label={t("nutrition.foodEdit.sodiumRiskLevel")}
                    name="sodiumRiskLevel"
                    options={SODIUM_RISK_OPTIONS.map((option) => ({
                      label: translateNutritionEnum(t, "sodiumRiskLevel", option),
                      value: option,
                    }))}
                  />
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {PORTION_UNIT_OPTIONS.map((unit, index) => (
                    <div
                      key={unit}
                      className="border-foreground/10 bg-background/70 rounded-2xl border p-3"
                    >
                      <div className="mb-3 text-sm font-medium">
                        {t("nutrition.foodEdit.portionWeight", {
                          unit: translateNutritionEnum(t, "unit", unit),
                        })}
                      </div>
                      <div className="grid gap-3 md:grid-cols-[minmax(0,140px)_minmax(0,1fr)]">
                        <ControlledNumberField
                          control={form.control}
                          label={t("nutrition.foodEdit.estimatedGrams")}
                          name={`portionProfiles.${index}.estimatedGrams`}
                          suffix="g"
                        />
                        <Field label={t("nutrition.foodEdit.portionNote")}>
                          <Controller
                            control={form.control}
                            name={`portionProfiles.${index}.note`}
                            render={({ field }) => (
                              <Input
                                value={field.value}
                                onChange={field.onChange}
                                className={NUTRITION_DIALOG_FIELD_CLASS}
                                placeholder={t("nutrition.foodEdit.portionNotePlaceholder")}
                              />
                            )}
                          />
                        </Field>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Field label={t("nutrition.foodEdit.source")}>
                    <Controller
                      control={form.control}
                      name="source"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            if (value !== null) {
                              field.onChange(value)
                            }
                          }}
                        >
                          <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {SOURCE_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {t(`nutrition.enum.source.${option}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>

                  <Field label={t("nutrition.foodEdit.confidence")}>
                    <Controller
                      control={form.control}
                      name="confidence"
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            if (value !== null) {
                              field.onChange(value)
                            }
                          }}
                        >
                          <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONFIDENCE_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {t(`nutrition.enum.confidence.${option}`)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </Field>
                </div>
              </section>

              {!editing.isNew && referenceCount > 0 ? (
                <div className="border-foreground/15 bg-muted/25 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs leading-5">
                  {t("nutrition.foodEdit.deleteBlocked", { count: referenceCount })}
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
              <Button
                type="button"
                variant="outline"
                onClick={requestClose}
                disabled={saveNutritionMutation.isPending}
              >
                {t("common.actions.cancel")}
              </Button>
              <Button type="submit" disabled={!canSubmit || saveNutritionMutation.isPending}>
                {saveNutritionMutation.isPending
                  ? t("common.actions.saving")
                  : t("common.actions.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {dirtyConfirmDialog}
    </>
  )
}

function createNextProfile({
  existingProfile,
  foodId,
  form,
}: {
  existingProfile?: FoodNutrientProfile
  foodId: string
  form: FoodFormValues
}): FoodNutrientProfile | null {
  const nutrientValues = {
    energyKcal: parseOptionalNumber(form.energyKcal),
    proteinG: parseOptionalNumber(form.proteinG),
    fatG: parseOptionalNumber(form.fatG),
    saturatedFatG: parseOptionalNumber(form.saturatedFatG),
    carbG: parseOptionalNumber(form.carbG),
    fiberG: parseOptionalNumber(form.fiberG),
    sugarG: parseOptionalNumber(form.sugarG),
    addedSugarG: parseOptionalNumber(form.addedSugarG),
    sodiumMg: parseOptionalNumber(form.sodiumMg),
    calciumMg: parseOptionalNumber(form.calciumMg),
    ironMg: parseOptionalNumber(form.ironMg),
    potassiumMg: parseOptionalNumber(form.potassiumMg),
  }

  const portionProfiles = form.portionProfiles.reduce<PersistedPortionProfile[]>(
    (accumulator, portionProfile) => {
      const estimatedGrams = parseOptionalNumber(portionProfile.estimatedGrams)
      if (estimatedGrams === undefined) {
        return accumulator
      }

      accumulator.push({
        unit: portionProfile.unit,
        estimatedGrams,
        note: portionProfile.note.trim() || undefined,
      })

      return accumulator
    },
    [],
  )

  const semanticValues = {
    sugarKind: form.sugarKind || undefined,
    proteinSource: form.proteinSource || undefined,
    processingLevel: form.processingLevel || undefined,
    sodiumRiskLevel: form.sodiumRiskLevel || undefined,
  }

  const hasAnyNutrient = Object.values(nutrientValues).some((value) => value !== undefined)
  const hasAnySemantic = Object.values(semanticValues).some((value) => value !== undefined)
  const hasAnyPortion = portionProfiles.length > 0

  if (!hasAnyNutrient && !hasAnySemantic && !hasAnyPortion) {
    return null
  }

  return {
    id: existingProfile?.id ?? generateId("nutrient"),
    foodId,
    basisAmount: 100,
    basisUnit: form.defaultUnit === "ml" ? "ml" : "g",
    ...nutrientValues,
    ...semanticValues,
    portionProfiles: portionProfiles.length > 0 ? portionProfiles : undefined,
    source: form.source,
    confidence: form.confidence,
  }
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

function normalizeSelectValue(value: string | null) {
  return value === null || value === NONE_VALUE ? "" : value
}

function getFieldErrorMessage(
  message: string | undefined,
  t: ReturnType<typeof useTranslation>["t"],
  params: Record<string, string>,
) {
  if (!message) {
    return undefined
  }

  if (message === "invalid-number") {
    return t("common.validation.invalidForm")
  }
  if (message === "negative-number") {
    return t("common.validation.nonNegative", params)
  }
  if (message === "portion-positive") {
    return t("nutrition.foodEdit.validation.portionPositive")
  }

  return t("common.validation.required", params)
}

function Field({ children, error, label }: { children: ReactNode; error?: string; label: string }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  )
}

function ControlledNumberField({
  control,
  label,
  name,
  step = "0.1",
  suffix,
}: {
  control: ReturnType<typeof useForm<FoodFormValues>>["control"]
  label: string
  name: keyof FoodFormValues | `portionProfiles.${number}.estimatedGrams`
  step?: string
  suffix: string
}) {
  const { t } = useTranslation()

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field
          error={getFieldErrorMessage(fieldState.error?.message, t, { field: label })}
          label={label}
        >
          <div className="relative">
            <Input
              type="number"
              min={0}
              step={step}
              value={typeof field.value === "string" ? field.value : ""}
              onChange={field.onChange}
              className={cn(NUTRITION_DIALOG_FIELD_CLASS, "pr-12")}
            />
            <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs">
              {suffix}
            </span>
          </div>
        </Field>
      )}
    />
  )
}

function ControlledSelectField({
  control,
  label,
  name,
  options,
}: {
  control: ReturnType<typeof useForm<FoodFormValues>>["control"]
  label: string
  name: "sugarKind" | "proteinSource" | "processingLevel" | "sodiumRiskLevel"
  options: Array<{ label: string; value: string }>
}) {
  return (
    <Field label={label}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            value={field.value || NONE_VALUE}
            onValueChange={(value) => field.onChange(normalizeSelectValue(value))}
          >
            <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_VALUE}>-</SelectItem>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </Field>
  )
}
