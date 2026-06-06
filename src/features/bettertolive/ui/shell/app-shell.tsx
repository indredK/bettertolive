import {
  AlertTriangle,
  BookOpenText,
  Compass,
  HeartPulse,
  Landmark,
  LayoutDashboard,
  Lightbulb,
  ListTodo,
  NotebookPen,
  PanelLeftClose,
  RefreshCcw,
  Route,
  Salad,
  Scale,
  Search,
  ScrollText,
  Sparkles,
  Users2,
  Wallet,
  Waypoints,
  type LucideIcon,
} from "lucide-react"
import { AnimatePresence, m, useReducedMotion } from "motion/react"
import { useEffect, useMemo, useState } from "react"
import type { TFunction } from "i18next"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AppView } from "@/features/bettertolive/types"
import {
  createWorkspaceRhythmSlides,
  createWorkspaceSidebarNotes,
} from "@/features/bettertolive/config/sidebar"
import { useWorkspaceNotifications } from "@/features/bettertolive/hooks/use-workspace-notifications"
import { useWorkspaceMusic } from "@/features/bettertolive/hooks/use-workspace-music"
import { useWorkspaceTheme } from "@/features/bettertolive/hooks/use-workspace-theme"
import { useWorkspaceViewRoute } from "@/features/bettertolive/hooks/use-workspace-view-route"
import { useWorkspaceViewModel } from "@/features/bettertolive/hooks/use-workspace-view-model"
import { useWorkspaceSnapshotQuery } from "@/features/bettertolive/queries/use-workspace-snapshot-query"
import { useWorkspaceUiStore } from "@/features/bettertolive/stores/workspace-ui-store"
import { EventsPage } from "@/features/bettertolive/ui/events/events-page"
import { FinancePage } from "@/features/bettertolive/ui/finance/finance-page"
import { FuturePage } from "@/features/bettertolive/ui/future/future-page"
import { BeliefsPage } from "@/features/bettertolive/ui/beliefs/beliefs-page"
import { EmotionPage } from "@/features/bettertolive/ui/emotion/emotion-page"
import { JourneyPage } from "@/features/bettertolive/ui/journey/journey-page"
import { LegacyPage } from "@/features/bettertolive/ui/legacy/legacy-page"
import { NotificationLayer } from "@/features/bettertolive/ui/shared/notification-layer"
import { Toaster } from "@/components/ui/sonner"
import { NutritionPage } from "@/features/bettertolive/ui/nutrition/nutrition-page"
import { OverviewPage } from "@/features/bettertolive/ui/overview/overview-page"
import { PrinciplesPage } from "@/features/bettertolive/ui/principles/principles-page"
import { ReflectionPage } from "@/features/bettertolive/ui/reflection/reflection-page"
import { RelationshipsPage } from "@/features/bettertolive/ui/relationships/relationships-page"
import { ShoppingPage } from "@/features/bettertolive/ui/shopping/shopping-page"
import { SocioeconomicsPage } from "@/features/bettertolive/ui/socioeconomics/socioeconomics-page"
import { SidebarNoteCarousel } from "@/features/bettertolive/ui/shell/sidebar-carousel"
import { LanguageToggle } from "@/features/bettertolive/ui/shell/language-toggle"
import { RhythmPopup } from "@/features/bettertolive/ui/shell/rhythm-popup"
import {
  getSidebarBrandIconOffset,
  getSidebarHeaderTransition,
  getSidebarNoteContentTransition,
  getSidebarPadding,
  getSidebarTransitionStyle,
  getSidebarWidth,
  SIDEBAR_EXPANDED_CONTENT_FRAME_WIDTH,
} from "@/features/bettertolive/ui/shell/sidebar-shell-motion"
import {
  SidebarNavigation,
  StackedNavigation,
} from "@/features/bettertolive/ui/shell/sidebar-navigation"
import { WorkspaceUtilities } from "@/features/bettertolive/ui/workspace-utilities"
import { formatWorkspaceDate } from "@/features/bettertolive/ui/shared/formatters"
import { UI_LAYERS } from "@/lib/ui-layers"
import { cn } from "@/lib/utils"
import {
  APP_FADE_TRANSITION,
  SIDEBAR_BOTTOM_PANEL_CONTENT_PRESENCE,
  CONTENT_ENTER_PRESENCE,
  SIDEBAR_BOTTOM_PANEL_PRESENCE,
  SIDEBAR_FADE_TRANSITION,
  SIDEBAR_HEADER_CONTENT_PRESENCE,
} from "@/lib/app-motion"

type NavItem = {
  view: AppView
  label: string
  hint: string
  icon: LucideIcon
}

type WorkspaceLayoutMode = "wide" | "compact" | "stacked"

const WIDE_LAYOUT_MIN_WIDTH = 1240
const COMPACT_LAYOUT_MIN_WIDTH = 960

function createNavSections(t: TFunction): Array<{
  title: string
  items: NavItem[]
}> {
  return [
    {
      title: t("shell.nav.groups.workbench"),
      items: [
        {
          view: "overview",
          label: t("shell.nav.items.overview.label"),
          hint: t("shell.nav.items.overview.hint"),
          icon: LayoutDashboard,
        },
      ],
    },
    {
      title: t("shell.nav.groups.records"),
      items: [
        {
          view: "reflection",
          label: t("shell.nav.items.reflection.label"),
          hint: t("shell.nav.items.reflection.hint"),
          icon: NotebookPen,
        },
        {
          view: "events",
          label: t("shell.nav.items.events.label"),
          hint: t("shell.nav.items.events.hint"),
          icon: BookOpenText,
        },
        {
          view: "finance",
          label: t("shell.nav.items.finance.label"),
          hint: t("shell.nav.items.finance.hint"),
          icon: Wallet,
        },
        {
          view: "shopping",
          label: t("shell.nav.items.shopping.label"),
          hint: t("shell.nav.items.shopping.hint"),
          icon: ListTodo,
        },
        {
          view: "nutrition",
          label: t("shell.nav.items.nutrition.label"),
          hint: t("shell.nav.items.nutrition.hint"),
          icon: Salad,
        },
      ],
    },
    {
      title: t("shell.nav.groups.innerState"),
      items: [
        {
          view: "emotion",
          label: t("shell.nav.items.emotion.label"),
          hint: t("shell.nav.items.emotion.hint"),
          icon: HeartPulse,
        },
      ],
    },
    {
      title: t("shell.nav.groups.selfMap"),
      items: [
        {
          view: "beliefs",
          label: t("shell.nav.items.beliefs.label"),
          hint: t("shell.nav.items.beliefs.hint"),
          icon: Lightbulb,
        },
        {
          view: "principles",
          label: t("shell.nav.items.principles.label"),
          hint: t("shell.nav.items.principles.hint"),
          icon: Scale,
        },
        {
          view: "relationships",
          label: t("shell.nav.items.relationships.label"),
          hint: t("shell.nav.items.relationships.hint"),
          icon: Users2,
        },
        {
          view: "journey",
          label: t("shell.nav.items.journey.label"),
          hint: t("shell.nav.items.journey.hint"),
          icon: Route,
        },
      ],
    },
    {
      title: t("shell.nav.groups.lifeOrganizing"),
      items: [
        {
          view: "legacy",
          label: t("shell.nav.items.legacy.label"),
          hint: t("shell.nav.items.legacy.hint"),
          icon: ScrollText,
        },
      ],
    },
    {
      title: t("shell.nav.groups.externalWorld"),
      items: [
        {
          view: "socioeconomics",
          label: t("shell.nav.items.socioeconomics.label"),
          hint: t("shell.nav.items.socioeconomics.hint"),
          icon: Landmark,
        },
      ],
    },
    {
      title: t("shell.nav.groups.direction"),
      items: [
        {
          view: "future",
          label: t("shell.nav.items.future.label"),
          hint: t("shell.nav.items.future.hint"),
          icon: Compass,
        },
      ],
    },
  ]
}

function getWorkspaceLayoutMode(width: number): WorkspaceLayoutMode {
  if (width >= WIDE_LAYOUT_MIN_WIDTH) {
    return "wide"
  }

  if (width >= COMPACT_LAYOUT_MIN_WIDTH) {
    return "compact"
  }

  return "stacked"
}

function useWorkspaceLayoutMode() {
  const [layoutMode, setLayoutMode] = useState<WorkspaceLayoutMode>(() =>
    typeof window === "undefined" ? "wide" : getWorkspaceLayoutMode(window.innerWidth),
  )

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const handleResize = () => {
      setLayoutMode(getWorkspaceLayoutMode(window.innerWidth))
    }

    handleResize()
    window.addEventListener("resize", handleResize)

    return () => {
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return layoutMode
}

export function BetterToLiveAppShell() {
  const { t, i18n } = useTranslation()
  const reduceMotion = useReducedMotion()
  const prefersReducedMotion = reduceMotion ?? false
  const activeView = useWorkspaceUiStore((state) => state.activeView)
  const isSidebarCollapsed = useWorkspaceUiStore((state) => state.isSidebarCollapsed)
  const isCompactSidebarExpanded = useWorkspaceUiStore((state) => state.isCompactSidebarExpanded)
  const searchQuery = useWorkspaceUiStore((state) => state.searchQuery)
  const isShoppingManagementMode = useWorkspaceUiStore((state) => state.isShoppingManagementMode)
  const setActiveView = useWorkspaceUiStore((state) => state.setActiveView)
  const setSearchQuery = useWorkspaceUiStore((state) => state.setSearchQuery)
  const toggleSidebarCollapsed = useWorkspaceUiStore((state) => state.toggleSidebarCollapsed)
  const toggleCompactSidebarExpanded = useWorkspaceUiStore(
    (state) => state.toggleCompactSidebarExpanded,
  )
  useWorkspaceViewRoute()
  const { theme, themeId, themes, setThemeId, themeStyle } = useWorkspaceTheme()
  const layoutMode = useWorkspaceLayoutMode()
  const workspaceQuery = useWorkspaceSnapshotQuery()
  const viewModel = useWorkspaceViewModel({
    searchQuery,
    workspace: workspaceQuery.workspaceSnapshot,
  })
  const {
    notifications,
    notificationFeed,
    selectedNotification,
    unreadCount,
    notify,
    dismissNotification,
    closeNotificationDetail,
    openNotificationDetail,
    activateNotificationTarget,
  } = useWorkspaceNotifications({
    onNavigate: setActiveView,
  })
  const {
    isPlaying,
    isSupported,
    currentPreset,
    presets,
    presetId,
    selectPreset,
    togglePlayback,
    volume,
    nudgeVolume,
  } = useWorkspaceMusic()
  const navSections = useMemo(() => createNavSections(t), [t])
  const workspaceRhythmSlides = useMemo(() => createWorkspaceRhythmSlides(t), [t])
  const workspaceSidebarNotes = useMemo(() => createWorkspaceSidebarNotes(t), [t])
  const currentSidebarNote = workspaceSidebarNotes[activeView]
  const isWideLayout = layoutMode === "wide"
  const isCompactLayout = layoutMode === "compact"
  const isStackedLayout = layoutMode === "stacked"
  const isHorizontalHeader = !isStackedLayout
  const showSidebar = !isStackedLayout
  const isSidebarInteractive = showSidebar
  const effectiveSidebarCollapsed = isStackedLayout
    ? true
    : isCompactLayout
      ? !isCompactSidebarExpanded
      : isSidebarCollapsed
  const sidebarWidth = getSidebarWidth(effectiveSidebarCollapsed)
  const sidebarPadding = getSidebarPadding(effectiveSidebarCollapsed)
  const sidebarTransitionStyle = getSidebarTransitionStyle(prefersReducedMotion)
  const sidebarHeaderTransition = getSidebarHeaderTransition(prefersReducedMotion)
  const sidebarNoteContentTransition = getSidebarNoteContentTransition(prefersReducedMotion)
  const currentViewLabel = t(`shell.views.${activeView}`)
  const currentLocale = i18n.resolvedLanguage ?? i18n.language

  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }

    const html = document.documentElement
    const { body } = document
    const root = document.getElementById("root")

    html.style.overflowX = "hidden"
    body.style.overflowX = "hidden"
    html.style.overflowY = isStackedLayout ? "auto" : "hidden"
    body.style.overflowY = isStackedLayout ? "auto" : "hidden"
    html.style.overscrollBehavior = isStackedLayout ? "auto" : "none"
    body.style.overscrollBehavior = isStackedLayout ? "auto" : "none"

    if (root) {
      root.style.overflow = isStackedLayout ? "visible" : "hidden"
      root.style.height = isStackedLayout ? "auto" : "100%"
      root.style.minHeight = "100%"
    }

    return () => {
      html.style.removeProperty("overflow-x")
      body.style.removeProperty("overflow-x")
      html.style.removeProperty("overflow-y")
      body.style.removeProperty("overflow-y")
      html.style.removeProperty("overscroll-behavior")
      body.style.removeProperty("overscroll-behavior")

      if (root) {
        root.style.removeProperty("overflow")
        root.style.removeProperty("height")
        root.style.removeProperty("min-height")
      }
    }
  }, [isStackedLayout])

  const handleSidebarCollapseToggle = () => {
    if (isCompactLayout) {
      toggleCompactSidebarExpanded()
      return
    }

    toggleSidebarCollapsed()
  }

  const pageContent = (() => {
    switch (activeView) {
      case "reflection":
        return (
          <ReflectionPage
            draftExample={viewModel.reflectionDraftExample}
            reflections={viewModel.reflections}
            searchQuery={searchQuery}
            isStackedLayout={isStackedLayout}
          />
        )
      case "events":
        return (
          <EventsPage
            events={viewModel.events}
            searchQuery={searchQuery}
            isStackedLayout={isStackedLayout}
          />
        )
      case "finance":
        return (
          <FinancePage
            transactions={viewModel.transactions}
            searchQuery={searchQuery}
            isStackedLayout={isStackedLayout}
          />
        )
      case "shopping":
        return (
          <ShoppingPage
            shopping={viewModel.shoppingModule}
            searchQuery={searchQuery}
            isWideLayout={isWideLayout}
            isStackedLayout={isStackedLayout}
            isControlMode={isShoppingManagementMode}
            onRefresh={() => workspaceQuery.refetch()}
          />
        )
      case "nutrition":
        return (
          <NutritionPage
            nutrition={viewModel.nutritionModule}
            searchQuery={searchQuery}
            isStackedLayout={isStackedLayout}
          />
        )
      case "emotion":
        return (
          <EmotionPage
            emotionModule={viewModel.emotionModule}
            searchQuery={searchQuery}
            isStackedLayout={isStackedLayout}
          />
        )
      case "beliefs":
        return (
          <BeliefsPage
            beliefsModule={viewModel.beliefsModule}
            searchQuery={searchQuery}
            isStackedLayout={isStackedLayout}
          />
        )
      case "principles":
        return (
          <PrinciplesPage
            principlesModule={viewModel.principlesModule}
            searchQuery={searchQuery}
            isStackedLayout={isStackedLayout}
          />
        )
      case "relationships":
        return (
          <RelationshipsPage
            relationshipsModule={viewModel.relationshipsModule}
            searchQuery={searchQuery}
            isStackedLayout={isStackedLayout}
          />
        )
      case "journey":
        return (
          <JourneyPage
            journey={viewModel.journeyData}
            searchQuery={searchQuery}
            isStackedLayout={isStackedLayout}
          />
        )
      case "legacy":
        return (
          <LegacyPage
            legacy={viewModel.legacyModule}
            searchQuery={searchQuery}
            isStackedLayout={isStackedLayout}
          />
        )
      case "socioeconomics":
        return (
          <SocioeconomicsPage
            socioeconomicsModule={viewModel.socioeconomicsModule}
            searchQuery={searchQuery}
            isStackedLayout={isStackedLayout}
          />
        )
      case "future":
        return (
          <FuturePage
            futureBlueprint={viewModel.futureBlueprint}
            milestones={viewModel.milestones}
            searchQuery={searchQuery}
            isStackedLayout={isStackedLayout}
          />
        )
      case "overview":
      default:
        return (
          <OverviewPage
            dailyPulse={viewModel.dailyPulse}
            greeting={viewModel.greeting}
            recentRecords={viewModel.recentRecords}
            onNavigate={setActiveView}
            searchQuery={searchQuery}
            isStackedLayout={isStackedLayout}
          />
        )
    }
  })()

  return (
    <div
      data-testid="workspace-root"
      data-theme={theme.id}
      data-layout-mode={layoutMode}
      style={themeStyle}
      className={cn(
        "relative overflow-x-hidden",
        isStackedLayout
          ? "min-h-screen"
          : "[height:100dvh] h-screen max-h-screen overflow-hidden overscroll-none",
      )}
    >
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(var(--app-grid)_1px,transparent_1px),linear-gradient(90deg,var(--app-grid)_1px,transparent_1px)] bg-[size:24px_24px] opacity-30" />
      <div
        className={cn(
          "relative flex flex-col",
          isStackedLayout ? "min-h-full" : "h-full",
          showSidebar && "h-full flex-row overflow-hidden",
        )}
      >
        {showSidebar ? (
          <aside
            data-testid="workspace-sidebar"
            data-collapsed={effectiveSidebarCollapsed ? "true" : "false"}
            data-layout-mode={layoutMode}
            className="relative flex h-full shrink-0 flex-col overflow-hidden border-r border-[color:var(--surface-border)] backdrop-blur-xl"
            style={{
              width: `${sidebarWidth}px`,
              minWidth: `${sidebarWidth}px`,
              maxWidth: `${sidebarWidth}px`,
              paddingLeft: `${sidebarPadding.x}px`,
              paddingRight: `${sidebarPadding.x}px`,
              paddingTop: `${sidebarPadding.y}px`,
              paddingBottom: `${sidebarPadding.y}px`,
              transition: sidebarTransitionStyle,
              willChange: "width, padding",
            }}
          >
            <div className="absolute inset-0 -z-10" style={{ background: "var(--aside-bg)" }} />

            <div className="shrink-0">
              <m.div
                layout="position"
                transition={sidebarHeaderTransition}
                className="flex items-start"
              >
                <div className="flex min-w-0 flex-1 items-start gap-2">
                  <m.button
                    initial={false}
                    animate={{
                      x: getSidebarBrandIconOffset(effectiveSidebarCollapsed),
                    }}
                    transition={sidebarHeaderTransition}
                    type="button"
                    data-testid={
                      effectiveSidebarCollapsed && isSidebarInteractive
                        ? "sidebar-brand-toggle"
                        : undefined
                    }
                    onClick={
                      effectiveSidebarCollapsed && isSidebarInteractive
                        ? handleSidebarCollapseToggle
                        : undefined
                    }
                    aria-label={
                      effectiveSidebarCollapsed && isSidebarInteractive
                        ? t("shell.expandSidebar")
                        : undefined
                    }
                    aria-hidden={effectiveSidebarCollapsed ? undefined : true}
                    tabIndex={effectiveSidebarCollapsed && isSidebarInteractive ? 0 : -1}
                    className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-lg bg-[color:var(--text-primary)] text-[color:var(--hero-ink)] transition-opacity",
                      effectiveSidebarCollapsed
                        ? isSidebarInteractive
                          ? "cursor-pointer hover:opacity-90"
                          : "pointer-events-none cursor-default"
                        : "pointer-events-none cursor-default",
                    )}
                  >
                    <Sparkles className="size-4" />
                  </m.button>
                  <AnimatePresence initial={false}>
                    {effectiveSidebarCollapsed ? null : (
                      <m.div
                        key="sidebar-header-content"
                        initial={SIDEBAR_HEADER_CONTENT_PRESENCE.initial}
                        animate={SIDEBAR_HEADER_CONTENT_PRESENCE.animate}
                        exit={SIDEBAR_HEADER_CONTENT_PRESENCE.exit}
                        transition={sidebarHeaderTransition}
                        className="flex min-w-0 flex-1 items-start justify-between gap-3 overflow-hidden"
                      >
                        <div className="min-w-0 overflow-hidden">
                          <h1 className="truncate text-[1.15rem] font-semibold tracking-tight text-[color:var(--text-primary)]">
                            BetterToLive
                          </h1>
                          <p className="truncate text-sm text-[color:var(--text-muted)]">
                            {t("shell.brandSubtitle")}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <Badge
                            variant="outline"
                            className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                          >
                            {t("shell.modeBadge")}
                          </Badge>

                          <button
                            type="button"
                            data-testid="sidebar-toggle"
                            onClick={handleSidebarCollapseToggle}
                            aria-expanded={!effectiveSidebarCollapsed}
                            aria-label={t("shell.collapseSidebar")}
                            className="flex size-8 items-center justify-center rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text-primary)]"
                          >
                            <PanelLeftClose className="size-4" />
                          </button>
                          <LanguageToggle />
                        </div>
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
              </m.div>
            </div>

            <SidebarNavigation
              activeView={activeView}
              isCollapsed={effectiveSidebarCollapsed}
              onSelectView={setActiveView}
              sections={navSections}
            />

            <AnimatePresence initial={false}>
              {effectiveSidebarCollapsed ? null : (
                <m.div
                  key="sidebar-note-carousel-shell"
                  initial={SIDEBAR_BOTTOM_PANEL_PRESENCE.initial}
                  animate={SIDEBAR_BOTTOM_PANEL_PRESENCE.animate}
                  exit={SIDEBAR_BOTTOM_PANEL_PRESENCE.exit}
                  transition={SIDEBAR_FADE_TRANSITION}
                  className="mt-3 overflow-hidden"
                >
                  <m.div
                    initial={SIDEBAR_BOTTOM_PANEL_CONTENT_PRESENCE.initial}
                    animate={SIDEBAR_BOTTOM_PANEL_CONTENT_PRESENCE.animate}
                    exit={SIDEBAR_BOTTOM_PANEL_CONTENT_PRESENCE.exit}
                    transition={sidebarNoteContentTransition}
                    style={{
                      width: `${SIDEBAR_EXPANDED_CONTENT_FRAME_WIDTH}px`,
                      minWidth: `${SIDEBAR_EXPANDED_CONTENT_FRAME_WIDTH}px`,
                      maxWidth: `${SIDEBAR_EXPANDED_CONTENT_FRAME_WIDTH}px`,
                    }}
                  >
                    <SidebarNoteCarousel
                      key={activeView}
                      icon={Waypoints}
                      note={currentSidebarNote}
                    />
                  </m.div>
                </m.div>
              )}
            </AnimatePresence>
          </aside>
        ) : null}

        <main className={cn("min-w-0", !isStackedLayout && "flex flex-1 flex-col overflow-hidden")}>
          {isStackedLayout ? (
            <>
              <section
                className={cn(
                  "relative shrink-0 border-b border-[color:var(--surface-border)] px-4 py-4 backdrop-blur-xl",
                  UI_LAYERS.header,
                )}
              >
                <div
                  className="absolute inset-0 -z-10"
                  style={{ backgroundColor: "var(--aside-bg)" }}
                />
                <div className="mx-auto flex w-full max-w-[1500px] items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[color:var(--text-primary)] text-[color:var(--hero-ink)]">
                      <Sparkles className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="truncate text-[1.05rem] font-semibold tracking-tight text-[color:var(--text-primary)]">
                        BetterToLive
                      </h1>
                      <p className="text-sm text-[color:var(--text-muted)]">
                        {t("shell.brandSubtitle")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <LanguageToggle />
                    <Badge
                      variant="outline"
                      className="shrink-0 border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                    >
                      {t("shell.modeBadge")}
                    </Badge>
                  </div>
                </div>
              </section>
              <StackedNavigation
                activeView={activeView}
                onSelectView={setActiveView}
                sections={navSections}
              />
            </>
          ) : null}

          <header
            className={cn(
              "relative shrink-0 border-b border-[color:var(--surface-border)] px-4 py-4 backdrop-blur-xl",
              isWideLayout && "px-6 py-2.5",
              UI_LAYERS.header,
            )}
          >
            <div
              className={cn("absolute inset-x-0 top-0 -z-10 h-[88px]", isWideLayout && "h-[70px]")}
              style={{ backgroundColor: "var(--topbar-bg)" }}
            />
            <div
              className={cn(
                "mx-auto flex w-full max-w-[1500px] flex-col gap-3",
                isHorizontalHeader && "flex-row items-center justify-between",
                isWideLayout && "gap-2.5",
              )}
              data-testid="workspace-header-shell"
              data-orientation={isHorizontalHeader ? "row" : "column"}
            >
              <div className="min-w-0">
                <div className="text-xs tracking-[0.22em] text-[color:var(--text-muted)] uppercase">
                  {t("shell.tagline")}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <h2
                    className={cn(
                      "text-[1.35rem] font-semibold tracking-tight text-[color:var(--text-primary)]",
                      isWideLayout && "text-[1.2rem]",
                    )}
                  >
                    {currentViewLabel}
                  </h2>
                  <Badge
                    variant="outline"
                    className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                  >
                    {formatWorkspaceDate(new Date(), currentLocale)}
                  </Badge>
                </div>
              </div>

              <div
                className={cn(
                  "grid gap-3",
                  isHorizontalHeader &&
                    "ml-6 min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center",
                )}
                data-testid="workspace-header-actions"
              >
                <div
                  className={cn(
                    "relative min-w-0",
                    isHorizontalHeader ? "w-full max-w-[400px] justify-self-end" : "w-full",
                  )}
                >
                  <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
                  <Input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.currentTarget.value)}
                    className={cn(
                      "h-10 w-full border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] pl-9 text-sm text-[color:var(--text-primary)] shadow-none placeholder:text-[color:var(--text-muted)]",
                      isWideLayout && "h-8",
                    )}
                    placeholder={t("shell.searchPlaceholder")}
                    aria-label={t("shell.searchAria")}
                  />
                </div>
                <div
                  className={cn(
                    "flex items-center gap-3",
                    isHorizontalHeader ? "shrink-0 justify-end" : "flex-wrap justify-start",
                  )}
                >
                  <div className="shrink-0">
                    <WorkspaceUtilities
                      themeId={themeId}
                      themes={themes}
                      onSelectTheme={setThemeId}
                      notifications={notifications}
                      notificationFeed={notificationFeed}
                      unreadCount={unreadCount}
                      onNotify={notify}
                      onDismissNotification={dismissNotification}
                      onOpenNotificationDetail={openNotificationDetail}
                      onActivateNotificationTarget={activateNotificationTarget}
                      isPlaying={isPlaying}
                      isMusicSupported={isSupported}
                      musicPresetLabel={currentPreset.label}
                      musicDescription={currentPreset.description}
                      musicPresetId={presetId}
                      musicPresets={presets}
                      volume={volume}
                      onSelectMusicPreset={selectPreset}
                      onToggleMusic={togglePlayback}
                      onNudgeVolume={nudgeVolume}
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    className={cn(
                      "h-10 shrink-0 border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 text-[color:var(--text-primary)] hover:bg-[color:var(--muted-surface-bg)]",
                      isWideLayout && "h-8 px-2.5",
                    )}
                    onClick={() => setActiveView("reflection")}
                  >
                    <NotebookPen className="size-4" />
                    {t("shell.quickRecord")}
                  </Button>
                </div>
              </div>
            </div>
          </header>

          <div
            className={cn(
              "mx-auto w-full max-w-[1500px] px-4 py-5",
              !isStackedLayout && "flex min-h-0 flex-1 flex-col overflow-hidden",
              isWideLayout && "px-6 py-3",
            )}
          >
            {workspaceQuery.isError ? (
              <div
                className={cn(
                  "mb-4 flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50/90 px-4 py-3 text-sm text-amber-900",
                  !isStackedLayout && "shrink-0",
                )}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="size-4" />
                  {t("shell.apiErrorFallback")}
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-200 bg-white/80 text-amber-900 hover:bg-white"
                  onClick={() => void workspaceQuery.refetch()}
                >
                  <RefreshCcw className="size-3.5" />
                  {t("shell.apiErrorRetry")}
                </Button>
              </div>
            ) : null}
            <m.div
              key={activeView}
              initial={CONTENT_ENTER_PRESENCE.initial}
              animate={CONTENT_ENTER_PRESENCE.animate}
              exit={CONTENT_ENTER_PRESENCE.exit}
              transition={APP_FADE_TRANSITION}
              className={cn(!isStackedLayout && "h-full min-h-0 flex-1")}
            >
              {pageContent}
            </m.div>
          </div>
        </main>
      </div>
      <NotificationLayer
        notifications={notifications}
        selectedNotification={selectedNotification}
        onDismiss={dismissNotification}
        onOpenDetail={openNotificationDetail}
        onCloseDetail={closeNotificationDetail}
        onActivateTarget={activateNotificationTarget}
      />
      <Toaster />
      <RhythmPopup slides={workspaceRhythmSlides} />
    </div>
  )
}
