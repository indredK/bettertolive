import type { GrowthModuleData } from "@/features/bettertolive/models/workspace"

export const growthMockData = {
  stages: [
    {
      id: "growth-1",
      stage: "学生时期",
      title: "习惯通过表现换取确定感",
      environment: "评价标准明确、外部反馈密集的环境。",
      impact: "你更容易把自我价值和表现绑定在一起。",
      traces: ["怕慢", "想证明自己", "对评价敏感"],
    },
    {
      id: "growth-2",
      stage: "初入社会",
      title: "开始意识到自由和稳定需要同时经营",
      environment: "工作节奏、收入压力和生活安排一起出现。",
      impact: "你开始更关心自己的边界、精力分配和生活结构。",
      traces: ["现金流意识", "边界感", "生活方式选择"],
    },
    {
      id: "growth-3",
      stage: "现在",
      title: "从结果导向转向自我校准",
      environment: "接触到更多不同的人和生活方式，也开始回头看自己。",
      impact: "你不再只问该做什么，而开始问自己为什么会这样想。",
      traces: ["复盘", "自我认知", "主动选择"],
    },
  ],
  threads: [
    "很多焦虑不是因为事情本身，而是旧环境留下的高要求还在驱动你。",
    "你接触过的人和工作方式，正在一点点重写你对自由、稳定和成功的定义。",
    "真正重要的不是把过去推翻，而是看清哪些部分还在影响现在的你。",
  ],
} satisfies GrowthModuleData
