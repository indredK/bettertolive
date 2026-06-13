import { useQuery } from "@tanstack/react-query"

import { getBetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { resolveBetterToLiveApiMode } from "@/features/bettertolive/api/config"
import { emptyWorldHistoryModule } from "@/features/bettertolive/api/fallback/empty-worldhistory-module"
import { workspaceQueryKeys } from "@/features/bettertolive/queries/workspace-query-keys"
import { WORLD_HISTORY_SEED } from "@/features/bettertolive/ui/worldhistory/world-history-data"

export function useWorldHistoryQuery() {
  const apiMode = resolveBetterToLiveApiMode()
  const fallback = apiMode === "mock" ? WORLD_HISTORY_SEED : emptyWorldHistoryModule

  const query = useQuery({
    queryKey: [...workspaceQueryKeys.worldHistory(), apiMode],
    queryFn: () => getBetterToLiveApi().getWorldHistory(),
    initialData: apiMode === "mock" ? WORLD_HISTORY_SEED : undefined,
    staleTime: 1000 * 60 * 5,
  })

  return {
    data: query.data ?? fallback,
    error: query.error,
    isError: query.isError,
    isFetching: query.isFetching,
    isLoading: query.isLoading,
    refetch: query.refetch,
    status: query.status,
  }
}
