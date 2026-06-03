import { BookHeart, Salad, Utensils } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { NutritionFoodMemory, NutritionMealEntry } from "@/features/bettertolive/types"
import {
  EmptyState,
  PageIntro,
  SectionHeading,
  SummarySurface,
  Surface,
} from "@/features/bettertolive/ui/shared"

export function NutritionPage({
  meals,
  weeklyHighlights,
  foodMemories,
  searchQuery,
}: {
  meals: NutritionMealEntry[]
  weeklyHighlights: string[]
  foodMemories: NutritionFoodMemory[]
  searchQuery: string
}) {
  return (
    <div className="space-y-5">
      <PageIntro
        eyebrow="饮食"
        title="看见吃这件事在生活里的位置"
        description="这页不算卡路里，而是用场景、构成、触发和身体反馈，把吃和生活连起来。"
        searchQuery={searchQuery}
      />

      <div className="grid gap-4 min-[960px]:grid-cols-3">
        <SummarySurface
          tone="present"
          title="本周记录"
          value={`${meals.length} 顿`}
          detail="每顿带着场景、构成、触发和身体反馈一起回看。"
        />
        <SummarySurface
          tone="value"
          title="结构发现"
          value={`${weeklyHighlights.length} 条`}
          detail="比起单顿好坏，结构性的发现更能改变下一步。"
        />
        <SummarySurface
          tone="past"
          title="食物记忆"
          value={`${foodMemories.length} 条`}
          detail="有些味道不属于单次进食，而是一段关系和时间。"
        />
      </div>

      <div className="grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.88fr)]">
        <Surface className="p-5">
          <SectionHeading
            icon={Utensils}
            title="最近进食"
            description="按场景、构成、触发记录每一顿，再补一段身体反馈。"
          />

          <div className="mt-5 space-y-4">
            {meals.length > 0 ? (
              meals.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-[color:var(--text-primary)]">
                      {entry.date}
                    </span>
                    <Badge
                      variant="outline"
                      className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                    >
                      {entry.scene}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                    >
                      {entry.structure}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                    >
                      {entry.trigger}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                    {entry.note}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[color:var(--text-muted)]">
                    <span>构成：{entry.composition}</span>
                    <span>性价比：{entry.valueDensity}</span>
                    <span>身体反馈：{entry.bodyFeedback}</span>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState message="当前筛选下没有进食记录。" />
            )}
          </div>
        </Surface>

        <div className="space-y-4">
          <Surface className="p-5">
            <SectionHeading
              icon={Salad}
              title="本周观察"
              description="看结构而不是看单顿，发现才会真的留下来。"
            />

            <div className="mt-5 space-y-3">
              {weeklyHighlights.length > 0 ? (
                weeklyHighlights.map((entry) => (
                  <div
                    key={entry}
                    className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]"
                  >
                    {entry}
                  </div>
                ))
              ) : (
                <EmptyState message="本周还没有结构性的发现。" compact />
              )}
            </div>
          </Surface>

          <Surface className="p-5">
            <SectionHeading
              icon={BookHeart}
              title="食物记忆"
              description="把那些和人、地方、人生节点绑定的味道单独放一边。"
            />

            <div className="mt-5 space-y-3">
              {foodMemories.length > 0 ? (
                foodMemories.map((entry) => (
                  <div
                    key={entry.id}
                    className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-4 py-3"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium text-[color:var(--text-primary)]">
                        {entry.name}
                      </span>
                      <Badge
                        variant="outline"
                        className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
                      >
                        {entry.type}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                      {entry.story}
                    </p>
                  </div>
                ))
              ) : (
                <EmptyState message="还没有添加食物记忆。" compact />
              )}
            </div>
          </Surface>
        </div>
      </div>
    </div>
  )
}
