import { Lightbulb, MessagesSquare, Waypoints } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { BeliefCard } from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  SummarySurface,
  Surface,
} from "@/features/bettertolive/ui/shared"

export function BeliefsPage({
  beliefCards,
  questions,
  searchQuery,
}: {
  beliefCards: BeliefCard[]
  questions: string[]
  searchQuery: string
}) {
  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="观念"
        title="把你怎么看世界和人生说清楚"
        description="这里承接人生观、世界观和价值观。它不是口号区，而是帮助你理解自己为什么会这样判断、这样选择。"
        searchQuery={searchQuery}
      />

      <div className="grid gap-4 min-[960px]:grid-cols-3">
        <SummarySurface
          tone="past"
          title="观念层"
          value={`${beliefCards.length} 个角度`}
          detail="先把世界观、人生观、价值观分开写清。"
        />
        <SummarySurface
          tone="value"
          title="核心问题"
          value={`${questions.length} 条`}
          detail="很多观念不是答案，而是反复出现的问题。"
        />
        <SummarySurface
          tone="future"
          title="作用"
          value="解释选择"
          detail="理解自己怎么看世界，才能看懂日常判断的来源。"
        />
      </div>

      <div className="grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.85fr)]">
        <Surface className="p-5">
          <SectionHeading
            icon={Lightbulb}
            title="观念骨架"
            description="这些内容以后会成为很多决定背后的解释层。"
          />

          <div className="mt-5 space-y-4">
            {beliefCards.length > 0 ? (
              beliefCards.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
                    >
                      {entry.label}
                    </Badge>
                    <div className="text-xs text-[color:var(--text-muted)]">
                      {entry.keywords.join(" / ")}
                    </div>
                  </div>
                  <h3 className="mt-3 text-base font-medium text-[color:var(--text-primary)]">
                    {entry.summary}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                    {entry.note}
                  </p>
                </div>
              ))
            ) : (
              <EmptyState message="当前筛选下还没有可展示的观念条目。" />
            )}
          </div>
        </Surface>

        <Surface className="p-5">
          <SectionHeading
            icon={MessagesSquare}
            title="反复出现的问题"
            description="先把会反复追问自己的问题收进来，后面再慢慢回答。"
          />

          <div className="mt-5 space-y-3">
            {questions.length > 0 ? (
              questions.map((entry) => (
                <div
                  key={entry}
                  className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]"
                >
                  {entry}
                </div>
              ))
            ) : (
              <EmptyState message="当前筛选下没有可展示的问题。" compact />
            )}
          </div>

          <div className="mt-5 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--text-primary)]">
              <Waypoints className="size-4" />
              这页以后会连接什么
            </div>
            <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
              未来会和反思、关系、成长环境互相链接，用来解释“我为什么会这样判断”。
            </p>
          </div>
        </Surface>
      </div>
    </div>
  )
}
