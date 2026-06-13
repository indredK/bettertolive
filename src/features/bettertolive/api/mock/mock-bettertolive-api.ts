import type { BeliefEntryForm, BetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { workspaceSnapshotMockData } from "@/features/bettertolive/api/mock/data/workspace-snapshot.mock"
import { WORLD_HISTORY_SEED } from "@/features/bettertolive/ui/worldhistory/world-history-data"
import type {
  BeliefEntry,
  BeliefsModuleData,
  EmotionWorkspaceModuleData,
  EventsModuleData,
  FinanceModuleData,
  FutureModuleData,
  GrowthModuleData,
  LegacyItem,
  LegacyItemForm,
  LegacyWorkspaceModuleData,
  MemoryWorkspaceModuleData,
  NutritionModuleData,
  PrinciplesModuleData,
  ReflectionModuleData,
  RelationshipsModuleData,
  SocioeconomicsModuleData,
  WorldHistoryModuleData,
} from "@/features/bettertolive/types"

const MOCK_API_LATENCY_MS = 80
let eventsApiData: EventsModuleData = cloneMockData(workspaceSnapshotMockData.events)
let nutritionMockData: NutritionModuleData = cloneMockData(workspaceSnapshotMockData.nutrition)
let emotionApiData: EmotionWorkspaceModuleData = cloneMockData(workspaceSnapshotMockData.emotion)
let financeMockData: FinanceModuleData = cloneMockData(workspaceSnapshotMockData.finance)
let futureMockData: FutureModuleData = cloneMockData(workspaceSnapshotMockData.future)
let reflectionMockData: ReflectionModuleData = cloneMockData(workspaceSnapshotMockData.reflection)
let growthMockData: GrowthModuleData = cloneMockData(workspaceSnapshotMockData.growth)
let memoryMockData: MemoryWorkspaceModuleData = cloneMockData(workspaceSnapshotMockData.memory)
let beliefsMockData: BeliefsModuleData = cloneMockData(workspaceSnapshotMockData.beliefs)
let principlesMockData: PrinciplesModuleData = cloneMockData(workspaceSnapshotMockData.principles)
let relationshipsMockData: RelationshipsModuleData = cloneMockData(
  workspaceSnapshotMockData.relationships,
)
let legacyApiData: LegacyWorkspaceModuleData = cloneMockData(workspaceSnapshotMockData.legacy)
let socioeconomicsData: SocioeconomicsModuleData = cloneMockData(
  workspaceSnapshotMockData.socioeconomics,
)
let worldHistoryMockData: WorldHistoryModuleData = cloneMockData(WORLD_HISTORY_SEED)

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

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function makeLegacyPreview(content: string) {
  const trimmed = content.trim()
  return trimmed.length > 96 ? `${trimmed.slice(0, 96)}...` : trimmed
}

function cleanOptionalText<T extends string>(value: T | null | undefined): T | undefined {
  const trimmed = value?.trim()
  return trimmed ? (trimmed as T) : undefined
}

function normalizeUniqueText<T extends string>(values: T[] | undefined): T[] {
  return Array.from(new Set((values ?? []).map((value) => value.trim()).filter(Boolean))) as T[]
}

function formToBeliefEntry(form: BeliefEntryForm, existing?: BeliefEntry): BeliefEntry {
  const title = form.title.trim()
  const statement = form.statement.trim()

  if (!title) {
    throw new Error("title is required")
  }

  if (!statement) {
    throw new Error("statement is required")
  }

  return {
    id: existing?.id ?? form.id ?? `belief-${Date.now()}`,
    title,
    statement,
    description: form.description.trim(),
    domain: form.domain,
    layer: form.layer,
    stability: form.stability,
    source: form.source,
    impact: form.impact,
    secondaryDomains: normalizeUniqueText(form.secondaryDomains),
    cbtLayer: cleanOptionalText(form.cbtLayer),
    cognitiveDistortions: normalizeUniqueText(form.cognitiveDistortions),
    defenseMechanism: cleanOptionalText(form.defenseMechanism),
    attachmentNote: cleanOptionalText(form.attachmentNote),
    revisionHistory: form.revisionHistory,
    tags: normalizeUniqueText(form.tags),
  }
}

function formToLegacyItem(form: LegacyItemForm, existing?: LegacyItem): LegacyItem {
  const now = todayIsoDate()
  const emotionalLoad = form.emotionalLoad
  const isFinal = form.status === "最终版"

  return {
    id: existing?.id ?? form.id ?? `legacy-item-${Date.now()}`,
    title: form.title.trim(),
    category: form.category,
    recipient: form.recipient,
    recipientName: form.recipientName?.trim() || undefined,
    relatedRelationshipId: form.relatedRelationshipId?.trim() || undefined,
    urgency: form.urgency,
    visibility: form.visibility,
    deliveryCondition: form.deliveryCondition?.trim() || undefined,
    status: form.status,
    emotionalLoad,
    summary: form.summary.trim(),
    content: form.content.trim(),
    contentPreview: makeLegacyPreview(form.content),
    isLocked: form.isLocked || isFinal,
    requiresSecondConfirm: form.requiresSecondConfirm || emotionalLoad === "很重",
    excludeFromAi:
      form.excludeFromAi ||
      form.recipient === "仅自己" ||
      emotionalLoad === "很重" ||
      form.visibility === "我离世后",
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    finalizedAt: isFinal ? (existing?.finalizedAt ?? now) : undefined,
    reviewCue: form.reviewCue.trim(),
    tags: form.tags.map((tag) => tag.trim()).filter(Boolean),
  }
}

export function createMockBetterToLiveApi(): BetterToLiveApi {
  return {
    getOverview: () => withMockLatency(workspaceSnapshotMockData.overview),
    getReflection: () => withMockLatency(reflectionMockData),
    saveReflection: (reflection) => {
      reflectionMockData = cloneMockData(reflection)
      return withMockLatency(undefined)
    },
    getEvents: () => withMockLatency(eventsApiData),
    saveEvents: (events) => {
      eventsApiData = cloneMockData(events)
      return withMockLatency(undefined)
    },
    getFinance: () => withMockLatency(financeMockData),
    saveFinance: (finance) => {
      financeMockData = cloneMockData(finance)
      return withMockLatency(undefined)
    },
    getShopping: () => withMockLatency(workspaceSnapshotMockData.shopping),
    getNutrition: () => withMockLatency(nutritionMockData),
    saveNutrition: (nutrition) => {
      nutritionMockData = cloneMockData(nutrition)
      return withMockLatency(undefined)
    },
    getEmotion: () => withMockLatency(emotionApiData),
    saveEmotion: (emotion) => {
      emotionApiData = cloneMockData(emotion)
      return withMockLatency(undefined)
    },
    getBeliefs: () => withMockLatency(beliefsMockData),
    createBeliefEntry: (form) => {
      const entry = formToBeliefEntry(form)
      if (beliefsMockData.entries.some((existing) => existing.id === entry.id)) {
        throw new Error("belief id already exists")
      }

      beliefsMockData = {
        ...beliefsMockData,
        entries: [...beliefsMockData.entries, entry],
      }
      return withMockLatency(entry)
    },
    updateBeliefEntry: (form) => {
      const existing = beliefsMockData.entries.find((entry) => entry.id === form.id)
      if (!existing) {
        throw new Error("belief entry not found")
      }

      const entry = formToBeliefEntry(form, existing)
      beliefsMockData = {
        ...beliefsMockData,
        entries: beliefsMockData.entries.map((current) =>
          current.id === entry.id ? entry : current,
        ),
      }
      return withMockLatency(entry)
    },
    deleteBeliefEntry: (id) => {
      const nextEntries = beliefsMockData.entries.filter((entry) => entry.id !== id)
      if (nextEntries.length === beliefsMockData.entries.length) {
        throw new Error("belief entry not found")
      }

      beliefsMockData = {
        ...beliefsMockData,
        entries: nextEntries,
        relations: beliefsMockData.relations.filter(
          (relation) => relation.fromId !== id && relation.toId !== id,
        ),
      }
      return withMockLatency(undefined)
    },
    getPrinciples: () => withMockLatency(principlesMockData),
    savePrinciples: (principles) => {
      principlesMockData = cloneMockData(principles)
      return withMockLatency(undefined)
    },
    getRelationships: () => withMockLatency(relationshipsMockData),
    saveRelationships: (relationships) => {
      relationshipsMockData = cloneMockData(relationships)
      return withMockLatency(undefined)
    },
    getGrowth: () => withMockLatency(growthMockData),
    saveGrowth: (growth) => {
      growthMockData = cloneMockData(growth)
      return withMockLatency(undefined)
    },
    getMemory: () => withMockLatency(memoryMockData),
    saveMemory: (memory) => {
      memoryMockData = cloneMockData(memory)
      return withMockLatency(undefined)
    },
    getJourney: () =>
      withMockLatency({
        ...growthMockData,
        ...memoryMockData,
      }),
    getLegacy: () => withMockLatency(legacyApiData),
    listLegacyItems: () => withMockLatency(legacyApiData.items),
    createLegacyItem: (form) => {
      const item = formToLegacyItem(form)
      legacyApiData = {
        ...legacyApiData,
        items: [...legacyApiData.items, item],
      }
      return withMockLatency(item)
    },
    updateLegacyItem: (form) => {
      const existing = legacyApiData.items.find((item) => item.id === form.id)
      const item = formToLegacyItem(form, existing)
      legacyApiData = {
        ...legacyApiData,
        items: legacyApiData.items.map((entry) => (entry.id === item.id ? item : entry)),
      }
      return withMockLatency(item)
    },
    deleteLegacyItem: (id) => {
      legacyApiData = {
        ...legacyApiData,
        items: legacyApiData.items.filter((item) => item.id !== id),
      }
      return withMockLatency(undefined)
    },
    getSocioeconomics: () => withMockLatency(socioeconomicsData),
    saveSocioeconomics: (socioeconomics) => {
      socioeconomicsData = cloneMockData(socioeconomics)
      return withMockLatency(undefined)
    },
    getFuture: () => withMockLatency(futureMockData),
    saveFuture: (future) => {
      futureMockData = cloneMockData(future)
      return withMockLatency(undefined)
    },
    getWorldHistory: () => withMockLatency(worldHistoryMockData),
    saveWorldHistory: (worldHistory) => {
      worldHistoryMockData = cloneMockData(worldHistory)
      return withMockLatency(undefined)
    },
    getWorkspaceSnapshot: () =>
      withMockLatency({
        ...workspaceSnapshotMockData,
        reflection: reflectionMockData,
        events: eventsApiData,
        finance: financeMockData,
        nutrition: nutritionMockData,
        emotion: emotionApiData,
        beliefs: beliefsMockData,
        principles: principlesMockData,
        relationships: relationshipsMockData,
        growth: growthMockData,
        memory: memoryMockData,
        legacy: legacyApiData,
        socioeconomics: socioeconomicsData,
        future: futureMockData,
      }),
  }
}
