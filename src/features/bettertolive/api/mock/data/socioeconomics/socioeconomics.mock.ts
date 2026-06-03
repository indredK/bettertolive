import type { SocioeconomicsModuleData } from "@/features/bettertolive/models/workspace"

export const socioeconomicsMockData = {
  entries: [
    {
      id: "socio-1",
      title: "通胀对个人储蓄的影响",
      domain: "货币与物价",
      layer: "微观（个人/家庭）",
      confidence: "知道大致逻辑",
      source: "新闻媒体",
      summary: "通胀长期高于储蓄利率时，纯存款的购买力会被慢慢侵蚀。",
    },
    {
      id: "socio-2",
      title: "行业周期与就业波动",
      domain: "劳动力市场",
      layer: "中观（行业/市场）",
      confidence: "听过名词",
      source: "亲身经历",
      summary: "不同行业的高峰低谷节奏不同，影响招聘节奏与跳槽窗口。",
    },
    {
      id: "socio-3",
      title: "财政政策与公共服务",
      domain: "财政与政策",
      layer: "宏观（国家/全球）",
      confidence: "知道大致逻辑",
      source: "系统学习",
      summary: "财政支出方向，决定教育、医疗、基建等公共服务的实际水平。",
    },
  ],
  gaps: [
    "对货币政策传导路径还不熟悉。",
    "对自己所在行业的周期判断不清晰。",
    "全球宏观对个人生活的具体影响，还停留在名词阶段。",
  ],
} satisfies SocioeconomicsModuleData
