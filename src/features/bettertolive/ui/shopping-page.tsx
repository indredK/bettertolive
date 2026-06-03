import {
  AlertTriangle,
  CircleDollarSign,
  Gift,
  Heart,
  House,
  Package2,
  ShoppingBasket,
  Sparkles,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  ShoppingDepreciation,
  ShoppingLifecycle,
  ShoppingModuleData,
  ShoppingNeedLevel,
  ShoppingOwnedItem,
  ShoppingPlanItem,
  ShoppingSystem,
} from "@/features/bettertolive/types"
import { MONEY_FORMATTER } from "@/features/bettertolive/ui/formatters"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  SummarySurface,
  Surface,
} from "@/features/bettertolive/ui/shared"
import { cn } from "@/lib/utils"

type ShoppingPlanWithLane = ShoppingPlanItem & {
  laneId: string
  laneTitle: string
}

const NEED_LEVEL_STYLES: Record<ShoppingNeedLevel, string> = {
  最低配置:
    "border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]",
  必要: "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]",
  改善体验:
    "border-[color:var(--tone-past-border)] bg-[color:var(--tone-past-bg)] text-[color:var(--tone-past-ink)]",
  提升幸福感:
    "border-[color:var(--tone-future-border)] bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]",
}

const LIFECYCLE_STYLES: Record<ShoppingLifecycle, string> = {
  消耗品:
    "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-200",
  耐用品:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200",
  工具: "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200",
  情感物:
    "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-800/60 dark:bg-fuchsia-950/40 dark:text-fuchsia-200",
}

const DEPRECIATION_STYLES: Record<ShoppingDepreciation, string> = {
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

const FAST_DEPRECIATION = new Set<ShoppingDepreciation>(["极快折旧", "较快折旧"])
const PRIORITY_LEVELS = new Set<ShoppingNeedLevel>(["最低配置", "必要"])

const LIFECYCLE_COPY: Record<
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

function formatPrice(amount: number) {
  return MONEY_FORMATTER.format(amount)
}

function getOwnedStatusClass(status: ShoppingOwnedItem["status"]) {
  if (status.includes("稳定")) {
    return "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]"
  }

  if (status.includes("升级")) {
    return "border-[color:var(--tone-future-border)] bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]"
  }

  return "border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]"
}

function getPriceSignal(item: ShoppingPlanItem) {
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

function SystemChip({ system }: { system: ShoppingSystem }) {
  return (
    <Badge
      variant="outline"
      className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
    >
      {system}
    </Badge>
  )
}

function ShoppingPriceRow({
  label,
  value,
  compact = false,
}: {
  label: string
  value: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-t border-[color:var(--muted-surface-border)] py-2 first:border-t-0 first:pt-0 last:pb-0",
        compact && "py-1.5",
      )}
    >
      <span className={cn("text-xs text-[color:var(--text-muted)]", compact && "text-[11px]")}>
        {label}
      </span>
      <span
        className={cn(
          "text-sm font-medium text-[color:var(--text-primary)]",
          compact && "text-[13px]",
        )}
      >
        {value}
      </span>
    </div>
  )
}

function ChecklistBlock({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
        {title}
      </div>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-[color:var(--text-secondary)]">
          {items.map((item) => (
            <li
              key={item}
              className="border-t border-[color:var(--muted-surface-border)] py-2 first:border-t-0 first:pt-0 last:pb-0"
            >
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-[color:var(--text-muted)]">当前阶段暂时没有这一层。</p>
      )}
    </div>
  )
}

function ClassificationBadge({ label, className }: { label: string; className: string }) {
  return (
    <Badge variant="outline" className={className}>
      {label}
    </Badge>
  )
}

function CompactItemRow({
  item,
  sourceLabel,
}: {
  item: ShoppingOwnedItem | ShoppingPlanWithLane
  sourceLabel: string
}) {
  const isPlanItem = "currentPrice" in item

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-medium text-[color:var(--text-primary)]">{item.name}</h3>
        <ClassificationBadge label={item.necessity} className={NEED_LEVEL_STYLES[item.necessity]} />
        <ClassificationBadge label={item.lifecycle} className={LIFECYCLE_STYLES[item.lifecycle]} />
        {item.depreciation ? (
          <ClassificationBadge
            label={item.depreciation}
            className={DEPRECIATION_STYLES[item.depreciation]}
          />
        ) : null}
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {sourceLabel}
        </Badge>
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-xs text-[color:var(--text-muted)]">
        <span>{item.system}</span>
        <span>·</span>
        <span>{item.category}</span>
        <span>·</span>
        <span>{item.spaces.join(" / ")}</span>
        <span>·</span>
        <span>{item.stages.join(" / ")}</span>
      </div>

      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
        {isPlanItem ? item.reason : item.replacementCue}
      </p>
      <p className="mt-1 text-sm leading-6 text-[color:var(--text-muted)]">{item.note}</p>
    </div>
  )
}

function DimensionCard({
  title,
  answer,
  detail,
}: {
  title: string
  answer: string
  detail: string
}) {
  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3">
      <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
        {title}
      </div>
      <div className="mt-2 text-sm font-medium text-[color:var(--text-primary)]">{answer}</div>
      <p className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)]">{detail}</p>
    </div>
  )
}

function LifecycleLane({
  lifecycle,
  ownedCount,
  plannedCount,
  highlights,
}: {
  lifecycle: ShoppingLifecycle
  ownedCount: number
  plannedCount: number
  highlights: string[]
}) {
  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <ClassificationBadge label={lifecycle} className={LIFECYCLE_STYLES[lifecycle]} />
        <span className="text-sm font-medium text-[color:var(--text-primary)]">
          {LIFECYCLE_COPY[lifecycle].title}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
        {LIFECYCLE_COPY[lifecycle].detail}
      </p>
      <div className="mt-3 text-xs text-[color:var(--text-muted)]">
        已有 {ownedCount} 项 · 待看 {plannedCount} 项
      </div>
      {highlights.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {highlights.map((item) => (
            <Badge
              key={item}
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
            >
              {item}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-[color:var(--text-muted)]">当前筛选下还没有条目。</p>
      )}
    </div>
  )
}

function PurchaseDecisionCard({
  item,
  compact = false,
}: {
  item: ShoppingPlanWithLane
  compact?: boolean
}) {
  const signal = getPriceSignal(item)

  return (
    <div
      className={cn(
        "border-t border-[color:var(--muted-surface-border)] pt-5 first:border-t-0 first:pt-0",
        compact && "pt-4",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <h3
          className={cn(
            "text-base font-medium text-[color:var(--text-primary)]",
            compact && "text-sm",
          )}
        >
          {item.name}
        </h3>
        <ClassificationBadge label={item.necessity} className={NEED_LEVEL_STYLES[item.necessity]} />
        <ClassificationBadge label={item.lifecycle} className={LIFECYCLE_STYLES[item.lifecycle]} />
        {item.depreciation ? (
          <ClassificationBadge
            label={item.depreciation}
            className={DEPRECIATION_STYLES[item.depreciation]}
          />
        ) : null}
        <SystemChip system={item.system} />
        <ClassificationBadge label={signal.label} className={signal.className} />
      </div>

      <div className="mt-2 flex flex-wrap gap-2 text-xs text-[color:var(--text-muted)]">
        <span>{item.category}</span>
        <span>·</span>
        <span>{item.spaces.join(" / ")}</span>
        <span>·</span>
        <span>{item.stages.join(" / ")}</span>
      </div>

      <p
        className={cn(
          "mt-3 text-sm leading-6 text-[color:var(--text-secondary)]",
          compact && "mt-2 text-[13px] leading-5",
        )}
      >
        {item.reason}
      </p>
      <p
        className={cn(
          "mt-2 text-sm leading-6 text-[color:var(--text-muted)]",
          compact && "text-[13px] leading-5",
        )}
      >
        {item.note}
      </p>

      <div
        className={cn(
          "mt-4 grid gap-4 min-[960px]:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]",
          compact && "mt-3 gap-3",
        )}
      >
        <div className="space-y-2">
          <ShoppingPriceRow
            compact={compact}
            label="当前价格"
            value={formatPrice(item.currentPrice)}
          />
          <ShoppingPriceRow
            compact={compact}
            label="什么价格可以购入"
            value={`<= ${formatPrice(item.buyBelowPrice)}`}
          />
          <ShoppingPriceRow
            compact={compact}
            label="什么价格性价比低"
            value={`>= ${formatPrice(item.overpayPrice)}`}
          />
        </div>

        <div>
          <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
            相关提醒
          </div>
          <div className={cn("mt-3 flex flex-wrap gap-2", compact && "mt-2 gap-1.5")}>
            <Badge
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
            >
              {item.laneTitle}
            </Badge>
            <Badge
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
            >
              {item.targetLifestyle}
            </Badge>
            {item.tags.map((tag) => (
              <Badge
                key={tag}
                variant="outline"
                className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ShoppingPage({
  shopping,
  visibleCount,
  searchQuery,
  isWideLayout = false,
  isStackedLayout = false,
}: {
  shopping: ShoppingModuleData
  visibleCount: number
  searchQuery: string
  isWideLayout?: boolean
  isStackedLayout?: boolean
}) {
  const isFixedLayout = !isStackedLayout
  const planItems = shopping.purchaseLanes.flatMap((lane) =>
    lane.items.map((item) => ({
      ...item,
      laneId: lane.id,
      laneTitle: lane.title,
    })),
  )
  const activeSystems = shopping.systemDefinitions.map((definition) => {
    const owned = shopping.ownedItems.filter((item) => item.system === definition.id)
    const planned = planItems.filter((item) => item.system === definition.id)
    const spaces = Array.from(
      new Set([...owned.flatMap((item) => item.spaces), ...planned.flatMap((item) => item.spaces)]),
    )
    const urgentCount = planned.filter((item) => PRIORITY_LEVELS.has(item.necessity)).length

    return {
      ...definition,
      owned,
      planned,
      spaces,
      urgentCount,
      isActive: owned.length + planned.length > 0,
    }
  })
  const activeSystemCount = activeSystems.filter((item) => item.isActive).length
  const fastDepreciationWarnings = planItems.filter(
    (item) =>
      item.depreciation &&
      FAST_DEPRECIATION.has(item.depreciation) &&
      item.necessity === "提升幸福感",
  )
  const worthBuyingSlowly = planItems.filter(
    (item) => item.depreciation === "慢折旧" && item.necessity !== "提升幸福感",
  )
  const lifecycleGroups: Record<
    ShoppingLifecycle,
    { owned: ShoppingOwnedItem[]; planned: ShoppingPlanWithLane[] }
  > = {
    消耗品: { owned: [], planned: [] },
    耐用品: { owned: [], planned: [] },
    工具: { owned: [], planned: [] },
    情感物: { owned: [], planned: [] },
  }

  shopping.ownedItems.forEach((item) => {
    lifecycleGroups[item.lifecycle].owned.push(item)
  })
  planItems.forEach((item) => {
    lifecycleGroups[item.lifecycle].planned.push(item)
  })

  const spaceMap = new Map<
    string,
    {
      name: string
      owned: ShoppingOwnedItem[]
      planned: ShoppingPlanWithLane[]
      systems: Set<ShoppingSystem>
    }
  >()

  shopping.ownedItems.forEach((item) => {
    item.spaces.forEach((space) => {
      const current = spaceMap.get(space) ?? {
        name: space,
        owned: [],
        planned: [],
        systems: new Set<ShoppingSystem>(),
      }
      current.owned.push(item)
      current.systems.add(item.system)
      spaceMap.set(space, current)
    })
  })

  planItems.forEach((item) => {
    item.spaces.forEach((space) => {
      const current = spaceMap.get(space) ?? {
        name: space,
        owned: [],
        planned: [],
        systems: new Set<ShoppingSystem>(),
      }
      current.planned.push(item)
      current.systems.add(item.system)
      spaceMap.set(space, current)
    })
  })

  const spaces = Array.from(spaceMap.values()).sort(
    (left, right) =>
      right.owned.length + right.planned.length - (left.owned.length + left.planned.length),
  )
  const overlookedCollection = shopping.lifestyleCollections.find(
    (collection) => collection.id === "collection-overlooked",
  )
  const featuredCollections = shopping.lifestyleCollections.filter(
    (collection) => collection.id !== "collection-overlooked",
  )
  const priorityItems = planItems.filter((item) => PRIORITY_LEVELS.has(item.necessity))

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <PageIntro
        eyebrow="生活物品"
        title="生活物品分类工作台"
        description="先用只读方式把分类体系立起来，再决定以后要不要做录入和操作。"
        searchQuery={searchQuery}
      />

      <div
        className={cn(
          "grid gap-4 min-[960px]:grid-cols-2 min-[1440px]:grid-cols-4",
          isFixedLayout && "shrink-0",
          isWideLayout && "gap-3",
        )}
      >
        <SummarySurface
          tone="present"
          title="系统覆盖"
          value={`${activeSystemCount} / ${shopping.systemDefinitions.length} 个系统`}
          detail="先看生活哪些系统已经有条目，哪些还只是模糊感受。"
          compact={isWideLayout}
        />
        <SummarySurface
          tone="value"
          title="必要缺口"
          value={`${priorityItems.length} 条`}
          detail="最低配置和必要项是当前最真实的待补清单。"
          compact={isWideLayout}
        />
        <SummarySurface
          tone="past"
          title="采购判断"
          value={`${visibleCount} 条`}
          detail="先把立即补齐、等好价和先不买分开，再把动作节奏放回生命周期里看。"
          compact={isWideLayout}
        />
        <SummarySurface
          tone="future"
          title="折旧提醒"
          value={`${fastDepreciationWarnings.length} 条`}
          detail="depreciation 只服务单件决策，尤其用来拦住高折旧的幸福感消费。"
          compact={isWideLayout}
        />
      </div>

      <Tabs
        defaultValue="overview"
        className={cn(
          "gap-4",
          isFixedLayout && "min-h-0 flex-1 overflow-hidden",
          isWideLayout && "gap-3",
        )}
      >
        <TabsList
          variant="line"
          className={cn(
            "flex w-full flex-wrap items-center gap-1 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-1",
            isFixedLayout && "shrink-0",
            isWideLayout && "gap-0.5 p-0.5",
          )}
        >
          <TabsTrigger
            value="overview"
            className={cn("px-3", isWideLayout && "px-2.5 text-[13px]")}
          >
            <AlertTriangle />
            总览
          </TabsTrigger>
          <TabsTrigger value="systems" className={cn("px-3", isWideLayout && "px-2.5 text-[13px]")}>
            <Package2 />
            系统地图
          </TabsTrigger>
          <TabsTrigger value="spaces" className={cn("px-3", isWideLayout && "px-2.5 text-[13px]")}>
            <House />
            空间巡检
          </TabsTrigger>
          <TabsTrigger value="stages" className={cn("px-3", isWideLayout && "px-2.5 text-[13px]")}>
            <Sparkles />
            阶段模板
          </TabsTrigger>
          <TabsTrigger
            value="planning"
            className={cn("px-3", isWideLayout && "px-2.5 text-[13px]")}
          >
            <ShoppingBasket />
            采购决策
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          className={cn("space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          <div
            className={cn(
              "grid gap-4 min-[1320px]:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]",
              isFixedLayout && "h-full min-h-0 flex-1 overflow-hidden",
            )}
          >
            <div
              className={cn("space-y-4", isFixedLayout && "h-full min-h-0 overflow-y-auto pr-1")}
            >
              <Surface className="p-5">
                <SectionHeading
                  compact={isWideLayout}
                  icon={Package2}
                  title="先按生活系统看，不按东西是什么看"
                  description="购物模块先不做录入和按钮，先把 5 维分类立起来：system、space、stage、necessity、lifecycle。depreciation 只跟着单件决策走，不进入主分组。"
                />

                <div className="mt-5 grid gap-3 min-[960px]:grid-cols-2 min-[1320px]:grid-cols-5">
                  <DimensionCard
                    title="system"
                    answer="它在撑哪个生活功能？"
                    detail="睡眠、饮食、清洁、工作学习这类系统，帮助你先看缺口。"
                  />
                  <DimensionCard
                    title="space"
                    answer="它放在哪？"
                    detail="卧室、书桌、厨房、玄关，帮助你按空间巡检。"
                  />
                  <DimensionCard
                    title="stage"
                    answer="当前阶段需要它吗？"
                    detail="搬家最低配、租房、长期居住、自有住房，对应不同深度。"
                  />
                  <DimensionCard
                    title="necessity"
                    answer="没有它会不会塌？"
                    detail="最低配置和必要项决定优先级，幸福感项留到基础更稳以后。"
                  />
                  <DimensionCard
                    title="lifecycle"
                    answer="它以什么节奏出现？"
                    detail="消耗品补货、耐用品等好价、工具一次备齐、情感物单独对待。"
                  />
                </div>
              </Surface>

              <Surface className="p-5">
                <SectionHeading
                  compact={isWideLayout}
                  icon={AlertTriangle}
                  title="当前该先看什么"
                  description="这些不是随机想法，而是从系统缺口、动作节奏和购买判断里冒出来的提醒。"
                />

                <div className="mt-5 space-y-4">
                  {shopping.spotlights.length > 0 ? (
                    shopping.spotlights.map((spotlight) => (
                      <div
                        key={spotlight.id}
                        className="border-t border-[color:var(--muted-surface-border)] pt-4 first:border-t-0 first:pt-0"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-sm font-medium text-[color:var(--text-primary)]">
                            {spotlight.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                          >
                            {spotlight.stage}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                          {spotlight.summary}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[color:var(--text-muted)]">
                          {spotlight.reason}
                        </p>
                        <ul className="mt-3 space-y-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                          {spotlight.attention.map((entry) => (
                            <li key={entry}>{entry}</li>
                          ))}
                        </ul>
                      </div>
                    ))
                  ) : (
                    <EmptyState message="当前筛选下没有需要注意的系统提醒。" />
                  )}
                </div>
              </Surface>

              <div className="grid gap-4 min-[1280px]:grid-cols-3">
                {featuredCollections.map((collection) => {
                  const icon =
                    collection.id === "collection-gifts"
                      ? Gift
                      : collection.id === "collection-happiness"
                        ? Heart
                        : Sparkles

                  return (
                    <Surface key={collection.id} className="p-5">
                      <SectionHeading
                        compact={isWideLayout}
                        icon={icon}
                        title={collection.title}
                        description={collection.description}
                      />
                      <div className="mt-5 space-y-3 text-sm leading-6 text-[color:var(--text-secondary)]">
                        {collection.items.map((item) => (
                          <div
                            key={item}
                            className="border-t border-[color:var(--muted-surface-border)] py-3 first:border-t-0 first:pt-0 last:pb-0"
                          >
                            {item}
                          </div>
                        ))}
                      </div>
                    </Surface>
                  )
                })}
              </div>
            </div>

            <div
              className={cn("space-y-4", isFixedLayout && "h-full min-h-0 overflow-y-auto pr-1")}
            >
              <Surface className="p-5">
                <SectionHeading
                  compact={isWideLayout}
                  icon={Package2}
                  title="动作节奏"
                  description="同样都是“需要”，但下一步完全不同：补货、等好价、一次备齐，还是别乱动。"
                />

                <div className="mt-5 grid gap-3 min-[1260px]:grid-cols-2">
                  {(Object.keys(lifecycleGroups) as ShoppingLifecycle[]).map((lifecycle) => (
                    <LifecycleLane
                      key={lifecycle}
                      lifecycle={lifecycle}
                      ownedCount={lifecycleGroups[lifecycle].owned.length}
                      plannedCount={lifecycleGroups[lifecycle].planned.length}
                      highlights={[
                        ...lifecycleGroups[lifecycle].owned.slice(0, 2).map((item) => item.name),
                        ...lifecycleGroups[lifecycle].planned.slice(0, 2).map((item) => item.name),
                      ]}
                    />
                  ))}
                </div>
              </Surface>

              <Surface className="p-5">
                <SectionHeading
                  compact={isWideLayout}
                  icon={CircleDollarSign}
                  title="折旧提醒"
                  description="depreciation 不是第 6 个分类维度，而是单件决策时用来提醒自己的东西。"
                />

                <div className="mt-5 space-y-4">
                  <div>
                    <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                      幸福感 + 高折旧
                    </div>
                    {fastDepreciationWarnings.length > 0 ? (
                      <div className="mt-3 space-y-3">
                        {fastDepreciationWarnings.map((item) => (
                          <CompactItemRow key={item.id} item={item} sourceLabel={item.laneTitle} />
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-[color:var(--text-muted)]">
                        当前筛选下没有需要额外冷静的高折旧幸福感物品。
                      </p>
                    )}
                  </div>

                  <div className="border-t border-[color:var(--muted-surface-border)] pt-4">
                    <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                      值得慢慢买好的
                    </div>
                    {worthBuyingSlowly.length > 0 ? (
                      <div className="mt-3 space-y-3">
                        {worthBuyingSlowly.slice(0, 3).map((item) => (
                          <CompactItemRow key={item.id} item={item} sourceLabel={item.laneTitle} />
                        ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-[color:var(--text-muted)]">
                        当前筛选下没有慢折旧的长期件建议。
                      </p>
                    )}
                  </div>
                </div>
              </Surface>

              <Surface className="p-5">
                <SectionHeading
                  compact={isWideLayout}
                  icon={AlertTriangle}
                  title="容易漏掉的基础件"
                  description="很多生活崩溃感，不是来自大件没买，而是小而基础的东西长期缺位。"
                />

                {overlookedCollection ? (
                  <ul className="mt-5 space-y-3 text-sm leading-6 text-[color:var(--text-secondary)]">
                    {overlookedCollection.items.map((item) => (
                      <li
                        key={item}
                        className="border-t border-[color:var(--muted-surface-border)] py-3 first:border-t-0 first:pt-0 last:pb-0"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <EmptyState message="当前筛选下没有基础提醒。" compact />
                )}
              </Surface>
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="systems"
          className={cn("space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          <Surface className={cn("p-5", isFixedLayout && "flex h-full min-h-0 flex-col")}>
            <SectionHeading
              compact={isWideLayout}
              icon={Package2}
              title="14 个生活系统"
              description="先按 system 看缺口，比按“它是什么东西”更能推动下一步。没有被生活激活的系统先留空，不必提前展开。"
            />

            <div
              className={cn(
                "mt-5 grid gap-4 min-[1260px]:grid-cols-2",
                isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1",
              )}
            >
              {activeSystems.length > 0 ? (
                activeSystems.map((definition) => (
                  <div
                    key={definition.id}
                    className={cn(
                      "rounded-lg border px-4 py-4",
                      definition.isActive
                        ? "border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]"
                        : "border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)]",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-sm font-medium text-[color:var(--text-primary)]">
                        {definition.id.slice(0, 1)}
                      </div>
                      <h3 className="text-sm font-medium text-[color:var(--text-primary)]">
                        {definition.id}
                      </h3>
                      <Badge
                        variant="outline"
                        className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                      >
                        {definition.cluster}
                      </Badge>
                      {definition.urgentCount > 0 ? (
                        <Badge
                          variant="outline"
                          className="border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]"
                        >
                          待补 {definition.urgentCount} 条
                        </Badge>
                      ) : null}
                    </div>

                    <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
                      {definition.summary}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                      核心问题：{definition.keyQuestion}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      {definition.secondaryGroups.map((group) => (
                        <Badge
                          key={group}
                          variant="outline"
                          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
                        >
                          {group}
                        </Badge>
                      ))}
                    </div>

                    {definition.isActive ? (
                      <div className="mt-4 grid gap-4 min-[960px]:grid-cols-2">
                        <div>
                          <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                            已有 {definition.owned.length} 项
                          </div>
                          {definition.owned.length > 0 ? (
                            <div className="mt-3 space-y-2">
                              {definition.owned.slice(0, 3).map((item) => (
                                <div
                                  key={item.id}
                                  className="border-t border-[color:var(--muted-surface-border)] py-2 first:border-t-0 first:pt-0 last:pb-0"
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium text-[color:var(--text-primary)]">
                                      {item.name}
                                    </span>
                                    <Badge
                                      variant="outline"
                                      className={getOwnedStatusClass(item.status)}
                                    >
                                      {item.status}
                                    </Badge>
                                  </div>
                                  <div className="mt-1 text-xs text-[color:var(--text-muted)]">
                                    {item.category} · {item.spaces.join(" / ")}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm text-[color:var(--text-muted)]">
                              当前还没有已拥有条目。
                            </p>
                          )}
                        </div>

                        <div>
                          <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                            待补 {definition.planned.length} 项
                          </div>
                          {definition.planned.length > 0 ? (
                            <div className="mt-3 space-y-2">
                              {definition.planned.slice(0, 3).map((item) => (
                                <div
                                  key={item.id}
                                  className="border-t border-[color:var(--muted-surface-border)] py-2 first:border-t-0 first:pt-0 last:pb-0"
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-sm font-medium text-[color:var(--text-primary)]">
                                      {item.name}
                                    </span>
                                    <ClassificationBadge
                                      label={item.necessity}
                                      className={NEED_LEVEL_STYLES[item.necessity]}
                                    />
                                  </div>
                                  <div className="mt-1 text-xs text-[color:var(--text-muted)]">
                                    {item.category} · {item.laneTitle}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-3 text-sm text-[color:var(--text-muted)]">
                              当前没有待补条目。
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm leading-6 text-[color:var(--text-muted)]">
                        这个系统暂时还没有被当前数据激活，先留空，等生活真的需要它时再展开。
                      </p>
                    )}

                    {definition.spaces.length > 0 ? (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {definition.spaces.map((space) => (
                          <Badge
                            key={space}
                            variant="outline"
                            className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
                          >
                            {space}
                          </Badge>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))
              ) : (
                <EmptyState message="当前筛选下没有系统地图数据。" />
              )}
            </div>
          </Surface>
        </TabsContent>

        <TabsContent
          value="spaces"
          className={cn("space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          <div
            className={cn(
              "grid gap-4 min-[1260px]:grid-cols-2",
              isFixedLayout && "h-full min-h-0 content-start overflow-y-auto pr-1",
            )}
          >
            {spaces.length > 0 ? (
              spaces.map((space) => (
                <Surface key={space.name} className="p-5">
                  <SectionHeading
                    compact={isWideLayout}
                    icon={House}
                    title={space.name}
                    description="按 space 看，最容易发现“好像东西很多，但总觉得缺”的真实原因。"
                  />

                  <div className="mt-4 flex flex-wrap gap-2">
                    {Array.from(space.systems).map((system) => (
                      <SystemChip key={system} system={system} />
                    ))}
                  </div>

                  <div className="mt-5 grid gap-4 min-[960px]:grid-cols-2">
                    <div>
                      <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                        已有 {space.owned.length} 项
                      </div>
                      {space.owned.length > 0 ? (
                        <div className="mt-3 space-y-3">
                          {space.owned.map((item) => (
                            <CompactItemRow key={item.id} item={item} sourceLabel="已拥有" />
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-[color:var(--text-muted)]">
                          当前没有已拥有条目。
                        </p>
                      )}
                    </div>

                    <div>
                      <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                        待补 {space.planned.length} 项
                      </div>
                      {space.planned.length > 0 ? (
                        <div className="mt-3 space-y-3">
                          {space.planned.map((item) => (
                            <CompactItemRow
                              key={item.id}
                              item={item}
                              sourceLabel={item.laneTitle}
                            />
                          ))}
                        </div>
                      ) : (
                        <p className="mt-3 text-sm text-[color:var(--text-muted)]">
                          当前没有待补条目。
                        </p>
                      )}
                    </div>
                  </div>
                </Surface>
              ))
            ) : (
              <EmptyState message="当前筛选下没有空间视角数据。" />
            )}
          </div>
        </TabsContent>

        <TabsContent
          value="stages"
          className={cn("space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          <div
            className={cn(
              "grid gap-4 min-[1320px]:grid-cols-2",
              isFixedLayout && "h-full min-h-0 content-start overflow-y-auto pr-1",
            )}
          >
            {shopping.stageChecklists.length > 0 ? (
              shopping.stageChecklists.map((checklist) => (
                <Surface key={checklist.id} className={cn("p-5", isWideLayout && "p-4")}>
                  <SectionHeading
                    compact={isWideLayout}
                    icon={Sparkles}
                    title={checklist.title}
                    description={checklist.description}
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge
                      variant="outline"
                      className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                    >
                      {checklist.stage}
                    </Badge>
                  </div>

                  <p
                    className={cn(
                      "mt-4 text-sm leading-6 text-[color:var(--text-muted)]",
                      isWideLayout && "text-[13px] leading-5",
                    )}
                  >
                    {checklist.focus}
                  </p>

                  <div className="mt-5 space-y-4">
                    {checklist.sections.map((section) => (
                      <div
                        key={`${checklist.id}-${section.system}`}
                        className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                      >
                        <div className="flex items-center gap-2">
                          <SystemChip system={section.system} />
                        </div>
                        <div className="mt-4 grid gap-4 min-[960px]:grid-cols-3">
                          <ChecklistBlock title="最低配置" items={section.minimum} />
                          <ChecklistBlock title="必要物品" items={section.essentials} />
                          <ChecklistBlock title="之后再升级" items={section.upgrades} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Surface>
              ))
            ) : (
              <EmptyState message="当前筛选下没有阶段模板。" />
            )}
          </div>
        </TabsContent>

        <TabsContent
          value="planning"
          className={cn("space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          <div
            className={cn(
              "grid gap-4 min-[1400px]:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.8fr)]",
              isFixedLayout && "h-full min-h-0",
            )}
          >
            <div className={cn("space-y-4", isFixedLayout && "min-h-0 overflow-y-auto pr-1")}>
              {shopping.purchaseLanes.map((lane) => (
                <Surface key={lane.id} className={cn("p-5", isWideLayout && "p-4")}>
                  <SectionHeading
                    compact={isWideLayout}
                    icon={ShoppingBasket}
                    title={lane.title}
                    description={lane.subtitle}
                  />

                  <div className={cn("mt-5 space-y-5", isWideLayout && "mt-4 space-y-4")}>
                    {lane.items.length > 0 ? (
                      lane.items.map((item) => (
                        <PurchaseDecisionCard
                          key={item.id}
                          item={{ ...item, laneId: lane.id, laneTitle: lane.title }}
                          compact={isWideLayout}
                        />
                      ))
                    ) : (
                      <EmptyState message={`当前筛选下，${lane.title} 暂时没有条目。`} compact />
                    )}
                  </div>
                </Surface>
              ))}
            </div>

            <div className={cn("space-y-4", isFixedLayout && "min-h-0 overflow-y-auto pr-1")}>
              <Surface className={cn("p-5", isWideLayout && "p-4")}>
                <SectionHeading
                  compact={isWideLayout}
                  icon={CircleDollarSign}
                  title="价格参考"
                  description="这里不是绝对标准，而是帮你形成自己的价格感，并把 system、lifecycle、depreciation 放回同一张决策卡里。"
                />

                <div className="mt-5">
                  {shopping.priceReferences.length > 0 ? (
                    <Table className={cn(isWideLayout && "text-[13px]")}>
                      <TableHeader>
                        <TableRow className="border-[color:var(--muted-surface-border)]">
                          <TableHead className={cn(isWideLayout && "h-8 text-xs")}>类别</TableHead>
                          <TableHead className={cn(isWideLayout && "h-8 text-xs")}>系统</TableHead>
                          <TableHead className={cn(isWideLayout && "h-8 text-xs")}>
                            入门价
                          </TableHead>
                          <TableHead className={cn(isWideLayout && "h-8 text-xs")}>
                            舒服区间
                          </TableHead>
                          <TableHead className={cn(isWideLayout && "h-8 text-xs")}>偏贵</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {shopping.priceReferences.map((entry) => (
                          <TableRow
                            key={entry.id}
                            className="border-[color:var(--muted-surface-border)]"
                          >
                            <TableCell
                              className={cn(
                                "font-medium whitespace-normal text-[color:var(--text-primary)]",
                                isWideLayout && "py-1.5",
                              )}
                            >
                              <div>{entry.category}</div>
                              <div className="mt-1 flex flex-wrap gap-1.5">
                                <ClassificationBadge
                                  label={entry.lifecycle}
                                  className={LIFECYCLE_STYLES[entry.lifecycle]}
                                />
                                {entry.depreciation ? (
                                  <ClassificationBadge
                                    label={entry.depreciation}
                                    className={DEPRECIATION_STYLES[entry.depreciation]}
                                  />
                                ) : null}
                              </div>
                              <div
                                className={cn(
                                  "mt-2 text-xs leading-5 text-[color:var(--text-muted)]",
                                  isWideLayout && "text-[11px]",
                                )}
                              >
                                {entry.note}
                              </div>
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-[color:var(--text-secondary)]",
                                isWideLayout && "py-1.5",
                              )}
                            >
                              {entry.system}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-[color:var(--text-secondary)]",
                                isWideLayout && "py-1.5",
                              )}
                            >
                              {formatPrice(entry.entryPrice)}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-[color:var(--text-secondary)]",
                                isWideLayout && "py-1.5",
                              )}
                            >
                              {formatPrice(entry.sweetSpotPrice)}
                            </TableCell>
                            <TableCell
                              className={cn(
                                "text-[color:var(--text-secondary)]",
                                isWideLayout && "py-1.5",
                              )}
                            >
                              {formatPrice(entry.overpayPrice)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <EmptyState message="当前筛选下没有价格参考。" />
                  )}
                </div>
              </Surface>

              <Surface className={cn("p-5", isWideLayout && "p-4")}>
                <SectionHeading
                  compact={isWideLayout}
                  icon={AlertTriangle}
                  title="当前最真实的待补清单"
                  description="把最低配置和必要项单独拎出来，能防止幸福感物品遮住真正的系统缺口。"
                />

                {priorityItems.length > 0 ? (
                  <div className="mt-5 space-y-3">
                    {priorityItems.map((item) => (
                      <CompactItemRow key={item.id} item={item} sourceLabel={item.laneTitle} />
                    ))}
                  </div>
                ) : (
                  <EmptyState message="当前筛选下没有必要缺口。" compact />
                )}
              </Surface>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
