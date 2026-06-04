import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowDown, ArrowUp, type LucideIcon } from "lucide-react"
import { AnimatePresence, m, useReducedMotion, type Transition, type Variants } from "motion/react"

import type { AppView } from "@/features/bettertolive/types"
import { cn } from "@/lib/utils"

const PREVIEW_LIMIT = 4
const VISIBILITY_OFFSET = 12

// ---------------------------------------------------------------------------
// 组件级 motion 配置(刻意不放进公共 app-motion.ts,与组件耦合在一起)
//
// 展开→缩起:
//   1. 展开 panel 整体向左滑出 + 渐隐,里面的标题/按钮反向 stagger 退场
//   2. AnimatePresence mode="wait" 等老 panel 完全离场
//   3. collapsed panel 从右轻微滑入 + 渐显,图标依次淡入浮现
// 缩起→展开: 完全反向
// ---------------------------------------------------------------------------

const SIDEBAR_NAV_EASE = [0.22, 1, 0.36, 1] as const

const PANEL_BASE_TRANSITION: Transition = {
  duration: 0.42,
  ease: SIDEBAR_NAV_EASE,
}

const EXPANDED_PANEL_VARIANTS: Variants = {
  initial: { opacity: 0, x: -36 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      ...PANEL_BASE_TRANSITION,
      staggerChildren: 0.04,
      delayChildren: 0.06,
    },
  },
  exit: {
    opacity: 0,
    x: -48,
    transition: {
      ...PANEL_BASE_TRANSITION,
      duration: 0.34,
      staggerChildren: 0.012,
      staggerDirection: -1,
    },
  },
}

const COLLAPSED_PANEL_VARIANTS: Variants = {
  initial: { opacity: 0, x: 24 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      ...PANEL_BASE_TRANSITION,
      staggerChildren: 0.045,
      delayChildren: 0.08,
    },
  },
  exit: {
    opacity: 0,
    x: 24,
    transition: {
      ...PANEL_BASE_TRANSITION,
      duration: 0.3,
      staggerChildren: 0.014,
      staggerDirection: -1,
    },
  },
}

const GROUP_VARIANTS: Variants = {
  initial: { opacity: 0, x: -5 },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.36,
      ease: SIDEBAR_NAV_EASE,
      staggerChildren: 0.028,
    },
  },
  exit: {
    opacity: 0,
    x: -4,
    transition: {
      duration: 0.22,
      ease: SIDEBAR_NAV_EASE,
      staggerChildren: 0.01,
      staggerDirection: -1,
    },
  },
}

const ITEM_VARIANTS: Variants = {
  initial: { opacity: 0, y: 6, scale: 0.97 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.34, ease: SIDEBAR_NAV_EASE },
  },
  exit: {
    opacity: 0,
    y: -3,
    scale: 0.98,
    transition: { duration: 0.2, ease: SIDEBAR_NAV_EASE },
  },
}

// 用户开启 prefers-reduced-motion 时,只做温和的 opacity 切换
const REDUCED_PANEL_VARIANTS: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.18, staggerChildren: 0 },
  },
  exit: { opacity: 0, transition: { duration: 0.14 } },
}

const REDUCED_ITEM_VARIANTS: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.14 } },
  exit: { opacity: 0, transition: { duration: 0.1 } },
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
  const scrollViewportRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<Partial<Record<AppView, HTMLButtonElement | null>>>({})
  const animationFrameRef = useRef<number | null>(null)
  const flattenedItems = useMemo(() => sections.flatMap((section) => section.items), [sections])
  const [previewState, setPreviewState] = useState<PreviewState>(() => ({
    firstVisibleIndex: 0,
    lastVisibleIndex: Math.max(0, flattenedItems.length - 1),
  }))
  const reduceMotion = useReducedMotion()
  const expandedPanelVariants = reduceMotion ? REDUCED_PANEL_VARIANTS : EXPANDED_PANEL_VARIANTS
  const collapsedPanelVariants = reduceMotion ? REDUCED_PANEL_VARIANTS : COLLAPSED_PANEL_VARIANTS
  const groupVariants = reduceMotion ? REDUCED_PANEL_VARIANTS : GROUP_VARIANTS
  const itemVariants = reduceMotion ? REDUCED_ITEM_VARIANTS : ITEM_VARIANTS

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
    <AnimatePresence initial={false} mode="wait">
      {isCollapsed ? (
        <m.section
          key="collapsed"
          layout
          variants={collapsedPanelVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="mt-3 flex min-h-0 flex-1 flex-col rounded-lg border border-[color:var(--chip-border)] px-2 py-2"
        >
          <m.nav
            ref={scrollViewportRef}
            data-testid="sidebar-nav-scroll"
            variants={groupVariants}
            className="hide-scrollbar grid min-h-0 flex-1 content-start justify-items-center gap-2.5 overflow-y-auto overscroll-contain py-1"
          >
            {flattenedItems.map((item) => {
              const Icon = item.icon
              const isActive = item.view === activeView

              return (
                <m.button
                  key={item.view}
                  ref={(node) => {
                    itemRefs.current[item.view] = node
                  }}
                  type="button"
                  variants={itemVariants}
                  data-testid={`nav-${item.view}`}
                  onClick={() => onSelectView(item.view)}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`导航 ${item.label}`}
                  title={item.label}
                  className={cn(
                    "flex size-11 items-center justify-center rounded-xl border transition-colors",
                    isActive
                      ? "border-[color:var(--nav-active-border)] bg-[color:var(--nav-active-bg)] text-[color:var(--nav-active-icon-ink)]"
                      : "border-[color:var(--nav-idle-border)] bg-[color:var(--nav-idle-bg)] text-[color:var(--text-muted)] hover:bg-[color:var(--surface-bg)] hover:text-[color:var(--text-primary)]",
                  )}
                  style={
                    isActive
                      ? {
                          boxShadow: "var(--surface-shadow)",
                          backgroundColor: "var(--nav-active-icon-bg)",
                        }
                      : undefined
                  }
                >
                  <Icon className="size-4.5" />
                </m.button>
              )
            })}
          </m.nav>
        </m.section>
      ) : (
        <m.section
          key="expanded"
          layout
          variants={expandedPanelVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="mt-3 flex min-h-0 flex-1 flex-col rounded-lg border border-[color:var(--chip-border)] px-2.5 py-2"
        >
          <SidebarPreviewBand
            activeView={activeView}
            direction="top"
            hiddenCount={hiddenBefore.length}
            items={topPreviewItems}
            onSelectView={onSelectView}
            strength={topStrength}
          />

          <m.nav
            ref={scrollViewportRef}
            data-testid="sidebar-nav-scroll"
            variants={groupVariants}
            className="hide-scrollbar grid min-h-0 flex-1 content-start gap-2.5 overflow-y-auto overscroll-contain py-2 pr-0.5"
          >
            {sections.map((section) => (
              <m.div
                key={section.title}
                variants={groupVariants}
                className="grid gap-1.5 sm:grid-cols-2 lg:grid-cols-1"
              >
                <m.div
                  variants={itemVariants}
                  className="col-span-full mb-0.5 px-1 text-[11px] tracking-[0.18em] text-[color:var(--text-muted)] uppercase"
                >
                  {section.title}
                </m.div>
                {section.items.map((item) => {
                  const Icon = item.icon
                  const isActive = item.view === activeView

                  return (
                    <m.button
                      key={item.view}
                      ref={(node) => {
                        itemRefs.current[item.view] = node
                      }}
                      type="button"
                      variants={itemVariants}
                      data-testid={`nav-${item.view}`}
                      onClick={() => onSelectView(item.view)}
                      aria-current={isActive ? "page" : undefined}
                      aria-label={`导航 ${item.label}`}
                      className={cn(
                        "grid h-[56px] grid-cols-[auto_1fr_auto] items-center gap-2.5 rounded-lg border px-3 text-left transition-colors",
                        isActive
                          ? "border-[color:var(--nav-active-border)] bg-[color:var(--nav-active-bg)]"
                          : "border-[color:var(--nav-idle-border)] bg-[color:var(--nav-idle-bg)] hover:bg-[color:var(--surface-bg)]",
                      )}
                      style={isActive ? { boxShadow: "var(--surface-shadow)" } : undefined}
                    >
                      <div
                        className={cn(
                          "flex size-8 items-center justify-center rounded-lg border",
                          isActive
                            ? "border-transparent bg-[color:var(--nav-active-icon-bg)] text-[color:var(--nav-active-icon-ink)]"
                            : "border-[color:var(--nav-icon-border)] bg-[color:var(--nav-icon-bg)] text-[color:var(--text-muted)]",
                        )}
                      >
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium text-[color:var(--text-primary)]">
                          {item.label}
                        </div>
                        <div className="mt-0.5 truncate text-[11px] leading-4 text-[color:var(--text-muted)]">
                          {item.hint}
                        </div>
                      </div>
                      <span className="text-[color:var(--text-muted)]">&rsaquo;</span>
                    </m.button>
                  )
                })}
              </m.div>
            ))}
          </m.nav>

          <SidebarPreviewBand
            activeView={activeView}
            direction="bottom"
            hiddenCount={hiddenAfter.length}
            items={bottomPreviewItems}
            onSelectView={onSelectView}
            strength={bottomStrength}
          />
        </m.section>
      )}
    </AnimatePresence>
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
  const activeEntry = entries.find((entry) => entry.view === activeView) ?? entries[0]

  return (
    <section
      className="border-b border-[color:var(--surface-border)] backdrop-blur-xl"
      data-testid="stacked-navigation"
    >
      <div className="mx-auto w-full max-w-[1500px] px-4 py-4">
        <div className="hide-scrollbar -mx-1 overflow-x-auto pb-1">
          <nav aria-label="页面导航" className="flex w-max min-w-full gap-2 px-1">
            {entries.map((item) => {
              const Icon = item.icon
              const isActive = item.view === activeView

              return (
                <button
                  key={item.view}
                  type="button"
                  data-testid={`nav-${item.view}`}
                  onClick={() => onSelectView(item.view)}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={`导航 ${item.label}`}
                  className={cn(
                    "flex min-w-[118px] shrink-0 items-center gap-2 rounded-xl border px-3 py-2.5 text-left transition-all",
                    isActive
                      ? "border-[color:var(--nav-active-border)] bg-[color:var(--nav-active-bg)]"
                      : "border-[color:var(--nav-idle-border)] bg-[color:var(--nav-idle-bg)] hover:bg-[color:var(--surface-bg)]",
                  )}
                  style={isActive ? { boxShadow: "var(--surface-shadow)" } : undefined}
                >
                  <div
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-lg border",
                      isActive
                        ? "border-transparent bg-[color:var(--nav-active-icon-bg)] text-[color:var(--nav-active-icon-ink)]"
                        : "border-[color:var(--nav-icon-border)] bg-[color:var(--nav-icon-bg)] text-[color:var(--text-muted)]",
                    )}
                  >
                    <Icon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-[color:var(--text-primary)]">
                      {item.label}
                    </div>
                    <div className="mt-0.5 truncate text-[11px] text-[color:var(--text-muted)]">
                      {item.sectionTitle}
                    </div>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        {activeEntry ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-[color:var(--text-muted)]">
            <span className="rounded-full border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-2 py-1">
              {activeEntry.sectionTitle}
            </span>
            <span className="truncate">{activeEntry.hint}</span>
          </div>
        ) : null}
      </div>
    </section>
  )
}
