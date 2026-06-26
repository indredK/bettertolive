import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { getBetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { workspaceQueryKeys } from "@/features/bettertolive/queries/workspace-query-keys"
import type { GrowthModuleData, MemoryWorkspaceModuleData } from "@/features/bettertolive/types"

export type SaveJourneyPayload = {
  growth: GrowthModuleData
  memory: MemoryWorkspaceModuleData
}

export function useSaveJourneyMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: async ({ growth, memory }: SaveJourneyPayload) => {
      await getBetterToLiveApi().saveJourney({ growth, memory })
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.snapshot() }),
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.journey() }),
      ])
    },
    onError: (error) => {
      toast.error(t("common.toast.saveFailed"), { description: String(error) })
    },
  })
}
