import {
  HeartPulse,
  LibraryBig,
  BookOpenText,
  CalendarDays,
  Compass,
  Lightbulb,
  NotebookPen,
  Route,
  ScrollText,
  Sparkles,
  Target,
  Users2,
  Wallet,
  Waypoints,
} from "lucide-react"
import { useTranslation } from "react-i18next"

import type { AppView, RecentRecord } from "@/features/bettertolive/types"
import {
  EmptyState,
  QuickActionButton,
  RecordStream,
  SectionHeading,
  Surface,
} from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"

export function OverviewPage({
  dailyPulse,
  recentRecords,
  onNavigate,
  isStackedLayout = false,
}: {
  dailyPulse: string[]
  recentRecords: RecentRecord[]
  onNavigate: (view: AppView) => void
  isStackedLayout?: boolean
}) {
  const { t } = useTranslation()
  const isFixedLayout = !isStackedLayout
  const pageLogicItems = [
    {
      title: t("overview.logic.record.title"),
      detail: t("overview.logic.record.detail"),
    },
    {
      title: t("overview.logic.inner.title"),
      detail: t("overview.logic.inner.detail"),
    },
    {
      title: t("overview.logic.selfMap.title"),
      detail: t("overview.logic.selfMap.detail"),
    },
    {
      title: t("overview.logic.legacyFuture.title"),
      detail: t("overview.logic.legacyFuture.detail"),
    },
  ]
  const quickActions = [
    {
      icon: NotebookPen,
      label: t("overview.quickActions.reflection.label"),
      description: t(
        "overview.quickActions.reflection.description",
        "把此刻的想法和感受先放下来。",
      ),
      view: "reflection" as const,
    },
    {
      icon: BookOpenText,
      label: t("overview.quickActions.events.label"),
      description: t(
        "overview.quickActions.events.description",
        "补一段事件时间线，留住最近生活片段。",
      ),
      view: "events" as const,
    },
    {
      icon: Wallet,
      label: t("overview.quickActions.finance.label"),
      description: t("overview.quickActions.finance.description"),
      view: "finance" as const,
    },
    {
      icon: HeartPulse,
      label: t("overview.quickActions.emotion.label"),
      description: t(
        "overview.quickActions.emotion.description",
        "把最近的心理天气和触发因素放到同一页里看。",
      ),
      view: "emotion" as const,
    },
    {
      icon: Compass,
      label: t("overview.quickActions.future.label"),
      description: t(
        "overview.quickActions.future.description",
        "把理想自我和生活方式说得更清楚。",
      ),
      view: "future" as const,
    },
    {
      icon: Lightbulb,
      label: t("overview.quickActions.beliefs.label"),
      description: t(
        "overview.quickActions.beliefs.description",
        "看看人生观、世界观和价值观现在是什么样子。",
      ),
      view: "beliefs" as const,
    },
    {
      icon: Users2,
      label: t("overview.quickActions.relationships.label"),
      description: t(
        "overview.quickActions.relationships.description",
        "把重要人物、关系模式和没说出口的话放到一起。",
      ),
      view: "relationships" as const,
    },
    {
      icon: LibraryBig,
      label: t("overview.quickActions.journey.label"),
      description: t(
        "overview.quickActions.journey.description",
        "把人生阶段、节点和地点物件背后的记忆重新连起来。",
      ),
      view: "journey" as const,
    },
    {
      icon: ScrollText,
      label: t("overview.quickActions.legacy.label"),
      description: t(
        "overview.quickActions.legacy.description",
        "把留给未来的话、牵挂和交代先安放好。",
      ),
      view: "legacy" as const,
    },
  ]

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <div
        className={cn(
          "grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.92fr)]",
          isFixedLayout && "min-h-0 flex-1 overflow-hidden",
        )}
      >
        <div className={cn("space-y-4", isFixedLayout && "flex min-h-0 flex-col overflow-hidden")}>
          <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-1 flex-col")}>
            <SectionHeading
              icon={CalendarDays}
              title={t("overview.sections.recent.title")}
              description={t("overview.sections.recent.description")}
            />

            <div className={cn("mt-5", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}>
              {recentRecords.length > 0 ? (
                <RecordStream records={recentRecords} />
              ) : (
                <EmptyState message={t("overview.empty.recent")} />
              )}
            </div>
          </Surface>
        </div>

        <div className={cn("space-y-4", isFixedLayout && "min-h-0 overflow-y-auto pr-1")}>
          <Surface className="p-5">
            <SectionHeading
              icon={Waypoints}
              title={t("overview.sections.logic.title")}
              description={t("overview.sections.logic.description")}
            />

            <div className="mt-5 space-y-3">
              {pageLogicItems.map((entry) => (
                <div
                  key={entry.title}
                  className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]"
                >
                  <div className="font-medium text-[color:var(--text-primary)]">{entry.title}</div>
                  <div className="mt-1">{entry.detail}</div>
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="p-5">
            <SectionHeading
              icon={Target}
              title={t("overview.sections.pulse.title")}
              description={t("overview.sections.pulse.description")}
            />

            <div className="mt-5 space-y-3">
              {dailyPulse.map((entry) => (
                <div
                  key={entry}
                  className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]"
                >
                  {entry}
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="p-5">
            <SectionHeading
              icon={Sparkles}
              title={t("overview.sections.quick.title")}
              description={t("overview.sections.quick.description")}
            />

            <div className="mt-5 grid gap-2 min-[960px]:grid-cols-2">
              {quickActions.map((action) => (
                <QuickActionButton
                  key={action.view}
                  icon={action.icon}
                  label={action.label}
                  description={action.description}
                  onClick={() => onNavigate(action.view)}
                />
              ))}
            </div>

            <div className="mt-4 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4 text-sm leading-6 text-[color:var(--text-muted)]">
              <div className="flex items-center gap-2 font-medium text-[color:var(--text-primary)]">
                <Route className="size-4" />
                {t("overview.currentFocus.title")}
              </div>
              <p className="mt-2">
                {t(
                  "overview.currentFocus.description",
                  "先把新增模块都接进同一张桌子上，保证能看、能切换、能带着基础数据一起成立。",
                )}
              </p>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  )
}
