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
  ShoppingModuleData,
  ShoppingNeedLevel,
  ShoppingOwnedItem,
  ShoppingPlanItem,
} from "@/features/bettertolive/types"
import { MONEY_FORMATTER } from "@/features/bettertolive/ui/formatters"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  SummarySurface,
  Surface,
} from "@/features/bettertolive/ui/shared"

const NEED_LEVEL_STYLES: Record<ShoppingNeedLevel, string> = {
  最低配置:
    "border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]",
  必要: "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]",
  改善体验:
    "border-[color:var(--tone-past-border)] bg-[color:var(--tone-past-bg)] text-[color:var(--tone-past-ink)]",
  提升幸福感:
    "border-[color:var(--tone-future-border)] bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]",
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

function formatPrice(amount: number) {
  return MONEY_FORMATTER.format(amount)
}

function ShoppingPriceRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[color:var(--muted-surface-border)] py-2 first:border-t-0 first:pt-0 last:pb-0">
      <span className="text-xs text-[color:var(--text-muted)]">{label}</span>
      <span className="text-sm font-medium text-[color:var(--text-primary)]">
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
    </div>
  )
}

export function ShoppingPage({
  shopping,
  visibleCount,
  searchQuery,
}: {
  shopping: ShoppingModuleData
  visibleCount: number
  searchQuery: string
}) {
  const immediateItems =
    shopping.purchaseLanes.find((lane) => lane.id === "buy-now")?.items ?? []
  const ownedAttentionItems = shopping.ownedItems.filter(
    (item) => !item.status.includes("稳定"),
  )
  const overlookedCollection = shopping.lifestyleCollections.find(
    (collection) => collection.id === "collection-overlooked",
  )
  const coreLifestyleCollections = shopping.lifestyleCollections.filter(
    (collection) => collection.id !== "collection-overlooked",
  )

  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="生活物品"
        title="让物品、阶段和理想生活放到同一张桌上"
        description="这里先不做录入和操作，先把你已经有什么、当前最缺什么、不同阶段需要什么，以及什么价格才值得买，全部放进一个能看清的页面。"
        searchQuery={searchQuery}
      />

      <div className="grid gap-4 min-[960px]:grid-cols-2 min-[1440px]:grid-cols-4">
        <SummarySurface
          tone="value"
          title="当前关注"
          value={`${shopping.spotlights.length} 个主题`}
          detail="先看最近最容易被忽略但会持续影响生活质量的缺口。"
        />
        <SummarySurface
          tone="present"
          title="已有物品"
          value={`${shopping.ownedItems.length} 项`}
          detail="不是只看买什么，也要看已有的东西是否真的撑得住生活。"
        />
        <SummarySurface
          tone="future"
          title="采购决策"
          value={`${visibleCount} 条`}
          detail="把立即补齐、等好价和先不买明确分开，冲动会少很多。"
        />
        <SummarySurface
          tone="past"
          title="阶段模板"
          value={`${shopping.stageChecklists.length} 份`}
          detail="搬家、租房、安家到自建房，关注点不该混在一起。"
        />
      </div>

      <Tabs defaultValue="overview" className="gap-4">
        <TabsList
          variant="line"
          className="flex w-full flex-wrap items-center gap-1 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-1"
        >
          <TabsTrigger value="overview" className="px-3">
            总览
          </TabsTrigger>
          <TabsTrigger value="inventory" className="px-3">
            我的东西
          </TabsTrigger>
          <TabsTrigger value="planning" className="px-3">
            采购决策
          </TabsTrigger>
          <TabsTrigger value="stages" className="px-3">
            阶段清单
          </TabsTrigger>
          <TabsTrigger value="lifestyle" className="px-3">
            理想生活
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.18fr)_minmax(360px,0.82fr)]">
            <Surface className="p-5">
              <SectionHeading
                icon={AlertTriangle}
                title="现在最值得先看的缺口"
                description="不是所有想买都该现在买，先看哪些事情已经开始影响现实生活。"
              />

              <div className="mt-5 space-y-5">
                {shopping.spotlights.length > 0 ? (
                  shopping.spotlights.map((spotlight) => (
                    <div
                      key={spotlight.id}
                      className="border-t border-[color:var(--muted-surface-border)] pt-5 first:border-t-0 first:pt-0"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-medium text-[color:var(--text-primary)]">
                          {spotlight.title}
                        </h3>
                        <Badge
                          variant="outline"
                          className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                        >
                          {spotlight.stage}
                        </Badge>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
                        {spotlight.summary}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
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
                  <EmptyState message="当前筛选下没有需要关注的主题。" />
                )}
              </div>
            </Surface>

            <div className="space-y-4">
              <Surface className="p-5">
                <SectionHeading
                  icon={ShoppingBasket}
                  title="当前最需要补齐"
                  description="这里放的是已经足够接近真实缺口的东西。"
                />

                <div className="mt-5 space-y-4">
                  {immediateItems.length > 0 ? (
                    immediateItems.map((item) => {
                      const signal = getPriceSignal(item)

                      return (
                        <div
                          key={item.id}
                          className="border-t border-[color:var(--muted-surface-border)] pt-4 first:border-t-0 first:pt-0"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-sm font-medium text-[color:var(--text-primary)]">
                              {item.name}
                            </h3>
                            <Badge
                              variant="outline"
                              className={NEED_LEVEL_STYLES[item.necessity]}
                            >
                              {item.necessity}
                            </Badge>
                            <Badge
                              variant="outline"
                              className={signal.className}
                            >
                              {signal.label}
                            </Badge>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                            {item.reason}
                          </p>
                          <div className="mt-3">
                            <ShoppingPriceRow
                              label="当前价格"
                              value={formatPrice(item.currentPrice)}
                            />
                            <ShoppingPriceRow
                              label="可买入"
                              value={`<= ${formatPrice(item.buyBelowPrice)}`}
                            />
                            <ShoppingPriceRow
                              label="偏贵"
                              value={`>= ${formatPrice(item.overpayPrice)}`}
                            />
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <EmptyState message="当前筛选下没有立即补齐项。" compact />
                  )}
                </div>
              </Surface>

              <Surface className="p-5">
                <SectionHeading
                  icon={House}
                  title="别漏掉的基础件"
                  description="很多生活崩溃感不是大件不够，而是基础件一直没建起来。"
                />

                <div className="mt-5">
                  {overlookedCollection ? (
                    <ul className="space-y-3 text-sm leading-6 text-[color:var(--text-secondary)]">
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
                </div>
              </Surface>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <div className="grid gap-4 min-[1360px]:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.84fr)]">
            <Surface className="p-5">
              <SectionHeading
                icon={Package2}
                title="我现在有什么"
                description="已有物品不是背景噪音，它们构成了现在的生活底盘。"
              />

              <div className="mt-5">
                {shopping.ownedItems.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[color:var(--muted-surface-border)]">
                        <TableHead>物品</TableHead>
                        <TableHead>分类</TableHead>
                        <TableHead>空间</TableHead>
                        <TableHead>数量</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="whitespace-normal">
                          备注
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shopping.ownedItems.map((item) => (
                        <TableRow
                          key={item.id}
                          className="border-[color:var(--muted-surface-border)]"
                        >
                          <TableCell className="font-medium text-[color:var(--text-primary)]">
                            {item.name}
                          </TableCell>
                          <TableCell className="text-[color:var(--text-secondary)]">
                            {item.category}
                          </TableCell>
                          <TableCell className="text-[color:var(--text-secondary)]">
                            {item.space}
                          </TableCell>
                          <TableCell className="text-[color:var(--text-secondary)]">
                            {item.quantity} 件
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getOwnedStatusClass(item.status)}
                            >
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[28rem] text-sm leading-6 whitespace-normal text-[color:var(--text-muted)]">
                            {item.note}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState message="当前筛选下没有已有物品。" />
                )}
              </div>
            </Surface>

            <Surface className="p-5">
              <SectionHeading
                icon={Sparkles}
                title="已有但需要关注"
                description="不一定是坏了，而是它们已经在提醒你该补件、升级或重新布置。"
              />

              <div className="mt-5 space-y-4">
                {ownedAttentionItems.length > 0 ? (
                  ownedAttentionItems.map((item) => (
                    <div
                      key={item.id}
                      className="border-t border-[color:var(--muted-surface-border)] pt-4 first:border-t-0 first:pt-0"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-medium text-[color:var(--text-primary)]">
                          {item.name}
                        </h3>
                        <Badge
                          variant="outline"
                          className={getOwnedStatusClass(item.status)}
                        >
                          {item.status}
                        </Badge>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                        {item.replacementCue}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                        {item.note}
                      </p>
                    </div>
                  ))
                ) : (
                  <EmptyState
                    message="当前筛选下没有需要关注的已有物品。"
                    compact
                  />
                )}
              </div>
            </Surface>
          </div>
        </TabsContent>

        <TabsContent value="planning" className="space-y-4">
          <div className="grid gap-4 min-[1400px]:grid-cols-[minmax(0,1.5fr)_minmax(340px,0.82fr)]">
            <div className="space-y-4">
              {shopping.purchaseLanes.map((lane) => (
                <Surface key={lane.id} className="p-5">
                  <SectionHeading
                    icon={ShoppingBasket}
                    title={lane.title}
                    description={lane.subtitle}
                  />

                  <div className="mt-5 space-y-5">
                    {lane.items.length > 0 ? (
                      lane.items.map((item) => {
                        const signal = getPriceSignal(item)

                        return (
                          <div
                            key={item.id}
                            className="border-t border-[color:var(--muted-surface-border)] pt-5 first:border-t-0 first:pt-0"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-base font-medium text-[color:var(--text-primary)]">
                                {item.name}
                              </h3>
                              <Badge
                                variant="outline"
                                className={NEED_LEVEL_STYLES[item.necessity]}
                              >
                                {item.necessity}
                              </Badge>
                              <Badge
                                variant="outline"
                                className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                              >
                                {item.category}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={signal.className}
                              >
                                {signal.label}
                              </Badge>
                            </div>

                            <div className="mt-2 flex flex-wrap gap-2 text-xs text-[color:var(--text-muted)]">
                              <span>{item.stage}</span>
                              <span>·</span>
                              <span>{item.space}</span>
                              <span>·</span>
                              <span>{item.targetLifestyle}</span>
                            </div>

                            <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
                              {item.reason}
                            </p>
                            <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                              {item.note}
                            </p>

                            <div className="mt-4 grid gap-4 min-[960px]:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                              <div className="space-y-2">
                                <ShoppingPriceRow
                                  label="当前价格"
                                  value={formatPrice(item.currentPrice)}
                                />
                                <ShoppingPriceRow
                                  label="什么价格可以购入"
                                  value={`<= ${formatPrice(item.buyBelowPrice)}`}
                                />
                                <ShoppingPriceRow
                                  label="什么价格性价比低"
                                  value={`>= ${formatPrice(item.overpayPrice)}`}
                                />
                              </div>

                              <div>
                                <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                                  相关提醒
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
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
                      })
                    ) : (
                      <EmptyState
                        message={`当前筛选下，${lane.title} 暂时没有条目。`}
                        compact
                      />
                    )}
                  </div>
                </Surface>
              ))}
            </div>

            <Surface className="p-5">
              <SectionHeading
                icon={CircleDollarSign}
                title="价格参考"
                description="这里不是绝对标准，而是帮你先形成自己的价格感。"
              />

              <div className="mt-5">
                {shopping.priceReferences.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="border-[color:var(--muted-surface-border)]">
                        <TableHead>类别</TableHead>
                        <TableHead>入门价</TableHead>
                        <TableHead>舒服区间</TableHead>
                        <TableHead>偏贵</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {shopping.priceReferences.map((entry) => (
                        <TableRow
                          key={entry.id}
                          className="border-[color:var(--muted-surface-border)]"
                        >
                          <TableCell className="font-medium whitespace-normal text-[color:var(--text-primary)]">
                            <div>{entry.category}</div>
                            <div className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
                              {entry.note}
                            </div>
                          </TableCell>
                          <TableCell className="text-[color:var(--text-secondary)]">
                            {formatPrice(entry.entryPrice)}
                          </TableCell>
                          <TableCell className="text-[color:var(--text-secondary)]">
                            {formatPrice(entry.sweetSpotPrice)}
                          </TableCell>
                          <TableCell className="text-[color:var(--text-secondary)]">
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
          </div>
        </TabsContent>

        <TabsContent value="stages" className="space-y-4">
          <div className="grid gap-4 min-[1320px]:grid-cols-2">
            {shopping.stageChecklists.length > 0 ? (
              shopping.stageChecklists.map((checklist) => (
                <Surface key={checklist.id} className="p-5">
                  <SectionHeading
                    icon={House}
                    title={checklist.title}
                    description={checklist.description}
                  />

                  <p className="mt-5 text-sm leading-6 text-[color:var(--text-muted)]">
                    {checklist.focus}
                  </p>

                  <div className="mt-5 grid gap-5 min-[960px]:grid-cols-3">
                    <ChecklistBlock
                      title="最低配置"
                      items={checklist.minimum}
                    />
                    <ChecklistBlock
                      title="必要物品"
                      items={checklist.essentials}
                    />
                    <ChecklistBlock
                      title="之后再升级"
                      items={checklist.upgrades}
                    />
                  </div>
                </Surface>
              ))
            ) : (
              <EmptyState message="当前筛选下没有阶段清单。" />
            )}
          </div>
        </TabsContent>

        <TabsContent value="lifestyle" className="space-y-4">
          <div className="grid gap-4 min-[1320px]:grid-cols-3">
            {coreLifestyleCollections.length > 0 ? (
              coreLifestyleCollections.map((collection) => {
                const icon =
                  collection.id === "collection-gifts"
                    ? Gift
                    : collection.id === "collection-happiness"
                      ? Heart
                      : Sparkles

                return (
                  <Surface key={collection.id} className="p-5">
                    <SectionHeading
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
              })
            ) : (
              <EmptyState message="当前筛选下没有理想生活集合。" />
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
