import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { X, type LucideIcon } from "lucide-react"
import { AnimatePresence, animate, m, useMotionValue, useReducedMotion } from "motion/react"

type CountdownControls = ReturnType<typeof animate>

import { Button } from "@/components/ui/button"
import { UI_LAYERS } from "@/lib/ui-layers"
import { cn } from "@/lib/utils"

type PopupNotificationContextValue = {
  isPaused: boolean
}

const PopupNotificationContext = createContext<PopupNotificationContextValue | null>(null)

function usePopupNotificationContext() {
  const ctx = useContext(PopupNotificationContext)
  if (!ctx) {
    throw new Error("PopupNotification.* must be used inside <PopupNotification>")
  }
  return ctx
}

type PopupNotificationRootProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** ms; 0 / undefined / null = persistent */
  autoCloseMs?: number | null
  /** show countdown bar at bottom; defaults to true when autoCloseMs > 0 */
  showProgress?: boolean
  pauseOnHover?: boolean
  className?: string
  children: ReactNode
  /** test hook */
  "data-testid"?: string
}

const ENTER_TRANSITION = {
  type: "spring" as const,
  stiffness: 380,
  damping: 28,
  mass: 0.85,
}

const EXIT_TRANSITION = {
  type: "spring" as const,
  stiffness: 460,
  damping: 36,
  mass: 0.7,
}

export function PopupNotification({
  open,
  onOpenChange,
  autoCloseMs,
  showProgress,
  pauseOnHover = true,
  className,
  children,
  "data-testid": dataTestId,
}: PopupNotificationRootProps) {
  const [isPaused, setIsPaused] = useState(false)
  const reduceMotion = useReducedMotion()
  const hasAutoClose = typeof autoCloseMs === "number" && autoCloseMs > 0
  const shouldShowProgress = showProgress ?? hasAutoClose
  const timeoutRef = useRef<number | null>(null)
  const remainingRef = useRef<number>(autoCloseMs ?? 0)
  const startedAtRef = useRef<number>(0)

  const clearTimer = useCallback(() => {
    if (timeoutRef.current !== null && typeof window !== "undefined") {
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const scheduleClose = useCallback(
    (delay: number) => {
      if (!hasAutoClose || typeof window === "undefined") {
        return
      }
      clearTimer()
      startedAtRef.current = performance.now()
      timeoutRef.current = window.setTimeout(
        () => {
          onOpenChange(false)
        },
        Math.max(0, delay),
      )
    },
    [clearTimer, hasAutoClose, onOpenChange],
  )

  useEffect(() => {
    if (!open || !hasAutoClose) {
      clearTimer()
      return
    }
    remainingRef.current = autoCloseMs ?? 0
    scheduleClose(remainingRef.current)
    return () => {
      clearTimer()
    }
  }, [open, hasAutoClose, autoCloseMs, scheduleClose, clearTimer])

  const handlePointerEnter = useCallback(() => {
    if (!pauseOnHover || !hasAutoClose) {
      return
    }
    if (timeoutRef.current === null) {
      return
    }
    const elapsed = performance.now() - startedAtRef.current
    remainingRef.current = Math.max(0, remainingRef.current - elapsed)
    clearTimer()
    setIsPaused(true)
  }, [pauseOnHover, hasAutoClose, clearTimer])

  const handlePointerLeave = useCallback(() => {
    if (!pauseOnHover || !hasAutoClose) {
      return
    }
    setIsPaused(false)
    scheduleClose(remainingRef.current)
  }, [pauseOnHover, hasAutoClose, scheduleClose])

  const contextValue = useMemo<PopupNotificationContextValue>(() => ({ isPaused }), [isPaused])

  const initial = reduceMotion
    ? { opacity: 0 }
    : { opacity: 0, x: 48, y: 24, scale: 0.92, rotate: 1.2 }
  const animate = reduceMotion ? { opacity: 1 } : { opacity: 1, x: 0, y: 0, scale: 1, rotate: 0 }
  const exit = reduceMotion
    ? { opacity: 0, transition: { duration: 0.18 } }
    : {
        opacity: 0,
        x: 56,
        y: 12,
        scale: 0.94,
        rotate: 2,
        transition: EXIT_TRANSITION,
      }

  return (
    <PopupNotificationContext.Provider value={contextValue}>
      <div
        className={cn(
          "pointer-events-none fixed inset-x-4 bottom-4 flex justify-end sm:inset-x-auto sm:right-4 sm:bottom-4",
          UI_LAYERS.notifications,
        )}
      >
        <div className="flex w-full max-w-sm flex-col gap-3">
          <AnimatePresence initial>
            {open ? (
              <m.section
                key="popup-notification"
                role="status"
                aria-live="polite"
                data-testid={dataTestId}
                onPointerEnter={handlePointerEnter}
                onPointerLeave={handlePointerLeave}
                onFocusCapture={handlePointerEnter}
                onBlurCapture={handlePointerLeave}
                initial={initial}
                animate={animate}
                exit={exit}
                transition={ENTER_TRANSITION}
                whileHover={reduceMotion ? undefined : { scale: 1.012 }}
                style={{ transformOrigin: "bottom right" }}
                className={cn(
                  "pointer-events-auto relative overflow-hidden rounded-2xl border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] shadow-[0_28px_70px_rgba(15,23,42,0.22)] backdrop-blur-xl",
                  className,
                )}
              >
                {children}
                {shouldShowProgress && hasAutoClose ? (
                  <PopupCountdownBar duration={autoCloseMs ?? 0} isPaused={isPaused} />
                ) : null}
              </m.section>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </PopupNotificationContext.Provider>
  )
}

function PopupCountdownBar({ duration, isPaused }: { duration: number; isPaused: boolean }) {
  const reduceMotion = useReducedMotion()
  const scaleX = useMotionValue(1)
  const controlsRef = useRef<CountdownControls | null>(null)

  useEffect(() => {
    if (reduceMotion) {
      return
    }
    scaleX.set(1)
    const controls = animate(scaleX, 0, {
      duration: duration / 1000,
      ease: "linear",
    })
    controlsRef.current = controls
    return () => {
      controls.stop()
      controlsRef.current = null
    }
  }, [duration, reduceMotion, scaleX])

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    if (isPaused) {
      controls.pause()
    } else {
      controls.play()
    }
  }, [isPaused])

  if (reduceMotion) {
    return null
  }

  return (
    <div className="pointer-events-none absolute right-0 bottom-0 left-0 h-[3px] overflow-hidden">
      <m.div
        style={{ scaleX, transformOrigin: "left center" }}
        className="h-full bg-gradient-to-r from-[color:var(--nav-active-icon-bg)] via-[color:var(--text-primary)] to-[color:var(--nav-active-icon-bg)] opacity-80"
      />
    </div>
  )
}

type PopupHeaderProps = {
  icon?: LucideIcon
  eyebrow?: string
  title: string
  closeLabel?: string
  onClose?: () => void
  className?: string
}

export function PopupNotificationHeader({
  icon: Icon,
  eyebrow,
  title,
  closeLabel = "Close",
  onClose,
  className,
}: PopupHeaderProps) {
  return (
    <header className={cn("flex items-start justify-between gap-3 px-4 pt-3.5 pb-2", className)}>
      <div className="flex min-w-0 items-start gap-2.5">
        {Icon ? (
          <m.div
            initial={{ rotate: -18, scale: 0.85, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 420, damping: 18, delay: 0.08 }}
            className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-primary)]"
          >
            <Icon className="size-3.5" />
          </m.div>
        ) : null}
        <div className="min-w-0">
          {eyebrow ? (
            <div className="text-[10px] tracking-[0.22em] text-[color:var(--text-muted)] uppercase">
              {eyebrow}
            </div>
          ) : null}
          <div className="text-sm font-semibold text-[color:var(--text-primary)]">{title}</div>
        </div>
      </div>
      {onClose ? (
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
          onClick={onClose}
          aria-label={closeLabel}
        >
          <X className="size-4" />
        </Button>
      ) : null}
    </header>
  )
}

export function PopupNotificationBody({
  className,
  children,
}: {
  className?: string
  children: ReactNode
}) {
  // expose context so consumers (e.g. carousels) can pause when hovered
  usePopupNotificationContext()
  return <div className={cn("px-4 pt-1 pb-3.5", className)}>{children}</div>
}

export function usePopupNotification() {
  return usePopupNotificationContext()
}
