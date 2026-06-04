import { CheckCheck, Compass, Target } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { FutureBlueprint, FutureMilestone } from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  Surface,
} from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"

export function FuturePage({
  futureBlueprint,
  milestones,
  searchQuery,
  isStackedLayout = false,
}: {
  futureBlueprint: FutureBlueprint
  milestones: FutureMilestone[]
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
        eyebrow="未来蓝图"
        title="把想成为的人说清楚"
        description="未来不是系统替你预测的结果，而是你主动写下的方向。这里先承接理想自我、理想生活和阶段路径。"
        searchQuery={searchQuery}
      />

      <div
        className={cn(
          "grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.9fr)]",
          isFixedLayout && "min-h-0 flex-1 overflow-hidden",
        )}
      >
        <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col")}>
          <SectionHeading
            icon={Target}
            title="阶段路径"
            description="先把未来拆成靠近方式，而不是终局答案。"
          />

          <div
            className={cn("mt-5 space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}
          >
            {milestones.length > 0 ? (
              milestones.map((entry) => (
                <div
                  key={entry.horizon}
                  className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                >
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
                      >
                        {entry.horizon}
                      </Badge>
                    </div>
                    <p className="text-sm leading-6 text-[color:var(--text-secondary)]">
                      {entry.summary}
                    </p>
                    <ul className="space-y-2 text-sm text-[color:var(--text-muted)]">
                      {entry.steps.map((step) => (
                        <li key={step} className="flex items-start gap-2 leading-6">
                          <CheckCheck className="mt-1 size-3.5 shrink-0 text-[color:var(--text-muted)]" />
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="当前筛选下没有未来路径。" />
            )}
          </div>
        </Surface>

        <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col")}>
          <SectionHeading
            icon={Compass}
            title="当前实验"
            description="不用一步到位，先让生活里出现一点点更像自己的东西。"
          />

          <div
            className={cn("mt-5 space-y-3", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}
          >
            {futureBlueprint.experiments.map((entry) => (
              <div
                key={entry}
                className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]"
              >
                {entry}
              </div>
            ))}
          </div>
        </Surface>
      </div>
    </div>
  )
}
