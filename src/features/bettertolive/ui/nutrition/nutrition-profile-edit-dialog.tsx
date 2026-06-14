import { generateId } from "@/lib/id-utils"
import { Plus, Trash2 } from "lucide-react"
import type { FormEvent, ReactNode } from "react"
import { Children, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { AnimatedIconButton, Button } from "@/components/ui/button"
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
  DietaryHardConstraint,
  DietaryIntentMode,
  DietarySoftStance,
  HardConstraintType,
  NutritionModuleData,
  SoftStanceType,
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

type ConstraintForm = {
  id: string
  type: HardConstraintType
  label: string
  note: string
}

type StanceForm = {
  id: string
  type: SoftStanceType
  label: string
  note: string
}

type ProfileFormState = {
  mode: DietaryIntentMode
  note: string
  windowStart: string
  windowEnd: string
  hardConstraints: ConstraintForm[]
  softStances: StanceForm[]
}

const INTENT_MODE_OPTIONS: DietaryIntentMode[] = [
  "维持",
  "稍微注意",
  "在调整具体问题",
  "阶段性需求",
]
const HARD_CONSTRAINT_OPTIONS: HardConstraintType[] = ["过敏", "宗教/文化", "医学限制"]
const SOFT_STANCE_OPTIONS: SoftStanceType[] = ["饮食方式", "进食节律", "临时关注"]

function normalizeSelectValue(value: string | null) {
  return value ?? ""
}

export function NutritionProfileEditDialog({
  nutrition,
  onClose,
}: {
  nutrition: NutritionModuleData
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveNutritionMutation = useSaveNutritionMutation()
  const [form, setForm] = useState<ProfileFormState>(() => createInitialForm(nutrition))

  const updateForm = (patch: Partial<ProfileFormState>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const updateConstraint = (id: string, patch: Partial<ConstraintForm>) => {
    setForm((current) => ({
      ...current,
      hardConstraints: current.hardConstraints.map((constraint) =>
        constraint.id === id ? { ...constraint, ...patch } : constraint,
      ),
    }))
  }

  const updateStance = (id: string, patch: Partial<StanceForm>) => {
    setForm((current) => ({
      ...current,
      softStances: current.softStances.map((stance) =>
        stance.id === id ? { ...stance, ...patch } : stance,
      ),
    }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (
      form.hardConstraints.some((constraint) => !constraint.label.trim()) ||
      form.softStances.some((stance) => !stance.label.trim())
    ) {
      toast.error(t("nutrition.profileEdit.validation.labelRequired"))
      return
    }

    try {
      await saveNutritionMutation.mutateAsync({
        ...nutrition,
        profile: {
          currentIntent: {
            mode: form.mode,
            note: form.note.trim() || undefined,
            window: form.windowStart.trim()
              ? {
                  start: form.windowStart.trim(),
                  end: form.windowEnd.trim() || undefined,
                }
              : undefined,
          },
          hardConstraints: form.hardConstraints.map((constraint) => ({
            id: constraint.id,
            type: constraint.type,
            label: constraint.label.trim(),
            note: constraint.note.trim(),
          })),
          softStances: form.softStances.map((stance) => ({
            id: stance.id,
            type: stance.type,
            label: stance.label.trim(),
            note: stance.note.trim(),
          })),
        },
      })
      toast.success(t("common.toast.saved"))
      onClose()
    } catch {
      toast.error(t("common.toast.saveFailed"))
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
          <DialogTitle>{t("nutrition.profileEdit.title")}</DialogTitle>
          <DialogDescription>
            {t(
              "nutrition.profileEdit.description",
              "饮食档案记录当前阶段目标、不能碰的边界，以及会影响每日计划的温和立场。",
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
            <section className={NUTRITION_DIALOG_SECTION_CLASS}>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px_160px]">
                <Field label={t("nutrition.profileEdit.intentMode")}>
                  <Select
                    value={form.mode}
                    onValueChange={(mode) =>
                      updateForm({
                        mode: (normalizeSelectValue(mode) || form.mode) as DietaryIntentMode,
                      })
                    }
                  >
                    <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {INTENT_MODE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={option}>
                          {translateNutritionEnum(t, "dietaryIntentMode", option)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label={t("nutrition.profileEdit.windowStart")}>
                  <Input
                    type="date"
                    value={form.windowStart}
                    onChange={(event) => updateForm({ windowStart: event.target.value })}
                    className={NUTRITION_DIALOG_FIELD_CLASS}
                  />
                </Field>

                <Field label={t("nutrition.profileEdit.windowEnd")}>
                  <Input
                    type="date"
                    value={form.windowEnd}
                    onChange={(event) => updateForm({ windowEnd: event.target.value })}
                    className={NUTRITION_DIALOG_FIELD_CLASS}
                  />
                </Field>
              </div>

              <Field label={t("nutrition.profileEdit.intentNote")}>
                <Textarea
                  value={form.note}
                  onChange={(event) => updateForm({ note: event.target.value })}
                  className={cn(NUTRITION_DIALOG_FIELD_CLASS, "min-h-24")}
                  placeholder={t(
                    "nutrition.profileEdit.intentNotePlaceholder",
                    "例如：先观察外卖、咖啡因和睡眠之间的关系。",
                  )}
                />
              </Field>
            </section>

            <ProfileListSection
              addLabel={t("nutrition.profileEdit.addConstraint")}
              description={t(
                "nutrition.profileEdit.constraintsDescription",
                "硬约束用于记录过敏、医学限制或宗教文化边界，后续计划与建议应优先避开。",
              )}
              emptyLabel={t("nutrition.profileEdit.emptyConstraints")}
              title={t("nutrition.profileEdit.hardConstraints")}
              onAdd={() =>
                updateForm({
                  hardConstraints: [
                    ...form.hardConstraints,
                    {
                      id: generateId("constraint"),
                      type: "医学限制",
                      label: "",
                      note: "",
                    },
                  ],
                })
              }
            >
              {form.hardConstraints.map((constraint) => (
                <ProfileRow
                  key={constraint.id}
                  label={constraint.label}
                  labelPlaceholder={t(
                    "nutrition.profileEdit.constraintLabelPlaceholder",
                    "例如：晚间减少咖啡因",
                  )}
                  note={constraint.note}
                  notePlaceholder={t(
                    "nutrition.profileEdit.constraintNotePlaceholder",
                    "这个边界为什么重要？",
                  )}
                  onLabelChange={(label) => updateConstraint(constraint.id, { label })}
                  onNoteChange={(note) => updateConstraint(constraint.id, { note })}
                  onRemove={() =>
                    updateForm({
                      hardConstraints: form.hardConstraints.filter(
                        (entry) => entry.id !== constraint.id,
                      ),
                    })
                  }
                  select={
                    <Select
                      value={constraint.type}
                      onValueChange={(type) =>
                        updateConstraint(constraint.id, {
                          type: (normalizeSelectValue(type) ||
                            constraint.type) as HardConstraintType,
                        })
                      }
                    >
                      <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {HARD_CONSTRAINT_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {translateNutritionEnum(t, "hardConstraintType", option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  }
                />
              ))}
            </ProfileListSection>

            <ProfileListSection
              addLabel={t("nutrition.profileEdit.addStance")}
              description={t(
                "nutrition.profileEdit.stancesDescription",
                "软立场不是禁止项，而是当前阶段希望计划多照顾一点的方向。",
              )}
              emptyLabel={t("nutrition.profileEdit.emptyStances")}
              title={t("nutrition.profileEdit.softStances")}
              onAdd={() =>
                updateForm({
                  softStances: [
                    ...form.softStances,
                    {
                      id: generateId("stance"),
                      type: "临时关注",
                      label: "",
                      note: "",
                    },
                  ],
                })
              }
            >
              {form.softStances.map((stance) => (
                <ProfileRow
                  key={stance.id}
                  label={stance.label}
                  labelPlaceholder={t(
                    "nutrition.profileEdit.stanceLabelPlaceholder",
                    "例如：补蔬果",
                  )}
                  note={stance.note}
                  notePlaceholder={t(
                    "nutrition.profileEdit.stanceNotePlaceholder",
                    "希望它怎样影响计划？",
                  )}
                  onLabelChange={(label) => updateStance(stance.id, { label })}
                  onNoteChange={(note) => updateStance(stance.id, { note })}
                  onRemove={() =>
                    updateForm({
                      softStances: form.softStances.filter((entry) => entry.id !== stance.id),
                    })
                  }
                  select={
                    <Select
                      value={stance.type}
                      onValueChange={(type) =>
                        updateStance(stance.id, {
                          type: (normalizeSelectValue(type) || stance.type) as SoftStanceType,
                        })
                      }
                    >
                      <SelectTrigger className={NUTRITION_DIALOG_FIELD_CLASS}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SOFT_STANCE_OPTIONS.map((option) => (
                          <SelectItem key={option} value={option}>
                            {translateNutritionEnum(t, "softStanceType", option)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  }
                />
              ))}
            </ProfileListSection>
          </div>

          <DialogFooter className={NUTRITION_DIALOG_FOOTER_CLASS}>
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

function ProfileListSection({
  addLabel,
  children,
  description,
  emptyLabel,
  onAdd,
  title,
}: {
  addLabel: string
  children: ReactNode
  description: string
  emptyLabel: string
  onAdd: () => void
  title: string
}) {
  const isEmpty = Children.count(children) === 0

  return (
    <section className={NUTRITION_DIALOG_SECTION_CLASS}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-muted-foreground mt-1 text-xs leading-5">{description}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="size-3.5" />
          {addLabel}
        </Button>
      </div>
      <div className="mt-3 space-y-3">
        {isEmpty ? (
          <div className="border-foreground/15 bg-muted/25 text-muted-foreground rounded-xl border border-dashed px-4 py-3 text-xs">
            {emptyLabel}
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  )
}

function ProfileRow({
  label,
  labelPlaceholder,
  note,
  notePlaceholder,
  onLabelChange,
  onNoteChange,
  onRemove,
  select,
}: {
  label: string
  labelPlaceholder: string
  note: string
  notePlaceholder: string
  onLabelChange: (value: string) => void
  onNoteChange: (value: string) => void
  onRemove: () => void
  select: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <div className="border-foreground/10 bg-background/70 grid gap-3 rounded-xl border p-3 lg:grid-cols-[180px_minmax(0,1fr)_auto]">
      <div>{select}</div>
      <div className="grid gap-3 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Input
          value={label}
          onChange={(event) => onLabelChange(event.target.value)}
          className={NUTRITION_DIALOG_FIELD_CLASS}
          placeholder={labelPlaceholder}
        />
        <Input
          value={note}
          onChange={(event) => onNoteChange(event.target.value)}
          className={NUTRITION_DIALOG_FIELD_CLASS}
          placeholder={notePlaceholder}
        />
      </div>
      <AnimatedIconButton
        show
        type="button"
        variant="ghost"
        size="icon-sm"
        label={t("nutrition.profileEdit.removeGoal")}
        icon={<Trash2 className="size-3.5" />}
        onClick={onRemove}
      />
    </div>
  )
}

function Field({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  )
}

function createInitialForm(nutrition: NutritionModuleData): ProfileFormState {
  return {
    mode: nutrition.profile.currentIntent.mode,
    note: nutrition.profile.currentIntent.note ?? "",
    windowStart: nutrition.profile.currentIntent.window?.start ?? "",
    windowEnd: nutrition.profile.currentIntent.window?.end ?? "",
    hardConstraints: nutrition.profile.hardConstraints.map(toConstraintForm),
    softStances: nutrition.profile.softStances.map(toStanceForm),
  }
}

function toConstraintForm(constraint: DietaryHardConstraint): ConstraintForm {
  return {
    id: constraint.id,
    type: constraint.type,
    label: constraint.label,
    note: constraint.note,
  }
}

function toStanceForm(stance: DietarySoftStance): StanceForm {
  return {
    id: stance.id,
    type: stance.type,
    label: stance.label,
    note: stance.note,
  }
}
