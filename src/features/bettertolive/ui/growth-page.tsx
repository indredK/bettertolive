import { Route, Sprout, Waypoints } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { GrowthStage } from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  SummarySurface,
  Surface,
} from "@/features/bettertolive/ui/shared"

export function GrowthPage({
  stages,
  threads,
  traceCount,
  searchQuery,
}: {
  stages: GrowthStage[]
  threads: string[]
  traceCount: number
  searchQuery: string
}) {
  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="成长"
        title="看见自己是怎样形成的"
        description="这页专门承接成长环境、接触过的人和事，以及它们为什么会留在今天的你身上。"
        searchQuery={searchQuery}
      />

      <div className="grid gap-4 min-[960px]:grid-cols-3">
        <SummarySurface
          tone="past"
          title="阶段"
          value={`${stages.length} 段`}
          detail="先把塑造你的环境按阶段排开。"
        />
        <SummarySurface
          tone="value"
          title="留下来的痕迹"
          value={`${traceCount} 条`}
          detail="现在的很多反应，其实都能往回找到来源。"
        />
        <SummarySurface
          tone="future"
          title="意义"
          value="理解形成原因"
          detail="看清来路，后面才更容易决定哪些部分要继续带着走。"
        />
      </div>

      <div className="grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.24fr)_minmax(320px,0.84fr)]">
        <Surface className="p-5">
          <SectionHeading
            icon={Route}
            title="成长线索"
            description="先用阶段来理解自己，再慢慢补细节和因果。"
          />

          <div className="mt-5 space-y-4">
            {stages.length > 0 ? (
              stages.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                    >
                      {entry.stage}
                    </Badge>
                    <h3 className="text-base font-medium text-[color:var(--text-primary)]">
                      {entry.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
                    环境：{entry.environment}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                    影响：{entry.impact}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.traces.map((trace) => (
                      <Badge
                        key={trace}
                        variant="outline"
                        className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
                      >
                        {trace}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="当前筛选下还没有可展示的成长线索。" />
            )}
          </div>
        </Surface>

        <Surface className="p-5">
          <SectionHeading
            icon={Sprout}
            title="当前还在生效的影响"
            description="不是为了怪过去，而是为了识别今天仍在自动运行的部分。"
          />

          <div className="mt-5 space-y-3">
            {threads.length > 0 ? (
              threads.map((entry) => (
                <div
                  key={entry}
                  className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]"
                >
                  {entry}
                </div>
              ))
            ) : (
              <EmptyState message="当前筛选下没有可展示的影响线索。" compact />
            )}
          </div>

          <div className="mt-5 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--text-primary)]">
              <Waypoints className="size-4" />
              之后可以继续补什么
            </div>
            <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
              家庭气氛、学校环境、重要朋友、第一次重大挫折、后来接触到的新世界。
            </p>
          </div>
        </Surface>
      </div>
    </div>
  )
}
