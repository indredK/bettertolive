import { Plus, Trash2 } from "lucide-react"
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
import { useSaveNutritionMutation } from "@/features/bettertolive/queries/use-save-nutrition-mutation"
import type {
  DailyMealSlot,
  DailyPlan,
  DailyPlanEntry,
  MealStructure,
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

export type EditingDailyPlan = {
  isNew: boolean
  plan: DailyPlan | null
}

type PlanEntryForm = {
  id: string
  type: DailyPlanEntry["type"]
  recipeId: string
  servings: string
  foodId: string
  amount: string
  unit: string
  title: string
  note: string
}

type PlanSlotForm = {
  id: string
  structure: MealStructure
  status: DailyMealSlot["status"]
  note: string
  entries: PlanEntryForm[]
}

type DailyPlanFormState = {
  date: string
  note: string
  slots: PlanSlotForm[]
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
const DEFAULT_SLOT_ROLES: MealStructure[] = ["早餐", "午餐", "晚餐", "饮品"]
const STATUS_OPTIONS: DailyMealSlot["status"][] = [
  "planned",
  "prepared",
  "eaten",
  "skipped",
  "replaced",
]
const ENTRY_TYPE_OPTIONS: DailyPlanEntry["type"][] = ["recipe", "food", "text"]
const UNIT_OPTIONS = ["g", "ml", "个", "份"]
const NONE_VALUE = "__none__"

function normalizeSelectValue(value: string | null) {
  return value === null || value === NONE_VALUE ? "" : value
}

export function NutritionDailyPlanEditDialog({
  editing,
  nutrition,
  onClose,
}: {
  editing: EditingDailyPlan
  nutrition: NutritionModuleData
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveNutritionMutation = useSaveNutritionMutation()
  const [form, setForm] = useState<DailyPlanFormState>(() => createInitialForm(editing.plan))
  const referencedLogs = editing.plan
    ? nutrition.mealLogs.filter((log) =>
        editing.plan?.slots.some((slot) => slot.id === log.plannedSlotId),
      )
    : []
  const referencedSlotIds = new Set(referencedLogs.map((log) => log.plannedSlotId).filter(Boolean))

  const updateForm = (patch: Partial<DailyPlanFormState>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const updateSlot = (index: number, patch: Partial<PlanSlotForm>) => {
    setForm((current) => ({
      ...current,
      slots: current.slots.map((slot, slotIndex) =>
        slotIndex === index ? { ...slot, ...patch } : slot,
      ),
    }))
  }

  const updateEntry = (slotIndex: number, entryIndex: number, patch: Partial<PlanEntryForm>) => {
    setForm((current) => ({
      ...current,
      slots: current.slots.map((slot, currentSlotIndex) =>
        currentSlotIndex === slotIndex
          ? {
              ...slot,
              entries: slot.entries.map((entry, currentEntryIndex) =>
                currentEntryIndex === entryIndex ? { ...entry, ...patch } : entry,
              ),
            }
          : slot,
      ),
    }))
  }

  const addSlot = () => {
    setForm((current) => ({
      ...current,
      slots: [...current.slots, createEmptySlot(nextMealRole(current.slots))],
    }))
  }

  const removeSlot = (index: number) => {
    if (referencedSlotIds.has(form.slots[index]?.id)) {
      return
    }

    setForm((current) => ({
      ...current,
      slots: current.slots.filter((_, slotIndex) => slotIndex !== index),
    }))
  }

  const addEntry = (slotIndex: number) => {
    setForm((current) => ({
      ...current,
      slots: current.slots.map((slot, currentSlotIndex) =>
        currentSlotIndex === slotIndex
          ? { ...slot, entries: [...slot.entries, createDefaultEntry(nutrition)] }
          : slot,
      ),
    }))
  }

  const removeEntry = (slotIndex: number, entryIndex: number) => {
    setForm((current) => ({
      ...current,
      slots: current.slots.map((slot, currentSlotIndex) =>
        currentSlotIndex === slotIndex
          ? {
              ...slot,
              entries: slot.entries.filter(
                (_, currentEntryIndex) => currentEntryIndex !== entryIndex,
              ),
            }
          : slot,
      ),
    }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!form.date.trim()) {
      toast.error(t("nutrition.dailyPlanEdit.validation.dateRequired", "请填写日期"))
      return
    }

    if (form.slots.length === 0) {
      toast.error(t("nutrition.dailyPlanEdit.validation.slotRequired", "请至少保留一个餐次"))
      return
    }

    const nextSlots: DailyMealSlot[] = []

    for (const slot of form.slots) {
      const entries: DailyPlanEntry[] = []

      for (const entry of slot.entries) {
        const nextEntry = normalizeEntry(entry)

        if (!nextEntry) {
          toast.error(t("nutrition.dailyPlanEdit.validation.entryInvalid", "请补全计划条目"))
          return
        }

        entries.push(nextEntry)
      }

      nextSlots.push({
        id: slot.id,
        structure: slot.structure,
        status: slot.status,
        entries,
        note: slot.note.trim() || undefined,
      })
    }

    const nextPlan: DailyPlan = {
      id: editing.plan?.id ?? createId("daily-plan"),
      date: form.date.trim(),
      slots: nextSlots,
      note: form.note.trim() || undefined,
    }
    const nextPlans = editing.isNew
      ? [...nutrition.dailyPlans, nextPlan]
      : nutrition.dailyPlans.map((plan) => (plan.id === nextPlan.id ? nextPlan : plan))

    try {
      await saveNutritionMutation.mutateAsync({
        ...nutrition,
        dailyPlans: nextPlans,
      })
      toast.success(t("nutrition.dailyPlanEdit.saved", "每日计划已保存"))
      onClose()
    } catch {
      toast.error(t("nutrition.dailyPlanEdit.saveFailed", "每日计划保存失败"))
    }
  }

  const handleDelete = async () => {
    if (!editing.plan || referencedLogs.length > 0) {
      return
    }

    try {
      await saveNutritionMutation.mutateAsync({
        ...nutrition,
        dailyPlans: nutrition.dailyPlans.filter((plan) => plan.id !== editing.plan?.id),
      })
      toast.success(t("nutrition.dailyPlanEdit.deleted", "每日计划已删除"))
      onClose()
    } catch {
      toast.error(t("nutrition.dailyPlanEdit.deleteFailed", "每日计划删除失败"))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent
        className={cn(
          NUTRITION_DIALOG_CONTENT_CLASS,
          "flex max-h-[min(820px,calc(100dvh-2rem))] max-w-6xl flex-col overflow-hidden",
        )}
      >
        <DialogHeader className={NUTRITION_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew
              ? t("nutrition.dailyPlanEdit.createTitle", "新增每日计划")
              : t("nutrition.dailyPlanEdit.editTitle", "编辑每日计划")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "nutrition.dailyPlanEdit.description",
              "每日计划可以引用食谱、食品或临时文本；空餐次允许保留，表示先留白。",
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
            <section className={NUTRITION_DIALOG_SECTION_CLASS}>
              <div className="grid gap-4 md:grid-cols-[180px_minmax(0,1fr)]">
                <Field label={t("nutrition.dailyPlanEdit.date", "日期")}>
                  <Input
                    type="date"
                    value={form.date}
                    onChange={(event) => updateForm({ date: event.target.value })}
                    className={NUTRITION_DIALOG_FIELD_CLASS}
                  />
                </Field>
                <Field label={t("nutrition.dailyPlanEdit.note", "整日备注")}>
                  <Input
                    value={form.note}
                    onChange={(event) => updateForm({ note: event.target.value })}
                    className={NUTRITION_DIALOG_FIELD_CLASS}
                    placeholder={t(
                      "nutrition.dailyPlanEdit.notePlaceholder",
                      "今天的饮食预案或提醒",
                    )}
                  />
                </Field>
              </div>
            </section>

            <section className={NUTRITION_DIALOG_SECTION_CLASS}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">
                    {t("nutrition.dailyPlanEdit.slots", "餐次")}
                  </h3>
                  <p className="text-muted-foreground mt-1 text-xs leading-5">
                    {t(
                      "nutrition.dailyPlanEdit.slotsHint",
                      "每个餐次可以为空，也可以组合多个计划条目。",
                    )}
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addSlot}>
                  <Plus className="size-3.5" />
                  {t("nutrition.dailyPlanEdit.addSlot", "添加餐次")}
                </Button>
              </div>

              <div className="space-y-3">
                {form.slots.map((slot, slotIndex) => (
                  <div
                    key={slot.id}
                    className="border-foreground/10 bg-background/70 rounded-2xl border p-3"
                  >
                    <div className="grid gap-3 lg:grid-cols-[160px_150px_minmax(0,1fr)_auto]">
                      <Field label={t("nutrition.dailyPlanEdit.mealRole", "餐次")}>
                        <Select
                          value={slot.structure}
                          onValueChange={(structure) =>
                            updateSlot(slotIndex, {
                              structure: (normalizeSelectValue(structure) ||
                                slot.structure) as MealStructure,
                            })
                          }
                        >
                          <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {MEAL_ROLE_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {translateNutritionEnum(t, "mealRole", option)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field label={t("nutrition.dailyPlanEdit.status", "状态")}>
                        <Select
                          value={slot.status}
                          onValueChange={(status) =>
                            updateSlot(slotIndex, {
                              status: (normalizeSelectValue(status) ||
                                slot.status) as DailyMealSlot["status"],
                            })
                          }
                        >
                          <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map((option) => (
                              <SelectItem key={option} value={option}>
                                {t(`nutrition.status.${option}`, option)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </Field>

                      <Field label={t("nutrition.dailyPlanEdit.slotNote", "餐次备注")}>
                        <Input
                          value={slot.note}
                          onChange={(event) => updateSlot(slotIndex, { note: event.target.value })}
                          className={NUTRITION_DIALOG_FIELD_CLASS}
                        />
                      </Field>

                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeSlot(slotIndex)}
                          disabled={form.slots.length <= 1 || referencedSlotIds.has(slot.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      {slot.entries.map((entry, entryIndex) => (
                        <PlanEntryRow
                          key={entry.id}
                          entry={entry}
                          nutrition={nutrition}
                          onChange={(patch) => updateEntry(slotIndex, entryIndex, patch)}
                          onRemove={() => removeEntry(slotIndex, entryIndex)}
                        />
                      ))}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addEntry(slotIndex)}
                      className="mt-3"
                    >
                      <Plus className="size-3.5" />
                      {t("nutrition.dailyPlanEdit.addEntry", "添加条目")}
                    </Button>
                  </div>
                ))}
              </div>
            </section>

            {!editing.isNew && referencedLogs.length > 0 ? (
              <div className="border-foreground/15 bg-muted/25 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs leading-5">
                {t(
                  "nutrition.dailyPlanEdit.deleteBlocked",
                  "该计划已有 {{count}} 条进食记录关联，暂不能删除。",
                  { count: referencedLogs.length },
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
                disabled={referencedLogs.length > 0 || saveNutritionMutation.isPending}
                className="mr-auto"
              >
                <Trash2 className="size-4" />
                {t("nutrition.dailyPlanEdit.delete", "删除")}
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onClose}>
              {t("nutrition.common.cancel", "取消")}
            </Button>
            <Button type="submit" disabled={saveNutritionMutation.isPending}>
              {saveNutritionMutation.isPending
                ? t("nutrition.common.saving", "保存中")
                : t("nutrition.common.save", "保存")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function PlanEntryRow({
  entry,
  nutrition,
  onChange,
  onRemove,
}: {
  entry: PlanEntryForm
  nutrition: NutritionModuleData
  onChange: (patch: Partial<PlanEntryForm>) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="border-foreground/10 bg-muted/20 grid gap-3 rounded-xl border p-3 lg:grid-cols-[130px_minmax(0,1fr)_auto]">
      <Field label={t("nutrition.dailyPlanEdit.entryType", "类型")}>
        <Select
          value={entry.type}
          onValueChange={(type) =>
            onChange(
              createDefaultEntryPatch(
                (normalizeSelectValue(type) || entry.type) as DailyPlanEntry["type"],
                nutrition,
              ),
            )
          }
        >
          <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ENTRY_TYPE_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {t(`nutrition.dailyPlanEdit.entryTypes.${option}`, option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {entry.type === "recipe" ? (
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
          <Field label={t("nutrition.dailyPlanEdit.recipe", "食谱")}>
            <Select
              value={entry.recipeId || NONE_VALUE}
              onValueChange={(recipeId) => onChange({ recipeId: normalizeSelectValue(recipeId) })}
            >
              <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>
                  {t("nutrition.dailyPlanEdit.selectRecipe", "选择食谱")}
                </SelectItem>
                {entry.recipeId &&
                !nutrition.recipes.some((recipe) => recipe.id === entry.recipeId) ? (
                  <SelectItem value={entry.recipeId}>
                    {t("nutrition.dailyPlanEdit.missingRecipe", "已关联的食谱不存在")}
                  </SelectItem>
                ) : null}
                {nutrition.recipes.map((recipe) => (
                  <SelectItem key={recipe.id} value={recipe.id}>
                    {recipe.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <NumberField
            label={t("nutrition.dailyPlanEdit.servings", "份数")}
            value={entry.servings}
            onChange={(servings) => onChange({ servings })}
          />
        </div>
      ) : null}

      {entry.type === "food" ? (
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_100px]">
          <Field label={t("nutrition.dailyPlanEdit.food", "食品")}>
            <Select
              value={entry.foodId || NONE_VALUE}
              onValueChange={(foodId) => onChange({ foodId: normalizeSelectValue(foodId) })}
            >
              <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>
                  {t("nutrition.dailyPlanEdit.selectFood", "选择食品")}
                </SelectItem>
                {entry.foodId && !nutrition.foods.some((food) => food.id === entry.foodId) ? (
                  <SelectItem value={entry.foodId}>
                    {t("nutrition.dailyPlanEdit.missingFood", "已关联的食品不存在")}
                  </SelectItem>
                ) : null}
                {nutrition.foods.map((food) => (
                  <SelectItem key={food.id} value={food.id}>
                    {food.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <NumberField
            label={t("nutrition.dailyPlanEdit.amount", "用量")}
            value={entry.amount}
            onChange={(amount) => onChange({ amount })}
          />
          <Field label={t("nutrition.dailyPlanEdit.unit", "单位")}>
            <Select
              value={entry.unit}
              onValueChange={(unit) => onChange({ unit: normalizeSelectValue(unit) })}
            >
              <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {translateNutritionEnum(t, "unit", option)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      ) : null}

      {entry.type === "text" ? (
        <div className="grid gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <Field label={t("nutrition.dailyPlanEdit.textTitle", "文本条目")}>
            <Input
              value={entry.title}
              onChange={(event) => onChange({ title: event.target.value })}
              className={NUTRITION_DIALOG_FIELD_CLASS}
              placeholder={t("nutrition.dailyPlanEdit.textTitlePlaceholder", "例如：临时外食")}
            />
          </Field>
          <Field label={t("nutrition.dailyPlanEdit.entryNote", "备注")}>
            <Input
              value={entry.note}
              onChange={(event) => onChange({ note: event.target.value })}
              className={NUTRITION_DIALOG_FIELD_CLASS}
            />
          </Field>
        </div>
      ) : null}

      <div className="flex items-end">
        <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove}>
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function createInitialForm(plan: DailyPlan | null): DailyPlanFormState {
  return {
    date: plan?.date ?? todayString(),
    note: plan?.note ?? "",
    slots: plan?.slots.map(createSlotForm) ?? DEFAULT_SLOT_ROLES.map(createEmptySlot),
  }
}

function createSlotForm(slot: DailyMealSlot): PlanSlotForm {
  return {
    id: slot.id,
    structure: slot.structure,
    status: slot.status,
    note: slot.note ?? "",
    entries: slot.entries.map(createEntryForm),
  }
}

function createEmptySlot(structure: MealStructure): PlanSlotForm {
  return {
    id: createId("daily-slot"),
    structure,
    status: "planned",
    note: "",
    entries: [],
  }
}

function createEntryForm(entry: DailyPlanEntry): PlanEntryForm {
  if (entry.type === "recipe") {
    return {
      ...createEmptyEntry("recipe"),
      recipeId: entry.recipeId,
      servings: String(entry.servings),
    }
  }

  if (entry.type === "food") {
    return {
      ...createEmptyEntry("food"),
      foodId: entry.foodId,
      amount: String(entry.amount),
      unit: entry.unit,
    }
  }

  return {
    ...createEmptyEntry("text"),
    title: entry.title,
    note: entry.note ?? "",
  }
}

function createDefaultEntry(nutrition: NutritionModuleData): PlanEntryForm {
  if (nutrition.recipes[0]) {
    return {
      ...createEmptyEntry("recipe"),
      recipeId: nutrition.recipes[0].id,
      servings: "1",
    }
  }

  if (nutrition.foods[0]) {
    return {
      ...createEmptyEntry("food"),
      foodId: nutrition.foods[0].id,
      unit: nutrition.foods[0].defaultUnit,
    }
  }

  return createEmptyEntry("text")
}

function createDefaultEntryPatch(
  type: DailyPlanEntry["type"],
  nutrition: NutritionModuleData,
): Partial<PlanEntryForm> {
  const nextEntry =
    type === "recipe" && nutrition.recipes[0]
      ? { ...createEmptyEntry(type), recipeId: nutrition.recipes[0].id, servings: "1" }
      : type === "food" && nutrition.foods[0]
        ? {
            ...createEmptyEntry(type),
            foodId: nutrition.foods[0].id,
            unit: nutrition.foods[0].defaultUnit,
          }
        : createEmptyEntry(type)

  return {
    type,
    recipeId: nextEntry.recipeId,
    servings: nextEntry.servings,
    foodId: nextEntry.foodId,
    amount: nextEntry.amount,
    unit: nextEntry.unit,
    title: nextEntry.title,
    note: nextEntry.note,
  }
}

function createEmptyEntry(type: DailyPlanEntry["type"]): PlanEntryForm {
  return {
    id: createId("plan-entry"),
    type,
    recipeId: "",
    servings: "",
    foodId: "",
    amount: "",
    unit: "g",
    title: "",
    note: "",
  }
}

function normalizeEntry(entry: PlanEntryForm): DailyPlanEntry | null {
  if (entry.type === "recipe") {
    const servings = Number(entry.servings)

    if (!entry.recipeId || !Number.isFinite(servings) || servings <= 0) {
      return null
    }

    return { type: "recipe", recipeId: entry.recipeId, servings }
  }

  if (entry.type === "food") {
    const amount = Number(entry.amount)

    if (!entry.foodId || !Number.isFinite(amount) || amount <= 0) {
      return null
    }

    return { type: "food", foodId: entry.foodId, amount, unit: entry.unit }
  }

  if (!entry.title.trim()) {
    return null
  }

  return {
    type: "text",
    title: entry.title.trim(),
    note: entry.note.trim() || undefined,
  }
}

function nextMealRole(slots: PlanSlotForm[]) {
  return MEAL_ROLE_OPTIONS.find((role) => !slots.some((slot) => slot.structure === role)) ?? "加餐"
}

function todayString() {
  const now = new Date()
  const localNow = new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
  return localNow.toISOString().slice(0, 10)
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
