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
import { Textarea } from "@/components/ui/textarea"
import { useSaveFutureMutation } from "@/features/bettertolive/queries/use-save-future-mutation"
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

function listToText(values: string[] | undefined) {
  return (values ?? []).join("\n")
}

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

export function FutureBlueprintEditDialog({
  future,
  onClose,
}: {
  future: FutureBlueprint
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveFutureMutation = useSaveFutureMutation()
  const [identity, setIdentity] = useState(future.identity)
  const [lifestyle, setLifestyle] = useState(future.lifestyle)
  const [valuesText, setValuesText] = useState(() => listToText(future.values))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!identity.trim() || !lifestyle.trim()) {
      toast.error(t("future.edit.validation.blueprintRequired"))
      return
    }

    try {
      await saveFutureMutation.mutateAsync({
        ...future,
        identity: identity.trim(),
        lifestyle: lifestyle.trim(),
        values: textToDelimitedList(valuesText),
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
          FUTURE_DIALOG_CONTENT_CLASS,
          "flex max-h-[min(720px,calc(100dvh-2rem))] max-w-4xl flex-col overflow-hidden",
        )}
      >
        <DialogHeader className={FUTURE_DIALOG_HEADER_CLASS}>
          <DialogTitle>{t("future.edit.blueprintTitle")}</DialogTitle>
          <DialogDescription>
            {t(
              "future.edit.blueprintDescription",
              "这里只保存核心定义：想成为的人、想过的生活和重要价值。",
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
            <section className={FUTURE_DIALOG_SECTION_CLASS}>
              <FutureField label={t("future.edit.identity")}>
                <Textarea
                  value={identity}
                  onChange={(event) => setIdentity(event.target.value)}
                  className={cn(FUTURE_DIALOG_FIELD_CLASS, "min-h-28")}
                  placeholder={t("future.edit.identityPlaceholder")}
                />
              </FutureField>

              <FutureField label={t("future.edit.lifestyle")}>
                <Textarea
                  value={lifestyle}
                  onChange={(event) => setLifestyle(event.target.value)}
                  className={cn(FUTURE_DIALOG_FIELD_CLASS, "min-h-28")}
                  placeholder={t(
                    "future.edit.lifestylePlaceholder",
                    "写下生活空间、工作节奏、关系和恢复方式。",
                  )}
                />
              </FutureField>

              <FutureField label={t("future.edit.values")} hint={t("future.edit.valuesHint")}>
                <Textarea
                  value={valuesText}
                  onChange={(event) => setValuesText(event.target.value)}
                  className={cn(FUTURE_DIALOG_FIELD_CLASS, "min-h-24")}
                />
              </FutureField>
            </section>
          </div>

          <DialogFooter className={FUTURE_DIALOG_FOOTER_CLASS}>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit" disabled={saveFutureMutation.isPending}>
              {t("common.actions.save")}
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
  const [horizon, setHorizon] = useState(editing.milestone?.horizon ?? "")
  const [summary, setSummary] = useState(editing.milestone?.summary ?? "")
  const [stepsText, setStepsText] = useState(() => listToText(editing.milestone?.steps))

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const steps = textToLines(stepsText)

    if (!horizon.trim() || !summary.trim() || steps.length === 0) {
      toast.error(t("future.edit.validation.milestoneRequired"))
      return
    }

    try {
      await saveFutureMutation.mutateAsync({
        ...future,
        milestones: replaceAt(
          future.milestones,
          editing.index,
          {
            horizon: horizon.trim(),
            summary: summary.trim(),
            steps,
          },
          editing.isNew,
        ),
      })
      toast.success(t("common.toast.saved"))
      onClose()
    } catch {
      toast.error(t("common.toast.saveFailed"))
    }
  }

  const handleDelete = async () => {
    if (editing.isNew) return

    const confirmed = window.confirm(
      t("common.confirm.deleteItem", {
        name: editing.milestone?.horizon,
      }),
    )

    if (!confirmed) return

    try {
      await saveFutureMutation.mutateAsync({
        ...future,
        milestones: removeAt(future.milestones, editing.index),
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

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
            <section className={FUTURE_DIALOG_SECTION_CLASS}>
              <FutureField label={t("future.edit.horizon")}>
                <Input
                  value={horizon}
                  onChange={(event) => setHorizon(event.target.value)}
                  className={FUTURE_DIALOG_FIELD_CLASS}
                  placeholder={t("future.edit.horizonPlaceholder")}
                />
              </FutureField>

              <FutureField label={t("future.edit.summary")}>
                <Textarea
                  value={summary}
                  onChange={(event) => setSummary(event.target.value)}
                  className={cn(FUTURE_DIALOG_FIELD_CLASS, "min-h-24")}
                />
              </FutureField>

              <FutureField label={t("future.edit.steps")} hint={t("future.edit.stepsHint")}>
                <Textarea
                  value={stepsText}
                  onChange={(event) => setStepsText(event.target.value)}
                  className={cn(FUTURE_DIALOG_FIELD_CLASS, "min-h-32")}
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
            <Button type="submit" disabled={saveFutureMutation.isPending}>
              {t("common.actions.save")}
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
  const [experiment, setExperiment] = useState(editing.experiment)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!experiment.trim()) {
      toast.error(t("future.edit.validation.experimentRequired"))
      return
    }

    try {
      await saveFutureMutation.mutateAsync({
        ...future,
        experiments: replaceAt(future.experiments, editing.index, experiment.trim(), editing.isNew),
      })
      toast.success(t("common.toast.saved"))
      onClose()
    } catch {
      toast.error(t("common.toast.saveFailed"))
    }
  }

  const handleDelete = async () => {
    if (editing.isNew) return

    const confirmed = window.confirm(t("future.confirm.deleteExperiment"))

    if (!confirmed) return

    try {
      await saveFutureMutation.mutateAsync({
        ...future,
        experiments: removeAt(future.experiments, editing.index),
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

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
            <section className={FUTURE_DIALOG_SECTION_CLASS}>
              <FutureField label={t("future.edit.experiment")}>
                <Textarea
                  value={experiment}
                  onChange={(event) => setExperiment(event.target.value)}
                  className={cn(FUTURE_DIALOG_FIELD_CLASS, "min-h-32")}
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
            <Button type="submit" disabled={saveFutureMutation.isPending}>
              {t("common.actions.save")}
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
