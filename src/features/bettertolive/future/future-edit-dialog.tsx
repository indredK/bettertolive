import { Trash2 } from "lucide-react"
import type { ReactNode } from "react"
import { joinListText } from "@/lib/list-utils"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"

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
import { Textarea } from "@/components/ui/textarea"
import { useSaveFutureMutation } from "@/features/bettertolive/future/queries"
import { confirmUndoableDelete } from "@/features/bettertolive/shared/shopping-delete"
import type { FutureBlueprint, FutureMilestone } from "@/features/bettertolive/types"
import { cn } from "@/lib/utils"

export type EditingFutureMilestone = {
  isNew: boolean
  index: number | null
  milestone: FutureMilestone | null
}

export type EditingFutureExperiment = {
  isNew: boolean
  index: number | null
  experiment: string
}

const FUTURE_DIALOG_CONTENT_CLASS = "border border-foreground/10 bg-background shadow-lg"

const FUTURE_DIALOG_HEADER_CLASS =
  "sticky top-0 z-10 -mx-4 -mt-4 border-b border-foreground/10 bg-background/95 px-4 pt-4 pb-3 pr-12 supports-[backdrop-filter]:bg-background/90 supports-[backdrop-filter]:backdrop-blur-xs"

const FUTURE_DIALOG_SECTION_CLASS =
  "space-y-3 rounded-xl border border-foreground/10 bg-card/70 p-4"

const FUTURE_DIALOG_FIELD_CLASS = "w-full border-foreground/15 bg-background shadow-sm"

const FUTURE_DIALOG_FOOTER_CLASS =
  "sticky bottom-0 z-10 gap-2 border-foreground/10 bg-background/95 supports-[backdrop-filter]:bg-background/90 supports-[backdrop-filter]:backdrop-blur-xs"

function textToDelimitedList(text: string) {
  return text
    .split(/\n|,|，/)
    .map((line) => line.trim())
    .filter(Boolean)
}

function textToLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
}

function replaceAt<T>(items: T[], index: number | null, nextItem: T, isNew: boolean) {
  if (isNew || index === null || index < 0 || index >= items.length) {
    return [...items, nextItem]
  }

  return items.map((item, itemIndex) => (itemIndex === index ? nextItem : item))
}

function removeAt<T>(items: T[], index: number | null) {
  if (index === null || index < 0 || index >= items.length) {
    return items
  }

  return items.filter((_, itemIndex) => itemIndex !== index)
}

const blueprintFormSchema = z.object({
  identity: z.string().min(1),
  lifestyle: z.string().min(1),
  valuesText: z.string(),
})

type BlueprintFormValues = z.infer<typeof blueprintFormSchema>

const milestoneFormSchema = z.object({
  horizon: z.string().min(1),
  summary: z.string().min(1),
  stepsText: z.string().min(1),
})

type MilestoneFormValues = z.infer<typeof milestoneFormSchema>

const experimentFormSchema = z.object({
  experiment: z.string().min(1),
})

type ExperimentFormValues = z.infer<typeof experimentFormSchema>

export function FutureBlueprintEditDialog({
  future,
  onClose,
}: {
  future: FutureBlueprint
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveFutureMutation = useSaveFutureMutation()
  const form = useForm<BlueprintFormValues>({
    resolver: zodResolver(blueprintFormSchema),
    defaultValues: {
      identity: future.identity,
      lifestyle: future.lifestyle,
      valuesText: joinListText(future.values, "\n"),
    },
  })

  const handleFormSubmit = form.handleSubmit(async (values) => {
    await saveFutureMutation.mutateAsync({
      ...future,
      identity: values.identity.trim(),
      lifestyle: values.lifestyle.trim(),
      values: textToDelimitedList(values.valuesText),
    })
    toast.success(t("common.toast.saved"))
    onClose()
  })

  const canSubmit = form.formState.isValid

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent
        className={cn(
          FUTURE_DIALOG_CONTENT_CLASS,
          "flex max-h-[min(720px,calc(100dvh-2rem))] max-w-4xl flex-col overflow-hidden",
        )}
      >
        <DialogHeader className={FUTURE_DIALOG_HEADER_CLASS}>
          <DialogTitle>{t("future.edit.blueprintTitle")}</DialogTitle>
          <DialogDescription>{t("future.edit.blueprintDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
            <section className={FUTURE_DIALOG_SECTION_CLASS}>
              <FutureField label={t("future.edit.identity")}>
                <Controller
                  control={form.control}
                  name="identity"
                  render={({ field }) => (
                    <Textarea
                      value={field.value}
                      onChange={field.onChange}
                      className={cn(FUTURE_DIALOG_FIELD_CLASS, "min-h-28")}
                      placeholder={t("future.edit.identityPlaceholder")}
                    />
                  )}
                />
              </FutureField>

              <FutureField label={t("future.edit.lifestyle")}>
                <Controller
                  control={form.control}
                  name="lifestyle"
                  render={({ field }) => (
                    <Textarea
                      value={field.value}
                      onChange={field.onChange}
                      className={cn(FUTURE_DIALOG_FIELD_CLASS, "min-h-28")}
                      placeholder={t("future.edit.lifestylePlaceholder")}
                    />
                  )}
                />
              </FutureField>

              <FutureField label={t("future.edit.values")} hint={t("future.edit.valuesHint")}>
                <Controller
                  control={form.control}
                  name="valuesText"
                  render={({ field }) => (
                    <Textarea
                      value={field.value}
                      onChange={field.onChange}
                      className={cn(FUTURE_DIALOG_FIELD_CLASS, "min-h-24")}
                    />
                  )}
                />
              </FutureField>
            </section>
          </div>

          <DialogFooter className={FUTURE_DIALOG_FOOTER_CLASS}>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit" disabled={saveFutureMutation.isPending || !canSubmit}>
              {saveFutureMutation.isPending ? t("common.actions.saving") : t("common.actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function FutureMilestoneEditDialog({
  editing,
  future,
  onClose,
}: {
  editing: EditingFutureMilestone
  future: FutureBlueprint
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveFutureMutation = useSaveFutureMutation()
  const form = useForm<MilestoneFormValues>({
    resolver: zodResolver(milestoneFormSchema),
    defaultValues: {
      horizon: editing.milestone?.horizon ?? "",
      summary: editing.milestone?.summary ?? "",
      stepsText: joinListText(editing.milestone?.steps, "\n"),
    },
  })

  const handleFormSubmit = form.handleSubmit(async (values) => {
    const steps = textToLines(values.stepsText)
    await saveFutureMutation.mutateAsync({
      ...future,
      milestones: replaceAt(
        future.milestones,
        editing.index,
        {
          horizon: values.horizon.trim(),
          summary: values.summary.trim(),
          steps,
        },
        editing.isNew,
      ),
    })
    toast.success(t("common.toast.saved"))
    onClose()
  })

  const canSubmit = form.formState.isValid

  const handleDelete = () => {
    if (editing.isNew) return

    confirmUndoableDelete({
      confirmMessage: t("common.confirm.deleteItem", {
        name: editing.milestone?.horizon,
      }),
      pendingMessage: t("common.toast.deletePending", {
        name: editing.milestone?.horizon ?? "",
      }),
      successMessage: t("common.toast.deleted"),
      failureMessage: t("common.toast.deleteFailed"),
      undoLabel: t("common.actions.undo"),
      undoneMessage: t("common.toast.deleteUndone", {
        name: editing.milestone?.horizon ?? "",
      }),
      onDelete: () =>
        saveFutureMutation.mutateAsync({
          ...future,
          milestones: removeAt(future.milestones, editing.index),
        }),
      onDeleted: () => onClose(),
    })
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent
        className={cn(
          FUTURE_DIALOG_CONTENT_CLASS,
          "flex max-h-[min(720px,calc(100dvh-2rem))] max-w-3xl flex-col overflow-hidden",
        )}
      >
        <DialogHeader className={FUTURE_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew
              ? t("future.edit.milestoneCreateTitle")
              : t("future.edit.milestoneEditTitle")}
          </DialogTitle>
          <DialogDescription>{t("future.edit.milestoneDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
            <section className={FUTURE_DIALOG_SECTION_CLASS}>
              <FutureField label={t("future.edit.horizon")}>
                <Controller
                  control={form.control}
                  name="horizon"
                  render={({ field }) => (
                    <Input
                      value={field.value}
                      onChange={field.onChange}
                      className={FUTURE_DIALOG_FIELD_CLASS}
                      placeholder={t("future.edit.horizonPlaceholder")}
                    />
                  )}
                />
              </FutureField>

              <FutureField label={t("future.edit.summary")}>
                <Controller
                  control={form.control}
                  name="summary"
                  render={({ field }) => (
                    <Textarea
                      value={field.value}
                      onChange={field.onChange}
                      className={cn(FUTURE_DIALOG_FIELD_CLASS, "min-h-24")}
                    />
                  )}
                />
              </FutureField>

              <FutureField label={t("future.edit.steps")} hint={t("future.edit.stepsHint")}>
                <Controller
                  control={form.control}
                  name="stepsText"
                  render={({ field }) => (
                    <Textarea
                      value={field.value}
                      onChange={field.onChange}
                      className={cn(FUTURE_DIALOG_FIELD_CLASS, "min-h-32")}
                    />
                  )}
                />
              </FutureField>
            </section>
          </div>

          <DialogFooter className={FUTURE_DIALOG_FOOTER_CLASS}>
            {!editing.isNew ? (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                <Trash2 className="size-4" />
                {t("common.actions.delete")}
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit" disabled={saveFutureMutation.isPending || !canSubmit}>
              {saveFutureMutation.isPending ? t("common.actions.saving") : t("common.actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function FutureExperimentEditDialog({
  editing,
  future,
  onClose,
}: {
  editing: EditingFutureExperiment
  future: FutureBlueprint
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveFutureMutation = useSaveFutureMutation()
  const form = useForm<ExperimentFormValues>({
    resolver: zodResolver(experimentFormSchema),
    defaultValues: { experiment: editing.experiment },
  })

  const handleFormSubmit = form.handleSubmit(async (values) => {
    await saveFutureMutation.mutateAsync({
      ...future,
      experiments: replaceAt(
        future.experiments,
        editing.index,
        values.experiment.trim(),
        editing.isNew,
      ),
    })
    toast.success(t("common.toast.saved"))
    onClose()
  })

  const canSubmit = form.formState.isValid

  const handleDelete = () => {
    if (editing.isNew) return

    confirmUndoableDelete({
      confirmMessage: t("future.confirm.deleteExperiment"),
      pendingMessage: t("common.toast.deletePending", {
        name: editing.experiment ?? "",
      }),
      successMessage: t("common.toast.deleted"),
      failureMessage: t("common.toast.deleteFailed"),
      undoLabel: t("common.actions.undo"),
      undoneMessage: t("common.toast.deleteUndone", {
        name: editing.experiment ?? "",
      }),
      onDelete: () =>
        saveFutureMutation.mutateAsync({
          ...future,
          experiments: removeAt(future.experiments, editing.index),
        }),
      onDeleted: () => onClose(),
    })
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent
        className={cn(
          FUTURE_DIALOG_CONTENT_CLASS,
          "flex max-h-[min(560px,calc(100dvh-2rem))] max-w-2xl flex-col overflow-hidden",
        )}
      >
        <DialogHeader className={FUTURE_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew
              ? t("future.edit.experimentCreateTitle")
              : t("future.edit.experimentEditTitle")}
          </DialogTitle>
          <DialogDescription>{t("future.edit.experimentDescription")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
            <section className={FUTURE_DIALOG_SECTION_CLASS}>
              <FutureField label={t("future.edit.experiment")}>
                <Controller
                  control={form.control}
                  name="experiment"
                  render={({ field }) => (
                    <Textarea
                      value={field.value}
                      onChange={field.onChange}
                      className={cn(FUTURE_DIALOG_FIELD_CLASS, "min-h-32")}
                    />
                  )}
                />
              </FutureField>
            </section>
          </div>

          <DialogFooter className={FUTURE_DIALOG_FOOTER_CLASS}>
            {!editing.isNew ? (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                <Trash2 className="size-4" />
                {t("common.actions.delete")}
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit" disabled={saveFutureMutation.isPending || !canSubmit}>
              {saveFutureMutation.isPending ? t("common.actions.saving") : t("common.actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FutureField({
  children,
  hint,
  label,
}: {
  children: ReactNode
  hint?: string
  label: string
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Label className="text-foreground/70 text-xs font-medium">{label}</Label>
        {hint ? <span className="text-muted-foreground text-[11px]">{hint}</span> : null}
      </div>
      {children}
    </div>
  )
}
