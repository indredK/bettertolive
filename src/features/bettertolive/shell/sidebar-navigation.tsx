import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react"
import { AnimatePresence, m, useReducedMotion } from "motion/react"
import { useTranslation } from "react-i18next"

import type { AppView } from "@/features/bettertolive/types"
import {
  SIDEBAR_EXPAND_TRANSITION,
  SIDEBAR_COLLAPSE_TRANSITION,
} from "@/features/bettertolive/shell/sidebar-shell-motion"
import { cn } from "@/lib/utils"

const PREVIEW_LIMIT = 4
const VISIBILITY_OFFSET = 12
const ICON_HOVER_DELAY_MS = 500
const ICON_SWEEP_TRANSITION = {
  duration: 0.62,
  ease: [0.22, 1, 0.36, 1] as const,
}

export type SidebarNavigationItem = {
  view: AppView
  label: string
  hint: string
  icon: LucideIcon
}

export type SidebarNavigationSection = {
  title: string
  items: SidebarNavigationItem[]
}

type StackedNavigationEntry = SidebarNavigationItem & {
  sectionTitle: string
}

type PreviewState = {
  firstVisibleIndex: number
  lastVisibleIndex: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function useDelayedHover(isHovered: boolean, delayMs: number) {
  const [isDelayedHover, setIsDelayedHover] = useState(false)

  useEffect(() => {
    if (!isHovered) {
      setTimeout(() => setIsDelayedHover(false), 0)
      return
    }

    const timer = window.setTimeout(() => {
      setIsDelayedHover(true)
    }, delayMs)

    return () => window.clearTimeout(timer)
  }, [delayMs, isHovered])

  return isDelayedHover
}

function SweepIcon({
  Icon,
  isActive,
  isHovered,
}: {
  Icon: LucideIcon
  isActive: boolean
  isHovered: boolean
}) {
  const prefersReducedMotion = useReducedMotion()
  const isSweepVisible = useDelayedHover(isHovered, ICON_HOVER_DELAY_MS)

  return (
    <div
      className={cn(
        "relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg border",
        isActive
          ? "border-transparent bg-[color:var(--nav-active-icon-bg)] text-[color:var(--nav-active-icon-ink)]"
          : "border-[color:var(--nav-icon-border)] bg-[color:var(--nav-icon-bg)] text-[color:var(--text-muted)]",
      )}
      style={{ perspective: 900 }}
    >
      <AnimatePresence initial={false}>
        {isSweepVisible ? (
          <m.span
            aria-hidden
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: "-120%" }}
            animate={
              prefersReducedMotion
                ? { opacity: 0.5 }
                : { opacity: [0, 0.8, 0], x: ["-120%", "180%"] }
            }
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, x: "180%" }}
            transition={ICON_SWEEP_TRANSITION}
            className="pointer-events-none absolute inset-y-0 left-[-26%] w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.22),rgba(255,255,255,0.92),rgba(255,255,255,0.22),transparent)] mix-blend-screen"
          />
        ) : null}
      </AnimatePresence>
      <Icon className="relative z-10 size-4" />
    </div>
  )
}

function SidebarPreviewBand({
  activeView,
  direction,
  hiddenCount,
  items,
  onSelectView,
  strength,
}: {
  activeView: AppView
  direction: "top" | "bottom"
  hiddenCount: number
  items: SidebarNavigationItem[]
  onSelectView: (view: AppView) => void
  strength: number
}) {
  const isVisible = hiddenCount > 0
  const hiddenOverflowCount = Math.max(0, hiddenCount - items.length)
  const Icon = direction === "top" ? ArrowUp : ArrowDown
  const scale = 0.96 + strength * 0.04
  const translateY = direction === "top" ? (1 - strength) * -6 : (1 - strength) * 6

  return (
    <div
      data-testid={`sidebar-preview-${direction}`}
      aria-hidden={!isVisible}
      className={cn(
        "overflow-hidden transition-all duration-300 ease-out",
        isVisible ? "max-h-14 opacity-100" : "max-h-0 opacity-0",
      )}
    >
      <div
        className={cn(
          "rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-2.5 py-2 shadow-[0_10px_24px_rgba(15,23,42,0.04)]",
          direction === "top"
            ? "origin-bottom border-b-transparent"
            : "origin-top border-t-transparent",
        )}
        style={{
          opacity: 0.46 + strength * 0.54,
          transform: `translateY(${translateY}px) scale(${scale})`,
        }}
      >
        <div
          className="flex items-center gap-2"
          style={{
            WebkitMaskImage:
              "linear-gradient(90deg, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)",
            maskImage:
              "linear-gradient(90deg, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)",
          }}
        >
          <div className="flex shrink-0 items-center gap-1 rounded-full border border-[color:var(--chip-border)] bg-white/55 px-2 py-1 text-[10px] font-medium tracking-[0.18em] text-[color:var(--text-muted)]">
            <Icon className="size-3" />
            <span>{hiddenCount}</span>
          </div>
          <div className="flex min-w-0 items-center gap-1.5 overflow-hidden">
            {items.map((item) => {
              const isActive = item.view === activeView

              return (
                <button
                  key={`${direction}-${item.view}`}
                  type="button"
                  onClick={() => onSelectView(item.view)}
                  className={cn(
                    "shrink-0 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
                    isActive
                      ? "border-[color:var(--nav-active-border)] bg-[color:var(--nav-active-bg)] text-[color:var(--text-primary)]"
                      : "border-[color:var(--chip-border)] bg-white/55 text-[color:var(--text-muted)] hover:bg-white/75 hover:text-[color:var(--text-primary)]",
                  )}
                >
                  {item.label}
                </button>
              )
            })}
            {hiddenOverflowCount > 0 ? (
              <span className="shrink-0 rounded-full border border-[color:var(--chip-border)] px-2 py-1 text-[10px] text-[color:var(--text-muted)]">
                +{hiddenOverflowCount}
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

const NavItem = forwardRef<
  HTMLButtonElement,
  {
    item: SidebarNavigationItem
    isActive: boolean
    isCollapsed: boolean
    onSelectView: (view: AppView) => void
  }
>(function NavItem({ item, isActive, isCollapsed, onSelectView }, ref) {
  const { t } = useTranslation()
  const transition = isCollapsed ? SIDEBAR_COLLAPSE_TRANSITION : SIDEBAR_EXPAND_TRANSITION
  const [isHovered, setIsHovered] = useState(false)

  return (
    <m.button
      ref={ref}
      type="button"
      data-testid={`nav-${item.view}`}
      onClick={() => onSelectView(item.view)}
      aria-current={isActive ? "page" : undefined}
      aria-label={t("shell.nav.itemAria", { label: item.label })}
      title={isCollapsed ? item.label : undefined}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className={cn(
        "relative flex h-[56px] items-center gap-2.5 overflow-hidden rounded-lg px-[10px] text-left",
        "w-full",
        isActive
          ? "bg-[color:var(--nav-active-bg)]"
          : "bg-transparent hover:bg-[color:var(--surface-bg)]",
      )}
    >
      <SweepIcon Icon={item.icon} isActive={isActive} isHovered={isHovered} />
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <m.div
            key="nav-item-text"
            initial={{ opacity: 0, width: 0, x: -8 }}
            animate={{ opacity: 1, width: "auto", x: 0 }}
            exit={{ opacity: 0, width: 0, x: -8 }}
            transition={transition}
            className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden"
          >
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="truncate text-sm font-medium text-[color:var(--text-primary)]">
                {item.label}
              </div>
              <div className="mt-0.5 truncate text-[11px] leading-4 text-[color:var(--text-muted)]">
                {item.hint}
              </div>
            </div>
            <span className="shrink-0 text-[color:var(--text-muted)]">&rsaquo;</span>
          </m.div>
        )}
      </AnimatePresence>
    </m.button>
  )
})

function StackedNavItem({
  item,
  isActive,
  onSelectView,
}: {
  item: StackedNavigationEntry
  isActive: boolean
  onSelectView: (view: AppView) => void
}) {
  const { t } = useTranslation()
  const [isHovered, setIsHovered] = useState(false)

  return (
    <button
      type="button"
      data-testid={`nav-${item.view}`}
      onClick={() => onSelectView(item.view)}
      aria-current={isActive ? "page" : undefined}
      aria-label={t("shell.nav.itemAria", { label: item.label })}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "flex min-w-[118px] shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all",
        isActive
          ? "border-[color:var(--nav-active-border)] bg-[color:var(--nav-active-bg)]"
          : "border-[color:var(--nav-idle-border)] bg-[color:var(--nav-idle-bg)] hover:bg-[color:var(--surface-bg)]",
      )}
      style={isActive ? { boxShadow: "var(--surface-shadow)" } : undefined}
    >
      <SweepIcon Icon={item.icon} isActive={isActive} isHovered={isHovered} />
      <div className="min-w-0">
        <div className="text-sm font-medium text-[color:var(--text-primary)]">{item.label}</div>
        <div className="mt-0.5 truncate text-[11px] text-[color:var(--text-muted)]">
          {item.sectionTitle}
        </div>
      </div>
    </button>
  )
}

export function SidebarNavigation({
  activeView,
  isCollapsed = false,
  onSelectView,
  sections,
}: {
  activeView: AppView
  isCollapsed?: boolean
  onSelectView: (view: AppView) => void
  sections: SidebarNavigationSection[]
}) {
  const scrollViewportRef = useRef<HTMLElement | null>(null)
  const itemRefs = useRef<Partial<Record<AppView, HTMLButtonElement | null>>>({})
  const animationFrameRef = useRef<number | null>(null)
  const flattenedItems = useMemo(() => sections.flatMap((section) => section.items), [sections])
  const [previewState, setPreviewState] = useState<PreviewState>(() => ({
    firstVisibleIndex: 0,
    lastVisibleIndex: Math.max(0, flattenedItems.length - 1),
  }))

  const measureVisibleRange = useCallback(() => {
    const container = scrollViewportRef.current

    if (!container || flattenedItems.length === 0) {
      return
    }

    const containerRect = container.getBoundingClientRect()

    if (container.clientHeight === 0 || containerRect.height === 0) {
      setPreviewState((current) => {
        if (
          current.firstVisibleIndex === 0 &&
          current.lastVisibleIndex === flattenedItems.length - 1
        ) {
          return current
        }

        return {
          firstVisibleIndex: 0,
          lastVisibleIndex: flattenedItems.length - 1,
        }
      })
      return
    }

    let firstVisibleIndex = -1
    let lastVisibleIndex = -1

    flattenedItems.forEach((item, index) => {
      const element = itemRefs.current[item.view]

      if (!element) {
        return
      }

      const rect = element.getBoundingClientRect()
      const isVisible =
        rect.bottom > containerRect.top + VISIBILITY_OFFSET &&
        rect.top < containerRect.bottom - VISIBILITY_OFFSET

      if (!isVisible) {
        return
      }

      if (firstVisibleIndex === -1) {
        firstVisibleIndex = index
      }

      lastVisibleIndex = index
    })

    if (firstVisibleIndex === -1 || lastVisibleIndex === -1) {
      const fallbackIndex = clamp(
        Math.round(container.scrollTop / 72),
        0,
        flattenedItems.length - 1,
      )

      setPreviewState((current) => {
        if (
          current.firstVisibleIndex === fallbackIndex &&
          current.lastVisibleIndex === fallbackIndex
        ) {
          return current
        }

        return {
          firstVisibleIndex: fallbackIndex,
          lastVisibleIndex: fallbackIndex,
        }
      })
      return
    }

    setPreviewState((current) => {
      if (
        current.firstVisibleIndex === firstVisibleIndex &&
        current.lastVisibleIndex === lastVisibleIndex
      ) {
        return current
      }

      return {
        firstVisibleIndex,
        lastVisibleIndex,
      }
    })
  }, [flattenedItems])

  const scheduleMeasure = useCallback(() => {
    if (typeof window === "undefined") {
      return
    }

    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current)
    }

    animationFrameRef.current = window.requestAnimationFrame(() => {
      animationFrameRef.current = null
      measureVisibleRange()
    })
  }, [measureVisibleRange])

  useEffect(() => {
    const container = scrollViewportRef.current

    if (!container) {
      return
    }

    scheduleMeasure()

    const handleResize = () => {
      scheduleMeasure()
    }

    container.addEventListener("scroll", scheduleMeasure, { passive: true })
    window.addEventListener("resize", handleResize)

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            scheduleMeasure()
          })
        : null

    observer?.observe(container)

    return () => {
      container.removeEventListener("scroll", scheduleMeasure)
      window.removeEventListener("resize", handleResize)
      observer?.disconnect()

      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [scheduleMeasure])

  useEffect(() => {
    scheduleMeasure()
  }, [scheduleMeasure, activeView, sections])

  useEffect(() => {
    const activeItem = itemRefs.current[activeView]

    if (!activeItem) {
      return
    }

    if (typeof activeItem.scrollIntoView === "function") {
      activeItem.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      })
    }
  }, [activeView])

  const hiddenBefore = flattenedItems.slice(0, previewState.firstVisibleIndex)
  const hiddenAfter =
    previewState.lastVisibleIndex >= flattenedItems.length - 1
      ? []
      : flattenedItems.slice(previewState.lastVisibleIndex + 1)
  const topPreviewItems = hiddenBefore.slice(-PREVIEW_LIMIT)
  const bottomPreviewItems = hiddenAfter.slice(0, PREVIEW_LIMIT)
  const topStrength = hiddenBefore.length / Math.max(1, flattenedItems.length)
  const bottomStrength = hiddenAfter.length / Math.max(1, flattenedItems.length)

  return (
    <section className="mt-3 flex min-h-0 flex-1 flex-col px-0">
      {isCollapsed ? null : (
        <SidebarPreviewBand
          activeView={activeView}
          direction="top"
          hiddenCount={hiddenBefore.length}
          items={topPreviewItems}
          onSelectView={onSelectView}
          strength={topStrength}
        />
      )}

      <nav
        ref={scrollViewportRef}
        data-testid="sidebar-nav-scroll"
        className="hide-scrollbar grid min-h-0 flex-1 content-start gap-1 overflow-y-auto overscroll-contain py-2"
      >
        {flattenedItems.map((item) => (
          <NavItem
            key={item.view}
            ref={(node) => {
              itemRefs.current[item.view] = node
            }}
            item={item}
            isActive={item.view === activeView}
            isCollapsed={isCollapsed}
            onSelectView={onSelectView}
          />
        ))}
      </nav>

      {isCollapsed ? null : (
        <SidebarPreviewBand
          activeView={activeView}
          direction="bottom"
          hiddenCount={hiddenAfter.length}
          items={bottomPreviewItems}
          onSelectView={onSelectView}
          strength={bottomStrength}
        />
      )}
    </section>
  )
}

export function StackedNavigation({
  activeView,
  onSelectView,
  sections,
}: {
  activeView: AppView
  onSelectView: (view: AppView) => void
  sections: SidebarNavigationSection[]
}) {
  const { t } = useTranslation()
  const entries = useMemo<StackedNavigationEntry[]>(
    () =>
      sections.flatMap((section) =>
        section.items.map((item) => ({
          ...item,
          sectionTitle: section.title,
        })),
      ),
    [sections],
  )

  return (
    <section className="h-14" data-testid="stacked-navigation">
      <div className="mx-auto flex h-full w-full max-w-[1500px] items-center px-4">
        <div className="hide-scrollbar -mx-1 overflow-x-auto">
          <nav aria-label={t("shell.nav.ariaLabel")} className="flex w-max min-w-full gap-2 px-1">
            {entries.map((item) => (
              <StackedNavItem
                key={item.view}
                item={item}
                isActive={item.view === activeView}
                onSelectView={onSelectView}
              />
            ))}
          </nav>
        </div>
      </div>
    </section>
  )
}
