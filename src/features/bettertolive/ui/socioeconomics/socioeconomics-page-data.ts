import type {
  EconConfidence,
  EconDomain,
  EconLayer,
  EconRelevance,
  EconSource,
} from "@/features/bettertolive/types"

export const ECON_DOMAINS = [
  "货币与物价",
  "个人财务",
  "劳动力市场",
  "产业与公司",
  "财政与政策",
  "金融市场",
  "全球与宏观",
] satisfies EconDomain[]

export const ECON_LAYERS = ["微观", "中观", "宏观"] satisfies EconLayer[]

export const ECON_CONFIDENCES = [
  "听过名词",
  "知道大致逻辑",
  "能预判常见情境",
  "有自己的判断框架",
] satisfies EconConfidence[]

export const ECON_SOURCES = [
  "系统学习",
  "新闻媒体",
  "亲身经历",
  "他人叙述",
  "专业讨论",
] satisfies EconSource[]

export const ECON_RELEVANCES = [
  "直接影响当前决策",
  "影响中期规划",
  "影响长期方向",
  "纯认知储备",
] satisfies EconRelevance[]

export const ECON_CONFIDENCE_ORDER: Record<EconConfidence, number> = {
  听过名词: 0,
  知道大致逻辑: 1,
  能预判常见情境: 2,
  有自己的判断框架: 3,
}

export function createSocioeconomicsId(prefix: string) {
  const randomId =
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  return `${prefix}-${randomId}`
}

export function splitListText(text: string) {
  return text
    .split(/[,，\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

export function joinListText(items?: string[]) {
  return (items ?? []).join("，")
}
