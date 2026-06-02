import type { BetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { BETTERTOLIVE_API_ENDPOINTS } from "@/features/bettertolive/api/endpoints"
import { requestJson } from "@/features/bettertolive/api/http-client"
import type {
  BeliefsModuleData,
  EventsModuleData,
  FinanceModuleData,
  FutureModuleData,
  GrowthModuleData,
  OverviewModuleData,
  PrinciplesModuleData,
  ReflectionModuleData,
  RelationshipsModuleData,
  ShoppingModuleData,
} from "@/features/bettertolive/models/workspace"

export function createLiveBetterToLiveApi(): BetterToLiveApi {
  return {
    getOverview: () =>
      requestJson<OverviewModuleData>(BETTERTOLIVE_API_ENDPOINTS.overview),
    getReflection: () =>
      requestJson<ReflectionModuleData>(BETTERTOLIVE_API_ENDPOINTS.reflection),
    getEvents: () =>
      requestJson<EventsModuleData>(BETTERTOLIVE_API_ENDPOINTS.events),
    getFinance: () =>
      requestJson<FinanceModuleData>(BETTERTOLIVE_API_ENDPOINTS.finance),
    getShopping: () =>
      requestJson<ShoppingModuleData>(BETTERTOLIVE_API_ENDPOINTS.shopping),
    getBeliefs: () =>
      requestJson<BeliefsModuleData>(BETTERTOLIVE_API_ENDPOINTS.beliefs),
    getPrinciples: () =>
      requestJson<PrinciplesModuleData>(BETTERTOLIVE_API_ENDPOINTS.principles),
    getRelationships: () =>
      requestJson<RelationshipsModuleData>(
        BETTERTOLIVE_API_ENDPOINTS.relationships,
      ),
    getGrowth: () =>
      requestJson<GrowthModuleData>(BETTERTOLIVE_API_ENDPOINTS.growth),
    getFuture: () =>
      requestJson<FutureModuleData>(BETTERTOLIVE_API_ENDPOINTS.future),
    async getWorkspaceSnapshot() {
      const [
        overview,
        reflection,
        events,
        finance,
        shopping,
        beliefs,
        principles,
        relationships,
        growth,
        future,
      ] = await Promise.all([
        requestJson<OverviewModuleData>(BETTERTOLIVE_API_ENDPOINTS.overview),
        requestJson<ReflectionModuleData>(
          BETTERTOLIVE_API_ENDPOINTS.reflection,
        ),
        requestJson<EventsModuleData>(BETTERTOLIVE_API_ENDPOINTS.events),
        requestJson<FinanceModuleData>(BETTERTOLIVE_API_ENDPOINTS.finance),
        requestJson<ShoppingModuleData>(BETTERTOLIVE_API_ENDPOINTS.shopping),
        requestJson<BeliefsModuleData>(BETTERTOLIVE_API_ENDPOINTS.beliefs),
        requestJson<PrinciplesModuleData>(
          BETTERTOLIVE_API_ENDPOINTS.principles,
        ),
        requestJson<RelationshipsModuleData>(
          BETTERTOLIVE_API_ENDPOINTS.relationships,
        ),
        requestJson<GrowthModuleData>(BETTERTOLIVE_API_ENDPOINTS.growth),
        requestJson<FutureModuleData>(BETTERTOLIVE_API_ENDPOINTS.future),
      ])

      return {
        overview,
        reflection,
        events,
        finance,
        shopping,
        beliefs,
        principles,
        relationships,
        growth,
        future,
      }
    },
  }
}
