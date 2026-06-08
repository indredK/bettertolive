import {
  ArrowRight,
  CheckCheck,
  Compass,
  PencilLine,
  Plus,
  RefreshCcw,
  Sparkles,
  Target,
  type LucideIcon,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { FutureBlueprint, FutureMilestone } from "@/features/bettertolive/types"
import { EmptyState, SectionHeading, Surface } from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"
import {
  FutureBlueprintEditDialog,
  FutureExperimentEditDialog,
  FutureMilestoneEditDialog,
  type EditingFutureExperiment,
  type EditingFutureMilestone,
} from "@/features/bettertolive/ui/future/future-edit-dialog"

export function FuturePage({
  futureBlueprint,
  milestones,
  searchQuery,
  isStackedLayout = false,
  isControlMode = false,
  onRefresh,
}: {
  futureBlueprint: FutureBlueprint
  milestones: FutureMilestone[]
  searchQuery: string
  isStackedLayout?: boolean
  isControlMode?: boolean
  onRefresh?: () => void
}) {
  const { t } = useTranslation()
  const isFixedLayout = !isStackedLayout
  const [isEditingBlueprint, setIsEditingBlueprint] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<EditingFutureMilestone | null>(null)
  const [editingExperiment, setEditingExperiment] = useState<EditingFutureExperiment | null>(null)

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const filteredMilestones = useMemo(
    () =>
      milestones.filter((entry) =>
        matchesQuery(normalizedQuery, entry.horizon, entry.summary, ...entry.steps),
      ),
    [milestones, normalizedQuery],
  )
  const filteredExperiments = useMemo(
    () =>
      futureBlueprint.experiments
        .map((entry, index) => ({ entry, index }))
        .filter(({ entry }) => matchesQuery(normalizedQuery, entry)),
    [futureBlueprint.experiments, normalizedQuery],
  )
  const blueprintMatches =
    normalizedQuery.length > 0 &&
    matchesQuery(
      normalizedQuery,
      futureBlueprint.identity,
      futureBlueprint.lifestyle,
      ...futureBlueprint.values,
    )

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
            >
              {t("future.page.eyebrow", "未来蓝图")}
            </Badge>
            {isControlMode ? (
              <Badge className="bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]">
                {t("future.controlMode.on", "控制模式")}
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-[color:var(--chip-border)] bg-[color:var(--muted-surface-bg)] text-[color:var(--text-muted)]"
              >
                {t("future.controlMode.off", "浏览模式")}
              </Badge>
            )}
            {normalizedQuery ? (
              <Badge variant="outline" className="border-[color:var(--chip-border)]">
                {t("future.searching", "当前筛选：{{query}}", { query: searchQuery.trim() })}
              </Badge>
            ) : null}
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-[color:var(--text-primary)]">
            {t("future.page.title", "把想成为的人说清楚")}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-[color:var(--text-secondary)]">
            {t(
              "future.page.description",
              "未来不是系统替你预测的结果，而是你主动写下的方向。这里承接理想自我、理想生活、重要价值和阶段路径。",
            )}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {onRefresh ? (
            <Button
              type="button"
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)]"
              onClick={onRefresh}
            >
              <RefreshCcw className="size-4" />
              {t("future.refresh", "刷新")}
            </Button>
          ) : null}
          {isControlMode ? (
            <Button
              type="button"
              className="bg-[color:var(--tone-future-ink)] text-[color:var(--tone-future-bg)] hover:opacity-90"
              onClick={() => setIsEditingBlueprint(true)}
            >
              <PencilLine className="size-4" />
              {t("future.edit.blueprint", "编辑蓝图")}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.02fr)_minmax(0,1.08fr)]">
        <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col overflow-hidden")}>
          <div className="flex items-start justify-between gap-3">
            <SectionHeading
              icon={Sparkles}
              title={t("future.sections.definition.title", "理想定义")}
              description={t(
                "future.sections.definition.description",
                "先把方向说清楚，再把路径写具体。",
              )}
              compact
            />
            {isControlMode ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)]"
                onClick={() => setIsEditingBlueprint(true)}
              >
                <PencilLine className="size-3.5" />
                {t("future.edit.blueprint", "编辑蓝图")}
              </Button>
            ) : null}
          </div>

          <div
            className={cn("mt-4 space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}
          >
            <div className="grid gap-3 sm:grid-cols-3">
              <MetricCard
                label={t("future.metrics.values", "重要价值")}
                value={futureBlueprint.values.length}
                detail={t("future.metrics.valuesDetail", "价值不是口号，是持续筛选。")}
              />
              <MetricCard
                label={t("future.metrics.milestones", "阶段路径")}
                value={futureBlueprint.milestones.length}
                detail={t("future.metrics.milestonesDetail", "把远处的方向拆成近处步骤。")}
              />
              <MetricCard
                label={t("future.metrics.experiments", "当前实验")}
                value={futureBlueprint.experiments.length}
                detail={t("future.metrics.experimentsDetail", "先让生活里出现一点点变化。")}
              />
            </div>

            <DefinitionBlock
              label={t("future.definition.identity", "理想自我")}
              value={futureBlueprint.identity}
              icon={Target}
              highlighted={blueprintMatches}
              onEdit={isControlMode ? () => setIsEditingBlueprint(true) : undefined}
            />
            <DefinitionBlock
              label={t("future.definition.lifestyle", "理想生活")}
              value={futureBlueprint.lifestyle}
              icon={Compass}
              highlighted={blueprintMatches}
              onEdit={isControlMode ? () => setIsEditingBlueprint(true) : undefined}
            />

            <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-[color:var(--text-primary)]">
                    {t("future.definition.values", "重要价值")}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
                    {t("future.definition.valuesDesc", "这些词决定你会把时间和钱投向哪里。")}
                  </p>
                </div>
                {isControlMode ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="text-[color:var(--text-secondary)]"
                    onClick={() => setIsEditingBlueprint(true)}
                  >
                    <PencilLine className="size-3.5" />
                    {t("future.edit.blueprint", "编辑蓝图")}
                  </Button>
                ) : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {futureBlueprint.values.length > 0 ? (
                  futureBlueprint.values.map((value) => (
                    <Badge
                      key={value}
                      variant="outline"
                      className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
                    >
                      {value}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-[color:var(--text-muted)]">
                    {t("future.empty.values", "当前还没有价值关键词。")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Surface>

        <div className="grid min-h-0 gap-4 xl:grid-rows-[minmax(0,1fr)_minmax(0,0.72fr)]">
          <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col overflow-hidden")}>
            <div className="flex items-start justify-between gap-3">
              <SectionHeading
                icon={Target}
                title={t("future.sections.milestones.title", "阶段路径")}
                description={t(
                  "future.sections.milestones.description",
                  "先把未来拆成靠近方式，而不是终局答案。",
                )}
                compact
              />
              {isControlMode ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)]"
                  onClick={() =>
                    setEditingMilestone({
                      isNew: true,
                      index: null,
                      milestone: null,
                    })
                  }
                >
                  <Plus className="size-3.5" />
                  {t("future.addMilestone", "新增路径")}
                </Button>
              ) : null}
            </div>

            <div
              className={cn(
                "mt-4 space-y-3",
                isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1",
              )}
            >
              {filteredMilestones.length > 0 ? (
                filteredMilestones.map((entry) => {
                  const index = futureBlueprint.milestones.indexOf(entry)

                  return (
                    <MilestoneCard
                      key={`${entry.horizon}-${entry.summary}`}
                      entry={entry}
                      onEdit={
                        isControlMode
                          ? () =>
                              setEditingMilestone({
                                isNew: false,
                                index,
                                milestone: entry,
                              })
                          : undefined
                      }
                    />
                  )
                })
              ) : (
                <EmptyState message={t("future.empty.milestones", "当前筛选下没有未来路径。")} />
              )}
            </div>
          </Surface>

          <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col overflow-hidden")}>
            <div className="flex items-start justify-between gap-3">
              <SectionHeading
                icon={Compass}
                title={t("future.sections.experiments.title", "当前实验")}
                description={t(
                  "future.sections.experiments.description",
                  "不用一步到位，先让生活里出现一点点更像自己的东西。",
                )}
                compact
              />
              {isControlMode ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)]"
                  onClick={() =>
                    setEditingExperiment({
                      isNew: true,
                      index: null,
                      experiment: "",
                    })
                  }
                >
                  <Plus className="size-3.5" />
                  {t("future.addExperiment", "新增实验")}
                </Button>
              ) : null}
            </div>

            <div
              className={cn(
                "mt-4 space-y-3",
                isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1",
              )}
            >
              {filteredExperiments.length > 0 ? (
                filteredExperiments.map(({ entry, index }) => {
                  return (
                    <ExperimentCard
                      key={`${entry}-${index}`}
                      entry={entry}
                      editHint={t("future.edit.clickToEdit", "点击可编辑")}
                      onEdit={
                        isControlMode
                          ? () =>
                              setEditingExperiment({
                                isNew: false,
                                index,
                                experiment: entry,
                              })
                          : undefined
                      }
                    />
                  )
                })
              ) : (
                <EmptyState message={t("future.empty.experiments", "当前筛选下没有实验内容。")} />
              )}
            </div>
          </Surface>
        </div>
      </div>

      {isEditingBlueprint ? (
        <FutureBlueprintEditDialog
          future={futureBlueprint}
          onClose={() => setIsEditingBlueprint(false)}
        />
      ) : null}

      {editingMilestone ? (
        <FutureMilestoneEditDialog
          editing={editingMilestone}
          future={futureBlueprint}
          onClose={() => setEditingMilestone(null)}
        />
      ) : null}

      {editingExperiment ? (
        <FutureExperimentEditDialog
          editing={editingExperiment}
          future={futureBlueprint}
          onClose={() => setEditingExperiment(null)}
        />
      ) : null}
    </div>
  )
}

function MetricCard({ detail, label, value }: { detail: string; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3">
      <div className="text-xs text-[color:var(--text-muted)]">{label}</div>
      <div className="mt-1 text-xl font-semibold tracking-tight text-[color:var(--text-primary)]">
        {value}
      </div>
      <div className="mt-1 text-[11px] leading-5 text-[color:var(--text-muted)]">{detail}</div>
    </div>
  )
}

function DefinitionBlock({
  highlighted = false,
  icon: Icon,
  label,
  onEdit,
  value,
}: {
  highlighted?: boolean
  icon: LucideIcon
  label: string
  onEdit?: () => void
  value: string
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-4",
        highlighted
          ? "border-[color:var(--tone-future-border)] bg-[color:var(--tone-future-bg)]"
          : "border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)]",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-[color:var(--text-primary)]">
          <Icon className="size-4" />
          <div className="text-sm font-medium">{label}</div>
        </div>
        {onEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-[color:var(--text-secondary)]"
            onClick={onEdit}
          >
            <PencilLine className="size-3.5" />
          </Button>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">{value || " "}</p>
    </div>
  )
}

function MilestoneCard({ entry, onEdit }: { entry: FutureMilestone; onEdit?: () => void }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4",
        onEdit &&
          "transition hover:border-[color:var(--surface-border)] hover:bg-[color:var(--chip-bg)]",
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
        >
          {entry.horizon}
        </Badge>
        {onEdit ? (
          <Button type="button" variant="ghost" size="sm" onClick={onEdit}>
            <PencilLine className="size-3.5" />
          </Button>
        ) : null}
      </div>
      <p className="mt-3 text-sm leading-6 text-[color:var(--text-secondary)]">{entry.summary}</p>
      <ul className="mt-3 space-y-2 text-sm text-[color:var(--text-muted)]">
        {entry.steps.map((step) => (
          <li key={step} className="flex items-start gap-2 leading-6">
            <CheckCheck className="mt-1 size-3.5 shrink-0 text-[color:var(--text-muted)]" />
            <span>{step}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ExperimentCard({
  editHint,
  entry,
  onEdit,
}: {
  editHint: string
  entry: string
  onEdit?: () => void
}) {
  const content = (
    <>
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]">
        <ArrowRight className="size-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm leading-6 text-[color:var(--text-secondary)]">{entry}</div>
        {onEdit ? (
          <div className="mt-1 text-[11px] text-[color:var(--text-muted)]">{editHint}</div>
        ) : null}
      </div>
    </>
  )

  const className = cn(
    "flex w-full items-start gap-3 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-left",
    onEdit &&
      "transition hover:border-[color:var(--surface-border)] hover:bg-[color:var(--chip-bg)]",
  )

  if (!onEdit) {
    return <div className={className}>{content}</div>
  }

  return (
    <button type="button" className={className} onClick={onEdit}>
      {content}
    </button>
  )
}

function matchesQuery(query: string, ...values: Array<string | undefined>) {
  if (!query) return true
  return values.some((value) => value?.toLowerCase().includes(query))
}
