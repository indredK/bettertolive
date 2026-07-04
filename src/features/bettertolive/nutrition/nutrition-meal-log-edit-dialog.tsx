import { generateId } from "@/lib/id-utils"
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
import { Textarea } from "@/components/ui/textarea"
import { useSaveNutritionMutation } from "@/features/bettertolive/nutrition/queries"
import type {
  BodyFeedback,
  DailyPlanEntry,
  MealLog,
  MealScene,
  MealTrigger,
  NutritionModuleData,
  ValueDensity,
} from "@/features/bettertolive/types"
import {
  NUTRITION_DIALOG_CONTENT_CLASS,
  NUTRITION_DIALOG_FIELD_CLASS,
  NUTRITION_DIALOG_FOOTER_CLASS,
  NUTRITION_DIALOG_HEADER_CLASS,
  NUTRITION_DIALOG_SECTION_CLASS,
} from "@/features/bettertolive/nutrition/nutrition-page-shared"
import {
  NUTRITION_BODY_FEEDBACK_OPTIONS,
  NUTRITION_VALUE_DENSITY_OPTIONS,
} from "@/features/bettertolive/nutrition/nutrition-page-data"
import { translateNutritionEnum } from "@/features/bettertolive/nutrition/nutrition-i18n"
import { cn } from "@/lib/utils"

export type EditingMealLog = {
  isNew: boolean
  log: MealLog | null
}

type LogEntryForm = {
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

type MealLogFormState = {
  dateTime: string
  plannedSlotId: string
  relatedFoodMemoryId: string
  entries: LogEntryForm[]
  scene: MealScene | ""
  trigger: MealTrigger | ""
  valueDensity: ValueDensity | ""
  bodyFeedback: BodyFeedback | ""
  changeReason: string
  note: string
}

const ENTRY_TYPE_OPTIONS: DailyPlanEntry["type"][] = ["recipe", "food", "text"]
const UNIT_OPTIONS = ["g", "ml", "个", "份"]
const SCENE_OPTIONS: MealScene[] = [
  "在家做",
  "外卖",
  "堂食",
  "路边/便利店",
  "应酬/聚餐",
  "旅行",
  "加餐零食",
]
const TRIGGER_OPTIONS: MealTrigger[] = [
  "准时按点",
  "真饿了",
  "社交场合",
  "情绪驱动",
  "习惯反射",
  "不想浪费",
  "看到就想吃",
]
const VALUE_DENSITY_OPTIONS = NUTRITION_VALUE_DENSITY_OPTIONS
const BODY_FEEDBACK_OPTIONS = NUTRITION_BODY_FEEDBACK_OPTIONS
const NONE_VALUE = "__none__"

function normalizeSelectValue(value: string | null) {
  return value === null || value === NONE_VALUE ? "" : value
}

export function NutritionMealLogEditDialog({
  editing,
  nutrition,
  onClose,
}: {
  editing: EditingMealLog
  nutrition: NutritionModuleData
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveNutritionMutation = useSaveNutritionMutation()
  const [form, setForm] = useState<MealLogFormState>(() =>
    createInitialForm(editing.log, nutrition),
  )
  const plannedSlotOptions = [
    ...nutrition.dailyPlans.flatMap((plan) =>
      plan.slots.map((slot) => ({
        id: slot.id,
        label: `${plan.date} · ${translateNutritionEnum(t, "mealRole", slot.structure)}`,
      })),
    ),
  ]

  if (
    form.plannedSlotId &&
    !plannedSlotOptions.some((option) => option.id === form.plannedSlotId)
  ) {
    plannedSlotOptions.push({
      id: form.plannedSlotId,
      label: t("nutrition.logEdit.missingPlannedSlot"),
    })
  }
  const foodMemoryOptions = (nutrition.foodMemories ?? []).map((memory) => ({
    id: memory.id,
    label: `${memory.name} · ${translateNutritionEnum(t, "foodMemoryType", memory.type)}`,
  }))

  if (
    form.relatedFoodMemoryId &&
    !foodMemoryOptions.some((option) => option.id === form.relatedFoodMemoryId)
  ) {
    foodMemoryOptions.push({
      id: form.relatedFoodMemoryId,
      label: t("nutrition.logEdit.missingFoodMemory"),
    })
  }

  const updateForm = (patch: Partial<MealLogFormState>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const updateEntry = (index: number, patch: Partial<LogEntryForm>) => {
    setForm((current) => ({
      ...current,
      entries: current.entries.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry,
      ),
    }))
  }

  const addEntry = () => {
    setForm((current) => ({
      ...current,
      entries: [...current.entries, createDefaultEntry(nutrition)],
    }))
  }

  const removeEntry = (index: number) => {
    setForm((current) => ({
      ...current,
      entries: current.entries.filter((_, entryIndex) => entryIndex !== index),
    }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!form.dateTime.trim()) {
      toast.error(t("nutrition.logEdit.validation.dateTimeRequired"))
      return
    }

    const entries: DailyPlanEntry[] = []

    for (const entry of form.entries) {
      const nextEntry = normalizeEntry(entry)

      if (!nextEntry) {
        toast.error(t("nutrition.logEdit.validation.entryInvalid"))
        return
      }

      entries.push(nextEntry)
    }

    if (entries.length === 0) {
      toast.error(t("nutrition.logEdit.validation.entryRequired"))
      return
    }

    const nextLog: MealLog = {
      id: editing.log?.id ?? generateId("meal-log"),
      dateTime: toOffsetDateTime(form.dateTime),
      plannedSlotId: form.plannedSlotId || undefined,
      entries,
      scene: form.scene || undefined,
      trigger: form.trigger || undefined,
      valueDensity: form.valueDensity || undefined,
      bodyFeedback: form.bodyFeedback || undefined,
      relatedFoodMemoryId: form.relatedFoodMemoryId || undefined,
      changeReason: form.changeReason.trim() || undefined,
      note: form.note.trim() || undefined,
    }
    const nextLogs = editing.isNew
      ? [nextLog, ...nutrition.mealLogs]
      : nutrition.mealLogs.map((log) => (log.id === nextLog.id ? nextLog : log))

    try {
      await saveNutritionMutation.mutateAsync({
        ...nutrition,
        mealLogs: nextLogs,
      })
      toast.success(t("common.toast.saved"))
      onClose()
    } catch {
      toast.error(t("common.toast.saveFailed"))
    }
  }

  const handleDelete = async () => {
    if (!editing.log) {
      return
    }

    try {
      await saveNutritionMutation.mutateAsync({
        ...nutrition,
        mealLogs: nutrition.mealLogs.filter((log) => log.id !== editing.log?.id),
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
          "flex max-h-[min(820px,calc(100dvh-2rem))] max-w-6xl flex-col overflow-hidden",
        )}
      >
        <DialogHeader className={NUTRITION_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew ? t("nutrition.logEdit.createTitle") : t("nutrition.logEdit.editTitle")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "nutrition.logEdit.description",
              "进食记录用于回看真实发生了什么，也可以关联某个计划餐次。",
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
            <section className={NUTRITION_DIALOG_SECTION_CLASS}>
              <div className="grid gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
                <Field label={t("nutrition.logEdit.dateTime")}>
                  <Input
                    type="datetime-local"
                    value={form.dateTime}
                    onChange={(event) => updateForm({ dateTime: event.target.value })}
                    className={NUTRITION_DIALOG_FIELD_CLASS}
                  />
                </Field>
                <Field label={t("nutrition.logEdit.plannedSlot")}>
                  <Select
                    value={form.plannedSlotId || NONE_VALUE}
                    onValueChange={(plannedSlotId) =>
                      updateForm({
                        plannedSlotId: normalizeSelectValue(plannedSlotId),
                      })
                    }
                  >
                    <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>
                        {t("nutrition.logEdit.noPlannedSlot")}
                      </SelectItem>
                      {plannedSlotOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              {foodMemoryOptions.length > 0 ? (
                <Field label={t("nutrition.logEdit.relatedFoodMemory")}>
                  <Select
                    value={form.relatedFoodMemoryId || NONE_VALUE}
                    onValueChange={(relatedFoodMemoryId) =>
                      updateForm({
                        relatedFoodMemoryId: normalizeSelectValue(relatedFoodMemoryId),
                      })
                    }
                  >
                    <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE_VALUE}>
                        {t("nutrition.logEdit.noFoodMemory")}
                      </SelectItem>
                      {foodMemoryOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              ) : null}

              <div className="grid gap-4 md:grid-cols-4">
                <OptionalEnumField
                  group="scene"
                  label={t("nutrition.logEdit.scene")}
                  onChange={(scene) => updateForm({ scene: scene as MealScene | "" })}
                  options={SCENE_OPTIONS}
                  value={form.scene}
                />
                <OptionalEnumField
                  group="trigger"
                  label={t("nutrition.logEdit.trigger")}
                  onChange={(trigger) => updateForm({ trigger: trigger as MealTrigger | "" })}
                  options={TRIGGER_OPTIONS}
                  value={form.trigger}
                />
                <OptionalEnumField
                  group="valueDensity"
                  label={t("nutrition.logEdit.valueDensity")}
                  onChange={(valueDensity) =>
                    updateForm({ valueDensity: valueDensity as ValueDensity | "" })
                  }
                  options={VALUE_DENSITY_OPTIONS}
                  value={form.valueDensity}
                />
                <OptionalEnumField
                  group="bodyFeedback"
                  label={t("nutrition.logEdit.bodyFeedback")}
                  onChange={(bodyFeedback) =>
                    updateForm({ bodyFeedback: bodyFeedback as BodyFeedback | "" })
                  }
                  options={BODY_FEEDBACK_OPTIONS}
                  value={form.bodyFeedback}
                />
              </div>
            </section>

            <section className={NUTRITION_DIALOG_SECTION_CLASS}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold">{t("nutrition.logEdit.entries")}</h3>
                  <p className="text-muted-foreground mt-1 text-xs leading-5">
                    {t(
                      "nutrition.logEdit.entriesHint",
                      "可以记录食谱、单个食品，或无法结构化的临时文本。",
                    )}
                  </p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addEntry}>
                  <Plus className="size-3.5" />
                  {t("nutrition.logEdit.addEntry")}
                </Button>
              </div>

              <div className="space-y-2">
                {form.entries.map((entry, index) => (
                  <LogEntryRow
                    key={entry.id}
                    entry={entry}
                    nutrition={nutrition}
                    onChange={(patch) => updateEntry(index, patch)}
                    onRemove={() => removeEntry(index)}
                    removeDisabled={form.entries.length <= 1}
                  />
                ))}
              </div>
            </section>

            <section className={NUTRITION_DIALOG_SECTION_CLASS}>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t("nutrition.logEdit.changeReason")}>
                  <Textarea
                    value={form.changeReason}
                    onChange={(event) => updateForm({ changeReason: event.target.value })}
                    className={cn(NUTRITION_DIALOG_FIELD_CLASS, "min-h-24")}
                    placeholder={t(
                      "nutrition.logEdit.changeReasonPlaceholder",
                      "如果和计划不同，发生了什么？",
                    )}
                  />
                </Field>
                <Field label={t("nutrition.logEdit.note")}>
                  <Textarea
                    value={form.note}
                    onChange={(event) => updateForm({ note: event.target.value })}
                    className={cn(NUTRITION_DIALOG_FIELD_CLASS, "min-h-24")}
                    placeholder={t(
                      "nutrition.logEdit.notePlaceholder",
                      "身体感受、情绪、环境或后续调整",
                    )}
                  />
                </Field>
              </div>
            </section>
          </div>

          <DialogFooter className={NUTRITION_DIALOG_FOOTER_CLASS}>
            {!editing.isNew ? (
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={saveNutritionMutation.isPending}
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

function LogEntryRow({
  entry,
  nutrition,
  onChange,
  onRemove,
  removeDisabled,
}: {
  entry: LogEntryForm
  nutrition: NutritionModuleData
  onChange: (patch: Partial<LogEntryForm>) => void
  onRemove: () => void
  removeDisabled: boolean
}) {
  const { t } = useTranslation()

  return (
    <div className="border-foreground/10 bg-background/70 grid gap-3 rounded-xl border p-3 lg:grid-cols-[130px_minmax(0,1fr)_auto]">
      <Field label={t("nutrition.logEdit.entryType")}>
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
                {t(`nutrition.logEdit.entryTypes.${option}`, option)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {entry.type === "recipe" ? (
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px]">
          <Field label={t("nutrition.logEdit.recipe")}>
            <Select
              value={entry.recipeId || NONE_VALUE}
              onValueChange={(recipeId) => onChange({ recipeId: normalizeSelectValue(recipeId) })}
            >
              <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>{t("nutrition.logEdit.selectRecipe")}</SelectItem>
                {entry.recipeId &&
                !nutrition.recipes.some((recipe) => recipe.id === entry.recipeId) ? (
                  <SelectItem value={entry.recipeId}>
                    {t("nutrition.logEdit.missingRecipe")}
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
            label={t("nutrition.logEdit.servings")}
            value={entry.servings}
            onChange={(servings) => onChange({ servings })}
          />
        </div>
      ) : null}

      {entry.type === "food" ? (
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_100px]">
          <Field label={t("nutrition.logEdit.food")}>
            <Select
              value={entry.foodId || NONE_VALUE}
              onValueChange={(foodId) => onChange({ foodId: normalizeSelectValue(foodId) })}
            >
              <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>{t("nutrition.logEdit.selectFood")}</SelectItem>
                {entry.foodId && !nutrition.foods.some((food) => food.id === entry.foodId) ? (
                  <SelectItem value={entry.foodId}>{t("nutrition.logEdit.missingFood")}</SelectItem>
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
            label={t("nutrition.logEdit.amount")}
            value={entry.amount}
            onChange={(amount) => onChange({ amount })}
          />
          <Field label={t("nutrition.logEdit.unit")}>
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
          <Field label={t("nutrition.logEdit.textTitle")}>
            <Input
              value={entry.title}
              onChange={(event) => onChange({ title: event.target.value })}
              className={NUTRITION_DIALOG_FIELD_CLASS}
              placeholder={t("nutrition.logEdit.textTitlePlaceholder")}
            />
          </Field>
          <Field label={t("nutrition.logEdit.entryNote")}>
            <Input
              value={entry.note}
              onChange={(event) => onChange({ note: event.target.value })}
              className={NUTRITION_DIALOG_FIELD_CLASS}
            />
          </Field>
        </div>
      ) : null}

      <div className="flex items-end">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          disabled={removeDisabled}
          tooltip={t("common.actions.delete")}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </div>
  )
}

function OptionalEnumField({
  group,
  label,
  onChange,
  options,
  value,
}: {
  group: string
  label: string
  onChange: (value: string) => void
  options: string[]
  value: string
}) {
  const { t } = useTranslation()

  return (
    <Field label={label}>
      <Select
        value={value || NONE_VALUE}
        onValueChange={(nextValue) => onChange(normalizeSelectValue(nextValue))}
      >
        <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_VALUE}>{t("nutrition.common.optional")}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {translateNutritionEnum(t, group, option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function createInitialForm(log: MealLog | null, nutrition: NutritionModuleData): MealLogFormState {
  const entries = log?.entries.map(createEntryForm) ?? []

  return {
    dateTime: log ? toDateTimeInputValue(log.dateTime) : currentDateTimeInputValue(),
    plannedSlotId: log?.plannedSlotId ?? "",
    relatedFoodMemoryId: log?.relatedFoodMemoryId ?? "",
    entries: entries.length > 0 ? entries : [createDefaultEntry(nutrition)],
    scene: log?.scene ?? "",
    trigger: log?.trigger ?? "",
    valueDensity: log?.valueDensity ?? "",
    bodyFeedback: log?.bodyFeedback ?? "",
    changeReason: log?.changeReason ?? "",
    note: log?.note ?? "",
  }
}

function createEntryForm(entry: DailyPlanEntry): LogEntryForm {
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

function createDefaultEntry(nutrition: NutritionModuleData): LogEntryForm {
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
      amount: "100",
      unit: nutrition.foods[0].defaultUnit,
    }
  }

  return createEmptyEntry("text")
}

function createDefaultEntryPatch(
  type: DailyPlanEntry["type"],
  nutrition: NutritionModuleData,
): Partial<LogEntryForm> {
  const nextEntry =
    type === "recipe" && nutrition.recipes[0]
      ? { ...createEmptyEntry(type), recipeId: nutrition.recipes[0].id, servings: "1" }
      : type === "food" && nutrition.foods[0]
        ? {
            ...createEmptyEntry(type),
            foodId: nutrition.foods[0].id,
            amount: "100",
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

function createEmptyEntry(type: DailyPlanEntry["type"]): LogEntryForm {
  return {
    id: generateId("log-entry"),
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

function normalizeEntry(entry: LogEntryForm): DailyPlanEntry | null {
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

function currentDateTimeInputValue() {
  return toDateTimeInputValue(new Date().toISOString())
}

function toDateTimeInputValue(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 16)
  }

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 16)
}

function toOffsetDateTime(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  const offsetMinutes = -date.getTimezoneOffset()
  const sign = offsetMinutes >= 0 ? "+" : "-"
  const absoluteOffset = Math.abs(offsetMinutes)
  const hours = String(Math.floor(absoluteOffset / 60)).padStart(2, "0")
  const minutes = String(absoluteOffset % 60).padStart(2, "0")

  return `${value.length === 16 ? `${value}:00` : value}${sign}${hours}:${minutes}`
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
