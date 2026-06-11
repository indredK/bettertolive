import { Plus } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { ActionGroup, AnimatedButton } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { LegacyItem, LegacyModuleData } from "@/features/bettertolive/types"
import { LegacyDeliveryMapTab } from "@/features/bettertolive/ui/legacy/legacy-delivery-map-tab"
import {
  LegacyItemEditDialog,
  type EditingLegacyItem,
} from "@/features/bettertolive/ui/legacy/legacy-item-edit-dialog"
import { LegacyItemsTab } from "@/features/bettertolive/ui/legacy/legacy-items-tab"
import { LegacyOverviewTab } from "@/features/bettertolive/ui/legacy/legacy-overview-tab"
import { LegacyRelationshipExpressionTab } from "@/features/bettertolive/ui/legacy/legacy-relationship-expression-tab"
import { LegacyTrustBoundariesTab } from "@/features/bettertolive/ui/legacy/legacy-trust-boundaries-tab"
import { cn } from "@/lib/utils"

export function LegacyPage({
  legacy,
  isStackedLayout = false,
  isControlMode = false,
  onRefresh,
}: {
  legacy: LegacyModuleData
  isStackedLayout?: boolean
  isControlMode?: boolean
  onRefresh?: () => void
}) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("overview")
  const [editingItem, setEditingItem] = useState<EditingLegacyItem | null>(null)
  const tabContentClassName = cn(
    "mt-2 min-h-0",
    isStackedLayout ? "overflow-visible" : "h-full overflow-hidden",
  )

  const handleEditItem = (item: LegacyItem | null) => {
    setEditingItem({ isNew: item === null, item })
  }

  const refresh = () => {
    onRefresh?.()
  }

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col",
        isStackedLayout ? "min-h-full gap-4 overflow-visible" : "h-full gap-6 overflow-hidden",
      )}
    >
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className={cn(
          "min-h-0 flex-1 flex-col",
          isStackedLayout ? "overflow-visible" : "overflow-hidden",
        )}
      >
        <ActionGroup>
          <div className="min-w-0 flex-1 overflow-hidden">
            <TabsList className="hide-scrollbar max-w-full shrink-0 justify-start overflow-x-auto">
              <TabsTrigger value="overview">{t("legacy.tabs.overview", "总览")}</TabsTrigger>
              <TabsTrigger value="items">{t("legacy.tabs.items", "条目库")}</TabsTrigger>
              <TabsTrigger value="deliveryMap">
                {t("legacy.tabs.deliveryMap", "交付地图")}
              </TabsTrigger>
              <TabsTrigger value="relationshipExpression">
                {t("legacy.tabs.relationshipExpression", "关系表达")}
              </TabsTrigger>
              <TabsTrigger value="trustBoundaries">
                {t("legacy.tabs.trustBoundaries", "边界与信任")}
              </TabsTrigger>
            </TabsList>
          </div>

          <AnimatedButton
            show={isControlMode && activeTab === "items"}
            size="sm"
            onClick={() => handleEditItem(null)}
          >
            <Plus className="size-4" />
            {t("legacy.actions.add", "新增")}
          </AnimatedButton>
        </ActionGroup>

        <TabsContent value="overview" className={tabContentClassName}>
          <LegacyOverviewTab
            legacy={legacy}
            items={legacy.items}
            onEditItem={isControlMode ? handleEditItem : undefined}
          />
        </TabsContent>

        <TabsContent value="items" className={tabContentClassName}>
          <LegacyItemsTab
            items={legacy.items}
            isControlMode={isControlMode}
            onEditItem={handleEditItem}
            onDeleted={refresh}
          />
        </TabsContent>

        <TabsContent value="deliveryMap" className={tabContentClassName}>
          <LegacyDeliveryMapTab
            items={legacy.items}
            onEditItem={isControlMode ? handleEditItem : undefined}
          />
        </TabsContent>

        <TabsContent value="relationshipExpression" className={tabContentClassName}>
          <LegacyRelationshipExpressionTab
            items={legacy.items}
            onEditItem={isControlMode ? handleEditItem : undefined}
          />
        </TabsContent>

        <TabsContent value="trustBoundaries" className={tabContentClassName}>
          <LegacyTrustBoundariesTab
            legacy={legacy}
            items={legacy.items}
            onEditItem={isControlMode ? handleEditItem : undefined}
          />
        </TabsContent>
      </Tabs>

      {editingItem ? (
        <LegacyItemEditDialog
          key={editingItem.item?.id ?? "new-legacy-item"}
          editing={editingItem}
          onClose={() => setEditingItem(null)}
          onSaved={() => {
            setEditingItem(null)
            refresh()
            toast.success(t("legacy.toast.saved", "已保存"))
          }}
          onDeleted={() => {
            setEditingItem(null)
            refresh()
          }}
        />
      ) : null}
    </div>
  )
}
