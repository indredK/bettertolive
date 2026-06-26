import { invoke } from "@tauri-apps/api/core"

import type { BeliefEntryForm, BetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
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
  ShoppingModuleData,
  SocioeconomicsModuleData,
  WorkspaceSnapshot,
  WorldHistoryModuleData,
} from "@/features/bettertolive/models/workspace"

function getOverviewFromRust() {
  return invoke<OverviewModuleData>("get_overview")
}

function getReflectionFromRust() {
  return invoke<ReflectionModuleData>("get_reflection")
}

async function saveReflectionToRust(reflection: ReflectionModuleData) {
  await invoke("save_reflection", { reflection })
}

function getShoppingFromRust() {
  return invoke<ShoppingModuleData>("get_shopping")
}

function getNutritionFromRust() {
  return invoke<NutritionModuleData>("get_nutrition")
}

function getEmotionFromRust() {
  return invoke<EmotionWorkspaceModuleData>("get_emotion")
}

function getEventsFromRust() {
  return invoke<EventsModuleData>("get_events")
}

function getFinanceFromRust() {
  return invoke<FinanceModuleData>("get_finance")
}

function getGrowthFromRust() {
  return invoke<GrowthModuleData>("get_growth")
}

async function saveGrowthToRust(growth: GrowthModuleData) {
  await invoke("save_growth", { growth })
}

function getMemoryFromRust() {
  return invoke<MemoryWorkspaceModuleData>("get_memory")
}

async function saveMemoryToRust(memory: MemoryWorkspaceModuleData) {
  await invoke("save_memory", { memory })
}

async function saveJourneyToRust(payload: {
  growth: GrowthModuleData
  memory: MemoryWorkspaceModuleData
}) {
  await invoke("save_journey", { payload })
}

function getFutureFromRust() {
  return invoke<FutureModuleData>("get_future")
}

function getBeliefsFromRust() {
  return invoke<BeliefsModuleData>("get_beliefs")
}

function getPrinciplesFromRust() {
  return invoke<PrinciplesModuleData>("get_principles")
}

function getRelationshipsFromRust() {
  return invoke<RelationshipsModuleData>("get_relationships")
}

function getLegacyFromRust() {
  return invoke<LegacyWorkspaceModuleData>("get_legacy")
}

function getSocioeconomicsFromRust() {
  return invoke<SocioeconomicsModuleData>("get_socioeconomics")
}

async function saveNutritionToRust(nutrition: NutritionModuleData) {
  await invoke("save_nutrition", { nutrition })
}

async function saveEmotionToRust(emotion: EmotionWorkspaceModuleData) {
  await invoke("save_emotion", { emotion })
}

async function saveEventsToRust(events: EventsModuleData) {
  await invoke("save_events", { events })
}

async function saveFinanceToRust(finance: FinanceModuleData) {
  await invoke("save_finance", { finance })
}

async function saveFutureToRust(future: FutureModuleData) {
  await invoke("save_future", { future })
}

async function savePrinciplesToRust(principles: PrinciplesModuleData) {
  await invoke("save_principles", { principles })
}

async function saveRelationshipsToRust(relationships: RelationshipsModuleData) {
  await invoke("save_relationships", { relationships })
}

async function saveSocioeconomicsToRust(socioeconomics: SocioeconomicsModuleData) {
  await invoke("save_socioeconomics", { socioeconomics })
}

function getWorldHistoryFromRust() {
  return invoke<WorldHistoryModuleData>("get_world_history")
}

async function saveWorldHistoryToRust(worldHistory: WorldHistoryModuleData) {
  await invoke("save_world_history", { worldHistory })
}

export function createLiveBetterToLiveApi(): BetterToLiveApi {
  return {
    // ---- Tauri commands (Rust backend) ----

    getShopping: () => getShoppingFromRust(),

    getWorkspaceSnapshot: () => invoke<WorkspaceSnapshot>("get_workspace_snapshot"),

    getOverview: () => getOverviewFromRust(),
    getReflection: () => getReflectionFromRust(),
    saveReflection: (reflection) => saveReflectionToRust(reflection),
    getEvents: () => getEventsFromRust(),
    saveEvents: (events) => saveEventsToRust(events),
    getFinance: () => getFinanceFromRust(),
    saveFinance: (finance) => saveFinanceToRust(finance),
    getNutrition: () => getNutritionFromRust(),
    saveNutrition: (nutrition) => saveNutritionToRust(nutrition),
    getEmotion: () => getEmotionFromRust(),
    saveEmotion: (emotion) => saveEmotionToRust(emotion),
    getBeliefs: () => getBeliefsFromRust(),
    createBeliefEntry: (form: BeliefEntryForm) =>
      invoke<BeliefEntry>("create_belief_entry", { form }),
    updateBeliefEntry: (form: BeliefEntryForm) =>
      invoke<BeliefEntry>("update_belief_entry", { form }),
    deleteBeliefEntry: (id: string) => invoke("delete_belief_entry", { id }),
    getPrinciples: () => getPrinciplesFromRust(),
    savePrinciples: (principles) => savePrinciplesToRust(principles),
    getRelationships: () => getRelationshipsFromRust(),
    saveRelationships: (relationships) => saveRelationshipsToRust(relationships),
    getGrowth: () => getGrowthFromRust(),
    saveGrowth: (growth) => saveGrowthToRust(growth),
    getMemory: () => getMemoryFromRust(),
    saveMemory: (memory) => saveMemoryToRust(memory),
    saveJourney: (payload) => saveJourneyToRust(payload),
    async getJourney(): Promise<JourneyModuleData> {
      const [growth, memory] = await Promise.all([getGrowthFromRust(), getMemoryFromRust()])
      return { ...growth, ...memory }
    },
    getLegacy: () => getLegacyFromRust(),
    listLegacyItems: () => invoke<LegacyItem[]>("list_legacy_items"),
    createLegacyItem: (form: LegacyItemForm) => invoke<LegacyItem>("create_legacy_item", { form }),
    updateLegacyItem: (form: LegacyItemForm) => invoke<LegacyItem>("update_legacy_item", { form }),
    deleteLegacyItem: (id: string) => invoke("delete_legacy_item", { id }),
    getSocioeconomics: () => getSocioeconomicsFromRust(),
    saveSocioeconomics: (socioeconomics) => saveSocioeconomicsToRust(socioeconomics),
    getFuture: () => getFutureFromRust(),
    saveFuture: (future) => saveFutureToRust(future),
    getWorldHistory: () => getWorldHistoryFromRust(),
    saveWorldHistory: (worldHistory) => saveWorldHistoryToRust(worldHistory),
  }
}
