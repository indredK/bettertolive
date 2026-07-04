import { getBetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import {
  CURRENT_EXPORT_VERSION,
  type ExportData,
} from "@/features/bettertolive/api/import-export/types"

const APP_VERSION = "0.1.0"

export async function collectAllData(): Promise<ExportData> {
  const api = getBetterToLiveApi()

  const [workspaceSnapshot, worldHistory] = await Promise.all([
    api.getWorkspaceSnapshot(),
    api.getWorldHistory(),
  ])

  return {
    version: CURRENT_EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    data: {
      ...workspaceSnapshot,
      worldHistory,
    },
  }
}
