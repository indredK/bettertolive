import type { WorkspaceSnapshot } from "@/features/bettertolive/models/workspace"
import { emptyBeliefsModuleData } from "@/features/bettertolive/api/fallback/empty-beliefs-module"
import { emptyEmotionModuleData } from "@/features/bettertolive/api/fallback/empty-emotion-module"
import { emptyEventsModuleData } from "@/features/bettertolive/api/fallback/empty-events-module"
import { emptyFinanceModuleData } from "@/features/bettertolive/api/fallback/empty-finance-module"
import { emptyLegacyModuleData } from "@/features/bettertolive/api/fallback/empty-legacy-module"
import { futureMockData } from "@/features/bettertolive/api/mock/data/future/future.mock"
import { growthMockData } from "@/features/bettertolive/api/mock/data/growth/growth.mock"
import { memoryMockData } from "@/features/bettertolive/api/mock/data/memory/memory.mock"
import { nutritionMockData } from "@/features/bettertolive/api/mock/data/nutrition/nutrition.mock"
import { overviewMockData } from "@/features/bettertolive/api/mock/data/overview/overview.mock"
import { principlesMockData } from "@/features/bettertolive/api/mock/data/principles/principles.mock"
import { reflectionMockData } from "@/features/bettertolive/api/mock/data/reflection/reflection.mock"
import { relationshipsMockData } from "@/features/bettertolive/api/mock/data/relationships/relationships.mock"
import { socioeconomicsMockData } from "@/features/bettertolive/api/mock/data/socioeconomics/socioeconomics.mock"
import { emptyShoppingModuleData } from "@/features/bettertolive/api/fallback/empty-shopping-module"

export const workspaceSnapshotMockData = {
  overview: overviewMockData,
  reflection: reflectionMockData,
  events: emptyEventsModuleData,
  finance: emptyFinanceModuleData,
  shopping: emptyShoppingModuleData,
  nutrition: nutritionMockData,
  emotion: emptyEmotionModuleData,
  beliefs: emptyBeliefsModuleData,
  principles: principlesMockData,
  relationships: relationshipsMockData,
  growth: growthMockData,
  memory: memoryMockData,
  legacy: emptyLegacyModuleData,
  socioeconomics: socioeconomicsMockData,
  future: futureMockData,
} satisfies WorkspaceSnapshot
