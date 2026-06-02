import type { AppView } from "@/features/bettertolive/types"

export const workspaceViewLabels: Record<AppView, string> = {
  overview: "总览",
  reflection: "反思",
  events: "记事",
  finance: "记账",
  shopping: "购物清单",
  beliefs: "观念",
  principles: "原则与底线",
  relationships: "关系地图",
  growth: "成长环境",
  future: "未来蓝图",
}

export function getWorkspaceViewLabel(view: AppView) {
  return workspaceViewLabels[view]
}
