import type { ExportData, ImportMode } from "@/features/bettertolive/api/import-export/types"
import { CURRENT_EXPORT_VERSION } from "@/features/bettertolive/api/import-export/types"
import { migrateToCurrent } from "@/features/bettertolive/api/import-export/migrations/registry"
import {
  MODULE_MERGE_STRATEGIES,
  mergeModuleData,
} from "@/features/bettertolive/api/import-export/merge-strategies"
import { getBetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import type {
  BeliefsModuleData,
  EmotionWorkspaceModuleData,
  EventsModuleData,
  FinanceModuleData,
  FutureModuleData,
  GrowthModuleData,
  LegacyWorkspaceModuleData,
  MemoryWorkspaceModuleData,
  NutritionModuleData,
  PrinciplesModuleData,
  ReflectionModuleData,
  RelationshipsModuleData,
  ShoppingModuleData,
  SocioeconomicsModuleData,
  WorldHistoryModuleData,
} from "@/features/bettertolive/models/workspace"

type ModuleData = Record<string, unknown>

export function validateExportFile(raw: unknown): ExportData {
  if (raw == null || typeof raw !== "object") {
    throw new Error("Invalid file format: expected a JSON object")
  }

  const obj = raw as Record<string, unknown>

  if (typeof obj.version !== "number" || obj.version < 1) {
    throw new Error("Invalid file format: missing or invalid version")
  }

  if (obj.version > CURRENT_EXPORT_VERSION) {
    throw new Error(
      `This export file is from a newer version (v${obj.version}). Please update BetterToLive to import it.`,
    )
  }

  if (obj.data == null || typeof obj.data !== "object") {
    throw new Error("Invalid file format: missing data section")
  }

  const migrated = migrateToCurrent(obj)

  return migrated as unknown as ExportData
}

export function summarizeImportData(data: ExportData["data"]): { module: string; count: string }[] {
  function arrayLen(val: unknown): number {
    return Array.isArray(val) ? val.length : 0
  }

  function count(val: unknown): string {
    if (Array.isArray(val)) return `${val.length} items`
    if (typeof val === "object" && val != null) {
      const keys = Object.keys(val)
      const listKeys = keys.filter((k) => Array.isArray((val as Record<string, unknown>)[k]))
      if (listKeys.length > 0) {
        return listKeys
          .map((k) => `${k}: ${arrayLen((val as Record<string, unknown>)[k])}`)
          .join(", ")
      }
      return `${keys.length} fields`
    }
    return "present"
  }

  return Object.entries(data as Record<string, unknown>).map(([module, moduleData]) => ({
    module,
    count: count(moduleData),
  }))
}

async function importModule(
  name: string,
  importedData: ModuleData | undefined,
  mode: ImportMode,
  onProgress?: (module: string, status: "ok" | "error", error?: string) => void,
): Promise<string | null> {
  if (importedData == null) {
    const msg = "module data not found in export file"
    onProgress?.(name, "error", msg)
    return `${name}: ${msg}`
  }

  const api = getBetterToLiveApi()

  try {
    switch (name) {
      case "overview":
        return null
      default: {
        const setter = getSetter(api, name)
        if (!setter) {
          const msg = `no import handler for module: ${name}`
          onProgress?.(name, "error", msg)
          return `${name}: ${msg}`
        }
        if (mode === "overwrite") {
          await setter(importedData)
        } else {
          const getter = getGetter(api, name)
          if (getter) {
            const existing = await getter()
            const merged = mergeModuleData(
              existing,
              importedData,
              MODULE_MERGE_STRATEGIES[name] ?? "replace",
            )
            await setter(merged)
          } else {
            await setter(importedData)
          }
        }
        onProgress?.(name, "ok")
        return null
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    onProgress?.(name, "error", message)
    return `${name}: ${message}`
  }
}

function getSetter(
  api: ReturnType<typeof getBetterToLiveApi>,
  name: string,
): ((data: ModuleData) => Promise<void>) | null {
  switch (name) {
    case "reflection":
      return (d) => api.saveReflection(d as ReflectionModuleData)
    case "events":
      return (d) => api.saveEvents(d as EventsModuleData)
    case "finance":
      return (d) => api.saveFinance(d as FinanceModuleData)
    case "nutrition":
      return (d) => api.saveNutrition(d as NutritionModuleData)
    case "emotion":
      return (d) => api.saveEmotion(d as EmotionWorkspaceModuleData)
    case "principles":
      return (d) => api.savePrinciples(d as PrinciplesModuleData)
    case "relationships":
      return (d) => api.saveRelationships(d as RelationshipsModuleData)
    case "growth":
      return (d) => api.saveGrowth(d as GrowthModuleData)
    case "memory":
      return (d) => api.saveMemory(d as MemoryWorkspaceModuleData)
    case "socioeconomics":
      return (d) => api.saveSocioeconomics(d as SocioeconomicsModuleData)
    case "future":
      return (d) => api.saveFuture(d as FutureModuleData)
    case "worldHistory":
      return (d) => api.saveWorldHistory(d as WorldHistoryModuleData)
    case "beliefs":
      return (d) => api.saveBeliefs(d as BeliefsModuleData)
    case "shopping":
      return (d) => api.importShopping(d as ShoppingModuleData)
    case "legacy":
      return (d) => api.importLegacy(d as LegacyWorkspaceModuleData)
    default:
      return null
  }
}

function getGetter(
  api: ReturnType<typeof getBetterToLiveApi>,
  name: string,
): (() => Promise<ModuleData>) | null {
  switch (name) {
    case "reflection":
      return () => api.getReflection()
    case "events":
      return () => api.getEvents()
    case "finance":
      return () => api.getFinance()
    case "nutrition":
      return () => api.getNutrition()
    case "emotion":
      return () => api.getEmotion()
    case "principles":
      return () => api.getPrinciples()
    case "relationships":
      return () => api.getRelationships()
    case "growth":
      return () => api.getGrowth()
    case "memory":
      return () => api.getMemory()
    case "socioeconomics":
      return () => api.getSocioeconomics()
    case "future":
      return () => api.getFuture()
    case "worldHistory":
      return () => api.getWorldHistory()
    case "beliefs":
      return () => api.getBeliefs()
    case "shopping":
      return () => api.getShopping()
    case "legacy":
      return () => api.getLegacy()
    default:
      return null
  }
}

const IMPORT_MODULES = [
  "overview",
  "reflection",
  "events",
  "finance",
  "nutrition",
  "emotion",
  "beliefs",
  "principles",
  "relationships",
  "growth",
  "memory",
  "legacy",
  "socioeconomics",
  "future",
  "worldHistory",
  "shopping",
]

export async function importData(
  exportData: ExportData,
  mode: ImportMode,
  onProgress?: (module: string, status: "ok" | "error", error?: string) => void,
): Promise<void> {
  const errors: string[] = []
  for (const name of IMPORT_MODULES) {
    const importedData = (exportData.data as Record<string, unknown>)[name] as
      ModuleData | undefined
    const err = await importModule(name, importedData, mode, onProgress)
    if (err) errors.push(err)
  }
  if (errors.length > 0) {
    throw new Error(`Import partially failed:\n${errors.join("\n")}`)
  }
}
