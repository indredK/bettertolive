import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { getBetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { workspaceQueryKeys } from "@/features/bettertolive/queries/workspace-query-keys"
import type { EmotionWorkspaceModuleData } from "@/features/bettertolive/types"

export function useSaveEmotionMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (emotion: EmotionWorkspaceModuleData) => getBetterToLiveApi().saveEmotion(emotion),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.snapshot() }),
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.emotion() }),
      ])
    },
    onError: (error) => {
      toast.error(t("common.toast.saveFailed"), { description: String(error) })
    },
  })
}
