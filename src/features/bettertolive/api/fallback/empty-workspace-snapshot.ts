import { emptyBeliefsModuleData } from "@/features/bettertolive/api/fallback/empty-beliefs-module"
import { emptyEmotionModuleData } from "@/features/bettertolive/api/fallback/empty-emotion-module"
import { emptyEventsModuleData } from "@/features/bettertolive/api/fallback/empty-events-module"
import { emptyFinanceModuleData } from "@/features/bettertolive/api/fallback/empty-finance-module"
import { emptyFutureModuleData } from "@/features/bettertolive/api/fallback/empty-future-module"
import {
  emptyGrowthModuleData,
  emptyMemoryModuleData,
} from "@/features/bettertolive/api/fallback/empty-growth-memory-module"
import { emptyLegacyModuleData } from "@/features/bettertolive/api/fallback/empty-legacy-module"
import { emptyNutritionModuleData } from "@/features/bettertolive/api/fallback/empty-nutrition-module"
import { emptyOverviewModuleData } from "@/features/bettertolive/api/fallback/empty-overview-module"
import { emptyPrinciplesModuleData } from "@/features/bettertolive/api/fallback/empty-principles-module"
import { emptyReflectionModuleData } from "@/features/bettertolive/api/fallback/empty-reflection-module"
import { emptyRelationshipsModuleData } from "@/features/bettertolive/api/fallback/empty-relationships-module"
import { emptyShoppingModuleData } from "@/features/bettertolive/api/fallback/empty-shopping-module"
import { emptySocioeconomicsModuleData } from "@/features/bettertolive/api/fallback/empty-socioeconomics-module"
import type { WorkspaceSnapshot } from "@/features/bettertolive/models/workspace"

export const emptyWorkspaceSnapshot = {
  overview: emptyOverviewModuleData,
  reflection: emptyReflectionModuleData,
  events: emptyEventsModuleData,
  finance: emptyFinanceModuleData,
  shopping: emptyShoppingModuleData,
  nutrition: emptyNutritionModuleData,
  emotion: emptyEmotionModuleData,
  beliefs: emptyBeliefsModuleData,
  principles: emptyPrinciplesModuleData,
  relationships: emptyRelationshipsModuleData,
  growth: emptyGrowthModuleData,
  memory: emptyMemoryModuleData,
  legacy: emptyLegacyModuleData,
  socioeconomics: emptySocioeconomicsModuleData,
  future: emptyFutureModuleData,
} satisfies WorkspaceSnapshot
