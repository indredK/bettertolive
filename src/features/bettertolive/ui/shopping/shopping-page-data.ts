import type { TFunction } from "i18next"
import {
  ShoppingDepreciation,
  ShoppingHealthStatus,
  ShoppingLane,
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

export const LANE_STYLES: Record<ShoppingLane, string> = {
  [ShoppingLane.Now]: "border-foreground/10 bg-accent text-accent-foreground",
  [ShoppingLane.Wait]: "border-foreground/10 bg-accent text-accent-foreground",
  [ShoppingLane.Hold]: "border-foreground/10 bg-muted text-muted-foreground",
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

export const SHOPPING_LANE_OPTIONS: ShoppingLane[] = [
  ShoppingLane.Now,
  ShoppingLane.Wait,
  ShoppingLane.Hold,
]

export const SHOPPING_HEALTH_STATUS_OPTIONS: ShoppingHealthStatus[] = [
  ShoppingHealthStatus.StableUse,
  ShoppingHealthStatus.ConsiderUpgrade,
  ShoppingHealthStatus.NeedRestock,
  ShoppingHealthStatus.MissingParts,
  ShoppingHealthStatus.NeedComplete,
]

export const FAST_DEPRECIATION = new Set<ShoppingDepreciation>([
  ShoppingDepreciation.VeryFast,
  ShoppingDepreciation.Fast,
])

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
  if (item.children.length === 0) {
    return status === ShoppingStatus.Owned
  }
  return item.children.some((child) => (child.status ?? ShoppingStatus.Owned) === status)
}

export function itemPrimaryStatus(item: ShoppingItem) {
  return itemHasStatus(item, ShoppingStatus.Wanted) ? ShoppingStatus.Wanted : ShoppingStatus.Owned
}

// ===== 显示名称(i18n + fallback) =====

export function systemDisplayName(systemId: ShoppingSystem, t: TFunction): string {
  return t(`shopping.enumNames.system.${systemId}`, systemId)
}

export function lifecycleDisplayName(lc: ShoppingLifecycle, t: TFunction): string {
  return t(`shopping.enumNames.lifecycle.${lc}`, lc as string)
}

export function depreciationDisplayName(dep: ShoppingDepreciation, t: TFunction): string {
  return t(`shopping.enumNames.depreciation.${dep}`, dep as string)
}

export function statusDisplayName(status: ShoppingStatus | string, t: TFunction): string {
  return t(`shopping.enumNames.status.${status}`, status === "Owned" ? "已有" : "待购")
}

export function laneDisplayName(
  lane: ShoppingLane | string | null | undefined,
  t: TFunction,
): string {
  if (!lane) return ""
  const fallback = lane === "Now" ? "立即买" : lane === "Wait" ? "等好价" : "先不买"
  return t(`shopping.enumNames.lane.${lane}`, fallback)
}

export function healthStatusDisplayName(
  status: ShoppingHealthStatus | string,
  t: TFunction,
): string {
  return t(`shopping.enumNames.healthStatus.${status}`, status)
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
      label: t("shopping.priceSignal.inBuyZone", "在买点"),
      className: "border-foreground/10 bg-accent text-accent-foreground",
    }
  }
  if (item.overpayPrice != null && item.currentPrice >= item.overpayPrice) {
    return {
      label: t("shopping.priceSignal.overpriced", "偏贵"),
      className: "border-foreground/10 bg-secondary text-secondary-foreground",
    }
  }
  return {
    label: t("shopping.priceSignal.watchOnly", "观望"),
    className: "border-foreground/10 bg-muted text-muted-foreground",
  }
}
