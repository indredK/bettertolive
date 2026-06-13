import { invoke } from "@tauri-apps/api/core"

import { resolveBetterToLiveApiMode } from "@/features/bettertolive/api/config"
import type {
  ShoppingItemForm,
  ShoppingPageContentForm,
  ShoppingPageContentRow,
  ShoppingSpaceDefinitionForm,
  ShoppingStageTemplateForm,
  ShoppingSystemDefinitionForm,
} from "@/features/bettertolive/api/bettertolive-api"
import type {
  ShoppingItem,
  ShoppingSpaceDefinition,
  ShoppingStageTemplate,
} from "@/features/bettertolive/models/workspace"

// 仅在 mock 模式（浏览器调试样式）时走空返回；live 模式始终 invoke

function isMock() {
  return resolveBetterToLiveApiMode() === "mock"
}

// ---- Items(统一物品库,替代旧的 owned/plan 分裂) ----

export async function listItems(): Promise<ShoppingItem[]> {
  if (isMock()) return []
  return invoke<ShoppingItem[]>("list_shopping_items")
}

export async function createItem(form: ShoppingItemForm): Promise<ShoppingItem> {
  if (isMock()) throw new Error("Shopping CRUD is not available in mock mode")
  return invoke("create_shopping_item", { form })
}

export async function updateItem(form: ShoppingItemForm): Promise<ShoppingItem> {
  if (isMock()) throw new Error("Shopping CRUD is not available in mock mode")
  return invoke("update_shopping_item", { form })
}

export async function deleteItem(id: string): Promise<void> {
  if (isMock()) throw new Error("Shopping CRUD is not available in mock mode")
  return invoke("delete_shopping_item", { id })
}

// ---- Stage Templates ----

export async function listStageTemplates(): Promise<ShoppingStageTemplate[]> {
  if (isMock()) return []
  return invoke<ShoppingStageTemplate[]>("list_shopping_stage_templates")
}

export async function createStageTemplate(
  form: ShoppingStageTemplateForm,
): Promise<ShoppingStageTemplate> {
  if (isMock()) throw new Error("Shopping CRUD is not available in mock mode")
  return invoke("create_shopping_stage_template", { form })
}

export async function updateStageTemplate(
  form: ShoppingStageTemplateForm,
): Promise<ShoppingStageTemplate> {
  if (isMock()) throw new Error("Shopping CRUD is not available in mock mode")
  return invoke("update_shopping_stage_template", { form })
}

export async function deleteStageTemplate(id: string): Promise<void> {
  if (isMock()) throw new Error("Shopping CRUD is not available in mock mode")
  return invoke("delete_shopping_stage_template", { id })
}

// ---- Page Content(spotlight / boundary / lifestyle 等展示类内容) ----

export async function listPageContents(
  contentType?: string | null,
): Promise<ShoppingPageContentRow[]> {
  if (isMock()) return []
  return invoke<ShoppingPageContentRow[]>("list_shopping_page_contents", { contentType })
}

export async function createPageContent(
  form: ShoppingPageContentForm,
): Promise<ShoppingPageContentRow> {
  if (isMock()) throw new Error("Shopping CRUD is not available in mock mode")
  return invoke("create_shopping_page_content", { form })
}

export async function updatePageContent(
  form: ShoppingPageContentForm,
): Promise<ShoppingPageContentRow> {
  if (isMock()) throw new Error("Shopping CRUD is not available in mock mode")
  return invoke("update_shopping_page_content", { form })
}

export async function deletePageContent(id: string): Promise<void> {
  if (isMock()) throw new Error("Shopping CRUD is not available in mock mode")
  return invoke("delete_shopping_page_content", { id })
}

// ---- Reorder ----

export async function reorderSystemDefinitions(orderedIds: string[]): Promise<void> {
  if (isMock()) return
  return invoke("reorder_system_definitions", { orderedIds })
}

export async function reorderSpaceDefinitions(orderedIds: string[]): Promise<void> {
  if (isMock()) return
  return invoke("reorder_space_definitions", { orderedIds })
}

export async function reorderStageTemplates(orderedIds: string[]): Promise<void> {
  if (isMock()) return
  return invoke("reorder_stage_templates", { orderedIds })
}

export async function reorderShoppingPageContents(orderedIds: string[]): Promise<void> {
  if (isMock()) return
  return invoke("reorder_shopping_page_contents", { orderedIds })
}

// ---- System Definitions ----

export async function createSystemDefinition(form: ShoppingSystemDefinitionForm): Promise<void> {
  if (isMock()) throw new Error("Shopping CRUD is not available in mock mode")
  return invoke("create_system_definition", { form })
}

export async function updateSystemDefinition(form: ShoppingSystemDefinitionForm): Promise<void> {
  if (isMock()) throw new Error("Shopping CRUD is not available in mock mode")
  return invoke("update_system_definition", { form })
}

export async function deleteSystemDefinition(id: string): Promise<void> {
  if (isMock()) throw new Error("Shopping CRUD is not available in mock mode")
  return invoke("delete_system_definition", { id })
}

export async function assignSystemDefinitionItems(
  systemId: string,
  itemIds: string[],
): Promise<void> {
  if (isMock()) throw new Error("Shopping CRUD is not available in mock mode")
  return invoke("assign_system_definition_items", { systemId, itemIds })
}

// ---- Space Definitions(独立的空间字典管理) ----

export async function listSpaceDefinitions(): Promise<ShoppingSpaceDefinition[]> {
  if (isMock()) return []
  return invoke<ShoppingSpaceDefinition[]>("list_shopping_space_definitions")
}

export async function createSpaceDefinition(
  form: ShoppingSpaceDefinitionForm,
): Promise<ShoppingSpaceDefinition> {
  if (isMock()) throw new Error("Shopping CRUD is not available in mock mode")
  return invoke("create_shopping_space_definition", { form })
}

export async function updateSpaceDefinition(
  form: ShoppingSpaceDefinitionForm & { id: string },
): Promise<ShoppingSpaceDefinition> {
  if (isMock()) throw new Error("Shopping CRUD is not available in mock mode")
  return invoke("update_shopping_space_definition", { form })
}

export async function deleteSpaceDefinition(id: string): Promise<void> {
  if (isMock()) throw new Error("Shopping CRUD is not available in mock mode")
  return invoke("delete_shopping_space_definition", { id })
}

export async function assignSpaceDefinitionItems(
  spaceId: string,
  itemIds: string[],
): Promise<void> {
  if (isMock()) throw new Error("Shopping CRUD is not available in mock mode")
  return invoke("assign_space_definition_items", { spaceId, itemIds })
}
