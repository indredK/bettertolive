import { useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { getBetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { workspaceQueryKeys } from "@/features/bettertolive/queries/workspace-query-keys"
import type { FutureModuleData } from "@/features/bettertolive/types"

export function useSaveFutureMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (future: FutureModuleData) => getBetterToLiveApi().saveFuture(future),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.snapshot() }),
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.future() }),
      ])
    },
    onError: (error) => {
      toast.error(t("common.toast.saveFailed"), { description: String(error) })
    },
  })
}
