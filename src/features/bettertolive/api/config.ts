export type BetterToLiveApiMode = "mock" | "live"

const DEFAULT_API_MODE: BetterToLiveApiMode = "mock"

function hasTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window
}

export function resolveBetterToLiveApiMode(): BetterToLiveApiMode {
  const mode = String(import.meta.env.VITE_BETTERTOLIVE_API_MODE ?? "")

  if (mode === "live" || mode === "mock") {
    return mode
  }

  return hasTauriRuntime() ? "live" : DEFAULT_API_MODE
}
