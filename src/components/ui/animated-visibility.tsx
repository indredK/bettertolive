import type { ComponentProps } from "react"
import { AnimatePresence, m, type Transition, useReducedMotion } from "motion/react"

import { APP_FADE_TRANSITION, CONTENT_ENTER_PRESENCE, type PresenceMotion } from "@/lib/app-motion"
import { cn } from "@/lib/utils"

type AnimatedVisibilityProps = ComponentProps<typeof m.div> & {
  show: boolean
  presence?: Partial<PresenceMotion>
  reducedMotionPresence?: Partial<PresenceMotion>
  presenceMode?: ComponentProps<typeof AnimatePresence>["mode"]
  layout?: boolean
  transition?: Transition
}

const REDUCED_MOTION_VISIBILITY_PRESENCE: PresenceMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

export function AnimatedVisibility({
  show,
  children,
  className,
  presence,
  reducedMotionPresence,
  presenceMode = "wait",
  layout = true,
  transition = APP_FADE_TRANSITION,
  ...props
}: AnimatedVisibilityProps) {
  const prefersReducedMotion = useReducedMotion()
  const resolvedPresence: PresenceMotion = {
    initial: presence?.initial ?? CONTENT_ENTER_PRESENCE.initial,
    animate: presence?.animate ?? CONTENT_ENTER_PRESENCE.animate,
    exit: presence?.exit ?? CONTENT_ENTER_PRESENCE.exit,
  }
  const resolvedReducedMotionPresence: PresenceMotion = {
    initial: reducedMotionPresence?.initial ?? REDUCED_MOTION_VISIBILITY_PRESENCE.initial,
    animate: reducedMotionPresence?.animate ?? REDUCED_MOTION_VISIBILITY_PRESENCE.animate,
    exit: reducedMotionPresence?.exit ?? REDUCED_MOTION_VISIBILITY_PRESENCE.exit,
  }

  return (
    <AnimatePresence initial={false} mode={presenceMode}>
      {show ? (
        <m.div
          layout={layout}
          initial={
            prefersReducedMotion ? resolvedReducedMotionPresence.initial : resolvedPresence.initial
          }
          animate={
            prefersReducedMotion ? resolvedReducedMotionPresence.animate : resolvedPresence.animate
          }
          exit={prefersReducedMotion ? resolvedReducedMotionPresence.exit : resolvedPresence.exit}
          transition={transition}
          className={cn(className)}
          {...props}
        >
          {children}
        </m.div>
      ) : null}
    </AnimatePresence>
  )
}
