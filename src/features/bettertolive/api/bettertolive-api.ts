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
  ShoppingItem,
  ShoppingItemChild,
  ShoppingModuleData,
  ShoppingStageTemplate,
  SocioeconomicsModuleData,
  WorkspaceSnapshot,
} from "@/features/bettertolive/models/workspace"

// ---- Shopping CRUD types ----

// 统一物品的 Form(取代旧的 ShoppingOwnedItemForm 与 ShoppingPlanItemForm)
// 注: note 和 children.channelPrices 在后端 Rust 侧均为 #[serde(default)],
// 因此 Specta 生成的类型中它们为 optional。此处保持与后端一致。
export type ShoppingItemForm = {
  id?: string | null
  name: string
  children: ShoppingItemChild[] // 子级清单
  systemTags: string[] // 必填,≥1
  spaceTags: string[] // 必填,≥1
  note?: string
}

// 物品 Row(后端原始 DB 行,扁平字段;子级和多对多关系单独获取)
export type ShoppingItemRow = {
  id: string
  name: string
  status: string
  lane: string | null
  lifecycle: string
  depreciation: string | null
  entry_price: number | null
  sweet_spot_price: number | null
  overpay_price: number | null
  note: string
  quantity: number | null
  health_status: string | null
  replacement_cue: string | null
  reason: string | null
  target_lifestyle: string | null
  current_price: number | null
  buy_below_price: number | null
  keywords_json: string | null
  sort_order: number
  is_archived: boolean
  created_at: string
  updated_at: string
}

// 阶段模板 Form
export type ShoppingStageTemplateForm = {
  id?: string | null
  name: string
  description: string
  focus: string
  systemDimensionIds: string[]
  spaceDimensionIds: string[]
  items: {
    itemId: string
    tiers: {
      low: string[]
      base: string[]
      up: string[]
    }
  }[]
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
  name: string
  summary: string
  keyQuestion: string
  secondaryGroups: string[]
}

export type ShoppingSpaceDefinitionForm = {
  id?: string | null
  name: string
  note?: string
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

// 向后兼容(给尚未迁移完的旧 UI 代码用):
// 待 UI 全部迁移完成后,删除以下别名
export type ShoppingOwnedItem = ShoppingItem
export type ShoppingPlanItem = ShoppingItem
export type { ShoppingItem, ShoppingItemChild, ShoppingStageTemplate }

export type BetterToLiveApi = {
  getOverview: () => Promise<OverviewModuleData>
  getReflection: () => Promise<ReflectionModuleData>
  getEvents: () => Promise<EventsModuleData>
  getFinance: () => Promise<FinanceModuleData>
  getShopping: () => Promise<ShoppingModuleData>
  getNutrition: () => Promise<NutritionModuleData>
  saveNutrition: (nutrition: NutritionModuleData) => Promise<void>
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
