import { getBetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import type {
  LegacyItem,
  LegacyItemForm,
  LegacyWorkspaceModuleData,
} from "@/features/bettertolive/types"

export async function getLegacy(): Promise<LegacyWorkspaceModuleData> {
  return getBetterToLiveApi().getLegacy()
}

export async function listLegacyItems(): Promise<LegacyItem[]> {
  return getBetterToLiveApi().listLegacyItems()
}

export async function createLegacyItem(form: LegacyItemForm): Promise<LegacyItem> {
  return getBetterToLiveApi().createLegacyItem(form)
}

export async function updateLegacyItem(form: LegacyItemForm): Promise<LegacyItem> {
  return getBetterToLiveApi().updateLegacyItem(form)
}

export async function deleteLegacyItem(id: string): Promise<void> {
  return getBetterToLiveApi().deleteLegacyItem(id)
}
