import type { FutureModuleData } from "@/features/bettertolive/models/workspace"

export const futureMockData = {
  identity: "更稳定、更清醒、做事更长期，也更有余地照顾关系和身体。",
  lifestyle: "居住安静，工作相对自由，时间安排由自己主导，关系简单而真实。",
  values: ["真实", "自由", "长期主义", "内在稳定感"],
  milestones: [
    {
      horizon: "未来 3 个月",
      summary: "稳定记录与复盘，建立对自己生活节奏的基本感知。",
      steps: ["每天留一点真实记录", "每周回看一次消费与情绪", "把未来蓝图补成持续页面"],
    },
    {
      horizon: "未来 6 个月",
      summary: "逐步明确收入结构、时间支配方式和更适合自己的生活环境。",
      steps: ["梳理更适合的工作方式", "减少无意识支出", "试着固定一套更像自己的生活节奏"],
    },
  ],
  experiments: [
    "让反思先真实，再追求完整",
    "把钱花向能换来稳定感和自由度的地方",
    "用事件和消费记录校准理想生活，而不是只靠想象",
  ],
} satisfies FutureModuleData
