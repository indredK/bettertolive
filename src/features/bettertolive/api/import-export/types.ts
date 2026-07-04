import type {
  WorkspaceSnapshot,
  WorldHistoryModuleData,
} from "@/features/bettertolive/models/workspace"

export const CURRENT_EXPORT_VERSION = 1

export type ImportMode = "overwrite" | "merge"

export type ExportData = {
  version: typeof CURRENT_EXPORT_VERSION
  exportedAt: string
  appVersion: string
  metadata?: {
    description?: string
  }
  data: WorkspaceSnapshot & {
    worldHistory: WorldHistoryModuleData
  }
}

export type ImportResult = {
  success: boolean
  moduleResults: {
    module: string
    status: "ok" | "error"
    error?: string
  }[]
}

export type ModuleMergeStrategy = "replace" | "mergeById" | "mergeObject"
