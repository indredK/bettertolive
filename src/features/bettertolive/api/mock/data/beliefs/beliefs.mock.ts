import type { BeliefsModuleData } from "@/features/bettertolive/models/workspace"

export const beliefsMockData = {
  cards: [
    {
      id: "belief-worldview",
      label: "世界观",
      summary: "人会被环境塑造，但也可以慢慢重写自己。",
      note: "这让你对成长和关系都比较敏感，会很在意自己长期被什么包围、被什么影响。",
      keywords: ["环境", "塑造", "选择", "长期"],
    },
    {
      id: "belief-lifeview",
      label: "人生观",
      summary: "我想过的是稳定而自由的生活，不想靠持续透支证明自己。",
      note: "你在做选择时，会天然把“能不能长期过下去”放在效率和面子前面。",
      keywords: ["稳定", "自由", "长期", "节奏"],
    },
    {
      id: "belief-values",
      label: "价值观",
      summary: "真实、边界感和可持续，比短期热闹更重要。",
      note: "这会影响你怎么花钱、怎么交朋友、怎么决定该继续还是停下来。",
      keywords: ["真实", "边界", "可持续", "关系"],
    },
  ],
  questions: [
    "我现在做出的很多反应，哪些其实是旧环境留下来的默认值？",
    "我真正认同的价值，和为了适应环境形成的习惯，怎么区分？",
    "如果没有外界期待，我会怎样安排自己的节奏、关系和工作？",
  ],
} satisfies BeliefsModuleData
