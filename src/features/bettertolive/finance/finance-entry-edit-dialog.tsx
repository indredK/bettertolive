import { Trash2 } from "lucide-react"
import type { ReactNode } from "react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useSaveFinanceMutation } from "@/features/bettertolive/finance/queries"
import { confirmUndoableDelete } from "@/features/bettertolive/shared/shopping-delete"
import type { FinanceModuleData, TransactionEntry } from "@/features/bettertolive/types"
import {
  FINANCE_CATEGORIES,
  FINANCE_DIRECTIONS,
  FINANCE_LIFE_SYSTEMS,
  FINANCE_LINKED_MODULES,
  FINANCE_NECESSITIES,
  FINANCE_REVIEW_STATUSES,
} from "@/features/bettertolive/finance/finance-page-data"
import { translateFinanceEnum } from "@/features/bettertolive/finance/finance-i18n"
import { generateId } from "@/lib/id-utils"
import { joinListText, splitListText } from "@/lib/list-utils"
import { cn } from "@/lib/utils"

export type EditingFinanceEntry = {
  isNew: boolean
  entry: TransactionEntry | null
}

const financeEntryFormSchema = z.object({
  date: z.string().min(1),
  label: z.string().min(1),
  category: z.enum(FINANCE_CATEGORIES),
  amount: z
    .string()
    .min(1)
    .refine((value) => Number.isFinite(Number(value)), "Amount must be a valid number")
    .refine((value) => Number(value) > 0, "Amount must be positive"),
  direction: z.enum(FINANCE_DIRECTIONS),
  note: z.string(),
  account: z.string(),
  lifeSystem: z.enum(FINANCE_LIFE_SYSTEMS),
  necessity: z.enum(FINANCE_NECESSITIES),
  reviewStatus: z.enum(FINANCE_REVIEW_STATUSES),
  linkedModule: z.enum(FINANCE_LINKED_MODULES),
  tagsText: z.string(),
})

type EntryFormValues = z.infer<typeof financeEntryFormSchema>

function createInitialEntryForm(entry: TransactionEntry | null): EntryFormValues {
  return {
    date: entry?.date ?? new Date().toISOString().slice(0, 10),
    label: entry?.label ?? "",
    category: entry?.category ?? FINANCE_CATEGORIES[0],
    amount: entry ? String(entry.amount) : "",
    direction: entry?.direction ?? "expense",
    note: entry?.note ?? "",
    account: entry?.account ?? "",
    lifeSystem: entry?.lifeSystem ?? FINANCE_LIFE_SYSTEMS[0],
    necessity: entry?.necessity ?? FINANCE_NECESSITIES[1],
    reviewStatus: entry?.reviewStatus ?? FINANCE_REVIEW_STATUSES[0],
    linkedModule: entry?.linkedModule ?? FINANCE_LINKED_MODULES[0],
    tagsText: joinListText(entry?.tags, "\n"),
  }
}

export function FinanceEntryEditDialog({
  editing,
  finance,
  onClose,
}: {
  editing: EditingFinanceEntry
  finance: FinanceModuleData
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveFinanceMutation = useSaveFinanceMutation()
  const form = useForm<EntryFormValues>({
    resolver: zodResolver(financeEntryFormSchema),
    defaultValues: createInitialEntryForm(editing.entry),
  })

  const handleFormSubmit = form.handleSubmit(async (values) => {
    const amount = Number(values.amount)

    const nextEntry: TransactionEntry = {
      id: editing.entry?.id ?? generateId("finance-entry"),
      date: values.date,
      label: values.label.trim(),
      category: values.category,
      amount,
      direction: values.direction,
      note: values.note.trim(),
      account: values.account.trim() || undefined,
      lifeSystem: values.lifeSystem,
      necessity: values.necessity,
      reviewStatus: values.reviewStatus,
      linkedModule: values.linkedModule,
      tags: splitListText(values.tagsText, /\n|,|，/),
    }

    const nextEntries = editing.isNew
      ? [nextEntry, ...finance.entries]
      : finance.entries.map((entry) => (entry.id === nextEntry.id ? nextEntry : entry))

    try {
      await saveFinanceMutation.mutateAsync({
        ...finance,
        entries: sortEntriesByDate(nextEntries),
      })
      toast.success(t("common.toast.saved"))
      onClose()
    } catch {
      // mutation.onError 已处理错误提示
    }
  })

  const canSubmit = form.formState.isValid

  const handleDelete = () => {
    if (!editing.entry) return

    confirmUndoableDelete({
      confirmMessage: t("common.confirm.deleteItem", {
        name: editing.entry.label,
      }),
      pendingMessage: t("common.toast.deletePending", { name: editing.entry.label }),
      successMessage: t("common.toast.deleted"),
      failureMessage: t("common.toast.deleteFailed"),
      undoLabel: t("common.actions.undo"),
      undoneMessage: t("common.toast.deleteUndone", { name: editing.entry.label }),
      onDelete: () =>
        saveFinanceMutation.mutateAsync({
          ...finance,
          entries: finance.entries.filter((entry) => entry.id !== editing.entry?.id),
        }),
      onDeleted: () => onClose(),
    })
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent className="flex max-h-[min(760px,calc(100dvh-2rem))] max-w-3xl flex-col overflow-hidden border-[color:var(--surface-border)] bg-[color:var(--dialog-bg)]">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            {editing.isNew ? t("finance.edit.createTitle") : t("finance.edit.editTitle")}
          </DialogTitle>
          <DialogDescription>{t("finance.edit.description")}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid gap-3 min-[720px]:grid-cols-2">
            <Field label={t("finance.edit.fields.date")}>
              <Controller
                control={form.control}
                name="date"
                render={({ field }) => (
                  <Input type="date" value={field.value} onChange={field.onChange} />
                )}
              />
            </Field>

            <Field label={t("finance.edit.fields.direction")}>
              <Controller
                control={form.control}
                name="direction"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      if (value !== null) field.onChange(value)
                    }}
                  >
                    <SelectTrigger fullWidth>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FINANCE_DIRECTIONS.map((direction) => (
                        <SelectItem key={direction} value={direction}>
                          {translateFinanceEnum(t, "direction", direction)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label={t("finance.edit.fields.label")}>
              <Controller
                control={form.control}
                name="label"
                render={({ field }) => <Input value={field.value} onChange={field.onChange} />}
              />
            </Field>

            <Field label={t("finance.edit.fields.amount")}>
              <Controller
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <Input
                    inputMode="decimal"
                    min="0"
                    step="0.01"
                    type="number"
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </Field>

            <Field label={t("finance.edit.fields.category")}>
              <Controller
                control={form.control}
                name="category"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      if (value !== null) field.onChange(value)
                    }}
                  >
                    <SelectTrigger fullWidth>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FINANCE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {translateFinanceEnum(t, "category", category)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label={t("finance.edit.fields.account")}>
              <Controller
                control={form.control}
                name="account"
                render={({ field }) => <Input value={field.value} onChange={field.onChange} />}
              />
            </Field>

            <Field label={t("finance.edit.fields.lifeSystem")}>
              <Controller
                control={form.control}
                name="lifeSystem"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      if (value !== null) field.onChange(value)
                    }}
                  >
                    <SelectTrigger fullWidth>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FINANCE_LIFE_SYSTEMS.map((system) => (
                        <SelectItem key={system} value={system}>
                          {translateFinanceEnum(t, "lifeSystem", system)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label={t("finance.edit.fields.necessity")}>
              <Controller
                control={form.control}
                name="necessity"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      if (value !== null) field.onChange(value)
                    }}
                  >
                    <SelectTrigger fullWidth>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FINANCE_NECESSITIES.map((necessity) => (
                        <SelectItem key={necessity} value={necessity}>
                          {translateFinanceEnum(t, "necessity", necessity)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label={t("finance.edit.fields.reviewStatus")}>
              <Controller
                control={form.control}
                name="reviewStatus"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      if (value !== null) field.onChange(value)
                    }}
                  >
                    <SelectTrigger fullWidth>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FINANCE_REVIEW_STATUSES.map((status) => (
                        <SelectItem key={status} value={status}>
                          {translateFinanceEnum(t, "reviewStatus", status)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label={t("finance.edit.fields.linkedModule")}>
              <Controller
                control={form.control}
                name="linkedModule"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      if (value !== null) field.onChange(value)
                    }}
                  >
                    <SelectTrigger fullWidth>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FINANCE_LINKED_MODULES.map((module) => (
                        <SelectItem key={module} value={module}>
                          {translateFinanceEnum(t, "linkedModule", module)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field className="min-[720px]:col-span-2" label={t("finance.edit.fields.note")}>
              <Controller
                control={form.control}
                name="note"
                render={({ field }) => (
                  <Textarea value={field.value} onChange={field.onChange} rows={3} />
                )}
              />
            </Field>

            <Field className="min-[720px]:col-span-2" label={t("finance.edit.fields.tags")}>
              <Controller
                control={form.control}
                name="tagsText"
                render={({ field }) => (
                  <Textarea
                    value={field.value}
                    onChange={field.onChange}
                    placeholder={t("finance.edit.tagsPlaceholder")}
                    rows={3}
                  />
                )}
              />
            </Field>
          </div>

          <DialogFooter className="mt-5 gap-2 border-t border-[color:var(--muted-surface-border)] pt-4">
            {!editing.isNew ? (
              <Button
                type="button"
                variant="outline"
                className="mr-auto gap-2 text-[color:var(--destructive)]"
                onClick={handleDelete}
              >
                <Trash2 className="size-4" />
                {t("common.actions.delete")}
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit" disabled={saveFinanceMutation.isPending || !canSubmit}>
              {saveFinanceMutation.isPending
                ? t("common.actions.saving")
                : t("common.actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  children,
  className,
  label,
}: {
  children: ReactNode
  className?: string
  label: string
}) {
  return (
    <label
      className={cn(
        "grid gap-1.5 text-sm font-medium text-[color:var(--text-secondary)]",
        className,
      )}
    >
      {label}
      {children}
    </label>
  )
}

function sortEntriesByDate(entries: TransactionEntry[]) {
  return [...entries].sort((left, right) => right.date.localeCompare(left.date))
}
