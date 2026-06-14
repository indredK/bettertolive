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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useSaveFinanceMutation } from "@/features/bettertolive/queries/use-save-finance-mutation"
import { confirmUndoableDelete } from "@/features/bettertolive/ui/shopping/_shared/shopping-delete"
import type {
  FinanceLifeSystem,
  FinanceLinkedModule,
  FinanceModuleData,
  FinanceNecessity,
  FinanceReviewStatus,
  TransactionDirection,
  TransactionEntry,
} from "@/features/bettertolive/types"
import {
  FINANCE_CATEGORIES,
  FINANCE_DIRECTIONS,
  FINANCE_LIFE_SYSTEMS,
  FINANCE_LINKED_MODULES,
  FINANCE_NECESSITIES,
  FINANCE_REVIEW_STATUSES,
  createFinanceId,
  joinFinanceListText,
  splitFinanceListText,
} from "@/features/bettertolive/ui/finance/finance-page-data"
import { translateFinanceEnum } from "@/features/bettertolive/ui/finance/finance-i18n"
import { cn } from "@/lib/utils"

export type EditingFinanceEntry = {
  isNew: boolean
  entry: TransactionEntry | null
}

type EntryFormState = {
  date: string
  label: string
  category: string
  amount: string
  direction: TransactionDirection
  note: string
  account: string
  lifeSystem: FinanceLifeSystem
  necessity: FinanceNecessity
  reviewStatus: FinanceReviewStatus
  linkedModule: FinanceLinkedModule
  tagsText: string
}

function createInitialEntryForm(entry: TransactionEntry | null): EntryFormState {
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
    tagsText: joinFinanceListText(entry?.tags),
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
  const [form, setForm] = useState<EntryFormState>(() => createInitialEntryForm(editing.entry))

  const updateForm = (patch: Partial<EntryFormState>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    const amount = Number(form.amount)

    if (!form.date || !form.label.trim() || !form.category.trim() || !Number.isFinite(amount)) {
      toast.error(t("finance.edit.validation.required"))
      return
    }

    if (amount <= 0) {
      toast.error(t("finance.edit.validation.amountPositive"))
      return
    }

    const nextEntry: TransactionEntry = {
      id: editing.entry?.id ?? createFinanceId(),
      date: form.date,
      label: form.label.trim(),
      category: form.category.trim(),
      amount,
      direction: form.direction,
      note: form.note.trim(),
      account: form.account.trim() || undefined,
      lifeSystem: form.lifeSystem,
      necessity: form.necessity,
      reviewStatus: form.reviewStatus,
      linkedModule: form.linkedModule,
      tags: splitFinanceListText(form.tagsText),
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
      toast.error(t("common.toast.saveFailed"))
    }
  }

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

        <form onSubmit={handleSubmit} className="min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid gap-3 min-[720px]:grid-cols-2">
            <Field label={t("finance.edit.fields.date")}>
              <Input
                type="date"
                value={form.date}
                onChange={(event) => updateForm({ date: event.target.value })}
              />
            </Field>

            <Field label={t("finance.edit.fields.direction")}>
              <Select
                value={form.direction}
                onValueChange={(value) => {
                  if (value !== null) {
                    updateForm({ direction: value })
                  }
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
            </Field>

            <Field label={t("finance.edit.fields.label")}>
              <Input
                value={form.label}
                onChange={(event) => updateForm({ label: event.target.value })}
              />
            </Field>

            <Field label={t("finance.edit.fields.amount")}>
              <Input
                inputMode="decimal"
                min="0"
                step="0.01"
                type="number"
                value={form.amount}
                onChange={(event) => updateForm({ amount: event.target.value })}
              />
            </Field>

            <Field label={t("finance.edit.fields.category")}>
              <Select
                value={form.category}
                onValueChange={(value) => {
                  if (value !== null) {
                    updateForm({ category: value })
                  }
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
            </Field>

            <Field label={t("finance.edit.fields.account")}>
              <Input
                value={form.account}
                onChange={(event) => updateForm({ account: event.target.value })}
              />
            </Field>

            <Field label={t("finance.edit.fields.lifeSystem")}>
              <Select
                value={form.lifeSystem}
                onValueChange={(value) => {
                  if (value !== null) {
                    updateForm({ lifeSystem: value })
                  }
                }}
              >
                <SelectTrigger fullWidth>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FINANCE_LIFE_SYSTEMS.map((lifeSystem) => (
                    <SelectItem key={lifeSystem} value={lifeSystem}>
                      {translateFinanceEnum(t, "lifeSystem", lifeSystem)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label={t("finance.edit.fields.necessity")}>
              <Select
                value={form.necessity}
                onValueChange={(value) => {
                  if (value !== null) {
                    updateForm({ necessity: value })
                  }
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
            </Field>

            <Field label={t("finance.edit.fields.reviewStatus")}>
              <Select
                value={form.reviewStatus}
                onValueChange={(value) => {
                  if (value !== null) {
                    updateForm({ reviewStatus: value })
                  }
                }}
              >
                <SelectTrigger fullWidth>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FINANCE_REVIEW_STATUSES.map((reviewStatus) => (
                    <SelectItem key={reviewStatus} value={reviewStatus}>
                      {translateFinanceEnum(t, "reviewStatus", reviewStatus)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label={t("finance.edit.fields.linkedModule")}>
              <Select
                value={form.linkedModule}
                onValueChange={(value) => {
                  if (value !== null) {
                    updateForm({ linkedModule: value })
                  }
                }}
              >
                <SelectTrigger fullWidth>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FINANCE_LINKED_MODULES.map((linkedModule) => (
                    <SelectItem key={linkedModule} value={linkedModule}>
                      {translateFinanceEnum(t, "linkedModule", linkedModule)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field className="min-[720px]:col-span-2" label={t("finance.edit.fields.note")}>
              <Textarea
                value={form.note}
                onChange={(event) => updateForm({ note: event.target.value })}
                rows={3}
              />
            </Field>

            <Field className="min-[720px]:col-span-2" label={t("finance.edit.fields.tags")}>
              <Textarea
                value={form.tagsText}
                onChange={(event) => updateForm({ tagsText: event.target.value })}
                placeholder={t("finance.edit.tagsPlaceholder")}
                rows={3}
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
            <Button type="submit" disabled={saveFinanceMutation.isPending}>
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
