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
} from "@/features/bettertolive/legacy/legacy-page-data"
import {
  LegacyItemSummaryCard,
  LegacyMetricCard,
  LegacyPanel,
  LegacyTabViewport,
  LegacyWarningCallout,
} from "@/features/bettertolive/legacy/legacy-page-shared"
import { EmptyState, SectionHeading, Surface } from "@/features/bettertolive/shared/shared"

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
          title={t("legacy.overview.title")}
          description={t("legacy.overview.description")}
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <LegacyMetricCard
            label={t("legacy.metrics.total")}
            value={String(stats.totalCount)}
            detail={t("legacy.metrics.totalDesc")}
          />
          <LegacyMetricCard
            label={t("legacy.metrics.criticalDraft")}
            value={String(stats.criticalDraftCount)}
            detail={t("legacy.metrics.criticalDraftDesc")}
            tone={stats.criticalDraftCount > 0 ? "warning" : "quiet"}
          />
          <LegacyMetricCard
            label={t("legacy.metrics.missingDelivery")}
            value={String(stats.missingDeliveryConditionCount)}
            detail={t("legacy.metrics.missingDeliveryDesc")}
            tone={stats.missingDeliveryConditionCount > 0 ? "warning" : "quiet"}
          />
          <LegacyMetricCard
            label={t("legacy.metrics.finalLocked")}
            value={String(stats.finalLockedCount)}
            detail={t("legacy.metrics.finalLockedDesc")}
            tone="locked"
          />
        </div>
      </Surface>

      <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Surface className="p-5">
          <SectionHeading
            icon={Layers3}
            title={t("legacy.overview.coverage")}
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
            title={t("legacy.overview.boundaryTitle")}
            description={t(
              "legacy.overview.boundaryDesc",
              "只显示数量和线索，避免把私密内容自动汇总。",
            )}
          />
          <div className="mt-5 grid gap-3">
            <BoundaryLine
              label={t("legacy.metrics.heavyLoad")}
              value={stats.heavyLoadCount}
              detail={t("legacy.metrics.heavyLoadDesc")}
            />
            <BoundaryLine
              label={t("legacy.metrics.aiExcluded")}
              value={stats.aiExcludedCount}
              detail={t("legacy.metrics.aiExcludedDesc")}
            />
            <BoundaryLine
              label={t("legacy.metrics.secondConfirm")}
              value={stats.secondConfirmCount}
              detail={t("legacy.metrics.secondConfirmDesc")}
            />
          </div>
        </Surface>
      </div>

      <div className="grid min-h-0 gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Surface className="p-5">
          <SectionHeading
            icon={CheckCheck}
            title={t("legacy.overview.recent")}
            description={t("legacy.overview.recentDesc")}
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
              <EmptyState message={t("legacy.empty.items")} compact />
            )}
          </div>
        </Surface>

        <div className="space-y-4">
          <LegacyPanel
            title={t("legacy.overview.emotionalLoad")}
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
            title={t("legacy.overview.reviewPrompts")}
            description={t("legacy.overview.reviewPromptsDesc")}
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
                <EmptyState message={t("legacy.empty.prompts")} compact />
              ) : null}
            </div>
          </LegacyPanel>

          {stats.missingDeliveryConditionCount > 0 ? (
            <LegacyWarningCallout title={t("legacy.warnings.missingDelivery")}>
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
