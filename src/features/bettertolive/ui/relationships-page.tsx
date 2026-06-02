import { MessageCircleMore, Users2, Waypoints } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { RelationshipCircle } from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  SummarySurface,
  Surface,
} from "@/features/bettertolive/ui/shared"

export function RelationshipsPage({
  relationshipCircles,
  patterns,
  visibleRelationshipCount,
  searchQuery,
}: {
  relationshipCircles: RelationshipCircle[]
  patterns: string[]
  visibleRelationshipCount: number
  searchQuery: string
}) {
  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="关系"
        title="把重要关系放进同一张图里看"
        description="朋友、亲人、同伴和亲密关系，会长期影响你的安全感、边界感和自我评价。"
        searchQuery={searchQuery}
      />

      <div className="grid gap-4 min-[960px]:grid-cols-3">
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
          tone="past"
          title="重复模式"
          value={`${patterns.length} 条`}
          detail="关系里的重复反应，往往比单次事件更值得看。"
        />
      </div>

      <div className="grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.24fr)_minmax(320px,0.84fr)]">
        <Surface className="p-5">
          <SectionHeading
            icon={Users2}
            title="关系地图"
            description="先把圈层分清，再慢慢补具体的人和影响。"
          />

          <div className="mt-5 space-y-4">
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
                          <p className="mt-2 text-xs leading-5 text-[color:var(--text-muted)]">
                            现在：{entry.currentState}
                          </p>
                        </div>
                      ))
                    ) : (
                      <EmptyState
                        message="当前筛选下这个圈层没有可展示的人物。"
                        compact
                      />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="当前筛选下还没有可展示的关系条目。" />
            )}
          </div>
        </Surface>

        <Surface className="p-5">
          <SectionHeading
            icon={MessageCircleMore}
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

          <div className="mt-5 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--text-primary)]">
              <Waypoints className="size-4" />
              这页为什么重要
            </div>
            <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
              很多自我评价、边界感和生活选择，都和长期关系里的位置有关。
            </p>
          </div>
        </Surface>
      </div>
    </div>
  )
}
