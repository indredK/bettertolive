import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
/* eslint-disable react-hooks/incompatible-library */
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import type { ShoppingModuleData, ShoppingSpaceDefinition } from "@/features/bettertolive/types"
import {
  assignSpaceDefinitionItems,
  createSpaceDefinition,
  deleteSpaceDefinition,
  updateSpaceDefinition,
} from "@/features/bettertolive/api/shopping-crud-api"
import { confirmUndoableDelete } from "@/features/bettertolive/ui/shopping/_shared/shopping-delete"
import { ShoppingItemShuttle } from "@/features/bettertolive/ui/shopping/_shared/shopping-item-shuttle"
import {
  SHOPPING_DIALOG_CONTENT_CLASS,
  SHOPPING_DIALOG_FIELD_CLASS,
  SHOPPING_DIALOG_FOOTER_CLASS,
  SHOPPING_DIALOG_HEADER_CLASS,
  SHOPPING_DIALOG_SECTION_CLASS,
} from "@/features/bettertolive/ui/shopping/_shared/shopping-page-shared"
import { cn } from "@/lib/utils"

const spaceFormSchema = z.object({
  name: z.string().min(1),
  note: z.string(),
})

export function ShoppingSpaceEditDialog({
  editing,
  shopping,
  onClose,
  onSaved,
  onDeleted,
}: {
  editing: { isNew: boolean; space: ShoppingSpaceDefinition | null }
  shopping: ShoppingModuleData
  onClose: () => void
  onSaved: () => void
  onDeleted?: () => void
}) {
  const { t } = useTranslation()
  const [isPending, setIsPending] = useState(false)
  const form = useForm<z.infer<typeof spaceFormSchema>>({
    resolver: zodResolver(spaceFormSchema),
    defaultValues: {
      name: editing.space?.name ?? "",
      note: editing.space?.note ?? "",
    },
  })
  const name = form.watch("name")
  const note = form.watch("note")

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() =>
    editing.space
      ? shopping.items
          .filter((item) => item.spaceTags.includes(editing.space?.id ?? ""))
          .map((item) => item.id)
      : [],
  )

  const validSelectedItemIds = useMemo(() => {
    const itemIdSet = new Set(shopping.items.map((item) => item.id))
    return selectedItemIds.filter((itemId) => itemIdSet.has(itemId))
  }, [selectedItemIds, shopping.items])

  const handleSubmit = async () => {
    const values = form.getValues()
    if (!form.formState.isValid) {
      toast.error(t("shopping.error.nameRequired"))
      return
    }

    setIsPending(true)
    try {
      if (editing.isNew) {
        const space = await createSpaceDefinition({
          name: values.name.trim(),
          note: values.note.trim(),
        })
        await assignSpaceDefinitionItems(space.id, validSelectedItemIds)
      } else if (editing.space) {
        const space = await updateSpaceDefinition({
          id: editing.space.id,
          name: values.name.trim(),
          note: values.note.trim(),
        })
        await assignSpaceDefinitionItems(space.id, validSelectedItemIds)
      }
      onSaved()
    } catch (e) {
      toast.error(String(e))
    } finally {
      setIsPending(false)
    }
  }

  const handleDelete = () => {
    if (!editing.space) return

    const scheduled = confirmUndoableDelete({
      confirmMessage: t("common.confirm.deleteItem", {
        name: editing.space.name,
      }),
      pendingMessage: t("common.toast.deletePending", {
        name: editing.space.name,
        defaultValue: `已加入删除队列：${editing.space.name}，5 秒内可撤销`,
      }),
      successMessage: t("shopping.toast.deleteSuccessSpace", {
        name: editing.space.name,
        defaultValue: `已删除空间：${editing.space.name}`,
      }),
      failureMessage: t("shopping.toast.deleteFailedSpace"),
      undoLabel: t("common.actions.undo"),
      undoneMessage: t("common.toast.deleteUndone", {
        name: editing.space.name,
        defaultValue: `已撤销删除：${editing.space.name}`,
      }),
      onDelete: () => deleteSpaceDefinition(editing.space!.id),
      onDeleted,
    })

    if (scheduled) {
      onClose()
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && form.formState.isDirty) {
      const confirmed = window.confirm(t("common.confirm.unsavedChanges"))
      if (!confirmed) return
    }
    if (!open) onClose()
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[min(1180px,calc(100vw-3rem))]",
          SHOPPING_DIALOG_CONTENT_CLASS,
        )}
      >
        <DialogHeader className={SHOPPING_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew ? t("shopping.space.create") : t("shopping.space.edit")}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleSubmit()
          }}
        >
          <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
            <div
              className={cn(SHOPPING_DIALOG_SECTION_CLASS, "flex min-h-0 flex-col overflow-hidden")}
            >
              <div className="shrink-0 text-sm font-medium">
                {t("shopping.spaces.form.basicInfo")}
              </div>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                <div className="space-y-1.5">
                  <Label>{t("shopping.spaces.form.name")}</Label>
                  <Input
                    autoFocus
                    value={name}
                    onChange={(event) =>
                      form.setValue("name", event.target.value, { shouldValidate: true })
                    }
                    className={SHOPPING_DIALOG_FIELD_CLASS}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>{t("shopping.spaces.form.note")}</Label>
                  <Textarea
                    value={note}
                    onChange={(event) =>
                      form.setValue("note", event.target.value, { shouldValidate: true })
                    }
                    rows={4}
                    placeholder={t(
                      "shopping.spaces.form.notePlaceholder",
                      "描述这个空间的特点、用途等",
                    )}
                    className={cn(SHOPPING_DIALOG_FIELD_CLASS, "min-h-24 resize-none")}
                  />
                </div>
              </div>
            </div>

            <div
              className={cn(SHOPPING_DIALOG_SECTION_CLASS, "flex min-h-0 flex-col overflow-hidden")}
            >
              <div className="shrink-0 text-sm font-medium">
                {t("shopping.spaces.form.assignItems")}
              </div>
              <div className="mt-2 min-h-0 flex-1 overflow-hidden">
                <ShoppingItemShuttle
                  items={shopping.items}
                  attributeDefinitions={shopping.attributeDefinitions}
                  selectedIds={validSelectedItemIds}
                  onChange={setSelectedItemIds}
                  scope="space"
                />
              </div>
            </div>
          </div>
        </form>

        <DialogFooter className={SHOPPING_DIALOG_FOOTER_CLASS}>
          {!editing.isNew && (
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isPending}
              className="mr-auto"
            >
              {t("common.actions.delete")}
            </Button>
          )}
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            {t("common.actions.cancel")}
          </Button>
          <Button type="submit" disabled={!form.formState.isValid || isPending}>
            {isPending ? t("common.actions.saving") : t("common.actions.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
