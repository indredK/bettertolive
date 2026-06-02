import type { RelationshipsModuleData } from "@/features/bettertolive/models/workspace"

export const relationshipsMockData = {
  circles: [
    {
      id: "relationship-family",
      title: "家庭与亲戚",
      summary: "最早的安全感、期待和压力，很多都从这里开始。",
      entries: [
        {
          id: "family-1",
          name: "母亲",
          role: "核心家庭",
          influence: "让我很早学会体谅别人，也容易先照顾外界感受。",
          currentState: "亲近，但需要更多边界感。",
        },
        {
          id: "family-2",
          name: "亲戚网络",
          role: "扩展家庭",
          influence: "让我对“别人怎么看”这件事一直比较敏感。",
          currentState: "联系存在，但正在学着不过度受其定义。",
        },
      ],
    },
    {
      id: "relationship-friends",
      title: "朋友与同伴",
      summary: "是你重新认识自己、确认价值感的重要镜子。",
      entries: [
        {
          id: "friend-1",
          name: "能认真聊天的朋友",
          role: "精神支持",
          influence: "和他们聊天时，你更能看见自己真正想要什么。",
          currentState: "需要主动维持，不然很容易只剩工作交流。",
        },
        {
          id: "friend-2",
          name: "工作伙伴",
          role: "现实协作",
          influence: "会影响你对能力、可靠性和价值交换的判断。",
          currentState: "实用但要防止关系只剩效率。",
        },
      ],
    },
  ],
  patterns: [
    "你会自然承担理解者的位置，但有时会忽略自己的需求。",
    "真正让你靠近人的，不是热闹，而是被理解和能认真谈事。",
    "关系质量会直接影响你的节奏感和自我评价。",
  ],
} satisfies RelationshipsModuleData
