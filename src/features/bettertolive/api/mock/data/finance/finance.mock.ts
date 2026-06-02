import type { FinanceModuleData } from "@/features/bettertolive/models/workspace"

export const financeMockData = {
  entries: [
    {
      id: "transaction-1",
      date: "06-02",
      label: "午饭",
      category: "餐饮",
      amount: 26,
      direction: "expense",
      note: "今天的钱花在补状态上。",
    },
    {
      id: "transaction-2",
      date: "06-02",
      label: "咖啡",
      category: "社交",
      amount: 18,
      direction: "expense",
      note: "见人和聊天会让我重新有流动感。",
    },
    {
      id: "transaction-3",
      date: "06-01",
      label: "书",
      category: "学习",
      amount: 52,
      direction: "expense",
      note: "最近愿意给长期输入花钱。",
    },
    {
      id: "transaction-4",
      date: "05-30",
      label: "项目结算",
      category: "收入",
      amount: 4800,
      direction: "income",
      note: "自由度和现金流是接下来必须同时面对的现实。",
    },
  ],
} satisfies FinanceModuleData
