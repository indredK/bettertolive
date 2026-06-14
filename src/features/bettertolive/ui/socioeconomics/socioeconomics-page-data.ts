import type {
  EconConfidence,
  EconDomain,
  EconLayer,
  EconRelevance,
  EconSource,
  EconTopicArea,
  SocioeconomicsDiscipline,
} from "@/features/bettertolive/types"
import { generateId } from "@/lib/id-utils"
import { joinListText, splitListText } from "@/lib/list-utils"

export const ECON_DOMAINS = [
  "货币与物价",
  "个人财务",
  "劳动力市场",
  "产业与公司",
  "财政与政策",
  "金融市场",
  "全球与宏观",
  "社会结构",
  "社会流动",
  "制度与组织",
  "城市与社区",
  "文化与规范",
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

export const SOCIO_DISCIPLINES = ["经济学", "社会学"] satisfies SocioeconomicsDiscipline[]

export const ECON_TOPIC_AREAS = [
  "经济学基础概念",
  "微观经济学",
  "宏观经济学",
  "著名经济学家",
  "经济原理与模型",
  "经济政策",
] satisfies EconTopicArea[]

export const ECON_CONFIDENCE_ORDER: Record<EconConfidence, number> = {
  听过名词: 0,
  知道大致逻辑: 1,
  能预判常见情境: 2,
  有自己的判断框架: 3,
}

export const createSocioeconomicsId = (prefix: string) => generateId(prefix)

export { joinListText, splitListText }
