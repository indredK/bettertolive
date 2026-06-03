import { MessageCircleMore, Users2, Waypoints } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type {
  RelationshipCircle,
  RelationshipMoment,
  RelationshipUnsentNote,
} from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  SummarySurface,
  Surface,
} from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"

export function RelationshipsPage({
  relationshipCircles,
  moments,
  patterns,
  unsentNotes,
  visibleRelationshipCount,
  searchQuery,
  isStackedLayout = false,
}: {
  relationshipCircles: RelationshipCircle[]
  moments: RelationshipMoment[]
  patterns: string[]
  unsentNotes: RelationshipUnsentNote[]
  visibleRelationshipCount: number
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
        eyebrow="关系深化"
        title="把重要关系放进更深的上下文里看"
        description="这里不只放联系人和关系状态，也放关系事件、未说出口的话，以及你在关系里反复出现的反应。"
        searchQuery={searchQuery}
      />

      <div className={cn("grid gap-4 min-[960px]:grid-cols-3", isFixedLayout && "shrink-0")}>
        <SummarySurface
          tone="value"
          title="关系圈"
          value={`${relationshipCircles.length} 层`}
          detail="先分清哪些人分别在影响什么。"
        />
        <SummarySurface
          tone="present"
          title="关键人物"
          value={`${visibleRelationshipCount} 人`}
          detail="不是列联系人，而是看谁在塑造你的日常感受。"
        />
        <SummarySurface
          tone="future"
          title="未说出口"
          value={`${unsentNotes.length} 条`}
          detail="很多关系重量不只来自发生了什么，也来自一直没有被说出来的话。"
        />
      </div>

      <div
        className={cn(
          "grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.24fr)_minmax(320px,0.84fr)]",
          isFixedLayout && "min-h-0 flex-1 overflow-hidden",
        )}
      >
        <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col")}>
          <SectionHeading
            icon={Users2}
            title="重要人物与关系状态"
            description="先把圈层分清，再慢慢补每段关系里的感受、事件和位置变化。"
          />

          <div
            className={cn("mt-5 space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}
          >
            {relationshipCircles.some((circle) => circle.entries.length > 0) ? (
              relationshipCircles.map((circle) => (
                <div
                  key={circle.id}
                  className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-medium text-[color:var(--text-primary)]">
                      {circle.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                    >
                      {circle.entries.length} 人
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                    {circle.summary}
                  </p>

                  <div className="mt-4 space-y-3">
                    {circle.entries.length > 0 ? (
                      circle.entries.map((entry) => (
                        <div
                          key={entry.id}
                          className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-4 py-3"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="font-medium text-[color:var(--text-primary)]">
                              {entry.name}
                            </div>
                            <div className="text-xs text-[color:var(--text-muted)]">
                              {entry.role}
                            </div>
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                            {entry.influence}
                          </p>
                          <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                            情绪感受：{entry.emotionalTone}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-[color:var(--text-muted)]">
                            现在：{entry.currentState}
                          </p>
                          <p className="mt-2 text-xs leading-5 text-[color:var(--text-muted)]">
                            没说出口的话：{entry.unspokenLine}
                          </p>
                        </div>
                      ))
                    ) : (
                      <EmptyState message="当前筛选下这个圈层没有可展示的人物。" compact />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="当前筛选下还没有可展示的关系条目。" />
            )}
          </div>
        </Surface>

        <div className={cn("space-y-4", isFixedLayout && "min-h-0 overflow-y-auto pr-1")}>
          <Surface className="p-5">
            <SectionHeading
              icon={MessageCircleMore}
              title="关系事件与未发送表达"
              description="有些关系变化要靠时间线看清，有些重量则一直停留在没说出口的话里。"
            />

            <div className="mt-5 space-y-3">
              {moments.length > 0 ? (
                moments.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium text-[color:var(--text-primary)]">
                        {entry.title}
                      </div>
                      <Badge
                        variant="outline"
                        className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                      >
                        {entry.person}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                      {entry.impact}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState message="当前筛选下没有关系事件。" compact />
              )}
            </div>

            <div className="mt-5 space-y-3">
              {unsentNotes.length > 0 ? (
                unsentNotes.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-4 py-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
                      >
                        {entry.to}
                      </Badge>
                      <span className="text-xs text-[color:var(--text-muted)]">{entry.theme}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                      {entry.excerpt}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState message="当前筛选下没有未发送表达。" compact />
              )}
            </div>
          </Surface>

          <Surface className="p-5">
            <SectionHeading
              icon={Waypoints}
              title="关系里的重复反应"
              description="先看到模式，再决定以后要不要调整。"
            />

            <div className="mt-5 space-y-3">
              {patterns.length > 0 ? (
                patterns.map((entry) => (
                  <div
                    key={entry}
                    className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]"
                  >
                    {entry}
                  </div>
                ))
              ) : (
                <EmptyState message="当前筛选下没有可展示的关系模式。" compact />
              )}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  )
}
