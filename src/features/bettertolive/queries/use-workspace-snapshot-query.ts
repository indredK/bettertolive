import { useQuery } from "@tanstack/react-query"

import { getBetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { emptyWorkspaceSnapshot } from "@/features/bettertolive/api/fallback/empty-workspace-snapshot"
import { workspaceQueryKeys } from "@/features/bettertolive/queries/workspace-query-keys"

export function useWorkspaceSnapshotQuery() {
  const query = useQuery({
    queryKey: workspaceQueryKeys.snapshot(),
    queryFn: () => getBetterToLiveApi().getWorkspaceSnapshot(),
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
    workspaceSnapshot: query.data ?? emptyWorkspaceSnapshot,
  }
}
