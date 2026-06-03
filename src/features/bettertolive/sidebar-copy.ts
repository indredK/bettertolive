import type { AppView } from "@/features/bettertolive/types"

export type WorkspaceRhythmSlide = {
  id: string
  title: string
  body: string
}

export type WorkspaceSidebarNote = {
  heading: string
  lines: Array<{
    label: string
    text: string
  }>
}

export const workspaceRhythmSlides: WorkspaceRhythmSlide[] = [
  {
    id: "capture",
    title: "先记录",
    body: "先记录，再整理，再理解自己为什么会这样想、这样活。",
  },
  {
    id: "review",
    title: "轻一点回看",
    body: "不急着得出答案，先看最近的情绪、选择和生活节奏。",
  },
  {
    id: "future",
    title: "给未来留位置",
    body: "把理想生活写具体一点，方向才会慢慢从模糊变成行动。",
  },
]

export const workspaceSidebarNotes: Record<AppView, WorkspaceSidebarNote> = {
  overview: {
    heading: "总览说明",
    lines: [
      {
        label: "先看",
        text: "这里先汇总最近记录、关系、成长和未来线索。",
      },
      {
        label: "适合",
        text: "适合还没决定从哪里开始，或只想先看全局的时候。",
      },
      {
        label: "目的",
        text: "帮你先判断此刻最值得进入的模块。",
      },
    ],
  },
  reflection: {
    heading: "反思说明",
    lines: [
      {
        label: "先写",
        text: "先写下情绪、念头和困惑，不急着整理。",
      },
      {
        label: "适合",
        text: "适合心里有点乱、刚经历完事情或想复盘时。",
      },
      {
        label: "目的",
        text: "把模糊感受写清楚，留一个可回看的入口。",
      },
    ],
  },
  events: {
    heading: "记事说明",
    lines: [
      {
        label: "记录",
        text: "把事情、对话和转折留进自己的时间线。",
      },
      {
        label: "适合",
        text: "适合记住具体经历，或回头还原事情经过时。",
      },
      {
        label: "目的",
        text: "让生活不只剩印象，而能被重新看见。",
      },
    ],
  },
  finance: {
    heading: "记账说明",
    lines: [
      {
        label: "记录",
        text: "收入、支出和分类能看出你最近把资源放在哪。",
      },
      {
        label: "适合",
        text: "适合看生活重心、消费习惯和阶段压力时。",
      },
      {
        label: "目的",
        text: "把花钱和生活选择连起来，而不只看数字。",
      },
    ],
  },
  shopping: {
    heading: "购物说明",
    lines: [
      {
        label: "记录",
        text: "把已有物品、采购决策、阶段清单和价格感放到一起看。",
      },
      {
        label: "适合",
        text: "适合整理生活缺口，判断什么该补、什么该等、什么先别买时。",
      },
      {
        label: "目的",
        text: "让物品真正服务生活，而不是只堆成更多待买项。",
      },
    ],
  },
  nutrition: {
    heading: "饮食说明",
    lines: [
      {
        label: "记录",
        text: "按场景、构成、触发记录每一顿，再补一段身体反馈。",
      },
      {
        label: "适合",
        text: "适合发现自己吃得乱、吃完不舒服或想看饮食结构时。",
      },
      {
        label: "目的",
        text: "不算卡路里，而是把吃和生活、关系、心情连起来。",
      },
    ],
  },
  emotion: {
    heading: "情绪说明",
    lines: [
      {
        label: "观察",
        text: "把波动、触发因素和恢复方式放到一起看，不只记录心情。",
      },
      {
        label: "适合",
        text: "适合最近状态不稳、想知道自己为什么这样时。",
      },
      {
        label: "目的",
        text: "让模糊的内在感受慢慢出现结构和节律。",
      },
    ],
  },
  crisis: {
    heading: "危机说明",
    lines: [
      {
        label: "支撑",
        text: "状态很差时，先不要分析太多，先知道下一步该做什么。",
      },
      {
        label: "适合",
        text: "适合明显失衡、想躲起来、或已经不知道怎么继续时。",
      },
      {
        label: "目的",
        text: "把预警信号、联系人和应急步骤提前准备好。",
      },
    ],
  },
  beliefs: {
    heading: "观念说明",
    lines: [
      {
        label: "整理",
        text: "把你对世界、关系和生活的看法放到一起。",
      },
      {
        label: "适合",
        text: "适合发现自己总在重复某种判断的时候。",
      },
      {
        label: "目的",
        text: "把隐性想法说清楚，才知道它在帮你还是限你。",
      },
    ],
  },
  principles: {
    heading: "原则说明",
    lines: [
      {
        label: "厘清",
        text: "这里放你的原则、边界、底线和不愿退让的部分。",
      },
      {
        label: "适合",
        text: "适合决定犹豫、反复退让或想校准标准时。",
      },
      {
        label: "目的",
        text: "让重要决定不只靠情绪，而有稳定依据。",
      },
    ],
  },
  relationships: {
    heading: "关系深化说明",
    lines: [
      {
        label: "看见",
        text: "把重要的人、关系事件、未说出口的话和你的感受放回一张图里。",
      },
      {
        label: "适合",
        text: "适合梳理谁在影响你、支持你，或关系卡住时。",
      },
      {
        label: "目的",
        text: "不只记得情绪，也看见关系模式和反复出现的反应。",
      },
    ],
  },
  journey: {
    heading: "成长记忆说明",
    lines: [
      {
        label: "追溯",
        text: "把人生节点、经历背景和留下的影响放在同一条时间线上回看。",
      },
      {
        label: "适合",
        text: "你想理解自己怎么形成，或追溯某个反应、模式从哪里开始时。",
      },
      {
        label: "目的",
        text: "把散落的过去整理成可理解的人生脉络，慢慢松开旧惯性。",
      },
    ],
  },
  legacy: {
    heading: "生命整理说明",
    lines: [
      {
        label: "安放",
        text: "把重要交代、留给某人的话和未完成的牵挂安放下来。",
      },
      {
        label: "适合",
        text: "适合想留下重要表达、整理托付或回看此生在意什么的时候。",
      },
      {
        label: "目的",
        text: "让重要的话不只留在脑子里，也不必被迫一次说完。",
      },
    ],
  },
  socioeconomics: {
    heading: "社会经济说明",
    lines: [
      {
        label: "梳理",
        text: "按领域和层次梳理对外部经济世界的认知。",
      },
      {
        label: "适合",
        text: "适合想看清楚自己对宏观、行业、个人财务到底懂多少时。",
      },
      {
        label: "目的",
        text: "认知地图覆盖到哪、缺口在哪，先让它显形。",
      },
    ],
  },
  future: {
    heading: "未来说明",
    lines: [
      {
        label: "描画",
        text: "把理想自我、理想生活和下一步写得更具体。",
      },
      {
        label: "适合",
        text: "适合重新校准方向，或想知道该靠近什么时。",
      },
      {
        label: "目的",
        text: "未来蓝图不是预测，而是你愿意靠近的定义。",
      },
    ],
  },
}
