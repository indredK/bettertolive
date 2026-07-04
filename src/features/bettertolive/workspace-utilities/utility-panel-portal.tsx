import { type CSSProperties, type ReactNode, type RefObject } from "react"
import { createPortal } from "react-dom"
import { AnimatePresence, m } from "motion/react"

import { UI_LAYERS } from "@/lib/ui-layers"
import {
  APP_FADE_TRANSITION,
  UTILITY_PANEL_CONTENT_PRESENCE,
  UTILITY_PANEL_PRESENCE,
} from "@/lib/app-motion"
import { cn } from "@/lib/utils"

export function UtilityPanelPortal({
  children,
  isOpen,
  panelKey,
  panelRef,
  panelStyle,
}: {
  children: ReactNode
  isOpen: boolean
  panelKey: string | null
  panelRef: RefObject<HTMLDivElement | null>
  panelStyle: CSSProperties | null
}) {
  if (panelStyle === null || typeof document === "undefined") {
    return null
  }

  return createPortal(
    <AnimatePresence initial={false}>
      {isOpen ? (
        <m.div
          ref={panelRef}
          layout
          initial={UTILITY_PANEL_PRESENCE.initial}
          animate={UTILITY_PANEL_PRESENCE.animate}
          exit={UTILITY_PANEL_PRESENCE.exit}
          transition={APP_FADE_TRANSITION}
          className={cn(
            "fixed max-h-[min(78vh,calc(100vh-6rem))] origin-top-right overflow-y-auto overscroll-contain",
            UI_LAYERS.utilityPanel,
          )}
          style={panelStyle}
        >
          <AnimatePresence initial={false} mode="wait">
            <m.div
              key={panelKey ?? "panel"}
              initial={UTILITY_PANEL_CONTENT_PRESENCE.initial}
              animate={UTILITY_PANEL_CONTENT_PRESENCE.animate}
              exit={UTILITY_PANEL_CONTENT_PRESENCE.exit}
              transition={APP_FADE_TRANSITION}
            >
              {children}
            </m.div>
          </AnimatePresence>
        </m.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  )
}
