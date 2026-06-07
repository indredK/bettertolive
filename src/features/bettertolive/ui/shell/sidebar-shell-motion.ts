import type { Transition } from "motion/react"

const SIDEBAR_EXPANDED_WIDTH = 292
const SIDEBAR_COLLAPSED_WIDTH = 92
const SIDEBAR_TRANSITION_MS = 280
const SIDEBAR_COLLAPSE_DELAY_MS = 340
const SIDEBAR_CONTENT_EASE = [0.22, 1, 0.36, 1] as const

const SIDEBAR_EXPANDED_PADDING = {
  x: 18,
  y: 20,
} as const

const SIDEBAR_COLLAPSED_PADDING = {
  x: 18,
  y: 20,
} as const

const SIDEBAR_EXPANDED_CONTENT_WIDTH = SIDEBAR_EXPANDED_WIDTH - SIDEBAR_EXPANDED_PADDING.x * 2

export function getSidebarWidth(isCollapsed: boolean) {
  return isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH
}

export function getSidebarPadding(isCollapsed: boolean) {
  return isCollapsed ? SIDEBAR_COLLAPSED_PADDING : SIDEBAR_EXPANDED_PADDING
}

export function getSidebarTransitionStyle(reduceMotion: boolean, isCollapsed: boolean) {
  if (reduceMotion) {
    return "width 120ms ease-out, min-width 120ms ease-out, max-width 120ms ease-out, padding 120ms ease-out"
  }

  const delay = isCollapsed ? `${SIDEBAR_COLLAPSE_DELAY_MS}ms` : "0ms"

  return `width ${SIDEBAR_TRANSITION_MS}ms ease-in-out ${delay}, min-width ${SIDEBAR_TRANSITION_MS}ms ease-in-out ${delay}, max-width ${SIDEBAR_TRANSITION_MS}ms ease-in-out ${delay}, padding ${SIDEBAR_TRANSITION_MS}ms ease-in-out ${delay}`
}

export function getSidebarHeaderTransition(
  reduceMotion: boolean,
  isCollapsed: boolean,
): Transition {
  if (reduceMotion) {
    return { duration: 0.12 }
  }

  return {
    duration: 0.24,
    delay: isCollapsed ? 0 : 0.24,
    ease: SIDEBAR_CONTENT_EASE,
  }
}

export function getSidebarNoteContentTransition(reduceMotion: boolean): Transition {
  if (reduceMotion) {
    return { duration: 0.12 }
  }

  return {
    duration: 0.22,
    delay: 0.24,
    ease: SIDEBAR_CONTENT_EASE,
  }
}

export const SIDEBAR_EXPANDED_CONTENT_FRAME_WIDTH = SIDEBAR_EXPANDED_CONTENT_WIDTH
