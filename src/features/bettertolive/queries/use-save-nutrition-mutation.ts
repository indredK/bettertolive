import { useMutation, useQueryClient } from "@tanstack/react-query"

import { getBetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import type { NutritionModuleData } from "@/features/bettertolive/types"
import { workspaceQueryKeys } from "@/features/bettertolive/queries/workspace-query-keys"

export function useSaveNutritionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (nutrition: NutritionModuleData) => getBetterToLiveApi().saveNutrition(nutrition),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.snapshot() }),
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.nutrition() }),
      ])
    },
  })
}
