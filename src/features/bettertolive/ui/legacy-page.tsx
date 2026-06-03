import { CheckCheck, ScrollText, Waypoints } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type {
  LegacyDirective,
  LegacyLetter,
  LegacyPreference,
  LegacyWish,
} from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  SummarySurface,
  Surface,
} from "@/features/bettertolive/ui/shared"
import { cn } from "@/lib/utils"

export function LegacyPage({
  directives,
  letters,
  wishes,
  preferences,
  lifeReview,
  searchQuery,
  isStackedLayout = false,
}: {
  directives: LegacyDirective[]
  letters: LegacyLetter[]
  wishes: LegacyWish[]
  preferences: LegacyPreference[]
  lifeReview: string[]
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
        eyebrow="生命整理"
        title="把重要的话提前安放好"
        description="这页承接重要交代、留给某人的话、未完成的牵挂和人生回顾。重点不是制造沉重，而是给托付留下位置。"
        searchQuery={searchQuery}
      />

      <div className={cn("grid gap-4 min-[960px]:grid-cols-3", isFixedLayout && "shrink-0")}>
        <SummarySurface
          tone="value"
          title="重要交代"
          value={`${directives.length} 项`}
          detail="让现实层面的线索和安排，不只留在自己脑子里。"
        />
        <SummarySurface
          tone="future"
          title="留给某人的话"
          value={`${letters.length} 条`}
          detail="很多表达不一定要现在就交付，但值得先被认真保留。"
        />
        <SummarySurface
          tone="past"
          title="未完成牵挂"
          value={`${wishes.length} 条`}
          detail="有些重量并不是来自结果，而是来自始终没被安放的心愿。"
        />
      </div>

      <div
        className={cn(
          "grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.22fr)_minmax(340px,0.9fr)]",
          isFixedLayout && "min-h-0 flex-1 overflow-hidden",
        )}
      >
        <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col")}>
          <SectionHeading
            icon={CheckCheck}
            title="重要交代与留给某人的话"
            description="先把现实线索和想说的话分开放，这样既清楚，也不会让表达被迫变成单一文件。"
          />

          <div
            className={cn("mt-5 space-y-5", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}
          >
            <div className="space-y-4">
              {directives.length > 0 ? (
                directives.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                  >
                    <div className="font-medium text-[color:var(--text-primary)]">
                      {entry.title}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                      {entry.detail}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState message="当前筛选下没有重要交代。" />
              )}
            </div>

            <div className="space-y-3">
              {letters.length > 0 ? (
                letters.map((entry) => (
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
                <EmptyState message="当前筛选下没有可展示的留言。" compact />
              )}
            </div>
          </div>
        </Surface>

        <div className={cn("space-y-4", isFixedLayout && "min-h-0 overflow-y-auto pr-1")}>
          <Surface className="p-5">
            <SectionHeading
              icon={ScrollText}
              title="人生回顾与未完成的事"
              description="这里放的不是标准答案，而是你想留下来的理解和仍然挂心的东西。"
            />

            <div className="mt-5 space-y-3">
              {lifeReview.length > 0 ? (
                lifeReview.map((entry) => (
                  <div
                    key={entry}
                    className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]"
                  >
                    {entry}
                  </div>
                ))
              ) : (
                <EmptyState message="当前筛选下没有人生回顾。" compact />
              )}
            </div>

            <div className="mt-5 space-y-3">
              {wishes.length > 0
                ? wishes.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4"
                    >
                      <div className="font-medium text-[color:var(--text-primary)]">
                        {entry.title}
                      </div>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
                        {entry.detail}
                      </p>
                    </div>
                  ))
                : null}
            </div>
          </Surface>

          <Surface className="p-5">
            <SectionHeading
              icon={Waypoints}
              title="偏好与安排"
              description="用更克制的方式放下纪念偏好、物品去向和文字保留方式。"
            />

            <div className="mt-5 space-y-3">
              {preferences.length > 0 ? (
                preferences.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                  >
                    <div className="font-medium text-[color:var(--text-primary)]">
                      {entry.label}
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                      {entry.note}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState message="当前筛选下没有可展示的安排偏好。" compact />
              )}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  )
}
