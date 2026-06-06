import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
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
import { confirmUndoableDelete } from "@/features/bettertolive/ui/shopping/shopping-delete"
import { ShoppingItemShuttle } from "@/features/bettertolive/ui/shopping/shopping-item-shuttle"
import {
  SHOPPING_DIALOG_CONTENT_CLASS,
  SHOPPING_DIALOG_FIELD_CLASS,
  SHOPPING_DIALOG_FOOTER_CLASS,
  SHOPPING_DIALOG_HEADER_CLASS,
  SHOPPING_DIALOG_SECTION_CLASS,
} from "@/features/bettertolive/ui/shopping/shopping-page-shared"
import { cn } from "@/lib/utils"

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
  const [name, setName] = useState(editing.space?.name ?? "")
  const [note, setNote] = useState(editing.space?.note ?? "")
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
    const normalizedName = name.trim()
    if (!normalizedName) {
      toast.error(t("shopping.error.nameRequired", "请填写名称"))
      return
    }

    try {
      if (editing.isNew) {
        const space = await createSpaceDefinition({ name: normalizedName, note: note.trim() })
        await assignSpaceDefinitionItems(space.id, validSelectedItemIds)
      } else if (editing.space) {
        const space = await updateSpaceDefinition({
          id: editing.space.id,
          name: normalizedName,
          note: note.trim(),
        })
        await assignSpaceDefinitionItems(space.id, validSelectedItemIds)
      }
      onSaved()
    } catch (e) {
      toast.error(String(e))
    }
  }

  const handleDelete = () => {
    if (!editing.space) return

    const scheduled = confirmUndoableDelete({
      confirmMessage: t("shopping.confirm.deleteSpace", `确定删除 ${editing.space.name} 吗？`),
      pendingMessage: t("shopping.toast.deletePendingSpace", {
        name: editing.space.name,
        defaultValue: `已加入删除队列：${editing.space.name}，5 秒内可撤销`,
      }),
      successMessage: t("shopping.toast.deleteSuccessSpace", {
        name: editing.space.name,
        defaultValue: `已删除空间：${editing.space.name}`,
      }),
      failureMessage: t("shopping.toast.deleteFailedSpace", "删除空间失败"),
      undoLabel: t("shopping.undo", "撤销"),
      undoneMessage: t("shopping.toast.deleteUndoneSpace", {
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

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[min(1180px,calc(100vw-3rem))]",
          SHOPPING_DIALOG_CONTENT_CLASS,
        )}
      >
        <DialogHeader className={SHOPPING_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew
              ? t("shopping.space.create", "新增空间")
              : t("shopping.space.edit", "编辑空间")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
          <div
            className={cn(SHOPPING_DIALOG_SECTION_CLASS, "flex min-h-0 flex-col overflow-hidden")}
          >
            <div className="shrink-0 text-sm font-medium">
              {t("shopping.spaces.form.basicInfo", "基本信息")}
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <Label>{t("shopping.spaces.form.name", "名称")}</Label>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={SHOPPING_DIALOG_FIELD_CLASS}
                />
              </div>
              <div className="space-y-1.5">
                <Label>{t("shopping.spaces.form.note", "备注")}</Label>
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
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
              {t("shopping.spaces.form.assignItems", "本空间下的物品")}
            </div>
            <div className="mt-2 min-h-0 flex-1 overflow-hidden">
              <ShoppingItemShuttle
                items={shopping.items}
                selectedIds={validSelectedItemIds}
                onChange={setSelectedItemIds}
                scope="space"
              />
            </div>
          </div>
        </div>

        <DialogFooter className={SHOPPING_DIALOG_FOOTER_CLASS}>
          {!editing.isNew && (
            <Button variant="outline" onClick={handleDelete} className="mr-auto">
              {t("shopping.delete", "删除")}
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            {t("shopping.cancel", "取消")}
          </Button>
          <Button onClick={handleSubmit}>{t("shopping.save", "保存")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
