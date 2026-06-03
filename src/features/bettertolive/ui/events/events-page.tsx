import { BookOpenText, Target } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { EventEntry } from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  Surface,
} from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"

export function EventsPage({
  events,
  searchQuery,
  isStackedLayout = false,
}: {
  events: EventEntry[]
  searchQuery: string
  isStackedLayout?: boolean
}) {
  const isFixedLayout = !isStackedLayout
  const themes = Array.from(new Set(events.map((entry) => entry.theme)))

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <PageIntro
        eyebrow="记事"
        title="把生活片段接回时间线"
        description="不只是“想了什么”，也保留“发生了什么”，让回看时有更完整的上下文。"
        searchQuery={searchQuery}
      />

      <div
        className={cn(
          "grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]",
          isFixedLayout && "min-h-0 flex-1 overflow-hidden",
        )}
      >
        <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col")}>
          <SectionHeading
            icon={BookOpenText}
            title="时间线"
            description="记录下来以后，生活会开始出现连续感。"
          />

          <div
            className={cn("mt-5 space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}
          >
            {events.length > 0 ? (
              events.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                >
                  <div className="grid gap-3 min-[960px]:grid-cols-[120px_minmax(0,1fr)]">
                    <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                      {entry.date}
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-[color:var(--text-primary)]">
                        {entry.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                        {entry.excerpt}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="当前筛选下还没有事件记录。" />
            )}
          </div>
        </Surface>

        <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col")}>
          <SectionHeading
            icon={Target}
            title="最近重复出现的主题"
            description="模块不用很复杂，也能开始帮助你看到模式。"
          />

          <div
            className={cn(
              "mt-5 flex flex-wrap content-start gap-2",
              isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1",
            )}
          >
            {themes.length > 0 ? (
              themes.map((theme) => (
                <Badge
                  key={theme}
                  variant="outline"
                  className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
                >
                  {theme}
                </Badge>
              ))
            ) : (
              <EmptyState message="当前筛选下没有可展示的主题。" compact />
            )}
          </div>
        </Surface>
      </div>
    </div>
  )
}
