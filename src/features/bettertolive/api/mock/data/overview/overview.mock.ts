import type { OverviewModuleData } from "@/features/bettertolive/models/workspace"

export const overviewMockData = {
  greeting:
    "一个把记录、关系、成长环境和未来方向放在同一张桌子上的私人空间。你可以从任何入口开始，但最后都回到“我是谁”“我为什么会这样”“我想怎样生活”。",
  dailyPulse: [
    "今天更适合诚实记录，而不是逼自己得出结论。",
    "最近的消费和购物冲动都在提醒你：你想把生活过得更稳一点。",
    "未来蓝图里最重要的不是宏大目标，而是你想长期保持的生活感。",
  ],
  recentRecords: [
    {
      id: "recent-1",
      kind: "反思",
      title: "今天想要的不是效率，是内心稳定",
      description: "我能感到自己正在慢慢靠近想要的生活。",
      date: "06-02 22:14",
    },
    {
      id: "recent-2",
      kind: "支出",
      title: "午饭",
      description: "¥26 · 今天的钱花在补状态上。",
      date: "06-02 12:30",
    },
    {
      id: "recent-3",
      kind: "记事",
      title: "和朋友聊未来城市选择",
      description: "我想换的不是城市本身，而是更自由的生活结构。",
      date: "06-02 19:20",
    },
    {
      id: "recent-4",
      kind: "蓝图",
      title: "理想生活",
      description: "居住安静，工作相对自由，时间安排由自己主导。",
      date: "06-01 23:40",
    },
  ],
} satisfies OverviewModuleData
