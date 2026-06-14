import {
  type ComponentPropsWithoutRef,
  type PointerEvent as ReactPointerEvent,
  type PointerEventHandler,
  type Ref,
  forwardRef,
  useRef,
} from "react"

import { useLiquidGlassPointer } from "@/components/ui/liquid-glass-hook"
import { cn } from "@/lib/utils"

type LiquidGlassTone = "default" | "vivid"

function assignRef<T>(ref: Ref<T> | undefined, value: T | null) {
  if (typeof ref === "function") {
    ref(value)
    return
  }

  if (ref) {
    ref.current = value
  }
}

function composePointerHandlers<T>(
  internal?: PointerEventHandler<T>,
  external?: PointerEventHandler<T>,
) {
  return (event: ReactPointerEvent<T>) => {
    internal?.(event)
    external?.(event)
  }
}

export function LiquidGlassBackdrop({
  className,
  contained = false,
  tone = "default",
}: {
  className?: string
  contained?: boolean
  tone?: LiquidGlassTone
}) {
  const primaryMix = tone === "vivid" ? "var(--ring) 28%" : "var(--ring) 18%"
  const secondaryMix = tone === "vivid" ? "var(--accent) 26%" : "var(--accent) 14%"
  const beamOpacity = tone === "vivid" ? "0.7" : "0.54"
  const haloOpacity = tone === "vivid" ? "0.24" : "0.18"
  const bloomInsetClass = contained ? "inset-0" : "inset-[-12%]"
  const beamInsetClass = contained ? "inset-[-6%]" : "inset-[-22%]"
  const beamTranslate = contained ? "36px" : "54px"
  const beamLift = contained ? "12px" : "18px"

  return (
    <>
      <span
        aria-hidden
        className={cn("pointer-events-none absolute inset-0 rounded-[inherit]", className)}
        style={{
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.66) 0%, rgba(255,255,255,0.18) 54%, rgba(255,255,255,0.1) 100%)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-px rounded-[inherit]"
        style={{
          background: `linear-gradient(180deg, rgba(255,255,255,0.26) 0%, rgba(255,255,255,0.06) 100%),
            radial-gradient(140% 150% at 0% 0%, color-mix(in oklch, white 84%, ${primaryMix}) 0%, transparent 36%),
            radial-gradient(125% 135% at 100% 4%, color-mix(in oklch, white 84%, ${secondaryMix}) 0%, transparent 32%),
            radial-gradient(110% 140% at 50% 120%, rgba(15,23,42,0.1) 0%, transparent 42%)`,
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-px rounded-[inherit]"
        style={{
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.72), inset 0 -1px 0 rgba(255,255,255,0.18), inset 0 0 0 1px rgba(255,255,255,0.12)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/liquid:opacity-100"
        style={{
          background: `radial-gradient(160px circle at var(--liquid-glow-x) var(--liquid-glow-y), rgba(255,255,255,0.54) 0%, color-mix(in oklch, white 70%, ${
            tone === "vivid" ? "var(--ring) 30%" : "var(--ring) 22%"
          }) 18%, rgba(255,255,255,0.12) 38%, rgba(255,255,255,0) 70%)`,
        }}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute rounded-[inherit] opacity-0 blur-2xl transition-opacity duration-300 group-hover/liquid:opacity-55",
          bloomInsetClass,
        )}
        style={{
          background: `radial-gradient(210px circle at var(--liquid-glow-x) var(--liquid-glow-y), color-mix(in oklch, white 74%, ${secondaryMix}) 0%, rgba(255,255,255,0.14) 32%, rgba(255,255,255,0) 74%)`,
        }}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute rounded-[inherit] opacity-0 blur-xl transition-opacity duration-300 group-hover/liquid:opacity-100",
          beamInsetClass,
        )}
        style={{
          background: `linear-gradient(112deg, transparent 24%, rgba(255,255,255,0.08) 38%, rgba(255,255,255,${beamOpacity}) 50%, rgba(255,255,255,0.14) 61%, transparent 76%)`,
          transform: `translate3d(calc((var(--liquid-glow-rx) - 0.5) * ${beamTranslate}), calc((var(--liquid-glow-ry) - 0.5) * ${beamLift}), 0) rotate(-7deg) scale(1.04)`,
          transformOrigin: "center",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-px rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover/liquid:opacity-100"
        style={{
          background:
            "radial-gradient(110px 72px at var(--liquid-glow-x) calc(var(--liquid-glow-y) - 4%), rgba(255,255,255,0.22) 0%, rgba(255,255,255,0.08) 34%, rgba(255,255,255,0) 72%)",
          mixBlendMode: "screen",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-px rounded-[inherit] opacity-0 blur-md transition-opacity duration-300 group-hover/liquid:opacity-100"
        style={{
          background: `radial-gradient(120px 54px at var(--liquid-glow-x) calc(var(--liquid-glow-y) + 2%), rgba(255,255,255,${haloOpacity}) 0%, rgba(255,255,255,0.08) 38%, rgba(255,255,255,0) 76%)`,
        }}
      />
    </>
  )
}

export const LiquidGlassSurface = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<"div"> & {
    containedBackdrop?: boolean
    contentClassName?: string
    tone?: LiquidGlassTone
  }
>(function LiquidGlassSurface(
  {
    children,
    className,
    containedBackdrop = false,
    contentClassName,
    onPointerLeave,
    onPointerMove,
    style,
    tone = "default",
    ...props
  },
  forwardedRef,
) {
  const rootRef = useRef<HTMLDivElement | null>(null)
  const liquid = useLiquidGlassPointer(rootRef)

  return (
    <div
      ref={(node) => {
        rootRef.current = node
        assignRef(forwardedRef, node)
      }}
      onPointerMove={composePointerHandlers(liquid.onPointerMove, onPointerMove)}
      onPointerLeave={composePointerHandlers(liquid.onPointerLeave, onPointerLeave)}
      className={cn(
        "group/liquid relative isolate overflow-hidden rounded-[inherit] backdrop-blur-xl",
        className,
      )}
      style={{ ...liquid.style, ...style }}
      {...props}
    >
      <LiquidGlassBackdrop contained={containedBackdrop} tone={tone} />
      <div className={cn("relative z-10", contentClassName)}>{children}</div>
    </div>
  )
})
