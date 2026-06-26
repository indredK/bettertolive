import type { ReactNode } from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getBetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import type { BetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { resolveBetterToLiveApiMode } from "@/features/bettertolive/api/config"
import { emptyWorkspaceSnapshot } from "@/features/bettertolive/api/fallback/empty-workspace-snapshot"
import { workspaceSnapshotMockData } from "@/features/bettertolive/api/mock/data/workspace-snapshot.mock"
import type { WorkspaceSnapshot } from "@/features/bettertolive/models/workspace"
import { useWorkspaceSnapshotQuery } from "@/features/bettertolive/queries/use-workspace-snapshot-query"

const getWorkspaceSnapshotMock = vi.fn()

vi.mock("@/features/bettertolive/api/bettertolive-api", () => ({
  getBetterToLiveApi: vi.fn(),
}))

vi.mock("@/features/bettertolive/api/config", () => ({
  resolveBetterToLiveApiMode: vi.fn(),
}))

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe("useWorkspaceSnapshotQuery", () => {
  beforeEach(() => {
    vi.mocked(getBetterToLiveApi).mockReturnValue({
      getWorkspaceSnapshot: getWorkspaceSnapshotMock,
    } as unknown as BetterToLiveApi)
  })

  afterEach(() => {
    getWorkspaceSnapshotMock.mockReset()
    vi.mocked(getBetterToLiveApi).mockReset()
    vi.mocked(resolveBetterToLiveApiMode).mockReset()
  })

  it("keeps the live workspace empty while the snapshot request is still loading", () => {
    vi.mocked(resolveBetterToLiveApiMode).mockReturnValue("live")
    getWorkspaceSnapshotMock.mockReturnValue(new Promise<WorkspaceSnapshot>(() => {}))

    const { result } = renderHook(() => useWorkspaceSnapshotQuery(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.workspaceSnapshot).toEqual(emptyWorkspaceSnapshot)
  })

  it("falls back to the local mock snapshot when the live workspace request fails", async () => {
    vi.mocked(resolveBetterToLiveApiMode).mockReturnValue("live")
    getWorkspaceSnapshotMock.mockRejectedValue(new Error("snapshot failed"))

    const { result } = renderHook(() => useWorkspaceSnapshotQuery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.workspaceSnapshot).toEqual(workspaceSnapshotMockData)
    expect(result.current.workspaceSnapshot.nutrition.mealLogs.length).toBeGreaterThan(0)
  })
})
