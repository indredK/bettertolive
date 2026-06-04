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
  ShieldAlert,
  Sparkles,
  Target,
  Users2,
  Wallet,
  Waypoints,
} from "lucide-react"

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
  const isFixedLayout = !isStackedLayout

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <PageIntro
        eyebrow="总览"
        title="先看全局，再决定从哪里开始"
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
              title="最近记录"
              description="从最近发生的事和最近写下的话里，先看见当下的自己。"
            />

            <div className={cn("mt-5", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}>
              {recentRecords.length > 0 ? (
                <RecordStream records={recentRecords} />
              ) : (
                <EmptyState message="当前筛选下还没有最近记录。" />
              )}
            </div>
          </Surface>
        </div>

        <div className={cn("space-y-4", isFixedLayout && "min-h-0 overflow-y-auto pr-1")}>
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
                  detail: "反思、记事、记账、购物，负责承接你现在到底在怎么生活。",
                },
                {
                  title: "内在状态",
                  detail:
                    "情绪情感和危机支持，负责承接最近的心理波动，以及状态很差时该怎么撑住自己。",
                },
                {
                  title: "自我图谱",
                  detail:
                    "观念、原则、关系深化、成长、记忆节点，负责解释你为什么会变成现在这样的人。",
                },
                {
                  title: "生命整理与未来",
                  detail:
                    "生命整理负责安放重要的话和托付，未来蓝图负责把理想自我和阶段路径放到前面。",
                },
              ].map((entry) => (
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
                icon={HeartPulse}
                label="看情绪波动"
                description="把最近的心理天气和触发因素放到同一页里看。"
                onClick={() => onNavigate("emotion")}
              />
              <QuickActionButton
                icon={ShieldAlert}
                label="打开危机支持"
                description="状态很差的时候，先知道下一步该做什么。"
                onClick={() => onNavigate("crisis")}
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
                label="看关系深化"
                description="把重要人物、关系模式和没说出口的话放到一起。"
                onClick={() => onNavigate("relationships")}
              />
              <QuickActionButton
                icon={LibraryBig}
                label="回看成长记忆"
                description="把人生阶段、节点和地点物件背后的记忆重新连起来。"
                onClick={() => onNavigate("journey")}
              />
              <QuickActionButton
                icon={ScrollText}
                label="整理重要托付"
                description="把留给未来的话、牵挂和交代先安放好。"
                onClick={() => onNavigate("legacy")}
              />
            </div>

            <div className="mt-4 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4 text-sm leading-6 text-[color:var(--text-muted)]">
              <div className="flex items-center gap-2 font-medium text-[color:var(--text-primary)]">
                <Route className="size-4" />
                当前重点
              </div>
              <p className="mt-2">
                先把新增模块都接进同一张桌子上，保证能看、能切换、能带着基础数据一起成立。
              </p>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  )
}
