import { useMutation, useQueryClient } from "@tanstack/react-query"

import { getBetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { workspaceQueryKeys } from "@/features/bettertolive/queries/workspace-query-keys"
import type { EventsModuleData } from "@/features/bettertolive/types"

export function useSaveEventsMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (events: EventsModuleData) => getBetterToLiveApi().saveEvents(events),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.snapshot() }),
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.events() }),
      ])
    },
  })
}
