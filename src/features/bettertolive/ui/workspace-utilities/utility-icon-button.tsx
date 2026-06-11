import { type ReactNode, forwardRef } from "react"
import { AnimatePresence, m, useReducedMotion } from "motion/react"

import { cn } from "@/lib/utils"

const utilityRingMask =
  "radial-gradient(circle, transparent calc(100% - 6px), black calc(100% - 4px), black 100%)"

const utilityRingHighlight =
  "conic-gradient(from 90deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0) 28deg, var(--ring) 52deg, rgba(255,255,255,0.98) 66deg, rgba(255,255,255,0.18) 82deg, rgba(255,255,255,0) 102deg, rgba(255,255,255,0) 188deg, var(--nav-active-border) 210deg, rgba(255,255,255,0.9) 226deg, rgba(255,255,255,0) 246deg, rgba(255,255,255,0) 360deg)"

const utilityRingSecondary =
  "conic-gradient(from 180deg, rgba(255,255,255,0) 0deg, rgba(255,255,255,0) 118deg, rgba(255,255,255,0.7) 146deg, rgba(255,255,255,0) 166deg, rgba(255,255,255,0) 252deg, var(--ring) 286deg, rgba(255,255,255,0.82) 306deg, rgba(255,255,255,0) 326deg, rgba(255,255,255,0) 360deg)"

export const UtilityIconButton = forwardRef<
  HTMLButtonElement,
  {
    children: ReactNode
    label: string
    contentKey?: string | number
    badge?: number | null
    dot?: boolean
    isActive: boolean
    popupType?: "dialog" | "menu"
    testId?: string
    onClick: () => void
  }
>(function UtilityIconButton(
  {
    children,
    label,
    contentKey,
    badge = null,
    dot = false,
    isActive,
    popupType = "dialog",
    testId,
    onClick,
  },
  ref,
) {
  const prefersReducedMotion = useReducedMotion()
  const iconKey = contentKey ?? label

  return (
    <m.button
      ref={ref}
      type="button"
      aria-expanded={isActive}
      aria-haspopup={popupType}
      aria-label={label}
      data-testid={testId}
      whileTap={{ scale: 0.92 }}
      transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "group relative isolate flex size-8 cursor-pointer items-center justify-center overflow-visible rounded-full border border-transparent outline-none",
        isActive ? "text-[color:var(--nav-active-border)]" : "text-[color:var(--text-muted)]",
      )}
      onClick={onClick}
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-[1px] rounded-full border transition-[background-color,border-color,box-shadow] duration-200",
          isActive
            ? "border-[color:var(--nav-active-border)] bg-[color:var(--nav-active-bg)]"
            : "border-transparent bg-transparent group-hover:border-[color:var(--nav-icon-border)] group-hover:bg-[color:var(--nav-idle-bg)]",
        )}
        style={{
          boxShadow: isActive
            ? "inset 0 1px 0 rgba(255,255,255,0.72), 0 8px 18px rgba(15,23,42,0.08)"
            : undefined,
        }}
      />

      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-[-7px] rounded-full opacity-0 blur-md transition-opacity duration-200",
          isActive ? "opacity-65" : "group-hover:opacity-50",
        )}
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, white 76%, var(--ring) 24%) 0%, rgba(255,255,255,0.18) 42%, rgba(255,255,255,0) 74%)",
        }}
      />

      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-[-5px] rounded-full opacity-0 transition-opacity duration-200",
          isActive
            ? "opacity-0"
            : cn(
                "group-hover:opacity-100",
                prefersReducedMotion ? "" : "group-hover:animate-[spin_2.4s_linear_infinite]",
              ),
        )}
        style={{
          background: utilityRingHighlight,
          WebkitMaskImage: utilityRingMask,
          maskImage: utilityRingMask,
          filter: "drop-shadow(0 0 7px rgba(255,255,255,0.52))",
        }}
      />

      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-[-5px] rounded-full opacity-0 transition-opacity duration-200",
          isActive
            ? "opacity-0"
            : cn(
                "group-hover:opacity-65",
                prefersReducedMotion
                  ? ""
                  : "group-hover:animate-[spin_3.6s_linear_infinite_reverse]",
              ),
        )}
        style={{
          background: utilityRingSecondary,
          WebkitMaskImage: utilityRingMask,
          maskImage: utilityRingMask,
        }}
      />

      <span
        aria-hidden
        className="pointer-events-none absolute inset-[1px] overflow-hidden rounded-full"
      >
        <span
          className={cn(
            "absolute inset-0 transition-opacity duration-200",
            isActive
              ? "bg-[linear-gradient(145deg,rgba(255,255,255,0.4),transparent_58%)] opacity-100"
              : "opacity-0 group-hover:bg-[linear-gradient(145deg,rgba(255,255,255,0.22),transparent_62%)] group-hover:opacity-100",
          )}
        />
        <span
          className={cn(
            "absolute inset-y-0 -left-[72%] w-[54%] -skew-x-12 rounded-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.94),transparent)] opacity-0 transition-[transform,opacity] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
            isActive
              ? "opacity-0"
              : prefersReducedMotion
                ? "group-hover:opacity-75"
                : "group-hover:translate-x-[250%] group-hover:opacity-100",
          )}
        />
        {isActive ? (
          <m.span
            aria-hidden
            initial={false}
            animate={
              prefersReducedMotion
                ? { opacity: 0.55 }
                : { opacity: [0.28, 0.62, 0.28], x: ["-118%", "206%"] }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0.2 }
                : {
                    duration: 2.4,
                    ease: [0.22, 1, 0.36, 1],
                    repeat: Infinity,
                    repeatType: "loop",
                  }
            }
            className="pointer-events-none absolute inset-y-0 -left-[72%] w-[56%] -skew-x-12 rounded-full bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.92),transparent)]"
          />
        ) : null}
      </span>

      {isActive ? (
        <>
          <m.span
            aria-hidden
            initial={false}
            animate={
              prefersReducedMotion
                ? { opacity: 0.92 }
                : { opacity: 1, rotate: 360, scale: [1, 1.02, 1] }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0.2 }
                : {
                    duration: 3.4,
                    ease: "linear",
                    repeat: Infinity,
                    repeatType: "loop",
                  }
            }
            className="pointer-events-none absolute inset-[-5px] rounded-full"
            style={{
              background: utilityRingHighlight,
              WebkitMaskImage: utilityRingMask,
              maskImage: utilityRingMask,
              filter: "drop-shadow(0 0 8px rgba(255,255,255,0.68))",
            }}
          />
          <m.span
            aria-hidden
            initial={false}
            animate={
              prefersReducedMotion
                ? { opacity: 0.52 }
                : { opacity: [0.22, 0.74, 0.22], rotate: -360 }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0.2 }
                : {
                    duration: 5.4,
                    ease: "linear",
                    repeat: Infinity,
                    repeatType: "loop",
                  }
            }
            className="pointer-events-none absolute inset-[-5px] rounded-full"
            style={{
              background: utilityRingSecondary,
              WebkitMaskImage: utilityRingMask,
              maskImage: utilityRingMask,
            }}
          />
          <m.span
            aria-hidden
            initial={false}
            animate={
              prefersReducedMotion
                ? { opacity: 0.44 }
                : { opacity: [0.18, 0.48, 0.18], scale: [1, 1.05, 1] }
            }
            transition={
              prefersReducedMotion
                ? { duration: 0.2 }
                : {
                    duration: 1.8,
                    ease: [0.22, 1, 0.36, 1],
                    repeat: Infinity,
                    repeatType: "mirror",
                  }
            }
            className="pointer-events-none absolute inset-[-4px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(255,255,255,0.44) 0%, rgba(255,255,255,0.16) 42%, rgba(255,255,255,0) 72%)",
            }}
          />
        </>
      ) : null}

      <AnimatePresence initial={false} mode="wait">
        <m.span
          key={iconKey}
          aria-hidden
          initial={
            prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, rotateX: -55, scale: 0.88 }
          }
          animate={
            prefersReducedMotion
              ? { opacity: 1 }
              : {
                  opacity: 1,
                  y: 0,
                  rotateX: 0,
                  scale: 1,
                  textShadow: isActive ? "0 0 10px rgba(255,255,255,0.45)" : "none",
                }
          }
          exit={
            prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -6, rotateX: 55, scale: 0.88 }
          }
          transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
          className={cn(
            "pointer-events-none relative z-10 flex items-center justify-center transition-[color,filter] duration-200",
            isActive
              ? "drop-shadow-[0_0_9px_rgba(255,255,255,0.48)]"
              : "group-hover:text-[color:var(--nav-active-border)] group-hover:drop-shadow-[0_0_7px_rgba(255,255,255,0.34)]",
          )}
          style={{ transformStyle: "preserve-3d" }}
        >
          {children}
        </m.span>
      </AnimatePresence>

      {badge !== null && badge > 0 ? (
        <span className="absolute -top-1 -right-1 z-20 rounded-full border border-white bg-[color:var(--text-primary)] px-1.5 py-0.5 text-[10px] leading-none text-white">
          {badge}
        </span>
      ) : null}
      {dot ? (
        <span className="absolute -right-0.5 -bottom-0.5 z-20 size-2 rounded-full border border-white bg-emerald-500" />
      ) : null}
    </m.button>
  )
})
