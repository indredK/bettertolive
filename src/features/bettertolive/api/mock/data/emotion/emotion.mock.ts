import type { EmotionWorkspaceModuleData } from "@/features/bettertolive/models/workspace"

export const emotionMockData = {
  checkIns: [
    {
      id: "emotion-checkin-1",
      date: "06-03 08:20",
      summary: "醒来就有点紧，像还没从昨天的压力里退出来。",
      state: "低压焦虑",
      intensity: "6/10",
      bodySignal: "肩颈发紧，胃口一般",
      tags: ["睡眠浅", "工作挂心", "不想社交"],
    },
    {
      id: "emotion-checkin-2",
      date: "06-02 22:40",
      summary: "晚上和朋友聊完后缓了一点，确认自己最近更需要被理解。",
      state: "回稳",
      intensity: "4/10",
      bodySignal: "呼吸顺了一些",
      tags: ["被理解", "说出来了", "恢复中"],
    },
    {
      id: "emotion-checkin-3",
      date: "06-01 23:15",
      summary: "白天很想把事情做快，晚上反而有一点空和疲惫。",
      state: "高压后空掉",
      intensity: "7/10",
      bodySignal: "脑子发热，眼睛很累",
      tags: ["自我要求", "效率冲刺", "夜晚低落"],
    },
  ],
  trend: [
    { id: "emotion-trend-1", label: "05-28", score: 4, note: "节奏还算平。" },
    {
      id: "emotion-trend-2",
      label: "05-29",
      score: 5,
      note: "开始有赶时间感。",
    },
    {
      id: "emotion-trend-3",
      label: "05-30",
      score: 7,
      note: "工作密度上来了。",
    },
    { id: "emotion-trend-4", label: "05-31", score: 8, note: "晚上明显烦躁。" },
    { id: "emotion-trend-5", label: "06-01", score: 7, note: "高压后有点空。" },
    {
      id: "emotion-trend-6",
      label: "06-02",
      score: 5,
      note: "说出来后缓了一点。",
    },
    {
      id: "emotion-trend-7",
      label: "06-03",
      score: 6,
      note: "还在恢复，但比前几天清醒。",
    },
  ],
  triggers: [
    {
      id: "emotion-trigger-1",
      title: "工作节奏过密",
      summary: "当任务堆在一起时，你很容易立刻切回高要求模式。",
      cues: ["催进度", "切换太多", "还没开始就先自责"],
    },
    {
      id: "emotion-trigger-2",
      title: "深夜独处",
      summary: "情绪更容易在晚上放大，特别是白天一直压着的时候。",
      cues: ["刷手机停不下", "突然空掉", "开始想很多旧事"],
    },
    {
      id: "emotion-trigger-3",
      title: "关系里的误解感",
      summary: "没有被接住时，比事情本身更容易刺到你。",
      cues: ["消息回得很冷", "对话对不上频率", "解释欲上来"],
    },
  ],
  tools: [
    {
      id: "emotion-tool-1",
      title: "先离开屏幕十分钟",
      description: "让神经系统先松一点，再决定要不要继续处理事情。",
      when: "脑子很热、一直想证明自己时",
    },
    {
      id: "emotion-tool-2",
      title: "把一句真话发给可信任的人",
      description: "不是求解决方案，只是把状态从身体里挪一点出来。",
      when: "感觉自己快要闷住时",
    },
    {
      id: "emotion-tool-3",
      title: "只做最小恢复动作",
      description: "喝水、洗脸、关掉噪音，再看要不要继续分析。",
      when: "已经很累、不适合再复盘时",
    },
  ],
} satisfies EmotionWorkspaceModuleData
