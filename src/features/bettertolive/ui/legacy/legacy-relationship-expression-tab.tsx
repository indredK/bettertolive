import { MessageSquareHeart } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import type { LegacyItem } from "@/features/bettertolive/types"
import {
  buildLegacyRelationshipBuckets,
  legacyRecipientLabel,
  translateLegacyEnum,
} from "@/features/bettertolive/ui/legacy/legacy-page-data"
import {
  LegacyItemSummaryCard,
  LegacyPanel,
  LegacyTabViewport,
  LegacyWarningCallout,
} from "@/features/bettertolive/ui/legacy/legacy-page-shared"
import { EmptyState, SectionHeading, Surface } from "@/features/bettertolive/ui/shared/shared"

export function LegacyRelationshipExpressionTab({
  items,
  onEditItem,
}: {
  items: LegacyItem[]
  onEditItem?: (item: LegacyItem) => void
}) {
  const { t } = useTranslation()
  const buckets = buildLegacyRelationshipBuckets(items)

  return (
    <LegacyTabViewport>
      <Surface className="p-5">
        <SectionHeading
          icon={MessageSquareHeart}
          title={t("legacy.relationship.title", "关系表达")}
          description={t(
            "legacy.relationship.description",
            "聚焦留给某人的话，以及和关系有关的未完成牵挂。",
          )}
        />
      </Surface>

      <div className="grid gap-4 xl:grid-cols-2">
        <ExpressionBucket
          title={t("legacy.relationship.now", "现在可以说的话")}
          description={t(
            "legacy.relationship.nowDesc",
            "这些内容也许适合转入关系模块继续打磨，但这里不自动推动。",
          )}
          items={buckets.now}
          onEditItem={onEditItem}
        />
        <ExpressionBucket
          title={t("legacy.relationship.future", "未来或离世后交付的话")}
          description={t(
            "legacy.relationship.futureDesc",
            "保留交付意图、对象和条件，避免只剩一段孤立文字。",
          )}
          items={buckets.future}
          onEditItem={onEditItem}
        />
        <ExpressionBucket
          title={t("legacy.relationship.private", "仅自己整理的牵挂")}
          description={t(
            "legacy.relationship.privateDesc",
            "这些内容不应该被自动推送或默认进入 AI 汇总。",
          )}
          items={buckets.private}
          onEditItem={onEditItem}
        />
        <ExpressionBucket
          title={t("legacy.relationship.unlinked", "未关联关系条目")}
          description={t(
            "legacy.relationship.unlinkedDesc",
            "后续可以再决定是否引用关系模块对象。",
          )}
          items={buckets.unlinked}
          onEditItem={onEditItem}
        />
      </div>

      {buckets.now.length > 0 ? (
        <LegacyWarningCallout title={t("legacy.relationship.nowHintTitle", "当下表达提醒")}>
          {t(
            "legacy.relationship.nowHint",
            "visibility=现在 的内容只提示可表达窗口，不做催促，也不会自动复制到关系模块。",
          )}
        </LegacyWarningCallout>
      ) : null}
    </LegacyTabViewport>
  )
}

function ExpressionBucket({
  title,
  description,
  items,
  onEditItem,
}: {
  title: string
  description: string
  items: LegacyItem[]
  onEditItem?: (item: LegacyItem) => void
}) {
  const { t } = useTranslation()

  return (
    <LegacyPanel title={title} description={description}>
      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.id} className="space-y-2">
              <LegacyItemSummaryCard
                item={item}
                onEdit={onEditItem ? () => onEditItem(item) : undefined}
                compact
              />
              <div className="flex flex-wrap gap-1.5 pl-1">
                <Badge variant="outline" className="border-foreground/10 text-[10px]">
                  {legacyRecipientLabel(item, t)}
                </Badge>
                <Badge variant="outline" className="border-foreground/10 text-[10px]">
                  {translateLegacyEnum(t, "category", item.category)}
                </Badge>
                <Badge variant="outline" className="border-foreground/10 text-[10px]">
                  {item.relatedRelationshipId ?? t("legacy.labels.unlinked", "未关联")}
                </Badge>
              </div>
            </div>
          ))
        ) : (
          <EmptyState message={t("legacy.empty.bucket", "当前没有匹配内容。")} compact />
        )}
      </div>
    </LegacyPanel>
  )
}
