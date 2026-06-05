import type { TFunction } from "i18next"
import type {
  ShoppingDepreciation,
  ShoppingLifecycle,
  ShoppingNeedLevel,
  ShoppingOwnedItem,
  ShoppingPlanItem,
} from "@/features/bettertolive/types"
import i18next from "@/i18n/config"
import { formatCurrency } from "@/features/bettertolive/ui/shared/formatters"
import type { ShoppingPlanWithLane } from "@/features/bettertolive/ui/shopping/shopping-system-detail-dialog"

export const NEED_LEVEL_STYLES: Record<ShoppingNeedLevel, string> = {
  最低配置:
    "border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]",
  必要: "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]",
  改善体验:
    "border-[color:var(--tone-past-border)] bg-[color:var(--tone-past-bg)] text-[color:var(--tone-past-ink)]",
  提升幸福感:
    "border-[color:var(--tone-future-border)] bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]",
}

export const LIFECYCLE_STYLES: Record<ShoppingLifecycle, string> = {
  消耗品:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-200",
  耐用品:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200",
  工具: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200",
  情感物:
    "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-800/60 dark:bg-fuchsia-950/40 dark:text-fuchsia-200",
}

export const DEPRECIATION_STYLES: Record<ShoppingDepreciation, string> = {
  极快折旧:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200",
  较快折旧:
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-800/60 dark:bg-orange-950/40 dark:text-orange-200",
  中等折旧:
    "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200",
  慢折旧:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200",
  不折旧或升值:
    "border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-800/60 dark:bg-violet-950/40 dark:text-violet-200",
}

export const FAST_DEPRECIATION = new Set<ShoppingDepreciation>(["极快折旧", "较快折旧"])
export const PRIORITY_LEVELS = new Set<ShoppingNeedLevel>(["最低配置", "必要"])

const SYSTEM_ROW_ACTIVE_WEIGHT = 5 / 3
const SYSTEM_ROW_NEIGHBOR_WEIGHT = 2 / 3
const SYSTEM_ROW_EDGE_ACTIVE_WEIGHT = 1.4
const SYSTEM_ROW_EDGE_NEIGHBOR_WEIGHT = 0.6

export function getLifecycleCopy(
  t: TFunction,
): Record<ShoppingLifecycle, { title: string; detail: string }> {
  return {
    消耗品: {
      title: t("shopping.lifecycle.consumables.title"),
      detail: t("shopping.lifecycle.consumables.detail"),
    },
    耐用品: {
      title: t("shopping.lifecycle.durables.title"),
      detail: t("shopping.lifecycle.durables.detail"),
    },
    工具: {
      title: t("shopping.lifecycle.tools.title"),
      detail: t("shopping.lifecycle.tools.detail"),
    },
    情感物: {
      title: t("shopping.lifecycle.emotional.title"),
      detail: t("shopping.lifecycle.emotional.detail"),
    },
  }
}

export function getOverviewDimensions(t: TFunction) {
  return [
    {
      id: "system" as const,
      title: "system",
      answer: t("shopping.dimensions.system.answer"),
      detail: t("shopping.dimensions.system.detail"),
      cue: t("shopping.dimensions.system.cue"),
    },
    {
      id: "space" as const,
      title: "space",
      answer: t("shopping.dimensions.space.answer"),
      detail: t("shopping.dimensions.space.detail"),
      cue: t("shopping.dimensions.space.cue"),
    },
    {
      id: "stage" as const,
      title: "stage",
      answer: t("shopping.dimensions.stage.answer"),
      detail: t("shopping.dimensions.stage.detail"),
      cue: t("shopping.dimensions.stage.cue"),
    },
    {
      id: "necessity" as const,
      title: "necessity",
      answer: t("shopping.dimensions.necessity.answer"),
      detail: t("shopping.dimensions.necessity.detail"),
      cue: t("shopping.dimensions.necessity.cue"),
    },
    {
      id: "lifecycle" as const,
      title: "lifecycle",
      answer: t("shopping.dimensions.lifecycle.answer"),
      detail: t("shopping.dimensions.lifecycle.detail"),
      cue: t("shopping.dimensions.lifecycle.cue"),
    },
  ] as const
}

export type ShoppingLifecycleGroups = Record<
  ShoppingLifecycle,
  { owned: ShoppingOwnedItem[]; planned: ShoppingPlanWithLane[] }
>

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

export function getPriceSignal(item: ShoppingPlanItem, t: TFunction) {
  if (item.currentPrice <= item.buyBelowPrice) {
    return {
      label: t("shopping.priceSignal.inBuyZone"),
      className:
        "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]",
    }
  }

  if (item.currentPrice >= item.overpayPrice) {
    return {
      label: t("shopping.priceSignal.overpriced"),
      className:
        "border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]",
    }
  }

  return {
    label: t("shopping.priceSignal.watchOnly"),
    className:
      "border-[color:var(--tone-past-border)] bg-[color:var(--tone-past-bg)] text-[color:var(--tone-past-ink)]",
  }
}

function getSystemNeighborIndexes(length: number, activeIndex: number) {
  const indexes: number[] = []

  for (
    let step = 1;
    indexes.length < 2 && (activeIndex - step >= 0 || activeIndex + step < length);
    step += 1
  ) {
    if (activeIndex - step >= 0) {
      indexes.push(activeIndex - step)
    }

    if (indexes.length >= 2) {
      break
    }

    if (activeIndex + step < length) {
      indexes.push(activeIndex + step)
    }
  }

  return indexes
}

export function getSystemRowTemplate(length: number, activeIndex: number | null) {
  if (length <= 0) {
    return ""
  }

  const weights = Array.from({ length }, () => 1)

  if (activeIndex !== null && activeIndex >= 0 && activeIndex < length) {
    const neighborIndexes = getSystemNeighborIndexes(length, activeIndex)

    if (neighborIndexes.length === 1) {
      weights[activeIndex] = SYSTEM_ROW_EDGE_ACTIVE_WEIGHT
      weights[neighborIndexes[0]] = SYSTEM_ROW_EDGE_NEIGHBOR_WEIGHT
    } else if (neighborIndexes.length >= 2) {
      weights[activeIndex] = SYSTEM_ROW_ACTIVE_WEIGHT

      neighborIndexes.slice(0, 2).forEach((index) => {
        weights[index] = SYSTEM_ROW_NEIGHBOR_WEIGHT
      })
    }
  }

  return weights.map((weight) => `minmax(0, ${weight}fr)`).join(" ")
}
