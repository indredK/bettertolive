import { resolveBetterToLiveApiMode } from "@/features/bettertolive/api/config"
import { createLiveBetterToLiveApi } from "@/features/bettertolive/api/live/live-bettertolive-api"
import { createMockBetterToLiveApi } from "@/features/bettertolive/api/mock/mock-bettertolive-api"
import type {
  BeliefEntry,
  BeliefsModuleData,
  EmotionWorkspaceModuleData,
  EventsModuleData,
  FinanceModuleData,
  FutureModuleData,
  GrowthModuleData,
  JourneyModuleData,
  LegacyItem,
  LegacyItemForm,
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
  WorldHistoryModuleData,
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
  lifecycle: string
  depreciation: string | null
  entry_price: number | null
  sweet_spot_price: number | null
  overpay_price: number | null
  note: string
  quantity: number | null
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

export type ShoppingAttributeDefinitionForm = {
  id?: string | null
  kind: string
  code: string
  semanticKey?: string | null
  label: string
  labelEn?: string | null
  description?: string
  styleToken?: string | null
  rank?: number | null
  isEnabled?: boolean
  /** 乐观锁版本号；更新/启停时回传，创建时可省略 */
  version?: number
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

export type BeliefEntryForm = Omit<BeliefEntry, "id"> & {
  id?: string | null
}

// 向后兼容(给尚未迁移完的旧 UI 代码用):
// 待 UI 全部迁移完成后,删除以下别名
export type ShoppingOwnedItem = ShoppingItem
export type ShoppingPlanItem = ShoppingItem
export type { ShoppingItem, ShoppingItemChild, ShoppingStageTemplate }

export type BetterToLiveApi = {
  getOverview: () => Promise<OverviewModuleData>
  getReflection: () => Promise<ReflectionModuleData>
  saveReflection: (reflection: ReflectionModuleData) => Promise<void>
  getEvents: () => Promise<EventsModuleData>
  saveEvents: (events: EventsModuleData) => Promise<void>
  getFinance: () => Promise<FinanceModuleData>
  saveFinance: (finance: FinanceModuleData) => Promise<void>
  getShopping: () => Promise<ShoppingModuleData>
  getNutrition: () => Promise<NutritionModuleData>
  saveNutrition: (nutrition: NutritionModuleData) => Promise<void>
  getEmotion: () => Promise<EmotionWorkspaceModuleData>
  saveEmotion: (emotion: EmotionWorkspaceModuleData) => Promise<void>
  getBeliefs: () => Promise<BeliefsModuleData>
  createBeliefEntry: (form: BeliefEntryForm) => Promise<BeliefEntry>
  updateBeliefEntry: (form: BeliefEntryForm) => Promise<BeliefEntry>
  deleteBeliefEntry: (id: string) => Promise<void>
  getPrinciples: () => Promise<PrinciplesModuleData>
  savePrinciples: (principles: PrinciplesModuleData) => Promise<void>
  getRelationships: () => Promise<RelationshipsModuleData>
  saveRelationships: (relationships: RelationshipsModuleData) => Promise<void>
  getGrowth: () => Promise<GrowthModuleData>
  saveGrowth: (growth: GrowthModuleData) => Promise<void>
  getMemory: () => Promise<MemoryWorkspaceModuleData>
  saveMemory: (memory: MemoryWorkspaceModuleData) => Promise<void>
  saveJourney: (payload: {
    growth: GrowthModuleData
    memory: MemoryWorkspaceModuleData
  }) => Promise<void>
  getJourney: () => Promise<JourneyModuleData>
  getLegacy: () => Promise<LegacyWorkspaceModuleData>
  listLegacyItems: () => Promise<LegacyItem[]>
  createLegacyItem: (form: LegacyItemForm) => Promise<LegacyItem>
  updateLegacyItem: (form: LegacyItemForm) => Promise<LegacyItem>
  deleteLegacyItem: (id: string) => Promise<void>
  getSocioeconomics: () => Promise<SocioeconomicsModuleData>
  saveSocioeconomics: (socioeconomics: SocioeconomicsModuleData) => Promise<void>
  getFuture: () => Promise<FutureModuleData>
  saveFuture: (future: FutureModuleData) => Promise<void>
  getWorldHistory: () => Promise<WorldHistoryModuleData>
  saveWorldHistory: (worldHistory: WorldHistoryModuleData) => Promise<void>
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
