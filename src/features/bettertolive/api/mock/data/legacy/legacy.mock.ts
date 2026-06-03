import type { LegacyWorkspaceModuleData } from "@/features/bettertolive/models/workspace"

export const legacyMockData = {
  directives: [
    {
      id: "legacy-directive-1",
      title: "重要联系人与通知顺序",
      detail: "先通知最亲近的人，再由熟悉情况的人决定哪些关系需要继续同步。",
    },
    {
      id: "legacy-directive-2",
      title: "重要资料线索",
      detail: "账号、文档、项目和重要物品不要只放在脑子里，要让别人知道去哪里找。",
    },
    {
      id: "legacy-directive-3",
      title: "希望被理解的事",
      detail: "有些决定不是冲动，而是长期权衡后的选择，希望后来的人不要只看表面结果。",
    },
  ],
  letters: [
    {
      id: "legacy-letter-1",
      to: "家人",
      theme: "感谢与解释",
      excerpt: "想留下的不是标准答案，而是希望你们知道，我是真的在努力把自己活明白。",
    },
    {
      id: "legacy-letter-2",
      to: "重要朋友",
      theme: "告别与祝福",
      excerpt: "谢谢你们在很多混乱时刻让我知道，世界上确实有人能认真听懂我在说什么。",
    },
    {
      id: "legacy-letter-3",
      to: "未来的自己",
      theme: "提醒",
      excerpt: "别等到失去余地才想起生活真正想要的是什么，很多话现在就可以先说。",
    },
  ],
  wishes: [
    {
      id: "legacy-wish-1",
      title: "还想修复的一段关系",
      detail: "不是为了回到从前，而是希望误解不要一直悬着。",
    },
    {
      id: "legacy-wish-2",
      title: "还想完成的一件作品",
      detail: "哪怕最后不是完整版本，也想把那个真正想表达的东西留出来。",
    },
    {
      id: "legacy-wish-3",
      title: "还想再去一次的地方",
      detail: "不是旅游清单，而是想确认那种生活感到底还在不在。",
    },
  ],
  preferences: [
    {
      id: "legacy-preference-1",
      label: "纪念方式",
      note: "更希望安静、真诚，不希望被过度解读或表演化。",
    },
    {
      id: "legacy-preference-2",
      label: "物品去向",
      note: "真正有情感重量的东西，宁可少而准地留给懂它的人。",
    },
    {
      id: "legacy-preference-3",
      label: "文字保留",
      note: "想留下的话可以分对象保存，不必强行写成一份完整正式文件。",
    },
  ],
  lifeReview: [
    "真正重要的从来不是看起来多厉害，而是有没有活得更真实一点。",
    "被理解、能自主安排时间、能照顾好身体和关系，这些比外部定义更珍贵。",
    "如果要被记住，希望是那个认真活过、也认真面对自己的人。",
  ],
} satisfies LegacyWorkspaceModuleData
