import type { AppView } from "@/features/bettertolive/types"

export const workspaceViewLabels: Record<AppView, string> = {
  overview: "总览",
  reflection: "反思",
  events: "记事",
  finance: "记账",
  shopping: "生活物品",
  nutrition: "饮食",
  emotion: "情绪情感",
  beliefs: "观念",
  principles: "原则与底线",
  relationships: "关系深化",
  journey: "成长记忆",
  legacy: "生命整理",
  socioeconomics: "社会经济",
  future: "未来蓝图",
}

export function getWorkspaceViewLabel(view: AppView) {
  return workspaceViewLabels[view]
}
