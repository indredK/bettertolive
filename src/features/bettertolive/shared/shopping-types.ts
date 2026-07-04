import type {
  ShoppingItem,
  ShoppingSpaceDefinition,
  ShoppingSystemDefinition,
} from "@/features/bettertolive/models/workspace"

/** 系统聚合视图(按 systemTags group-by 后的结果) */
export type ShoppingSystemOverview = ShoppingSystemDefinition & {
  items: ShoppingItem[]
  isActive: boolean
}

/** 空间聚合视图(按 spaceTags group-by 后的结果) */
export type SpaceOverview = ShoppingSpaceDefinition & {
  items: ShoppingItem[]
}
