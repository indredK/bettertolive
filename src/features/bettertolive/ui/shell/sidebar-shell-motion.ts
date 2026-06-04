import type { Transition } from "motion/react"

const SIDEBAR_EXPANDED_WIDTH = 292
const SIDEBAR_COLLAPSED_WIDTH = 92
const SIDEBAR_TRANSITION_MS = 260
const SIDEBAR_CONTENT_EASE = [0.22, 1, 0.36, 1] as const
const SIDEBAR_BRAND_ICON_SIZE = 40

const SIDEBAR_EXPANDED_PADDING = {
  x: 20,
  y: 20,
} as const

const SIDEBAR_COLLAPSED_PADDING = {
  x: 12,
  y: 16,
} as const

const SIDEBAR_EXPANDED_CONTENT_WIDTH = SIDEBAR_EXPANDED_WIDTH - SIDEBAR_EXPANDED_PADDING.x * 2
const SIDEBAR_COLLAPSED_BRAND_ICON_OFFSET =
  (SIDEBAR_COLLAPSED_WIDTH - SIDEBAR_BRAND_ICON_SIZE) / 2 - SIDEBAR_COLLAPSED_PADDING.x

export function getSidebarWidth(isCollapsed: boolean) {
  return isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH
}

export function getSidebarPadding(isCollapsed: boolean) {
  return isCollapsed ? SIDEBAR_COLLAPSED_PADDING : SIDEBAR_EXPANDED_PADDING
}

export function getSidebarTransitionStyle(reduceMotion: boolean) {
  if (reduceMotion) {
    return "width 120ms ease-out, min-width 120ms ease-out, max-width 120ms ease-out, padding 120ms ease-out"
  }

  return `width ${SIDEBAR_TRANSITION_MS}ms ease-in-out, min-width ${SIDEBAR_TRANSITION_MS}ms ease-in-out, max-width ${SIDEBAR_TRANSITION_MS}ms ease-in-out, padding ${SIDEBAR_TRANSITION_MS}ms ease-in-out`
}

export function getSidebarHeaderTransition(reduceMotion: boolean): Transition {
  if (reduceMotion) {
    return { duration: 0.12 }
  }

  return {
    duration: 0.24,
    ease: SIDEBAR_CONTENT_EASE,
  }
}

export function getSidebarNoteContentTransition(reduceMotion: boolean): Transition {
  if (reduceMotion) {
    return { duration: 0.12 }
  }

  return {
    duration: 0.22,
    delay: 0.08,
    ease: SIDEBAR_CONTENT_EASE,
  }
}

export function getSidebarBrandIconOffset(isCollapsed: boolean) {
  return isCollapsed ? SIDEBAR_COLLAPSED_BRAND_ICON_OFFSET : 0
}

export const SIDEBAR_EXPANDED_CONTENT_FRAME_WIDTH = SIDEBAR_EXPANDED_CONTENT_WIDTH
