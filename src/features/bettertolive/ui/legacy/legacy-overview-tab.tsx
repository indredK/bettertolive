import { CheckCheck, Layers3, ShieldCheck } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import type { LegacyItem, LegacyModuleData } from "@/features/bettertolive/types"
import {
  buildLegacyStats,
  createLegacyDistribution,
  EMOTIONAL_LOADS,
  LEGACY_CATEGORIES,
  translateLegacyEnum,
} from "@/features/bettertolive/ui/legacy/legacy-page-data"
import {
  LegacyItemSummaryCard,
  LegacyMetricCard,
  LegacyPanel,
  LegacyTabViewport,
  LegacyWarningCallout,
} from "@/features/bettertolive/ui/legacy/legacy-page-shared"
import { EmptyState, SectionHeading, Surface } from "@/features/bettertolive/ui/shared/shared"

export function LegacyOverviewTab({
  legacy,
  items,
  onEditItem,
}: {
  legacy: LegacyModuleData
  items: LegacyItem[]
  onEditItem?: (item: LegacyItem) => void
}) {
  const { t } = useTranslation()
  const stats = buildLegacyStats(items)
  const categoryRows = createLegacyDistribution(LEGACY_CATEGORIES, items, (item) => item.category)
  const emotionalRows = createLegacyDistribution(
    EMOTIONAL_LOADS,
    items,
    (item) => item.emotionalLoad,
  )
  const recentItems = [...items].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 4)

  return (
    <LegacyTabViewport>
      <Surface className="p-5">
        <SectionHeading
          icon={ShieldCheck}
          title={t("legacy.overview.title", "生命整理总览")}
          description={t(
            "legacy.overview.description",
            "看覆盖、缺口和边界是否清楚，不把沉重内容做成催促。",
          )}
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <LegacyMetricCard
            label={t("legacy.metrics.total", "条目总数")}
            value={String(stats.totalCount)}
            detail={t("legacy.metrics.totalDesc", "条目库是唯一数据源。")}
          />
          <LegacyMetricCard
            label={t("legacy.metrics.criticalDraft", "关键信息未完成")}
            value={String(stats.criticalDraftCount)}
            detail={t("legacy.metrics.criticalDraftDesc", "优先看是否仍停在草稿或持续更新。")}
            tone={stats.criticalDraftCount > 0 ? "warning" : "quiet"}
          />
          <LegacyMetricCard
            label={t("legacy.metrics.missingDelivery", "交付条件待补")}
            value={String(stats.missingDeliveryConditionCount)}
            detail={t("legacy.metrics.missingDeliveryDesc", "未来或条件可见内容需要说明触发方式。")}
            tone={stats.missingDeliveryConditionCount > 0 ? "warning" : "quiet"}
          />
          <LegacyMetricCard
            label={t("legacy.metrics.finalLocked", "最终版或锁定")}
            value={String(stats.finalLockedCount)}
            detail={t("legacy.metrics.finalLockedDesc", "锁定内容修改前需要主动确认。")}
            tone="locked"
          />
        </div>
      </Surface>

      <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Surface className="p-5">
          <SectionHeading
            icon={Layers3}
            title={t("legacy.overview.coverage", "分类覆盖")}
            description={t(
              "legacy.overview.coverageDesc",
              "按内容本质看整理是否过度集中在某一类。",
            )}
          />
          <div className="mt-5 space-y-4">
            {categoryRows.map((row) => (
              <DistributionLine
                key={row.label}
                label={translateLegacyEnum(t, "category", row.label)}
                count={row.count}
                total={items.length}
              />
            ))}
          </div>
        </Surface>

        <Surface className="p-5">
          <SectionHeading
            icon={ShieldCheck}
            title={t("legacy.overview.boundaryTitle", "需要确认的边界")}
            description={t(
              "legacy.overview.boundaryDesc",
              "只显示数量和线索，避免把私密内容自动汇总。",
            )}
          />
          <div className="mt-5 grid gap-3">
            <BoundaryLine
              label={t("legacy.metrics.heavyLoad", "情感负荷很重")}
              value={stats.heavyLoadCount}
              detail={t("legacy.metrics.heavyLoadDesc", "适合在状态稳定时再打开。")}
            />
            <BoundaryLine
              label={t("legacy.metrics.aiExcluded", "排除 AI 汇总")}
              value={stats.aiExcludedCount}
              detail={t("legacy.metrics.aiExcludedDesc", "这些条目不会进入跨模块洞察。")}
            />
            <BoundaryLine
              label={t("legacy.metrics.secondConfirm", "需要二次确认")}
              value={stats.secondConfirmCount}
              detail={t("legacy.metrics.secondConfirmDesc", "打开前保留一道温和确认。")}
            />
          </div>
        </Surface>
      </div>

      <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Surface className="p-5">
          <SectionHeading
            icon={CheckCheck}
            title={t("legacy.overview.recent", "最近更新")}
            description={t("legacy.overview.recentDesc", "这里只展示摘要和边界，不主动展开全文。")}
          />
          <div className="mt-5 grid gap-3">
            {recentItems.length > 0 ? (
              recentItems.map((item) => (
                <LegacyItemSummaryCard
                  key={item.id}
                  item={item}
                  onEdit={onEditItem ? () => onEditItem(item) : undefined}
                  compact
                />
              ))
            ) : (
              <EmptyState message={t("legacy.empty.items", "当前没有生命整理条目。")} compact />
            )}
          </div>
        </Surface>

        <div className="space-y-4">
          <LegacyPanel
            title={t("legacy.overview.emotionalLoad", "情感负荷分布")}
            description={t(
              "legacy.overview.emotionalLoadDesc",
              "情感负荷不是主分类，只是单份内容的打开提醒。",
            )}
          >
            <div className="flex flex-wrap gap-2">
              {emotionalRows.map((row) => (
                <Badge
                  key={row.label}
                  variant="outline"
                  className="border-foreground/10 bg-background/70"
                >
                  {translateLegacyEnum(t, "emotionalLoad", row.label)} · {row.count}
                </Badge>
              ))}
            </div>
          </LegacyPanel>

          <LegacyPanel
            title={t("legacy.overview.reviewPrompts", "回看问题")}
            description={t("legacy.overview.reviewPromptsDesc", "慢慢整理，不把它变成完成压力。")}
          >
            <div className="space-y-2">
              {legacy.reviewPrompts.slice(0, 5).map((prompt) => (
                <div
                  key={prompt}
                  className="border-foreground/10 bg-muted/25 rounded-lg border px-3 py-2 text-xs leading-5"
                >
                  {prompt}
                </div>
              ))}
              {legacy.reviewPrompts.length === 0 ? (
                <EmptyState message={t("legacy.empty.prompts", "当前没有回看问题。")} compact />
              ) : null}
            </div>
          </LegacyPanel>

          {stats.missingDeliveryConditionCount > 0 ? (
            <LegacyWarningCallout title={t("legacy.warnings.missingDelivery", "交付条件待补")}>
              {t(
                "legacy.overview.missingDeliveryCopy",
                "这些内容可以继续保存为草稿，但进入最终版前需要写清触发和验证方式。",
              )}
            </LegacyWarningCallout>
          ) : null}
        </div>
      </div>
    </LegacyTabViewport>
  )
}

function DistributionLine({
  label,
  count,
  total,
}: {
  label: string
  count: number
  total: number
}) {
  const width = total > 0 ? `${Math.max((count / total) * 100, count > 0 ? 10 : 0)}%` : "0%"

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-muted-foreground truncate">{label}</span>
        <span className="tabular-nums">{count}</span>
      </div>
      <div className="bg-muted h-1.5 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full bg-[color:var(--legacy-private-ink)]"
          style={{ width }}
        />
      </div>
    </div>
  )
}

function BoundaryLine({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="border-foreground/10 bg-background/70 rounded-lg border px-3 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm font-semibold tabular-nums">{value}</span>
      </div>
      <p className="text-muted-foreground mt-1 text-xs leading-5">{detail}</p>
    </div>
  )
}
