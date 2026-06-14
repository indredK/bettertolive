import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Activity, CheckCheck, Pencil, Plus, Scale, Shield, Waypoints } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { ActionGroup, AnimatedButton, AnimatedIconButton } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  PrincipleEntry,
  PrinciplePerspective,
  PrincipleRelation,
  PrinciplesModuleData,
} from "@/features/bettertolive/types"
import {
  PrincipleEditDialog,
  type EditingPrinciple,
} from "@/features/bettertolive/ui/principles/principle-edit-dialog"
import {
  PRINCIPLE_COSTS,
  PRINCIPLE_DOMAINS,
  PRINCIPLE_SOURCES,
  PRINCIPLE_STATUSES,
  PRINCIPLE_STRENGTHS,
  PRINCIPLE_TYPES,
  type PrincipleEnumGroup,
  translatePrincipleEnum,
} from "@/features/bettertolive/ui/principles/principles-page-data"
import { EmptyState, SectionHeading, Surface } from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"

type DistributionRow = {
  label: string
  count: number
}

type ClassificationSection = {
  title: string
  description: string
  enumGroup: PrincipleEnumGroup
  rows: DistributionRow[]
}

function createDistribution<T extends string>(
  order: readonly T[],
  principles: PrincipleEntry[],
  getValue: (principle: PrincipleEntry) => T,
) {
  const counts = new Map<T, number>()

  principles.forEach((principle) => {
    const value = getValue(principle)
    counts.set(value, (counts.get(value) ?? 0) + 1)
  })

  const orderedLabels = new Set<T>(order)
  principles.forEach((principle) => orderedLabels.add(getValue(principle)))

  return [...orderedLabels].map((label) => ({
    label,
    count: counts.get(label) ?? 0,
  }))
}

function createPrincipleLookup(principles: PrincipleEntry[]) {
  return new Map(principles.map((principle) => [principle.id, principle]))
}

function getPrinciplePerspective(principle: PrincipleEntry): PrinciplePerspective {
  if (principle.perspective) {
    return principle.perspective
  }

  if (principle.source === "观察他人" || principle.source === "家庭继承") {
    return "他人原则"
  }

  return "个人原则"
}

export function PrinciplesPage({
  editablePrinciplesModule,
  principlesModule,
  isControlMode = false,
  isStackedLayout = false,
  onRefresh,
}: {
  editablePrinciplesModule?: PrinciplesModuleData
  principlesModule: PrinciplesModuleData
  isControlMode?: boolean
  isStackedLayout?: boolean
  onRefresh?: () => void
}) {
  const { t } = useTranslation()
  const isFixedLayout = !isStackedLayout
  const [activeTab, setActiveTab] = useState("overview")
  const [editingPrinciple, setEditingPrinciple] = useState<EditingPrinciple | null>(null)
  const principles = principlesModule.entries
  const principleById = useMemo(() => createPrincipleLookup(principles), [principles])
  const personalPrinciples = useMemo(
    () => principles.filter((principle) => getPrinciplePerspective(principle) === "个人原则"),
    [principles],
  )
  const otherPrinciples = useMemo(
    () => principles.filter((principle) => getPrinciplePerspective(principle) === "他人原则"),
    [principles],
  )
  const saveSourcePrinciplesModule = editablePrinciplesModule ?? principlesModule
  const classificationSections = useMemo<ClassificationSection[]>(
    () => [
      {
        title: t("principles.classification.domain.title"),
        description: t("principles.classification.domain.description"),
        enumGroup: "domain",
        rows: createDistribution(PRINCIPLE_DOMAINS, principles, (principle) => principle.domain),
      },
      {
        title: t("principles.classification.type.title"),
        description: t("principles.classification.type.description"),
        enumGroup: "type",
        rows: createDistribution(PRINCIPLE_TYPES, principles, (principle) => principle.type),
      },
      {
        title: t("principles.classification.strength.title"),
        description: t("principles.classification.strength.description"),
        enumGroup: "strength",
        rows: createDistribution(
          PRINCIPLE_STRENGTHS,
          principles,
          (principle) => principle.strength,
        ),
      },
      {
        title: t("principles.classification.source.title"),
        description: t("principles.classification.source.description"),
        enumGroup: "source",
        rows: createDistribution(PRINCIPLE_SOURCES, principles, (principle) => principle.source),
      },
      {
        title: t("principles.classification.status.title"),
        description: t("principles.classification.status.description"),
        enumGroup: "status",
        rows: createDistribution(PRINCIPLE_STATUSES, principles, (principle) => principle.status),
      },
    ],
    [principles, t],
  )
  const costRows = useMemo(
    () => createDistribution(PRINCIPLE_COSTS, principles, (principle) => principle.cost),
    [principles],
  )
  const handleSaved = () => {
    setEditingPrinciple(null)
    onRefresh?.()
  }

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className={cn("min-h-0 flex-1", isFixedLayout && "overflow-hidden")}
      >
        <div className="flex shrink-0 items-center gap-2 overflow-hidden">
          <div className="min-w-0 flex-1 overflow-hidden">
            <TabsList className="hide-scrollbar max-w-full shrink-0 justify-start overflow-x-auto">
              <TabsTrigger value="overview">{t("principles.tabs.overview")}</TabsTrigger>
              <TabsTrigger value="personal">{t("principles.tabs.personal")}</TabsTrigger>
              <TabsTrigger value="others">{t("principles.tabs.others")}</TabsTrigger>
              <TabsTrigger value="practice">{t("principles.tabs.practiceWorkbench")}</TabsTrigger>
            </TabsList>
          </div>

          <PrinciplesControlStrip
            isControlMode={isControlMode}
            principlesCount={principles.length}
            relationsCount={principlesModule.relations.length}
            onCreate={() => setEditingPrinciple({ isNew: true, principle: null })}
          />
        </div>

        <TabsContent
          value="overview"
          className={cn("mt-3", isFixedLayout && "h-full min-h-0 overflow-hidden")}
        >
          {isFixedLayout ? (
            <PrinciplesFixedDashboard
              classificationSections={classificationSections}
              costRows={costRows}
              isControlMode={isControlMode}
              onEditPrinciple={(principle) => setEditingPrinciple({ isNew: false, principle })}
              principleById={principleById}
              principles={principles}
              principlesModule={principlesModule}
            />
          ) : (
            <div className="space-y-4">
              <Surface className="p-5">
                <SectionHeading
                  icon={Waypoints}
                  title={t("principles.sections.classification.title")}
                  description={t(
                    "principles.sections.classification.description",
                    "这些维度负责分组和观察决策体系；cost 留在详情和校准区里。",
                  )}
                />

                <div className="mt-5 grid gap-3 min-[960px]:grid-cols-2 min-[1240px]:grid-cols-5">
                  {classificationSections.map((section) => (
                    <ClassificationPanel
                      key={section.title}
                      enumGroup={section.enumGroup}
                      title={section.title}
                      description={section.description}
                      rows={section.rows}
                      total={principles.length}
                    />
                  ))}
                </div>

                <div className="mt-4 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4">
                  <div className="text-sm font-medium text-[color:var(--text-primary)]">
                    {t("principles.cost.title")}
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
                    {t(
                      "principles.cost.description",
                      "代价是单条原则的评估属性，用来判断守住它需要准备什么，不放进主筛选器。",
                    )}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {costRows
                      .filter((row) => row.count > 0)
                      .map((row) => (
                        <Badge
                          key={row.label}
                          variant="outline"
                          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
                        >
                          {translatePrincipleEnum(t, "cost", row.label)} · {row.count}
                        </Badge>
                      ))}
                  </div>
                </div>
              </Surface>

              <div className="grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.14fr)_minmax(0,0.86fr)]">
                <Surface className="p-5">
                  <SectionHeading
                    icon={Scale}
                    title={t("principles.sections.entries.title")}
                    description={t(
                      "principles.sections.entries.description",
                      "详情里始终显示 cost，让每条原则的真实代价浮上来。",
                    )}
                  />

                  <div className="mt-5 space-y-4">
                    {principles.length > 0 ? (
                      principles.map((principle) => (
                        <PrincipleCard
                          key={principle.id}
                          isControlMode={isControlMode}
                          principle={principle}
                          onEdit={() => setEditingPrinciple({ isNew: false, principle })}
                        />
                      ))
                    ) : (
                      <EmptyState
                        message={t(
                          "principles.empty.entries",
                          "当前筛选下还没有可展示的原则条目。",
                        )}
                        compact
                      />
                    )}
                  </div>
                </Surface>

                <div className="space-y-4">
                  <Surface className="p-5">
                    <SectionHeading
                      icon={Shield}
                      title={t("principles.sections.boundaries.title")}
                      description={t(
                        "principles.sections.boundaries.description",
                        "底线不是用来表演坚定，而是提前说明哪里真的不能再被突破。",
                      )}
                    />

                    <div className="mt-5 space-y-3">
                      {principlesModule.boundaries.length > 0 ? (
                        principlesModule.boundaries.map((boundary) => (
                          <BoundaryCard key={boundary} boundary={boundary} />
                        ))
                      ) : (
                        <EmptyState message={t("principles.empty.boundaries")} compact />
                      )}
                    </div>
                  </Surface>

                  <Surface className="p-5">
                    <SectionHeading
                      icon={Activity}
                      title={t("principles.sections.prompts.title")}
                      description={t(
                        "principles.sections.prompts.description",
                        "面对具体选择时，先调出相关原则，再看强度和代价。",
                      )}
                    />

                    <div className="mt-5 space-y-3">
                      {principlesModule.decisionPrompts.length > 0 ? (
                        principlesModule.decisionPrompts.map((prompt) => (
                          <DecisionPromptCard key={prompt} prompt={prompt} />
                        ))
                      ) : (
                        <EmptyState message={t("principles.empty.prompts")} compact />
                      )}
                    </div>
                  </Surface>
                </div>
              </div>

              <Surface className="p-5">
                <SectionHeading
                  icon={Waypoints}
                  title={t("principles.sections.relations.title")}
                  description={t(
                    "principles.sections.relations.description",
                    "原则体系不是散点，很多原则会互相支撑，也可能在真实生活里互相拉扯。",
                  )}
                />

                <div className="mt-5 grid gap-3 min-[960px]:grid-cols-2">
                  {principlesModule.relations.length > 0 ? (
                    principlesModule.relations.map((relation) => (
                      <RelationCard
                        key={relation.id}
                        principleById={principleById}
                        relation={relation}
                      />
                    ))
                  ) : (
                    <EmptyState message={t("principles.empty.relations")} compact />
                  )}
                </div>
              </Surface>
            </div>
          )}
        </TabsContent>

        <TabsContent
          value="personal"
          className={cn("mt-3", isFixedLayout && "h-full min-h-0 overflow-hidden")}
        >
          <PrinciplesPerspectiveTab
            title={t("principles.personal.title")}
            description={t(
              "principles.personal.description",
              "把自己主动推导、受伤后确认、已经决定长期持有的原则放在一起看。",
            )}
            emptyMessage={t("principles.empty.personal")}
            isFixedLayout={isFixedLayout}
            isControlMode={isControlMode}
            onEditPrinciple={(principle) => setEditingPrinciple({ isNew: false, principle })}
            principles={personalPrinciples}
          />
        </TabsContent>

        <TabsContent
          value="others"
          className={cn("mt-3", isFixedLayout && "h-full min-h-0 overflow-hidden")}
        >
          <PrinciplesPerspectiveTab
            title={t("principles.others.title")}
            description={t(
              "principles.others.description",
              "把观察他人、家庭继承或暂时借来使用的原则单独放出来，方便分辨什么真正属于自己。",
            )}
            emptyMessage={t("principles.empty.others")}
            isFixedLayout={isFixedLayout}
            isControlMode={isControlMode}
            onEditPrinciple={(principle) => setEditingPrinciple({ isNew: false, principle })}
            principles={otherPrinciples}
          />
        </TabsContent>

        <TabsContent
          value="practice"
          className={cn("mt-3", isFixedLayout && "h-full min-h-0 overflow-hidden")}
        >
          <PrinciplesPracticeWorkbench
            isFixedLayout={isFixedLayout}
            principleById={principleById}
            principles={principles}
            principlesModule={principlesModule}
          />
        </TabsContent>
      </Tabs>

      {editingPrinciple ? (
        <PrincipleEditDialog
          key={editingPrinciple.principle?.id ?? "new-principle"}
          editing={editingPrinciple}
          principlesModule={saveSourcePrinciplesModule}
          onClose={() => setEditingPrinciple(null)}
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  )
}

function PrinciplesPerspectiveTab({
  title,
  description,
  emptyMessage,
  isFixedLayout,
  isControlMode,
  onEditPrinciple,
  principles,
}: {
  title: string
  description: string
  emptyMessage: string
  isFixedLayout: boolean
  isControlMode: boolean
  onEditPrinciple: (principle: PrincipleEntry) => void
  principles: PrincipleEntry[]
}) {
  const { t } = useTranslation()
  const sourceRows = createDistribution(
    PRINCIPLE_SOURCES,
    principles,
    (principle) => principle.source,
  )
  const statusRows = createDistribution(
    PRINCIPLE_STATUSES,
    principles,
    (principle) => principle.status,
  )
  const featuredPrinciples = [...principles]
    .sort((first, second) => {
      const firstScore = (first.strength === "不可退让" ? 2 : 0) + (first.cost === "高代价" ? 1 : 0)
      const secondScore =
        (second.strength === "不可退让" ? 2 : 0) + (second.cost === "高代价" ? 1 : 0)

      return secondScore - firstScore
    })
    .slice(0, 4)

  if (isFixedLayout) {
    return (
      <div className="grid h-full min-h-0 grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] gap-3 overflow-hidden">
        <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
          <SectionHeading icon={Scale} title={title} description={description} compact />
          <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {principles.length > 0 ? (
              principles.map((principle) => (
                <PrincipleCard
                  key={principle.id}
                  compact
                  isControlMode={isControlMode}
                  principle={principle}
                  onEdit={() => onEditPrinciple(principle)}
                />
              ))
            ) : (
              <EmptyState message={emptyMessage} compact />
            )}
          </div>
        </Surface>

        <div className="flex min-h-0 flex-col gap-3">
          <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
            <SectionHeading
              icon={CheckCheck}
              title={t("principles.perspective.summaryTitle")}
              description={t(
                "principles.perspective.summaryDescription",
                "看这组原则更多是正在内化、已经稳定，还是还在借用别人留下的判断。",
              )}
              compact
            />
            <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              <ClassificationPanel
                enumGroup="source"
                title={t("principles.classification.source.title")}
                description={t("principles.classification.source.description")}
                rows={sourceRows}
                total={principles.length}
              />
              <ClassificationPanel
                enumGroup="status"
                title={t("principles.classification.status.title")}
                description={t(
                  "principles.classification.status.description",
                  "它现在是否仍在生效。",
                )}
                rows={statusRows}
                total={principles.length}
              />
            </div>
          </Surface>

          <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
            <SectionHeading
              icon={Activity}
              title={t("principles.perspective.signalTitle")}
              description={t(
                "principles.perspective.signalDescription",
                "优先看不可退让或代价高的原则，确认它们是不是还真属于你。",
              )}
              compact
            />
            <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {featuredPrinciples.length > 0 ? (
                featuredPrinciples.map((principle) => (
                  <PrincipleSignalCard key={principle.id} principle={principle} />
                ))
              ) : (
                <EmptyState message={emptyMessage} compact />
              )}
            </div>
          </Surface>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Surface className="p-5">
        <SectionHeading icon={Scale} title={title} description={description} />
        <div className="mt-5 space-y-4">
          {principles.length > 0 ? (
            principles.map((principle) => (
              <PrincipleCard
                key={principle.id}
                isControlMode={isControlMode}
                principle={principle}
                onEdit={() => onEditPrinciple(principle)}
              />
            ))
          ) : (
            <EmptyState message={emptyMessage} compact />
          )}
        </div>
      </Surface>

      <div className="grid gap-4 min-[1100px]:grid-cols-2">
        <Surface className="p-5">
          <ClassificationPanel
            enumGroup="source"
            title={t("principles.classification.source.title")}
            description={t("principles.classification.source.description")}
            rows={sourceRows}
            total={principles.length}
          />
        </Surface>
        <Surface className="p-5">
          <ClassificationPanel
            enumGroup="status"
            title={t("principles.classification.status.title")}
            description={t("principles.classification.status.description")}
            rows={statusRows}
            total={principles.length}
          />
        </Surface>
      </div>
    </div>
  )
}

function PrinciplesPracticeWorkbench({
  isFixedLayout,
  principleById,
  principles,
  principlesModule,
}: {
  isFixedLayout: boolean
  principleById: Map<string, PrincipleEntry>
  principles: PrincipleEntry[]
  principlesModule: PrinciplesModuleData
}) {
  const { t } = useTranslation()
  const featuredHighPriorityPrinciples = [...principles]
    .sort((first, second) => {
      const firstScore = (first.strength === "不可退让" ? 2 : 0) + (first.cost === "高代价" ? 1 : 0)
      const secondScore =
        (second.strength === "不可退让" ? 2 : 0) + (second.cost === "高代价" ? 1 : 0)

      return secondScore - firstScore
    })
    .slice(0, 4)
  const evolvingPrinciples = principles.filter(
    (principle) => principle.status === "正在测试" || principle.status === "已修订",
  )

  if (isFixedLayout) {
    return (
      <div className="grid h-full min-h-0 grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)_minmax(320px,0.82fr)] gap-3 overflow-hidden">
        <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
          <SectionHeading
            icon={Activity}
            title={t("principles.sections.prompts.title")}
            description={t(
              "principles.sections.prompts.description",
              "面对具体选择时，先调出相关原则，再看强度和代价。",
            )}
            compact
          />
          <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {principlesModule.decisionPrompts.length > 0 ? (
              principlesModule.decisionPrompts.map((prompt) => (
                <DecisionPromptCard key={prompt} prompt={prompt} compact />
              ))
            ) : (
              <EmptyState message={t("principles.empty.prompts")} compact />
            )}
          </div>
        </Surface>

        <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
          <SectionHeading
            icon={Waypoints}
            title={t("principles.sections.relations.title")}
            description={t(
              "principles.sections.relations.description",
              "原则体系不是散点，很多原则会互相支撑，也可能在真实生活里互相拉扯。",
            )}
            compact
          />
          <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
            {principlesModule.relations.length > 0 ? (
              principlesModule.relations.map((relation) => (
                <RelationCard
                  key={relation.id}
                  compact
                  principleById={principleById}
                  relation={relation}
                />
              ))
            ) : (
              <EmptyState message={t("principles.empty.relations")} compact />
            )}
          </div>
        </Surface>

        <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            <div className="space-y-2">
              <div className="text-xs font-medium tracking-wide text-[color:var(--text-primary)]">
                {t("principles.practice.priority")}
              </div>
              {featuredHighPriorityPrinciples.length > 0 ? (
                featuredHighPriorityPrinciples.map((principle) => (
                  <PrincipleSignalCard key={principle.id} principle={principle} />
                ))
              ) : (
                <EmptyState message={t("principles.empty.priority")} compact />
              )}
            </div>
            <div className="space-y-2 border-t border-[color:var(--muted-surface-border)] pt-3">
              <div className="text-xs font-medium tracking-wide text-[color:var(--text-primary)]">
                {t("principles.practice.evolving")}
              </div>
              {evolvingPrinciples.length > 0 ? (
                evolvingPrinciples.map((principle) => (
                  <PrincipleSignalCard key={principle.id} principle={principle} subtle />
                ))
              ) : (
                <EmptyState message={t("principles.empty.evolving")} compact />
              )}
            </div>
          </div>
        </Surface>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Surface className="p-5">
        <SectionHeading
          icon={Activity}
          title={t("principles.sections.prompts.title")}
          description={t(
            "principles.sections.prompts.description",
            "面对具体选择时，先调出相关原则，再看强度和代价。",
          )}
        />
        <div className="mt-5 space-y-3">
          {principlesModule.decisionPrompts.length > 0 ? (
            principlesModule.decisionPrompts.map((prompt) => (
              <DecisionPromptCard key={prompt} prompt={prompt} />
            ))
          ) : (
            <EmptyState message={t("principles.empty.prompts")} compact />
          )}
        </div>
      </Surface>

      <Surface className="p-5">
        <SectionHeading
          icon={Waypoints}
          title={t("principles.sections.relations.title")}
          description={t(
            "principles.sections.relations.description",
            "原则体系不是散点，很多原则会互相支撑，也可能在真实生活里互相拉扯。",
          )}
        />
        <div className="mt-5 grid gap-3 min-[960px]:grid-cols-2">
          {principlesModule.relations.length > 0 ? (
            principlesModule.relations.map((relation) => (
              <RelationCard key={relation.id} principleById={principleById} relation={relation} />
            ))
          ) : (
            <EmptyState message={t("principles.empty.relations")} compact />
          )}
        </div>
      </Surface>
    </div>
  )
}

function PrinciplesFixedDashboard({
  classificationSections,
  costRows,
  isControlMode,
  onEditPrinciple,
  principleById,
  principles,
  principlesModule,
}: {
  classificationSections: ClassificationSection[]
  costRows: DistributionRow[]
  isControlMode: boolean
  onEditPrinciple: (principle: PrincipleEntry) => void
  principleById: Map<string, PrincipleEntry>
  principles: PrincipleEntry[]
  principlesModule: PrinciplesModuleData
}) {
  const { t } = useTranslation()
  const featuredHighPriorityPrinciples = [...principles]
    .sort((first, second) => {
      const firstScore = (first.strength === "不可退让" ? 2 : 0) + (first.cost === "高代价" ? 1 : 0)
      const secondScore =
        (second.strength === "不可退让" ? 2 : 0) + (second.cost === "高代价" ? 1 : 0)

      return secondScore - firstScore
    })
    .slice(0, 3)
  const evolvingPrinciples = principles.filter(
    (principle) => principle.status === "正在测试" || principle.status === "已修订",
  )

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,0.96fr)_minmax(0,1.08fr)_minmax(320px,0.88fr)] grid-rows-[minmax(0,0.9fr)_minmax(0,1fr)] gap-3 overflow-hidden">
      <Surface className="col-span-2 flex min-h-0 flex-col overflow-hidden p-4">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <div className="grid gap-2 min-[1240px]:grid-cols-5">
            {classificationSections.map((section) => (
              <ClassificationPanel
                key={section.title}
                enumGroup={section.enumGroup}
                title={section.title}
                description={section.description}
                rows={section.rows}
                total={principles.length}
              />
            ))}
          </div>

          <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4">
            <div className="text-sm font-medium text-[color:var(--text-primary)]">
              {t("principles.cost.title")}
            </div>
            <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
              {t(
                "principles.cost.description",
                "代价是单条原则的评估属性，用来判断守住它需要准备什么，不放进主筛选器。",
              )}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {costRows
                .filter((row) => row.count > 0)
                .map((row) => (
                  <Badge
                    key={row.label}
                    variant="outline"
                    className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
                  >
                    {translatePrincipleEnum(t, "cost", row.label)} · {row.count}
                  </Badge>
                ))}
            </div>
          </div>
        </div>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {principlesModule.boundaries.length > 0 ? (
            principlesModule.boundaries.map((boundary) => (
              <BoundaryCard key={boundary} boundary={boundary} compact />
            ))
          ) : (
            <EmptyState message={t("principles.empty.boundaries")} compact />
          )}
        </div>
      </Surface>

      <Surface className="col-span-2 flex min-h-0 flex-col overflow-hidden p-4">
        <Tabs defaultValue="entries" className="min-h-0 flex-1">
          <TabsList className="w-full justify-start gap-1 rounded-lg bg-[color:var(--chip-bg)] p-1">
            <TabsTrigger value="entries">{t("principles.tabs.entries")}</TabsTrigger>
            <TabsTrigger value="prompts">{t("principles.tabs.prompts")}</TabsTrigger>
            <TabsTrigger value="relations">{t("principles.tabs.relations")}</TabsTrigger>
            <TabsTrigger value="practice">{t("principles.tabs.practice")}</TabsTrigger>
          </TabsList>

          <TabsContent value="entries" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-3">
              {principles.length > 0 ? (
                principles.map((principle) => (
                  <PrincipleCard
                    key={principle.id}
                    compact
                    isControlMode={isControlMode}
                    principle={principle}
                    onEdit={() => onEditPrinciple(principle)}
                  />
                ))
              ) : (
                <EmptyState message={t("principles.empty.entries")} compact />
              )}
            </div>
          </TabsContent>

          <TabsContent value="prompts" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {principlesModule.decisionPrompts.length > 0 ? (
                principlesModule.decisionPrompts.map((prompt) => (
                  <DecisionPromptCard key={prompt} prompt={prompt} compact />
                ))
              ) : (
                <EmptyState message={t("principles.empty.prompts")} compact />
              )}
            </div>
          </TabsContent>

          <TabsContent value="relations" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-2">
              {principlesModule.relations.length > 0 ? (
                principlesModule.relations.map((relation) => (
                  <RelationCard
                    key={relation.id}
                    principleById={principleById}
                    relation={relation}
                    compact
                  />
                ))
              ) : (
                <EmptyState message={t("principles.empty.relations")} compact />
              )}
            </div>
          </TabsContent>

          <TabsContent value="practice" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="grid gap-3 min-[960px]:grid-cols-2">
              <div className="space-y-2">
                <div className="text-xs font-medium tracking-wide text-[color:var(--text-primary)]">
                  {t("principles.practice.priority")}
                </div>
                {featuredHighPriorityPrinciples.length > 0 ? (
                  featuredHighPriorityPrinciples.map((principle) => (
                    <PrincipleSignalCard key={principle.id} principle={principle} />
                  ))
                ) : (
                  <EmptyState message={t("principles.empty.priority")} compact />
                )}
              </div>
              <div className="space-y-2">
                <div className="text-xs font-medium tracking-wide text-[color:var(--text-primary)]">
                  {t("principles.practice.evolving")}
                </div>
                {evolvingPrinciples.length > 0 ? (
                  evolvingPrinciples.map((principle) => (
                    <PrincipleSignalCard key={principle.id} principle={principle} subtle />
                  ))
                ) : (
                  <EmptyState message={t("principles.empty.evolving")} compact />
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <div className="space-y-2">
            {featuredHighPriorityPrinciples.length > 0 ? (
              featuredHighPriorityPrinciples.map((principle) => (
                <PrincipleSignalCard key={principle.id} principle={principle} />
              ))
            ) : (
              <EmptyState message={t("principles.empty.priority")} compact />
            )}
          </div>

          <div className="space-y-2 border-t border-[color:var(--muted-surface-border)] pt-3">
            {evolvingPrinciples.length > 0 ? (
              evolvingPrinciples
                .slice(0, 3)
                .map((principle) => (
                  <PrincipleSignalCard key={principle.id} principle={principle} subtle />
                ))
            ) : (
              <EmptyState message={t("principles.empty.evolving")} compact />
            )}
          </div>
        </div>
      </Surface>
    </div>
  )
}

function ClassificationPanel({
  enumGroup,
  title,
  description,
  rows,
  total,
}: {
  enumGroup: PrincipleEnumGroup
  title: string
  description: string
  rows: DistributionRow[]
  total: number
}) {
  const { t } = useTranslation()
  const visibleRows = rows.filter((row) => row.count > 0)

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
      <div className="text-sm font-medium text-[color:var(--text-primary)]">{title}</div>
      <p className="mt-1 min-h-[2.25rem] text-xs leading-5 text-[color:var(--text-muted)]">
        {description}
      </p>
      <div className="mt-4 space-y-3">
        {visibleRows.length > 0 ? (
          visibleRows.map((row) => {
            const width = total > 0 ? `${Math.max((row.count / total) * 100, 10)}%` : "0%"

            return (
              <div key={row.label} className="space-y-1.5">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="min-w-0 truncate text-[color:var(--text-secondary)]">
                    {translatePrincipleEnum(t, enumGroup, row.label)}
                  </span>
                  <span className="shrink-0 text-[color:var(--text-muted)]">{row.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--chip-bg)]">
                  <div
                    className="h-full rounded-full bg-[color:var(--text-primary)] opacity-70"
                    style={{ width }}
                  />
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-xs leading-5 text-[color:var(--text-muted)]">
            {t("principles.empty.distribution")}
          </div>
        )}
      </div>
    </div>
  )
}

function PrinciplesControlStrip({
  isControlMode,
  onCreate,
  principlesCount,
  relationsCount,
}: {
  isControlMode: boolean
  onCreate: () => void
  principlesCount: number
  relationsCount: number
}) {
  const { t } = useTranslation()

  return (
    <ActionGroup justify="end" className="items-center">
      <span className="text-xs text-[color:var(--text-muted)]">
        {t("principles.controlMode.summary", {
          defaultValue: "{{count}} 条原则 · {{relations}} 个关系",
          count: principlesCount,
          relations: relationsCount,
        })}
      </span>
      <AnimatedButton show={isControlMode} type="button" size="sm" onClick={onCreate}>
        <Plus className="size-4" />
        {t("principles.controlMode.add")}
      </AnimatedButton>
    </ActionGroup>
  )
}

function PrincipleCard({
  isControlMode = false,
  onEdit,
  principle,
  compact = false,
}: {
  isControlMode?: boolean
  onEdit?: () => void
  principle: PrincipleEntry
  compact?: boolean
}) {
  const { t } = useTranslation()
  return (
    <article
      className={cn(
        "rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4",
        compact && "px-3 py-3",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]">
          {translatePrincipleEnum(t, "domain", principle.domain)}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {translatePrincipleEnum(t, "type", principle.type)}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
        >
          {translatePrincipleEnum(t, "strength", principle.strength)}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
        >
          {translatePrincipleEnum(t, "status", principle.status)}
        </Badge>
        <AnimatedIconButton
          show={isControlMode && Boolean(onEdit)}
          containerClassName="ml-auto"
          type="button"
          size="icon-sm"
          variant="ghost"
          label={t("principles.actions.edit")}
          icon={<Pencil className="size-3.5" />}
          onClick={onEdit}
        />
      </div>

      <h3
        className={cn(
          "mt-3 text-base font-medium text-[color:var(--text-primary)]",
          compact && "text-sm",
        )}
      >
        {principle.title}
      </h3>
      <p
        className={cn(
          "mt-2 text-sm leading-6 text-[color:var(--text-secondary)]",
          compact && "text-xs leading-5",
        )}
      >
        {principle.statement}
      </p>
      <p
        className={cn(
          "mt-2 text-sm leading-6 text-[color:var(--text-muted)]",
          compact && "text-xs leading-5",
        )}
      >
        {principle.description}
      </p>

      <div className="mt-4 grid gap-2 min-[640px]:grid-cols-2">
        <PrincipleMeta
          label={t("principles.meta.source")}
          value={translatePrincipleEnum(t, "source", principle.source)}
        />
        <PrincipleMeta
          label={t("principles.meta.cost")}
          value={translatePrincipleEnum(t, "cost", principle.cost)}
          accent
        />
        <PrincipleMeta
          label={t("principles.meta.protectedValue")}
          value={principle.protectedValue}
        />
        <PrincipleMeta label={t("principles.meta.decisionCue")} value={principle.decisionCue} />
      </div>

      <div className="mt-3 rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 py-3 text-sm leading-6 text-[color:var(--text-secondary)]">
        <span className="font-medium text-[color:var(--text-primary)]">
          {t("principles.meta.boundary")}：
        </span>
        {principle.boundary}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {principle.tags.map((tag) => (
          <Badge
            key={tag}
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
          >
            {tag}
          </Badge>
        ))}
      </div>

      {principle.revisionHistory.length > 0 ? (
        <div className="mt-4 space-y-2">
          {principle.revisionHistory.map((revision) => (
            <div
              key={revision.id}
              className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-3 py-2 text-xs leading-5 text-[color:var(--text-muted)]"
            >
              <span className="font-medium text-[color:var(--text-primary)]">{revision.date}</span>
              ：{revision.summary}
            </div>
          ))}
        </div>
      ) : null}
    </article>
  )
}

function PrincipleMeta({
  label,
  value,
  accent = false,
}: {
  label: string
  value: string
  accent?: boolean
}) {
  return (
    <div className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-3 py-2">
      <div className="text-[11px] text-[color:var(--text-muted)]">{label}</div>
      <div
        className={cn(
          "mt-1 text-sm font-medium text-[color:var(--text-primary)]",
          accent && "text-[color:var(--tone-value-ink)]",
        )}
      >
        {value}
      </div>
    </div>
  )
}

function RelationCard({
  relation,
  principleById,
  compact = false,
}: {
  relation: PrincipleRelation
  principleById: Map<string, PrincipleEntry>
  compact?: boolean
}) {
  const { t } = useTranslation()
  const fromPrinciple = principleById.get(relation.fromId)
  const toPrinciple = principleById.get(relation.toId)

  return (
    <div
      className={cn(
        "rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4",
        compact && "px-3 py-3",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          className={cn(
            relation.type === "支撑"
              ? "bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]"
              : "bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]",
          )}
        >
          {translatePrincipleEnum(t, "relation", relation.type)}
        </Badge>
        <span className={cn("text-sm text-[color:var(--text-muted)]", compact && "text-xs")}>
          {fromPrinciple?.title ?? relation.fromId} → {toPrinciple?.title ?? relation.toId}
        </span>
      </div>
      <p
        className={cn(
          "mt-3 text-sm leading-6 text-[color:var(--text-secondary)]",
          compact && "text-xs leading-5",
        )}
      >
        {relation.note}
      </p>
    </div>
  )
}

function BoundaryCard({ boundary, compact = false }: { boundary: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3",
        compact && "gap-2 px-3 py-2.5",
      )}
    >
      <CheckCheck className="mt-1 size-4 shrink-0 text-[color:var(--text-muted)]" />
      <p
        className={cn(
          "text-sm leading-6 text-[color:var(--text-secondary)]",
          compact && "text-xs leading-5",
        )}
      >
        {boundary}
      </p>
    </div>
  )
}

function DecisionPromptCard({ prompt, compact = false }: { prompt: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]",
        compact && "px-3 py-2 text-xs leading-5",
      )}
    >
      {prompt}
    </div>
  )
}

function PrincipleSignalCard({
  principle,
  subtle = false,
}: {
  principle: PrincipleEntry
  subtle?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-3",
        subtle
          ? "border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)]"
          : "border-[color:var(--chip-border)] bg-[color:var(--chip-bg)]",
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge className="bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]">
          {translatePrincipleEnum(t, "domain", principle.domain)}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {translatePrincipleEnum(t, "strength", principle.strength)}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
        >
          {translatePrincipleEnum(t, "cost", principle.cost)}
        </Badge>
      </div>
      <div className="mt-2 text-sm font-medium text-[color:var(--text-primary)]">
        {principle.title}
      </div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">
        {principle.decisionCue}
      </p>
    </div>
  )
}
