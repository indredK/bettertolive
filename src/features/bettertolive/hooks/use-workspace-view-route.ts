import { useEffect } from "react"

import { useWorkspaceUiStore } from "@/features/bettertolive/stores/workspace-ui-store"
import {
  getWorkspaceViewFromHash,
  syncWorkspaceViewHash,
} from "@/features/bettertolive/workspace-view-route"

export function useWorkspaceViewRoute() {
  const activeView = useWorkspaceUiStore((state) => state.activeView)
  const setActiveView = useWorkspaceUiStore((state) => state.setActiveView)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const syncViewFromHash = () => {
      const routedView = getWorkspaceViewFromHash(window.location.hash)

      if (routedView === null) {
        syncWorkspaceViewHash(useWorkspaceUiStore.getState().activeView, "replace")
        return
      }

      if (useWorkspaceUiStore.getState().activeView !== routedView) {
        setActiveView(routedView)
      }
    }

    if (getWorkspaceViewFromHash(window.location.hash) === null) {
      syncWorkspaceViewHash(useWorkspaceUiStore.getState().activeView, "replace")
    }

    window.addEventListener("hashchange", syncViewFromHash)

    return () => {
      window.removeEventListener("hashchange", syncViewFromHash)
    }
  }, [setActiveView])

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const routedView = getWorkspaceViewFromHash(window.location.hash)

    if (routedView !== activeView) {
      syncWorkspaceViewHash(activeView)
    }
  }, [activeView])
}
