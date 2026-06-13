import type { ShoppingModuleData } from "@/features/bettertolive/models/workspace"

export const emptyShoppingModuleData = {
  overview: {
    totalItems: 0,
    ownedItems: 0,
    wantedItems: 0,
    totalSystems: 0,
    totalSpaces: 0,
    totalStages: 0,
    totalChildren: 0,
    totalSpotlights: 0,
    totalBoundaryEntries: 0,
    totalLifestyleCollections: 0,
    topStagePulses: [],
    topSystemPulses: [],
    topSpacePulses: [],
  },
  systemDefinitions: [],
  spaceDefinitions: [],
  attributeDefinitions: [],
  spotlights: [],
  items: [],
  stageTemplates: [],
  boundaryEntries: [],
  lifestyleCollections: [],
} satisfies ShoppingModuleData
