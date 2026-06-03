import type { AppView } from "@/features/bettertolive/types"

export const DEFAULT_WORKSPACE_VIEW: AppView = "overview"

const WORKSPACE_VIEWS = [
  "overview",
  "reflection",
  "events",
  "finance",
  "shopping",
  "emotion",
  "crisis",
  "beliefs",
  "principles",
  "relationships",
  "growth",
  "memory",
  "legacy",
  "future",
] satisfies AppView[]

function isAppView(value: string): value is AppView {
  return WORKSPACE_VIEWS.includes(value as AppView)
}

export function getWorkspaceViewFromHash(hash: string): AppView | null {
  const normalizedHash = hash.replace(/^#\/?/, "").trim().toLowerCase()

  if (!normalizedHash) {
    return null
  }

  return isAppView(normalizedHash) ? normalizedHash : null
}

export function readWorkspaceViewFromLocation(): AppView {
  if (typeof window === "undefined") {
    return DEFAULT_WORKSPACE_VIEW
  }

  return getWorkspaceViewFromHash(window.location.hash) ?? DEFAULT_WORKSPACE_VIEW
}

export function syncWorkspaceViewHash(view: AppView, mode: "push" | "replace" = "push") {
  if (typeof window === "undefined") {
    return
  }

  const nextHash = `#/${view}`

  if (window.location.hash === nextHash) {
    return
  }

  if (mode === "replace") {
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}${window.location.search}${nextHash}`,
    )
    return
  }

  window.location.hash = nextHash
}
