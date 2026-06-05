import { useState } from "react"
import { useTranslation } from "react-i18next"
import { z } from "zod"

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
  createSpaceDefinition,
  updateOwnedItem,
  updatePlanItem,
  updateSpaceDefinition,
} from "@/features/bettertolive/api/shopping-crud-api"
import { FormField } from "@/features/bettertolive/ui/shopping/shopping-page-shared"
import type { SpaceOverview } from "@/features/bettertolive/ui/shopping/shopping-types"

type EditingState = {
  isNew: boolean
  space: SpaceOverview | null
}

type FormState = {
  isNew: boolean
  id?: string
  originalName?: string
  name: string
  owned: SpaceOverview["owned"]
  planned: SpaceOverview["planned"]
}

const SPACE_LIMITS = {
  name: 40,
} as const

const schema = z.object({
  name: z.string().trim().min(1).max(SPACE_LIMITS.name),
})

function renameSpaceValue(spaces: string[], oldName: string, newName: string) {
  return Array.from(new Set(spaces.map((space) => (space === oldName ? newName : space))))
}

function buildForm(editing: EditingState): FormState {
  if (editing.isNew || !editing.space) {
    return {
      isNew: true,
      name: "",
      owned: [],
      planned: [],
    }
  }

  return {
    isNew: false,
    id: editing.space.definitionId ?? undefined,
    originalName: editing.space.name,
    name: editing.space.name,
    owned: editing.space.owned,
    planned: editing.space.planned,
  }
}

export function ShoppingSpaceEditDialog({
  editing,
  existingSpaceNames,
  onClose,
  onSaved,
}: {
  editing: EditingState | null
  existingSpaceNames: string[]
  onClose: () => void
  onSaved: () => void
}) {
  if (!editing) return null

  const initialForm = buildForm(editing)
  const dialogKey = editing.isNew
    ? "new-space"
    : (editing.space?.definitionId ?? editing.space?.name)

  return (
    <Dialog
      open
      key={dialogKey}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SpaceDialogContent
        initialForm={initialForm}
        existingSpaceNames={existingSpaceNames}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Dialog>
  )
}

function SpaceDialogContent({
  initialForm,
  existingSpaceNames,
  onClose,
  onSaved,
}: {
  initialForm: FormState
  existingSpaceNames: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)

  async function handleSave() {
    try {
      setSaving(true)
      setError(null)

      const parsed = schema.safeParse({ name: form.name })
      if (!parsed.success) {
        setError(t("shopping.validation.invalidForm"))
        return
      }

      const nextName = parsed.data.name.trim()
      const normalizedCurrentName = form.originalName?.trim().toLocaleLowerCase()
      const hasDuplicate = existingSpaceNames.some((name) => {
        const normalizedName = name.trim().toLocaleLowerCase()
        return (
          normalizedName === nextName.toLocaleLowerCase() &&
          normalizedName !== normalizedCurrentName
        )
      })

      if (hasDuplicate) {
        setError(t("shopping.validation.duplicateName"))
        return
      }

      if (form.isNew) {
        await createSpaceDefinition({ name: nextName })
        onClose()
        onSaved()
        return
      }

      if (!form.originalName) {
        setError(t("shopping.validation.invalidForm"))
        return
      }

      if (form.id) {
        await updateSpaceDefinition({ id: form.id, name: nextName })
      } else {
        await createSpaceDefinition({ name: nextName })
      }

      if (nextName !== form.originalName) {
        await Promise.all([
          ...form.owned.map((item) =>
            updateOwnedItem({
              ...item,
              depreciation: item.depreciation ?? null,
              spaces: renameSpaceValue(item.spaces, form.originalName!, nextName),
            }),
          ),
          ...form.planned.map((item) =>
            updatePlanItem({
              ...item,
              laneId: item.laneId,
              depreciation: item.depreciation ?? null,
              currentPrice: item.currentPrice ?? null,
              buyBelowPrice: item.buyBelowPrice ?? null,
              overpayPrice: item.overpayPrice ?? null,
              spaces: renameSpaceValue(item.spaces, form.originalName!, nextName),
            }),
          ),
        ])
      }

      onClose()
      onSaved()
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>
          {form.isNew
            ? t("shopping.spaces.newTitle")
            : t("shopping.spaces.editTitle", { title: form.originalName ?? form.name })}
        </DialogTitle>
        <DialogDescription>
          {form.isNew ? t("shopping.spaces.newDescription") : t("shopping.spaces.editDescription")}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        <FormField label={t("shopping.spaces.form.name")} required>
          <Input
            value={form.name}
            onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
            maxLength={SPACE_LIMITS.name}
          />
        </FormField>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          {t("shopping.spaces.form.cancel")}
        </Button>
        <Button onClick={() => void handleSave()} disabled={saving}>
          {t("shopping.spaces.form.save")}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}
