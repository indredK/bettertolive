import { ListTodo } from "lucide-react"

import type { ShoppingColumn } from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  SummarySurface,
  Surface,
} from "@/features/bettertolive/ui/shared"

export function ShoppingPage({
  columns,
  visibleCount,
  searchQuery,
}: {
  columns: ShoppingColumn[]
  visibleCount: number
  searchQuery: string
}) {
  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="购物清单"
        title="让需求、欲望和决策都能被看见"
        description="买东西不只是买东西，它也暴露了你最近最缺什么、最想补什么，以及你怎么照顾自己的现实生活。"
        searchQuery={searchQuery}
      />

      <div className="grid gap-4 min-[960px]:grid-cols-3">
        <SummarySurface
          tone="future"
          title="可见条目"
          value={`${visibleCount} 项`}
          detail="先把想要和需要分开，很多混乱会立刻下降。"
        />
        <SummarySurface
          tone="past"
          title="想买"
          value={`${columns[0]?.items.length ?? 0} 项`}
          detail="更像向往和投射，提醒你最近在追求什么。"
        />
        <SummarySurface
          tone="present"
          title="待买 + 已买"
          value={`${(columns[1]?.items.length ?? 0) + (columns[2]?.items.length ?? 0)} 项`}
          detail="现实安排会慢慢告诉你，理想生活落地到了哪里。"
        />
      </div>

      <div className="grid gap-4 min-[1240px]:grid-cols-3">
        {columns.map((column) => (
          <Surface key={column.id} className="p-5">
            <SectionHeading
              icon={ListTodo}
              title={column.title}
              description={column.subtitle}
            />

            <div className="mt-5 space-y-3">
              {column.items.length > 0 ? (
                column.items.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium text-[color:var(--text-primary)]">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                          {item.note}
                        </p>
                      </div>
                      <span className="shrink-0 text-sm text-[color:var(--text-muted)]">
                        {item.price}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  message={`当前筛选下，${column.title} 暂时没有条目。`}
                  compact
                />
              )}
            </div>
          </Surface>
        ))}
      </div>
    </div>
  )
}
