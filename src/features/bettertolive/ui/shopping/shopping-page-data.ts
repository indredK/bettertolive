import type { TFunction } from "i18next"
import {
  type ShoppingAttributeDefinition,
  ShoppingDepreciation,
  ShoppingLifecycle,
  ShoppingStatus,
} from "@/features/bettertolive/types"
import type { ShoppingItem, ShoppingSystem } from "@/features/bettertolive/types"
import i18next from "@/i18n/config"
import { formatCurrency } from "@/features/bettertolive/ui/shared/formatters"

// ===== 显示用的样式 =====

export const SYSTEM_CHIP_STYLE = "border-foreground/10 bg-accent text-accent-foreground"
export const SPACE_CHIP_STYLE = "border-foreground/10 bg-secondary text-secondary-foreground"
export const CHANNEL_CHIP_STYLE = "border-foreground/10 bg-muted text-muted-foreground"

export const LIFECYCLE_STYLES: Record<ShoppingLifecycle, string> = {
  [ShoppingLifecycle.Consumable]: "border-foreground/10 bg-muted text-muted-foreground",
  [ShoppingLifecycle.Durable]: "border-foreground/10 bg-accent text-accent-foreground",
  [ShoppingLifecycle.Tool]: "border-foreground/10 bg-secondary text-secondary-foreground",
  [ShoppingLifecycle.Emotional]: "border-foreground/10 bg-card text-card-foreground",
}

export const DEPRECIATION_STYLES: Record<ShoppingDepreciation, string> = {
  [ShoppingDepreciation.VeryFast]: "border-foreground/10 bg-muted text-muted-foreground",
  [ShoppingDepreciation.Fast]: "border-foreground/10 bg-muted text-muted-foreground",
  [ShoppingDepreciation.Medium]: "border-foreground/10 bg-secondary text-secondary-foreground",
  [ShoppingDepreciation.Slow]: "border-foreground/10 bg-accent text-accent-foreground",
  [ShoppingDepreciation.NoDepreciation]: "border-foreground/10 bg-card text-card-foreground",
}

export const STATUS_STYLES: Record<ShoppingStatus, string> = {
  [ShoppingStatus.Owned]: "border-foreground/10 bg-accent text-accent-foreground",
  [ShoppingStatus.Wanted]: "border-foreground/10 bg-secondary text-secondary-foreground",
}

// ===== 枚举选项 =====

export const SHOPPING_LIFECYCLE_OPTIONS: ShoppingLifecycle[] = [
  ShoppingLifecycle.Consumable,
  ShoppingLifecycle.Durable,
  ShoppingLifecycle.Tool,
  ShoppingLifecycle.Emotional,
]

export const SHOPPING_DEPRECIATION_OPTIONS: ShoppingDepreciation[] = [
  ShoppingDepreciation.VeryFast,
  ShoppingDepreciation.Fast,
  ShoppingDepreciation.Medium,
  ShoppingDepreciation.Slow,
  ShoppingDepreciation.NoDepreciation,
]

export const SHOPPING_STATUS_OPTIONS: ShoppingStatus[] = [
  ShoppingStatus.Owned,
  ShoppingStatus.Wanted,
]

export const FAST_DEPRECIATION = new Set<ShoppingDepreciation>([
  ShoppingDepreciation.VeryFast,
  ShoppingDepreciation.Fast,
])

const STYLE_TOKEN_CLASSNAME: Record<string, string> = {
  accent: "border-foreground/10 bg-accent text-accent-foreground",
  secondary: "border-foreground/10 bg-secondary text-secondary-foreground",
  muted: "border-foreground/10 bg-muted text-muted-foreground",
  card: "border-foreground/10 bg-card text-card-foreground",
}

type AttributeKind = ShoppingAttributeDefinition["kind"]

function findAttributeDefinition(
  definitions: ShoppingAttributeDefinition[] | undefined,
  kind: AttributeKind,
  code: string | null | undefined,
) {
  if (!code) return null
  return (
    definitions?.find((definition) => definition.kind === kind && definition.code === code) ?? null
  )
}

function findAttributeBySemanticKey(
  definitions: ShoppingAttributeDefinition[] | undefined,
  kind: AttributeKind,
  semanticKey: string,
) {
  return (
    definitions?.find(
      (definition) => definition.kind === kind && definition.semanticKey === semanticKey,
    ) ?? null
  )
}

function resolveAttributeLabel(
  definitions: ShoppingAttributeDefinition[] | undefined,
  kind: AttributeKind,
  code: string | null | undefined,
  locale: string | undefined,
) {
  const definition = findAttributeDefinition(definitions, kind, code)
  if (!definition) return null
  const isEnglish = locale?.startsWith("en")
  return isEnglish ? definition.labelEn || definition.label : definition.label
}

function resolveAttributeStyle(
  definitions: ShoppingAttributeDefinition[] | undefined,
  kind: AttributeKind,
  code: string | null | undefined,
) {
  const definition = findAttributeDefinition(definitions, kind, code)
  const token = definition?.styleToken ?? undefined
  return token ? STYLE_TOKEN_CLASSNAME[token] : null
}

function resolveAttributeOptions<T extends string>(
  definitions: ShoppingAttributeDefinition[] | undefined,
  kind: AttributeKind,
  fallback: readonly T[],
) {
  const options = (definitions ?? [])
    .filter((definition) => definition.kind === kind && definition.isEnabled)
    .sort(
      (left, right) => left.sortOrder - right.sortOrder || left.label.localeCompare(right.label),
    )
    .map((definition) => definition.code as T)

  return options.length > 0 ? options : [...fallback]
}

// ===== 工具函数 =====

export function chunkList<T>(items: T[], size: number) {
  const chunks: T[][] = []
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size))
  }
  return chunks
}

export function formatPrice(amount: number) {
  return formatCurrency(amount, i18next.resolvedLanguage ?? i18next.language)
}

export function itemHasStatus(item: ShoppingItem, status: ShoppingStatus) {
  return itemPrimaryStatus(item) === status
}

export function itemPrimaryStatus(item: ShoppingItem) {
  return itemHasStatusSemantic(item, "wanted") ? ShoppingStatus.Wanted : ShoppingStatus.Owned
}

export function itemHasStatusSemantic(
  item: ShoppingItem,
  semanticKey: "owned" | "wanted",
  definitions?: ShoppingAttributeDefinition[],
) {
  // 统一语义：以"是否有子级为 Wanted"作为判断依据
  // wanted → 任意子级是 Wanted；owned → 没有任何子级是 Wanted
  const wantedCode =
    findAttributeBySemanticKey(definitions, "status", "wanted")?.code ?? ShoppingStatus.Wanted
  if (item.children.length === 0) {
    // 无子级：视为 owned
    return semanticKey === "owned"
  }
  const hasAnyWanted = item.children.some(
    (child) => (child.status ?? ShoppingStatus.Owned) === wantedCode,
  )
  return semanticKey === "wanted" ? hasAnyWanted : !hasAnyWanted
}

export function itemPrimaryStatusCode(
  item: ShoppingItem,
  definitions?: ShoppingAttributeDefinition[],
): string {
  const wantedCode =
    findAttributeBySemanticKey(definitions, "status", "wanted")?.code ?? ShoppingStatus.Wanted
  const ownedCode =
    findAttributeBySemanticKey(definitions, "status", "owned")?.code ?? ShoppingStatus.Owned
  return itemHasStatusSemantic(item, "wanted", definitions) ? wantedCode : ownedCode
}

export function semanticStatusCode(
  semanticKey: "owned" | "wanted",
  definitions?: ShoppingAttributeDefinition[],
): string {
  return (
    findAttributeBySemanticKey(definitions, "status", semanticKey)?.code ??
    (semanticKey === "wanted" ? ShoppingStatus.Wanted : ShoppingStatus.Owned)
  )
}

// ===== 显示名称(i18n + fallback) =====

export function systemDisplayName(systemId: ShoppingSystem, t: TFunction): string {
  return t(`shopping.enumNames.system.${systemId}`, systemId)
}

export function lifecycleDisplayName(
  lc: ShoppingLifecycle | string,
  t: TFunction,
  definitions?: ShoppingAttributeDefinition[],
): string {
  return (
    resolveAttributeLabel(
      definitions,
      "lifecycle",
      lc,
      i18next.resolvedLanguage ?? i18next.language,
    ) ?? t(`shopping.enumNames.lifecycle.${lc}`, lc)
  )
}

export function depreciationDisplayName(
  dep: ShoppingDepreciation | string,
  t: TFunction,
  definitions?: ShoppingAttributeDefinition[],
): string {
  return (
    resolveAttributeLabel(
      definitions,
      "depreciation",
      dep,
      i18next.resolvedLanguage ?? i18next.language,
    ) ?? t(`shopping.enumNames.depreciation.${dep}`, dep)
  )
}

export function statusDisplayName(
  status: ShoppingStatus | string,
  t: TFunction,
  definitions?: ShoppingAttributeDefinition[],
): string {
  return (
    resolveAttributeLabel(
      definitions,
      "status",
      status,
      i18next.resolvedLanguage ?? i18next.language,
    ) ??
    t(
      `shopping.enumNames.status.${status}`,
      status === "Owned" ? "已有" : status === "Wanted" ? "待购" : String(status),
    )
  )
}

export function channelDisplayName(
  code: string,
  definitions?: ShoppingAttributeDefinition[],
): string {
  return (
    resolveAttributeLabel(
      definitions,
      "channel",
      code,
      i18next.resolvedLanguage ?? i18next.language,
    ) ?? code
  )
}

export function shoppingAttributeKindDisplayName(kind: AttributeKind, t: TFunction): string {
  return t(`shopping.attributes.kindOptions.${kind}`, kind)
}

export function shoppingAttributeDisplayName(definition: ShoppingAttributeDefinition): string {
  const isEnglish = i18next.resolvedLanguage?.startsWith("en")
  return isEnglish ? definition.labelEn || definition.label : definition.label
}

export function shoppingAttributeSemanticDisplayName(
  semanticKey: string | null | undefined,
  t: TFunction,
): string {
  if (!semanticKey) return t("shopping.attributes.none")
  return t(`shopping.attributes.semanticOptions.${semanticKey}`, semanticKey)
}

export function shoppingAttributeStyleTokenDisplayName(
  styleToken: string | null | undefined,
  t: TFunction,
): string {
  if (!styleToken) return t("shopping.attributes.none")
  return t(`shopping.attributes.styleOptions.${styleToken}`, styleToken)
}

export function shoppingAttributeEnabledDisplayName(isEnabled: boolean, t: TFunction): string {
  return isEnabled ? t("shopping.attributes.enabled") : t("shopping.attributes.disabled")
}

export function statusStyle(
  status: ShoppingStatus | string,
  definitions?: ShoppingAttributeDefinition[],
): string {
  return (
    resolveAttributeStyle(definitions, "status", status) ??
    STATUS_STYLES[status as ShoppingStatus] ??
    "border-foreground/10 bg-muted text-muted-foreground"
  )
}

export function lifecycleStyle(
  lifecycle: ShoppingLifecycle | string,
  definitions?: ShoppingAttributeDefinition[],
): string {
  return (
    resolveAttributeStyle(definitions, "lifecycle", lifecycle) ??
    LIFECYCLE_STYLES[lifecycle as ShoppingLifecycle] ??
    "border-foreground/10 bg-muted text-muted-foreground"
  )
}

export function depreciationStyle(
  depreciation: ShoppingDepreciation | string,
  definitions?: ShoppingAttributeDefinition[],
): string {
  return (
    resolveAttributeStyle(definitions, "depreciation", depreciation) ??
    DEPRECIATION_STYLES[depreciation as ShoppingDepreciation] ??
    "border-foreground/10 bg-muted text-muted-foreground"
  )
}

export function shoppingStatusOptions(
  definitions?: ShoppingAttributeDefinition[],
): ShoppingStatus[] {
  return resolveAttributeOptions(definitions, "status", SHOPPING_STATUS_OPTIONS)
}

export function shoppingLifecycleOptions(
  definitions?: ShoppingAttributeDefinition[],
): ShoppingLifecycle[] {
  return resolveAttributeOptions(definitions, "lifecycle", SHOPPING_LIFECYCLE_OPTIONS)
}

export function shoppingDepreciationOptions(
  definitions?: ShoppingAttributeDefinition[],
): ShoppingDepreciation[] {
  return resolveAttributeOptions(definitions, "depreciation", SHOPPING_DEPRECIATION_OPTIONS)
}

/**
 * 物品采购价格信号(沿用原逻辑)。
 * 仅当物品同时有 currentPrice 与 buyBelowPrice 时有意义。
 */
export function getPriceSignal(
  item: {
    currentPrice?: number | null
    buyBelowPrice?: number | null
    overpayPrice?: number | null
  },
  t: TFunction,
) {
  if (item.currentPrice == null || item.buyBelowPrice == null) {
    return null
  }
  if (item.currentPrice <= item.buyBelowPrice) {
    return {
      label: t("shopping.priceSignal.inBuyZone"),
      className: "border-foreground/10 bg-accent text-accent-foreground",
    }
  }
  if (item.overpayPrice != null && item.currentPrice >= item.overpayPrice) {
    return {
      label: t("shopping.priceSignal.overpriced"),
      className: "border-foreground/10 bg-secondary text-secondary-foreground",
    }
  }
  return {
    label: t("shopping.priceSignal.watchOnly"),
    className: "border-foreground/10 bg-muted text-muted-foreground",
  }
}
