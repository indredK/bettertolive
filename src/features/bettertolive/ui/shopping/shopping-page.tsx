import { AlertTriangle, House, Package2, ShoppingBasket, Sparkles } from "lucide-react"
import { gsap } from "gsap"
import { useEffect, useRef, useState } from "react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  ShoppingModuleData,
  ShoppingOwnedItem,
  ShoppingSystem,
} from "@/features/bettertolive/types"
import { PageIntro } from "@/features/bettertolive/ui/shared/shared"
import { ShoppingOverviewTab } from "@/features/bettertolive/ui/shopping/shopping-overview-tab"
import { ShoppingPlanningTab } from "@/features/bettertolive/ui/shopping/shopping-planning-tab"
import {
  FAST_DEPRECIATION,
  PRIORITY_LEVELS,
  chunkList,
  getSystemRowTemplate,
  type ShoppingLifecycleGroups,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"
import { ShoppingSpacesTab } from "@/features/bettertolive/ui/shopping/shopping-spaces-tab"
import { ShoppingStagesTab } from "@/features/bettertolive/ui/shopping/shopping-stages-tab"
import { ShoppingSystemsTab } from "@/features/bettertolive/ui/shopping/shopping-systems-tab"
import {
  type ShoppingPlanWithLane,
  type ShoppingSystemOverview,
} from "@/features/bettertolive/ui/shopping/shopping-system-detail-dialog"
import { type SpaceOverview } from "@/features/bettertolive/ui/shopping/shopping-space-detail-dialog"
import { cn } from "@/lib/utils"

export function ShoppingPage({
  shopping,
  searchQuery,
  isWideLayout = false,
  isStackedLayout = false,
}: {
  shopping: ShoppingModuleData
  searchQuery: string
  isWideLayout?: boolean
  isStackedLayout?: boolean
}) {
  const isFixedLayout = !isStackedLayout
  const [hoveredSystemId, setHoveredSystemId] = useState<string | null>(null)
  const [selectedSystemId, setSelectedSystemId] = useState<string | null>(null)
  const [hoveredSpaceName, setHoveredSpaceName] = useState<string | null>(null)
  const [selectedSpaceName, setSelectedSpaceName] = useState<string | null>(null)
  const [hoveredStageId, setHoveredStageId] = useState<string | null>(null)
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null)
  const systemRowRefs = useRef<Array<HTMLDivElement | null>>([])
  const spaceRowRefs = useRef<Array<HTMLDivElement | null>>([])
  const stageRowRefs = useRef<Array<HTMLDivElement | null>>([])

  const planItems: ShoppingPlanWithLane[] = shopping.purchaseLanes.flatMap((lane) =>
    lane.items.map((item) => ({
      ...item,
      laneId: lane.id,
      laneTitle: lane.title,
    })),
  )

  const activeSystems: ShoppingSystemOverview[] = shopping.systemDefinitions.map((definition) => {
    const owned = shopping.ownedItems.filter((item) => item.system === definition.id)
    const planned = planItems.filter((item) => item.system === definition.id)
    const spaces = Array.from(
      new Set([...owned.flatMap((item) => item.spaces), ...planned.flatMap((item) => item.spaces)]),
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
  })

  const selectedSystem = activeSystems.find((item) => item.id === selectedSystemId) ?? null
  const systemRows = chunkList(activeSystems, 7)

  const fastDepreciationWarnings = planItems.filter(
    (item) =>
      item.depreciation &&
      FAST_DEPRECIATION.has(item.depreciation) &&
      item.necessity === "提升幸福感",
  )
  const worthBuyingSlowly = planItems.filter(
    (item) => item.depreciation === "慢折旧" && item.necessity !== "提升幸福感",
  )

  const lifecycleGroups: ShoppingLifecycleGroups = {
    消耗品: { owned: [], planned: [] },
    耐用品: { owned: [], planned: [] },
    工具: { owned: [], planned: [] },
    情感物: { owned: [], planned: [] },
  }

  shopping.ownedItems.forEach((item) => {
    lifecycleGroups[item.lifecycle].owned.push(item)
  })
  planItems.forEach((item) => {
    lifecycleGroups[item.lifecycle].planned.push(item)
  })

  const spaceMap = new Map<
    string,
    {
      name: string
      owned: ShoppingOwnedItem[]
      planned: ShoppingPlanWithLane[]
      systems: Set<ShoppingSystem>
    }
  >()

  shopping.ownedItems.forEach((item) => {
    item.spaces.forEach((space) => {
      const current = spaceMap.get(space) ?? {
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

  const spaces: SpaceOverview[] = Array.from(spaceMap.values()).sort(
    (left, right) =>
      right.owned.length + right.planned.length - (left.owned.length + left.planned.length),
  )
  const spaceRows = chunkList(spaces, 5)
  const stageRows = chunkList(shopping.stageChecklists, 7)
  const overlookedCollection = shopping.lifestyleCollections.find(
    (collection) => collection.id === "collection-overlooked",
  )
  const featuredCollections = shopping.lifestyleCollections.filter(
    (collection) => collection.id !== "collection-overlooked",
  )
  const priorityItems = planItems.filter((item) => PRIORITY_LEVELS.has(item.necessity))

  useEffect(() => {
    if (!isFixedLayout) {
      return
    }

    const rowElements = [...systemRowRefs.current]

    systemRows.forEach((row, rowIndex) => {
      const rowElement = rowElements[rowIndex]

      if (!rowElement) {
        return
      }

      const activeIndex = row.findIndex((item) => item.id === hoveredSystemId)

      gsap.to(rowElement, {
        gridTemplateColumns: getSystemRowTemplate(
          row.length,
          activeIndex === -1 ? null : activeIndex,
        ),
        duration: activeIndex === -1 ? 0.4 : 0.52,
        ease: "power2.inOut",
        overwrite: "auto",
      })
    })

    return () => {
      rowElements.forEach((rowElement) => {
        if (rowElement) {
          gsap.killTweensOf(rowElement)
        }
      })
    }
  }, [hoveredSystemId, isFixedLayout, systemRows])

  useEffect(() => {
    if (!isFixedLayout) {
      return
    }

    const rowElements = [...spaceRowRefs.current]

    spaceRows.forEach((row, rowIndex) => {
      const rowElement = rowElements[rowIndex]

      if (!rowElement) {
        return
      }

      const activeIndex = row.findIndex((item) => item.name === hoveredSpaceName)

      gsap.to(rowElement, {
        gridTemplateColumns: getSystemRowTemplate(
          row.length,
          activeIndex === -1 ? null : activeIndex,
        ),
        duration: activeIndex === -1 ? 0.4 : 0.52,
        ease: "power2.inOut",
        overwrite: "auto",
      })
    })

    return () => {
      rowElements.forEach((rowElement) => {
        if (rowElement) {
          gsap.killTweensOf(rowElement)
        }
      })
    }
  }, [hoveredSpaceName, isFixedLayout, spaceRows])

  useEffect(() => {
    if (!isFixedLayout) {
      return
    }

    const rowElements = [...stageRowRefs.current]

    stageRows.forEach((row, rowIndex) => {
      const rowElement = rowElements[rowIndex]

      if (!rowElement) {
        return
      }

      const activeIndex = row.findIndex((item) => item.id === hoveredStageId)

      gsap.to(rowElement, {
        gridTemplateColumns: getSystemRowTemplate(
          row.length,
          activeIndex === -1 ? null : activeIndex,
        ),
        duration: activeIndex === -1 ? 0.4 : 0.52,
        ease: "power2.inOut",
        overwrite: "auto",
      })
    })

    return () => {
      rowElements.forEach((rowElement) => {
        if (rowElement) {
          gsap.killTweensOf(rowElement)
        }
      })
    }
  }, [hoveredStageId, isFixedLayout, stageRows])

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <PageIntro
        eyebrow="生活物品"
        title="生活物品分类工作台"
        description="先用只读方式把分类体系立起来，再决定以后要不要做录入和操作。"
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
            总览
          </TabsTrigger>
          <TabsTrigger value="systems" className={cn("px-3", isWideLayout && "px-2.5 text-[13px]")}>
            <Package2 />
            系统地图
          </TabsTrigger>
          <TabsTrigger value="spaces" className={cn("px-3", isWideLayout && "px-2.5 text-[13px]")}>
            <House />
            空间巡检
          </TabsTrigger>
          <TabsTrigger value="stages" className={cn("px-3", isWideLayout && "px-2.5 text-[13px]")}>
            <Sparkles />
            阶段模板
          </TabsTrigger>
          <TabsTrigger
            value="planning"
            className={cn("px-3", isWideLayout && "px-2.5 text-[13px]")}
          >
            <ShoppingBasket />
            采购决策
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
        />

        <ShoppingSystemsTab
          systemRows={systemRows}
          systemRowRefs={systemRowRefs}
          hoveredSystemId={hoveredSystemId}
          selectedSystem={selectedSystem}
          isFixedLayout={isFixedLayout}
          onHoverSystem={setHoveredSystemId}
          onOpenSystem={setSelectedSystemId}
          onOpenChange={(open) => {
            if (!open) {
              setHoveredSystemId(null)
              setSelectedSystemId(null)
            }
          }}
        />

        <ShoppingSpacesTab
          spaceRows={spaceRows}
          spaces={spaces}
          spaceRowRefs={spaceRowRefs}
          hoveredSpaceName={hoveredSpaceName}
          selectedSpaceName={selectedSpaceName}
          isWideLayout={isWideLayout}
          isFixedLayout={isFixedLayout}
          onHoverSpace={setHoveredSpaceName}
          onOpenSpace={setSelectedSpaceName}
          onOpenChange={(open) => {
            if (!open) {
              setHoveredSpaceName(null)
              setSelectedSpaceName(null)
            }
          }}
        />

        <ShoppingStagesTab
          stageRows={stageRows}
          shoppingStageChecklists={shopping.stageChecklists}
          stageRowRefs={stageRowRefs}
          hoveredStageId={hoveredStageId}
          selectedStageId={selectedStageId}
          isWideLayout={isWideLayout}
          isFixedLayout={isFixedLayout}
          onHoverStage={setHoveredStageId}
          onOpenStage={setSelectedStageId}
          onOpenChange={(open) => {
            if (!open) {
              setHoveredStageId(null)
              setSelectedStageId(null)
            }
          }}
        />

        <ShoppingPlanningTab
          shopping={shopping}
          priorityItems={priorityItems}
          isWideLayout={isWideLayout}
          isFixedLayout={isFixedLayout}
        />
      </Tabs>
    </div>
  )
}
