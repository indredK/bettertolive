import { useMutation, useQueryClient } from "@tanstack/react-query"

import { getBetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { workspaceQueryKeys } from "@/features/bettertolive/queries/workspace-query-keys"
import type { SocioeconomicsModuleData } from "@/features/bettertolive/types"

export function useSaveSocioeconomicsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (socioeconomics: SocioeconomicsModuleData) =>
      getBetterToLiveApi().saveSocioeconomics(socioeconomics),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.snapshot() }),
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.socioeconomics() }),
      ])
    },
  })
}
