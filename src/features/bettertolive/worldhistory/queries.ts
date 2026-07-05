import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { getBetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { emptyWorldHistoryModule } from "@/features/bettertolive/api/fallback/empty-worldhistory-module"
import { workspaceQueryKeys } from "@/features/bettertolive/queries/workspace-query-keys"
import type { WorldHistoryModuleData } from "@/features/bettertolive/types"

export function useSaveWorldHistoryMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (worldHistory: WorldHistoryModuleData) =>
      getBetterToLiveApi().saveWorldHistory(worldHistory),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.snapshot() }),
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.worldHistory() }),
      ])
    },
    onError: (error) => {
      toast.error(t("common.toast.saveFailed"), { description: String(error) })
    },
  })
}

export function useWorldHistoryQuery() {
  const query = useQuery({
    queryKey: workspaceQueryKeys.worldHistory(),
    queryFn: () => getBetterToLiveApi().getWorldHistory(),
    staleTime: 1000 * 60 * 5,
  })

  return {
    data: query.data ?? emptyWorldHistoryModule,
    error: query.error,
    isError: query.isError,
    isFetching: query.isFetching,
    isLoading: query.isLoading,
    refetch: query.refetch,
    status: query.status,
  }
}
