import { Scale, ShieldCheck } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { LegacyItem, LegacyModuleData } from "@/features/bettertolive/types"
import {
  buildLegacyStats,
  requiresDeliveryCondition,
} from "@/features/bettertolive/ui/legacy/legacy-page-data"
import {
  LegacyItemSummaryCard,
  LegacyMetricCard,
  LegacyPanel,
  LegacyTabViewport,
  LegacyWarningCallout,
} from "@/features/bettertolive/ui/legacy/legacy-page-shared"
import { EmptyState, SectionHeading, Surface } from "@/features/bettertolive/ui/shared/shared"

export function LegacyTrustBoundariesTab({
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
  const aiExcluded = items.filter((item) => item.excludeFromAi)
  const secondConfirm = items.filter((item) => item.requiresSecondConfirm)
  const locked = items.filter((item) => item.isLocked || item.status === "最终版")
  const missingDelivery = items.filter(
    (item) => requiresDeliveryCondition(item.visibility) && !item.deliveryCondition?.trim(),
  )

  return (
    <LegacyTabViewport>
      <Surface className="p-5">
        <SectionHeading
          icon={ShieldCheck}
          title={t("legacy.boundaries.title", "边界与信任")}
          description={t(
            "legacy.boundaries.description",
            "说明系统不会偷偷越界，并把条目级保护策略集中到一页里看。",
          )}
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <LegacyMetricCard
            label={t("legacy.metrics.aiExcluded", "排除 AI 汇总")}
            value={String(stats.aiExcludedCount)}
            detail={t("legacy.metrics.aiExcludedDesc", "这些条目不会进入跨模块洞察。")}
          />
          <LegacyMetricCard
            label={t("legacy.metrics.secondConfirm", "需要二次确认")}
            value={String(stats.secondConfirmCount)}
            detail={t("legacy.metrics.secondConfirmDesc", "打开前保留一道温和确认。")}
          />
          <LegacyMetricCard
            label={t("legacy.metrics.finalLocked", "最终版或锁定")}
            value={String(stats.finalLockedCount)}
            detail={t("legacy.metrics.finalLockedDesc", "锁定内容修改前需要主动确认。")}
            tone="locked"
          />
          <LegacyMetricCard
            label={t("legacy.metrics.missingDelivery", "交付条件待补")}
            value={String(stats.missingDeliveryConditionCount)}
            detail={t("legacy.metrics.missingDeliveryDesc", "未来或条件可见内容需要说明触发方式。")}
            tone={stats.missingDeliveryConditionCount > 0 ? "warning" : "quiet"}
          />
        </div>
      </Surface>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <LegacyPanel
          title={t("legacy.boundaries.rules", "信任边界说明")}
          description={t(
            "legacy.boundaries.rulesDesc",
            "这些说明来自后端配置，可与条目策略分开维护。",
          )}
        >
          <div className="space-y-3">
            {legacy.trustBoundaries.length > 0 ? (
              legacy.trustBoundaries.map((boundary) => (
                <div
                  key={boundary.id}
                  className="border-foreground/10 bg-background/70 rounded-lg border px-4 py-3"
                >
                  <div className="text-sm font-medium">{boundary.title}</div>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">{boundary.detail}</p>
                </div>
              ))
            ) : (
              <EmptyState message={t("legacy.empty.boundaries", "当前没有边界说明。")} compact />
            )}
          </div>
        </LegacyPanel>

        <div className="space-y-4">
          <ProtectedItemPanel
            title={t("legacy.boundaries.aiExcludedItems", "排除 AI 的条目")}
            items={aiExcluded}
            onEditItem={onEditItem}
          />
          <ProtectedItemPanel
            title={t("legacy.boundaries.secondConfirmItems", "需要二次确认的条目")}
            items={secondConfirm}
            onEditItem={onEditItem}
          />
          <ProtectedItemPanel
            title={t("legacy.boundaries.lockedItems", "最终版或锁定条目")}
            items={locked}
            onEditItem={onEditItem}
          />
          <ProtectedItemPanel
            title={t("legacy.boundaries.missingDeliveryItems", "缺少交付条件的条目")}
            items={missingDelivery}
            onEditItem={onEditItem}
          />
        </div>
      </div>

      <LegacyWarningCallout title={t("legacy.boundaries.legalTitle", "法律边界")}>
        <div className="flex items-start gap-2">
          <Scale className="mt-0.5 size-4 shrink-0" />
          <span>
            {t(
              "legacy.boundaries.legalCopy",
              "生命整理不具备法律遗嘱效力，也不替代保险、资产、医疗或法律文件管理。",
            )}
          </span>
        </div>
      </LegacyWarningCallout>
    </LegacyTabViewport>
  )
}

function ProtectedItemPanel({
  title,
  items,
  onEditItem,
}: {
  title: string
  items: LegacyItem[]
  onEditItem?: (item: LegacyItem) => void
}) {
  const { t } = useTranslation()

  return (
    <LegacyPanel
      title={title}
      description={t("legacy.boundaries.itemCount", {
        count: items.length,
        defaultValue: "{{count}} 份内容",
      })}
    >
      <div className="space-y-2">
        {items.length > 0 ? (
          items
            .slice(0, 4)
            .map((item) => (
              <LegacyItemSummaryCard
                key={item.id}
                item={item}
                onEdit={onEditItem ? () => onEditItem(item) : undefined}
                compact
              />
            ))
        ) : (
          <EmptyState message={t("legacy.empty.bucket", "当前没有匹配内容。")} compact />
        )}
      </div>
    </LegacyPanel>
  )
}
