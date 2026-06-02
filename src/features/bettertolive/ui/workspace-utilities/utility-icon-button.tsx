import { type ReactNode, forwardRef } from "react"
import { m } from "motion/react"

import { cn } from "@/lib/utils"

export const UtilityIconButton = forwardRef<
  HTMLButtonElement,
  {
    children: ReactNode
    label: string
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
    badge = null,
    dot = false,
    isActive,
    popupType = "dialog",
    testId,
    onClick,
  },
  ref,
) {
  return (
    <m.button
      ref={ref}
      type="button"
      aria-expanded={isActive}
      aria-haspopup={popupType}
      aria-label={label}
      data-testid={testId}
      whileHover={{
        scale: isActive ? 1.02 : 1.04,
        y: -1,
      }}
      whileTap={{
        scale: 0.96,
        y: 0,
      }}
      transition={{
        duration: 0.16,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={cn(
        "relative flex size-8 items-center justify-center rounded-full border transition",
        isActive
          ? "border-[color:var(--nav-active-border)] bg-white text-[color:var(--text-primary)]"
          : "border-transparent text-[color:var(--text-muted)] hover:border-[color:var(--chip-border)] hover:bg-white/80",
      )}
      onClick={onClick}
    >
      {children}
      {badge !== null && badge > 0 ? (
        <span className="absolute -top-1 -right-1 rounded-full border border-white bg-[color:var(--text-primary)] px-1.5 py-0.5 text-[10px] leading-none text-white">
          {badge}
        </span>
      ) : null}
      {dot ? (
        <span className="absolute -right-0.5 -bottom-0.5 size-2 rounded-full border border-white bg-emerald-500" />
      ) : null}
    </m.button>
  )
})
