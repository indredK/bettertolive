import type { ModuleMergeStrategy } from "@/features/bettertolive/api/import-export/types"

export const MODULE_MERGE_STRATEGIES: Record<string, ModuleMergeStrategy> = {
  overview: "replace",
  reflection: "mergeById",
  events: "mergeById",
  finance: "mergeById",
  nutrition: "mergeById",
  emotion: "mergeById",
  beliefs: "mergeById",
  principles: "mergeById",
  relationships: "mergeById",
  growth: "mergeById",
  memory: "mergeById",
  legacy: "mergeById",
  socioeconomics: "mergeById",
  future: "replace",
  worldHistory: "mergeById",
  shopping: "mergeById",
}

function mergeArraysById<T extends { id: string }>(existing: T[], imported: T[]): T[] {
  const existingMap = new Map(existing.map((item) => [item.id, item]))
  for (const item of imported) {
    if (!existingMap.has(item.id)) {
      existingMap.set(item.id, item)
    }
  }
  return Array.from(existingMap.values())
}

function mergeObjects(
  existing: Record<string, unknown>,
  imported: Record<string, unknown>,
): Record<string, unknown> {
  const result = { ...existing }
  for (const key of Object.keys(imported)) {
    const existingVal = result[key]
    const importedVal = imported[key]
    if (
      existingVal != null &&
      importedVal != null &&
      typeof existingVal === "object" &&
      typeof importedVal === "object" &&
      !Array.isArray(existingVal) &&
      !Array.isArray(importedVal)
    ) {
      result[key] = mergeObjects(
        existingVal as Record<string, unknown>,
        importedVal as Record<string, unknown>,
      )
    } else {
      result[key] = importedVal
    }
  }
  return result
}

export function mergeModuleData<T>(existing: T, imported: T, strategy: ModuleMergeStrategy): T {
  if (strategy === "replace") {
    return imported
  }

  if (strategy === "mergeObject") {
    if (
      typeof existing === "object" &&
      existing != null &&
      typeof imported === "object" &&
      imported != null
    ) {
      return mergeObjects(
        existing as Record<string, unknown>,
        imported as Record<string, unknown>,
      ) as T
    }
    return imported
  }

  if (strategy === "mergeById") {
    if (Array.isArray(existing) && Array.isArray(imported)) {
      return mergeArraysById(existing as { id: string }[], imported as { id: string }[]) as T
    }
    if (
      typeof existing === "object" &&
      existing != null &&
      typeof imported === "object" &&
      imported != null &&
      !Array.isArray(existing) &&
      !Array.isArray(imported)
    ) {
      const result = { ...existing }
      for (const key of Object.keys(imported)) {
        const existingArr = (result as Record<string, unknown>)[key]
        const importedArr = (imported as Record<string, unknown>)[key]
        if (Array.isArray(existingArr) && Array.isArray(importedArr)) {
          ;(result as Record<string, unknown>)[key] = mergeArraysById(
            existingArr as { id: string }[],
            importedArr as { id: string }[],
          )
        } else {
          ;(result as Record<string, unknown>)[key] = importedArr
        }
      }
      return result
    }
    return imported
  }

  return imported
}
