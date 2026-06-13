export type BetterToLiveApiMode = "mock" | "live"

const DEFAULT_API_MODE: BetterToLiveApiMode = "live"

/// 解析 API 模式：默认 live (直连 Tauri 后端)。
/// mock 模式仅由环境变量 VITE_BETTERTOLIVE_API_MODE=mock 显式触发，用于浏览器调试样式。
/// 桌面应用不再自动检测 __TAURI_INTERNALS__ 降级。
export function resolveBetterToLiveApiMode(): BetterToLiveApiMode {
  const mode = String(import.meta.env.VITE_BETTERTOLIVE_API_MODE ?? "")

  if (mode === "live" || mode === "mock") {
    return mode
  }

  return DEFAULT_API_MODE
}
