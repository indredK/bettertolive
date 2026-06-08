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
  PageIntro,
  QuickActionButton,
  RecordStream,
  SectionHeading,
  Surface,
} from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"

export function OverviewPage({
  greeting,
  dailyPulse,
  recentRecords,
  onNavigate,
  searchQuery,
  isStackedLayout = false,
}: {
  greeting: string
  dailyPulse: string[]
  recentRecords: RecentRecord[]
  onNavigate: (view: AppView) => void
  searchQuery: string
  isStackedLayout?: boolean
}) {
  const { t } = useTranslation()
  const isFixedLayout = !isStackedLayout
  const pageLogicItems = [
    {
      title: t("overview.logic.record.title", "记录工作台"),
      detail: t(
        "overview.logic.record.detail",
        "反思、记事、记账、购物，负责承接你现在到底在怎么生活。",
      ),
    },
    {
      title: t("overview.logic.inner.title", "内在状态"),
      detail: t(
        "overview.logic.inner.detail",
        "情绪情感页负责承接最近的心理波动、触发因素，以及对自己有效的恢复方式。",
      ),
    },
    {
      title: t("overview.logic.selfMap.title", "自我图谱"),
      detail: t(
        "overview.logic.selfMap.detail",
        "观念、原则、关系深化、成长、记忆节点，负责解释你为什么会变成现在这样的人。",
      ),
    },
    {
      title: t("overview.logic.legacyFuture.title", "生命整理与未来"),
      detail: t(
        "overview.logic.legacyFuture.detail",
        "生命整理负责安放重要的话和托付，未来蓝图负责把理想自我和阶段路径放到前面。",
      ),
    },
  ]
  const quickActions = [
    {
      icon: NotebookPen,
      label: t("overview.quickActions.reflection.label", "写一条反思"),
      description: t(
        "overview.quickActions.reflection.description",
        "把此刻的想法和感受先放下来。",
      ),
      view: "reflection" as const,
    },
    {
      icon: BookOpenText,
      label: t("overview.quickActions.events.label", "记一件事"),
      description: t(
        "overview.quickActions.events.description",
        "补一段事件时间线，留住最近生活片段。",
      ),
      view: "events" as const,
    },
    {
      icon: Wallet,
      label: t("overview.quickActions.finance.label", "记一笔支出"),
      description: t("overview.quickActions.finance.description", "让现实选择和生活方式一眼可见。"),
      view: "finance" as const,
    },
    {
      icon: HeartPulse,
      label: t("overview.quickActions.emotion.label", "看情绪波动"),
      description: t(
        "overview.quickActions.emotion.description",
        "把最近的心理天气和触发因素放到同一页里看。",
      ),
      view: "emotion" as const,
    },
    {
      icon: Compass,
      label: t("overview.quickActions.future.label", "补未来方向"),
      description: t(
        "overview.quickActions.future.description",
        "把理想自我和生活方式说得更清楚。",
      ),
      view: "future" as const,
    },
    {
      icon: Lightbulb,
      label: t("overview.quickActions.beliefs.label", "打开观念图谱"),
      description: t(
        "overview.quickActions.beliefs.description",
        "看看人生观、世界观和价值观现在是什么样子。",
      ),
      view: "beliefs" as const,
    },
    {
      icon: Users2,
      label: t("overview.quickActions.relationships.label", "看关系深化"),
      description: t(
        "overview.quickActions.relationships.description",
        "把重要人物、关系模式和没说出口的话放到一起。",
      ),
      view: "relationships" as const,
    },
    {
      icon: LibraryBig,
      label: t("overview.quickActions.journey.label", "回看成长记忆"),
      description: t(
        "overview.quickActions.journey.description",
        "把人生阶段、节点和地点物件背后的记忆重新连起来。",
      ),
      view: "journey" as const,
    },
    {
      icon: ScrollText,
      label: t("overview.quickActions.legacy.label", "整理重要托付"),
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
      <PageIntro
        eyebrow={t("overview.page.eyebrow", "总览")}
        title={t("overview.page.title", "先看全局，再决定从哪里开始")}
        description={greeting}
        searchQuery={searchQuery}
      />

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
              title={t("overview.sections.recent.title", "最近记录")}
              description={t(
                "overview.sections.recent.description",
                "从最近发生的事和最近写下的话里，先看见当下的自己。",
              )}
            />

            <div className={cn("mt-5", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}>
              {recentRecords.length > 0 ? (
                <RecordStream records={recentRecords} />
              ) : (
                <EmptyState message={t("overview.empty.recent", "当前筛选下还没有最近记录。")} />
              )}
            </div>
          </Surface>
        </div>

        <div className={cn("space-y-4", isFixedLayout && "min-h-0 overflow-y-auto pr-1")}>
          <Surface className="p-5">
            <SectionHeading
              icon={Waypoints}
              title={t("overview.sections.logic.title", "页面逻辑")}
              description={t(
                "overview.sections.logic.description",
                "先把这个产品为什么有这些页面说清楚。",
              )}
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
              title={t("overview.sections.pulse.title", "今天的观察")}
              description={t("overview.sections.pulse.description", "先给自己一个足够诚实的起点。")}
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
              title={t("overview.sections.quick.title", "快速进入")}
              description={t(
                "overview.sections.quick.description",
                "先动手，再决定要不要继续展开。",
              )}
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
                {t("overview.currentFocus.title", "当前重点")}
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
