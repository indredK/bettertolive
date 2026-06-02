import type { PrinciplesModuleData } from "@/features/bettertolive/models/workspace"

export const principlesMockData = {
  entries: [
    {
      id: "principle-1",
      title: "先诚实，再优化",
      description: "先承认自己当下真实的感受、状态和欲望，再谈改变。",
      boundary: "不靠假装积极来维持秩序感。",
      source: "来自过去反复压抑情绪后的反弹。",
    },
    {
      id: "principle-2",
      title: "长期稳定比短期证明更重要",
      description: "重要决定先看能不能持续，而不是能不能一时显得厉害。",
      boundary: "不为了证明自己而接受明显透支的安排。",
      source: "来自对工作节奏和身心消耗的长期观察。",
    },
    {
      id: "principle-3",
      title: "关系里要有边界感",
      description: "亲近不等于无条件承担，真诚也需要界限。",
      boundary: "不靠委屈自己来换取关系稳定。",
      source: "来自亲密关系和家人互动中的旧模式识别。",
    },
  ],
  boundaries: [
    "不长期待在让我持续自我怀疑的关系里。",
    "不把休息当成内疚来源。",
    "不为了外界评价放弃自己想要的生活结构。",
  ],
} satisfies PrinciplesModuleData
