import type { BetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { BETTERTOLIVE_API_ENDPOINTS } from "@/features/bettertolive/api/endpoints"
import { requestJson } from "@/features/bettertolive/api/http-client"
import type {
  BeliefsModuleData,
  CrisisWorkspaceModuleData,
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
} from "@/features/bettertolive/models/workspace"

export function createLiveBetterToLiveApi(): BetterToLiveApi {
  return {
    getOverview: () => requestJson<OverviewModuleData>(BETTERTOLIVE_API_ENDPOINTS.overview),
    getReflection: () => requestJson<ReflectionModuleData>(BETTERTOLIVE_API_ENDPOINTS.reflection),
    getEvents: () => requestJson<EventsModuleData>(BETTERTOLIVE_API_ENDPOINTS.events),
    getFinance: () => requestJson<FinanceModuleData>(BETTERTOLIVE_API_ENDPOINTS.finance),
    getShopping: () => requestJson<ShoppingModuleData>(BETTERTOLIVE_API_ENDPOINTS.shopping),
    getNutrition: () => requestJson<NutritionModuleData>(BETTERTOLIVE_API_ENDPOINTS.nutrition),
    getEmotion: () => requestJson<EmotionWorkspaceModuleData>(BETTERTOLIVE_API_ENDPOINTS.emotion),
    getCrisis: () => requestJson<CrisisWorkspaceModuleData>(BETTERTOLIVE_API_ENDPOINTS.crisis),
    getBeliefs: () => requestJson<BeliefsModuleData>(BETTERTOLIVE_API_ENDPOINTS.beliefs),
    getPrinciples: () => requestJson<PrinciplesModuleData>(BETTERTOLIVE_API_ENDPOINTS.principles),
    getRelationships: () =>
      requestJson<RelationshipsModuleData>(BETTERTOLIVE_API_ENDPOINTS.relationships),
    getGrowth: () => requestJson<GrowthModuleData>(BETTERTOLIVE_API_ENDPOINTS.growth),
    getMemory: () => requestJson<MemoryWorkspaceModuleData>(BETTERTOLIVE_API_ENDPOINTS.memory),
    async getJourney(): Promise<JourneyModuleData> {
      const [growth, memory] = await Promise.all([
        requestJson<GrowthModuleData>(BETTERTOLIVE_API_ENDPOINTS.growth),
        requestJson<MemoryWorkspaceModuleData>(BETTERTOLIVE_API_ENDPOINTS.memory),
      ])
      return { ...growth, ...memory }
    },
    getLegacy: () => requestJson<LegacyWorkspaceModuleData>(BETTERTOLIVE_API_ENDPOINTS.legacy),
    getSocioeconomics: () =>
      requestJson<SocioeconomicsModuleData>(BETTERTOLIVE_API_ENDPOINTS.socioeconomics),
    getFuture: () => requestJson<FutureModuleData>(BETTERTOLIVE_API_ENDPOINTS.future),
    async getWorkspaceSnapshot() {
      const [
        overview,
        reflection,
        events,
        finance,
        shopping,
        nutrition,
        emotion,
        crisis,
        beliefs,
        principles,
        relationships,
        growth,
        memory,
        legacy,
        socioeconomics,
        future,
      ] = await Promise.all([
        requestJson<OverviewModuleData>(BETTERTOLIVE_API_ENDPOINTS.overview),
        requestJson<ReflectionModuleData>(BETTERTOLIVE_API_ENDPOINTS.reflection),
        requestJson<EventsModuleData>(BETTERTOLIVE_API_ENDPOINTS.events),
        requestJson<FinanceModuleData>(BETTERTOLIVE_API_ENDPOINTS.finance),
        requestJson<ShoppingModuleData>(BETTERTOLIVE_API_ENDPOINTS.shopping),
        requestJson<NutritionModuleData>(BETTERTOLIVE_API_ENDPOINTS.nutrition),
        requestJson<EmotionWorkspaceModuleData>(BETTERTOLIVE_API_ENDPOINTS.emotion),
        requestJson<CrisisWorkspaceModuleData>(BETTERTOLIVE_API_ENDPOINTS.crisis),
        requestJson<BeliefsModuleData>(BETTERTOLIVE_API_ENDPOINTS.beliefs),
        requestJson<PrinciplesModuleData>(BETTERTOLIVE_API_ENDPOINTS.principles),
        requestJson<RelationshipsModuleData>(BETTERTOLIVE_API_ENDPOINTS.relationships),
        requestJson<GrowthModuleData>(BETTERTOLIVE_API_ENDPOINTS.growth),
        requestJson<MemoryWorkspaceModuleData>(BETTERTOLIVE_API_ENDPOINTS.memory),
        requestJson<LegacyWorkspaceModuleData>(BETTERTOLIVE_API_ENDPOINTS.legacy),
        requestJson<SocioeconomicsModuleData>(BETTERTOLIVE_API_ENDPOINTS.socioeconomics),
        requestJson<FutureModuleData>(BETTERTOLIVE_API_ENDPOINTS.future),
      ])

      return {
        overview,
        reflection,
        events,
        finance,
        shopping,
        nutrition,
        emotion,
        crisis,
        beliefs,
        principles,
        relationships,
        growth,
        memory,
        legacy,
        socioeconomics,
        future,
      }
    },
  }
}
