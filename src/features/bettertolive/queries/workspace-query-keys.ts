export const workspaceQueryKeys = {
  all: ["bettertolive"] as const,
  snapshot: () => [...workspaceQueryKeys.all, "snapshot"] as const,
  overview: () => [...workspaceQueryKeys.all, "overview"] as const,
  reflection: () => [...workspaceQueryKeys.all, "reflection"] as const,
  events: () => [...workspaceQueryKeys.all, "events"] as const,
  finance: () => [...workspaceQueryKeys.all, "finance"] as const,
  shopping: () => [...workspaceQueryKeys.all, "shopping"] as const,
  beliefs: () => [...workspaceQueryKeys.all, "beliefs"] as const,
  principles: () => [...workspaceQueryKeys.all, "principles"] as const,
  relationships: () => [...workspaceQueryKeys.all, "relationships"] as const,
  growth: () => [...workspaceQueryKeys.all, "growth"] as const,
  future: () => [...workspaceQueryKeys.all, "future"] as const,
} as const
