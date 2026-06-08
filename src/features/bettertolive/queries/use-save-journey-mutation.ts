import { useMutation, useQueryClient } from "@tanstack/react-query"

import { getBetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { workspaceQueryKeys } from "@/features/bettertolive/queries/workspace-query-keys"
import type { GrowthModuleData, MemoryWorkspaceModuleData } from "@/features/bettertolive/types"

export type SaveJourneyPayload = {
  growth: GrowthModuleData
  memory: MemoryWorkspaceModuleData
}

export function useSaveJourneyMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ growth, memory }: SaveJourneyPayload) => {
      await Promise.all([
        getBetterToLiveApi().saveGrowth(growth),
        getBetterToLiveApi().saveMemory(memory),
      ])
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.snapshot() }),
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.journey() }),
      ])
    },
  })
}
