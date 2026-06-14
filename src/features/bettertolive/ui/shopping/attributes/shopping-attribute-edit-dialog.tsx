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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type {
  ShoppingAttributeDefinition,
  ShoppingAttributeKind,
  ShoppingAttributeStyleToken,
} from "@/features/bettertolive/types"
import type { ShoppingAttributeDefinitionForm } from "@/features/bettertolive/api/bettertolive-api"
import {
  createAttributeDefinition,
  updateAttributeDefinition,
} from "@/features/bettertolive/api/shopping-crud-api"
import {
  SHOPPING_DIALOG_CONTENT_CLASS,
  SHOPPING_DIALOG_FIELD_CLASS,
  SHOPPING_DIALOG_FOOTER_CLASS,
  SHOPPING_DIALOG_HEADER_CLASS,
  SHOPPING_DIALOG_SECTION_CLASS,
} from "@/features/bettertolive/ui/shopping/_shared/shopping-page-shared"
import {
  shoppingAttributeKindDisplayName,
  shoppingAttributeSemanticDisplayName,
  shoppingAttributeStyleTokenDisplayName,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"
import { cn } from "@/lib/utils"

const ATTRIBUTE_KIND_OPTIONS: ShoppingAttributeKind[] = [
  "status",
  "lifecycle",
  "depreciation",
  "channel",
]

const STYLE_TOKEN_OPTIONS: ShoppingAttributeStyleToken[] = ["accent", "secondary", "muted", "card"]

const NONE_STYLE_VALUE = "__none_style__"
const NONE_SEMANTIC_VALUE = "__none_semantic__"

const SEMANTIC_OPTIONS: Record<ShoppingAttributeKind, string[]> = {
  status: ["owned", "wanted"],
  lifecycle: ["consumable", "durable", "tool", "emotional"],
  depreciation: ["very_fast", "fast", "medium", "slow", "no_depreciation"],
  channel: [],
}

const CODE_PATTERN = /^[A-Za-z0-9_]+$/

const attributeFormSchema = z
  .object({
    kind: z.enum(["status", "lifecycle", "depreciation", "channel"]),
    code: z.string(),
    label: z.string().min(1),
    labelEn: z.string(),
    description: z.string(),
    semanticKey: z.string(),
    styleToken: z.string(),
    rank: z.string(),
  })
  .superRefine((data, ctx) => {
    // code 格式校验（仅当填写了 code 且格式不合法时报错）
    const trimmedCode = data.code.trim()
    if (trimmedCode && !CODE_PATTERN.test(trimmedCode)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["code"],
        message: "code_format",
      })
    }
    // 语义键：status 类型必填
    if (data.kind === "status" && !data.semanticKey.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["semanticKey"],
        message: "semantic_required",
      })
    }
    // rank 格式校验
    const trimmedRank = data.rank.trim()
    if (trimmedRank && !Number.isFinite(Number(trimmedRank))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rank"],
        message: "rank_invalid",
      })
    }
  })

function FieldLabel({
  children,
  required,
  htmlFor,
}: {
  children: React.ReactNode
  required?: boolean
  htmlFor?: string
}) {
  return (
    <Label htmlFor={htmlFor}>
      {children}
      {required && <span className="text-destructive ml-0.5">*</span>}
    </Label>
  )
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-muted-foreground text-[11px]">{children}</p>
}

export function ShoppingAttributeEditDialog({
  editing,
  onClose,
  onSaved,
}: {
  editing: {
    isNew: boolean
    definition: ShoppingAttributeDefinition | null
    defaultKind?: ShoppingAttributeKind
  }
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const seed = editing.definition
  const [isPending, setIsPending] = useState(false)
  // 系统 status 属性：kind/code/semanticKey 全部锁定
  const identityLocked = Boolean(seed?.isSystem && seed.kind === "status")
  // 编辑模式下 code 统一锁定（code 是稳定持久化标识符）
  const codeLocked = !editing.isNew || identityLocked

  const form = useForm<z.infer<typeof attributeFormSchema>>({
    resolver: zodResolver(attributeFormSchema),
    defaultValues: {
      kind: seed?.kind ?? editing.defaultKind ?? "depreciation",
      code: seed?.code ?? "",
      label: seed?.label ?? "",
      labelEn: seed?.labelEn ?? "",
      description: seed?.description ?? "",
      semanticKey: seed?.semanticKey || "",
      styleToken: seed?.styleToken ?? "",
      rank: seed?.rank != null ? String(seed.rank) : "",
    },
  })

  const kind = form.watch("kind")
  const code = form.watch("code")
  const label = form.watch("label")
  const labelEn = form.watch("labelEn")
  const description = form.watch("description")
  const semanticKey = form.watch("semanticKey")
  const styleToken = form.watch("styleToken")
  const rank = form.watch("rank")

  const semanticOptions = useMemo(() => SEMANTIC_OPTIONS[kind] ?? [], [kind])
  const semanticRequired = kind === "status"

  // 用于 UI 显示的校验错误（code 在 locked 时不校验）
  const codeError = useMemo(() => {
    if (codeLocked) return null
    const trimmed = code.trim()
    if (!trimmed) return t("shopping.error.codeEmpty")
    if (!CODE_PATTERN.test(trimmed)) return t("shopping.error.codeFormat")
    return null
  }, [code, codeLocked, t])

  const rankError = useMemo(() => {
    const trimmed = rank.trim()
    if (!trimmed) return null
    const n = Number(trimmed)
    if (!Number.isFinite(n)) return t("shopping.error.rankInvalid")
    return null
  }, [rank, t])

  const canSubmit =
    form.formState.isValid && (codeLocked || codeError === null) && rankError === null

  const handleSubmit = async () => {
    if (!canSubmit) {
      if (codeError) {
        toast.error(codeError)
      } else if (semanticRequired && !semanticKey.trim()) {
        toast.error(t("shopping.error.semanticRequired"))
      } else {
        toast.error(t("shopping.error.nameRequired"))
      }
      return
    }

    const payload: ShoppingAttributeDefinitionForm = {
      id: seed?.id,
      kind,
      code: code.trim(),
      semanticKey: semanticKey.trim() || null,
      label: label.trim(),
      labelEn: labelEn.trim() || null,
      description: description.trim(),
      styleToken: styleToken || null,
      rank: rank.trim() ? Number(rank) : null,
      isEnabled: seed?.isEnabled ?? true,
      version: seed?.version,
    }

    setIsPending(true)
    try {
      if (editing.isNew) {
        await createAttributeDefinition(payload)
      } else if (seed) {
        await updateAttributeDefinition({ ...payload, id: seed.id })
      }
      onSaved()
    } catch (error) {
      toast.error(String(error))
    } finally {
      setIsPending(false)
    }
  }

  const semanticHint = useMemo(() => {
    if (kind === "status") return t("shopping.attributes.hint.semanticStatus")
    if (kind === "channel") return t("shopping.attributes.hint.semanticChannel")
    return t("shopping.attributes.hint.semantic")
  }, [kind, t])

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
          "flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[min(980px,calc(100vw-3rem))]",
          SHOPPING_DIALOG_CONTENT_CLASS,
        )}
      >
        <DialogHeader className={SHOPPING_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew ? t("shopping.attributes.create") : t("shopping.attributes.edit")}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            void handleSubmit()
          }}
        >
          <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-2">
            <div className={cn(SHOPPING_DIALOG_SECTION_CLASS, "space-y-4 overflow-y-auto pr-1")}>
              {/* 分类 */}
              <div className="space-y-1.5">
                <FieldLabel required>{t("shopping.attributes.kind")}</FieldLabel>
                <Select
                  value={kind}
                  onValueChange={(value) =>
                    form.setValue("kind", value as ShoppingAttributeKind, { shouldValidate: true })
                  }
                >
                  <SelectTrigger className={SHOPPING_DIALOG_FIELD_CLASS} disabled={identityLocked}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ATTRIBUTE_KIND_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {shoppingAttributeKindDisplayName(option, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldHint>{t("shopping.attributes.hint.kind")}</FieldHint>
              </div>

              {/* 代码 */}
              <div className="space-y-1.5">
                <FieldLabel required>{t("shopping.attributes.code")}</FieldLabel>
                <Input
                  autoFocus
                  value={code}
                  onChange={(event) =>
                    form.setValue("code", event.target.value, { shouldValidate: true })
                  }
                  className={cn(
                    SHOPPING_DIALOG_FIELD_CLASS,
                    !codeLocked && codeError && code.trim() && "border-destructive",
                  )}
                  disabled={codeLocked}
                />
                {codeLocked ? (
                  <FieldHint>{t("shopping.attributes.hint.codeLocked")}</FieldHint>
                ) : codeError && code.trim() ? (
                  <p className="text-destructive text-[11px]">{codeError}</p>
                ) : (
                  <FieldHint>{t("shopping.attributes.hint.code")}</FieldHint>
                )}
              </div>

              {/* 中文名 */}
              <div className="space-y-1.5">
                <FieldLabel required>{t("shopping.attributes.label")}</FieldLabel>
                <Input
                  value={label}
                  onChange={(event) =>
                    form.setValue("label", event.target.value, { shouldValidate: true })
                  }
                  className={SHOPPING_DIALOG_FIELD_CLASS}
                />
                <FieldHint>{t("shopping.attributes.hint.label")}</FieldHint>
              </div>

              {/* 英文名 */}
              <div className="space-y-1.5">
                <FieldLabel>{t("shopping.attributes.labelEn")}</FieldLabel>
                <Input
                  value={labelEn}
                  onChange={(event) =>
                    form.setValue("labelEn", event.target.value, { shouldValidate: true })
                  }
                  className={SHOPPING_DIALOG_FIELD_CLASS}
                />
                <FieldHint>{t("shopping.attributes.hint.labelEn")}</FieldHint>
              </div>
            </div>

            <div className={cn(SHOPPING_DIALOG_SECTION_CLASS, "space-y-4 overflow-y-auto pr-1")}>
              {/* 语义键 */}
              <div className="space-y-1.5">
                <FieldLabel required={semanticRequired}>
                  {t("shopping.attributes.semanticKey")}
                </FieldLabel>
                {semanticOptions.length > 0 ? (
                  <Select
                    value={semanticKey || NONE_SEMANTIC_VALUE}
                    onValueChange={(value) =>
                      form.setValue(
                        "semanticKey",
                        value === NONE_SEMANTIC_VALUE ? "" : String(value),
                        { shouldValidate: true },
                      )
                    }
                  >
                    <SelectTrigger
                      className={SHOPPING_DIALOG_FIELD_CLASS}
                      disabled={identityLocked}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {!semanticRequired && (
                        <SelectItem value={NONE_SEMANTIC_VALUE}>
                          {t("shopping.attributes.noSemantic")}
                        </SelectItem>
                      )}
                      {semanticOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {shoppingAttributeSemanticDisplayName(option, t)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={semanticKey}
                    onChange={(event) =>
                      form.setValue("semanticKey", event.target.value, { shouldValidate: true })
                    }
                    className={SHOPPING_DIALOG_FIELD_CLASS}
                    disabled={identityLocked}
                    placeholder={t("shopping.attributes.noSemantic")}
                  />
                )}
                <FieldHint>{semanticHint}</FieldHint>
              </div>

              {/* 样式 */}
              <div className="space-y-1.5">
                <FieldLabel>{t("shopping.attributes.styleToken")}</FieldLabel>
                <Select
                  value={styleToken || NONE_STYLE_VALUE}
                  onValueChange={(value) =>
                    form.setValue(
                      "styleToken",
                      value === NONE_STYLE_VALUE ? "" : (value as ShoppingAttributeStyleToken),
                      { shouldValidate: true },
                    )
                  }
                >
                  <SelectTrigger className={SHOPPING_DIALOG_FIELD_CLASS}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE_STYLE_VALUE}>
                      {t("shopping.attributes.noStyle")}
                    </SelectItem>
                    {STYLE_TOKEN_OPTIONS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {shoppingAttributeStyleTokenDisplayName(option, t)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldHint>{t("shopping.attributes.hint.styleToken")}</FieldHint>
              </div>

              {/* 等级/排序权重 */}
              <div className="space-y-1.5">
                <FieldLabel>{t("shopping.attributes.rank")}</FieldLabel>
                <Input
                  type="number"
                  value={rank}
                  onChange={(event) =>
                    form.setValue("rank", event.target.value, { shouldValidate: true })
                  }
                  className={cn(SHOPPING_DIALOG_FIELD_CLASS, rankError && "border-destructive")}
                />
                {rankError ? (
                  <p className="text-destructive text-[11px]">{rankError}</p>
                ) : (
                  <FieldHint>{t("shopping.attributes.hint.rank")}</FieldHint>
                )}
              </div>

              {/* 说明 */}
              <div className="space-y-1.5">
                <FieldLabel>{t("shopping.attributes.description")}</FieldLabel>
                <Textarea
                  value={description}
                  onChange={(event) =>
                    form.setValue("description", event.target.value, { shouldValidate: true })
                  }
                  rows={6}
                  className={cn(SHOPPING_DIALOG_FIELD_CLASS, "min-h-28 resize-none")}
                />
                <FieldHint>{t("shopping.attributes.hint.description")}</FieldHint>
              </div>
            </div>
          </div>
        </form>

        <DialogFooter className={SHOPPING_DIALOG_FOOTER_CLASS}>
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
