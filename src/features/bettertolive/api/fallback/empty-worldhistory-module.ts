import type { WorldHistoryModuleData } from "@/features/bettertolive/models/workspace"

// 世界历史模块的空兜底数据（live 模式下数据加载失败时使用）。
export const emptyWorldHistoryModule: WorldHistoryModuleData = {
  civilizations: [],
  causalNodes: [],
  causalLinks: [],
  timelineEvents: [],
  comparisonPresets: [],
}
