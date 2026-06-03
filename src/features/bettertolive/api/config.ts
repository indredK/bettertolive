export type BetterToLiveApiMode = "mock" | "live"

const DEFAULT_API_MODE: BetterToLiveApiMode = "mock"

export function resolveBetterToLiveApiMode(): BetterToLiveApiMode {
  const mode = String(import.meta.env.VITE_BETTERTOLIVE_API_MODE ?? "")

  return mode === "live" ? "live" : DEFAULT_API_MODE
}

export function resolveBetterToLiveApiBaseUrl() {
  const baseUrl = String(import.meta.env.VITE_BETTERTOLIVE_API_BASE_URL ?? "").trim()

  return baseUrl ? baseUrl.replace(/\/$/, "") : "/api/bettertolive"
}
