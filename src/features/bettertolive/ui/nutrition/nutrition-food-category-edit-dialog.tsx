import { Trash2 } from "lucide-react"
import type { FormEvent, ReactNode } from "react"
import { useState } from "react"
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
  FoodCategoryDefinition,
  FoodCategoryDimension,
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

export type EditingFoodCategory = {
  isNew: boolean
  category: FoodCategoryDefinition | null
}

type FoodCategoryFormState = {
  name: string
  dimension: FoodCategoryDimension
  description: string
  sortOrder: string
}

const DIMENSION_OPTIONS: FoodCategoryDimension[] = [
  "食物大类",
  "食材形态",
  "储存方式",
  "使用频率",
  "饮食立场",
]

function normalizeSelectValue(value: string | null) {
  return value ?? ""
}

export function NutritionFoodCategoryEditDialog({
  editing,
  nutrition,
  onClose,
}: {
  editing: EditingFoodCategory
  nutrition: NutritionModuleData
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveNutritionMutation = useSaveNutritionMutation()
  const [form, setForm] = useState<FoodCategoryFormState>(() =>
    createInitialForm(editing.category, nutrition),
  )
  const referencedFoods = editing.category
    ? nutrition.foods.filter((food) => food.categoryIds.includes(editing.category?.id ?? ""))
    : []

  const updateForm = (patch: Partial<FoodCategoryFormState>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!form.name.trim()) {
      toast.error(t("nutrition.categoryEdit.validation.nameRequired"))
      return
    }

    const nextCategoryId = editing.category?.id ?? createId("food-category")
    const nextCategory: FoodCategoryDefinition = {
      id: nextCategoryId,
      name: form.name.trim(),
      dimension: form.dimension,
      description: form.description.trim() || undefined,
      sortOrder: parsePositiveNumber(form.sortOrder, nextSortOrder(nutrition.foodCategories)),
    }
    const nextCategories = editing.isNew
      ? [...nutrition.foodCategories, nextCategory]
      : nutrition.foodCategories.map((category) =>
          category.id === nextCategory.id ? nextCategory : category,
        )

    try {
      await saveNutritionMutation.mutateAsync({
        ...nutrition,
        foodCategories: nextCategories,
      })
      toast.success(t("common.toast.saved"))
      onClose()
    } catch {
      toast.error(t("common.toast.saveFailed"))
    }
  }

  const handleDelete = async () => {
    if (!editing.category || referencedFoods.length > 0) {
      return
    }

    try {
      await saveNutritionMutation.mutateAsync({
        ...nutrition,
        foodCategories: nutrition.foodCategories.filter(
          (category) => category.id !== editing.category?.id,
        ),
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
          "flex max-h-[min(620px,calc(100dvh-2rem))] max-w-2xl flex-col overflow-hidden",
        )}
      >
        <DialogHeader className={NUTRITION_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew
              ? t("nutrition.categoryEdit.createTitle")
              : t("nutrition.categoryEdit.editTitle")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "nutrition.categoryEdit.description",
              "食品分类用于组织食品库视角，会影响食品列表、筛选和营养表阅读路径。",
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
            <section className={NUTRITION_DIALOG_SECTION_CLASS}>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                <Field label={t("nutrition.categoryEdit.name")}>
                  <Input
                    value={form.name}
                    onChange={(event) => updateForm({ name: event.target.value })}
                    className={NUTRITION_DIALOG_FIELD_CLASS}
                    placeholder={t("nutrition.categoryEdit.namePlaceholder")}
                  />
                </Field>

                <Field label={t("common.sortable.sortOrder")}>
                  <Input
                    type="number"
                    min={0}
                    step={1}
                    value={form.sortOrder}
                    onChange={(event) => updateForm({ sortOrder: event.target.value })}
                    className={NUTRITION_DIALOG_FIELD_CLASS}
                  />
                </Field>
              </div>

              <Field label={t("nutrition.categoryEdit.dimension")}>
                <Select
                  value={form.dimension}
                  onValueChange={(dimension) =>
                    updateForm({
                      dimension: (normalizeSelectValue(dimension) ||
                        form.dimension) as FoodCategoryDimension,
                    })
                  }
                >
                  <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DIMENSION_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {translateNutritionEnum(t, "foodCategoryDimension", option)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label={t("nutrition.categoryEdit.descriptionLabel")}>
                <Textarea
                  value={form.description}
                  onChange={(event) => updateForm({ description: event.target.value })}
                  className={cn(NUTRITION_DIALOG_FIELD_CLASS, "min-h-28")}
                  placeholder={t(
                    "nutrition.categoryEdit.descriptionPlaceholder",
                    "这个分类帮助你怎样选择食品？",
                  )}
                />
              </Field>
            </section>

            {!editing.isNew && referencedFoods.length > 0 ? (
              <div className="border-foreground/15 bg-muted/25 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs leading-5">
                {t(
                  "nutrition.categoryEdit.deleteBlocked",
                  "该分类已被 {{count}} 个食品引用，暂不能删除。",
                  { count: referencedFoods.length },
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
                disabled={referencedFoods.length > 0 || saveNutritionMutation.isPending}
                className="mr-auto"
              >
                <Trash2 className="size-4" />
                {t("nutrition.categoryEdit.delete")}
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

function createInitialForm(
  category: FoodCategoryDefinition | null,
  nutrition: NutritionModuleData,
): FoodCategoryFormState {
  return {
    name: category?.name ?? "",
    dimension: category?.dimension ?? "食物大类",
    description: category?.description ?? "",
    sortOrder: String(category?.sortOrder ?? nextSortOrder(nutrition.foodCategories)),
  }
}

function nextSortOrder(categories: FoodCategoryDefinition[]) {
  return Math.max(0, ...categories.map((category) => category.sortOrder)) + 1
}

function parsePositiveNumber(value: string, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback
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
