import type { ReactNode } from "react"
import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { getBetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import type { BetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { emptyWorkspaceSnapshot } from "@/features/bettertolive/api/fallback/empty-workspace-snapshot"
import type { WorkspaceSnapshot } from "@/features/bettertolive/models/workspace"
import { useWorkspaceSnapshotQuery } from "@/features/bettertolive/queries/use-workspace-snapshot-query"

const getWorkspaceSnapshotMock = vi.fn()

vi.mock("@/features/bettertolive/api/bettertolive-api", () => ({
  getBetterToLiveApi: vi.fn(),
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
  })

  it("keeps the workspace empty while the snapshot request is still loading", () => {
    getWorkspaceSnapshotMock.mockReturnValue(new Promise<WorkspaceSnapshot>(() => {}))

    const { result } = renderHook(() => useWorkspaceSnapshotQuery(), {
      wrapper: createWrapper(),
    })

    expect(result.current.isLoading).toBe(true)
    expect(result.current.workspaceSnapshot).toEqual(emptyWorkspaceSnapshot)
  })

  it("uses the empty fallback when the workspace request fails", async () => {
    getWorkspaceSnapshotMock.mockRejectedValue(new Error("snapshot failed"))

    const { result } = renderHook(() => useWorkspaceSnapshotQuery(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(result.current.workspaceSnapshot).toEqual(emptyWorkspaceSnapshot)
  })
})
