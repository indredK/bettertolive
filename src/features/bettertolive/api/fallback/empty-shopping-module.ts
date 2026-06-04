import type { ShoppingModuleData } from "@/features/bettertolive/models/workspace"

export const emptyShoppingModuleData = {
  systemDefinitions: [],
  spotlights: [],
  ownedItems: [],
  purchaseLanes: [],
  stageChecklists: [],
  priceReferences: [],
  boundaryEntries: [],
  lifestyleCollections: [],
} satisfies ShoppingModuleData
