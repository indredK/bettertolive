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

export const SYSTEM_CHIP_STYLE =
  "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-200"
export const SPACE_CHIP_STYLE =
  "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200"
export const CHANNEL_CHIP_STYLE =
  "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800/60 dark:bg-violet-950/40 dark:text-violet-200"

export const LIFECYCLE_STYLES: Record<ShoppingLifecycle, string> = {
  [ShoppingLifecycle.Consumable]:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-200",
  [ShoppingLifecycle.Durable]:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200",
  [ShoppingLifecycle.Tool]:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200",
  [ShoppingLifecycle.Emotional]:
    "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-800/60 dark:bg-fuchsia-950/40 dark:text-fuchsia-200",
}

export const DEPRECIATION_STYLES: Record<ShoppingDepreciation, string> = {
  [ShoppingDepreciation.VeryFast]:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200",
  [ShoppingDepreciation.Fast]:
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800/60 dark:bg-orange-950/40 dark:text-orange-200",
  [ShoppingDepreciation.Medium]:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200",
  [ShoppingDepreciation.Slow]:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200",
  [ShoppingDepreciation.NoDepreciation]:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800/60 dark:bg-violet-950/40 dark:text-violet-200",
}

export const STATUS_STYLES: Record<ShoppingStatus, string> = {
  [ShoppingStatus.Owned]: "border-emerald-300 bg-emerald-50 text-emerald-700",
  [ShoppingStatus.Wanted]: "border-amber-300 bg-amber-50 text-amber-700",
}

export const LANE_STYLES: Record<ShoppingLane, string> = {
  [ShoppingLane.Now]: "border-rose-300 bg-rose-50 text-rose-700",
  [ShoppingLane.Wait]: "border-sky-300 bg-sky-50 text-sky-700",
  [ShoppingLane.Hold]: "border-zinc-300 bg-zinc-50 text-zinc-700",
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
      className: "border-emerald-300 bg-emerald-50 text-emerald-700",
    }
  }
  if (item.overpayPrice != null && item.currentPrice >= item.overpayPrice) {
    return {
      label: t("shopping.priceSignal.overpriced", "偏贵"),
      className: "border-rose-300 bg-rose-50 text-rose-700",
    }
  }
  return {
    label: t("shopping.priceSignal.watchOnly", "观望"),
    className: "border-sky-300 bg-sky-50 text-sky-700",
  }
}
