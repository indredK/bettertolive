import { MapPinned } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import type { LegacyItem } from "@/features/bettertolive/types"
import {
  buildLegacyDeliveryGroups,
  legacyRecipientLabel,
  legacyWarningLabel,
  translateLegacyEnum,
} from "@/features/bettertolive/ui/legacy/legacy-page-data"
import {
  LegacyEmptyDetailCard,
  LegacyItemSummaryCard,
  LegacyPanel,
  LegacySidebarPane,
  LegacyTabBody,
  LegacyWarningCallout,
} from "@/features/bettertolive/ui/legacy/legacy-page-shared"
import { EmptyState, SectionHeading, Surface } from "@/features/bettertolive/ui/shared/shared"

export function LegacyDeliveryMapTab({
  items,
  onEditItem,
}: {
  items: LegacyItem[]
  onEditItem?: (item: LegacyItem) => void
}) {
  const { t } = useTranslation()
  const groups = useMemo(() => buildLegacyDeliveryGroups(items), [items])
  const [selectedKey, setSelectedKey] = useState(groups[0]?.key ?? "")
  const selectedGroup = groups.find((group) => group.key === selectedKey) ?? groups[0]

  return (
    <LegacyTabBody>
      <LegacySidebarPane>
        <SectionHeading
          icon={MapPinned}
          title={t("legacy.deliveryMap.title")}
          description={t("legacy.deliveryMap.description")}
          compact
        />

        <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {groups.length > 0 ? (
            groups.map((group) => (
              <button
                key={group.key}
                type="button"
                onClick={() => setSelectedKey(group.key)}
                className="border-foreground/10 bg-background/70 hover:border-ring/40 w-full rounded-lg border px-3 py-2 text-left transition data-[active=true]:border-[color:var(--legacy-private-border)] data-[active=true]:bg-[color:var(--legacy-private-bg)]"
                data-active={group.key === selectedGroup?.key}
              >
                <div className="truncate text-sm font-medium">
                  {group.recipientName
                    ? `${translateLegacyEnum(t, "recipient", group.recipient)} · ${group.recipientName}`
                    : translateLegacyEnum(t, "recipient", group.recipient)}
                </div>
                <div className="text-muted-foreground mt-1 text-xs">
                  {t("legacy.deliveryMap.itemCount", {
                    count: group.items.length,
                    defaultValue: "{{count}} 份内容",
                  })}
                </div>
              </button>
            ))
          ) : (
            <EmptyState message={t("legacy.empty.items")} compact />
          )}
        </div>
      </LegacySidebarPane>

      <div className="min-h-0 flex-1">
        {selectedGroup ? (
          <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1">
            <Surface className="p-5">
              <SectionHeading
                icon={MapPinned}
                title={
                  selectedGroup.recipientName
                    ? `${translateLegacyEnum(t, "recipient", selectedGroup.recipient)} · ${selectedGroup.recipientName}`
                    : translateLegacyEnum(t, "recipient", selectedGroup.recipient)
                }
                description={t(
                  "legacy.deliveryMap.groupDescription",
                  "V1 只记录交付意图和人工确认条件，不承诺自动交付。",
                )}
              />
            </Surface>

            {selectedGroup.sections.map((section) => (
              <LegacyPanel
                key={section.visibility}
                title={translateLegacyEnum(t, "visibility", section.visibility)}
                description={t("legacy.deliveryMap.sectionCount", {
                  count: section.items.length,
                  defaultValue: "{{count}} 份内容",
                })}
              >
                <div className="space-y-3">
                  {section.warnings.length > 0 ? (
                    <LegacyWarningCallout title={t("legacy.items.warningTitle")} compact>
                      <div className="flex flex-wrap gap-2">
                        {section.warnings.map((warning) => (
                          <Badge
                            key={`${warning.itemId}-${warning.kind}`}
                            variant="outline"
                            className="border-current"
                          >
                            {legacyWarningLabel(warning.kind, t)}
                          </Badge>
                        ))}
                      </div>
                    </LegacyWarningCallout>
                  ) : null}

                  <div className="grid gap-3 xl:grid-cols-2">
                    {section.items.map((item) => (
                      <LegacyItemSummaryCard
                        key={item.id}
                        item={item}
                        onEdit={onEditItem ? () => onEditItem(item) : undefined}
                        compact
                      />
                    ))}
                  </div>
                </div>
              </LegacyPanel>
            ))}

            <LegacyPanel
              title={t("legacy.deliveryMap.checklistTitle")}
              description={t(
                "legacy.deliveryMap.checklistDesc",
                "这些检查来自条目字段，不生成独立数据。",
              )}
            >
              <div className="grid gap-2 md:grid-cols-2">
                {selectedGroup.items.map((item) => (
                  <div
                    key={item.id}
                    className="border-foreground/10 bg-background/70 rounded-lg border px-3 py-2"
                  >
                    <div className="truncate text-sm font-medium">{item.title}</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      <Badge variant="outline" className="text-[10px]">
                        {legacyRecipientLabel(item, t)}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {translateLegacyEnum(t, "urgency", item.urgency)}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {translateLegacyEnum(t, "status", item.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </LegacyPanel>
          </div>
        ) : (
          <LegacyEmptyDetailCard message={t("legacy.empty.items")} />
        )}
      </div>
    </LegacyTabBody>
  )
}
