import type {
  ShoppingOwnedItem,
  ShoppingPlanItem,
  ShoppingSystem,
  ShoppingSystemDefinition,
} from "@/features/bettertolive/types"

/** Plan item with its parent purchase lane metadata. */
export type ShoppingPlanWithLane = ShoppingPlanItem & {
  laneId: string
  laneTitle: string
}

/** Aggregated system overview with owned and planned items. */
export type ShoppingSystemOverview = ShoppingSystemDefinition & {
  owned: ShoppingOwnedItem[]
  planned: ShoppingPlanWithLane[]
  spaces: string[]
  urgentCount: number
  isActive: boolean
}

/** Aggregated space with owned and planned items. */
export type SpaceOverview = {
  definitionId: string | null
  name: string
  owned: ShoppingOwnedItem[]
  planned: ShoppingPlanWithLane[]
  systems: Set<ShoppingSystem>
}
