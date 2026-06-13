import { Sparkles, Layers3, MapPinned, Network, Telescope } from "lucide-react"
import type { ReactNode } from "react"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  Bar,
  BarChart,
  Cell,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ShoppingModuleData } from "@/features/bettertolive/types"
import { cn } from "@/lib/utils"

export function ShoppingOverviewTab({ shopping }: { shopping: ShoppingModuleData }) {
  const { t } = useTranslation()

  const density = useMemo(() => {
    if (shopping.overview.totalItems === 0) return 0
    return Math.round((shopping.overview.totalChildren / shopping.overview.totalItems) * 10) / 10
  }, [shopping.overview.totalChildren, shopping.overview.totalItems])

  const wantedRatio = useMemo(() => {
    if (shopping.overview.totalItems === 0) return 0
    return Math.round((shopping.overview.wantedItems / shopping.overview.totalItems) * 100)
  }, [shopping.overview.totalItems, shopping.overview.wantedItems])

  const spotlightLead = shopping.spotlights[0] ?? null

  const stageNarrative = shopping.overview.topStagePulses.slice(0, 3)
  const systemNarrative = shopping.overview.topSystemPulses.slice(0, 3)
  const spaceNarrative = shopping.overview.topSpacePulses.slice(0, 3)

  const densityChartData = useMemo(
    () => [
      {
        name: t("shopping.overview.itemsTotal", "物品"),
        value: shopping.overview.totalItems,
        fill: "var(--color-chart-1)",
      },
      {
        name: t("shopping.overview.totalChildren", "子级"),
        value: shopping.overview.totalChildren,
        fill: "var(--color-chart-2)",
      },
      {
        name: t("shopping.overview.totalStages", "阶段"),
        value: shopping.overview.totalStages,
        fill: "var(--color-chart-3)",
      },
      {
        name: t("shopping.overview.totalSystems", "系统"),
        value: shopping.overview.totalSystems,
        fill: "var(--color-chart-4)",
      },
    ],
    [
      shopping.overview.totalChildren,
      shopping.overview.totalItems,
      shopping.overview.totalStages,
      shopping.overview.totalSystems,
      t,
    ],
  )

  const pulsePanels = [
    {
      key: "stage",
      icon: Telescope,
      title: t("shopping.overview.stagePulse", "阶段脉冲"),
      description: t("shopping.overview.stagePulseDescription", "最能代表当前生活阶段的配置重心。"),
      items: stageNarrative.map((entry) => ({
        id: entry.id,
        label: entry.name,
        value: entry.itemCount,
      })),
      accent: "one" as const,
    },
    {
      key: "system",
      icon: Network,
      title: t("shopping.overview.systemPulse", "系统热点"),
      description: t(
        "shopping.overview.systemPulseDescription",
        "哪些物件系统正在形成真正的支撑面。",
      ),
      items: systemNarrative.map((entry) => ({
        id: entry.id,
        label: entry.name,
        value: entry.itemCount,
      })),
      accent: "two" as const,
    },
    {
      key: "space",
      icon: MapPinned,
      title: t("shopping.overview.spacePulse", "空间锚点"),
      description: t(
        "shopping.overview.spacePulseDescription",
        "空间场景能暴露出你真正高频使用和维护的生活区域。",
      ),
      items: spaceNarrative.map((entry) => ({
        id: entry.id,
        label: entry.name,
        value: entry.itemCount,
      })),
      accent: "three" as const,
    },
  ]

  return (
    <div className="h-full min-h-0 overflow-y-auto overscroll-contain pr-1">
      <div className="grid min-h-full grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.42fr)_minmax(320px,0.58fr)]">
        <Card className="border-foreground/10 from-background via-card to-muted/20 shadow-foreground/5 flex min-h-[920px] flex-col overflow-hidden border bg-linear-to-br shadow-lg md:min-h-[780px] lg:min-h-[640px]">
          <CardContent className="flex min-h-0 flex-1 flex-col p-0">
            <div className="border-foreground/10 relative overflow-hidden border-b px-5 py-4">
              <div className="from-muted via-accent/30 absolute inset-x-0 top-0 h-24 bg-linear-to-r to-transparent blur-2xl" />
              <div className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <Badge
                    variant="outline"
                    className="border-foreground/10 bg-accent text-accent-foreground"
                  >
                    {t("shopping.overview.eyebrow", "生活系统总览")}
                  </Badge>
                  <div className="max-w-2xl space-y-2">
                    <h2 className="text-[1.45rem] font-semibold tracking-tight sm:text-[1.7rem]">
                      {t("shopping.overview.heroTitle", "把购物看成生活结构，而不是待买清单")}
                    </h2>
                    <p className="text-muted-foreground line-clamp-3 max-w-xl text-sm leading-6">
                      {spotlightLead?.summary ||
                        t(
                          "shopping.overview.heroDescription",
                          "总览把物品、阶段、系统与空间收敛到一页里，帮助你判断现在需要补齐什么、哪些地方已经过密，以及当前生活方式正在被什么支撑。",
                        )}
                    </p>
                  </div>
                </div>

                <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:grid-cols-4 lg:w-auto lg:grid-cols-2">
                  <HeroMetric
                    label={t("shopping.overview.itemsTotal", "物品总数")}
                    value={shopping.overview.totalItems}
                    tone="one"
                  />
                  <HeroMetric
                    label={t("shopping.overview.totalChildren", "子级密度")}
                    value={density}
                    suffix="x"
                    tone="two"
                  />
                  <HeroMetric
                    label={t("shopping.overview.itemsWanted", "待购占比")}
                    value={wantedRatio}
                    suffix="%"
                    tone="three"
                  />
                  <HeroMetric
                    label={t("shopping.overview.totalStages", "阶段模板")}
                    value={shopping.overview.totalStages}
                    tone="four"
                  />
                </div>
              </div>
            </div>

            <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(260px,1fr)_minmax(360px,1fr)] gap-3 p-3 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)] lg:grid-rows-1">
              <OverviewPanel
                icon={Sparkles}
                title={t("shopping.overview.curationTitle", "当下策展")}
                subtitle={t(
                  "shopping.overview.curatedSubtitle",
                  "把正在支撑生活的物件、焦点与集合放在同一视野里。",
                )}
                className="h-full min-h-0"
              >
                <div className="grid h-full min-h-0 grid-cols-1 grid-rows-[repeat(2,minmax(0,1fr))] gap-3">
                  <NarrativeCard
                    title={spotlightLead?.title || t("shopping.overview.focusFallback", "当前焦点")}
                    summary={
                      spotlightLead?.reason ||
                      t(
                        "shopping.overview.focusReasonFallback",
                        "还没有焦点提示时，这里会成为购物策略与注意事项的主叙事位。",
                      )
                    }
                    lines={spotlightLead?.attention ?? []}
                    tone="one"
                  />
                  <NarrativeCard
                    title={
                      shopping.lifestyleCollections[0]?.title ||
                      t("shopping.overview.lifestyle", "生活方式集合")
                    }
                    summary={
                      shopping.lifestyleCollections[0]?.description ||
                      t(
                        "shopping.overview.lifestyleFallback",
                        "把一组共同服务于某种生活方式的物品归拢起来，能快速看出你真正重视的使用场景。",
                      )
                    }
                    lines={shopping.lifestyleCollections[0]?.items ?? []}
                    tone="two"
                  />
                </div>
              </OverviewPanel>

              <OverviewPanel
                icon={Layers3}
                title={t("shopping.overview.structureTitle", "结构密度")}
                subtitle={t(
                  "shopping.overview.structureSubtitle",
                  "物品不是越多越好，关键是它们是否形成清晰层次。",
                )}
                className="h-full min-h-0"
              >
                <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto]">
                  <div className="grid min-h-0 grid-cols-1 gap-3 md:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                    <div className="bg-muted/25 border-foreground/10 flex min-h-[150px] flex-col rounded-2xl border p-3 md:min-h-0">
                      <div className="mb-2 flex items-baseline justify-between gap-2">
                        <div>
                          <div className="text-[11px] font-medium">
                            {t("shopping.overview.portfolioSplit", "拥有 / 待购")}
                          </div>
                          <div className="text-muted-foreground mt-0.5 text-[11px]">
                            {t("shopping.overview.portfolioSplitHint", "先看结构倾向，再看数量")}
                          </div>
                        </div>
                        <div className="text-muted-foreground text-xs tabular-nums">
                          {wantedRatio}%
                        </div>
                      </div>
                      <div className="min-h-0 flex-1">
                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                          initialDimension={{ width: 180, height: 150 }}
                        >
                          <RadialBarChart
                            data={[
                              {
                                name: "wantedRatio",
                                value: wantedRatio,
                                fill: "var(--color-chart-1)",
                              },
                            ]}
                            innerRadius="68%"
                            outerRadius="100%"
                            startAngle={90}
                            endAngle={-270}
                            barSize={16}
                          >
                            <RadialBar background dataKey="value" cornerRadius={999} />
                            <text
                              x="50%"
                              y="48%"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="fill-foreground text-2xl font-semibold"
                            >
                              {wantedRatio}%
                            </text>
                            <text
                              x="50%"
                              y="61%"
                              textAnchor="middle"
                              dominantBaseline="middle"
                              className="fill-muted-foreground text-[11px]"
                            >
                              {t("shopping.overview.itemsWanted", "待购")}
                            </text>
                          </RadialBarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-muted/25 border-foreground/10 flex min-h-[150px] flex-col rounded-2xl border p-3 md:min-h-0">
                      <div className="mb-2">
                        <div className="text-[11px] font-medium">
                          {t("shopping.overview.structureChartTitle", "结构层级")}
                        </div>
                        <div className="text-muted-foreground mt-0.5 text-[11px]">
                          {t("shopping.overview.structureChartHint", "看数量，也看组织成本")}
                        </div>
                      </div>
                      <div className="min-h-0 flex-1">
                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                          initialDimension={{ width: 260, height: 150 }}
                        >
                          <BarChart data={densityChartData} barCategoryGap={12}>
                            <XAxis
                              dataKey="name"
                              axisLine={false}
                              tickLine={false}
                              tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
                            />
                            <Tooltip
                              cursor={{ fill: "transparent" }}
                              contentStyle={{
                                borderRadius: 16,
                                border: "1px solid var(--color-border)",
                                background: "var(--color-card)",
                              }}
                            />
                            <Bar dataKey="value" radius={[10, 10, 4, 4]}>
                              {densityChartData.map((entry) => (
                                <Cell key={entry.name} fill={entry.fill} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <MiniMetric
                      label={t("shopping.overview.boundaries", "边界清单")}
                      value={shopping.overview.totalBoundaryEntries}
                    />
                    <MiniMetric
                      label={t("shopping.overview.spotlights", "焦点提示")}
                      value={shopping.overview.totalSpotlights}
                    />
                    <MiniMetric
                      label={t("shopping.overview.lifestyle", "生活方式集合")}
                      value={shopping.overview.totalLifestyleCollections}
                    />
                  </div>
                </div>
              </OverviewPanel>
            </div>
          </CardContent>
        </Card>

        <div className="grid min-h-0 grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-1 xl:grid-rows-[repeat(3,minmax(190px,1fr))]">
          {pulsePanels.map(({ key, ...panel }) => (
            <PulsePanel key={key} className="min-h-[210px] xl:min-h-0" {...panel} />
          ))}
        </div>
      </div>
    </div>
  )
}

function HeroMetric({
  label,
  value,
  suffix,
  tone,
}: {
  label: string
  value: number
  suffix?: string
  tone: "one" | "two" | "three" | "four"
}) {
  return (
    <div
      className={cn(
        "min-w-[112px] rounded-2xl border px-3 py-2",
        tone === "one" && "border-foreground/10 bg-accent text-accent-foreground",
        tone === "two" && "border-foreground/10 bg-secondary text-secondary-foreground",
        tone === "three" && "border-foreground/10 bg-card text-card-foreground",
        tone === "four" && "border-foreground/10 bg-muted text-muted-foreground",
      )}
    >
      <div className="text-[10px] tracking-[0.18em] uppercase opacity-70">{label}</div>
      <div className="mt-1 text-[1.6rem] font-semibold tabular-nums">
        {value}
        {suffix ? <span className="ml-0.5 text-sm opacity-75">{suffix}</span> : null}
      </div>
    </div>
  )
}

function OverviewPanel({
  icon: Icon,
  title,
  subtitle,
  children,
  className,
}: {
  icon: typeof Sparkles
  title: string
  subtitle: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "border-foreground/10 bg-background/80 shadow-foreground/5 flex min-h-0 flex-col rounded-2xl border p-3.5 shadow-md",
        className,
      )}
    >
      <div className="mb-3 flex items-start gap-3">
        <div className="bg-muted/60 rounded-xl p-2">
          <Icon className="size-4" />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold">{title}</div>
          <p className="text-muted-foreground mt-1 text-xs leading-5">{subtitle}</p>
        </div>
      </div>
      <div className="h-full min-h-0 flex-1">{children}</div>
    </div>
  )
}

function NarrativeCard({
  title,
  summary,
  lines,
  tone,
}: {
  title: string
  summary: string
  lines: string[]
  tone: "one" | "two"
}) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col rounded-2xl border p-3.5",
        tone === "one" && "border-foreground/10 bg-accent/70 text-accent-foreground",
        tone === "two" && "border-foreground/10 bg-muted/45",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{title}</div>
          <p className="text-muted-foreground mt-2 line-clamp-2 text-xs leading-6">{summary}</p>
        </div>
        <div
          className={cn(
            "shrink-0 rounded-full px-2 py-1 text-[11px] font-medium",
            tone === "one" && "bg-background/65 text-foreground",
            tone === "two" && "bg-background/65 text-foreground",
          )}
        >
          {lines.length}
        </div>
      </div>
      <div className="mt-3 min-h-0">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {lines.length > 0 ? (
            lines.slice(0, 3).map((line, index) => (
              <div
                key={`${title}-${index}`}
                className="bg-background/75 border-foreground/10 line-clamp-2 rounded-xl border px-3 py-2 text-xs leading-5"
              >
                {line}
              </div>
            ))
          ) : (
            <div className="text-muted-foreground text-xs leading-5">-</div>
          )}
          {lines.length > 3 ? (
            <div className="text-muted-foreground px-1 text-[11px]">
              {t(
                tone === "one"
                  ? "shopping.overview.moreAttentionItems"
                  : "shopping.overview.moreRelatedItems",
                {
                  count: lines.length - 3,
                  defaultValue: "+{{count}} 条",
                },
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function MiniMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-muted/35 border-foreground/10 rounded-2xl border px-3 py-2.5">
      <div className="text-muted-foreground text-[11px]">{label}</div>
      <div className="mt-1 text-lg font-semibold tabular-nums">{value}</div>
    </div>
  )
}

function PulsePanel({
  icon: Icon,
  title,
  description,
  items,
  accent,
  className,
}: {
  icon: typeof Sparkles
  title: string
  description: string
  items: Array<{ id: string; label: string; value: number }>
  accent: "one" | "two" | "three"
  className?: string
}) {
  const max = Math.max(...items.map((item) => item.value), 1)
  const chartData = items.map((item) => ({ ...item }))
  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card
      className={cn(
        "border-foreground/10 bg-card/90 shadow-foreground/5 h-full min-h-0 overflow-hidden border shadow-md",
        className,
      )}
    >
      <CardContent className="flex h-full min-h-0 flex-col p-3">
        <div className="mb-2 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-2.5">
            <div
              className={cn(
                "shrink-0 rounded-xl p-2",
                accent === "one" && "bg-accent text-accent-foreground",
                accent === "two" && "bg-secondary text-secondary-foreground",
                accent === "three" && "bg-muted text-muted-foreground",
              )}
            >
              <Icon className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{title}</div>
              <p className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">{description}</p>
            </div>
          </div>
          <div
            className={cn(
              "shrink-0 rounded-full px-2 py-1 text-[11px] font-medium tabular-nums",
              accent === "one" && "bg-accent text-accent-foreground",
              accent === "two" && "bg-secondary text-secondary-foreground",
              accent === "three" && "bg-muted text-muted-foreground",
            )}
          >
            {total}
          </div>
        </div>

        <div className="min-h-0 flex-1">
          {chartData.length > 0 ? (
            <div className="grid h-full min-h-0 grid-rows-[minmax(0,1fr)_auto] gap-1.5">
              <div className="min-h-0">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  initialDimension={{ width: 260, height: 150 }}
                >
                  <BarChart
                    data={chartData}
                    layout="vertical"
                    margin={{ top: 0, right: 8, left: 0, bottom: 0 }}
                    barCategoryGap={8}
                    barSize={13}
                  >
                    <XAxis type="number" hide domain={[0, max]} />
                    <YAxis
                      type="category"
                      dataKey="label"
                      axisLine={false}
                      tickLine={false}
                      width={78}
                      tick={{ fontSize: 10, fill: "var(--color-muted-foreground)" }}
                    />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      contentStyle={{
                        borderRadius: 16,
                        border: "1px solid var(--color-border)",
                        background: "var(--color-card)",
                      }}
                    />
                    <Bar dataKey="value" radius={[0, 9, 9, 0]}>
                      {chartData.map((item) => (
                        <Cell
                          key={item.id}
                          fill={
                            accent === "one"
                              ? "var(--color-chart-1)"
                              : accent === "two"
                                ? "var(--color-chart-2)"
                                : "var(--color-chart-3)"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {chartData.map((item) => (
                  <div
                    key={item.id}
                    className="bg-muted/30 border-foreground/10 min-w-0 rounded-lg border px-2 py-1"
                  >
                    <div className="text-muted-foreground truncate text-[10px]">{item.label}</div>
                    <div className="text-xs font-semibold tabular-nums">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground flex h-full items-center justify-center rounded-2xl border border-dashed px-4 py-6 text-center text-xs">
              -
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
