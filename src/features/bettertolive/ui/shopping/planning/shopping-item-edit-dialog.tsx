import { Plus, TriangleAlert, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
/* eslint-disable react-hooks/incompatible-library */
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"
import { toast } from "sonner"

import { AnimatedIconButton, Button } from "@/components/ui/button"
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
import { confirmUndoableDelete } from "@/features/bettertolive/ui/shopping/_shared/shopping-delete"
import {
  channelDisplayName,
  depreciationDisplayName,
  lifecycleDisplayName,
  shoppingDepreciationOptions,
  shoppingLifecycleOptions,
  shoppingStatusOptions,
  statusDisplayName,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"
import {
  SHOPPING_DIALOG_CONTENT_CLASS,
  SHOPPING_DIALOG_FIELD_CLASS,
  SHOPPING_DIALOG_FOOTER_CLASS,
  SHOPPING_DIALOG_HEADER_CLASS,
  SHOPPING_DIALOG_PANEL_CLASS,
  SHOPPING_DIALOG_SECTION_CLASS,
} from "@/features/bettertolive/ui/shopping/_shared/shopping-page-shared"
import { cn } from "@/lib/utils"

export type EditingItem = { isNew: boolean; item: ShoppingItem | null }

const NONE_SELECT_VALUE = "__none__"

const itemFormSchema = z.object({
  name: z.string().min(1),
  systemTags: z.string().array().min(1),
  spaceTags: z.string().array().min(1),
  note: z.string(),
})

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
  const attributeDefinitions = shopping.attributeDefinitions
  const [isPending, setIsPending] = useState(false)

  const form = useForm<z.infer<typeof itemFormSchema>>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: seed?.name ?? "",
      systemTags: seed?.systemTags ?? [],
      spaceTags: seed?.spaceTags ?? [],
      note: seed?.note ?? "",
    },
  })

  const name = form.watch("name")
  const systemTags = form.watch("systemTags")
  const spaceTags = form.watch("spaceTags")
  const note = form.watch("note")

  const [children, setChildren] = useState<ShoppingItemChild[]>(() =>
    (seed?.children ?? []).map((child, index) =>
      normalizeChildDraft(child, {
        status: ShoppingStatus.Owned,
        lifecycle: ShoppingLifecycle.Durable,
        index,
      }),
    ),
  )

  // 渠道选项来自属性字典 channel 类的启用条目
  const channelOptions = useMemo(
    () =>
      (attributeDefinitions ?? [])
        .filter((d) => d.kind === "channel" && d.isEnabled)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.label.localeCompare(b.label))
        .map((d) => d.code),
    [attributeDefinitions],
  )

  const toggleTag = (field: "systemTags" | "spaceTags", id: string) => {
    const current = form.getValues(field)
    if (current.includes(id)) {
      form.setValue(
        field,
        current.filter((entry) => entry !== id),
        { shouldValidate: true },
      )
    } else {
      form.setValue(field, [...current, id], { shouldValidate: true })
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
    setChildren((current) => [...current, createDefaultChildDraft({ index: current.length })])
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

  const canSubmit = form.formState.isValid

  const handleSubmit = async () => {
    const values = form.getValues()
    if (!canSubmit) {
      toast.error(t("shopping.error.itemRequired"))
      return
    }

    // 检查是否有子级名称为空，给出警告
    const emptyNamedChildren = children
      .map((child, index) => ({ child, index }))
      .filter(({ child }) => child.name.trim().length === 0)
    if (emptyNamedChildren.length > 0) {
      const indices = emptyNamedChildren.map(({ index }) => index + 1).join(", ")
      toast.warning(
        t("shopping.warning.emptyChildren", {
          defaultValue: `子级 ${indices} 名称为空，提交时将被自动移除`,
          indices,
        }),
      )
    }

    // 检查是否有渠道名称为空的渠道价格行，给出警告
    const emptyChannelChildren = children
      .map((child, idx) => ({ child, index: idx }))
      .filter(({ child }) =>
        (child.channelPrices ?? []).some((cp) => cp.channel.trim().length === 0),
      )
    if (emptyChannelChildren.length > 0) {
      const indices = emptyChannelChildren.map(({ index }) => index + 1).join(", ")
      toast.warning(
        t("shopping.warning.emptyChannels", {
          defaultValue: `子级 ${indices} 存在渠道名称为空的价格行，提交时将被移除`,
          indices,
        }),
      )
    }

    const formPayload: ShoppingItemForm = {
      id: seed?.id,
      name: values.name.trim(),
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
      systemTags: values.systemTags,
      spaceTags: values.spaceTags,
      note: values.note.trim(),
    }

    setIsPending(true)
    try {
      if (editing.isNew) {
        await createItem(formPayload)
      } else {
        await updateItem(formPayload)
      }
      onSaved()
    } catch (error) {
      toast.error(String(error))
    } finally {
      setIsPending(false)
    }
  }

  const handleDelete = () => {
    if (!seed) return

    const scheduled = confirmUndoableDelete({
      confirmMessage: t("common.confirm.deleteItem", {
        name: seed.name,
      }),
      pendingMessage: t("common.toast.deletePending", {
        name: seed.name,
        defaultValue: `已加入删除队列：${seed.name}，5 秒内可撤销`,
      }),
      successMessage: t("shopping.toast.deleteSuccessItem", {
        name: seed.name,
        defaultValue: `已删除物件：${seed.name}`,
      }),
      failureMessage: t("shopping.toast.deleteFailedItem"),
      undoLabel: t("shopping.undo"),
      undoneMessage: t("common.toast.deleteUndone", {
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
          "flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[min(1320px,calc(100vw-3rem))]",
          SHOPPING_DIALOG_CONTENT_CLASS,
        )}
      >
        <DialogHeader className={SHOPPING_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew ? t("shopping.item.create") : t("shopping.item.edit")}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleSubmit()
          }}
        >
          <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <div
              className={cn(SHOPPING_DIALOG_SECTION_CLASS, "flex min-h-0 flex-col overflow-hidden")}
            >
              <div className="shrink-0 text-sm font-medium">
                {t("shopping.item.basicAttributes")}
              </div>
              <div className="min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
                <div className="space-y-1.5">
                  <Label>{t("shopping.item.name")} *</Label>
                  <Input
                    autoFocus
                    value={name}
                    onChange={(event) =>
                      form.setValue("name", event.target.value, { shouldValidate: true })
                    }
                    className={SHOPPING_DIALOG_FIELD_CLASS}
                  />
                </div>

                <div className="grid gap-4">
                  <TagSelectorPanel
                    label={t("shopping.item.systemTags")}
                    options={shopping.systemDefinitions.map((system) => ({
                      id: system.id,
                      label: system.name || system.id,
                    }))}
                    selectedIds={systemTags}
                    onToggle={(id) => toggleTag("systemTags", id)}
                  />
                  <TagSelectorPanel
                    label={t("shopping.item.spaceTags")}
                    options={shopping.spaceDefinitions.map((space) => ({
                      id: space.id,
                      label: space.name,
                    }))}
                    selectedIds={spaceTags}
                    onToggle={(id) => toggleTag("spaceTags", id)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>{t("shopping.item.note")}</Label>
                  <Textarea
                    value={note}
                    onChange={(event) =>
                      form.setValue("note", event.target.value, { shouldValidate: true })
                    }
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
                  <div className="text-sm font-medium">{t("shopping.item.childSettings")}</div>
                  <Button type="button" variant="outline" size="sm" onClick={addChild}>
                    <Plus className="mr-1 h-4 w-4" />
                    {t("shopping.item.addChild")}
                  </Button>
                </div>
              </div>
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {children.length === 0 ? (
                  <div className="border-foreground/15 bg-muted/15 text-muted-foreground rounded-lg border border-dashed px-4 py-8 text-center text-xs">
                    {t("shopping.item.noChildren")}
                  </div>
                ) : (
                  children.map((child, index) => (
                    <ChildEditorCard
                      key={child.id}
                      child={child}
                      childIndex={index}
                      attributeDefinitions={attributeDefinitions}
                      channelOptions={channelOptions}
                      onRemove={() => removeChild(index)}
                      onChange={(updater) => updateChild(index, updater)}
                      onAddChannel={() => addChannelToChild(index)}
                      onRemoveChannel={(channelIndex) =>
                        removeChannelFromChild(index, channelIndex)
                      }
                    />
                  ))
                )}
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
          <Button type="submit" disabled={!canSubmit || isPending}>
            {isPending ? t("common.actions.saving") : t("common.actions.save")}
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
  attributeDefinitions,
  channelOptions,
  onRemove,
  onChange,
  onAddChannel,
  onRemoveChannel,
}: {
  child: ShoppingItemChild
  childIndex: number
  attributeDefinitions: ShoppingModuleData["attributeDefinitions"]
  channelOptions: string[]
  onRemove: () => void
  onChange: (updater: (child: ShoppingItemChild) => ShoppingItemChild) => void
  onAddChannel: () => void
  onRemoveChannel: (channelIndex: number) => void
}) {
  const { t } = useTranslation()

  // 计算各属性的启用选项（只含 enabled），加入当前值（即使已禁用）确保显示
  const enabledStatusCodes = useMemo(
    () => new Set(shoppingStatusOptions(attributeDefinitions)),
    [attributeDefinitions],
  )
  const enabledLifecycleCodes = useMemo(
    () => new Set(shoppingLifecycleOptions(attributeDefinitions)),
    [attributeDefinitions],
  )
  const enabledDepreciationCodes = useMemo(
    () => new Set(shoppingDepreciationOptions(attributeDefinitions)),
    [attributeDefinitions],
  )

  const statusOptions = useMemo(() => {
    const base = [...enabledStatusCodes] as ShoppingStatus[]
    const cur = child.status
    if (cur && !enabledStatusCodes.has(cur as ShoppingStatus))
      return [cur as ShoppingStatus, ...base]
    return base
  }, [enabledStatusCodes, child.status])

  const lifecycleOptions = useMemo(() => {
    const base = [...enabledLifecycleCodes] as ShoppingLifecycle[]
    const cur = child.lifecycle
    if (cur && !enabledLifecycleCodes.has(cur as ShoppingLifecycle))
      return [cur as ShoppingLifecycle, ...base]
    return base
  }, [enabledLifecycleCodes, child.lifecycle])

  const depreciationOptions = useMemo(() => {
    const base = [...enabledDepreciationCodes] as ShoppingDepreciation[]
    const cur = child.depreciation
    if (cur && !enabledDepreciationCodes.has(cur as ShoppingDepreciation))
      return [cur as ShoppingDepreciation, ...base]
    return base
  }, [enabledDepreciationCodes, child.depreciation])

  // 已禁用 codes 集合（用于标记下拉选项）
  const disabledStatusCodes = useMemo(
    () => new Set(statusOptions.filter((o) => !enabledStatusCodes.has(o))),
    [statusOptions, enabledStatusCodes],
  )
  const disabledLifecycleCodes = useMemo(
    () => new Set(lifecycleOptions.filter((o) => !enabledLifecycleCodes.has(o))),
    [lifecycleOptions, enabledLifecycleCodes],
  )
  const disabledDepreciationCodes = useMemo(
    () => new Set(depreciationOptions.filter((o) => !enabledDepreciationCodes.has(o))),
    [depreciationOptions, enabledDepreciationCodes],
  )

  // 当前值是否已禁用
  const isStatusDisabled = !!child.status && disabledStatusCodes.has(child.status as ShoppingStatus)
  const isLifecycleDisabled =
    !!child.lifecycle && disabledLifecycleCodes.has(child.lifecycle as ShoppingLifecycle)
  const isDepreciationDisabled =
    !!child.depreciation &&
    disabledDepreciationCodes.has(child.depreciation as ShoppingDepreciation)

  return (
    <div className={cn(SHOPPING_DIALOG_PANEL_CLASS, "space-y-4 p-4")}>
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm font-medium">
          {t("shopping.item.childLabel", { index: childIndex + 1 })}
        </div>
        <AnimatedIconButton
          show
          type="button"
          variant="ghost"
          size="icon-sm"
          label={t("shopping.item.removeChild")}
          icon={<Trash2 className="h-4 w-4" />}
          onClick={onRemove}
        />
      </div>

      <div className="space-y-1.5">
        <Label>{t("shopping.item.childName")}</Label>
        <Input
          value={child.name}
          onChange={(event) => onChange((current) => ({ ...current, name: event.target.value }))}
          placeholder={t("shopping.item.childName")}
          className={SHOPPING_DIALOG_FIELD_CLASS}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <Label>{t("shopping.item.status")}</Label>
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
              {statusOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {statusDisplayName(option, t, attributeDefinitions)}
                  {disabledStatusCodes.has(option) && (
                    <span className="text-muted-foreground ml-1 text-xs">
                      ({t("shopping.attributes.disabledBadge")})
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isStatusDisabled && (
            <p className="flex items-center gap-1 text-[11px] text-amber-500">
              <TriangleAlert className="h-3 w-3 shrink-0" />
              {t("shopping.attributes.disabledWarning")}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>{t("shopping.item.lifecycle")}</Label>
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
              {lifecycleOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {lifecycleDisplayName(option, t, attributeDefinitions)}
                  {disabledLifecycleCodes.has(option) && (
                    <span className="text-muted-foreground ml-1 text-xs">
                      {t("shopping.item.lifecycleDisabledBadge")}
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isLifecycleDisabled && (
            <p className="flex items-center gap-1 text-[11px] text-amber-500">
              <TriangleAlert className="h-3 w-3 shrink-0" />
              {t("shopping.item.lifecycleDisabledWarning")}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>{t("shopping.item.depreciation")}</Label>
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
              <SelectValue placeholder={t("shopping.item.depPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE_SELECT_VALUE}>{t("shopping.item.depPlaceholder")}</SelectItem>
              {depreciationOptions.map((option) => (
                <SelectItem key={option} value={option}>
                  {depreciationDisplayName(option, t, attributeDefinitions)}
                  {disabledDepreciationCodes.has(option) && (
                    <span className="text-muted-foreground ml-1 text-xs">
                      {t("shopping.item.depreciationDisabledBadge")}
                    </span>
                  )}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isDepreciationDisabled && (
            <p className="flex items-center gap-1 text-[11px] text-amber-500">
              <TriangleAlert className="h-3 w-3 shrink-0" />
              {t("shopping.item.depreciationDisabledWarning")}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm font-medium">{t("shopping.item.childChannels")}</div>
          <Button type="button" variant="outline" size="sm" onClick={onAddChannel}>
            <Plus className="mr-1 h-4 w-4" />
            {t("shopping.item.addChannel")}
          </Button>
        </div>

        {(child.channelPrices ?? []).length === 0 ? (
          <div className="border-foreground/15 bg-muted/15 text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-xs">
            {t("shopping.item.noChildChannels")}
          </div>
        ) : (
          <div className="space-y-2">
            {(child.channelPrices ?? []).map((channelPrice, channelIndex) => (
              <ChildChannelEditorRow
                key={channelPrice.id}
                channelPrice={channelPrice}
                channelOptions={channelOptions}
                attributeDefinitions={attributeDefinitions}
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
  channelOptions,
  attributeDefinitions,
  onChange,
  onRemove,
}: {
  channelPrice: ShoppingItemChildChannelPrice
  channelOptions: string[]
  attributeDefinitions: ShoppingModuleData["attributeDefinitions"]
  onChange: (
    updater: (channelPrice: ShoppingItemChildChannelPrice) => ShoppingItemChildChannelPrice,
  ) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()

  const combinedOptions = useMemo(() => {
    const allOptions = new Set(channelOptions)
    if (channelPrice.channel) allOptions.add(channelPrice.channel)
    return Array.from(allOptions).sort((a, b) => a.localeCompare(b))
  }, [channelOptions, channelPrice.channel])

  const isChannelDisabled = !!channelPrice.channel && !channelOptions.includes(channelPrice.channel)

  return (
    <div className="border-foreground/10 bg-background/85 grid gap-3 rounded-lg border p-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.78fr)_minmax(0,0.78fr)_minmax(0,0.78fr)_auto]">
      <div className="space-y-1.5">
        <Label>{t("shopping.item.channelName")}</Label>
        <Select
          value={channelPrice.channel ?? ""}
          onValueChange={(value) =>
            onChange((current) => ({ ...current, channel: String(value ?? "") }))
          }
        >
          <SelectTrigger className={SHOPPING_DIALOG_FIELD_CLASS}>
            <SelectValue placeholder={t("shopping.item.channelName")} />
          </SelectTrigger>
          <SelectContent>
            {combinedOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {channelDisplayName(option, attributeDefinitions)}
                {!channelOptions.includes(option) && (
                  <span className="text-muted-foreground ml-1 text-xs">
                    {t("shopping.item.channelDisabledBadge")}
                  </span>
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isChannelDisabled && (
          <p className="flex items-center gap-1 text-[11px] text-amber-500">
            <TriangleAlert className="h-3 w-3 shrink-0" />
            {t("shopping.item.channelDisabledWarning")}
          </p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label>{t("shopping.priceRef.entry")}</Label>
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
        <Label>{t("shopping.priceRef.sweet")}</Label>
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
        <Label>{t("shopping.priceRef.overpay")}</Label>
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
        <AnimatedIconButton
          show
          type="button"
          variant="ghost"
          size="icon-sm"
          label={t("shopping.item.removeChannel")}
          icon={<Trash2 className="h-4 w-4" />}
          onClick={onRemove}
        />
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

function createDefaultChildDraft({ index }: { index: number }): ShoppingItemChild {
  return {
    id: createLocalId("child", index),
    name: "",
    status: ShoppingStatus.Owned,
    lifecycle: ShoppingLifecycle.Durable,
    depreciation: undefined,
    channelPrices: [],
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
