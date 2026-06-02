import type { MemoryWorkspaceModuleData } from "@/features/bettertolive/models/workspace"

export const memoryMockData = {
  nodes: [
    {
      id: "memory-node-1",
      period: "学生时期",
      title: "把表现和价值绑在一起",
      summary: "那时你很习惯通过结果证明自己，稳定感大多来自外部反馈。",
      impact: "现在一忙起来，还是会下意识先想证明自己配得上被认可。",
      tags: ["成绩", "评价", "确定感"],
    },
    {
      id: "memory-node-2",
      period: "刚开始独立生活",
      title: "第一次认真感到自由也有代价",
      summary: "自由不是完全随心，而是需要你自己兜住节奏、钱和情绪。",
      impact: "后来你对稳定居住和可持续收入变得更在意。",
      tags: ["租房", "现金流", "生活结构"],
    },
    {
      id: "memory-node-3",
      period: "关系转折期",
      title: "意识到被理解比热闹更稀缺",
      summary: "不是所有陪伴都能带来安全感，能认真说话的人反而很少。",
      impact: "你开始重新定义亲密、信任和需要维系的关系。",
      tags: ["关系", "理解感", "边界"],
    },
    {
      id: "memory-node-4",
      period: "现在",
      title: "开始主动整理自己的人生材料",
      summary: "你不再只记录事情，而开始想把情绪、关系、记忆和未来放在一起看。",
      impact: "这会慢慢把你从被动反应带向主动选择。",
      tags: ["整理", "复盘", "主动性"],
    },
  ],
  anchors: [
    {
      id: "memory-anchor-1",
      type: "地点",
      label: "第一个真正自己住过的房间",
      note: "它让你第一次同时感到自由、安静和现实成本。",
    },
    {
      id: "memory-anchor-2",
      type: "物件",
      label: "总舍不得扔的旧本子",
      note: "里面不是漂亮答案，而是当时那个自己留下来的痕迹。",
    },
    {
      id: "memory-anchor-3",
      type: "照片",
      label: "一张状态还很轻的合照",
      note: "它总会提醒你，后来很多沉重并不是天生就有的。",
    },
  ],
  reviewPrompts: [
    "如果重新看那段时期，你最想先理解的不是发生了什么，而是当时的你为什么会那样反应。",
    "哪些记忆不是因为重大才留下，而是因为一直没有被安放好。",
    "现在的你最想对过去哪个阶段的自己说一句什么话。",
  ],
} satisfies MemoryWorkspaceModuleData
