import {
  AlertTriangle,
  BookOpenText,
  CalendarDays,
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
  ShieldAlert,
  Sparkles,
  Users2,
  Wallet,
  Waypoints,
  type LucideIcon,
} from "lucide-react"
import { AnimatePresence, m } from "motion/react"
import { useEffect, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AppView } from "@/features/bettertolive/types"
import {
  workspaceRhythmSlides,
  workspaceSidebarNotes,
} from "@/features/bettertolive/config/sidebar"
import { useWorkspaceNotifications } from "@/features/bettertolive/hooks/use-workspace-notifications"
import { useWorkspaceMusic } from "@/features/bettertolive/hooks/use-workspace-music"
import { useWorkspaceTheme } from "@/features/bettertolive/hooks/use-workspace-theme"
import { useWorkspaceViewRoute } from "@/features/bettertolive/hooks/use-workspace-view-route"
import { useWorkspaceViewModel } from "@/features/bettertolive/hooks/use-workspace-view-model"
import { useWorkspaceSnapshotQuery } from "@/features/bettertolive/queries/use-workspace-snapshot-query"
import { useWorkspaceUiStore } from "@/features/bettertolive/stores/workspace-ui-store"
import { getWorkspaceViewLabel } from "@/features/bettertolive/config/view-labels"
import { EventsPage } from "@/features/bettertolive/ui/events/events-page"
import { FinancePage } from "@/features/bettertolive/ui/finance/finance-page"
import { FuturePage } from "@/features/bettertolive/ui/future/future-page"
import { BeliefsPage } from "@/features/bettertolive/ui/beliefs/beliefs-page"
import { CrisisPage } from "@/features/bettertolive/ui/crisis/crisis-page"
import { EmotionPage } from "@/features/bettertolive/ui/emotion/emotion-page"
import { JourneyPage } from "@/features/bettertolive/ui/journey/journey-page"
import { LegacyPage } from "@/features/bettertolive/ui/legacy/legacy-page"
import { NotificationLayer } from "@/features/bettertolive/ui/shared/notification-layer"
import { NutritionPage } from "@/features/bettertolive/ui/nutrition/nutrition-page"
import { OverviewPage } from "@/features/bettertolive/ui/overview/overview-page"
import { PrinciplesPage } from "@/features/bettertolive/ui/principles/principles-page"
import { ReflectionPage } from "@/features/bettertolive/ui/reflection/reflection-page"
import { RelationshipsPage } from "@/features/bettertolive/ui/relationships/relationships-page"
import { ShoppingPage } from "@/features/bettertolive/ui/shopping/shopping-page"
import { SocioeconomicsPage } from "@/features/bettertolive/ui/socioeconomics/socioeconomics-page"
import {
  SidebarNoteCarousel,
  SidebarRhythmCarousel,
} from "@/features/bettertolive/ui/shell/sidebar-carousel"
import {
  SidebarNavigation,
  StackedNavigation,
} from "@/features/bettertolive/ui/shell/sidebar-navigation"
import { WorkspaceUtilities } from "@/features/bettertolive/ui/workspace-utilities"
import { UI_LAYERS } from "@/lib/ui-layers"
import { cn } from "@/lib/utils"
import {
  APP_FADE_TRANSITION,
  CONTENT_ENTER_PRESENCE,
  SIDEBAR_COPY_PRESENCE,
  SIDEBAR_FADE_TRANSITION,
  SIDEBAR_LAYOUT_TRANSITION,
  SIDEBAR_PANEL_PRESENCE,
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

const NAV_SECTIONS: Array<{
  title: string
  items: NavItem[]
}> = [
  {
    title: "工作台",
    items: [
      {
        view: "overview",
        label: "总览",
        hint: "先看整张桌子",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "记录",
    items: [
      {
        view: "reflection",
        label: "反思",
        hint: "情绪和想法入口",
        icon: NotebookPen,
      },
      {
        view: "events",
        label: "记事",
        hint: "生活时间线",
        icon: BookOpenText,
      },
      {
        view: "finance",
        label: "记账",
        hint: "现实资源流向",
        icon: Wallet,
      },
      {
        view: "shopping",
        label: "购物",
        hint: "欲望和日常选择",
        icon: ListTodo,
      },
      {
        view: "nutrition",
        label: "饮食",
        hint: "吃在生活里的位置",
        icon: Salad,
      },
    ],
  },
  {
    title: "内在状态",
    items: [
      {
        view: "emotion",
        label: "情绪情感",
        hint: "波动、触发和恢复方式",
        icon: HeartPulse,
      },
      {
        view: "crisis",
        label: "危机支持",
        hint: "低谷时先做什么",
        icon: ShieldAlert,
      },
    ],
  },
  {
    title: "自我图谱",
    items: [
      {
        view: "beliefs",
        label: "观念",
        hint: "人生观世界观价值观",
        icon: Lightbulb,
      },
      {
        view: "principles",
        label: "原则",
        hint: "原则底线和边界",
        icon: Scale,
      },
      {
        view: "relationships",
        label: "关系深化",
        hint: "重要人物、关系事件与模式",
        icon: Users2,
      },
      {
        view: "journey",
        label: "成长记忆",
        hint: "人生阶段、节点与影响",
        icon: Route,
      },
    ],
  },
  {
    title: "生命整理",
    items: [
      {
        view: "legacy",
        label: "生命整理",
        hint: "重要交代和留给未来的话",
        icon: ScrollText,
      },
    ],
  },
  {
    title: "外部世界",
    items: [
      {
        view: "socioeconomics",
        label: "社会经济",
        hint: "外部经济世界的认知地图",
        icon: Landmark,
      },
    ],
  },
  {
    title: "方向",
    items: [
      {
        view: "future",
        label: "未来",
        hint: "理想自我和生活方向",
        icon: Compass,
      },
    ],
  },
]

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
  const activeView = useWorkspaceUiStore((state) => state.activeView)
  const isSidebarCollapsed = useWorkspaceUiStore((state) => state.isSidebarCollapsed)
  const isCompactSidebarExpanded = useWorkspaceUiStore((state) => state.isCompactSidebarExpanded)
  const searchQuery = useWorkspaceUiStore((state) => state.searchQuery)
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
  const currentViewLabel = getWorkspaceViewLabel(activeView)

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
            expenseTotal={viewModel.visibleExpenseTotal}
            incomeTotal={viewModel.visibleIncomeTotal}
            searchQuery={searchQuery}
            isStackedLayout={isStackedLayout}
          />
        )
      case "shopping":
        return (
          <ShoppingPage
            shopping={viewModel.shoppingModule}
            visibleCount={viewModel.visibleShoppingCount}
            searchQuery={searchQuery}
            isWideLayout={isWideLayout}
            isStackedLayout={isStackedLayout}
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
            checkIns={viewModel.emotionCheckIns}
            trend={viewModel.emotionTrend}
            triggers={viewModel.emotionTriggers}
            tools={viewModel.emotionTools}
            searchQuery={searchQuery}
            isStackedLayout={isStackedLayout}
          />
        )
      case "crisis":
        return (
          <CrisisPage
            currentState={viewModel.crisisCurrentState}
            warningSigns={viewModel.crisisWarningSigns}
            contacts={viewModel.crisisContacts}
            steps={viewModel.crisisSteps}
            reviewNotes={viewModel.crisisReviewNotes}
            searchQuery={searchQuery}
            isStackedLayout={isStackedLayout}
          />
        )
      case "beliefs":
        return (
          <BeliefsPage
            beliefCards={viewModel.beliefCards}
            questions={viewModel.beliefQuestions}
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
            visibleRelationshipCount={viewModel.visibleRelationshipCount}
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
            entries={viewModel.socioeconomicsEntries}
            gaps={viewModel.socioeconomicsGaps}
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
            reflections={viewModel.reflections}
            events={viewModel.events}
            futureMilestoneCount={viewModel.futureBlueprint.milestones.length}
            greeting={viewModel.greeting}
            transactions={viewModel.transactions}
            recentRecords={viewModel.recentRecords}
            emotionCheckInCount={viewModel.emotionCheckIns.length}
            emotionTrendCount={viewModel.emotionTrend.length}
            crisisStepCount={viewModel.crisisSteps.length}
            beliefCount={viewModel.beliefCards.length}
            principleCount={viewModel.principles.length}
            relationshipCount={viewModel.visibleRelationshipCount}
            journeyStageCount={viewModel.journeyData.growthNodes.length}
            journeyNodeCount={viewModel.journeyData.memories.length}
            legacyDirectiveCount={viewModel.legacyDirectives.length}
            legacyLetterCount={viewModel.legacyLetters.length}
            shoppingCount={viewModel.visibleShoppingCount}
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
      <m.div
        layout
        transition={SIDEBAR_LAYOUT_TRANSITION}
        className={cn(
          "relative flex flex-col",
          isStackedLayout ? "min-h-full" : "h-full",
          showSidebar && "h-full flex-row overflow-hidden",
        )}
      >
        {showSidebar ? (
          <m.aside
            layout
            transition={SIDEBAR_LAYOUT_TRANSITION}
            data-testid="workspace-sidebar"
            data-collapsed={effectiveSidebarCollapsed ? "true" : "false"}
            data-layout-mode={layoutMode}
            className={cn(
              "relative shrink-0 border-r border-[color:var(--surface-border)] backdrop-blur-xl",
              effectiveSidebarCollapsed
                ? "flex h-full w-[92px] flex-col overflow-hidden px-3 py-4"
                : "flex h-full w-[292px] flex-col overflow-hidden px-5 py-5",
            )}
          >
            <div className="absolute inset-0 -z-10" style={{ background: "var(--aside-bg)" }} />

            <div className="shrink-0">
              <div
                className={cn(
                  "flex items-start",
                  effectiveSidebarCollapsed ? "justify-center" : "justify-between gap-3",
                )}
              >
                <div
                  className={cn(
                    "flex items-center gap-2",
                    effectiveSidebarCollapsed && "justify-center",
                  )}
                >
                  <m.button
                    layout
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
                      effectiveSidebarCollapsed && isSidebarInteractive ? "展开菜单列" : undefined
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
                        key="sidebar-brand-copy"
                        layout
                        initial={SIDEBAR_COPY_PRESENCE.initial}
                        animate={SIDEBAR_COPY_PRESENCE.animate}
                        exit={SIDEBAR_COPY_PRESENCE.exit}
                        transition={SIDEBAR_FADE_TRANSITION}
                        className="overflow-hidden"
                      >
                        <h1 className="text-[1.15rem] font-semibold tracking-tight text-[color:var(--text-primary)]">
                          BetterToLive
                        </h1>
                        <p className="text-sm text-[color:var(--text-muted)]">个人的人生工作台</p>
                      </m.div>
                    )}
                  </AnimatePresence>
                </div>
                <AnimatePresence initial={false}>
                  {effectiveSidebarCollapsed ? null : (
                    <m.div
                      key="sidebar-meta-panel"
                      layout
                      initial={SIDEBAR_PANEL_PRESENCE.initial}
                      animate={SIDEBAR_PANEL_PRESENCE.animate}
                      exit={SIDEBAR_PANEL_PRESENCE.exit}
                      transition={SIDEBAR_FADE_TRANSITION}
                      className="flex shrink-0 flex-col items-end gap-2 overflow-hidden"
                    >
                      <Badge
                        variant="outline"
                        className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                      >
                        V1 Mock
                      </Badge>

                      <button
                        type="button"
                        data-testid="sidebar-toggle"
                        onClick={handleSidebarCollapseToggle}
                        aria-expanded={!effectiveSidebarCollapsed}
                        aria-label="收起菜单列"
                        className="flex size-8 items-center justify-center rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)] transition-colors hover:text-[color:var(--text-primary)]"
                      >
                        <PanelLeftClose className="size-4" />
                      </button>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence initial={false}>
                {effectiveSidebarCollapsed ? null : (
                  <m.div
                    key="sidebar-rhythm-carousel-shell"
                    layout
                    initial={SIDEBAR_PANEL_PRESENCE.initial}
                    animate={SIDEBAR_PANEL_PRESENCE.animate}
                    exit={SIDEBAR_PANEL_PRESENCE.exit}
                    transition={SIDEBAR_FADE_TRANSITION}
                    className="overflow-hidden"
                  >
                    <SidebarRhythmCarousel
                      icon={CalendarDays}
                      slides={workspaceRhythmSlides}
                      title="今日节奏"
                    />
                  </m.div>
                )}
              </AnimatePresence>
            </div>

            <SidebarNavigation
              activeView={activeView}
              isCollapsed={effectiveSidebarCollapsed}
              onSelectView={setActiveView}
              sections={NAV_SECTIONS}
            />

            <AnimatePresence initial={false}>
              {effectiveSidebarCollapsed ? null : (
                <m.div
                  key="sidebar-note-carousel-shell"
                  layout
                  initial={SIDEBAR_PANEL_PRESENCE.initial}
                  animate={SIDEBAR_PANEL_PRESENCE.animate}
                  exit={SIDEBAR_PANEL_PRESENCE.exit}
                  transition={SIDEBAR_FADE_TRANSITION}
                  className="overflow-hidden"
                >
                  <SidebarNoteCarousel
                    key={activeView}
                    icon={Waypoints}
                    note={currentSidebarNote}
                  />
                </m.div>
              )}
            </AnimatePresence>
          </m.aside>
        ) : null}

        <m.main
          layout
          transition={SIDEBAR_LAYOUT_TRANSITION}
          className={cn("min-w-0", !isStackedLayout && "flex flex-1 flex-col overflow-hidden")}
        >
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
                      <p className="text-sm text-[color:var(--text-muted)]">个人的人生工作台</p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className="shrink-0 border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                  >
                    V1 Mock
                  </Badge>
                </div>
              </section>
              <StackedNavigation
                activeView={activeView}
                onSelectView={setActiveView}
                sections={NAV_SECTIONS}
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
                  本地优先 / 自我认知系统
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
                    {new Intl.DateTimeFormat("zh-CN", {
                      month: "long",
                      day: "numeric",
                      weekday: "long",
                    }).format(new Date())}
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
                    placeholder="搜索记录、观念、关系或成长线索"
                    aria-label="搜索记录和页面内容"
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
                    快速记录
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
                  当前接口请求失败，页面已回退到本地 mock 数据。
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-amber-200 bg-white/80 text-amber-900 hover:bg-white"
                  onClick={() => void workspaceQuery.refetch()}
                >
                  <RefreshCcw className="size-3.5" />
                  重试
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
        </m.main>
      </m.div>
      <NotificationLayer
        notifications={notifications}
        selectedNotification={selectedNotification}
        onDismiss={dismissNotification}
        onOpenDetail={openNotificationDetail}
        onCloseDetail={closeNotificationDetail}
        onActivateTarget={activateNotificationTarget}
      />
    </div>
  )
}
