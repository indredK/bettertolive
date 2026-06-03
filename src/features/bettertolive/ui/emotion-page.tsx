import { Activity, HeartPulse, ShieldAlert, WavesLadder } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type {
  EmotionCheckIn,
  EmotionSupportTool,
  EmotionTrendPoint,
  EmotionTriggerGroup,
} from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  SummarySurface,
  Surface,
} from "@/features/bettertolive/ui/shared"

export function EmotionPage({
  checkIns,
  trend,
  triggers,
  tools,
  searchQuery,
}: {
  checkIns: EmotionCheckIn[]
  trend: EmotionTrendPoint[]
  triggers: EmotionTriggerGroup[]
  tools: EmotionSupportTool[]
  searchQuery: string
}) {
  const latestCheckIn = checkIns[0]

  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="情绪情感"
        title="看见最近的心理天气"
        description="这里不是简单记录心情，而是把情绪波动、触发因素和对自己有效的恢复方式放在一起看。"
        searchQuery={searchQuery}
      />

      <div className="grid gap-4 min-[960px]:grid-cols-3">
        <SummarySurface
          tone="present"
          title="最近记录"
          value={`${checkIns.length} 条`}
          detail="先把感受留下来，再慢慢看它们怎么连成一条线。"
        />
        <SummarySurface
          tone="past"
          title="波动样本"
          value={`${trend.length} 段`}
          detail="波动不是随机的，常常会和节奏、关系和身体状态绑在一起。"
        />
        <SummarySurface
          tone="value"
          title="恢复工具"
          value={`${tools.length} 个`}
          detail="状态差的时候，不一定适合分析，但一定需要下一步。"
        />
      </div>

      <div className="grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.88fr)]">
        <Surface className="p-5">
          <SectionHeading
            icon={WavesLadder}
            title="最近波动"
            description="先看最近几天的情绪起伏，再回头理解它们为什么会这样变化。"
          />

          {latestCheckIn ? (
            <div className="mt-5 rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-4 py-4">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <Badge
                  variant="outline"
                  className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
                >
                  {latestCheckIn.state}
                </Badge>
                <span className="text-[color:var(--text-muted)]">{latestCheckIn.date}</span>
                <span className="text-[color:var(--text-muted)]">
                  强度 {latestCheckIn.intensity}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
                {latestCheckIn.summary}
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                身体感觉：{latestCheckIn.bodySignal}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {latestCheckIn.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          <div className="mt-5 space-y-3">
            {trend.length > 0 ? (
              trend.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                        {entry.label}
                      </div>
                      <div className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)]">
                        {entry.note}
                      </div>
                    </div>
                    <div className="shrink-0 text-sm font-medium text-[color:var(--text-primary)]">
                      {entry.score}/10
                    </div>
                  </div>

                  <div className="mt-3 h-2 rounded-full bg-[color:var(--surface-border)]">
                    <div
                      className="h-2 rounded-full bg-[color:var(--text-primary)]"
                      style={{ width: `${Math.max(14, entry.score * 10)}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="当前筛选下没有情绪波动样本。" />
            )}
          </div>
        </Surface>

        <div className="space-y-4">
          <Surface className="p-5">
            <SectionHeading
              icon={Activity}
              title="触发因素与关联"
              description="先把会反复击中你的因素收进来，后面才更容易找到节律。"
            />

            <div className="mt-5 space-y-3">
              {triggers.length > 0 ? (
                triggers.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                  >
                    <div className="font-medium text-[color:var(--text-primary)]">
                      {entry.title}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                      {entry.summary}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {entry.cues.map((cue) => (
                        <Badge
                          key={cue}
                          variant="outline"
                          className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                        >
                          {cue}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState message="当前筛选下没有触发因素。" compact />
              )}
            </div>
          </Surface>

          <Surface className="p-5">
            <SectionHeading
              icon={HeartPulse}
              title="恢复工具箱"
              description="状态差的时候，不必一次弄懂所有原因，先找到对自己有效的动作。"
            />

            <div className="mt-5 space-y-3">
              {tools.length > 0 ? (
                tools.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                  >
                    <div className="font-medium text-[color:var(--text-primary)]">
                      {entry.title}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                      {entry.description}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-[color:var(--text-muted)]">
                      适用时机：{entry.when}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState message="当前筛选下没有恢复工具。" compact />
              )}
            </div>

            <div className="mt-5 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--text-primary)]">
                <ShieldAlert className="size-4" />
                这页之后会连到哪里
              </div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                情绪波动和危机支持会互相连接，让低谷时既能看见模式，也能立刻找到下一步。
              </p>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  )
}
