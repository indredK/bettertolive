import type { TFunction } from "i18next"
import type { ShoppingOwnedItem, ShoppingPlanItem } from "@/features/bettertolive/types"
import {
  ShoppingDepreciation,
  ShoppingLifecycle,
  ShoppingOwnedStatus,
  ShoppingStage,
  ShoppingSystem,
} from "@/features/bettertolive/types"
import i18next from "@/i18n/config"
import { formatCurrency } from "@/features/bettertolive/ui/shared/formatters"
import type { ShoppingPlanWithLane } from "@/features/bettertolive/ui/shopping/shopping-types"

// 注:NEED_LEVEL_STYLES 已删除 — 物品不再有 necessity 字段

// 三类归属标签的样式(显示层) — 物品的标签由 system/spaces/stages 三字段在显示层渲染成三行不同颜色
export const SYSTEM_CHIP_STYLE =
  "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-200"
export const SPACE_CHIP_STYLE =
  "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200"
export const STAGE_CHIP_STYLE =
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

export const SHOPPING_SYSTEM_OPTIONS: ShoppingSystem[] = [
  ShoppingSystem.Sleep,
  ShoppingSystem.Diet,
  ShoppingSystem.Cleaning,
  ShoppingSystem.Storage,
  ShoppingSystem.Lighting,
  ShoppingSystem.Environment,
  ShoppingSystem.PowerNetwork,
  ShoppingSystem.WorkStudy,
  ShoppingSystem.EmergencyHealth,
  ShoppingSystem.PersonalCare,
  ShoppingSystem.Clothing,
  ShoppingSystem.Furniture,
  ShoppingSystem.Transportation,
  ShoppingSystem.Entertainment,
  ShoppingSystem.Pets,
]

export const SHOPPING_STAGE_OPTIONS: ShoppingStage[] = [
  ShoppingStage.MovingMinimal,
  ShoppingStage.Renting,
  ShoppingStage.LongTermLiving,
  ShoppingStage.OwnHome,
  ShoppingStage.SelfBuilt,
  ShoppingStage.Basement,
]

const SHOPPING_STAGE_ALIASES: Record<string, ShoppingStage> = {
  [ShoppingStage.MovingMinimal]: ShoppingStage.MovingMinimal,
  [ShoppingStage.Renting]: ShoppingStage.Renting,
  [ShoppingStage.LongTermLiving]: ShoppingStage.LongTermLiving,
  [ShoppingStage.OwnHome]: ShoppingStage.OwnHome,
  [ShoppingStage.SelfBuilt]: ShoppingStage.SelfBuilt,
  [ShoppingStage.Basement]: ShoppingStage.Basement,
  搬家最低配: ShoppingStage.MovingMinimal,
  "Moving Essentials": ShoppingStage.MovingMinimal,
  租房: ShoppingStage.Renting,
  长期居住: ShoppingStage.LongTermLiving,
  "Long-Term Living": ShoppingStage.LongTermLiving,
  自有住房: ShoppingStage.OwnHome,
  "Home Ownership": ShoppingStage.OwnHome,
  自建房: ShoppingStage.SelfBuilt,
  "Self-Built": ShoppingStage.SelfBuilt,
  地下室: ShoppingStage.Basement,
}

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

export const SHOPPING_OWNED_STATUS_OPTIONS: ShoppingOwnedStatus[] = [
  ShoppingOwnedStatus.StableUse,
  ShoppingOwnedStatus.ConsiderUpgrade,
  ShoppingOwnedStatus.NeedRestock,
  ShoppingOwnedStatus.MissingParts,
  ShoppingOwnedStatus.NeedComplete,
]

const SHOPPING_OWNED_STATUS_ALIASES: Record<string, ShoppingOwnedStatus> = {
  [ShoppingOwnedStatus.StableUse]: ShoppingOwnedStatus.StableUse,
  [ShoppingOwnedStatus.ConsiderUpgrade]: ShoppingOwnedStatus.ConsiderUpgrade,
  [ShoppingOwnedStatus.NeedRestock]: ShoppingOwnedStatus.NeedRestock,
  [ShoppingOwnedStatus.MissingParts]: ShoppingOwnedStatus.MissingParts,
  [ShoppingOwnedStatus.NeedComplete]: ShoppingOwnedStatus.NeedComplete,
  稳定使用: ShoppingOwnedStatus.StableUse,
  "In Stable Use": ShoppingOwnedStatus.StableUse,
  考虑升级: ShoppingOwnedStatus.ConsiderUpgrade,
  "Consider Upgrade": ShoppingOwnedStatus.ConsiderUpgrade,
  需要补货: ShoppingOwnedStatus.NeedRestock,
  "Need Restock": ShoppingOwnedStatus.NeedRestock,
  缺补件: ShoppingOwnedStatus.MissingParts,
  "Missing Parts": ShoppingOwnedStatus.MissingParts,
  需要补齐: ShoppingOwnedStatus.NeedComplete,
  "Need Completion": ShoppingOwnedStatus.NeedComplete,
}

export const FAST_DEPRECIATION = new Set<ShoppingDepreciation>([
  ShoppingDepreciation.VeryFast,
  ShoppingDepreciation.Fast,
])
// 注:PRIORITY_LEVELS 已删除 — 物品不再有 necessity 字段

const SYSTEM_ROW_ACTIVE_WEIGHT = 5 / 3
const SYSTEM_ROW_NEIGHBOR_WEIGHT = 2 / 3
const SYSTEM_ROW_EDGE_ACTIVE_WEIGHT = 1.4
const SYSTEM_ROW_EDGE_NEIGHBOR_WEIGHT = 0.6

export function getLifecycleCopy(
  t: TFunction,
): Record<ShoppingLifecycle, { title: string; detail: string }> {
  return {
    [ShoppingLifecycle.Consumable]: {
      title: t("shopping.lifecycle.consumables.title"),
      detail: t("shopping.lifecycle.consumables.detail"),
    },
    [ShoppingLifecycle.Durable]: {
      title: t("shopping.lifecycle.durables.title"),
      detail: t("shopping.lifecycle.durables.detail"),
    },
    [ShoppingLifecycle.Tool]: {
      title: t("shopping.lifecycle.tools.title"),
      detail: t("shopping.lifecycle.tools.detail"),
    },
    [ShoppingLifecycle.Emotional]: {
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
    // 注:necessity 维度已删除 — 物品不再有 necessity 字段
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

/** Translate a ShoppingSystem value through i18n, falling back to the raw Chinese value. */
export function systemDisplayName(system: ShoppingSystem, t: TFunction): string {
  return t(`shopping.enumNames.system.${system}`, system)
}

/** Translate a ShoppingStage value through i18n, falling back to the raw Chinese value. */
export function stageDisplayName(stage: ShoppingStage, t: TFunction): string {
  return t(`shopping.enumNames.stage.${stage}`, stage as string)
}

export function normalizeStageLikeValue(stage: string): ShoppingStage | string {
  const trimmedStage = stage.trim()
  return SHOPPING_STAGE_ALIASES[trimmedStage] ?? trimmedStage
}

export function normalizeStageLikeValues(stages: string[]): string[] {
  return stages.map((stage) => normalizeStageLikeValue(stage)).filter((stage) => Boolean(stage))
}

/** Normalize stage-like values to known ShoppingStage enum codes only. */
export function normalizeStageValues(stages: string[]): ShoppingStage[] {
  return Array.from(
    new Set(
      normalizeStageLikeValues(stages).filter((stage): stage is ShoppingStage =>
        SHOPPING_STAGE_OPTIONS.includes(stage as ShoppingStage),
      ),
    ),
  )
}

export function normalizeOwnedStatusValue(status: string): ShoppingOwnedStatus | string {
  const trimmedStatus = status.trim()
  return SHOPPING_OWNED_STATUS_ALIASES[trimmedStatus] ?? trimmedStatus
}

/** Translate a stage-like value, using i18n for known enum values and falling back to the raw text. */
export function stageLikeDisplayName(stage: string, t: TFunction): string {
  const normalizedStage = normalizeStageLikeValue(stage)

  if (SHOPPING_STAGE_OPTIONS.includes(normalizedStage as ShoppingStage)) {
    return stageDisplayName(normalizedStage as ShoppingStage, t)
  }

  return normalizedStage
}

// 注:needLevelDisplayName 已删除 — 物品不再有 necessity 字段

/** Translate a ShoppingLifecycle value through i18n, falling back to the raw Chinese value. */
export function lifecycleDisplayName(lc: ShoppingLifecycle, t: TFunction): string {
  return t(`shopping.enumNames.lifecycle.${lc}`, lc as string)
}

/** Translate a ShoppingDepreciation value through i18n, falling back to the raw Chinese value. */
export function depreciationDisplayName(dep: ShoppingDepreciation, t: TFunction): string {
  return t(`shopping.enumNames.depreciation.${dep}`, dep as string)
}

/** Translate an owned-item status through i18n, falling back to the raw status text. */
export function ownedStatusDisplayName(status: ShoppingOwnedStatus | string, t: TFunction): string {
  const normalizedStatus = normalizeOwnedStatusValue(status)

  if (SHOPPING_OWNED_STATUS_OPTIONS.includes(normalizedStatus as ShoppingOwnedStatus)) {
    return t(`shopping.enumNames.ownedStatus.${normalizedStatus}`, normalizedStatus)
  }

  return normalizedStatus
}

/** Translate a purchase lane ID to localized name, falling back to the stored title. */
export function laneDisplayName(laneId: string, fallback: string, t: TFunction): string {
  return t(`shopping.laneName.${laneId}`, fallback)
}
