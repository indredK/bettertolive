import { type CSSProperties, type PointerEventHandler, type RefObject, useCallback } from "react"

const liquidGlassVars = {
  "--liquid-glow-x": "50%",
  "--liquid-glow-y": "50%",
  "--liquid-glow-rx": "0.5",
  "--liquid-glow-ry": "0.5",
} as CSSProperties

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function setLiquidGlassPosition(element: HTMLElement, xRatio: number, yRatio: number) {
  element.style.setProperty("--liquid-glow-x", `${xRatio * 100}%`)
  element.style.setProperty("--liquid-glow-y", `${yRatio * 100}%`)
  element.style.setProperty("--liquid-glow-rx", xRatio.toFixed(3))
  element.style.setProperty("--liquid-glow-ry", yRatio.toFixed(3))
}

function resetLiquidGlassPosition(element: HTMLElement) {
  element.style.setProperty("--liquid-glow-x", "50%")
  element.style.setProperty("--liquid-glow-y", "50%")
  element.style.setProperty("--liquid-glow-rx", "0.5")
  element.style.setProperty("--liquid-glow-ry", "0.5")
}

export function useLiquidGlassPointer<T extends HTMLElement>(ref: RefObject<T | null>) {
  const onPointerMove = useCallback<PointerEventHandler<T>>(
    (event) => {
      const element = ref.current

      if (!element) {
        return
      }

      const rect = element.getBoundingClientRect()

      if (rect.width === 0 || rect.height === 0) {
        return
      }

      const xRatio = clamp((event.clientX - rect.left) / rect.width, 0, 1)
      const yRatio = clamp((event.clientY - rect.top) / rect.height, 0, 1)

      setLiquidGlassPosition(element, xRatio, yRatio)
    },
    [ref],
  )

  const onPointerLeave = useCallback<PointerEventHandler<T>>(() => {
    const element = ref.current

    if (!element) {
      return
    }

    resetLiquidGlassPosition(element)
  }, [ref])

  return {
    onPointerMove,
    onPointerLeave,
    style: liquidGlassVars,
  }
}
