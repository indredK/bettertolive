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
          emotionalTone: "靠近时有安全感，但也会很快背上责任感。",
          unspokenLine: "我想被理解，不只是被要求懂事。",
        },
        {
          id: "family-2",
          name: "亲戚网络",
          role: "扩展家庭",
          influence: "让我对“别人怎么看”这件事一直比较敏感。",
          currentState: "联系存在，但正在学着不过度受其定义。",
          emotionalTone: "容易让你下意识紧起来，想先把自己摆正。",
          unspokenLine: "我不想再一直通过迎合来换取轻松。",
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
          emotionalTone: "会让你从绷着的状态里慢慢松下来。",
          unspokenLine: "其实我很珍惜这种能认真说话的关系。",
        },
        {
          id: "friend-2",
          name: "工作伙伴",
          role: "现实协作",
          influence: "会影响你对能力、可靠性和价值交换的判断。",
          currentState: "实用但要防止关系只剩效率。",
          emotionalTone: "可靠感会增强，但也容易让你只剩功能性相处。",
          unspokenLine: "我不想所有关系最后都只剩下完成任务。",
        },
      ],
    },
  ],
  patterns: [
    "你会自然承担理解者的位置，但有时会忽略自己的需求。",
    "真正让你靠近人的，不是热闹，而是被理解和能认真谈事。",
    "关系质量会直接影响你的节奏感和自我评价。",
  ],
  moments: [
    {
      id: "relationship-moment-1",
      person: "家人",
      title: "一次认真表达边界的对话",
      impact: "那之后你开始意识到，亲近不等于什么都要接住。",
    },
    {
      id: "relationship-moment-2",
      person: "朋友",
      title: "被认真听完一次低落",
      impact: "你重新确认了，自己真正需要的不是建议，而是先被接住。",
    },
    {
      id: "relationship-moment-3",
      person: "工作伙伴",
      title: "效率合作之外的一次坦诚交流",
      impact: "让你看到关系不一定只能停在功能层面。",
    },
  ],
  unsentNotes: [
    {
      id: "relationship-unsent-1",
      to: "家人",
      theme: "解释",
      excerpt: "我不是不在乎你们，只是我也需要一点不被定义的空间。",
    },
    {
      id: "relationship-unsent-2",
      to: "重要朋友",
      theme: "感谢",
      excerpt: "有些时候是你们让我知道，我并没有那么难被真正理解。",
    },
  ],
} satisfies RelationshipsModuleData
