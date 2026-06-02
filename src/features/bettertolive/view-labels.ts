import type { AppView } from "@/features/bettertolive/types"

export const workspaceViewLabels: Record<AppView, string> = {
  overview: "总览",
  reflection: "反思",
  events: "记事",
  finance: "记账",
  shopping: "购物清单",
  emotion: "情绪情感",
  crisis: "危机支持",
  beliefs: "观念",
  principles: "原则与底线",
  relationships: "关系深化",
  growth: "成长环境",
  memory: "记忆节点",
  legacy: "生命整理",
  future: "未来蓝图",
}

export function getWorkspaceViewLabel(view: AppView) {
  return workspaceViewLabels[view]
}
