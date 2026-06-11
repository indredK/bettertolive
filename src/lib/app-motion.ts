import type { TargetAndTransition, Transition } from "motion/react"

export type PresenceMotion = {
  initial: TargetAndTransition
  animate: TargetAndTransition
  exit: TargetAndTransition
}

const SIDEBAR_EASE = [0.22, 1, 0.36, 1] as const
const SIDEBAR_SOFT_EXIT_TRANSITION: Transition = {
  duration: 0.34,
  ease: SIDEBAR_EASE,
}

export const APP_LAYOUT_TRANSITION: Transition = {
  type: "spring",
  stiffness: 320,
  damping: 32,
  mass: 0.9,
}

export const APP_FADE_TRANSITION: Transition = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1],
}

export const ACTION_BUTTON_TRANSITION: Transition = {
  duration: 0.22,
  ease: [0.22, 1, 0.36, 1],
}

export const BUTTON_TAP_SCALE = 0.92

export const BUTTON_TAP_TRANSITION: Transition = {
  duration: 0.15,
  ease: [0.22, 1, 0.36, 1],
}

export const ACTION_BUTTON_PRESENCE: PresenceMotion = {
  initial: {
    opacity: 0,
    y: 8,
    rotateX: -18,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -8,
    rotateX: 14,
    scale: 0.98,
  },
}

export const SIDEBAR_LAYOUT_TRANSITION: Transition = {
  type: "spring",
  stiffness: 196,
  damping: 34,
  mass: 1.06,
}

export const SIDEBAR_FADE_TRANSITION: Transition = {
  duration: 0.26,
  ease: SIDEBAR_EASE,
}

export const SIDEBAR_COPY_PRESENCE: PresenceMotion = {
  initial: {
    opacity: 0,
    x: -6,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: -2,
    transition: SIDEBAR_SOFT_EXIT_TRANSITION,
  },
}

export const SIDEBAR_PANEL_PRESENCE: PresenceMotion = {
  initial: {
    opacity: 0,
    height: 0,
    y: -4,
  },
  animate: {
    opacity: 1,
    height: "auto",
    y: 0,
  },
  exit: {
    opacity: 0,
    height: 0,
    y: -2,
    transition: SIDEBAR_SOFT_EXIT_TRANSITION,
  },
}

export const SIDEBAR_HEADER_CONTENT_PRESENCE: PresenceMotion = {
  initial: {
    opacity: 0,
    x: 10,
  },
  animate: {
    opacity: 1,
    x: 0,
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: SIDEBAR_SOFT_EXIT_TRANSITION,
  },
}

export const SIDEBAR_BOTTOM_PANEL_PRESENCE: PresenceMotion = {
  initial: {
    opacity: 0,
    height: 0,
  },
  animate: {
    opacity: 1,
    height: "auto",
  },
  exit: {
    opacity: 0,
    height: 0,
    transition: SIDEBAR_SOFT_EXIT_TRANSITION,
  },
}

export const SIDEBAR_BOTTOM_PANEL_CONTENT_PRESENCE: PresenceMotion = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: 8,
    transition: SIDEBAR_SOFT_EXIT_TRANSITION,
  },
}

export const UTILITY_PANEL_PRESENCE: PresenceMotion = {
  initial: {
    opacity: 0,
    scale: 0.96,
    y: -10,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    y: -8,
  },
}

export const UTILITY_PANEL_CONTENT_PRESENCE: PresenceMotion = {
  initial: {
    opacity: 1,
    y: 0,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 1,
    y: 0,
  },
}

export const CONTENT_ENTER_PRESENCE: PresenceMotion = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
  },
  exit: {
    opacity: 0,
    y: -4,
  },
}

export const NOTIFICATION_MESSAGE_PRESENCE: PresenceMotion = {
  initial: {
    opacity: 0,
    y: -12,
    scale: 0.985,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    y: -10,
    scale: 0.985,
  },
}

export const NOTIFICATION_TOAST_PRESENCE: PresenceMotion = {
  initial: {
    opacity: 0,
    x: 14,
    y: 10,
    scale: 0.985,
  },
  animate: {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
  },
  exit: {
    opacity: 0,
    x: 12,
    y: 8,
    scale: 0.985,
  },
}
