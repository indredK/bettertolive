import i18next from "@/i18n/config"
import type { AppView } from "@/features/bettertolive/types"

export function getWorkspaceViewLabel(view: AppView) {
  return i18next.t(`shell.views.${view}`)
}
