import { useMutation, useQueryClient } from "@tanstack/react-query"

import { getBetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { workspaceQueryKeys } from "@/features/bettertolive/queries/workspace-query-keys"
import type { FinanceModuleData } from "@/features/bettertolive/types"

export function useSaveFinanceMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (finance: FinanceModuleData) => getBetterToLiveApi().saveFinance(finance),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.snapshot() }),
        queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.finance() }),
      ])
    },
  })
}
