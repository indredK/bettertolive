import { useMutation, useQueryClient } from "@tanstack/react-query"

import { getBetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { workspaceQueryKeys } from "@/features/bettertolive/queries/workspace-query-keys"
import type { WorldHistoryModuleData } from "@/features/bettertolive/types"

export function useSaveWorldHistoryMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (worldHistory: WorldHistoryModuleData) =>
      getBetterToLiveApi().saveWorldHistory(worldHistory),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.worldHistory() })
    },
  })
}
