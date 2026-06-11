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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
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

      <Tabs
        defaultValue="blueprint"
        className={cn("min-h-0 flex-1 flex-col", isFixedLayout && "overflow-hidden")}
      >
        <TabsList className="hide-scrollbar max-w-full shrink-0 justify-start overflow-x-auto">
          <TabsTrigger value="blueprint">{t("future.tabs.blueprint", "蓝图")}</TabsTrigger>
          <TabsTrigger value="milestones">{t("future.tabs.milestones", "阶段路径")}</TabsTrigger>
          <TabsTrigger value="experiments">{t("future.tabs.experiments", "当前实验")}</TabsTrigger>
          <TabsTrigger value="alignment">{t("future.tabs.alignment", "对齐检查")}</TabsTrigger>
        </TabsList>

        <TabsContent
          value="blueprint"
          className={cn("mt-3", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          <div className="grid h-full gap-4 min-[1240px]:grid-cols-[minmax(0,1.02fr)_minmax(0,1.08fr)]">
            <FutureBlueprintPanel
              blueprintMatches={blueprintMatches}
              futureBlueprint={futureBlueprint}
              isControlMode={isControlMode}
              isFixedLayout={isFixedLayout}
              onEditBlueprint={() => setIsEditingBlueprint(true)}
            />
            <div className="grid min-h-0 gap-4 xl:grid-rows-[minmax(0,1fr)_minmax(0,0.72fr)]">
              <FutureMilestonesPanel
                futureBlueprint={futureBlueprint}
                isControlMode={isControlMode}
                isFixedLayout={isFixedLayout}
                milestones={filteredMilestones}
                onCreate={() =>
                  setEditingMilestone({
                    isNew: true,
                    index: null,
                    milestone: null,
                  })
                }
                onEdit={(entry, index) =>
                  setEditingMilestone({
                    isNew: false,
                    index,
                    milestone: entry,
                  })
                }
              />
              <FutureExperimentsPanel
                experiments={filteredExperiments}
                isControlMode={isControlMode}
                isFixedLayout={isFixedLayout}
                onCreate={() =>
                  setEditingExperiment({
                    isNew: true,
                    index: null,
                    experiment: "",
                  })
                }
                onEdit={(entry, index) =>
                  setEditingExperiment({
                    isNew: false,
                    index,
                    experiment: entry,
                  })
                }
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent
          value="milestones"
          className={cn("mt-3", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          <FutureMilestonesPanel
            futureBlueprint={futureBlueprint}
            isControlMode={isControlMode}
            isFixedLayout={isFixedLayout}
            milestones={filteredMilestones}
            onCreate={() =>
              setEditingMilestone({
                isNew: true,
                index: null,
                milestone: null,
              })
            }
            onEdit={(entry, index) =>
              setEditingMilestone({
                isNew: false,
                index,
                milestone: entry,
              })
            }
          />
        </TabsContent>

        <TabsContent
          value="experiments"
          className={cn("mt-3", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          <FutureExperimentsPanel
            experiments={filteredExperiments}
            isControlMode={isControlMode}
            isFixedLayout={isFixedLayout}
            onCreate={() =>
              setEditingExperiment({
                isNew: true,
                index: null,
                experiment: "",
              })
            }
            onEdit={(entry, index) =>
              setEditingExperiment({
                isNew: false,
                index,
                experiment: entry,
              })
            }
          />
        </TabsContent>

        <TabsContent
          value="alignment"
          className={cn("mt-3", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          <FutureAlignmentPanel
            futureBlueprint={futureBlueprint}
            isFixedLayout={isFixedLayout}
            milestones={futureBlueprint.milestones}
          />
        </TabsContent>
      </Tabs>

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

function FutureBlueprintPanel({
  blueprintMatches,
  futureBlueprint,
  isControlMode,
  isFixedLayout,
  onEditBlueprint,
}: {
  blueprintMatches: boolean
  futureBlueprint: FutureBlueprint
  isControlMode: boolean
  isFixedLayout: boolean
  onEditBlueprint: () => void
}) {
  const { t } = useTranslation()

  return (
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
            onClick={onEditBlueprint}
          >
            <PencilLine className="size-3.5" />
            {t("future.edit.blueprint", "编辑蓝图")}
          </Button>
        ) : null}
      </div>

      <div className={cn("mt-4 space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}>
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
          onEdit={isControlMode ? onEditBlueprint : undefined}
        />
        <DefinitionBlock
          label={t("future.definition.lifestyle", "理想生活")}
          value={futureBlueprint.lifestyle}
          icon={Compass}
          highlighted={blueprintMatches}
          onEdit={isControlMode ? onEditBlueprint : undefined}
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
                onClick={onEditBlueprint}
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
  )
}

function FutureMilestonesPanel({
  futureBlueprint,
  isControlMode,
  isFixedLayout,
  milestones,
  onCreate,
  onEdit,
}: {
  futureBlueprint: FutureBlueprint
  isControlMode: boolean
  isFixedLayout: boolean
  milestones: FutureMilestone[]
  onCreate: () => void
  onEdit: (entry: FutureMilestone, index: number) => void
}) {
  const { t } = useTranslation()

  return (
    <Surface className={cn("p-5", isFixedLayout && "flex h-full min-h-0 flex-col overflow-hidden")}>
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
            onClick={onCreate}
          >
            <Plus className="size-3.5" />
            {t("future.addMilestone", "新增路径")}
          </Button>
        ) : null}
      </div>

      <div className={cn("mt-4 space-y-3", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}>
        {milestones.length > 0 ? (
          milestones.map((entry) => {
            const index = futureBlueprint.milestones.indexOf(entry)

            return (
              <MilestoneCard
                key={`${entry.horizon}-${entry.summary}`}
                entry={entry}
                onEdit={isControlMode ? () => onEdit(entry, index) : undefined}
              />
            )
          })
        ) : (
          <EmptyState message={t("future.empty.milestones", "当前筛选下没有未来路径。")} />
        )}
      </div>
    </Surface>
  )
}

function FutureExperimentsPanel({
  experiments,
  isControlMode,
  isFixedLayout,
  onCreate,
  onEdit,
}: {
  experiments: Array<{ entry: string; index: number }>
  isControlMode: boolean
  isFixedLayout: boolean
  onCreate: () => void
  onEdit: (entry: string, index: number) => void
}) {
  const { t } = useTranslation()

  return (
    <Surface className={cn("p-5", isFixedLayout && "flex h-full min-h-0 flex-col overflow-hidden")}>
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
            onClick={onCreate}
          >
            <Plus className="size-3.5" />
            {t("future.addExperiment", "新增实验")}
          </Button>
        ) : null}
      </div>

      <div className={cn("mt-4 space-y-3", isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1")}>
        {experiments.length > 0 ? (
          experiments.map(({ entry, index }) => (
            <ExperimentCard
              key={`${entry}-${index}`}
              entry={entry}
              editHint={t("future.edit.clickToEdit", "点击可编辑")}
              onEdit={isControlMode ? () => onEdit(entry, index) : undefined}
            />
          ))
        ) : (
          <EmptyState message={t("future.empty.experiments", "当前筛选下没有实验内容。")} />
        )}
      </div>
    </Surface>
  )
}

function FutureAlignmentPanel({
  futureBlueprint,
  isFixedLayout,
  milestones,
}: {
  futureBlueprint: FutureBlueprint
  isFixedLayout: boolean
  milestones: FutureMilestone[]
}) {
  const { t } = useTranslation()
  const checks = [
    {
      title: t("future.alignment.identity.title", "理想自我是否清楚"),
      detail: futureBlueprint.identity || t("future.empty.identity", "还没有写下理想自我。"),
    },
    {
      title: t("future.alignment.values.title", "价值是否能筛选选择"),
      detail:
        futureBlueprint.values.length > 0
          ? futureBlueprint.values.join(" · ")
          : t("future.empty.values", "当前还没有价值关键词。"),
    },
    {
      title: t("future.alignment.path.title", "路径是否已经拆近"),
      detail:
        milestones[0]?.summary ??
        t("future.alignment.path.empty", "还没有能承接当前方向的阶段路径。"),
    },
    {
      title: t("future.alignment.experiment.title", "生活里是否已有实验"),
      detail:
        futureBlueprint.experiments[0] ??
        t("future.alignment.experiment.empty", "还没有当前实验。"),
    },
  ]

  return (
    <Surface className={cn("p-5", isFixedLayout && "flex h-full min-h-0 flex-col overflow-hidden")}>
      <SectionHeading
        icon={CheckCheck}
        title={t("future.alignment.title", "对齐检查")}
        description={t(
          "future.alignment.description",
          "用四个问题检查蓝图是否已经能回到当下行动。",
        )}
        compact
      />
      <div
        className={cn(
          "mt-5 grid gap-3 min-[960px]:grid-cols-2",
          isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1",
        )}
      >
        {checks.map((check) => (
          <div
            key={check.title}
            className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
          >
            <div className="text-sm font-medium text-[color:var(--text-primary)]">
              {check.title}
            </div>
            <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
              {check.detail}
            </p>
          </div>
        ))}
      </div>
    </Surface>
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
