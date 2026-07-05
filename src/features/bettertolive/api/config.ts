/// 桌面应用始终直连 Tauri 后端，不再提供 mock 模式。
export function resolveIsLiveMode(): boolean {
  return true
}
