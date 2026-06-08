import { useMutation, useQueryClient } from "@tanstack/react-query"

import { getBetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { workspaceQueryKeys } from "@/features/bettertolive/queries/workspace-query-keys"
import type { ReflectionModuleData } from "@/features/bettertolive/types"

export function useSaveReflectionMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (reflection: ReflectionModuleData) =>
      getBetterToLiveApi().saveReflection(reflection),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.snapshot() }),
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.reflection() }),
      ])
    },
  })
}
