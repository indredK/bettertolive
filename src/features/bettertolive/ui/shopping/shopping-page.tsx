import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  ShoppingItem,
  ShoppingModuleData,
  ShoppingStageTemplate,
  ShoppingSystemDefinition,
  ShoppingSpaceDefinition,
} from "@/features/bettertolive/types"
import { ShoppingOverviewTab } from "@/features/bettertolive/ui/shopping/shopping-overview-tab"
import { ShoppingPlanningTab } from "@/features/bettertolive/ui/shopping/shopping-planning-tab"
import { ShoppingSpacesTab } from "@/features/bettertolive/ui/shopping/shopping-spaces-tab"
import { ShoppingStagesTab } from "@/features/bettertolive/ui/shopping/shopping-stages-tab"
import { ShoppingSystemsTab } from "@/features/bettertolive/ui/shopping/shopping-systems-tab"
import {
  ShoppingItemEditDialog,
  type EditingItem,
} from "@/features/bettertolive/ui/shopping/shopping-item-edit-dialog"
import {
  ShoppingStageEditDialog,
  type EditingStage,
} from "@/features/bettertolive/ui/shopping/shopping-stage-edit-dialog"
import { ShoppingSpaceEditDialog } from "@/features/bettertolive/ui/shopping/shopping-space-edit-dialog"
import { ShoppingSystemEditDialog } from "@/features/bettertolive/ui/shopping/shopping-system-edit-dialog"

export function ShoppingPage({
  shopping,
  searchQuery,
  isControlMode = false,
  onRefresh,
}: {
  shopping: ShoppingModuleData
  searchQuery: string
  isWideLayout?: boolean
  isStackedLayout?: boolean
  isControlMode?: boolean
  onRefresh?: () => void
}) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState("overview")
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null)
  const [editingStage, setEditingStage] = useState<EditingStage | null>(null)
  const [editingSystem, setEditingSystem] = useState<{
    isNew: boolean
    system: ShoppingSystemDefinition | null
  } | null>(null)
  const [editingSpace, setEditingSpace] = useState<{
    isNew: boolean
    space: ShoppingSpaceDefinition | null
  } | null>(null)

  const refresh = () => {
    onRefresh?.()
  }

  const handleEditItem = (item: ShoppingItem | null) => {
    setEditingItem({ isNew: item === null, item })
  }

  const filterByQuery = <T extends { name?: string; title?: string }>(items: T[]): T[] => {
    if (!searchQuery.trim()) return items
    const q = searchQuery.toLowerCase()
    return items.filter((it) => {
      const text = `${it.name ?? ""} ${it.title ?? ""}`.toLowerCase()
      return text.includes(q)
    })
  }

  const items = filterByQuery(shopping.items)

  return (
    <div className="flex h-full min-h-0 flex-col gap-6 overflow-hidden">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="min-h-0 flex-1 overflow-hidden"
      >
        <TabsList className="hide-scrollbar max-w-full shrink-0 justify-start overflow-x-auto">
          <TabsTrigger value="overview">{t("shopping.tabs.overview", "总览")}</TabsTrigger>
          <TabsTrigger value="planning">{t("shopping.tabs.planning", "物件库")}</TabsTrigger>
          <TabsTrigger value="systems">{t("shopping.tabs.systems", "物件系统")}</TabsTrigger>
          <TabsTrigger value="spaces">{t("shopping.tabs.spaces", "空间场景")}</TabsTrigger>
          <TabsTrigger value="stages">{t("shopping.tabs.stages", "阶段适用")}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="h-full min-h-0 overflow-hidden">
          <ShoppingOverviewTab shopping={shopping} />
        </TabsContent>

        <TabsContent value="planning" className="h-full min-h-0 overflow-hidden">
          <ShoppingPlanningTab
            shopping={shopping}
            items={items}
            isControlMode={isControlMode}
            onEditItem={handleEditItem}
            onDeleted={refresh}
          />
        </TabsContent>

        <TabsContent value="systems" className="h-full min-h-0 overflow-hidden">
          <ShoppingSystemsTab
            shopping={shopping}
            items={items}
            isControlMode={isControlMode}
            onEditItem={handleEditItem}
            onEditSystem={(system) => setEditingSystem({ isNew: system === null, system })}
            onDeleted={refresh}
          />
        </TabsContent>

        <TabsContent value="spaces" className="h-full min-h-0 overflow-hidden">
          <ShoppingSpacesTab
            shopping={shopping}
            items={items}
            isControlMode={isControlMode}
            onEditItem={handleEditItem}
            onEditSpace={(space) => setEditingSpace({ isNew: space === null, space })}
            onDeleted={refresh}
          />
        </TabsContent>

        <TabsContent value="stages" className="h-full min-h-0 overflow-hidden">
          <ShoppingStagesTab
            shopping={shopping}
            stageTemplates={shopping.stageTemplates}
            searchQuery={searchQuery}
            isControlMode={isControlMode}
            onEditStage={(stage: ShoppingStageTemplate | null) =>
              setEditingStage({ isNew: stage === null, stage })
            }
            onDeleted={refresh}
          />
        </TabsContent>
      </Tabs>

      {editingItem && (
        <ShoppingItemEditDialog
          key={editingItem.item?.id ?? "new-item"}
          editing={editingItem}
          shopping={shopping}
          onClose={() => setEditingItem(null)}
          onSaved={() => {
            setEditingItem(null)
            refresh()
            toast.success(t("shopping.toast.saved", "已保存"))
          }}
          onDeleted={() => {
            setEditingItem(null)
            refresh()
          }}
        />
      )}

      {editingStage && (
        <ShoppingStageEditDialog
          key={editingStage.stage?.id ?? "new-stage"}
          editing={editingStage}
          shopping={shopping}
          onClose={() => setEditingStage(null)}
          onSaved={() => {
            setEditingStage(null)
            refresh()
            toast.success(t("shopping.toast.saved", "已保存"))
          }}
          onDeleted={() => {
            setEditingStage(null)
            refresh()
          }}
        />
      )}

      {editingSystem && (
        <ShoppingSystemEditDialog
          key={editingSystem.system?.id ?? "new-system"}
          editing={editingSystem}
          shopping={shopping}
          onClose={() => setEditingSystem(null)}
          onSaved={() => {
            setEditingSystem(null)
            refresh()
            toast.success(t("shopping.toast.saved", "已保存"))
          }}
          onDeleted={() => {
            setEditingSystem(null)
            refresh()
          }}
        />
      )}

      {editingSpace && (
        <ShoppingSpaceEditDialog
          key={editingSpace.space?.id ?? "new-space"}
          editing={editingSpace}
          shopping={shopping}
          onClose={() => setEditingSpace(null)}
          onSaved={() => {
            setEditingSpace(null)
            refresh()
            toast.success(t("shopping.toast.saved", "已保存"))
          }}
          onDeleted={() => {
            setEditingSpace(null)
            refresh()
          }}
        />
      )}
    </div>
  )
}
