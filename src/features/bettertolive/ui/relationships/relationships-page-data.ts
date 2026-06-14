import type { TFunction } from "i18next"

import type {
  InteractionFrequency,
  RelationshipConnectionStrength,
  RelationshipChangeField,
  RelationshipDepth,
  RelationshipEventKind,
  RelationshipImpact,
  RelationshipStage,
  RelationshipType,
  UnfinishedWeight,
  UnsentNoteTargetType,
} from "@/features/bettertolive/types"

export const RELATIONSHIP_TYPES = [
  "家人",
  "伴侣",
  "朋友",
  "同事",
  "过去重要的人",
  "导师/榜样",
] satisfies RelationshipType[]

export const RELATIONSHIP_DEPTHS = [
  "亲密",
  "亲近",
  "熟人",
  "疏远",
  "断联",
] satisfies RelationshipDepth[]

export const RELATIONSHIP_STAGES = [
  "建立中",
  "稳定",
  "紧张",
  "修复中",
  "已结束",
  "等待中",
] satisfies RelationshipStage[]

export const RELATIONSHIP_IMPACTS = ["滋养", "消耗", "中性", "混合"] satisfies RelationshipImpact[]

export const INTERACTION_FREQUENCIES = [
  "每天",
  "每周",
  "每月",
  "每年",
  "几乎不",
  "已无联系",
] satisfies InteractionFrequency[]

export const UNFINISHED_WEIGHTS = ["很重", "中等", "轻微", "无"] satisfies UnfinishedWeight[]

export const RELATIONSHIP_EVENT_KINDS = [
  "认识",
  "重要谈话",
  "冲突",
  "和好",
  "疏远",
  "断联",
  "重逢",
] satisfies RelationshipEventKind[]

export const RELATIONSHIP_CHANGE_FIELDS = ["depth", "stage"] satisfies RelationshipChangeField[]

export const UNSENT_NOTE_TARGET_TYPES = [
  "关系条目",
  "独立对象",
  "未来的自己",
] satisfies UnsentNoteTargetType[]

export const RELATIONSHIP_CONNECTION_STRENGTH_OPTIONS = [
  "强",
  "中",
  "弱",
] satisfies RelationshipConnectionStrength[]

export const RELATIONSHIP_DIALOG_CONTENT_CLASS =
  "border border-foreground/10 bg-background shadow-lg"

export const RELATIONSHIP_DIALOG_HEADER_CLASS =
  "sticky top-0 z-10 -mx-4 -mt-4 border-b border-foreground/10 bg-background/95 px-4 pt-4 pb-3 pr-12 supports-[backdrop-filter]:bg-background/90 supports-[backdrop-filter]:backdrop-blur-xs"

export const RELATIONSHIP_DIALOG_SECTION_CLASS =
  "space-y-3 rounded-xl border border-foreground/10 bg-card/70 p-4"

export const RELATIONSHIP_DIALOG_COMPACT_SECTION_CLASS =
  "space-y-2.5 rounded-xl border border-foreground/10 bg-card/70 p-3"

export const RELATIONSHIP_DIALOG_FIELD_CLASS = "w-full border-foreground/15 bg-background shadow-sm"

export const RELATIONSHIP_DIALOG_FOOTER_CLASS =
  "sticky bottom-0 z-10 gap-2 border-foreground/10 bg-background/95 supports-[backdrop-filter]:bg-background/90 supports-[backdrop-filter]:backdrop-blur-xs"

export const RELATIONSHIP_SELECT_CONTENT_CLASS = "min-w-[14rem] max-w-[min(24rem,calc(100vw-2rem))]"

export type RelationshipEnumGroup =
  | "type"
  | "depth"
  | "stage"
  | "impact"
  | "interaction"
  | "unfinishedWeight"
  | "eventKind"
  | "changeField"
  | "targetType"
  | "connectionStrength"

export function translateRelationshipEnum(
  t: TFunction,
  group: RelationshipEnumGroup,
  value: string | undefined,
) {
  if (!value) return ""

  return t(`relationships.enumNames.${group}.${value}`, value)
}
