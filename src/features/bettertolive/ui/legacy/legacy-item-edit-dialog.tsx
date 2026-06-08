import { LockKeyhole, Trash2 } from "lucide-react"
import type { ReactNode } from "react"
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
import {
  createLegacyItem,
  deleteLegacyItem,
  updateLegacyItem,
} from "@/features/bettertolive/api/legacy-crud-api"
import type { LegacyItem, LegacyItemForm } from "@/features/bettertolive/types"
import {
  createLegacyItemForm,
  EMOTIONAL_LOADS,
  LEGACY_CATEGORIES,
  LEGACY_RECIPIENTS,
  LEGACY_STATUSES,
  LEGACY_URGENCIES,
  LEGACY_VISIBILITIES,
  requiresDeliveryCondition,
  translateLegacyEnum,
} from "@/features/bettertolive/ui/legacy/legacy-page-data"
import {
  LEGACY_DIALOG_CONTENT_CLASS,
  LEGACY_DIALOG_FIELD_CLASS,
  LEGACY_DIALOG_FOOTER_CLASS,
  LEGACY_DIALOG_SECTION_CLASS,
} from "@/features/bettertolive/ui/legacy/legacy-page-shared"
import { confirmUndoableDelete } from "@/features/bettertolive/ui/shopping/shopping-delete"
import { cn } from "@/lib/utils"

export type EditingLegacyItem = {
  isNew: boolean
  item: LegacyItem | null
}

export function LegacyItemEditDialog({
  editing,
  onClose,
  onSaved,
  onDeleted,
}: {
  editing: EditingLegacyItem
  onClose: () => void
  onSaved: () => void
  onDeleted?: () => void
}) {
  const { t } = useTranslation()
  const seed = editing.item
  const [form, setForm] = useState<LegacyItemForm>(() => createLegacyItemForm(seed))
  const [isUnlocked, setIsUnlocked] = useState(editing.isNew || !seed?.isLocked)
  const isReadOnly = !isUnlocked

  const tagsText = useMemo(() => form.tags.join(", "), [form.tags])
  const canSubmit =
    form.title.trim().length > 0 && form.summary.trim().length > 0 && form.content.trim().length > 0
  const showDeliveryCondition = requiresDeliveryCondition(form.visibility)
  const criticalFinalMissingDelivery =
    form.urgency === "关键信息" && form.status === "最终版" && !form.deliveryCondition?.trim()

  const patchForm = <K extends keyof LegacyItemForm>(key: K, value: LegacyItemForm[K]) => {
    setForm((current) => {
      const next = { ...current, [key]: value }
      if (key === "status" && value === "最终版") {
        next.isLocked = true
      }
      if (key === "status" && current.status === "最终版" && value !== "最终版" && !editing.isNew) {
        next.isLocked = false
      }
      if (key === "recipient" && value === "仅自己") {
        next.excludeFromAi = true
      }
      if (key === "emotionalLoad" && value === "很重") {
        next.requiresSecondConfirm = true
        next.excludeFromAi = true
      }
      if (key === "visibility" && value === "我离世后") {
        next.excludeFromAi = true
      }
      return next
    })
  }

  const handleUnlock = () => {
    setIsUnlocked(true)
    setForm((current) => ({
      ...current,
      status: current.status === "最终版" ? "基本完成" : current.status,
      isLocked: false,
    }))
  }

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error(t("legacy.validation.required", "请填写标题、摘要和正文"))
      return
    }

    if (criticalFinalMissingDelivery) {
      toast.error(
        t("legacy.validation.criticalFinalDelivery", "关键信息进入最终版前需要填写交付条件"),
      )
      return
    }

    try {
      if (editing.isNew) {
        await createLegacyItem(form)
      } else {
        await updateLegacyItem({ ...form, id: seed?.id })
      }
      onSaved()
    } catch (error) {
      toast.error(String(error))
    }
  }

  const handleDelete = () => {
    if (!seed) return

    const scheduled = confirmUndoableDelete({
      confirmMessage: t("legacy.confirm.deleteItem", {
        title: seed.title,
        defaultValue: `确定删除 ${seed.title} 吗？`,
      }),
      pendingMessage: t("legacy.toast.deletePendingItem", {
        title: seed.title,
        defaultValue: `已加入删除队列：${seed.title}，5 秒内可撤销`,
      }),
      successMessage: t("legacy.toast.deleteSuccessItem", {
        title: seed.title,
        defaultValue: `已删除生命整理条目：${seed.title}`,
      }),
      failureMessage: t("legacy.toast.deleteFailedItem", "删除生命整理条目失败"),
      undoLabel: t("legacy.undo", "撤销"),
      undoneMessage: t("legacy.toast.deleteUndoneItem", {
        title: seed.title,
        defaultValue: `已撤销删除：${seed.title}`,
      }),
      onDelete: () => deleteLegacyItem(seed.id),
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
          LEGACY_DIALOG_CONTENT_CLASS,
        )}
      >
        <DialogHeader className="border-foreground/10 shrink-0 border-b pr-10 pb-3">
          <DialogTitle>
            {editing.isNew
              ? t("legacy.edit.createTitle", "新增生命整理条目")
              : t("legacy.edit.editTitle", "编辑生命整理条目")}
          </DialogTitle>
        </DialogHeader>

        {!editing.isNew && seed?.isLocked && !isUnlocked ? (
          <div className="rounded-lg border border-[color:var(--legacy-lock-border)] bg-[color:var(--legacy-lock-bg)] px-4 py-3 text-sm text-[color:var(--legacy-lock-ink)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <LockKeyhole className="size-4" />
                {t("legacy.edit.lockedCopy", "这份条目已锁定，解锁后才能编辑。")}
              </div>
              <Button variant="outline" size="sm" onClick={handleUnlock}>
                {t("legacy.actions.unlock", "解锁编辑")}
              </Button>
            </div>
          </div>
        ) : null}

        <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
          <div className={cn(LEGACY_DIALOG_SECTION_CLASS, "min-h-0 overflow-y-auto")}>
            <div className="text-sm font-medium">{t("legacy.edit.contentSection", "内容")}</div>

            <Field label={t("legacy.fields.title", "标题")} required>
              <Input
                value={form.title}
                disabled={isReadOnly}
                onChange={(event) => patchForm("title", event.currentTarget.value)}
                className={LEGACY_DIALOG_FIELD_CLASS}
              />
            </Field>

            <Field label={t("legacy.fields.summary", "摘要")} required>
              <Textarea
                value={form.summary}
                disabled={isReadOnly}
                rows={3}
                onChange={(event) => patchForm("summary", event.currentTarget.value)}
                className={cn(LEGACY_DIALOG_FIELD_CLASS, "resize-none")}
              />
            </Field>

            <Field label={t("legacy.fields.content", "正文")} required>
              <Textarea
                value={form.content}
                disabled={isReadOnly}
                rows={10}
                onChange={(event) => patchForm("content", event.currentTarget.value)}
                className={cn(LEGACY_DIALOG_FIELD_CLASS, "min-h-48 resize-none")}
              />
            </Field>

            <Field label={t("legacy.fields.tags", "标签")}>
              <Input
                value={tagsText}
                disabled={isReadOnly}
                onChange={(event) =>
                  patchForm(
                    "tags",
                    event.currentTarget.value
                      .split(/[,，]/)
                      .map((tag) => tag.trim())
                      .filter(Boolean),
                  )
                }
                className={LEGACY_DIALOG_FIELD_CLASS}
                placeholder={t("legacy.edit.tagsPlaceholder", "用逗号分隔")}
              />
            </Field>

            <Field label={t("legacy.fields.reviewCue", "回看提示")}>
              <Input
                value={form.reviewCue}
                disabled={isReadOnly}
                onChange={(event) => patchForm("reviewCue", event.currentTarget.value)}
                className={LEGACY_DIALOG_FIELD_CLASS}
              />
            </Field>
          </div>

          <div className={cn(LEGACY_DIALOG_SECTION_CLASS, "min-h-0 overflow-y-auto")}>
            <div className="text-sm font-medium">
              {t("legacy.edit.classifySection", "分类与保护")}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label={t("legacy.fields.category", "内容类别")}
                value={form.category}
                disabled={isReadOnly}
                options={LEGACY_CATEGORIES}
                group="category"
                onChange={(value) => patchForm("category", value)}
              />
              <SelectField
                label={t("legacy.fields.recipient", "接收者")}
                value={form.recipient}
                disabled={isReadOnly}
                options={LEGACY_RECIPIENTS}
                group="recipient"
                onChange={(value) => patchForm("recipient", value)}
              />
              <SelectField
                label={t("legacy.fields.urgency", "紧急度")}
                value={form.urgency}
                disabled={isReadOnly}
                options={LEGACY_URGENCIES}
                group="urgency"
                onChange={(value) => patchForm("urgency", value)}
              />
              <SelectField
                label={t("legacy.fields.visibility", "可见时机")}
                value={form.visibility}
                disabled={isReadOnly}
                options={LEGACY_VISIBILITIES}
                group="visibility"
                onChange={(value) => patchForm("visibility", value)}
              />
              <SelectField
                label={t("legacy.fields.status", "完成状态")}
                value={form.status}
                disabled={isReadOnly}
                options={LEGACY_STATUSES}
                group="status"
                onChange={(value) => patchForm("status", value)}
              />
              <SelectField
                label={t("legacy.fields.emotionalLoad", "情感负荷")}
                value={form.emotionalLoad ?? "平静"}
                disabled={isReadOnly}
                options={EMOTIONAL_LOADS}
                group="emotionalLoad"
                onChange={(value) => patchForm("emotionalLoad", value)}
              />
            </div>

            <Field label={t("legacy.fields.recipientName", "具体接收者")}>
              <Input
                value={form.recipientName ?? ""}
                disabled={isReadOnly || form.recipient === "仅自己"}
                onChange={(event) => patchForm("recipientName", event.currentTarget.value)}
                className={LEGACY_DIALOG_FIELD_CLASS}
              />
            </Field>

            <Field label={t("legacy.fields.relatedRelationshipId", "关系引用")}>
              <Input
                value={form.relatedRelationshipId ?? ""}
                disabled={isReadOnly}
                onChange={(event) => patchForm("relatedRelationshipId", event.currentTarget.value)}
                className={LEGACY_DIALOG_FIELD_CLASS}
              />
            </Field>

            {showDeliveryCondition ? (
              <Field
                label={t("legacy.fields.deliveryCondition", "交付条件")}
                required={form.urgency === "关键信息" && form.status === "最终版"}
              >
                <Textarea
                  value={form.deliveryCondition ?? ""}
                  disabled={isReadOnly}
                  rows={4}
                  onChange={(event) => patchForm("deliveryCondition", event.currentTarget.value)}
                  className={cn(LEGACY_DIALOG_FIELD_CLASS, "resize-none")}
                />
              </Field>
            ) : null}

            {criticalFinalMissingDelivery ? (
              <div className="rounded-lg border border-[color:var(--legacy-warning-border)] bg-[color:var(--legacy-warning-bg)] px-3 py-2 text-xs text-[color:var(--legacy-warning-ink)]">
                {t(
                  "legacy.validation.criticalFinalDelivery",
                  "关键信息进入最终版前需要填写交付条件",
                )}
              </div>
            ) : null}

            <div className="grid gap-3">
              <CheckboxLine
                label={t("legacy.fields.isLocked", "锁定条目")}
                checked={form.isLocked}
                disabled={isReadOnly || form.status === "最终版"}
                onChange={(checked) => patchForm("isLocked", checked)}
              />
              <CheckboxLine
                label={t("legacy.fields.requiresSecondConfirm", "打开前二次确认")}
                checked={form.requiresSecondConfirm}
                disabled={isReadOnly}
                onChange={(checked) => patchForm("requiresSecondConfirm", checked)}
              />
              <CheckboxLine
                label={t("legacy.fields.excludeFromAi", "不参与 AI 汇总")}
                checked={form.excludeFromAi}
                disabled={isReadOnly}
                onChange={(checked) => patchForm("excludeFromAi", checked)}
              />
            </div>
          </div>
        </div>

        <DialogFooter className={LEGACY_DIALOG_FOOTER_CLASS}>
          {!editing.isNew ? (
            <Button variant="outline" onClick={handleDelete} className="mr-auto">
              <Trash2 className="size-4" />
              {t("legacy.actions.delete", "删除")}
            </Button>
          ) : null}
          <Button variant="outline" onClick={onClose}>
            {t("legacy.actions.cancel", "取消")}
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit || isReadOnly}>
            {t("legacy.actions.save", "保存")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Field({
  label,
  children,
  required = false,
}: {
  label: string
  children: ReactNode
  required?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {required ? <span className="text-destructive ml-1">*</span> : null}
      </Label>
      {children}
    </div>
  )
}

function SelectField<T extends string>({
  label,
  value,
  options,
  group,
  disabled,
  onChange,
}: {
  label: string
  value: T
  options: readonly T[]
  group: string
  disabled: boolean
  onChange: (value: T) => void
}) {
  const { t } = useTranslation()

  return (
    <Field label={label}>
      <Select
        value={value}
        onValueChange={(next) => {
          if (next !== null) {
            onChange(next)
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger className={LEGACY_DIALOG_FIELD_CLASS}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {translateLegacyEnum(t, group, option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function CheckboxLine({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string
  checked: boolean
  disabled: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="border-foreground/10 bg-background/70 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm">
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(nextChecked) => onChange(nextChecked === true)}
      />
      <span className={cn(disabled && "text-muted-foreground")}>{label}</span>
    </label>
  )
}
