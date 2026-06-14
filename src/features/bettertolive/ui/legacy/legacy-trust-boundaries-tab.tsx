import { Scale, ShieldCheck } from "lucide-react"
import { useTranslation } from "react-i18next"

import type { LegacyItem, LegacyModuleData } from "@/features/bettertolive/types"
import {
  buildLegacyStats,
  LEGACY_STATUS_FINAL,
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
  const locked = items.filter((item) => item.isLocked || item.status === LEGACY_STATUS_FINAL)
  const missingDelivery = items.filter(
    (item) => requiresDeliveryCondition(item.visibility) && !item.deliveryCondition?.trim(),
  )

  return (
    <LegacyTabViewport>
      <Surface className="p-5">
        <SectionHeading
          icon={ShieldCheck}
          title={t("legacy.boundaries.title")}
          description={t(
            "legacy.boundaries.description",
            "说明系统不会偷偷越界，并把条目级保护策略集中到一页里看。",
          )}
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <LegacyMetricCard
            label={t("legacy.metrics.aiExcluded")}
            value={String(stats.aiExcludedCount)}
            detail={t("legacy.metrics.aiExcludedDesc")}
          />
          <LegacyMetricCard
            label={t("legacy.metrics.secondConfirm")}
            value={String(stats.secondConfirmCount)}
            detail={t("legacy.metrics.secondConfirmDesc")}
          />
          <LegacyMetricCard
            label={t("legacy.metrics.finalLocked")}
            value={String(stats.finalLockedCount)}
            detail={t("legacy.metrics.finalLockedDesc")}
            tone="locked"
          />
          <LegacyMetricCard
            label={t("legacy.metrics.missingDelivery")}
            value={String(stats.missingDeliveryConditionCount)}
            detail={t("legacy.metrics.missingDeliveryDesc")}
            tone={stats.missingDeliveryConditionCount > 0 ? "warning" : "quiet"}
          />
        </div>
      </Surface>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <LegacyPanel
          title={t("legacy.boundaries.rules")}
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
              <EmptyState message={t("legacy.empty.boundaries")} compact />
            )}
          </div>
        </LegacyPanel>

        <div className="space-y-4">
          <ProtectedItemPanel
            title={t("legacy.boundaries.aiExcludedItems")}
            items={aiExcluded}
            onEditItem={onEditItem}
          />
          <ProtectedItemPanel
            title={t("legacy.boundaries.secondConfirmItems")}
            items={secondConfirm}
            onEditItem={onEditItem}
          />
          <ProtectedItemPanel
            title={t("legacy.boundaries.lockedItems")}
            items={locked}
            onEditItem={onEditItem}
          />
          <ProtectedItemPanel
            title={t("legacy.boundaries.missingDeliveryItems")}
            items={missingDelivery}
            onEditItem={onEditItem}
          />
        </div>
      </div>

      <LegacyWarningCallout title={t("legacy.boundaries.legalTitle")}>
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
          <EmptyState message={t("legacy.empty.bucket")} compact />
        )}
      </div>
    </LegacyPanel>
  )
}
