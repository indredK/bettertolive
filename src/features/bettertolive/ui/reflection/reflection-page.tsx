import { NotebookPen, Sparkles } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { ReflectionDraftExample, ReflectionEntry } from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  Surface,
} from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"

export function ReflectionPage({
  draftExample,
  reflections,
  searchQuery,
  isStackedLayout = false,
}: {
  draftExample: ReflectionDraftExample
  reflections: ReflectionEntry[]
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
        eyebrow="反思"
        title="先把此刻写下来"
        description="表达不需要完整，真实比完整更重要。这里会成为你最自然的输入入口。"
        searchQuery={searchQuery}
      />

      <div
        className={cn(
          "grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.85fr)]",
          isFixedLayout && "min-h-0 flex-1 overflow-hidden",
        )}
      >
        <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col")}>
          <SectionHeading
            icon={NotebookPen}
            title="今天想写些什么？"
            description="这块先用 mock 内容占位，后面再接真实输入和保存。"
          />

          <div
            className={cn("mt-5 space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}
          >
            <div className="min-h-[240px] rounded-lg border border-dashed border-[color:var(--chip-border)] bg-[color:var(--muted-surface-bg)] p-5 text-sm leading-7 whitespace-pre-wrap text-[color:var(--text-secondary)]">
              {draftExample.content}
            </div>

            <div className="flex flex-wrap gap-2">
              {draftExample.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </Surface>

        <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col")}>
          <SectionHeading
            icon={Sparkles}
            title="最近反思"
            description="先展示最近写过的内容，再决定之后如何组织回看。"
          />

          <div
            className={cn("mt-5 space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}
          >
            {reflections.length > 0 ? (
              reflections.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                >
                  <div className="text-xs text-[color:var(--text-muted)]">{entry.date}</div>
                  <h3 className="mt-2 text-base font-medium text-[color:var(--text-primary)]">
                    {entry.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                    {entry.excerpt}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState message="当前筛选下还没有反思记录。" />
            )}
          </div>
        </Surface>
      </div>
    </div>
  )
}
