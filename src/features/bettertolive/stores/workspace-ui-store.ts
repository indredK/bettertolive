import { create } from "zustand"

import type { AppView } from "@/features/bettertolive/models/workspace"
import { readWorkspaceViewFromLocation } from "@/features/bettertolive/config/workspace-view-route"

const WORKSPACE_UI_STORAGE_KEY = "bettertolive.workspace-ui"

type WorkspaceUiState = {
  activeView: AppView
  isSidebarCollapsed: boolean
  isCompactSidebarExpanded: boolean
  searchQuery: string
  isShoppingManagementMode: boolean
  setActiveView: (view: AppView) => void
  toggleSidebarCollapsed: () => void
  setSidebarCollapsed: (isCollapsed: boolean) => void
  toggleCompactSidebarExpanded: () => void
  setCompactSidebarExpanded: (isExpanded: boolean) => void
  setSearchQuery: (searchQuery: string) => void
  toggleShoppingManagementMode: () => void
}

type PersistedWorkspaceUiState = Pick<
  WorkspaceUiState,
  "isCompactSidebarExpanded" | "isSidebarCollapsed"
>

const defaultWorkspaceUiState = {
  activeView: "overview" as AppView,
  isSidebarCollapsed: false,
  isCompactSidebarExpanded: false,
  searchQuery: "",
  isShoppingManagementMode: false,
}

function readPersistedWorkspaceUiState(): PersistedWorkspaceUiState {
  if (typeof window === "undefined") {
    return {
      isSidebarCollapsed: defaultWorkspaceUiState.isSidebarCollapsed,
      isCompactSidebarExpanded: defaultWorkspaceUiState.isCompactSidebarExpanded,
    }
  }

  const rawState = window.sessionStorage.getItem(WORKSPACE_UI_STORAGE_KEY)

  if (!rawState) {
    return {
      isSidebarCollapsed: defaultWorkspaceUiState.isSidebarCollapsed,
      isCompactSidebarExpanded: defaultWorkspaceUiState.isCompactSidebarExpanded,
    }
  }

  try {
    const parsedState = JSON.parse(rawState) as Partial<PersistedWorkspaceUiState>

    return {
      isSidebarCollapsed:
        typeof parsedState.isSidebarCollapsed === "boolean"
          ? parsedState.isSidebarCollapsed
          : defaultWorkspaceUiState.isSidebarCollapsed,
      isCompactSidebarExpanded:
        typeof parsedState.isCompactSidebarExpanded === "boolean"
          ? parsedState.isCompactSidebarExpanded
          : defaultWorkspaceUiState.isCompactSidebarExpanded,
    }
  } catch {
    return {
      isSidebarCollapsed: defaultWorkspaceUiState.isSidebarCollapsed,
      isCompactSidebarExpanded: defaultWorkspaceUiState.isCompactSidebarExpanded,
    }
  }
}

function persistWorkspaceUiState(state: PersistedWorkspaceUiState) {
  if (typeof window === "undefined") {
    return
  }

  window.sessionStorage.setItem(WORKSPACE_UI_STORAGE_KEY, JSON.stringify(state))
}

function clearPersistedWorkspaceUiState() {
  if (typeof window === "undefined") {
    return
  }

  window.sessionStorage.removeItem(WORKSPACE_UI_STORAGE_KEY)
}

function createInitialWorkspaceUiState() {
  return {
    ...defaultWorkspaceUiState,
    activeView: readWorkspaceViewFromLocation(),
    ...readPersistedWorkspaceUiState(),
  }
}

export const useWorkspaceUiStore = create<WorkspaceUiState>((set) => ({
  ...createInitialWorkspaceUiState(),
  setActiveView: (activeView) =>
    set((state) => (state.activeView === activeView ? state : { activeView })),
  toggleSidebarCollapsed: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
  setSidebarCollapsed: (isSidebarCollapsed) => set({ isSidebarCollapsed }),
  toggleCompactSidebarExpanded: () =>
    set((state) => ({
      isCompactSidebarExpanded: !state.isCompactSidebarExpanded,
    })),
  setCompactSidebarExpanded: (isCompactSidebarExpanded) => set({ isCompactSidebarExpanded }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  toggleShoppingManagementMode: () =>
    set((state) => ({ isShoppingManagementMode: !state.isShoppingManagementMode })),
}))

useWorkspaceUiStore.subscribe((state) => {
  persistWorkspaceUiState({
    isSidebarCollapsed: state.isSidebarCollapsed,
    isCompactSidebarExpanded: state.isCompactSidebarExpanded,
  })
})

export function resetWorkspaceUiStore(
  options: {
    clearSession?: boolean
    restorePersistedState?: boolean
  } = {},
) {
  const { clearSession = true, restorePersistedState = false } = options

  if (clearSession) {
    clearPersistedWorkspaceUiState()
  }

  useWorkspaceUiStore.setState({
    ...defaultWorkspaceUiState,
    activeView: readWorkspaceViewFromLocation(),
    ...(restorePersistedState ? readPersistedWorkspaceUiState() : {}),
  })
}
