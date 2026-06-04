import { invoke } from "@tauri-apps/api/core"
import type {
  ShoppingOwnedItemForm,
  ShoppingOwnedItemRow,
  ShoppingPlanItemForm,
  ShoppingPlanItemRow,
  ShoppingPageContentForm,
  ShoppingPageContentRow,
  ShoppingPurchaseLaneRow,
} from "@/features/bettertolive/api/bettertolive-api"
import type { ShoppingModuleData } from "@/features/bettertolive/models/workspace"

function hasTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
}

// ---- Owned Items ----

export async function listOwnedItems(): Promise<ShoppingOwnedItemRow[]> {
  if (!hasTauriRuntime()) return []
  return invoke<ShoppingOwnedItemRow[]>("list_owned_items")
}

export async function createOwnedItem(
  form: ShoppingOwnedItemForm,
): Promise<ShoppingModuleData["ownedItems"][number]> {
  if (!hasTauriRuntime()) throw new Error("Tauri runtime not available")
  return invoke("create_owned_item", { form })
}

export async function updateOwnedItem(
  form: ShoppingOwnedItemForm,
): Promise<ShoppingModuleData["ownedItems"][number]> {
  if (!hasTauriRuntime()) throw new Error("Tauri runtime not available")
  return invoke("update_owned_item", { form })
}

export async function deleteOwnedItem(id: string): Promise<void> {
  if (!hasTauriRuntime()) throw new Error("Tauri runtime not available")
  return invoke("delete_owned_item", { id })
}

// ---- Plan Items ----

export async function listPlanItems(): Promise<ShoppingPlanItemRow[]> {
  if (!hasTauriRuntime()) return []
  return invoke<ShoppingPlanItemRow[]>("list_plan_items")
}

export async function createPlanItem(
  form: ShoppingPlanItemForm,
): Promise<ShoppingModuleData["purchaseLanes"][number]["items"][number]> {
  if (!hasTauriRuntime()) throw new Error("Tauri runtime not available")
  return invoke("create_plan_item", { form })
}

export async function updatePlanItem(
  form: ShoppingPlanItemForm,
): Promise<ShoppingModuleData["purchaseLanes"][number]["items"][number]> {
  if (!hasTauriRuntime()) throw new Error("Tauri runtime not available")
  return invoke("update_plan_item", { form })
}

export async function deletePlanItem(id: string): Promise<void> {
  if (!hasTauriRuntime()) throw new Error("Tauri runtime not available")
  return invoke("delete_plan_item", { id })
}

// ---- Page Content ----

export async function listPageContents(
  contentType?: string | null,
): Promise<ShoppingPageContentRow[]> {
  if (!hasTauriRuntime()) return []
  return invoke<ShoppingPageContentRow[]>("list_shopping_page_contents", { contentType })
}

export async function createPageContent(
  form: ShoppingPageContentForm,
): Promise<ShoppingPageContentRow> {
  if (!hasTauriRuntime()) throw new Error("Tauri runtime not available")
  return invoke("create_shopping_page_content", { form })
}

export async function updatePageContent(
  form: ShoppingPageContentForm,
): Promise<ShoppingPageContentRow> {
  if (!hasTauriRuntime()) throw new Error("Tauri runtime not available")
  return invoke("update_shopping_page_content", { form })
}

export async function deletePageContent(id: string): Promise<void> {
  if (!hasTauriRuntime()) throw new Error("Tauri runtime not available")
  return invoke("delete_shopping_page_content", { id })
}

// ---- Purchase Lanes ----

export async function listPurchaseLanes(): Promise<ShoppingPurchaseLaneRow[]> {
  if (!hasTauriRuntime()) return []
  return invoke<ShoppingPurchaseLaneRow[]>("list_purchase_lanes")
}
