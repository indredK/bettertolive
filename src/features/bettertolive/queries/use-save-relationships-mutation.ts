import { useMutation, useQueryClient } from "@tanstack/react-query"

import { getBetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { workspaceQueryKeys } from "@/features/bettertolive/queries/workspace-query-keys"
import type { RelationshipsModuleData } from "@/features/bettertolive/types"

export function useSaveRelationshipsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (relationships: RelationshipsModuleData) =>
      getBetterToLiveApi().saveRelationships(relationships),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.snapshot() }),
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.relationships() }),
      ])
    },
  })
}
