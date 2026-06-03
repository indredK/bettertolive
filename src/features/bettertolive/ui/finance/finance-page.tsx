import { CheckCheck, Wallet } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { TransactionEntry } from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  SummarySurface,
  Surface,
} from "@/features/bettertolive/ui/shared/shared"
import { MONEY_FORMATTER } from "@/features/bettertolive/ui/shared/formatters"
import { cn } from "@/lib/utils"

export function FinancePage({
  transactions,
  expenseTotal,
  incomeTotal,
  searchQuery,
  isStackedLayout = false,
}: {
  transactions: TransactionEntry[]
  expenseTotal: number
  incomeTotal: number
  searchQuery: string
  isStackedLayout?: boolean
}) {
  const isFixedLayout = !isStackedLayout
  const spendingByCategory = transactions
    .filter((entry) => entry.direction === "expense")
    .reduce<Record<string, number>>((accumulator, entry) => {
      accumulator[entry.category] = (accumulator[entry.category] ?? 0) + entry.amount
      return accumulator
    }, {})

  const categoryRows = Object.entries(spendingByCategory).sort((left, right) => right[1] - left[1])

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <PageIntro
        eyebrow="记账"
        title="让现实资源流向成为证据"
        description="这里先不追求复杂财务管理，而是帮助你看清自己到底正在怎样生活。"
        searchQuery={searchQuery}
      />

      <div className={cn("grid gap-4 min-[960px]:grid-cols-3", isFixedLayout && "shrink-0")}>
        <SummarySurface
          tone="present"
          title="本周支出"
          value={MONEY_FORMATTER.format(expenseTotal)}
          detail="把钱花向哪里，通常比说自己重视什么更诚实。"
        />
        <SummarySurface
          tone="value"
          title="最近收入"
          value={MONEY_FORMATTER.format(incomeTotal)}
          detail="自由度需要被现金流支撑，现实感也值得被看见。"
        />
        <SummarySurface
          tone="past"
          title="消费类别"
          value={`${categoryRows.length} 类`}
          detail="先看类型，再谈优化。趋势会慢慢浮出来。"
        />
      </div>

      <div
        className={cn(
          "grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.82fr)]",
          isFixedLayout && "min-h-0 flex-1 overflow-hidden",
        )}
      >
        <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col")}>
          <SectionHeading
            icon={Wallet}
            title="最近账目"
            description="mock 数据先让页面节奏成立，后面再接真实录入。"
          />

          <div
            className={cn("mt-5 space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}
          >
            {transactions.length > 0 ? (
              transactions.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-[color:var(--text-muted)]">{entry.date}</span>
                        <Badge
                          variant="outline"
                          className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                        >
                          {entry.category}
                        </Badge>
                      </div>
                      <h3 className="mt-2 text-base font-medium text-[color:var(--text-primary)]">
                        {entry.label}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                        {entry.note}
                      </p>
                    </div>

                    <div
                      className={
                        entry.direction === "income"
                          ? "shrink-0 text-base font-medium text-[color:var(--tone-present-ink)]"
                          : "shrink-0 text-base font-medium text-[color:var(--tone-value-ink)]"
                      }
                    >
                      {entry.direction === "income" ? "+" : "-"}
                      {MONEY_FORMATTER.format(entry.amount)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="当前筛选下还没有账目记录。" />
            )}
          </div>
        </Surface>

        <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col")}>
          <SectionHeading
            icon={CheckCheck}
            title="类别分布"
            description="不用图表也能先看出最近的钱在流向哪里。"
          />

          <div
            className={cn("mt-5 space-y-3", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}
          >
            {categoryRows.length > 0 ? (
              categoryRows.map(([category, amount]) => {
                const progress = Math.max(
                  16,
                  Math.round((amount / Math.max(expenseTotal, 1)) * 100),
                )

                return (
                  <div key={category} className="space-y-2">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium text-[color:var(--text-secondary)]">
                        {category}
                      </span>
                      <span className="text-[color:var(--text-muted)]">
                        {MONEY_FORMATTER.format(amount)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[color:var(--muted-surface-border)]">
                      <div
                        className="h-2 rounded-full bg-[color:var(--text-primary)]"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )
              })
            ) : (
              <EmptyState message="当前筛选下没有可展示的消费类别。" compact />
            )}
          </div>
        </Surface>
      </div>
    </div>
  )
}
