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
} from "@/features/bettertolive/ui/shopping/shopping-page-shared"
import {
  shoppingAttributeKindDisplayName,
  shoppingAttributeSemanticDisplayName,
  shoppingAttributeStyleTokenDisplayName,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"
import { cn } from "@/lib/utils"

const ATTRIBUTE_KIND_OPTIONS: ShoppingAttributeKind[] = [
  "status",
  "lane",
  "lifecycle",
  "depreciation",
  "health_status",
  "channel",
]

const STYLE_TOKEN_OPTIONS: ShoppingAttributeStyleToken[] = ["accent", "secondary", "muted", "card"]

const NONE_STYLE_VALUE = "__none_style__"
const NONE_SEMANTIC_VALUE = "__none_semantic__"

const SEMANTIC_OPTIONS: Record<ShoppingAttributeKind, string[]> = {
  status: ["owned", "wanted"],
  lane: ["now", "wait", "hold"],
  lifecycle: ["consumable", "durable", "tool", "emotional"],
  depreciation: ["very_fast", "fast", "medium", "slow", "no_depreciation"],
  health_status: [
    "stable_use",
    "consider_upgrade",
    "need_restock",
    "missing_parts",
    "need_complete",
  ],
  channel: [],
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
  const identityLocked = Boolean(seed?.isSystem && (seed.kind === "status" || seed.kind === "lane"))
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
  const semanticRequired = kind === "status" || kind === "lane"

  const canSubmit = label.trim().length > 0 && code.trim().length > 0

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast.error(t("shopping.error.nameRequired", "请填写名称"))
      return
    }
    if (semanticRequired && !semanticKey.trim()) {
      toast.error(t("shopping.error.semanticRequired", "该类型必须设置语义键"))
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
      isSystem: seed?.isSystem ?? false,
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
            <div className="space-y-1.5">
              <Label>{t("shopping.attributes.kind", "分类")}</Label>
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
            </div>

            <div className="space-y-1.5">
              <Label>{t("shopping.attributes.code", "代码")}</Label>
              <Input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                className={SHOPPING_DIALOG_FIELD_CLASS}
                disabled={identityLocked}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("shopping.attributes.label", "中文名")}</Label>
              <Input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                className={SHOPPING_DIALOG_FIELD_CLASS}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("shopping.attributes.labelEn", "英文名")}</Label>
              <Input
                value={labelEn}
                onChange={(event) => setLabelEn(event.target.value)}
                className={SHOPPING_DIALOG_FIELD_CLASS}
              />
            </div>
          </div>

          <div className={cn(SHOPPING_DIALOG_SECTION_CLASS, "space-y-4 overflow-y-auto pr-1")}>
            <div className="space-y-1.5">
              <Label>{t("shopping.attributes.semanticKey", "语义键")}</Label>
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
                />
              )}
            </div>

            <div className="space-y-1.5">
              <Label>{t("shopping.attributes.styleToken", "样式")}</Label>
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
            </div>

            <div className="space-y-1.5">
              <Label>{t("shopping.attributes.rank", "等级 / 排序权重")}</Label>
              <Input
                type="number"
                value={rank}
                onChange={(event) => setRank(event.target.value)}
                className={SHOPPING_DIALOG_FIELD_CLASS}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t("shopping.attributes.description", "说明")}</Label>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                rows={6}
                className={cn(SHOPPING_DIALOG_FIELD_CLASS, "min-h-28 resize-none")}
              />
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
