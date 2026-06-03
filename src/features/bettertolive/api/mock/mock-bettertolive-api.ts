import type { BetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { workspaceSnapshotMockData } from "@/features/bettertolive/api/mock/data/workspace-snapshot.mock"

const MOCK_API_LATENCY_MS = 80

function cloneMockData<T>(data: T): T {
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
    getEmotion: () => withMockLatency(workspaceSnapshotMockData.emotion),
    getCrisis: () => withMockLatency(workspaceSnapshotMockData.crisis),
    getBeliefs: () => withMockLatency(workspaceSnapshotMockData.beliefs),
    getPrinciples: () => withMockLatency(workspaceSnapshotMockData.principles),
    getRelationships: () => withMockLatency(workspaceSnapshotMockData.relationships),
    getGrowth: () => withMockLatency(workspaceSnapshotMockData.growth),
    getMemory: () => withMockLatency(workspaceSnapshotMockData.memory),
    getLegacy: () => withMockLatency(workspaceSnapshotMockData.legacy),
    getFuture: () => withMockLatency(workspaceSnapshotMockData.future),
    getWorkspaceSnapshot: () => withMockLatency(workspaceSnapshotMockData),
  }
}
