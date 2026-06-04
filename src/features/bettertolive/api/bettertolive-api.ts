import { resolveBetterToLiveApiMode } from "@/features/bettertolive/api/config"
import { createLiveBetterToLiveApi } from "@/features/bettertolive/api/live/live-bettertolive-api"
import { createMockBetterToLiveApi } from "@/features/bettertolive/api/mock/mock-bettertolive-api"
import type {
  BeliefsModuleData,
  EmotionWorkspaceModuleData,
  EventsModuleData,
  FinanceModuleData,
  FutureModuleData,
  GrowthModuleData,
  JourneyModuleData,
  LegacyWorkspaceModuleData,
  MemoryWorkspaceModuleData,
  NutritionModuleData,
  OverviewModuleData,
  PrinciplesModuleData,
  ReflectionModuleData,
  RelationshipsModuleData,
  ShoppingModuleData,
  SocioeconomicsModuleData,
  WorkspaceSnapshot,
} from "@/features/bettertolive/models/workspace"

export type BetterToLiveApi = {
  getOverview: () => Promise<OverviewModuleData>
  getReflection: () => Promise<ReflectionModuleData>
  getEvents: () => Promise<EventsModuleData>
  getFinance: () => Promise<FinanceModuleData>
  getShopping: () => Promise<ShoppingModuleData>
  getNutrition: () => Promise<NutritionModuleData>
  getEmotion: () => Promise<EmotionWorkspaceModuleData>
  getBeliefs: () => Promise<BeliefsModuleData>
  getPrinciples: () => Promise<PrinciplesModuleData>
  getRelationships: () => Promise<RelationshipsModuleData>
  getGrowth: () => Promise<GrowthModuleData>
  getMemory: () => Promise<MemoryWorkspaceModuleData>
  getJourney: () => Promise<JourneyModuleData>
  getLegacy: () => Promise<LegacyWorkspaceModuleData>
  getSocioeconomics: () => Promise<SocioeconomicsModuleData>
  getFuture: () => Promise<FutureModuleData>
  getWorkspaceSnapshot: () => Promise<WorkspaceSnapshot>
}

let betterToLiveApiSingleton: BetterToLiveApi | null = null

export function getBetterToLiveApi() {
  if (betterToLiveApiSingleton) {
    return betterToLiveApiSingleton
  }

  betterToLiveApiSingleton =
    resolveBetterToLiveApiMode() === "live"
      ? createLiveBetterToLiveApi()
      : createMockBetterToLiveApi()

  return betterToLiveApiSingleton
}
