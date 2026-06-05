import type { TFunction } from "i18next"

import type { AppView } from "@/features/bettertolive/types"

export type WorkspaceRhythmSlide = {
  id: string
  title: string
  body: string
}

export type WorkspaceSidebarNote = {
  heading: string
  lines: Array<{
    label: string
    text: string
  }>
}

export function createWorkspaceRhythmSlides(t: TFunction): WorkspaceRhythmSlide[] {
  return [
    {
      id: "capture",
      title: t("shell.rhythm.capture.title"),
      body: t("shell.rhythm.capture.body"),
    },
    {
      id: "review",
      title: t("shell.rhythm.review.title"),
      body: t("shell.rhythm.review.body"),
    },
    {
      id: "future",
      title: t("shell.rhythm.future.title"),
      body: t("shell.rhythm.future.body"),
    },
  ]
}

function createSidebarNote(
  t: TFunction,
  key: AppView,
  lineKeys: [string, string, string],
): WorkspaceSidebarNote {
  return {
    heading: t(`shell.sidebarNotes.${key}.heading`),
    lines: lineKeys.map((lineKey) => ({
      label: t(`shell.sidebarNotes.${key}.lines.${lineKey}.label`),
      text: t(`shell.sidebarNotes.${key}.lines.${lineKey}.text`),
    })),
  }
}

export function createWorkspaceSidebarNotes(t: TFunction): Record<AppView, WorkspaceSidebarNote> {
  return {
    overview: createSidebarNote(t, "overview", ["look", "fit", "purpose"]),
    reflection: createSidebarNote(t, "reflection", ["write", "fit", "purpose"]),
    events: createSidebarNote(t, "events", ["record", "fit", "purpose"]),
    finance: createSidebarNote(t, "finance", ["record", "fit", "purpose"]),
    shopping: createSidebarNote(t, "shopping", ["record", "fit", "purpose"]),
    nutrition: createSidebarNote(t, "nutrition", ["record", "fit", "purpose"]),
    emotion: createSidebarNote(t, "emotion", ["observe", "fit", "purpose"]),
    beliefs: createSidebarNote(t, "beliefs", ["organize", "fit", "purpose"]),
    principles: createSidebarNote(t, "principles", ["clarify", "fit", "purpose"]),
    relationships: createSidebarNote(t, "relationships", ["see", "fit", "purpose"]),
    journey: createSidebarNote(t, "journey", ["trace", "fit", "purpose"]),
    legacy: createSidebarNote(t, "legacy", ["place", "fit", "purpose"]),
    socioeconomics: createSidebarNote(t, "socioeconomics", ["sort", "fit", "purpose"]),
    future: createSidebarNote(t, "future", ["draw", "fit", "purpose"]),
  }
}
