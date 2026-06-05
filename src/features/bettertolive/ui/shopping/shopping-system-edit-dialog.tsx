import { Trash2 } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  createSystemDefinition,
  deleteSystemDefinition,
  updateSystemDefinition,
} from "@/features/bettertolive/api/shopping-crud-api"
import { FormField } from "@/features/bettertolive/ui/shopping/shopping-page-shared"
import type { ShoppingSystemOverview } from "@/features/bettertolive/ui/shopping/shopping-types"
import type { ShoppingSystem } from "@/features/bettertolive/types"
import { ShoppingSystemCluster } from "@/features/bettertolive/types"
import {
  clusterDisplayName,
  SHOPPING_SYSTEM_CLUSTER_OPTIONS,
  SHOPPING_SYSTEM_OPTIONS,
  systemDisplayName,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"

type EditingState = {
  isNew: boolean
  system: ShoppingSystemOverview | null
}

type FormState = {
  isNew: boolean
  id: ShoppingSystem
  cluster: ShoppingSystemCluster
  summary: string
  keyQuestion: string
  secondaryGroupsText: string
}

const SYSTEM_LIMITS = {
  summary: 180,
  keyQuestion: 180,
  group: 32,
  groups: 8,
} as const

function parseGroups(value: string): string[] {
  return value
    .split(/[，,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function buildForm(editing: EditingState, availableSystemIds: ShoppingSystem[]): FormState | null {
  if (!editing.isNew && editing.system) {
    return {
      isNew: false,
      id: editing.system.id,
      cluster: editing.system.cluster,
      summary: editing.system.summary,
      keyQuestion: editing.system.keyQuestion,
      secondaryGroupsText: editing.system.secondaryGroups.join(", "),
    }
  }

  const nextId = availableSystemIds[0]
  if (!nextId) return null

  return {
    isNew: true,
    id: nextId,
    cluster: ShoppingSystemCluster.BasicSystems,
    summary: "",
    keyQuestion: "",
    secondaryGroupsText: "",
  }
}

const schema = z.object({
  id: z
    .string()
    .refine((value): value is ShoppingSystem =>
      SHOPPING_SYSTEM_OPTIONS.includes(value as ShoppingSystem),
    ),
  cluster: z
    .string()
    .refine((value): value is ShoppingSystemCluster =>
      SHOPPING_SYSTEM_CLUSTER_OPTIONS.includes(value as ShoppingSystemCluster),
    ),
  summary: z.string().trim().min(1).max(SYSTEM_LIMITS.summary),
  keyQuestion: z.string().trim().min(1).max(SYSTEM_LIMITS.keyQuestion),
  secondaryGroupsText: z.string(),
})

export function ShoppingSystemEditDialog({
  editing,
  availableSystemIds,
  onClose,
  onSaved,
}: {
  editing: EditingState | null
  availableSystemIds: ShoppingSystem[]
  onClose: () => void
  onSaved: () => void
}) {
  if (!editing) return null

  if (editing.isNew && availableSystemIds.length === 0) {
    return (
      <Dialog
        open
        onOpenChange={(open) => {
          if (!open) onClose()
        }}
      >
        <SystemUnavailableDialog onClose={onClose} />
      </Dialog>
    )
  }

  const initialForm = buildForm(editing, availableSystemIds)
  if (!initialForm) return null

  const dialogKey = editing.isNew
    ? `new-system-${availableSystemIds.join(",")}`
    : editing.system?.id

  return (
    <Dialog
      open
      key={dialogKey}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <SystemDialogContent
        initialForm={initialForm}
        systemOptions={editing.isNew ? availableSystemIds : [initialForm.id]}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Dialog>
  )
}

function SystemUnavailableDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>{t("shopping.systems.newTitle")}</DialogTitle>
        <DialogDescription>{t("shopping.systems.form.noAvailable")}</DialogDescription>
      </DialogHeader>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          {t("shopping.systems.form.cancel")}
        </Button>
      </DialogFooter>
    </DialogContent>
  )
}

function SystemDialogContent({
  initialForm,
  systemOptions,
  onClose,
  onSaved,
}: {
  initialForm: FormState
  systemOptions: ShoppingSystem[]
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(initialForm)

  const update = (partial: Partial<FormState>) => {
    setForm((prev) => ({ ...prev, ...partial }))
  }

  async function handleSave() {
    try {
      setSaving(true)
      setError(null)

      const parsed = schema.safeParse(form)
      if (!parsed.success) {
        setError(t("shopping.validation.invalidForm"))
        return
      }

      const groups = parseGroups(parsed.data.secondaryGroupsText)
      if (groups.length > SYSTEM_LIMITS.groups) {
        setError(
          t("shopping.validation.maxItems", {
            field: t("shopping.systems.form.secondaryGroups"),
            count: SYSTEM_LIMITS.groups,
          }),
        )
        return
      }
      if (groups.some((group) => group.length > SYSTEM_LIMITS.group)) {
        setError(
          t("shopping.validation.maxLength", {
            field: t("shopping.systems.form.secondaryGroups"),
            count: SYSTEM_LIMITS.group,
          }),
        )
        return
      }

      const payload = {
        id: parsed.data.id,
        cluster: parsed.data.cluster,
        summary: parsed.data.summary.trim(),
        keyQuestion: parsed.data.keyQuestion.trim(),
        secondaryGroups: groups,
      }

      if (form.isNew) {
        await createSystemDefinition(payload)
      } else {
        await updateSystemDefinition(payload)
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
    if (form.isNew) return
    if (!window.confirm(t("shopping.systems.confirmDelete"))) return

    try {
      setSaving(true)
      setError(null)
      await deleteSystemDefinition(form.id)
      onClose()
      onSaved()
    } catch (e) {
      setError(String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <DialogContent className="flex max-h-[min(90vh,760px)] flex-col sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {form.isNew
            ? t("shopping.systems.newTitle")
            : t("shopping.systems.editTitle", { title: systemDisplayName(form.id, t) })}
        </DialogTitle>
        <DialogDescription>
          {form.isNew
            ? t("shopping.systems.newDescription")
            : t("shopping.systems.editDescription")}
        </DialogDescription>
      </DialogHeader>

      <div className="min-h-0 overflow-y-auto pr-1">
        <div className="space-y-4">
          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800">
              {error}
            </div>
          ) : null}

          <div className="grid items-start gap-4 md:grid-cols-2">
            <FormField label={t("shopping.systems.form.system")} required>
              <Select
                value={form.id}
                onValueChange={(value) => update({ id: value as ShoppingSystem })}
                disabled={!form.isNew}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{systemDisplayName(form.id, t)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {systemOptions.map((systemId) => (
                    <SelectItem key={systemId} value={systemId}>
                      {systemDisplayName(systemId, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label={t("shopping.systems.form.cluster")} required>
              <Select
                value={form.cluster}
                onValueChange={(value) => update({ cluster: value as ShoppingSystemCluster })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue>{clusterDisplayName(form.cluster, t)}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {SHOPPING_SYSTEM_CLUSTER_OPTIONS.map((cluster) => (
                    <SelectItem key={cluster} value={cluster}>
                      {clusterDisplayName(cluster, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
          </div>

          <FormField label={t("shopping.systems.form.summary")} required>
            <Textarea
              value={form.summary}
              onChange={(event) => update({ summary: event.target.value })}
              maxLength={SYSTEM_LIMITS.summary}
              rows={3}
            />
          </FormField>

          <FormField label={t("shopping.systems.form.keyQuestion")} required>
            <Textarea
              value={form.keyQuestion}
              onChange={(event) => update({ keyQuestion: event.target.value })}
              maxLength={SYSTEM_LIMITS.keyQuestion}
              rows={3}
            />
          </FormField>

          <FormField
            label={t("shopping.systems.form.secondaryGroups")}
            description={t("shopping.systems.form.secondaryGroupsHelp")}
          >
            <Textarea
              value={form.secondaryGroupsText}
              onChange={(event) => update({ secondaryGroupsText: event.target.value })}
              maxLength={SYSTEM_LIMITS.group * SYSTEM_LIMITS.groups + SYSTEM_LIMITS.groups * 2}
              rows={3}
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
            disabled={saving}
          >
            <Trash2 />
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            {t("shopping.systems.form.cancel")}
          </Button>
          <Button onClick={() => void handleSave()} disabled={saving}>
            {t("shopping.systems.form.save")}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  )
}
