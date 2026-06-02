import {
  BookOpenText,
  CalendarDays,
  Compass,
  Lightbulb,
  NotebookPen,
  Route,
  Sparkles,
  Target,
  Users2,
  Wallet,
  Waypoints,
} from "lucide-react"

import type {
  AppView,
  EventEntry,
  RecentRecord,
  ReflectionEntry,
  TransactionEntry,
} from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  QuickActionButton,
  RecordStream,
  SectionHeading,
  SummarySurface,
  Surface,
} from "@/features/bettertolive/ui/shared"
import { MONEY_FORMATTER } from "@/features/bettertolive/ui/formatters"

export function OverviewPage({
  greeting,
  dailyPulse,
  reflections,
  events,
  transactions,
  recentRecords,
  beliefCount,
  principleCount,
  relationshipCount,
  growthCount,
  shoppingCount,
  futureMilestoneCount,
  onNavigate,
  searchQuery,
}: {
  greeting: string
  dailyPulse: string[]
  reflections: ReflectionEntry[]
  events: EventEntry[]
  transactions: TransactionEntry[]
  recentRecords: RecentRecord[]
  beliefCount: number
  principleCount: number
  relationshipCount: number
  growthCount: number
  shoppingCount: number
  futureMilestoneCount: number
  onNavigate: (view: AppView) => void
  searchQuery: string
}) {
  const expenseTotal = transactions
    .filter((entry) => entry.direction === "expense")
    .reduce((sum, entry) => sum + entry.amount, 0)

  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="总览"
        title="先看全局，再决定从哪里开始"
        description={greeting}
        searchQuery={searchQuery}
      />

      <div className="grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.92fr)]">
        <div className="space-y-4">
          <div className="grid gap-4 min-[960px]:grid-cols-2 min-[1240px]:grid-cols-4">
            <SummarySurface
              tone="value"
              title="形成"
              value={`${growthCount} 段线索`}
              detail={`${relationshipCount} 个关键关系和 ${principleCount} 条原则正在解释你为什么会这样。`}
            />
            <SummarySurface
              tone="past"
              title="过去"
              value={`${reflections.length} 条反思`}
              detail={`${events.length} 条记事留下了最近的生活轨迹。`}
            />
            <SummarySurface
              tone="present"
              title="现在"
              value={MONEY_FORMATTER.format(expenseTotal)}
              detail={`${shoppingCount} 个购物条目正在反映最近的现实选择。`}
            />
            <SummarySurface
              tone="future"
              title="未来"
              value={`${futureMilestoneCount} 条阶段路径`}
              detail={`${beliefCount} 个观念角度正在帮你定义自己想去哪里。`}
            />
          </div>

          <Surface className="p-5">
            <SectionHeading
              icon={CalendarDays}
              title="最近记录"
              description="从最近发生的事和最近写下的话里，先看见当下的自己。"
            />

            <div className="mt-5">
              {recentRecords.length > 0 ? (
                <RecordStream records={recentRecords} />
              ) : (
                <EmptyState message="当前筛选下还没有最近记录。" />
              )}
            </div>
          </Surface>
        </div>

        <div className="space-y-4">
          <Surface className="p-5">
            <SectionHeading
              icon={Waypoints}
              title="页面逻辑"
              description="先把这个产品为什么有这些页面说清楚。"
            />

            <div className="mt-5 space-y-3">
              {[
                {
                  title: "记录工作台",
                  detail:
                    "反思、记事、记账、购物，负责承接你现在到底在怎么生活。",
                },
                {
                  title: "自我图谱",
                  detail:
                    "观念、原则、关系、成长，负责解释你为什么会变成现在这样的人。",
                },
                {
                  title: "未来方向",
                  detail:
                    "未来蓝图负责把理想自我、理想生活和阶段路径放到前面。",
                },
              ].map((entry) => (
                <div
                  key={entry.title}
                  className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]"
                >
                  <div className="font-medium text-[color:var(--text-primary)]">
                    {entry.title}
                  </div>
                  <div className="mt-1">{entry.detail}</div>
                </div>
              ))}
            </div>
          </Surface>

          <Surface className="p-5">
            <SectionHeading
              icon={Target}
              title="今天的观察"
              description="先给自己一个足够诚实的起点。"
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
              title="快速进入"
              description="先动手，再决定要不要继续展开。"
            />

            <div className="mt-5 grid gap-2 min-[960px]:grid-cols-2">
              <QuickActionButton
                icon={NotebookPen}
                label="写一条反思"
                description="把此刻的想法和感受先放下来。"
                onClick={() => onNavigate("reflection")}
              />
              <QuickActionButton
                icon={BookOpenText}
                label="记一件事"
                description="补一段事件时间线，留住最近生活片段。"
                onClick={() => onNavigate("events")}
              />
              <QuickActionButton
                icon={Wallet}
                label="记一笔支出"
                description="让现实选择和生活方式一眼可见。"
                onClick={() => onNavigate("finance")}
              />
              <QuickActionButton
                icon={Compass}
                label="补未来方向"
                description="把理想自我和生活方式说得更清楚。"
                onClick={() => onNavigate("future")}
              />
              <QuickActionButton
                icon={Lightbulb}
                label="打开观念图谱"
                description="看看人生观、世界观和价值观现在是什么样子。"
                onClick={() => onNavigate("beliefs")}
              />
              <QuickActionButton
                icon={Users2}
                label="看关系与成长"
                description="从关系和成长环境回头理解今天的自己。"
                onClick={() => onNavigate("growth")}
              />
            </div>

            <div className="mt-4 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4 text-sm leading-6 text-[color:var(--text-muted)]">
              <div className="flex items-center gap-2 font-medium text-[color:var(--text-primary)]">
                <Route className="size-4" />
                当前重点
              </div>
              <p className="mt-2">
                先把页面逻辑和基础展示搭清楚，再决定录入细节和后续的数据结构。
              </p>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  )
}
