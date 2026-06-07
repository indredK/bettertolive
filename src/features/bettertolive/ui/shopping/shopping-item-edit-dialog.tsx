import { Plus, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

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
import type {
  ShoppingItem,
  ShoppingItemChild,
  ShoppingItemChildChannelPrice,
  ShoppingModuleData,
  ShoppingDepreciation,
} from "@/features/bettertolive/types"
import { ShoppingLifecycle, ShoppingStatus } from "@/features/bettertolive/types"
import type { ShoppingItemForm } from "@/features/bettertolive/api/bettertolive-api"
import { createItem, deleteItem, updateItem } from "@/features/bettertolive/api/shopping-crud-api"
import { confirmUndoableDelete } from "@/features/bettertolive/ui/shopping/shopping-delete"
import {
  SHOPPING_DEPRECIATION_OPTIONS,
  SHOPPING_LIFECYCLE_OPTIONS,
  SHOPPING_STATUS_OPTIONS,
  depreciationDisplayName,
  lifecycleDisplayName,
  statusDisplayName,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"
import {
  SHOPPING_DIALOG_CONTENT_CLASS,
  SHOPPING_DIALOG_FIELD_CLASS,
  SHOPPING_DIALOG_FOOTER_CLASS,
  SHOPPING_DIALOG_HEADER_CLASS,
  SHOPPING_DIALOG_PANEL_CLASS,
  SHOPPING_DIALOG_SECTION_CLASS,
} from "@/features/bettertolive/ui/shopping/shopping-page-shared"
import { cn } from "@/lib/utils"

export type EditingItem = { isNew: boolean; item: ShoppingItem | null }

const NONE_SELECT_VALUE = "__none__"

export function ShoppingItemEditDialog({
  editing,
  shopping,
  onClose,
  onSaved,
  onDeleted,
}: {
  editing: EditingItem
  shopping: ShoppingModuleData
  onClose: () => void
  onSaved: () => void
  onDeleted?: () => void
}) {
  const { t } = useTranslation()
  const seed = editing.item
  const defaultChildChannels = useMemo(
    () => [
      t("shopping.item.defaultChannels.jd", "京东"),
      t("shopping.item.defaultChannels.taobao", "淘宝"),
      t("shopping.item.defaultChannels.pinduoduo", "拼多多"),
      t("shopping.item.defaultChannels.douyin", "抖音"),
    ],
    [t],
  )

  const [name, setName] = useState(seed?.name ?? "")
  const [children, setChildren] = useState<ShoppingItemChild[]>(() =>
    (seed?.children ?? []).map((child, index) =>
      normalizeChildDraft(child, {
        status: ShoppingStatus.Owned,
        lifecycle: ShoppingLifecycle.Durable,
        index,
      }),
    ),
  )
  const [systemTags, setSystemTags] = useState<string[]>(seed?.systemTags ?? [])
  const [spaceTags, setSpaceTags] = useState<string[]>(seed?.spaceTags ?? [])
  const [note, setNote] = useState(seed?.note ?? "")

  const toggleTag = (list: string[], setter: (value: string[]) => void, id: string) => {
    if (list.includes(id)) {
      setter(list.filter((entry) => entry !== id))
    } else {
      setter([...list, id])
    }
  }

  const updateChild = (
    childIndex: number,
    updater: (child: ShoppingItemChild) => ShoppingItemChild,
  ) => {
    setChildren((current) =>
      current.map((child, index) => (index === childIndex ? updater(child) : child)),
    )
  }

  const addChild = () => {
    setChildren((current) => [
      ...current,
      createDefaultChildDraft({
        index: current.length,
        defaultChannels: defaultChildChannels,
      }),
    ])
  }

  const removeChild = (childIndex: number) => {
    setChildren((current) => current.filter((_, index) => index !== childIndex))
  }

  const addChannelToChild = (childIndex: number) => {
    updateChild(childIndex, (child) => {
      const channelPrices = child.channelPrices ?? []
      return {
        ...child,
        channelPrices: [...channelPrices, createChannelPriceDraft("", channelPrices.length)],
      }
    })
  }

  const removeChannelFromChild = (childIndex: number, channelIndex: number) => {
    updateChild(childIndex, (child) => ({
      ...child,
      channelPrices: (child.channelPrices ?? []).filter((_, index) => index !== channelIndex),
    }))
  }

  const canSubmit = useMemo(
    () => name.trim().length > 0 && systemTags.length >= 1 && spaceTags.length >= 1,
    [name, spaceTags.length, systemTags.length],
  )

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error(t("shopping.error.itemRequired", "请填写名称,并至少各选一个系统和空间"))
      return
    }

    const form: ShoppingItemForm = {
      id: seed?.id,
      name: name.trim(),
      children: children
        .map((child) => ({
          ...child,
          name: child.name.trim(),
          channelPrices: (child.channelPrices ?? [])
            .map((channelPrice) => ({
              ...channelPrice,
              channel: channelPrice.channel.trim(),
            }))
            .filter((channelPrice) => channelPrice.channel.length > 0),
        }))
        .filter((child) => child.name.length > 0),
      systemTags,
      spaceTags,
      note: note.trim(),
    }

    try {
      if (editing.isNew) {
        await createItem(form)
      } else {
        await updateItem(form)
      }
      onSaved()
    } catch (error) {
      toast.error(String(error))
    }
  }

  const handleDelete = () => {
    if (!seed) return

    const scheduled = confirmUndoableDelete({
      confirmMessage: t("shopping.confirm.deleteItem", {
        name: seed.name,
        defaultValue: `确定删除 ${seed.name} 吗？`,
      }),
      pendingMessage: t("shopping.toast.deletePendingItem", {
        name: seed.name,
        defaultValue: `已加入删除队列：${seed.name}，5 秒内可撤销`,
      }),
      successMessage: t("shopping.toast.deleteSuccessItem", {
        name: seed.name,
        defaultValue: `已删除物件：${seed.name}`,
      }),
      failureMessage: t("shopping.toast.deleteFailedItem", "删除物件失败"),
      undoLabel: t("shopping.undo", "撤销"),
      undoneMessage: t("shopping.toast.deleteUndoneItem", {
        name: seed.name,
        defaultValue: `已撤销删除：${seed.name}`,
      }),
      onDelete: () => deleteItem(seed.id),
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
          "flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[min(1320px,calc(100vw-3rem))]",
          SHOPPING_DIALOG_CONTENT_CLASS,
        )}
      >
        <DialogHeader className={SHOPPING_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew
              ? t("shopping.item.create", "新增物品")
              : t("shopping.item.edit", "编辑物品")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <div
            className={cn(SHOPPING_DIALOG_SECTION_CLASS, "flex min-h-0 flex-col overflow-hidden")}
          >
            <div className="shrink-0 text-sm font-medium">
              {t("shopping.item.basicAttributes", "基础属性")}
            </div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              <div className="space-y-1.5">
                <Label>{t("shopping.item.name", "名称")} *</Label>
                <Input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={SHOPPING_DIALOG_FIELD_CLASS}
                />
              </div>

              <div className="grid gap-4">
                <TagSelectorPanel
                  label={t("shopping.item.systemTags", "系统标签(至少 1 个)")}
                  options={shopping.systemDefinitions.map((system) => ({
                    id: system.id,
                    label: system.name || system.id,
                  }))}
                  selectedIds={systemTags}
                  onToggle={(id) => toggleTag(systemTags, setSystemTags, id)}
                />
                <TagSelectorPanel
                  label={t("shopping.item.spaceTags", "空间标签(至少 1 个)")}
                  options={shopping.spaceDefinitions.map((space) => ({
                    id: space.id,
                    label: space.name,
                  }))}
                  selectedIds={spaceTags}
                  onToggle={(id) => toggleTag(spaceTags, setSpaceTags, id)}
                />
              </div>

              <div className="space-y-1.5">
                <Label>{t("shopping.item.note", "备注")}</Label>
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={7}
                  className={cn(SHOPPING_DIALOG_FIELD_CLASS, "min-h-32 resize-none")}
                />
              </div>
            </div>
          </div>

          <div
            className={cn(SHOPPING_DIALOG_SECTION_CLASS, "flex min-h-0 flex-col overflow-hidden")}
          >
            <div className="shrink-0">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium">
                  {t("shopping.item.childSettings", "子级设置")}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={addChild}>
                  <Plus className="mr-1 h-4 w-4" />
                  {t("shopping.item.addChild", "添加子级")}
                </Button>
              </div>
            </div>
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {children.length === 0 ? (
                <div className="border-foreground/15 bg-muted/15 text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-xs">
                  {t("shopping.item.noChildren", "暂未添加子级")}
                </div>
              ) : (
                children.map((child, index) => (
                  <ChildEditorCard
                    key={child.id}
                    child={child}
                    childIndex={index}
                    onRemove={() => removeChild(index)}
                    onChange={(updater) => updateChild(index, updater)}
                    onAddChannel={() => addChannelToChild(index)}
                    onRemoveChannel={(channelIndex) => removeChannelFromChild(index, channelIndex)}
                  />
                ))
              )}
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
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {t("shopping.save", "保存")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function TagSelectorPanel({
  label,
  options,
  selectedIds,
  onToggle,
}: {
  label: string
  options: Array<{ id: string; label: string }>
  selectedIds: string[]
  onToggle: (id: string) => void
}) {
  return (
    <div className={cn(SHOPPING_DIALOG_PANEL_CLASS, "space-y-3 p-4")}>
      <div className="text-sm font-medium">{label}</div>
      <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2">
        {options.map((option) => (
          <label key={option.id} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={selectedIds.includes(option.id)}
              onCheckedChange={() => onToggle(option.id)}
            />
            <span className="min-w-0 truncate">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

function ChildEditorCard({
  child,
  childIndex,
  onRemove,
  onChange,
  onAddChannel,
  onRemoveChannel,
}: {
  child: ShoppingItemChild
  childIndex: number
  onRemove: () => void
  onChange: (updater: (child: ShoppingItemChild) => ShoppingItemChild) => void
  onAddChannel: () => void
  onRemoveChannel: (channelIndex: number) => void
}) {
  const { t } = useTranslation()

  return (
    <div className={cn(SHOPPING_DIALOG_PANEL_CLASS, "space-y-4 p-4")}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">
          {t("shopping.item.childLabel", { defaultValue: "子级 {{index}}", index: childIndex + 1 })}
        </div>
        <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label>{t("shopping.item.childName", "子级名称")}</Label>
        <Input
          value={child.name}
          onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
          placeholder={t("shopping.item.childName", "子级名称")}
          className={SHOPPING_DIALOG_FIELD_CLASS}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label>{t("shopping.item.status", "状态")}</Label>
          <Select
            value={child.status ?? ShoppingStatus.Owned}
            onValueChange={(value) =>
              onChange((current) => ({ ...current, status: value as ShoppingStatus }))
            }
          >
            <SelectTrigger className={SHOPPING_DIALOG_FIELD_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHOPPING_STATUS_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {statusDisplayName(option, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>{t("shopping.item.lifecycle", "生命周期")}</Label>
          <Select
            value={child.lifecycle ?? ShoppingLifecycle.Durable}
            onValueChange={(value) =>
              onChange((current) => ({ ...current, lifecycle: value as ShoppingLifecycle }))
            }
          >
            <SelectTrigger className={SHOPPING_DIALOG_FIELD_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHOPPING_LIFECYCLE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {lifecycleDisplayName(option, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>{t("shopping.item.depreciation", "折旧")}</Label>
          <Select
            value={child.depreciation ?? NONE_SELECT_VALUE}
            onValueChange={(value) =>
              onChange((current) => ({
                ...current,
                depreciation:
                  value === NONE_SELECT_VALUE ? undefined : (value as ShoppingDepreciation),
              }))
            }
          >
            <SelectTrigger className={SHOPPING_DIALOG_FIELD_CLASS}>
              <SelectValue placeholder={t("shopping.item.depPlaceholder", "可选")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_SELECT_VALUE}>
                {t("shopping.item.depPlaceholder", "可选")}
              </SelectItem>
              {SHOPPING_DEPRECIATION_OPTIONS.map((option) => (
                <SelectItem key={option} value={option}>
                  {depreciationDisplayName(option, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">
            {t("shopping.item.childChannels", "渠道价格参考")}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={onAddChannel}>
            <Plus className="mr-1 h-4 w-4" />
            {t("shopping.item.addChannel", "添加渠道")}
          </Button>
        </div>

        {(child.channelPrices ?? []).length === 0 ? (
          <div className="border-foreground/15 bg-muted/15 text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-xs">
            {t("shopping.item.noChildChannels", "暂未添加渠道价格")}
          </div>
        ) : (
          <div className="space-y-2">
            {(child.channelPrices ?? []).map((channelPrice, channelIndex) => (
              <ChildChannelEditorRow
                key={channelPrice.id}
                channelPrice={channelPrice}
                onChange={(updater) =>
                  onChange((current) => ({
                    ...current,
                    channelPrices: (current.channelPrices ?? []).map((entry, index) =>
                      index === channelIndex ? updater(entry) : entry,
                    ),
                  }))
                }
                onRemove={() => onRemoveChannel(channelIndex)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ChildChannelEditorRow({
  channelPrice,
  onChange,
  onRemove,
}: {
  channelPrice: ShoppingItemChildChannelPrice
  onChange: (
    updater: (channelPrice: ShoppingItemChildChannelPrice) => ShoppingItemChildChannelPrice,
  ) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="border-foreground/10 bg-background/85 grid gap-3 rounded-lg border p-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)_minmax(0,0.78fr)_minmax(0,0.78fr)_auto]">
      <div className="space-y-1.5">
        <Label>{t("shopping.item.channelName", "渠道")}</Label>
        <Input
          value={channelPrice.channel}
          onChange={(event) => onChange((current) => ({ ...current, channel: event.target.value }))}
          className={SHOPPING_DIALOG_FIELD_CLASS}
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t("shopping.priceRef.entry", "入门价")}</Label>
        <Input
          type="number"
          value={channelPrice.entryPrice != null ? String(channelPrice.entryPrice) : ""}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              entryPrice: parseOptionalNumber(event.target.value),
            }))
          }
          className={SHOPPING_DIALOG_FIELD_CLASS}
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t("shopping.priceRef.sweet", "甜蜜价")}</Label>
        <Input
          type="number"
          value={channelPrice.sweetSpotPrice != null ? String(channelPrice.sweetSpotPrice) : ""}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              sweetSpotPrice: parseOptionalNumber(event.target.value),
            }))
          }
          className={SHOPPING_DIALOG_FIELD_CLASS}
        />
      </div>
      <div className="space-y-1.5">
        <Label>{t("shopping.priceRef.overpay", "虚高价")}</Label>
        <Input
          type="number"
          value={channelPrice.overpayPrice != null ? String(channelPrice.overpayPrice) : ""}
          onChange={(event) =>
            onChange((current) => ({
              ...current,
              overpayPrice: parseOptionalNumber(event.target.value),
            }))
          }
          className={SHOPPING_DIALOG_FIELD_CLASS}
        />
      </div>
      <div className="flex items-end">
        <Button type="button" variant="ghost" size="icon-sm" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

function normalizeChildDraft(
  child: ShoppingItemChild,
  fallback: {
    status: ShoppingStatus
    lifecycle: ShoppingLifecycle
    index: number
  },
): ShoppingItemChild {
  return {
    id: child.id || createLocalId("child", fallback.index),
    name: child.name ?? "",
    status: child.status ?? fallback.status,
    lifecycle: child.lifecycle ?? fallback.lifecycle,
    depreciation: child.depreciation,
    channelPrices: (child.channelPrices ?? []).map((channelPrice, channelIndex) =>
      normalizeChildChannelPrice(channelPrice, channelIndex),
    ),
  }
}

function createDefaultChildDraft({
  index,
  defaultChannels,
}: {
  index: number
  defaultChannels: string[]
}): ShoppingItemChild {
  return {
    id: createLocalId("child", index),
    name: "",
    status: ShoppingStatus.Owned,
    lifecycle: ShoppingLifecycle.Durable,
    depreciation: undefined,
    channelPrices: defaultChannels.map((channel, channelIndex) =>
      createChannelPriceDraft(channel, channelIndex),
    ),
  }
}

function normalizeChildChannelPrice(
  channelPrice: ShoppingItemChildChannelPrice,
  index: number,
): ShoppingItemChildChannelPrice {
  return {
    id: channelPrice.id || createLocalId("channel", index),
    channel: channelPrice.channel ?? "",
    entryPrice: channelPrice.entryPrice,
    sweetSpotPrice: channelPrice.sweetSpotPrice,
    overpayPrice: channelPrice.overpayPrice,
  }
}

function createChannelPriceDraft(channel: string, index: number): ShoppingItemChildChannelPrice {
  return {
    id: createLocalId("channel", index),
    channel,
    entryPrice: undefined,
    sweetSpotPrice: undefined,
    overpayPrice: undefined,
  }
}

function createLocalId(prefix: string, index: number) {
  return `${prefix}_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`
}

function parseOptionalNumber(value: string) {
  const normalized = value.trim()
  if (!normalized) return undefined

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : undefined
}
