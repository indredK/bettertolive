import { resolveBetterToLiveApiMode } from "@/features/bettertolive/api/config"
import { createLiveBetterToLiveApi } from "@/features/bettertolive/api/live/live-bettertolive-api"
import { createMockBetterToLiveApi } from "@/features/bettertolive/api/mock/mock-bettertolive-api"
import type {
  BeliefsModuleData,
  CrisisWorkspaceModuleData,
  EmotionWorkspaceModuleData,
  EventsModuleData,
  FinanceModuleData,
  FutureModuleData,
  GrowthModuleData,
  LegacyWorkspaceModuleData,
  MemoryWorkspaceModuleData,
  OverviewModuleData,
  PrinciplesModuleData,
  ReflectionModuleData,
  RelationshipsModuleData,
  ShoppingModuleData,
  WorkspaceSnapshot,
} from "@/features/bettertolive/models/workspace"

export type BetterToLiveApi = {
  getOverview: () => Promise<OverviewModuleData>
  getReflection: () => Promise<ReflectionModuleData>
  getEvents: () => Promise<EventsModuleData>
  getFinance: () => Promise<FinanceModuleData>
  getShopping: () => Promise<ShoppingModuleData>
  getEmotion: () => Promise<EmotionWorkspaceModuleData>
  getCrisis: () => Promise<CrisisWorkspaceModuleData>
  getBeliefs: () => Promise<BeliefsModuleData>
  getPrinciples: () => Promise<PrinciplesModuleData>
  getRelationships: () => Promise<RelationshipsModuleData>
  getGrowth: () => Promise<GrowthModuleData>
  getMemory: () => Promise<MemoryWorkspaceModuleData>
  getLegacy: () => Promise<LegacyWorkspaceModuleData>
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
