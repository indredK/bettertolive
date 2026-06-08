import type { TFunction } from "i18next"

import type {
  PrincipleCost,
  PrincipleDomain,
  PrincipleSource,
  PrincipleStatus,
  PrincipleStrength,
  PrincipleType,
} from "@/features/bettertolive/types"

export const PRINCIPLE_DOMAINS = [
  "关系",
  "工作",
  "金钱",
  "健康",
  "时间",
  "诚信",
] satisfies PrincipleDomain[]

export const PRINCIPLE_TYPES = ["边界", "标准", "底线"] satisfies PrincipleType[]

export const PRINCIPLE_STRENGTHS = [
  "不可退让",
  "强烈偏好",
  "参考指引",
] satisfies PrincipleStrength[]

export const PRINCIPLE_SOURCES = [
  "受伤后确立",
  "观察他人",
  "主动推导",
  "家庭继承",
] satisfies PrincipleSource[]

export const PRINCIPLE_STATUSES = [
  "生效中",
  "正在测试",
  "已修订",
  "已放弃",
] satisfies PrincipleStatus[]

export const PRINCIPLE_COSTS = ["高代价", "中等代价", "低代价", "零代价"] satisfies PrincipleCost[]

export const PRINCIPLES_DIALOG_CONTENT_CLASS = "border border-foreground/10 bg-background shadow-lg"

export const PRINCIPLES_DIALOG_HEADER_CLASS =
  "sticky top-0 z-10 -mx-4 -mt-4 border-b border-foreground/10 bg-background/95 px-4 pt-4 pb-3 pr-12 supports-[backdrop-filter]:bg-background/90 supports-[backdrop-filter]:backdrop-blur-xs"

export const PRINCIPLES_DIALOG_SECTION_CLASS =
  "space-y-3 rounded-xl border border-foreground/10 bg-card/70 p-4"

export const PRINCIPLES_DIALOG_FIELD_CLASS = "w-full border-foreground/15 bg-background shadow-sm"

export const PRINCIPLES_DIALOG_FOOTER_CLASS =
  "sticky bottom-0 z-10 gap-2 border-foreground/10 bg-background/95 supports-[backdrop-filter]:bg-background/90 supports-[backdrop-filter]:backdrop-blur-xs"

export type PrincipleEnumGroup =
  | "domain"
  | "type"
  | "strength"
  | "source"
  | "status"
  | "cost"
  | "relation"
  | "revisionField"

export function translatePrincipleEnum(t: TFunction, group: PrincipleEnumGroup, value: string) {
  return t(`principles.enumNames.${group}.${value}`, value)
}
