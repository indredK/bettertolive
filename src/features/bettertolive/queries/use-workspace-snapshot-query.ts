import { useQuery } from "@tanstack/react-query"

import { getBetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { resolveBetterToLiveApiMode } from "@/features/bettertolive/api/config"
import { emptyWorkspaceSnapshot } from "@/features/bettertolive/api/fallback/empty-workspace-snapshot"
import { workspaceSnapshotMockData } from "@/features/bettertolive/api/mock/data/workspace-snapshot.mock"
import { workspaceQueryKeys } from "@/features/bettertolive/queries/workspace-query-keys"

export function useWorkspaceSnapshotQuery() {
  const apiMode = resolveBetterToLiveApiMode()
  const fallbackSnapshot = apiMode === "mock" ? workspaceSnapshotMockData : emptyWorkspaceSnapshot

  const query = useQuery({
    queryKey: [...workspaceQueryKeys.snapshot(), apiMode],
    queryFn: () => getBetterToLiveApi().getWorkspaceSnapshot(),
    initialData: apiMode === "mock" ? workspaceSnapshotMockData : undefined,
    staleTime: 1000 * 60 * 5,
  })

  return {
    data: query.data,
    error: query.error,
    isError: query.isError,
    isFetched: query.isFetched,
    isFetching: query.isFetching,
    isLoading: query.isLoading,
    refetch: query.refetch,
    status: query.status,
    workspaceSnapshot: query.data ?? fallbackSnapshot,
  }
}
