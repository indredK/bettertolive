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
import type { ShoppingModuleData, ShoppingSystemDefinition } from "@/features/bettertolive/types"
import {
  assignSystemDefinitionItems,
  createSystemDefinition,
  deleteSystemDefinition,
  updateSystemDefinition,
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

const systemFormSchema = z.object({
  name: z.string().min(1),
  summary: z.string(),
  keyQuestion: z.string(),
  secondaryGroups: z.string(),
})

export function ShoppingSystemEditDialog({
  editing,
  shopping,
  onClose,
  onSaved,
  onDeleted,
}: {
  editing: { isNew: boolean; system: ShoppingSystemDefinition | null }
  shopping: ShoppingModuleData
  onClose: () => void
  onSaved: () => void
  onDeleted?: () => void
}) {
  const { t } = useTranslation()
  const [isPending, setIsPending] = useState(false)
  const form = useForm<z.infer<typeof systemFormSchema>>({
    resolver: zodResolver(systemFormSchema),
    defaultValues: {
      name: editing.system?.name ?? "",
      summary: editing.system?.summary ?? "",
      keyQuestion: editing.system?.keyQuestion ?? "",
      secondaryGroups: (editing.system?.secondaryGroups ?? []).join(", "),
    },
  })
  const name = form.watch("name")
  const summary = form.watch("summary")
  const keyQuestion = form.watch("keyQuestion")
  const secondaryGroups = form.watch("secondaryGroups")

  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() =>
    editing.system
      ? shopping.items
          .filter((item) => item.systemTags.includes(editing.system?.id ?? ""))
          .map((item) => item.id)
      : [],
  )

  const validSelectedItemIds = useMemo(() => {
    const itemIdSet = new Set(shopping.items.map((item) => item.id))
    return selectedItemIds.filter((itemId) => itemIdSet.has(itemId))
  }, [selectedItemIds, shopping.items])

  // 新建时从名称 slug 生成 ID，编辑时沿用原有 ID
  const systemId = editing.isNew ? slugifySystemId(name) : (editing.system?.id ?? "")

  const handleSubmit = async () => {
    const values = form.getValues()
    if (!form.formState.isValid) {
      toast.error(t("shopping.error.nameRequired"))
      return
    }

    if (!editing.isNew && !systemId) {
      toast.error(t("shopping.error.idNameRequired"))
      return
    }

    const groups = values.secondaryGroups
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean)

    setIsPending(true)
    try {
      const payload = {
        id: systemId,
        name: values.name.trim(),
        summary: values.summary.trim(),
        keyQuestion: values.keyQuestion.trim(),
        secondaryGroups: groups,
      }

      if (editing.isNew) {
        await createSystemDefinition(payload)
      } else {
        await updateSystemDefinition(payload)
      }

      await assignSystemDefinitionItems(systemId, validSelectedItemIds)
      onSaved()
    } catch (e) {
      toast.error(String(e))
    } finally {
      setIsPending(false)
    }
  }

  const handleDelete = () => {
    if (!editing.system) return

    const displayName = editing.system.name || editing.system.id
    const scheduled = confirmUndoableDelete({
      confirmMessage: t("shopping.confirm.deleteSystem", {
        name: displayName,
        defaultValue: `确定删除 ${displayName} 吗？`,
      }),
      pendingMessage: t("shopping.toast.deletePendingSystem", {
        name: displayName,
        defaultValue: `已加入删除队列：${displayName}，5 秒内可撤销`,
      }),
      successMessage: t("shopping.toast.deleteSuccessSystem", {
        name: displayName,
        defaultValue: `已删除系统：${displayName}`,
      }),
      failureMessage: t("shopping.toast.deleteFailedSystem"),
      undoLabel: t("shopping.undo"),
      undoneMessage: t("shopping.toast.deleteUndoneSystem", {
        name: displayName,
        defaultValue: `已撤销删除：${displayName}`,
      }),
      onDelete: () => deleteSystemDefinition(editing.system!.id),
      onDeleted,
    })

    if (scheduled) {
      onClose()
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open && form.formState.isDirty) {
      const confirmed = window.confirm(
        t("shopping.confirm.unsavedChanges", {
          defaultValue: "当前有未保存的修改，确定要关闭吗？",
        }),
      )
      if (!confirmed) return
    }
    if (!open) onClose()
  }

  return (
    <Dialog open onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[min(1240px,calc(100vw-3rem))]",
          SHOPPING_DIALOG_CONTENT_CLASS,
        )}
      >
        <DialogHeader className={SHOPPING_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew ? t("shopping.system.create") : t("shopping.system.edit")}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleSubmit()
          }}
        >
          <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <div
              className={cn(SHOPPING_DIALOG_SECTION_CLASS, "flex min-h-0 flex-col overflow-hidden")}
            >
              <div className="shrink-0 text-sm font-medium">
                {t("shopping.systems.form.basicInfo")}
              </div>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                <div className="space-y-1.5">
                  <Label>{t("shopping.systems.form.name")}</Label>
                  <Input
                    autoFocus
                    value={name}
                    onChange={(event) =>
                      form.setValue("name", event.target.value, { shouldValidate: true })
                    }
                    className={SHOPPING_DIALOG_FIELD_CLASS}
                  />
                  {editing.isNew && name.trim() && (
                    <div className="text-muted-foreground text-[11px]">
                      {t("shopping.systems.form.autoId")}{" "}
                      <code className="bg-muted rounded px-1">{slugifySystemId(name)}</code>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label>{t("shopping.systems.form.summary")}</Label>
                  <Textarea
                    value={summary}
                    onChange={(event) =>
                      form.setValue("summary", event.target.value, { shouldValidate: true })
                    }
                    rows={5}
                    className={cn(SHOPPING_DIALOG_FIELD_CLASS, "min-h-28 resize-none")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>{t("shopping.systems.form.keyQuestion")}</Label>
                  <Textarea
                    value={keyQuestion}
                    onChange={(event) =>
                      form.setValue("keyQuestion", event.target.value, { shouldValidate: true })
                    }
                    rows={4}
                    className={cn(SHOPPING_DIALOG_FIELD_CLASS, "min-h-24 resize-none")}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>{t("shopping.systems.form.secondaryGroups")}</Label>
                  <Textarea
                    value={secondaryGroups}
                    onChange={(event) =>
                      form.setValue("secondaryGroups", event.target.value, {
                        shouldValidate: true,
                      })
                    }
                    rows={4}
                    placeholder={t(
                      "shopping.systems.form.secondaryGroupsPlaceholder",
                      "日常打扫, 洗衣, ...",
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
                {t("shopping.systems.form.assignItems")}
              </div>
              <div className="mt-3 min-h-0 flex-1 overflow-hidden">
                <ShoppingItemShuttle
                  items={shopping.items}
                  attributeDefinitions={shopping.attributeDefinitions}
                  selectedIds={validSelectedItemIds}
                  onChange={setSelectedItemIds}
                  scope="system"
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

/** 将中文名称转为拼音首字母形式的英文标识符，作为系统 ID。 */
function slugifySystemId(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return ""
  // 简单规则：取前几个字符做英文标识符，如果包含英文则用英文部分
  const english = trimmed.replace(/[^a-zA-Z0-9]/g, "")
  if (english.length >= 2) {
    return english.charAt(0).toUpperCase() + english.slice(1)
  }
  // 纯中文：用 hashCode 生成稳定短 ID
  let hash = 0
  for (let i = 0; i < trimmed.length; i++) {
    hash = (hash * 31 + trimmed.charCodeAt(i)) & 0xfffffff
  }
  return "System_" + hash.toString(36).toUpperCase()
}
