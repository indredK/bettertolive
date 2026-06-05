import { AlertTriangle, House, Package2, ShoppingBasket, Sparkles } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  ShoppingModuleData,
  ShoppingOwnedItem,
  ShoppingStageChecklist,
  ShoppingSystem,
} from "@/features/bettertolive/types"
import {
  ShoppingDepreciation,
  ShoppingLifecycle,
  ShoppingNeedLevel,
} from "@/features/bettertolive/types"
import { PageIntro } from "@/features/bettertolive/ui/shared/shared"
import { ShoppingOverviewTab } from "@/features/bettertolive/ui/shopping/shopping-overview-tab"
import { ShoppingPlanningTab } from "@/features/bettertolive/ui/shopping/shopping-planning-tab"
import {
  FAST_DEPRECIATION,
  PRIORITY_LEVELS,
  type ShoppingLifecycleGroups,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"
import {
  type EditingItem,
  ShoppingItemEditDialog,
} from "@/features/bettertolive/ui/shopping/shopping-item-edit-dialog"
import { ShoppingStageEditDialog } from "@/features/bettertolive/ui/shopping/shopping-stage-edit-dialog"
import { ShoppingSpaceEditDialog } from "@/features/bettertolive/ui/shopping/shopping-space-edit-dialog"
import { ShoppingSpacesTab } from "@/features/bettertolive/ui/shopping/shopping-spaces-tab"
import { ShoppingStagesTab } from "@/features/bettertolive/ui/shopping/shopping-stages-tab"
import { ShoppingSystemEditDialog } from "@/features/bettertolive/ui/shopping/shopping-system-edit-dialog"
import { ShoppingSystemsTab } from "@/features/bettertolive/ui/shopping/shopping-systems-tab"
import {
  type ShoppingPlanWithLane,
  type ShoppingSystemOverview,
  type SpaceOverview,
} from "@/features/bettertolive/ui/shopping/shopping-types"
import {
  createSpaceDefinition,
  reorderShoppingPageContents,
  reorderSystemDefinitions,
} from "@/features/bettertolive/api/shopping-crud-api"
import { cn } from "@/lib/utils"

export function ShoppingPage({
  shopping,
  searchQuery,
  isWideLayout = false,
  isStackedLayout = false,
  isManagementMode = false,
  onRefresh,
}: {
  shopping: ShoppingModuleData
  searchQuery: string
  isWideLayout?: boolean
  isStackedLayout?: boolean
  isManagementMode?: boolean
  onRefresh?: () => void
}) {
  const { t } = useTranslation()
  const isFixedLayout = !isStackedLayout
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null)
  const [selectedSpaceName, setSelectedSpaceName] = useState<string | null>(null)
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null)
  const [editingStage, setEditingStage] = useState<{
    isNew: boolean
    checklist: ShoppingStageChecklist | null
  } | null>(null)
  const [editingSystem, setEditingSystem] = useState<{
    isNew: boolean
    system: ShoppingSystemOverview | null
  } | null>(null)
  const [editingSpace, setEditingSpace] = useState<{
    isNew: boolean
    space: SpaceOverview | null
  } | null>(null)
  const [spacesOrder, setSpacesOrder] = useState<string[] | null>(null)

  // ---- Reorder handlers ----

  const handleReorderSystems = async (orderedIds: string[]) => {
    try {
      await reorderSystemDefinitions(orderedIds)
      toast.success(t("shopping.toast.reorderSuccess"))
      onRefresh?.()
    } catch {
      toast.error(t("shopping.toast.reorderFailed"))
    }
  }

  const handleReorderSpaces = async (orderedNames: string[]) => {
    setSpacesOrder(orderedNames)
    try {
      const definitionIdsByName = new Map<string, string>(
        shopping.spaceDefinitions.map((definition) => [definition.name, definition.id]),
      )
      const orderedIds: string[] = []

      for (const name of orderedNames) {
        let definitionId = definitionIdsByName.get(name)
        if (!definitionId) {
          const created = await createSpaceDefinition({ name })
          definitionId = created.id
          definitionIdsByName.set(name, definitionId)
        }
        if (!definitionId) {
          throw new Error(`Missing space definition id for ${name}`)
        }
        orderedIds.push(definitionId)
      }

      await reorderShoppingPageContents(orderedIds)
      toast.success(t("shopping.toast.reorderSuccess"))
      onRefresh?.()
    } catch {
      toast.error(t("shopping.toast.reorderFailed"))
    }
  }

  const handleReorderStages = async (orderedIds: string[]) => {
    try {
      await reorderShoppingPageContents(orderedIds)
      toast.success(t("shopping.toast.reorderSuccess"))
      onRefresh?.()
    } catch {
      toast.error(t("shopping.toast.reorderFailed"))
    }
  }

  const handleSaved = () => {
    setEditingItem(null)
    onRefresh?.()
  }

  const handleStageSaved = () => {
    setEditingStage(null)
    onRefresh?.()
  }

  const handleSystemSaved = () => {
    setEditingSystem(null)
    onRefresh?.()
  }

  const handleSpaceSaved = () => {
    setEditingSpace(null)
    onRefresh?.()
  }

  const startEditStage = (checklist: ShoppingStageChecklist) => {
    setEditingStage({ isNew: false, checklist })
  }

  const startAddStage = () => {
    setEditingStage({ isNew: true, checklist: null })
  }

  const startEditSystem = (system: ShoppingSystemOverview) => {
    setEditingSystem({ isNew: false, system })
  }

  const startAddSystem = () => {
    setEditingSystem({ isNew: true, system: null })
  }

  const startEditSpace = (space: SpaceOverview) => {
    setEditingSpace({ isNew: false, space })
  }

  const startAddSpace = () => {
    setEditingSpace({ isNew: true, space: null })
  }

  const startEditOwned = (item: ShoppingOwnedItem) => {
    setEditingItem({ type: "owned", item, isNew: false })
  }

  const startEditPlan = (item: ShoppingPlanWithLane) => {
    setEditingItem({ type: "plan", item, isNew: false })
  }

  const startAddPlan = () => {
    const firstLane = shopping.purchaseLanes[0]
    const firstSystemId = shopping.systemDefinitions[0]?.id ?? ""
    const newPlanItem: ShoppingPlanWithLane = {
      id: `new-${Date.now()}`,
      name: "",
      system: firstSystemId,
      category: "",
      spaces: [],
      stages: [],
      necessity: ShoppingNeedLevel.Necessary,
      lifecycle: ShoppingLifecycle.Durable,
      reason: "",
      targetLifestyle: "",
      currentPrice: 0,
      buyBelowPrice: 0,
      overpayPrice: 0,
      note: "",
      tags: [],
      keywords: [],
      laneId: firstLane?.id ?? "",
      laneTitle: firstLane?.title ?? "",
    }
    setEditingItem({ type: "plan", item: newPlanItem, isNew: true })
  }

  const lanes = useMemo(
    () =>
      shopping.purchaseLanes.map((lane) => ({
        id: lane.id,
        title: lane.title,
      })),
    [shopping.purchaseLanes],
  )

  const planItems = useMemo(
    () =>
      shopping.purchaseLanes.flatMap((lane) =>
        lane.items.map((item) => ({
          ...item,
          laneId: lane.id,
          laneTitle: lane.title,
        })),
      ),
    [shopping.purchaseLanes],
  )

  const activeSystems = useMemo(
    () =>
      shopping.systemDefinitions.map((definition) => {
        const owned = shopping.ownedItems.filter((item) => item.system === definition.id)
        const planned = planItems.filter((item) => item.system === definition.id)
        const spaces = Array.from(
          new Set([
            ...owned.flatMap((item) => item.spaces),
            ...planned.flatMap((item) => item.spaces),
          ]),
        )
        const urgentCount = planned.filter((item) => PRIORITY_LEVELS.has(item.necessity)).length

        return {
          ...definition,
          owned,
          planned,
          spaces,
          urgentCount,
          isActive: owned.length + planned.length > 0,
        }
      }),
    [shopping.systemDefinitions, shopping.ownedItems, planItems],
  )

  const fastDepreciationWarnings = useMemo(
    () =>
      planItems.filter(
        (item) =>
          item.depreciation &&
          FAST_DEPRECIATION.has(item.depreciation) &&
          item.necessity === ShoppingNeedLevel.HappinessBoost,
      ),
    [planItems],
  )

  const worthBuyingSlowly = useMemo(
    () =>
      planItems.filter(
        (item) =>
          item.depreciation === ShoppingDepreciation.Slow &&
          item.necessity !== ShoppingNeedLevel.HappinessBoost,
      ),
    [planItems],
  )

  const lifecycleGroups = useMemo((): ShoppingLifecycleGroups => {
    const groups: ShoppingLifecycleGroups = {
      [ShoppingLifecycle.Consumable]: { owned: [], planned: [] },
      [ShoppingLifecycle.Durable]: { owned: [], planned: [] },
      [ShoppingLifecycle.Tool]: { owned: [], planned: [] },
      [ShoppingLifecycle.Emotional]: { owned: [], planned: [] },
    }

    shopping.ownedItems.forEach((item) => {
      groups[item.lifecycle].owned.push(item)
    })
    planItems.forEach((item) => {
      groups[item.lifecycle].planned.push(item)
    })

    return groups
  }, [shopping.ownedItems, planItems])

  const spaces = useMemo((): SpaceOverview[] => {
    const spaceMap = new Map<
      string,
      {
        definitionId: string | null
        name: string
        owned: ShoppingOwnedItem[]
        planned: ShoppingPlanWithLane[]
        systems: Set<ShoppingSystem>
      }
    >()

    shopping.spaceDefinitions.forEach((definition) => {
      spaceMap.set(definition.name, {
        definitionId: definition.id,
        name: definition.name,
        owned: [],
        planned: [],
        systems: new Set<ShoppingSystem>(),
      })
    })

    shopping.ownedItems.forEach((item) => {
      item.spaces.forEach((space) => {
        const current = spaceMap.get(space) ?? {
          definitionId: null,
          name: space,
          owned: [],
          planned: [],
          systems: new Set<ShoppingSystem>(),
        }
        current.owned.push(item)
        current.systems.add(item.system)
        spaceMap.set(space, current)
      })
    })

    planItems.forEach((item) => {
      item.spaces.forEach((space) => {
        const current = spaceMap.get(space) ?? {
          definitionId: null,
          name: space,
          owned: [],
          planned: [],
          systems: new Set<ShoppingSystem>(),
        }
        current.planned.push(item)
        current.systems.add(item.system)
        spaceMap.set(space, current)
      })
    })

    const definitionOrder = new Map(
      shopping.spaceDefinitions.map((definition, index) => [definition.id, index]),
    )

    return Array.from(spaceMap.values()).sort((left, right) => {
      const leftOrder =
        left.definitionId === null
          ? Number.POSITIVE_INFINITY
          : (definitionOrder.get(left.definitionId) ?? Number.POSITIVE_INFINITY)
      const rightOrder =
        right.definitionId === null
          ? Number.POSITIVE_INFINITY
          : (definitionOrder.get(right.definitionId) ?? Number.POSITIVE_INFINITY)

      if (leftOrder !== rightOrder) return leftOrder - rightOrder

      const countDiff =
        right.owned.length + right.planned.length - (left.owned.length + left.planned.length)
      if (countDiff !== 0) return countDiff

      return left.name.localeCompare(right.name, "zh-Hans-CN")
    })
  }, [shopping.spaceDefinitions, shopping.ownedItems, planItems])

  const orderedSpaces = useMemo(() => {
    if (!spacesOrder) return spaces
    const orderMap = new Map(spacesOrder.map((name, i) => [name, i]))
    return [...spaces].sort((a, b) => {
      const ai = orderMap.get(a.name) ?? Infinity
      const bi = orderMap.get(b.name) ?? Infinity
      return ai - bi
    })
  }, [spaces, spacesOrder])

  const overlookedCollection = useMemo(
    () =>
      shopping.lifestyleCollections.find((collection) => collection.id === "collection-overlooked"),
    [shopping.lifestyleCollections],
  )

  const featuredCollections = useMemo(
    () =>
      shopping.lifestyleCollections.filter(
        (collection) => collection.id !== "collection-overlooked",
      ),
    [shopping.lifestyleCollections],
  )

  // Derive displayed selection — fall back to first item when nothing is selected or selection is stale
  const displaySystemId = selectedSystemId ?? activeSystems[0]?.id ?? null
  const displaySpaceName = selectedSpaceName ?? spaces[0]?.name ?? null
  const displayStageId = selectedStageId ?? shopping.stageChecklists[0]?.id ?? null

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <PageIntro
        eyebrow={t("shopping.page.eyebrow")}
        title={t("shopping.page.title")}
        description={t("shopping.page.description")}
        searchQuery={searchQuery}
      />

      <Tabs
        defaultValue="overview"
        className={cn(
          "gap-4",
          isFixedLayout && "min-h-0 flex-1 overflow-hidden",
          isWideLayout && "gap-3",
        )}
      >
        <TabsList
          variant="line"
          className={cn(
            "flex w-full flex-wrap items-center gap-1 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-1",
            isFixedLayout && "shrink-0",
            isWideLayout && "gap-0.5 p-0.5",
          )}
        >
          <TabsTrigger
            value="overview"
            className={cn("px-3", isWideLayout && "px-2.5 text-[13px]")}
          >
            <AlertTriangle />
            {t("shopping.tabs.overview")}
          </TabsTrigger>
          <TabsTrigger value="systems" className={cn("px-3", isWideLayout && "px-2.5 text-[13px]")}>
            <Package2 />
            {t("shopping.tabs.systems")}
          </TabsTrigger>
          <TabsTrigger value="spaces" className={cn("px-3", isWideLayout && "px-2.5 text-[13px]")}>
            <House />
            {t("shopping.tabs.spaces")}
          </TabsTrigger>
          <TabsTrigger value="stages" className={cn("px-3", isWideLayout && "px-2.5 text-[13px]")}>
            <Sparkles />
            {t("shopping.tabs.stages")}
          </TabsTrigger>
          <TabsTrigger
            value="planning"
            className={cn("px-3", isWideLayout && "px-2.5 text-[13px]")}
          >
            <ShoppingBasket />
            {t("shopping.tabs.planning")}
          </TabsTrigger>
        </TabsList>

        <ShoppingOverviewTab
          shopping={shopping}
          lifecycleGroups={lifecycleGroups}
          fastDepreciationWarnings={fastDepreciationWarnings}
          worthBuyingSlowly={worthBuyingSlowly}
          featuredCollections={featuredCollections}
          overlookedCollection={overlookedCollection}
          isWideLayout={isWideLayout}
          isFixedLayout={isFixedLayout}
          isManagementMode={isManagementMode}
          onEditPlan={isManagementMode ? startEditPlan : undefined}
        />

        <ShoppingSystemsTab
          systems={activeSystems}
          selectedSystemId={displaySystemId}
          isFixedLayout={isFixedLayout}
          isManagementMode={isManagementMode}
          onSelectSystem={setSelectedSystemId}
          onAddNew={isManagementMode ? startAddSystem : undefined}
          onEditSystem={isManagementMode ? startEditSystem : undefined}
          onEditOwned={isManagementMode ? startEditOwned : undefined}
          onEditPlan={isManagementMode ? startEditPlan : undefined}
          onReorder={isManagementMode ? handleReorderSystems : undefined}
        />

        <ShoppingSpacesTab
          spaces={orderedSpaces}
          selectedSpaceName={displaySpaceName}
          isFixedLayout={isFixedLayout}
          isManagementMode={isManagementMode}
          onSelectSpace={setSelectedSpaceName}
          onAddNew={isManagementMode ? startAddSpace : undefined}
          onEditSpace={isManagementMode ? startEditSpace : undefined}
          onEditOwned={isManagementMode ? startEditOwned : undefined}
          onEditPlan={isManagementMode ? startEditPlan : undefined}
          onReorder={isManagementMode ? handleReorderSpaces : undefined}
        />

        <ShoppingStagesTab
          checklists={shopping.stageChecklists}
          selectedStageId={displayStageId}
          isFixedLayout={isFixedLayout}
          isManagementMode={isManagementMode}
          onSelectStage={setSelectedStageId}
          onEditStage={isManagementMode ? startEditStage : undefined}
          onAddNew={isManagementMode ? startAddStage : undefined}
          onReorder={isManagementMode ? handleReorderStages : undefined}
        />

        <ShoppingPlanningTab
          shopping={shopping}
          planItems={planItems}
          isWideLayout={isWideLayout}
          isFixedLayout={isFixedLayout}
          isManagementMode={isManagementMode}
          onEditPlan={isManagementMode ? startEditPlan : undefined}
          onAddNew={isManagementMode ? startAddPlan : undefined}
        />

        <ShoppingItemEditDialog
          editing={editingItem}
          lanes={lanes}
          systemOptions={shopping.systemDefinitions.map((definition) => definition.id)}
          onClose={() => setEditingItem(null)}
          onSaved={handleSaved}
        />

        <ShoppingStageEditDialog
          editing={editingStage}
          systemOptions={shopping.systemDefinitions.map((definition) => definition.id)}
          onClose={() => setEditingStage(null)}
          onSaved={handleStageSaved}
        />

        <ShoppingSystemEditDialog
          editing={editingSystem}
          existingSystemIds={shopping.systemDefinitions.map((definition) => definition.id)}
          onClose={() => setEditingSystem(null)}
          onSaved={handleSystemSaved}
        />

        <ShoppingSpaceEditDialog
          editing={editingSpace}
          existingSpaceNames={spaces.map((space) => space.name)}
          onClose={() => setEditingSpace(null)}
          onSaved={handleSpaceSaved}
        />
      </Tabs>
    </div>
  )
}
