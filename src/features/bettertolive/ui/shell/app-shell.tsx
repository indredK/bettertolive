import {
  AlertTriangle,
  BookOpenText,
  Compass,
  Globe,
  HeartPulse,
  Landmark,
  LayoutDashboard,
  Lightbulb,
  ListTodo,
  NotebookPen,
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
import { ErrorBoundary } from "@/components/ui/error-boundary"
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
import { WorldHistoryPage } from "@/features/bettertolive/ui/worldhistory/world-history-page"
import { SidebarNoteCarousel } from "@/features/bettertolive/ui/shell/sidebar-carousel"
import { RhythmPopup } from "@/features/bettertolive/ui/shell/rhythm-popup"
import {
  getSidebarPadding,
  getSidebarTransitionStyle,
  getSidebarWidth,
  SIDEBAR_CAROUSEL_TRANSITION,
  SIDEBAR_EXPANDED_CONTENT_FRAME_WIDTH,
} from "@/features/bettertolive/ui/shell/sidebar-shell-motion"
import {
  SidebarNavigation,
  StackedNavigation,
} from "@/features/bettertolive/ui/shell/sidebar-navigation"
import { SettingsDialog } from "@/features/bettertolive/ui/shell/settings-dialog"
import { WorkspaceUtilities } from "@/features/bettertolive/ui/workspace-utilities"
import { formatWorkspaceDate } from "@/features/bettertolive/ui/shared/formatters"
import { UI_LAYERS } from "@/lib/ui-layers"
import { cn } from "@/lib/utils"
import { APP_FADE_TRANSITION, CONTENT_ENTER_PRESENCE } from "@/lib/app-motion"

const SCRAMBLE_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789$#@!&%+-"

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
    {
      title: t("shell.nav.groups.worldHistory"),
      items: [
        {
          view: "worldhistory",
          label: t("shell.nav.items.worldhistory.label"),
          hint: t("shell.nav.items.worldhistory.hint"),
          icon: Globe,
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

function scrambleLabel(label: string, revealProgress: number) {
  return label
    .split("")
    .map((character, index) => {
      if (character.trim().length === 0 || index < revealProgress) {
        return character
      }

      return SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)] ?? character
    })
    .join("")
}

function AnimatedBrandLabel({ label }: { label: string }) {
  const [displayLabel, setDisplayLabel] = useState(label)

  useEffect(() => {
    let frame = 0
    const maxFrames = Math.max(12, label.length * 4)
    const intervalId = window.setInterval(() => {
      frame += 1
      const revealProgress = frame / 3.6
      setDisplayLabel(scrambleLabel(label, revealProgress))

      if (frame >= maxFrames) {
        window.clearInterval(intervalId)
        setDisplayLabel(label)
      }
    }, 34)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [label])

  return <span>{displayLabel}</span>
}

function SidebarBrandTitle({ isActive, label }: { isActive: boolean; label: string }) {
  if (!isActive) {
    return <span>{label}</span>
  }

  // key forces remount on label change, giving a clean animation restart
  return <AnimatedBrandLabel key={label} label={label} />
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
    activeView,
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isSidebarBrandHovered, setIsSidebarBrandHovered] = useState(false)
  const navSections = useMemo(() => createNavSections(t), [t])
  const workspaceRhythmSlides = useMemo(() => createWorkspaceRhythmSlides(t), [t])
  const workspaceSidebarNotes = useMemo(() => createWorkspaceSidebarNotes(t), [t])
  const currentSidebarNote = workspaceSidebarNotes[activeView]
  const isWideLayout = layoutMode === "wide"
  const isCompactLayout = layoutMode === "compact"
  const isStackedLayout = layoutMode === "stacked"
  const usesEmbeddedFilterSearch =
    activeView === "beliefs" || activeView === "journey" || activeView === "relationships"
  const isHorizontalHeader = !isStackedLayout
  const showSidebar = !isStackedLayout
  const effectiveSidebarCollapsed = isStackedLayout
    ? true
    : isCompactLayout
      ? !isCompactSidebarExpanded
      : isSidebarCollapsed
  const sidebarWidth = getSidebarWidth(effectiveSidebarCollapsed)
  const sidebarPadding = getSidebarPadding(effectiveSidebarCollapsed)
  const sidebarTransitionStyle = getSidebarTransitionStyle()
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
            editableReflectionModule={workspaceQuery.workspaceSnapshot.reflection}
            draftExample={viewModel.reflectionDraftExample}
            reflections={viewModel.reflections}
            isControlMode={isShoppingManagementMode}
            isStackedLayout={isStackedLayout}
          />
        )
      case "events":
        return (
          <EventsPage
            editableEventsModule={workspaceQuery.workspaceSnapshot.events}
            events={viewModel.events}
            isControlMode={isShoppingManagementMode}
            isStackedLayout={isStackedLayout}
          />
        )
      case "finance":
        return (
          <FinancePage
            financeModule={{
              ...workspaceQuery.workspaceSnapshot.finance,
              entries: viewModel.transactions,
            }}
            editableFinanceModule={workspaceQuery.workspaceSnapshot.finance}
            isControlMode={isShoppingManagementMode}
            isStackedLayout={isStackedLayout}
          />
        )
      case "shopping":
        return (
          <ShoppingPage
            shopping={viewModel.shoppingModule}
            searchQuery={searchQuery}
            isStackedLayout={isStackedLayout}
            isControlMode={isShoppingManagementMode}
            onRefresh={() => workspaceQuery.refetch()}
          />
        )
      case "nutrition":
        return (
          <NutritionPage
            nutrition={viewModel.nutritionModule}
            editableNutrition={workspaceQuery.workspaceSnapshot.nutrition}
            isControlMode={isShoppingManagementMode}
            isStackedLayout={isStackedLayout}
          />
        )
      case "emotion":
        return (
          <EmotionPage
            emotionModule={viewModel.emotionModule}
            editableEmotionModule={workspaceQuery.workspaceSnapshot.emotion}
            isControlMode={isShoppingManagementMode}
            isStackedLayout={isStackedLayout}
          />
        )
      case "beliefs":
        return (
          <BeliefsPage
            beliefsModule={viewModel.beliefsModule}
            isControlMode={isShoppingManagementMode}
            isStackedLayout={isStackedLayout}
            onRefresh={() => workspaceQuery.refetch()}
          />
        )
      case "principles":
        return (
          <PrinciplesPage
            principlesModule={viewModel.principlesModule}
            editablePrinciplesModule={workspaceQuery.workspaceSnapshot.principles}
            isControlMode={isShoppingManagementMode}
            isStackedLayout={isStackedLayout}
            onRefresh={() => workspaceQuery.refetch()}
          />
        )
      case "relationships":
        return (
          <RelationshipsPage
            relationshipsModule={viewModel.relationshipsModule}
            editableRelationshipsModule={workspaceQuery.workspaceSnapshot.relationships}
            isStackedLayout={isStackedLayout}
            isControlMode={isShoppingManagementMode}
            onRefresh={() => workspaceQuery.refetch()}
          />
        )
      case "journey":
        return (
          <JourneyPage
            journey={viewModel.journeyData}
            editableGrowth={workspaceQuery.workspaceSnapshot.growth}
            editableMemory={workspaceQuery.workspaceSnapshot.memory}
            isControlMode={isShoppingManagementMode}
            isStackedLayout={isStackedLayout}
          />
        )
      case "legacy":
        return (
          <LegacyPage
            legacy={viewModel.legacyModule}
            isStackedLayout={isStackedLayout}
            isControlMode={isShoppingManagementMode}
            onRefresh={() => workspaceQuery.refetch()}
          />
        )
      case "socioeconomics":
        return (
          <SocioeconomicsPage
            socioeconomicsModule={viewModel.socioeconomicsModule}
            sourceSocioeconomicsModule={workspaceQuery.workspaceSnapshot.socioeconomics}
            isControlMode={isShoppingManagementMode}
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
            isControlMode={isShoppingManagementMode}
            onRefresh={() => workspaceQuery.refetch()}
          />
        )
      case "worldhistory":
        return (
          <WorldHistoryPage
            isStackedLayout={isStackedLayout}
            isControlMode={isShoppingManagementMode}
          />
        )
      case "overview":
      default:
        return (
          <OverviewPage
            dailyPulse={viewModel.dailyPulse}
            recentRecords={viewModel.recentRecords}
            onNavigate={setActiveView}
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
            }}
          >
            <div className="absolute inset-0 -z-10" style={{ background: "var(--aside-bg)" }} />

            <div className="shrink-0">
              <m.button
                type="button"
                data-testid="sidebar-brand-toggle"
                onClick={handleSidebarCollapseToggle}
                onHoverStart={() => setIsSidebarBrandHovered(true)}
                onHoverEnd={() => setIsSidebarBrandHovered(false)}
                onFocus={() => setIsSidebarBrandHovered(true)}
                onBlur={() => setIsSidebarBrandHovered(false)}
                aria-expanded={!effectiveSidebarCollapsed}
                aria-label={
                  effectiveSidebarCollapsed ? t("shell.expandSidebar") : t("shell.collapseSidebar")
                }
                className="group flex h-14 w-full cursor-pointer items-center rounded-lg px-[10px] text-left focus-visible:ring-2 focus-visible:ring-[color:var(--text-primary)]/20 focus-visible:outline-none"
              >
                <div className={cn("flex min-w-0 flex-1 items-center gap-2")}>
                  <div className="relative flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[color:var(--nav-active-icon-bg)] text-[color:var(--nav-active-icon-ink)]">
                    <m.span
                      aria-hidden
                      initial={false}
                      animate={
                        prefersReducedMotion
                          ? { opacity: 0 }
                          : isSidebarBrandHovered
                            ? { opacity: [0, 0.9, 0], x: ["-140%", "220%"] }
                            : { opacity: 0, x: "-140%" }
                      }
                      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                      className="pointer-events-none absolute inset-y-0 left-[-32%] w-1/2 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.18),rgba(255,255,255,0.95),rgba(255,255,255,0.18),transparent)] mix-blend-screen"
                    />
                    <Sparkles className="size-4" />
                  </div>
                  {effectiveSidebarCollapsed ? null : (
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3 overflow-hidden">
                      <div className="min-w-0 overflow-hidden">
                        <h1 className="truncate text-[1.15rem] font-semibold tracking-tight text-[color:var(--text-primary)]">
                          <SidebarBrandTitle
                            isActive={isSidebarBrandHovered && !prefersReducedMotion}
                            label="BetterToLive"
                          />
                        </h1>
                        <p className="truncate text-sm text-[color:var(--text-muted)]">
                          {t("shell.brandSubtitle")}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </m.button>
            </div>

            <SidebarNavigation
              activeView={activeView}
              isCollapsed={effectiveSidebarCollapsed}
              onSelectView={setActiveView}
              sections={navSections}
            />

            <AnimatePresence initial={false}>
              {!effectiveSidebarCollapsed && (
                <m.div
                  key="sidebar-carousel"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={SIDEBAR_CAROUSEL_TRANSITION}
                  className="mt-3"
                  style={{ width: SIDEBAR_EXPANDED_CONTENT_FRAME_WIDTH }}
                >
                  <SidebarNoteCarousel
                    key={activeView}
                    icon={Waypoints}
                    note={currentSidebarNote}
                  />
                </m.div>
              )}
            </AnimatePresence>
          </aside>
        ) : null}

        <main className={cn("min-w-0", !isStackedLayout && "flex flex-1 flex-col overflow-hidden")}>
          {isStackedLayout ? (
            <>
              <section className={cn("relative h-14 shrink-0 px-4", UI_LAYERS.header)}>
                <div
                  className="absolute inset-0 -z-10"
                  style={{ backgroundColor: "var(--aside-bg)" }}
                />
                <div className="mx-auto flex h-full w-full max-w-[1500px] items-center gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[color:var(--text-primary)] text-[color:var(--hero-ink)]">
                      <Sparkles className="size-4" />
                    </div>
                    <div className="min-w-0">
                      <h1 className="truncate text-[1.05rem] font-semibold tracking-tight text-[color:var(--text-primary)]">
                        BetterToLive
                      </h1>
                    </div>
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
            className={cn("relative h-14 shrink-0 px-4", isWideLayout && "px-6", UI_LAYERS.header)}
          >
            <div
              className="absolute inset-x-0 top-0 -z-10 h-full"
              style={{ backgroundColor: "var(--topbar-bg)" }}
            />
            <div
              className={cn(
                "mx-auto flex h-full w-full max-w-[1500px] items-center",
                isHorizontalHeader ? "flex-row justify-between" : "flex-col justify-center gap-3",
              )}
              data-testid="workspace-header-shell"
              data-orientation={isHorizontalHeader ? "row" : "column"}
            >
              <div className="flex min-w-0 flex-wrap items-center gap-3">
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

              <div
                className={cn(
                  usesEmbeddedFilterSearch ? "flex justify-end gap-3" : "grid gap-3",
                  isHorizontalHeader &&
                    !usesEmbeddedFilterSearch &&
                    "ml-6 min-w-0 flex-1 grid-cols-[minmax(0,1fr)_auto] items-center",
                )}
                data-testid="workspace-header-actions"
              >
                {usesEmbeddedFilterSearch ? null : (
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
                )}
                <div
                  className={cn(
                    "flex items-center gap-3",
                    isHorizontalHeader ? "shrink-0 justify-end" : "flex-wrap justify-start",
                  )}
                >
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
                      onOpenSettings={() => setIsSettingsOpen(true)}
                    />
                  </div>
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
            <AnimatePresence initial={false} mode="wait">
              <m.div
                key={activeView}
                initial={CONTENT_ENTER_PRESENCE.initial}
                animate={CONTENT_ENTER_PRESENCE.animate}
                exit={CONTENT_ENTER_PRESENCE.exit}
                transition={APP_FADE_TRANSITION}
                className={cn(!isStackedLayout && "h-full min-h-0 flex-1")}
              >
                <ErrorBoundary>{pageContent}</ErrorBoundary>
              </m.div>
            </AnimatePresence>
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
      <SettingsDialog
        open={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        themeId={themeId}
        themes={themes}
        onSelectTheme={setThemeId}
      />
    </div>
  )
}
