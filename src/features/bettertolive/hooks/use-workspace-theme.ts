import { type CSSProperties, useEffect, useMemo, useState } from "react"

import {
  workspaceThemes,
  workspaceThemesById,
  type WorkspaceTheme,
  type WorkspaceThemeId,
} from "@/features/bettertolive/theme-presets"

const STORAGE_KEY = "bettertolive.theme"
const DEFAULT_THEME_ID: WorkspaceThemeId = "morning"

function isThemeId(value: string | null): value is WorkspaceThemeId {
  return value !== null && value in workspaceThemesById
}

function readStoredTheme(): WorkspaceThemeId {
  if (typeof window === "undefined") {
    return DEFAULT_THEME_ID
  }

  const storedTheme = window.localStorage.getItem(STORAGE_KEY)
  return isThemeId(storedTheme) ? storedTheme : DEFAULT_THEME_ID
}

export function useWorkspaceTheme() {
  const [themeId, setThemeId] = useState<WorkspaceThemeId>(readStoredTheme)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    window.localStorage.setItem(STORAGE_KEY, themeId)
  }, [themeId])

  const theme: WorkspaceTheme = workspaceThemesById[themeId]

  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }

    const root = document.documentElement

    root.dataset.theme = theme.id

    for (const [property, value] of Object.entries(theme.vars)) {
      root.style.setProperty(property, value)
    }
  }, [theme])

  const themeStyle = useMemo(
    (): CSSProperties => ({
      ...theme.vars,
      background: "var(--app-bg)",
      color: "var(--text-primary)",
    }),
    [theme],
  )

  return {
    theme,
    themeId,
    themes: workspaceThemes,
    setThemeId,
    themeStyle,
  }
}
