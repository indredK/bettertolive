import { invoke } from "@tauri-apps/api/core"

import type { BetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { BETTERTOLIVE_API_ENDPOINTS } from "@/features/bettertolive/api/endpoints"
import { emptyShoppingModuleData } from "@/features/bettertolive/api/fallback/empty-shopping-module"
import { requestJson } from "@/features/bettertolive/api/http-client"
import { workspaceSnapshotMockData } from "@/features/bettertolive/api/mock/data/workspace-snapshot.mock"
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

function cloneData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T
}

function hasTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
}

async function getShoppingFromRust() {
  if (!hasTauriRuntime()) {
    return cloneData(emptyShoppingModuleData)
  }

  try {
    return await invoke<ShoppingModuleData>("get_shopping")
  } catch {
    return cloneData(emptyShoppingModuleData)
  }
}

async function getNutritionFromRust() {
  if (!hasTauriRuntime()) {
    return cloneData(workspaceSnapshotMockData.nutrition)
  }

  return await invoke<NutritionModuleData>("get_nutrition")
}

async function saveNutritionToRust(nutrition: NutritionModuleData) {
  if (!hasTauriRuntime()) {
    return
  }

  await invoke("save_nutrition", { nutrition })
}

export function createLiveBetterToLiveApi(): BetterToLiveApi {
  return {
    // ---- Tauri commands (Rust backend) ----

    getShopping: () => getShoppingFromRust(),

    async getWorkspaceSnapshot() {
      const [shopping, nutrition] = await Promise.all([
        getShoppingFromRust(),
        getNutritionFromRust(),
      ])

      return {
        ...cloneData(workspaceSnapshotMockData),
        shopping,
        nutrition,
      } satisfies WorkspaceSnapshot
    },

    // ---- HTTP endpoints (not yet migrated to Rust) ----

    getOverview: () => requestJson<OverviewModuleData>(BETTERTOLIVE_API_ENDPOINTS.overview),
    getReflection: () => requestJson<ReflectionModuleData>(BETTERTOLIVE_API_ENDPOINTS.reflection),
    getEvents: () => requestJson<EventsModuleData>(BETTERTOLIVE_API_ENDPOINTS.events),
    getFinance: () => requestJson<FinanceModuleData>(BETTERTOLIVE_API_ENDPOINTS.finance),
    getNutrition: () => getNutritionFromRust(),
    saveNutrition: (nutrition) => saveNutritionToRust(nutrition),
    getEmotion: () => requestJson<EmotionWorkspaceModuleData>(BETTERTOLIVE_API_ENDPOINTS.emotion),
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
  }
}
