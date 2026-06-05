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
  ShoppingOwnedStatus,
  ShoppingStage,
  SocioeconomicsModuleData,
  WorkspaceSnapshot,
} from "@/features/bettertolive/models/workspace"

// ---- Shopping CRUD types ----

export type ShoppingOwnedItemForm = {
  id?: string | null
  name: string
  system: string
  category: string
  spaces: string[]
  stages: ShoppingStage[]
  // 注:已删除 necessity — 该信息由阶段模板的档位承载
  lifecycle: string
  depreciation?: string | null
  quantity: number
  status: ShoppingOwnedStatus
  replacementCue: string
  note: string
}

export type ShoppingPlanItemForm = {
  id?: string | null
  laneId: string
  name: string
  system: string
  category: string
  spaces: string[]
  stages: ShoppingStage[]
  // 注:已删除 necessity 与 tags — 物品的"标签"在显示层由 system/spaces/stages 渲染
  lifecycle: string
  depreciation?: string | null
  reason: string
  targetLifestyle: string
  currentPrice: number | null
  buyBelowPrice: number | null
  overpayPrice: number | null
  note: string
  keywords: string[]
}

export type ShoppingPageContentForm = {
  id?: string | null
  contentType: string
  title?: string | null
  stage?: string | null
  system?: string | null
  summary?: string | null
  reason?: string | null
  body: string
}

export type ShoppingSystemDefinitionForm = {
  id: string
  summary: string
  keyQuestion: string
  secondaryGroups: string[]
}

export type ShoppingSpaceDefinitionForm = {
  id?: string | null
  name: string
}

export type ShoppingOwnedItemRow = {
  id: string
  name: string
  system_id: string
  category: string
  // 注:DB 列 necessity 仍存在但已停止使用;Rust 端 struct 字段用 #[serde(default)] 容忍
  lifecycle: string
  depreciation: string | null
  quantity: number
  status: string
  replacement_cue: string
  note: string
  sort_order: number
  is_archived: boolean
  created_at: string
  updated_at: string
}

export type ShoppingPlanItemRow = {
  id: string
  lane_id: string
  name: string
  system_id: string
  category: string
  // 注:DB 列 necessity/tags 仍存在但已停止使用
  lifecycle: string
  depreciation: string | null
  reason: string
  target_lifestyle: string
  current_price: number | null
  buy_below_price: number | null
  overpay_price: number | null
  note: string
  sort_order: number
  is_archived: boolean
  created_at: string
  updated_at: string
}

export type ShoppingPageContentRow = {
  id: string
  content_type: string
  title: string | null
  stage: string | null
  system_id: string | null
  summary: string | null
  reason: string | null
  body_json: string
  sort_order: number
  is_enabled: boolean
  created_at: string
  updated_at: string
}

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
