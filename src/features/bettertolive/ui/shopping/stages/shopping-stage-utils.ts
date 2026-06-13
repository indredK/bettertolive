import type {
  ShoppingItem,
  ShoppingModuleData,
  ShoppingStageItem,
  ShoppingStageTemplate,
} from "@/features/bettertolive/types"

export type ShoppingStageViewMode = "system" | "space"

export type ShoppingStageEntry = {
  stageItem: ShoppingStageItem
  item: ShoppingItem
}

export type ShoppingStageDimensionGroup = {
  key: string
  label: string
  entries: ShoppingStageEntry[]
}

type StageTemplateWithDimensions = Pick<
  ShoppingStageTemplate,
  "items" | "systemDimensionIds" | "spaceDimensionIds"
>

export function stageItemMatchesDimension(
  item: ShoppingItem,
  viewMode: ShoppingStageViewMode,
  dimensionId: string,
) {
  return viewMode === "system"
    ? item.systemTags.includes(dimensionId)
    : item.spaceTags.includes(dimensionId)
}

export function getStageTemplateDimensionIds(
  stage: StageTemplateWithDimensions,
  allItems: ShoppingItem[],
  shopping: ShoppingModuleData,
  viewMode: ShoppingStageViewMode,
) {
  const definitions = viewMode === "system" ? shopping.systemDefinitions : shopping.spaceDefinitions

  const stageItemIds = new Set(stage.items.map((stageItem) => stageItem.itemId))
  return definitions
    .filter((definition) =>
      allItems.some(
        (item) =>
          stageItemIds.has(item.id) && stageItemMatchesDimension(item, viewMode, definition.id),
      ),
    )
    .map((definition) => definition.id)
}

export function buildStageDimensionGroups(
  stage: StageTemplateWithDimensions,
  allItems: ShoppingItem[],
  shopping: ShoppingModuleData,
  viewMode: ShoppingStageViewMode,
): ShoppingStageDimensionGroup[] {
  const definitions = viewMode === "system" ? shopping.systemDefinitions : shopping.spaceDefinitions

  const stageEntries = stage.items
    .map((stageItem) => ({
      stageItem,
      item: allItems.find((item) => item.id === stageItem.itemId),
    }))
    .filter((entry): entry is ShoppingStageEntry => Boolean(entry.item))

  const dimensionIds = getStageTemplateDimensionIds(stage, allItems, shopping, viewMode)
  const dimensionIdSet = new Set(dimensionIds)

  return definitions
    .filter((definition) => dimensionIdSet.has(definition.id))
    .map((definition) => ({
      key: definition.id,
      label: definition.name || definition.id,
      entries: stageEntries.filter(({ item }) =>
        stageItemMatchesDimension(item, viewMode, definition.id),
      ),
    }))
}

export function stageItemHasVisibleDimension(
  item: ShoppingItem,
  systemDimensionIds: string[],
  spaceDimensionIds: string[],
) {
  if (systemDimensionIds.some((dimensionId) => item.systemTags.includes(dimensionId))) {
    return true
  }
  return spaceDimensionIds.some((dimensionId) => item.spaceTags.includes(dimensionId))
}
