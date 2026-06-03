import { ShieldAlert, Siren, UserRoundCheck, Waypoints } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { CrisisContact, CrisisCurrentState, CrisisStep } from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  SummarySurface,
  Surface,
} from "@/features/bettertolive/ui/shared"
import { cn } from "@/lib/utils"

export function CrisisPage({
  currentState,
  warningSigns,
  contacts,
  steps,
  reviewNotes,
  searchQuery,
  isStackedLayout = false,
}: {
  currentState: CrisisCurrentState
  warningSigns: string[]
  contacts: CrisisContact[]
  steps: CrisisStep[]
  reviewNotes: string[]
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
        eyebrow="危机支持"
        title="状态很差时，先知道下一步"
        description="这页不是替代现实支持，而是在你已经明显失衡的时候，给出一个足够简单、能立刻执行的支撑层。"
        searchQuery={searchQuery}
      />

      <div className={cn("grid gap-4 min-[960px]:grid-cols-3", isFixedLayout && "shrink-0")}>
        <SummarySurface
          tone="future"
          title="当前判断"
          value={currentState.level}
          detail={currentState.summary}
        />
        <SummarySurface
          tone="past"
          title="预警信号"
          value={`${warningSigns.length} 个`}
          detail="越早认出下滑信号，越容易在彻底崩住前做动作。"
        />
        <SummarySurface
          tone="value"
          title="支持资源"
          value={`${contacts.length + steps.length} 条`}
          detail="低谷时别追求全面，只要先找到一条能执行的路。"
        />
      </div>

      <div
        className={cn(
          "grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.18fr)_minmax(340px,0.9fr)]",
          isFixedLayout && "min-h-0 flex-1 overflow-hidden",
        )}
      >
        <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col")}>
          <SectionHeading
            icon={ShieldAlert}
            title="现在的状态与应急步骤"
            description="先确认自己大概在哪个状态，再把今天缩到最低配置。"
          />

          <div
            className={cn("mt-5 space-y-5", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}
          >
            <div className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-4 py-4">
              <Badge
                variant="outline"
                className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
              >
                {currentState.level}
              </Badge>
              <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
                {currentState.summary}
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--text-primary)]">
                先做：{currentState.firstStep}
              </p>
            </div>

            <div className="space-y-3">
              {steps.length > 0 ? (
                steps.map((entry, index) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-7 items-center justify-center rounded-full border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-xs font-medium text-[color:var(--text-secondary)]">
                        {index + 1}
                      </div>
                      <div className="font-medium text-[color:var(--text-primary)]">
                        {entry.title}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
                      {entry.description}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState message="当前筛选下没有应急步骤。" />
              )}
            </div>
          </div>
        </Surface>

        <div className={cn("space-y-4", isFixedLayout && "min-h-0 overflow-y-auto pr-1")}>
          <Surface className="p-5">
            <SectionHeading
              icon={Siren}
              title="预警信号"
              description="很多低谷开始时并不轰烈，往往只是先出现一些重复的小征兆。"
            />

            <div className="mt-5 space-y-3">
              {warningSigns.length > 0 ? (
                warningSigns.map((entry) => (
                  <div
                    key={entry}
                    className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]"
                  >
                    {entry}
                  </div>
                ))
              ) : (
                <EmptyState message="当前筛选下没有预警信号。" compact />
              )}
            </div>
          </Surface>

          <Surface className="p-5">
            <SectionHeading
              icon={UserRoundCheck}
              title="支持联系人与复盘提醒"
              description="低谷里最难的是开口，所以把对象和说法都提前放好。"
            />

            <div className="mt-5 space-y-3">
              {contacts.length > 0 ? (
                contacts.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-[color:var(--text-primary)]">
                        {entry.name}
                      </div>
                      <Badge
                        variant="outline"
                        className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                      >
                        {entry.role}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                      适用情况：{entry.when}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-[color:var(--text-muted)]">
                      可以这样开口：{entry.script}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState message="当前筛选下没有支持联系人。" compact />
              )}
            </div>

            <div className="mt-5 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--text-primary)]">
                <Waypoints className="size-4" />
                缓过来之后记得回看
              </div>
              <div className="mt-2 space-y-2 text-sm leading-6 text-[color:var(--text-muted)]">
                {reviewNotes.length > 0 ? (
                  reviewNotes.map((entry) => <p key={entry}>{entry}</p>)
                ) : (
                  <p>当前筛选下没有复盘提醒。</p>
                )}
              </div>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  )
}
