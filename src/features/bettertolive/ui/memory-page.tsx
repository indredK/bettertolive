import { BookHeart, Camera, LibraryBig, Waypoints } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { MemoryAnchor, MemoryNode } from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  SummarySurface,
  Surface,
} from "@/features/bettertolive/ui/shared"

export function MemoryPage({
  nodes,
  anchors,
  reviewPrompts,
  searchQuery,
}: {
  nodes: MemoryNode[]
  anchors: MemoryAnchor[]
  reviewPrompts: string[]
  searchQuery: string
}) {
  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="记忆节点"
        title="把人生片段重新连成轨迹"
        description="这里承接人生节点、地点、物件和照片背后的记忆，重点不是收藏过去，而是理解它为什么还在影响现在。"
        searchQuery={searchQuery}
      />

      <div className="grid gap-4 min-[960px]:grid-cols-3">
        <SummarySurface
          tone="past"
          title="人生节点"
          value={`${nodes.length} 段`}
          detail="过去不是一堆碎片，而是一条仍在继续影响你的时间线。"
        />
        <SummarySurface
          tone="value"
          title="记忆锚点"
          value={`${anchors.length} 个`}
          detail="很多回忆并不是从事件开始，而是从一个地方、一件东西或一张照片被唤起。"
        />
        <SummarySurface
          tone="future"
          title="回看问题"
          value={`${reviewPrompts.length} 条`}
          detail="真正重要的不是当时发生了什么，而是它后来把你带到了哪里。"
        />
      </div>

      <div className="grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.24fr)_minmax(340px,0.86fr)]">
        <Surface className="p-5">
          <SectionHeading
            icon={LibraryBig}
            title="人生时间轴"
            description="先把重要阶段排出来，再慢慢给每一段补上真正的感受和后来留下的影响。"
          />

          <div className="mt-5 space-y-4">
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
              <EmptyState message="当前筛选下没有可展示的人生节点。" />
            )}
          </div>
        </Surface>

        <div className="space-y-4">
          <Surface className="p-5">
            <SectionHeading
              icon={Camera}
              title="地点 / 物件 / 照片记忆"
              description="这类内容常常更私人，也最容易把你一下子拉回某段人生。"
            />

            <div className="mt-5 space-y-3">
              {anchors.length > 0 ? (
                anchors.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
                      >
                        {entry.type}
                      </Badge>
                      <div className="font-medium text-[color:var(--text-primary)]">
                        {entry.label}
                      </div>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                      {entry.note}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState message="当前筛选下没有记忆锚点。" compact />
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

            <div className="mt-5 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--text-primary)]">
                <Waypoints className="size-4" />
                这页为什么值得放进项目里
              </div>
              <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                情绪和成长会告诉你现在怎样，记忆节点会补上“这些东西最早是从哪里开始的”。
              </p>
            </div>
          </Surface>
        </div>
      </div>
    </div>
  )
}
