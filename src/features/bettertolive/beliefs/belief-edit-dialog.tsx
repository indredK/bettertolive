"use client"

/* eslint-disable react-hooks/incompatible-library */
import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Trash2 } from "lucide-react"

import { type BeliefEntryForm } from "@/features/bettertolive/api/beliefs-crud-api"
import {
  createBeliefEntry,
  deleteBeliefEntry,
  updateBeliefEntry,
} from "@/features/bettertolive/api/beliefs-crud-api"
import type {
  BeliefCbtLayer,
  BeliefDomain,
  BeliefImpact,
  BeliefLayer,
  BeliefRevision,
  BeliefSource,
  BeliefStability,
  CognitiveDistortion,
  DefenseMechanism,
} from "@/features/bettertolive/types"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
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
import { joinListText, splitListText, uniqueList } from "@/lib/list-utils"
import { confirmUndoableDelete } from "@/features/bettertolive/shared/shopping-delete"
import { useDirtyConfirm } from "@/features/bettertolive/hooks/use-dirty-confirm"

import type { EditingBelief } from "@/features/bettertolive/beliefs/beliefs-page"
import {
  BELIEF_CBT_LAYERS,
  BELIEF_DOMAINS,
  DEFENSE_MECHANISMS,
  BELIEF_IMPACTS,
  BELIEF_LAYERS,
  BELIEF_SOURCES,
  BELIEF_STABILITIES,
  COGNITIVE_DISTORTIONS,
  NONE_SELECT_VALUE,
  labelFor,
  todayText,
  toggleValue,
} from "@/features/bettertolive/beliefs/beliefs-constants"

const beliefFormSchema = z.object({
  title: z.string().min(1, "beliefs.error.required"),
  statement: z.string().min(1, "beliefs.error.required"),
  description: z.string(),
  domain: z.string(),
  layer: z.string(),
  stability: z.string(),
  source: z.string(),
  impact: z.string(),
  secondaryDomains: z.array(z.string()),
  cbtLayer: z.string().nullable(),
  cognitiveDistortions: z.array(z.string()),
  defenseMechanism: z.string().nullable(),
  attachmentNote: z.string(),
  tags: z.string(),
})

type BeliefFormValues = z.infer<typeof beliefFormSchema>

function EnumSelect<T extends string>({
  label,
  value,
  options,
  enumGroup,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  enumGroup: string
  onChange: (value: T) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select value={value} onValueChange={(nextValue) => onChange(nextValue as T)}>
        <SelectTrigger className="border-foreground/15 bg-background w-full shadow-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {labelFor(t, enumGroup, option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function OptionalEnumSelect<T extends string>({
  label,
  value,
  options,
  enumGroup,
  onChange,
}: {
  label: string
  value: T | null
  options: readonly T[]
  enumGroup: string
  onChange: (value: T | null) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Select
        value={value ?? NONE_SELECT_VALUE}
        onValueChange={(nextValue) =>
          onChange(nextValue === NONE_SELECT_VALUE ? null : (nextValue as T))
        }
      >
        <SelectTrigger className="border-foreground/15 bg-background w-full shadow-sm">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NONE_SELECT_VALUE}>{t("beliefs.form.optional")}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {labelFor(t, enumGroup, option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function CheckboxGroup<T extends string>({
  label,
  values,
  options,
  enumGroup,
  onToggle,
}: {
  label: string
  values: T[]
  options: readonly T[]
  enumGroup: string
  onToggle: (value: T) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="border-foreground/10 bg-background/70 grid gap-2 rounded-lg border p-3 min-[720px]:grid-cols-2">
        {options.map((option) => (
          <label key={option} className="text-foreground flex items-center gap-2 text-sm">
            <Checkbox checked={values.includes(option)} onCheckedChange={() => onToggle(option)} />
            <span>{labelFor(t, enumGroup, option)}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export function BeliefEditDialog({
  editing,
  onClose,
  onSaved,
  onDeleted,
}: {
  editing: EditingBelief
  onClose: () => void
  onSaved: () => void
  onDeleted: () => void
}) {
  const { t } = useTranslation()
  const seed = editing.entry
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<BeliefFormValues>({
    resolver: zodResolver(beliefFormSchema),
    defaultValues: {
      title: seed?.title ?? "",
      statement: seed?.statement ?? "",
      description: seed?.description ?? "",
      domain: seed?.domain ?? BELIEF_DOMAINS[0],
      layer: seed?.layer ?? BELIEF_LAYERS[0],
      stability: seed?.stability ?? BELIEF_STABILITIES[0],
      source: seed?.source ?? BELIEF_SOURCES[0],
      impact: seed?.impact ?? BELIEF_IMPACTS[0],
      secondaryDomains: seed?.secondaryDomains ?? [],
      cbtLayer: seed?.cbtLayer ?? null,
      cognitiveDistortions: seed?.cognitiveDistortions ?? [],
      defenseMechanism: seed?.defenseMechanism ?? null,
      attachmentNote: seed?.attachmentNote ?? "",
      tags: joinListText(seed?.tags, "，"),
    },
  })

  const {
    watch,
    setValue,
    formState: { isValid, isDirty },
  } = form

  const domain = watch("domain")

  const handleDomainChange = (nextDomain: BeliefDomain) => {
    setValue("domain", nextDomain, { shouldDirty: true })
    const currentSecondary = form.getValues("secondaryDomains")
    setValue(
      "secondaryDomains",
      currentSecondary.filter((item) => item !== nextDomain),
      { shouldDirty: true },
    )
  }

  const createAutoRevision = (): BeliefRevision | null => {
    if (!seed) return null

    const values = form.getValues()
    const changedFields: BeliefRevision["changedFields"] = []
    if (
      seed.title !== values.title.trim() ||
      seed.statement !== values.statement.trim() ||
      seed.description !== values.description.trim() ||
      seed.domain !== values.domain ||
      seed.layer !== values.layer ||
      seed.source !== values.source ||
      joinListText(seed.secondaryDomains, "，") !==
        joinListText(
          values.secondaryDomains.filter((item) => item !== values.domain),
          "，",
        ) ||
      (seed.cbtLayer ?? null) !== values.cbtLayer ||
      joinListText(seed.cognitiveDistortions, "，") !==
        joinListText(values.cognitiveDistortions, "，") ||
      (seed.defenseMechanism ?? null) !== values.defenseMechanism ||
      (seed.attachmentNote ?? "") !== values.attachmentNote.trim() ||
      joinListText(seed.tags, "，") !==
        joinListText(uniqueList(splitListText(values.tags, /[,\n，]/)), "，")
    ) {
      changedFields.push("内容")
    }
    if (seed.stability !== values.stability) {
      changedFields.push("稳定性")
    }
    if (seed.impact !== values.impact) {
      changedFields.push("影响")
    }

    if (changedFields.length === 0) return null

    return {
      id: `${seed.id}-rev-${Date.now()}`,
      date: todayText(),
      summary: t("beliefs.revision.autoSummary"),
      changedFields,
    }
  }

  const handleFormSubmit = form.handleSubmit(async (values) => {
    const autoRevision = createAutoRevision()
    const payload: BeliefEntryForm = {
      id: seed?.id,
      title: values.title.trim(),
      statement: values.statement.trim(),
      description: values.description.trim(),
      domain: values.domain as BeliefDomain,
      layer: values.layer as BeliefLayer,
      stability: values.stability as BeliefStability,
      source: values.source as BeliefSource,
      impact: values.impact as BeliefImpact,
      secondaryDomains: values.secondaryDomains.filter(
        (item) => item !== values.domain,
      ) as BeliefDomain[],
      cbtLayer: (values.cbtLayer as BeliefCbtLayer | null) ?? undefined,
      cognitiveDistortions: values.cognitiveDistortions as CognitiveDistortion[],
      defenseMechanism: (values.defenseMechanism as DefenseMechanism | null) ?? undefined,
      attachmentNote: values.attachmentNote.trim() || undefined,
      revisionHistory: autoRevision
        ? [...(seed?.revisionHistory ?? []), autoRevision]
        : (seed?.revisionHistory ?? []),
      tags: uniqueList(splitListText(values.tags, /[,\n，]/)),
    }

    try {
      setIsSubmitting(true)
      if (editing.isNew) {
        await createBeliefEntry(payload)
      } else {
        await updateBeliefEntry(payload)
      }
      onSaved()
    } catch (error) {
      toast.error(String(error))
    } finally {
      setIsSubmitting(false)
    }
  })

  const handleDelete = () => {
    if (!seed) return

    const scheduled = confirmUndoableDelete({
      confirmMessage: t("common.confirm.deleteItem", {
        name: seed.title,
      }),
      pendingMessage: t("common.toast.deletePending", {
        name: seed.title,
      }),
      successMessage: t("beliefs.toast.deleteSuccess", {
        name: seed.title,
      }),
      failureMessage: t("common.toast.deleteFailed"),
      undoLabel: t("common.actions.undo"),
      undoneMessage: t("common.toast.deleteUndone", {
        name: seed.title,
      }),
      onDelete: () => deleteBeliefEntry(seed.id),
      onDeleted,
    })

    if (scheduled) {
      onClose()
    }
  }

  const { handleOpenChange, dirtyConfirmDialog } = useDirtyConfirm({
    isDirty,
    confirmMessage: t("common.confirm.unsavedChanges"),
    cancelLabel: t("common.actions.cancel"),
    confirmLabel: t("common.actions.confirm"),
  })

  return (
    <>
      <Dialog open onOpenChange={handleOpenChange(onClose)}>
        <DialogContent className="border-foreground/10 bg-background flex max-h-[90vh] flex-col overflow-hidden border shadow-lg sm:max-w-[min(1080px,calc(100vw-3rem))]">
          <DialogHeader className="border-foreground/10 bg-background/95 supports-[backdrop-filter]:bg-background/90 sticky top-0 z-10 -mx-4 -mt-4 border-b px-4 pt-4 pr-12 pb-3 supports-[backdrop-filter]:backdrop-blur-xs">
            <DialogTitle>
              {editing.isNew ? t("beliefs.actions.create") : t("beliefs.actions.editEntry")}
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={handleFormSubmit}
            className="grid min-h-0 flex-1 gap-4 overflow-y-auto pr-1 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]"
          >
            <div className="border-foreground/10 bg-card/70 space-y-4 rounded-lg border p-4">
              <div className="text-foreground text-sm font-medium">{t("beliefs.form.basic")}</div>
              <div className="space-y-1.5">
                <Label>{t("beliefs.field.title")} *</Label>
                <Input
                  {...form.register("title")}
                  placeholder=""
                  className="border-foreground/15 bg-background w-full shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("beliefs.field.statement")} *</Label>
                <Textarea
                  {...form.register("statement")}
                  rows={4}
                  className="border-foreground/15 bg-background w-full resize-none shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("beliefs.field.description")}</Label>
                <Textarea
                  {...form.register("description")}
                  rows={5}
                  className="border-foreground/15 bg-background w-full resize-none shadow-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("beliefs.field.tags")}</Label>
                <Input
                  {...form.register("tags")}
                  placeholder={t("common.form.tagsPlaceholder")}
                  className="border-foreground/15 bg-background w-full shadow-sm"
                />
              </div>
            </div>

            <div className="border-foreground/10 bg-card/70 space-y-4 rounded-lg border p-4">
              <div className="text-foreground text-sm font-medium">
                {t("beliefs.form.classification")}
              </div>
              <div className="grid gap-3 min-[720px]:grid-cols-2">
                <Controller
                  name="domain"
                  control={form.control}
                  render={({ field }) => (
                    <EnumSelect
                      label={t("beliefs.classification.domain.title")}
                      value={field.value as BeliefDomain}
                      options={BELIEF_DOMAINS}
                      enumGroup="domain"
                      onChange={handleDomainChange}
                    />
                  )}
                />
                <Controller
                  name="layer"
                  control={form.control}
                  render={({ field }) => (
                    <EnumSelect
                      label={t("beliefs.classification.layer.title")}
                      value={field.value as BeliefLayer}
                      options={BELIEF_LAYERS}
                      enumGroup="layer"
                      onChange={(v) => setValue("layer", v, { shouldDirty: true })}
                    />
                  )}
                />
                <Controller
                  name="stability"
                  control={form.control}
                  render={({ field }) => (
                    <EnumSelect
                      label={t("beliefs.classification.stability.title")}
                      value={field.value as BeliefStability}
                      options={BELIEF_STABILITIES}
                      enumGroup="stability"
                      onChange={(v) => setValue("stability", v, { shouldDirty: true })}
                    />
                  )}
                />
                <Controller
                  name="source"
                  control={form.control}
                  render={({ field }) => (
                    <EnumSelect
                      label={t("beliefs.classification.source.title")}
                      value={field.value as BeliefSource}
                      options={BELIEF_SOURCES}
                      enumGroup="source"
                      onChange={(v) => setValue("source", v, { shouldDirty: true })}
                    />
                  )}
                />
                <Controller
                  name="impact"
                  control={form.control}
                  render={({ field }) => (
                    <EnumSelect
                      label={t("beliefs.field.impact")}
                      value={field.value as BeliefImpact}
                      options={BELIEF_IMPACTS}
                      enumGroup="impact"
                      onChange={(v) => setValue("impact", v, { shouldDirty: true })}
                    />
                  )}
                />
                <Controller
                  name="cbtLayer"
                  control={form.control}
                  render={({ field }) => (
                    <OptionalEnumSelect
                      label={t("beliefs.field.cbtLayer")}
                      value={field.value as BeliefCbtLayer | null}
                      options={BELIEF_CBT_LAYERS}
                      enumGroup="cbtLayer"
                      onChange={(v) => setValue("cbtLayer", v, { shouldDirty: true })}
                    />
                  )}
                />
                <Controller
                  name="defenseMechanism"
                  control={form.control}
                  render={({ field }) => (
                    <OptionalEnumSelect
                      label={t("beliefs.field.defenseMechanism")}
                      value={field.value as DefenseMechanism | null}
                      options={DEFENSE_MECHANISMS}
                      enumGroup="defenseMechanism"
                      onChange={(v) => setValue("defenseMechanism", v, { shouldDirty: true })}
                    />
                  )}
                />
              </div>

              <Controller
                name="secondaryDomains"
                control={form.control}
                render={({ field }) => (
                  <CheckboxGroup
                    label={t("beliefs.field.secondaryDomains")}
                    values={field.value as BeliefDomain[]}
                    options={BELIEF_DOMAINS.filter((item) => item !== domain)}
                    enumGroup="domain"
                    onToggle={(value) =>
                      setValue(
                        "secondaryDomains",
                        toggleValue(field.value as BeliefDomain[], value),
                        { shouldDirty: true },
                      )
                    }
                  />
                )}
              />
              <Controller
                name="cognitiveDistortions"
                control={form.control}
                render={({ field }) => (
                  <CheckboxGroup
                    label={t("beliefs.field.cognitiveDistortions")}
                    values={field.value as CognitiveDistortion[]}
                    options={COGNITIVE_DISTORTIONS}
                    enumGroup="cognitiveDistortion"
                    onToggle={(value) =>
                      setValue(
                        "cognitiveDistortions",
                        toggleValue(field.value as CognitiveDistortion[], value),
                        { shouldDirty: true },
                      )
                    }
                  />
                )}
              />
              <div className="space-y-1.5">
                <Label>{t("beliefs.field.attachmentNote")}</Label>
                <Textarea
                  {...form.register("attachmentNote")}
                  rows={4}
                  className="border-foreground/15 bg-background w-full resize-none shadow-sm"
                />
              </div>
            </div>
          </form>

          <DialogFooter className="border-foreground/10 bg-background/95 supports-[backdrop-filter]:bg-background/90 sticky bottom-0 z-10 gap-2 supports-[backdrop-filter]:backdrop-blur-xs">
            {!editing.isNew ? (
              <Button variant="destructive" onClick={handleDelete} className="mr-auto">
                <Trash2 className="size-3.5" />
                {t("common.actions.delete")}
              </Button>
            ) : null}
            <Button variant="outline" onClick={onClose}>
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? t("common.actions.saving") : t("common.actions.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {dirtyConfirmDialog}
    </>
  )
}
