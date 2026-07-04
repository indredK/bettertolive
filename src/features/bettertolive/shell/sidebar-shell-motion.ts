import type { Transition } from "motion/react"

const SIDEBAR_EXPANDED_WIDTH = 292
const SIDEBAR_COLLAPSED_WIDTH = 92

const SIDEBAR_EXPANDED_PADDING = {
  x: 18,
  y: 20,
} as const

const SIDEBAR_COLLAPSED_PADDING = {
  x: 18,
  y: 20,
} as const

const SIDEBAR_EXPANDED_CONTENT_WIDTH = SIDEBAR_EXPANDED_WIDTH - SIDEBAR_EXPANDED_PADDING.x * 2

export const SIDEBAR_EASE = [0.22, 1, 0.36, 1] as const

export const SIDEBAR_EXPAND_TRANSITION: Transition = {
  duration: 0.2,
  ease: SIDEBAR_EASE,
}

export const SIDEBAR_COLLAPSE_TRANSITION: Transition = {
  duration: 0.28,
  ease: SIDEBAR_EASE,
}

export const SIDEBAR_CAROUSEL_TRANSITION: Transition = {
  duration: 0.2,
  ease: SIDEBAR_EASE,
}

export function getSidebarWidth(isCollapsed: boolean) {
  return isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_EXPANDED_WIDTH
}

export function getSidebarPadding(isCollapsed: boolean) {
  return isCollapsed ? SIDEBAR_COLLAPSED_PADDING : SIDEBAR_EXPANDED_PADDING
}

export function getSidebarTransitionStyle() {
  return `width 0.28s ease-in-out, min-width 0.28s ease-in-out, max-width 0.28s ease-in-out, padding 0.28s ease-in-out`
}

export const SIDEBAR_EXPANDED_CONTENT_FRAME_WIDTH = SIDEBAR_EXPANDED_CONTENT_WIDTH
