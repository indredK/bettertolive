import { BookHeart, Camera, Route, Sprout } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { GrowthStage, MemoryAnchor, MemoryNode } from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  SummarySurface,
  Surface,
} from "@/features/bettertolive/ui/shared"

export function JourneyPage({
  stages,
  threads,
  nodes,
  anchors,
  reviewPrompts,
  traceCount,
  searchQuery,
}: {
  stages: GrowthStage[]
  threads: string[]
  nodes: MemoryNode[]
  anchors: MemoryAnchor[]
  reviewPrompts: string[]
  traceCount: number
  searchQuery: string
}) {
  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="成长记忆"
        title="把人生脉络整理成可理解的轨迹"
        description="左边是塑造你的阶段背景，右边是发生在其中的关键节点。看清来路，是为了慢慢松开旧惯性。"
        searchQuery={searchQuery}
      />

      <div className="grid gap-4 min-[960px]:grid-cols-3">
        <SummarySurface
          tone="past"
          title="人生阶段"
          value={`${stages.length} 段`}
          detail="先按阶段把塑造你的环境排开。"
        />
        <SummarySurface
          tone="value"
          title="关键节点"
          value={`${nodes.length} 个`}
          detail="过去的事件如何还在影响现在的你。"
        />
        <SummarySurface
          tone="future"
          title="留下来的痕迹"
          value={`${traceCount + anchors.length} 处`}
          detail="痕迹与锚点合起来，就是回看的入口。"
        />
      </div>

      <Surface className="p-5">
        <SectionHeading
          icon={Route}
          title="人生脉络"
          description="左边是塑造你的阶段背景，右边是发生在其中的具体节点。两层视角对应着同一段过去。"
        />

        <div className="mt-5 grid gap-4 min-[1240px]:grid-cols-2">
          <div className="space-y-4">
            <div className="text-xs font-medium tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
              成长阶段
            </div>
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
              <EmptyState message="当前筛选下还没有可展示的成长阶段。" compact />
            )}
          </div>

          <div className="space-y-4">
            <div className="text-xs font-medium tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
              人生节点
            </div>
            {nodes.length > 0 ? (
              nodes.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
                    >
                      {entry.period}
                    </Badge>
                    <h3 className="text-base font-medium text-[color:var(--text-primary)]">
                      {entry.title}
                    </h3>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">
                    {entry.summary}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                    留下来的影响：{entry.impact}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.tags.map((tag) => (
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
              ))
            ) : (
              <EmptyState message="当前筛选下还没有可展示的人生节点。" compact />
            )}
          </div>
        </div>

        {anchors.length > 0 ? (
          <div className="mt-5 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--text-primary)]">
              <Camera className="size-4" />
              记忆锚点
            </div>
            <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
              很多回忆并不是从事件开始，而是从一个地方、一件东西或一张照片被唤起。
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {anchors.map((entry) => (
                <span
                  key={entry.id}
                  className="inline-flex items-center gap-2 rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-3 py-1.5 text-xs text-[color:var(--text-secondary)]"
                  title={entry.note}
                >
                  <span className="font-medium text-[color:var(--text-primary)]">{entry.type}</span>
                  <span className="text-[color:var(--text-muted)]">·</span>
                  <span>{entry.label}</span>
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </Surface>

      <div className="grid gap-4 min-[960px]:grid-cols-2">
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
        </Surface>

        <Surface className="p-5">
          <SectionHeading
            icon={BookHeart}
            title="回看问题"
            description="不是为了把过去说得更漂亮，而是让你更诚实地重新理解它。"
          />

          <div className="mt-5 space-y-3">
            {reviewPrompts.length > 0 ? (
              reviewPrompts.map((entry) => (
                <div
                  key={entry}
                  className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]"
                >
                  {entry}
                </div>
              ))
            ) : (
              <EmptyState message="当前筛选下没有回看问题。" compact />
            )}
          </div>
        </Surface>
      </div>
    </div>
  )
}
