import { CheckCheck, Scale, Shield } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { PrincipleEntry } from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  SummarySurface,
  Surface,
} from "@/features/bettertolive/ui/shared"

export function PrinciplesPage({
  principles,
  boundaries,
  searchQuery,
}: {
  principles: PrincipleEntry[]
  boundaries: string[]
  searchQuery: string
}) {
  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="原则"
        title="把原则和底线从模糊感觉里拿出来"
        description="这里不是给自己立规矩，而是把真正重要、真正不能退让的东西说清楚。"
        searchQuery={searchQuery}
      />

      <div className="grid gap-4 min-[960px]:grid-cols-3">
        <SummarySurface
          tone="present"
          title="原则"
          value={`${principles.length} 条`}
          detail="帮助你处理选择时不再只靠当下情绪。"
        />
        <SummarySurface
          tone="value"
          title="底线"
          value={`${boundaries.length} 条`}
          detail="越明确，越不容易在关系和工作里丢掉自己。"
        />
        <SummarySurface
          tone="past"
          title="来源"
          value="来自经历"
          detail="很多原则不是想出来的，而是被过去逼着长出来的。"
        />
      </div>

      <div className="grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.88fr)]">
        <Surface className="p-5">
          <SectionHeading
            icon={Scale}
            title="原则清单"
            description="这页以后会变成做决策时最稳定的参照。"
          />

          <div className="mt-5 space-y-4">
            {principles.length > 0 ? (
              principles.map((entry) => (
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
                      {entry.source}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                    {entry.description}
                  </p>
                  <div className="mt-3 rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 py-3 text-sm leading-6 text-[color:var(--text-secondary)]">
                    <span className="font-medium text-[color:var(--text-primary)]">底线：</span>
                    {entry.boundary}
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="当前筛选下还没有可展示的原则条目。" />
            )}
          </div>
        </Surface>

        <Surface className="p-5">
          <SectionHeading
            icon={Shield}
            title="不想再退让的地方"
            description="先把不想失去的部分写出来，很多边界才有支点。"
          />

          <div className="mt-5 space-y-3">
            {boundaries.length > 0 ? (
              boundaries.map((entry) => (
                <div
                  key={entry}
                  className="flex items-start gap-3 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3"
                >
                  <CheckCheck className="mt-1 size-4 shrink-0 text-[color:var(--text-muted)]" />
                  <p className="text-sm leading-6 text-[color:var(--text-secondary)]">{entry}</p>
                </div>
              ))
            ) : (
              <EmptyState message="当前筛选下没有可展示的底线。" compact />
            )}
          </div>
        </Surface>
      </div>
    </div>
  )
}
