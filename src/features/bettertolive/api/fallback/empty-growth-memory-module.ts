import type {
  GrowthModuleData,
  MemoryWorkspaceModuleData,
} from "@/features/bettertolive/models/workspace"

export const emptyGrowthModuleData = {
  growthNodes: [],
  threads: [],
} satisfies GrowthModuleData

export const emptyMemoryModuleData = {
  memories: [],
  anchors: [],
  eraSuggestions: [],
  reviewPrompts: [],
} satisfies MemoryWorkspaceModuleData
