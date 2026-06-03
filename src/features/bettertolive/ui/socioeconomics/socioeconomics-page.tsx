import { Globe2, Landmark, Telescope } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { SocioeconomicsEntry } from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  SummarySurface,
  Surface,
} from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"

export function SocioeconomicsPage({
  entries,
  gaps,
  searchQuery,
  isStackedLayout = false,
}: {
  entries: SocioeconomicsEntry[]
  gaps: string[]
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
        eyebrow="社会经济"
        title="看清外部经济世界怎么运转"
        description="这页不是自我评估，而是把对外部经济世界的认知放在一张地图上。"
        searchQuery={searchQuery}
      />

      <div className={cn("grid gap-4 min-[960px]:grid-cols-3", isFixedLayout && "shrink-0")}>
        <SummarySurface
          tone="value"
          title="已有认知"
          value={`${entries.length} 条`}
          detail="按领域、层次、掌握程度看自己对外部世界的覆盖。"
        />
        <SummarySurface
          tone="past"
          title="认知缺口"
          value={`${gaps.length} 条`}
          detail="比起补满，先看见哪里只是听过名词更重要。"
        />
        <SummarySurface
          tone="present"
          title="离决策的距离"
          value="按层次看"
          detail="区分微观、中观、宏观，知道哪一块离自己最近。"
        />
      </div>

      <div
        className={cn(
          "grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.88fr)]",
          isFixedLayout && "min-h-0 flex-1 overflow-hidden",
        )}
      >
        <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col")}>
          <SectionHeading
            icon={Landmark}
            title="经济认知地图"
            description="按领域、层次、掌握程度归类，看看自己的认知地图覆盖到哪。"
          />

          <div
            className={cn("mt-5 space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}
          >
            {entries.length > 0 ? (
              entries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-medium text-[color:var(--text-primary)]">
                      {entry.title}
                    </h3>
                    <Badge
                      variant="outline"
                      className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                    >
                      {entry.domain}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                    >
                      {entry.layer}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                    {entry.summary}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[color:var(--text-muted)]">
                    <span>掌握：{entry.confidence}</span>
                    <span>来源：{entry.source}</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="当前筛选下没有可展示的认知条目。" />
            )}
          </div>
        </Surface>

        <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col")}>
          <SectionHeading
            icon={Telescope}
            title="认知缺口"
            description="先把哪里只是听过名词、哪里还没形成判断写出来。"
          />

          <div
            className={cn("mt-5 space-y-3", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}
          >
            {gaps.length > 0 ? (
              gaps.map((entry) => (
                <div
                  key={entry}
                  className="flex items-start gap-3 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3"
                >
                  <Globe2 className="mt-1 size-4 shrink-0 text-[color:var(--text-muted)]" />
                  <p className="text-sm leading-6 text-[color:var(--text-secondary)]">{entry}</p>
                </div>
              ))
            ) : (
              <EmptyState message="当前筛选下没有可展示的认知缺口。" compact />
            )}
          </div>
        </Surface>
      </div>
    </div>
  )
}
