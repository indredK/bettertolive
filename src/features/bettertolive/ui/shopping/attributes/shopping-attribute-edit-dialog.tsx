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
  // 系统 status 属性：kind/code/semanticKey 全部锁定
  const identityLocked = Boolean(seed?.isSystem && seed.kind === "status")
  // 编辑模式下 code 统一锁定（code 是稳定持久化标识符）
  const codeLocked = !editing.isNew || identityLocked

  const [kind, setKind] = useState<ShoppingAttributeKind>(
    seed?.kind ?? editing.defaultKind ?? "depreciation",
  )
  const [code, setCode] = useState(seed?.code ?? "")
  const [label, setLabel] = useState(seed?.label ?? "")
  const [labelEn, setLabelEn] = useState(seed?.labelEn ?? "")
  const [description, setDescription] = useState(seed?.description ?? "")
  const [semanticKey, setSemanticKey] = useState(seed?.semanticKey || "")
  const [styleToken, setStyleToken] = useState<ShoppingAttributeStyleToken | "">(
    seed?.styleToken ?? "",
  )
  const [rank, setRank] = useState(seed?.rank != null ? String(seed.rank) : "")

  const semanticOptions = useMemo(() => SEMANTIC_OPTIONS[kind] ?? [], [kind])
  const semanticRequired = kind === "status"

  const codeError = useMemo(() => {
    const trimmed = code.trim()
    if (!trimmed) return t("shopping.error.codeEmpty", "代码不能为空")
    if (!CODE_PATTERN.test(trimmed))
      return t("shopping.error.codeFormat", "只允许字母、数字和下划线，如 Consumable")
    return null
  }, [code, t])

  const rankError = useMemo(() => {
    const trimmed = rank.trim()
    if (!trimmed) return null
    const n = Number(trimmed)
    if (!Number.isFinite(n)) return t("shopping.error.rankInvalid", "请输入有效数字")
    return null
  }, [rank, t])

  const canSubmit =
    label.trim().length > 0 &&
    codeError === null &&
    rankError === null &&
    (!semanticRequired || semanticKey.trim().length > 0)

  const handleSubmit = async () => {
    if (!canSubmit) {
      if (codeError) {
        toast.error(codeError)
      } else if (semanticRequired && !semanticKey.trim()) {
        toast.error(t("shopping.error.semanticRequired", "该类型必须设置语义键"))
      } else {
        toast.error(t("shopping.error.nameRequired", "请填写中文名"))
      }
      return
    }

    const form: ShoppingAttributeDefinitionForm = {
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
      // 乐观锁版本号：编辑时回传当前版本，创建时后端忽略
      version: seed?.version,
    }

    try {
      if (editing.isNew) {
        await createAttributeDefinition(form)
      } else if (seed) {
        await updateAttributeDefinition({ ...form, id: seed.id })
      }
      onSaved()
    } catch (error) {
      toast.error(String(error))
    }
  }

  const semanticHint = useMemo(() => {
    if (kind === "status") return t("shopping.attributes.hint.semanticStatus")
    if (kind === "channel") return t("shopping.attributes.hint.semanticChannel")
    return t("shopping.attributes.hint.semantic")
  }, [kind, t])

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "flex max-h-[90vh] flex-col overflow-hidden sm:max-w-[min(980px,calc(100vw-3rem))]",
          SHOPPING_DIALOG_CONTENT_CLASS,
        )}
      >
        <DialogHeader className={SHOPPING_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew
              ? t("shopping.attributes.create", "新增属性")
              : t("shopping.attributes.edit", "编辑属性")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-4 md:grid-cols-2">
          <div className={cn(SHOPPING_DIALOG_SECTION_CLASS, "space-y-4 overflow-y-auto pr-1")}>
            {/* 分类 */}
            <div className="space-y-1.5">
              <FieldLabel required>{t("shopping.attributes.kind", "分类")}</FieldLabel>
              <Select
                value={kind}
                onValueChange={(value) => setKind(value as ShoppingAttributeKind)}
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
              <FieldLabel required>{t("shopping.attributes.code", "代码")}</FieldLabel>
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value)}
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
              <FieldLabel required>{t("shopping.attributes.label", "中文名")}</FieldLabel>
              <Input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                className={SHOPPING_DIALOG_FIELD_CLASS}
              />
              <FieldHint>{t("shopping.attributes.hint.label")}</FieldHint>
            </div>

            {/* 英文名 */}
            <div className="space-y-1.5">
              <FieldLabel>{t("shopping.attributes.labelEn", "英文名")}</FieldLabel>
              <Input
                value={labelEn}
                onChange={(event) => setLabelEn(event.target.value)}
                className={SHOPPING_DIALOG_FIELD_CLASS}
              />
              <FieldHint>{t("shopping.attributes.hint.labelEn")}</FieldHint>
            </div>
          </div>

          <div className={cn(SHOPPING_DIALOG_SECTION_CLASS, "space-y-4 overflow-y-auto pr-1")}>
            {/* 语义键 */}
            <div className="space-y-1.5">
              <FieldLabel required={semanticRequired}>
                {t("shopping.attributes.semanticKey", "语义键")}
              </FieldLabel>
              {semanticOptions.length > 0 ? (
                <Select
                  value={semanticKey || NONE_SEMANTIC_VALUE}
                  onValueChange={(value) =>
                    setSemanticKey(value === NONE_SEMANTIC_VALUE ? "" : String(value))
                  }
                >
                  <SelectTrigger className={SHOPPING_DIALOG_FIELD_CLASS} disabled={identityLocked}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {!semanticRequired && (
                      <SelectItem value={NONE_SEMANTIC_VALUE}>
                        {t("shopping.attributes.noSemantic", "不设置")}
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
                  onChange={(event) => setSemanticKey(event.target.value)}
                  className={SHOPPING_DIALOG_FIELD_CLASS}
                  disabled={identityLocked}
                  placeholder={t("shopping.attributes.noSemantic", "不设置")}
                />
              )}
              <FieldHint>{semanticHint}</FieldHint>
            </div>

            {/* 样式 */}
            <div className="space-y-1.5">
              <FieldLabel>{t("shopping.attributes.styleToken", "样式")}</FieldLabel>
              <Select
                value={styleToken || NONE_STYLE_VALUE}
                onValueChange={(value) =>
                  setStyleToken(
                    value === NONE_STYLE_VALUE ? "" : (value as ShoppingAttributeStyleToken),
                  )
                }
              >
                <SelectTrigger className={SHOPPING_DIALOG_FIELD_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_STYLE_VALUE}>
                    {t("shopping.attributes.noStyle", "不设置")}
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
              <FieldLabel>{t("shopping.attributes.rank", "等级 / 排序权重")}</FieldLabel>
              <Input
                type="number"
                value={rank}
                onChange={(event) => setRank(event.target.value)}
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
              <FieldLabel>{t("shopping.attributes.description", "说明")}</FieldLabel>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={6}
                className={cn(SHOPPING_DIALOG_FIELD_CLASS, "min-h-28 resize-none")}
              />
              <FieldHint>{t("shopping.attributes.hint.description")}</FieldHint>
            </div>
          </div>
        </div>

        <DialogFooter className={SHOPPING_DIALOG_FOOTER_CLASS}>
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
