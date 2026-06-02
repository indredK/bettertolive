import type { CrisisWorkspaceModuleData } from "@/features/bettertolive/models/workspace"

export const crisisMockData = {
  currentState: {
    level: "明显失衡但还能求助",
    summary: "当你开始什么都不想碰、又明显压不住烦躁时，说明已经不是普通累了。",
    firstStep: "先停止继续硬撑，离开当前刺激源，联系一个能接住你的人。",
  },
  warningSigns: [
    "连续两天不想回消息，连解释都懒得做。",
    "睡前停不下来，脑子一直在过旧对话和坏结果。",
    "开始用吃东西、刷手机或拖延把自己堵住。",
    "明明知道该休息，却会因为自责继续逼自己。",
  ],
  contacts: [
    {
      id: "crisis-contact-1",
      name: "最能认真听你说话的朋友",
      role: "情绪陪伴",
      when: "已经明显乱掉，但还能开口求助时",
      script: "我现在状态有点差，不需要你解决，先陪我说几分钟话就行。",
    },
    {
      id: "crisis-contact-2",
      name: "能帮你做现实判断的人",
      role: "现实支撑",
      when: "你已经不适合自己做决定时",
      script: "我脑子现在不太稳，能不能帮我判断一下今天先停哪几件事？",
    },
    {
      id: "crisis-contact-3",
      name: "现实世界支持资源",
      role: "外部支持",
      when: "状态持续恶化，已经超出自我消化范围时",
      script: "不要只留在应用里，尽快联系现实中的专业或可信支持。",
    },
  ],
  steps: [
    {
      id: "crisis-step-1",
      title: "停止继续刺激自己",
      description:
        "先关掉会让你更乱的对话、页面和任务，不要一边崩一边继续受刺激。",
    },
    {
      id: "crisis-step-2",
      title: "做一个身体动作",
      description:
        "喝水、洗脸、站起来、去窗边或出门走两分钟，先让身体离开僵住状态。",
    },
    {
      id: "crisis-step-3",
      title: "向外发送一个信号",
      description: "哪怕只发一句“我现在不太好”，也比彻底缩回去更能保护你。",
    },
    {
      id: "crisis-step-4",
      title: "只保留今天最低配置",
      description: "别再追求完整，把今天缩到最小，先让自己过线。",
    },
  ],
  reviewNotes: [
    "每次低谷前，睡眠和消息回避都比情绪本身更早出现。",
    "真正帮到你的通常不是分析，而是有人在场和一点现实动作。",
    "如果同样的状态连续出现，就要把现实支持提前准备好，而不是只靠意志扛。",
  ],
} satisfies CrisisWorkspaceModuleData
