import { Trash2 } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

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
import type { ShoppingPageContentForm } from "@/features/bettertolive/api/bettertolive-api"
import {
  createPageContent,
  deletePageContent,
  updatePageContent,
} from "@/features/bettertolive/api/shopping-crud-api"
import type { ShoppingStageChecklist } from "@/features/bettertolive/types"
import { FormField } from "@/features/bettertolive/ui/shopping/shopping-page-shared"

type StageFormState = {
  isNew: boolean
  id?: string
  title: string
  stage: string
  description: string
  focus: string
  body: string
}

function buildForm(checklist: ShoppingStageChecklist | null): StageFormState {
  if (!checklist) {
    return {
      isNew: true,
      title: "",
      stage: "",
      description: "",
      focus: "",
      body: "[]",
    }
  }
  return {
    isNew: false,
    id: checklist.id,
    title: checklist.title,
    stage: checklist.stage,
    description: checklist.description,
    focus: checklist.focus,
    body: JSON.stringify(checklist.sections),
  }
}

export function ShoppingStageEditDialog({
  editing,
  onClose,
  onSaved,
}: {
  editing: { isNew: boolean; checklist: ShoppingStageChecklist | null } | null
  onClose: () => void
  onSaved: () => void
}) {
  if (!editing) return null

  const initialForm = buildForm(editing.checklist)
  const dialogKey = editing.checklist?.id ?? "new-stage"

  return (
    <Dialog
      open
      key={dialogKey}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <StageDialogContent initialForm={initialForm} onClose={onClose} onSaved={onSaved} />
    </Dialog>
  )
}

function StageDialogContent({
  initialForm,
  onClose,
  onSaved,
}: {
  initialForm: StageFormState
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState<StageFormState>(initialForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const update = (partial: Partial<StageFormState>) => {
    setForm((prev) => ({ ...prev, ...partial }))
  }

  async function handleSave() {
    try {
      setSaving(true)
      setError(null)

      const apiForm: ShoppingPageContentForm = {
        id: form.isNew ? undefined : form.id,
        contentType: "stage_checklist",
        title: form.title || null,
        stage: form.stage || null,
        system: null,
        summary: form.description || null,
        reason: form.focus || null,
        body: form.body,
      }

      if (form.isNew) {
        await createPageContent(apiForm)
      } else {
        await updatePageContent({ ...apiForm, id: form.id! })
      }

      onClose()
      onSaved()
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!form.id || form.isNew) return
    if (!window.confirm(t("shopping.stages.confirmDelete"))) return
    try {
      setError(null)
      await deletePageContent(form.id)
      onClose()
      onSaved()
    } catch (e) {
      setError(String(e))
    }
  }

  return (
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>
          {form.isNew
            ? t("shopping.stages.newTitle")
            : t("shopping.stages.editTitle", { title: form.title })}
        </DialogTitle>
        <DialogDescription>
          {form.isNew ? t("shopping.stages.newDescription") : t("shopping.stages.editDescription")}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          <FormField label={t("shopping.stages.form.title")} required>
            <Input
              value={form.title}
              onChange={(e) => update({ title: e.target.value })}
              placeholder={t("shopping.stages.form.titlePlaceholder")}
            />
          </FormField>

          <FormField label={t("shopping.stages.form.stage")} required>
            <Input
              value={form.stage}
              onChange={(e) => update({ stage: e.target.value })}
              placeholder={t("shopping.stages.form.stagePlaceholder")}
            />
          </FormField>

          <FormField label={t("shopping.stages.form.description")} className="md:col-span-2">
            <Input
              value={form.description}
              onChange={(e) => update({ description: e.target.value })}
              placeholder={t("shopping.stages.form.descriptionPlaceholder")}
            />
          </FormField>

          <FormField label={t("shopping.stages.form.focus")} className="md:col-span-2">
            <Input
              value={form.focus}
              onChange={(e) => update({ focus: e.target.value })}
              placeholder={t("shopping.stages.form.focusPlaceholder")}
            />
          </FormField>

          <FormField label={t("shopping.stages.form.sections")} className="md:col-span-2">
            <textarea
              value={form.body}
              onChange={(e) => update({ body: e.target.value })}
              placeholder={t("shopping.stages.form.sectionsPlaceholder")}
              rows={8}
              className="w-full rounded-md border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-3 py-2 font-mono text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:outline-none"
            />
          </FormField>
        </div>
      </div>

      <DialogFooter className="flex items-center justify-between">
        {!form.isNew ? (
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-red-500 hover:bg-red-50 hover:text-red-700"
            onClick={() => void handleDelete()}
          >
            <Trash2 />
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("shopping.stages.form.cancel")}
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving || !form.title || !form.stage}>
            {t("shopping.stages.form.save")}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  )
}
