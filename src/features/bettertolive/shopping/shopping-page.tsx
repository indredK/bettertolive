import { Plus } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { AnimatedVisibility } from "@/components/ui/animated-visibility"
import { ActionGroup, AnimatedButton } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  ShoppingItem,
  ShoppingModuleData,
  ShoppingStageTemplate,
  ShoppingSystemDefinition,
  ShoppingSpaceDefinition,
} from "@/features/bettertolive/types"
import { ShoppingOverviewTab } from "@/features/bettertolive/shopping/components/overview/shopping-overview-tab"
import { ShoppingPlanningTab } from "@/features/bettertolive/shopping/components/planning/shopping-planning-tab"
import { ShoppingAttributesTab } from "@/features/bettertolive/shopping/components/attributes/shopping-attributes-tab"
import { ShoppingSpacesTab } from "@/features/bettertolive/shopping/components/spaces/shopping-spaces-tab"
import { ShoppingStagesTab } from "@/features/bettertolive/shopping/components/stages/shopping-stages-tab"
import { ShoppingSystemsTab } from "@/features/bettertolive/shopping/components/systems/shopping-systems-tab"
import { ShoppingCooldownTab } from "@/features/bettertolive/shopping/components/cooldown/shopping-cooldown-tab"
import {
  ShoppingItemEditDialog,
  type EditingItem,
} from "@/features/bettertolive/shopping/components/planning/shopping-item-edit-dialog"
import {
  ShoppingStageEditDialog,
  type EditingStage,
} from "@/features/bettertolive/shopping/components/stages/shopping-stage-edit-dialog"
import { ShoppingSpaceEditDialog } from "@/features/bettertolive/shopping/components/spaces/shopping-space-edit-dialog"
import { ShoppingSystemEditDialog } from "@/features/bettertolive/shopping/components/systems/shopping-system-edit-dialog"

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
        className="min-h-0 flex-1 flex-col overflow-hidden"
      >
        <ActionGroup>
          <div className="min-w-0 flex-1 overflow-hidden">
            <TabsList className="hide-scrollbar max-w-full shrink-0 justify-start overflow-x-auto">
              <TabsTrigger value="overview">{t("shopping.tabs.overview")}</TabsTrigger>
              <TabsTrigger value="planning">{t("shopping.tabs.planning")}</TabsTrigger>
              <TabsTrigger value="systems">{t("shopping.tabs.systems")}</TabsTrigger>
              <TabsTrigger value="spaces">{t("shopping.tabs.spaces")}</TabsTrigger>
              <TabsTrigger value="stages">{t("shopping.tabs.stages")}</TabsTrigger>
              <TabsTrigger value="attributes">{t("shopping.tabs.attributes")}</TabsTrigger>
              <TabsTrigger value="cooldown" className="gap-1.5">
                {t("shopping.tabs.cooldown")}
                {shopping.overview.cooldownCount > 0 && (
                  <span className="bg-accent text-accent-foreground ml-0.5 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] font-semibold tabular-nums">
                    {shopping.overview.cooldownCount}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <AnimatedVisibility show={isControlMode} className="shrink-0">
            <ActionGroup>
              <AnimatedButton
                show={activeTab === "planning"}
                size="sm"
                onClick={() => handleEditItem(null)}
              >
                <Plus className="size-4" />
                {t("shopping.planning.addItem")}
              </AnimatedButton>
              <AnimatedButton
                show={activeTab === "systems"}
                size="sm"
                onClick={() => setEditingSystem({ isNew: true, system: null })}
              >
                <Plus className="size-4" />
                {t("shopping.systems.addSystem")}
              </AnimatedButton>
              <AnimatedButton
                show={activeTab === "spaces"}
                size="sm"
                onClick={() => setEditingSpace({ isNew: true, space: null })}
              >
                <Plus className="size-4" />
                {t("shopping.spaces.addSpace")}
              </AnimatedButton>
              <AnimatedButton
                show={activeTab === "stages"}
                size="sm"
                onClick={() => setEditingStage({ isNew: true, stage: null })}
              >
                <Plus className="size-4" />
                {t("shopping.stages.addStage")}
              </AnimatedButton>
            </ActionGroup>
          </AnimatedVisibility>
        </ActionGroup>

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

        <TabsContent value="attributes" className="h-full min-h-0 overflow-hidden">
          <ShoppingAttributesTab
            shopping={shopping}
            isControlMode={isControlMode}
            onRefresh={refresh}
          />
        </TabsContent>

        <TabsContent value="cooldown" className="h-full min-h-0 overflow-hidden">
          <ShoppingCooldownTab
            shopping={shopping}
            isControlMode={isControlMode}
            onRefresh={refresh}
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
            toast.success(t("common.toast.saved"))
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
            toast.success(t("common.toast.saved"))
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
            toast.success(t("common.toast.saved"))
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
            toast.success(t("common.toast.saved"))
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
