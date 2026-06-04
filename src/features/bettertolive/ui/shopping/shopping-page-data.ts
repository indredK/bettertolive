import type {
  ShoppingDepreciation,
  ShoppingLifecycle,
  ShoppingNeedLevel,
  ShoppingOwnedItem,
  ShoppingPlanItem,
} from "@/features/bettertolive/types"
import { MONEY_FORMATTER } from "@/features/bettertolive/ui/shared/formatters"
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

export const LIFECYCLE_COPY: Record<
  ShoppingLifecycle,
  {
    title: string
    detail: string
  }
> = {
  消耗品: {
    title: "补货节奏",
    detail: "它会被用完，重点不是值不值，而是别让库存突然归零。",
  },
  耐用品: {
    title: "长期使用",
    detail: "它应该陪伴你很多年，判断重点是规格、频率和长期回报。",
  },
  工具: {
    title: "一次补齐",
    detail: "平时存在感很低，但少一个就会卡住，适合提前备好。",
  },
  情感物: {
    title: "单独对待",
    detail: "它不靠功能存在，不应该和别的物品用同一套淘汰逻辑。",
  },
}

export const OVERVIEW_DIMENSIONS = [
  {
    id: "system",
    title: "system",
    answer: "它在撑哪个生活功能？",
    detail: "睡眠、饮食、清洁、工作学习这类系统，帮助你先看缺口。",
    cue: "先确认它在补哪个生活缺口，再决定是不是现在要处理。",
  },
  {
    id: "space",
    title: "space",
    answer: "它放在哪？",
    detail: "卧室、书桌、厨房、玄关，帮助你按空间巡检。",
    cue: "把它放回真实空间里看，你会更容易发现缺件和重复购买。",
  },
  {
    id: "stage",
    title: "stage",
    answer: "当前阶段需要它吗？",
    detail: "搬家最低配、租房、长期居住、自有住房，对应不同深度。",
    cue: "先按当前居住阶段配齐，不要提前为下一阶段囤太多东西。",
  },
  {
    id: "necessity",
    title: "necessity",
    answer: "没有它会不会塌？",
    detail: "最低配置和必要项决定优先级，幸福感项留到基础更稳以后。",
    cue: "它帮你排先后顺序，把真正影响连续性的东西提到前面。",
  },
  {
    id: "lifecycle",
    title: "lifecycle",
    answer: "它以什么节奏出现？",
    detail: "消耗品补货、耐用品等好价、工具一次备齐、情感物单独对待。",
    cue: "同样都是需要，补货、等好价和一次备齐的下一步完全不同。",
  },
] as const

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
  return MONEY_FORMATTER.format(amount)
}

export function getPriceSignal(item: ShoppingPlanItem) {
  if (item.currentPrice <= item.buyBelowPrice) {
    return {
      label: "已进可买区间",
      className:
        "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]",
    }
  }

  if (item.currentPrice >= item.overpayPrice) {
    return {
      label: "当前偏贵",
      className:
        "border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]",
    }
  }

  return {
    label: "先观察",
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
