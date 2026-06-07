import type { BetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { workspaceSnapshotMockData } from "@/features/bettertolive/api/mock/data/workspace-snapshot.mock"
import type { NutritionModuleData } from "@/features/bettertolive/types"

const MOCK_API_LATENCY_MS = 80
let nutritionMockData: NutritionModuleData = cloneMockData(workspaceSnapshotMockData.nutrition)

function cloneMockData<T>(data: T): T {
  if (typeof data === "undefined") {
    return data
  }

  return JSON.parse(JSON.stringify(data)) as T
}

function withMockLatency<T>(data: T) {
  return new Promise<T>((resolve) => {
    globalThis.setTimeout(() => resolve(cloneMockData(data)), MOCK_API_LATENCY_MS)
  })
}

export function createMockBetterToLiveApi(): BetterToLiveApi {
  return {
    getOverview: () => withMockLatency(workspaceSnapshotMockData.overview),
    getReflection: () => withMockLatency(workspaceSnapshotMockData.reflection),
    getEvents: () => withMockLatency(workspaceSnapshotMockData.events),
    getFinance: () => withMockLatency(workspaceSnapshotMockData.finance),
    getShopping: () => withMockLatency(workspaceSnapshotMockData.shopping),
    getNutrition: () => withMockLatency(nutritionMockData),
    saveNutrition: (nutrition) => {
      nutritionMockData = cloneMockData(nutrition)
      return withMockLatency(undefined)
    },
    getEmotion: () => withMockLatency(workspaceSnapshotMockData.emotion),
    getBeliefs: () => withMockLatency(workspaceSnapshotMockData.beliefs),
    getPrinciples: () => withMockLatency(workspaceSnapshotMockData.principles),
    getRelationships: () => withMockLatency(workspaceSnapshotMockData.relationships),
    getGrowth: () => withMockLatency(workspaceSnapshotMockData.growth),
    getMemory: () => withMockLatency(workspaceSnapshotMockData.memory),
    getJourney: () =>
      withMockLatency({
        ...workspaceSnapshotMockData.growth,
        ...workspaceSnapshotMockData.memory,
      }),
    getLegacy: () => withMockLatency(workspaceSnapshotMockData.legacy),
    getSocioeconomics: () => withMockLatency(workspaceSnapshotMockData.socioeconomics),
    getFuture: () => withMockLatency(workspaceSnapshotMockData.future),
    getWorkspaceSnapshot: () =>
      withMockLatency({
        ...workspaceSnapshotMockData,
        nutrition: nutritionMockData,
      }),
  }
}
