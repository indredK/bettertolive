import type { useTranslation } from "react-i18next"

import type {
  BeliefCbtLayer,
  BeliefDomain,
  BeliefImpact,
  BeliefLayer,
  BeliefSource,
  BeliefStability,
  CognitiveDistortion,
  DefenseMechanism,
} from "@/features/bettertolive/types"

export const BELIEF_DOMAINS = [
  "关系",
  "工作",
  "金钱",
  "自我",
  "社会",
  "时间",
  "意义",
] satisfies BeliefDomain[]

export const BELIEF_LAYERS = ["世界观", "人生观", "价值观"] satisfies BeliefLayer[]

export const BELIEF_STABILITIES = [
  "稳定",
  "正在松动",
  "正在形成",
  "已放弃",
] satisfies BeliefStability[]

export const BELIEF_SOURCES = [
  "亲身经历",
  "家庭继承",
  "社会环境",
  "主动反思",
  "创伤反应",
] satisfies BeliefSource[]

export const BELIEF_IMPACTS = ["支撑性", "限制性", "中性", "冲突中"] satisfies BeliefImpact[]

export const BELIEF_CBT_LAYERS = ["自动思维", "中间信念", "核心信念"] satisfies BeliefCbtLayer[]

export const COGNITIVE_DISTORTIONS = [
  "全有或全无",
  "过度概括",
  "灾难化",
  "读心术",
  "应该陈述",
  "个人化",
  "情绪推理",
  "贴标签",
] satisfies CognitiveDistortion[]

export const DEFENSE_MECHANISMS = [
  "否认",
  "投射",
  "合理化",
  "理智化",
  "反向形成",
  "升华",
] satisfies DefenseMechanism[]

export const NONE_SELECT_VALUE = "__none__"

export function todayText() {
  return new Date().toISOString().slice(0, 10)
}

export function labelFor(t: ReturnType<typeof useTranslation>["t"], group: string, value: string) {
  return t(`beliefs.enums.${group}.${value}`, value)
}

export function toggleValue<T extends string>(values: T[], value: T) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}
