import {
  ArrowUpRight,
  Globe2,
  Grid3x3,
  Landmark,
  Network,
  NotebookPen,
  Pencil,
  Plus,
  Sparkles,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  EconConfidence,
  EconDomain,
  EconRelevance,
  EconTopicArea,
  SocioeconomicsDiscipline,
  SocioeconomicsEntry,
  SocioeconomicsGap,
  SocioeconomicsModuleData,
} from "@/features/bettertolive/types"
import { EmptyState, SectionHeading, Surface } from "@/features/bettertolive/ui/shared/shared"
import {
  Cytoscape2DGraph,
  type CytoscapeThemeTokens,
} from "@/features/bettertolive/ui/shared/cytoscape-2d-graph"
import {
  type EditingSocioeconomicsEntry,
  type EditingSocioeconomicsGap,
  type EditingSocioeconomicsPrompt,
  SocioeconomicsEntryEditDialog,
  SocioeconomicsGapEditDialog,
  SocioeconomicsPromptEditDialog,
} from "@/features/bettertolive/ui/socioeconomics/socioeconomics-edit-dialog"
import { translateSocioeconomicsEnum } from "@/features/bettertolive/ui/socioeconomics/socioeconomics-i18n"
import {
  ECON_CONFIDENCE_ORDER,
  ECON_CONFIDENCES,
  ECON_DOMAINS,
  ECON_LAYERS,
  ECON_RELEVANCES,
  ECON_SOURCES,
  ECON_TOPIC_AREAS,
  SOCIO_DISCIPLINES,
} from "@/features/bettertolive/ui/socioeconomics/socioeconomics-page-data"
import { SocioeconomicsControlModeBadge } from "@/features/bettertolive/ui/socioeconomics/socioeconomics-page-shared"
import { cn } from "@/lib/utils"

type SocioeconomicsEnumGroup =
  | "discipline"
  | "domain"
  | "layer"
  | "confidence"
  | "source"
  | "relevance"

type DistributionRow = {
  label: string
  count: number
}

type ClassificationSection = {
  title: string
  description: string
  group: SocioeconomicsEnumGroup
  rows: DistributionRow[]
}

type SocioeconomicsActions = {
  isControlMode: boolean
  onCreateEntry: () => void
  onEditEntry: (entry: SocioeconomicsEntry) => void
  onCreateGap: () => void
  onEditGap: (gap: SocioeconomicsGap) => void
  onCreatePrompt: () => void
  onEditPrompt: (prompt: string, index: number) => void
}

function createDistribution<T extends string>(
  order: readonly T[],
  entries: SocioeconomicsEntry[],
  getValue: (entry: SocioeconomicsEntry) => T,
) {
  const counts = new Map<T, number>()
  entries.forEach((entry) => {
    const value = getValue(entry)
    counts.set(value, (counts.get(value) ?? 0) + 1)
  })

  const orderedLabels = new Set<T>(order)
  entries.forEach((entry) => orderedLabels.add(getValue(entry)))

  return [...orderedLabels].map((label) => ({
    label,
    count: counts.get(label) ?? 0,
  }))
}

function createHeatmap(entries: SocioeconomicsEntry[]) {
  const matrix = new Map<EconDomain, Map<EconConfidence, number>>()
  ECON_DOMAINS.forEach((domain) => {
    const row = new Map<EconConfidence, number>()
    ECON_CONFIDENCES.forEach((conf) => row.set(conf, 0))
    matrix.set(domain, row)
  })

  entries.forEach((entry) => {
    const row = matrix.get(entry.domain)
    if (!row) return
    row.set(entry.confidence, (row.get(entry.confidence) ?? 0) + 1)
  })

  return matrix
}

function normalizeSocioeconomicsData(
  socioeconomics: SocioeconomicsModuleData,
): SocioeconomicsModuleData {
  const source = socioeconomics as Partial<SocioeconomicsModuleData>

  return {
    entries: source.entries ?? [],
    gaps: source.gaps ?? [],
    reviewPrompts: source.reviewPrompts ?? [],
  }
}

function getEntryDiscipline(entry: SocioeconomicsEntry): SocioeconomicsDiscipline {
  if (entry.discipline) return entry.discipline

  if (
    ["社会结构", "社会流动", "制度与组织", "城市与社区", "文化与规范"].includes(entry.domain) ||
    entry.tags?.some((tag) =>
      ["社会", "群体", "社区", "阶层", "规范", "制度", "文化", "城市"].some((keyword) =>
        tag.includes(keyword),
      ),
    )
  ) {
    return "社会学"
  }

  return "经济学"
}

function getEntryTopicArea(entry: SocioeconomicsEntry): EconTopicArea | null {
  if (getEntryDiscipline(entry) === "社会学") {
    return null
  }

  if (entry.topicArea) return entry.topicArea

  if (entry.tags?.some((tag) => tag.includes("经济学家") || tag.includes("人物"))) {
    return "著名经济学家"
  }

  if (entry.tags?.some((tag) => tag.includes("模型") || tag.includes("原理"))) {
    return "经济原理与模型"
  }

  if (entry.domain === "财政与政策") {
    return "经济政策"
  }

  if (entry.layer === "微观") {
    return "微观经济学"
  }

  if (entry.layer === "宏观") {
    return "宏观经济学"
  }

  return "经济学基础概念"
}

const CONCEPT_GRAPH_LAYOUT = {
  animate: false,
  edgeElasticity: 96,
  fit: true,
  gravity: 0.32,
  idealEdgeLength: 132,
  name: "cose",
  nodeRepulsion: 14000,
  numIter: 900,
  padding: 56,
} as const

function createConceptGraphStylesheet(theme: CytoscapeThemeTokens) {
  return [
    {
      selector: "node",
      style: {
        "background-color": theme.surfaceBg,
        "border-color": theme.surfaceBorder,
        "border-width": 1.2,
        color: theme.textPrimary,
        "font-family": "Geist Variable",
        "font-size": 12,
        label: "data(label)",
        "line-height": 1.2,
        "overlay-opacity": 0,
        "padding-left": 10,
        "padding-right": 10,
        "padding-top": 10,
        "padding-bottom": 10,
        "text-halign": "center",
        "text-max-width": 124,
        "text-outline-width": 0,
        "text-valign": "center",
        "text-wrap": "wrap",
      },
    },
    {
      selector: "node[kind = 'entry']",
      style: {
        "background-color": theme.mutedSurfaceBg,
        "border-width": 1.5,
        height: "mapData(weight, 1, 6, 62, 90)",
        shape: "round-rectangle",
        width: "mapData(weight, 1, 6, 112, 152)",
      },
    },
    {
      selector: "node[kind = 'entry'][discipline = '经济学']",
      style: {
        "background-color": theme.tonePastBg,
        "border-color": theme.tonePastBorder,
      },
    },
    {
      selector: "node[kind = 'entry'][discipline = '社会学']",
      style: {
        "background-color": theme.tonePresentBg,
        "border-color": theme.tonePresentBorder,
      },
    },
    {
      selector: "node[kind = 'concept']",
      style: {
        "background-color": theme.surfaceBg,
        "border-color": theme.mutedSurfaceBorder,
        "border-style": "dashed",
        color: theme.textSecondary,
        height: "mapData(weight, 1, 5, 54, 86)",
        "font-size": 11,
        shape: "ellipse",
        width: "mapData(weight, 1, 5, 54, 86)",
      },
    },
    {
      selector: "node[kind = 'concept'][importance > 2]",
      style: {
        "background-color": theme.toneValueBg,
        "border-color": theme.toneFutureBorder,
      },
    },
    {
      selector: "node:selected",
      style: {
        "border-color": theme.accent,
        "border-width": 2.6,
        "shadow-blur": 18,
        "shadow-color": theme.accent,
        "shadow-opacity": 0.28,
        "shadow-offset-x": 0,
        "shadow-offset-y": 8,
      },
    },
    {
      selector: "edge",
      style: {
        "curve-style": "bezier",
        "line-color": theme.chipBorder,
        opacity: 0.68,
        "overlay-opacity": 0,
        "target-arrow-color": theme.chipBorder,
        "target-arrow-shape": "triangle",
        width: "mapData(weight, 1, 6, 1.6, 2.8)",
      },
    },
    {
      selector: "edge[discipline = '经济学']",
      style: {
        "line-color": theme.tonePastBorder,
        "target-arrow-color": theme.tonePastBorder,
      },
    },
    {
      selector: "edge[discipline = '社会学']",
      style: {
        "line-color": theme.tonePresentBorder,
        "target-arrow-color": theme.tonePresentBorder,
      },
    },
  ]
}

export function SocioeconomicsPage({
  socioeconomicsModule,
  sourceSocioeconomicsModule,
  isControlMode = false,
  isStackedLayout = false,
}: {
  socioeconomicsModule: SocioeconomicsModuleData
  sourceSocioeconomicsModule?: SocioeconomicsModuleData
  isControlMode?: boolean
  isStackedLayout?: boolean
}) {
  const { t } = useTranslation()
  const isFixedLayout = !isStackedLayout
  const displayModule = normalizeSocioeconomicsData(socioeconomicsModule)
  const sourceModule = normalizeSocioeconomicsData(
    sourceSocioeconomicsModule ?? socioeconomicsModule,
  )
  const entries = displayModule.entries
  const [activeTab, setActiveTab] = useState("overview")
  const [editingEntry, setEditingEntry] = useState<EditingSocioeconomicsEntry | null>(null)
  const [editingGap, setEditingGap] = useState<EditingSocioeconomicsGap | null>(null)
  const [editingPrompt, setEditingPrompt] = useState<EditingSocioeconomicsPrompt | null>(null)
  const economicsEntries = entries.filter((entry) => getEntryDiscipline(entry) === "经济学")
  const sociologyEntries = entries.filter((entry) => getEntryDiscipline(entry) === "社会学")
  const classificationSections: ClassificationSection[] = [
    {
      title: t("socioeconomics.classification.discipline.title", "学科"),
      description: t(
        "socioeconomics.classification.discipline.description",
        "先区分经济学和社会学，再进入具体知识。",
      ),
      group: "discipline",
      rows: createDistribution(SOCIO_DISCIPLINES, entries, getEntryDiscipline),
    },
    {
      title: t("socioeconomics.classification.domain.title", "领域"),
      description: t("socioeconomics.classification.domain.description", "属于经济运行的哪一块。"),
      group: "domain",
      rows: createDistribution(ECON_DOMAINS, entries, (entry) => entry.domain),
    },
    {
      title: t("socioeconomics.classification.layer.title", "层次"),
      description: t(
        "socioeconomics.classification.layer.description",
        "微观、中观、宏观三层视角。",
      ),
      group: "layer",
      rows: createDistribution(ECON_LAYERS, entries, (entry) => entry.layer),
    },
    {
      title: t("socioeconomics.classification.confidence.title", "掌握程度"),
      description: t(
        "socioeconomics.classification.confidence.description",
        "从听过名词到有自己的判断框架。",
      ),
      group: "confidence",
      rows: createDistribution(ECON_CONFIDENCES, entries, (entry) => entry.confidence),
    },
    {
      title: t("socioeconomics.classification.source.title", "来源"),
      description: t("socioeconomics.classification.source.description", "认知从哪里建立起来。"),
      group: "source",
      rows: createDistribution(ECON_SOURCES, entries, (entry) => entry.source),
    },
  ]
  const relevanceRows = createDistribution(ECON_RELEVANCES, entries, (entry) => entry.relevance)
  const heatmap = createHeatmap(entries)
  const reviewItems = [...entries]
    .filter((entry) => entry.relevance === "直接影响当前决策" || entry.confidence === "听过名词")
    .sort((a, b) => ECON_CONFIDENCE_ORDER[a.confidence] - ECON_CONFIDENCE_ORDER[b.confidence])
  const actions: SocioeconomicsActions = {
    isControlMode,
    onCreateEntry: () => setEditingEntry({ isNew: true, entry: null }),
    onEditEntry: (entry) => setEditingEntry({ isNew: false, entry }),
    onCreateGap: () => setEditingGap({ isNew: true, gap: null }),
    onEditGap: (gap) => setEditingGap({ isNew: false, gap }),
    onCreatePrompt: () => setEditingPrompt({ isNew: true, index: null, prompt: "" }),
    onEditPrompt: (prompt, index) =>
      setEditingPrompt({
        isNew: false,
        index: resolveSourcePromptIndex(
          sourceModule.reviewPrompts,
          displayModule.reviewPrompts,
          index,
        ),
        prompt,
      }),
  }

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <SocioeconomicsToolbar actions={actions} />

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className={cn("min-h-0 flex-1", isFixedLayout && "overflow-hidden")}
      >
        <TabsList className="hide-scrollbar max-w-full shrink-0 justify-start overflow-x-auto">
          <TabsTrigger value="overview">{t("socioeconomics.tabs.overview", "总览")}</TabsTrigger>
          <TabsTrigger value="economics">
            {t("socioeconomics.tabs.economics", "经济学")}
          </TabsTrigger>
          <TabsTrigger value="sociology">
            {t("socioeconomics.tabs.sociology", "社会学")}
          </TabsTrigger>
          <TabsTrigger value="graph">{t("socioeconomics.tabs.graph", "知识关联")}</TabsTrigger>
          <TabsTrigger value="study">{t("socioeconomics.tabs.study", "学习队列")}</TabsTrigger>
        </TabsList>

        <TabsContent
          value="overview"
          className={cn("mt-3", isFixedLayout && "h-full min-h-0 overflow-hidden")}
        >
          {isFixedLayout ? (
            <SocioeconomicsFixedDashboard
              classificationSections={classificationSections}
              relevanceRows={relevanceRows}
              heatmap={heatmap}
              entries={entries}
              reviewItems={reviewItems}
              socioeconomicsModule={displayModule}
              actions={actions}
            />
          ) : (
            <SocioeconomicsStackedView
              classificationSections={classificationSections}
              relevanceRows={relevanceRows}
              heatmap={heatmap}
              entries={entries}
              reviewItems={reviewItems}
              socioeconomicsModule={displayModule}
              actions={actions}
            />
          )}
        </TabsContent>

        <TabsContent
          value="economics"
          className={cn("mt-3", isFixedLayout && "h-full min-h-0 overflow-hidden")}
        >
          <SocioeconomicsDisciplineTab
            actions={actions}
            description={t(
              "socioeconomics.discipline.economics.description",
              "围绕价格、市场、政策、公司和宏观运行机制，整理可用于现实决策的经济学知识。",
            )}
            discipline="经济学"
            emptyMessage={t("socioeconomics.empty.economics", "当前筛选下没有经济学条目。")}
            entries={economicsEntries}
            isFixedLayout={isFixedLayout}
            title={t("socioeconomics.discipline.economics.title", "经济学")}
          />
        </TabsContent>

        <TabsContent
          value="sociology"
          className={cn("mt-3", isFixedLayout && "h-full min-h-0 overflow-hidden")}
        >
          <SocioeconomicsDisciplineTab
            actions={actions}
            description={t(
              "socioeconomics.discipline.sociology.description",
              "围绕社会结构、流动、制度、城市社区和文化规范，理解人如何在群体与制度中行动。",
            )}
            discipline="社会学"
            emptyMessage={t("socioeconomics.empty.sociology", "当前筛选下没有社会学条目。")}
            entries={sociologyEntries}
            isFixedLayout={isFixedLayout}
            title={t("socioeconomics.discipline.sociology.title", "社会学")}
          />
        </TabsContent>

        <TabsContent
          value="graph"
          className={cn("mt-3", isFixedLayout && "h-full min-h-0 overflow-y-auto pr-1")}
        >
          <Surface className="p-5">
            <SectionHeading
              icon={Network}
              title={t("socioeconomics.graph.title", "知识关联")}
              description={t(
                "socioeconomics.graph.description",
                "把经济学和社会学条目放到同一张关联表里，看概念之间如何互相解释。",
              )}
            />
            <div className="mt-5">
              <ConceptGraph entries={entries} />
            </div>
          </Surface>
        </TabsContent>

        <TabsContent
          value="study"
          className={cn("mt-3", isFixedLayout && "h-full min-h-0 overflow-y-auto pr-1")}
        >
          <SocioeconomicsStudyQueue
            actions={actions}
            compact={isFixedLayout}
            relevanceRows={relevanceRows}
            reviewItems={reviewItems}
            socioeconomicsModule={displayModule}
          />
        </TabsContent>
      </Tabs>

      {editingEntry ? (
        <SocioeconomicsEntryEditDialog
          key={editingEntry.entry?.id ?? "new-entry"}
          editing={editingEntry}
          socioeconomics={sourceModule}
          onClose={() => setEditingEntry(null)}
        />
      ) : null}

      {editingGap ? (
        <SocioeconomicsGapEditDialog
          key={editingGap.gap?.id ?? "new-gap"}
          editing={editingGap}
          socioeconomics={sourceModule}
          onClose={() => setEditingGap(null)}
        />
      ) : null}

      {editingPrompt ? (
        <SocioeconomicsPromptEditDialog
          key={editingPrompt.index ?? "new-prompt"}
          editing={editingPrompt}
          socioeconomics={sourceModule}
          onClose={() => setEditingPrompt(null)}
        />
      ) : null}
    </div>
  )
}

function SocioeconomicsToolbar({ actions }: { actions: SocioeconomicsActions }) {
  const { t } = useTranslation()

  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
      <SocioeconomicsControlModeBadge isControlMode={actions.isControlMode} />
      {actions.isControlMode ? (
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={actions.onCreateEntry}>
            <Plus className="size-3.5" />
            {t("socioeconomics.actions.addEntry", "新增条目")}
          </Button>
          <Button size="sm" variant="outline" onClick={actions.onCreateGap}>
            <Plus className="size-3.5" />
            {t("socioeconomics.actions.addGap", "新增缺口")}
          </Button>
          <Button size="sm" variant="outline" onClick={actions.onCreatePrompt}>
            <Plus className="size-3.5" />
            {t("socioeconomics.actions.addPrompt", "新增提问")}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function SocioeconomicsFixedDashboard({
  classificationSections,
  relevanceRows,
  heatmap,
  entries,
  reviewItems,
  socioeconomicsModule,
  actions,
}: {
  classificationSections: ClassificationSection[]
  relevanceRows: DistributionRow[]
  heatmap: Map<EconDomain, Map<EconConfidence, number>>
  entries: SocioeconomicsEntry[]
  reviewItems: SocioeconomicsEntry[]
  socioeconomicsModule: SocioeconomicsModuleData
  actions: SocioeconomicsActions
}) {
  const { t } = useTranslation()

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,0.94fr)_minmax(0,1.1fr)_minmax(320px,0.88fr)] grid-rows-[minmax(0,0.9fr)_minmax(0,1fr)] gap-3 overflow-hidden">
      <Surface className="col-span-2 flex min-h-0 flex-col overflow-hidden p-4">
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <div className="grid gap-2 min-[1240px]:grid-cols-5">
            {classificationSections.map((section) => (
              <ClassificationPanel
                key={section.title}
                title={section.title}
                description={section.description}
                group={section.group}
                rows={section.rows}
                total={entries.length}
              />
            ))}
          </div>

          <RelevancePanel rows={relevanceRows} compact />
        </div>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <SectionHeading
          icon={Grid3x3}
          title={t("socioeconomics.heatmap.title", "领域 × 掌握程度")}
          description={t("socioeconomics.heatmap.description", "颜色越深，掌握度越高。")}
          compact
        />
        <div className="mt-3 min-h-0 flex-1 overflow-auto pr-1">
          <Heatmap heatmap={heatmap} />
        </div>
      </Surface>

      <Surface className="col-span-2 flex min-h-0 flex-col overflow-hidden p-4">
        <SocioeconomicsKnowledgeTabs
          actions={actions}
          compact
          entries={entries}
          relevanceRows={relevanceRows}
          reviewItems={reviewItems}
          socioeconomicsModule={socioeconomicsModule}
        />
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <SectionHeading
          icon={NotebookPen}
          title={t("socioeconomics.review.title", "该先补的几条")}
          description={t(
            "socioeconomics.review.description",
            "决策距离近 + 掌握度浅，是优先补课的位置。",
          )}
          compact
        />
        <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {reviewItems.length > 0 ? (
            reviewItems
              .slice(0, 6)
              .map((entry) => <ReviewSignalCard key={entry.id} entry={entry} />)
          ) : (
            <EmptyState
              message={t("socioeconomics.empty.review", "当前筛选下没有需要优先补课的条目。")}
              compact
            />
          )}
        </div>
      </Surface>
    </div>
  )
}

function SocioeconomicsStackedView({
  classificationSections,
  relevanceRows,
  heatmap,
  entries,
  reviewItems,
  socioeconomicsModule,
  actions,
}: {
  classificationSections: ClassificationSection[]
  relevanceRows: DistributionRow[]
  heatmap: Map<EconDomain, Map<EconConfidence, number>>
  entries: SocioeconomicsEntry[]
  reviewItems: SocioeconomicsEntry[]
  socioeconomicsModule: SocioeconomicsModuleData
  actions: SocioeconomicsActions
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <Surface className="p-5">
        <SectionHeading
          icon={Landmark}
          title={t("socioeconomics.classification.title", "5 维认知分类")}
          description={t(
            "socioeconomics.classification.description",
            "按 5 维归类；relevance 跟着每条走，不进主筛选器。",
          )}
        />
        <div className="mt-5 grid gap-3 min-[960px]:grid-cols-2 min-[1240px]:grid-cols-5">
          {classificationSections.map((section) => (
            <ClassificationPanel
              key={section.title}
              title={section.title}
              description={section.description}
              group={section.group}
              rows={section.rows}
              total={entries.length}
            />
          ))}
        </div>
        <RelevancePanel rows={relevanceRows} className="mt-4" />
      </Surface>

      <Surface className="p-5">
        <SectionHeading
          icon={Grid3x3}
          title={t("socioeconomics.heatmap.title", "领域 × 掌握程度")}
          description={t(
            "socioeconomics.heatmap.stackedDescription",
            "一眼看清哪些领域我自以为懂、其实只到名词。",
          )}
        />
        <div className="mt-5 overflow-x-auto">
          <Heatmap heatmap={heatmap} />
        </div>
      </Surface>

      <Surface className="p-5">
        <SocioeconomicsKnowledgeTabs
          actions={actions}
          entries={entries}
          relevanceRows={relevanceRows}
          reviewItems={reviewItems}
          socioeconomicsModule={socioeconomicsModule}
        />
      </Surface>
    </div>
  )
}

function SocioeconomicsKnowledgeTabs({
  actions,
  compact = false,
  entries,
  includeWorkbenchTabs = true,
  relevanceRows,
  reviewItems,
  socioeconomicsModule,
}: {
  actions: SocioeconomicsActions
  compact?: boolean
  entries: SocioeconomicsEntry[]
  includeWorkbenchTabs?: boolean
  relevanceRows: DistributionRow[]
  reviewItems: SocioeconomicsEntry[]
  socioeconomicsModule: SocioeconomicsModuleData
}) {
  const { t } = useTranslation()

  return (
    <Tabs defaultValue="all" className="flex min-h-0 flex-1 flex-col">
      <TabsList className="hide-scrollbar w-full shrink-0 justify-start gap-1 overflow-x-auto rounded-lg bg-[color:var(--chip-bg)] p-1">
        <TabsTrigger value="all">{t("socioeconomics.tabs.all", "全部")}</TabsTrigger>
        {ECON_TOPIC_AREAS.map((topicArea) => (
          <TabsTrigger key={topicArea} value={topicArea}>
            {translateSocioeconomicsEnum(t, "topicArea", topicArea)}
          </TabsTrigger>
        ))}
        {includeWorkbenchTabs ? (
          <>
            <TabsTrigger value="graph">{t("socioeconomics.tabs.graph", "关联图谱")}</TabsTrigger>
            <TabsTrigger value="gaps">{t("socioeconomics.tabs.gaps", "认知缺口")}</TabsTrigger>
            <TabsTrigger value="prompts">
              {t("socioeconomics.tabs.prompts", "复习提问")}
            </TabsTrigger>
            <TabsTrigger value="relevance">
              {t("socioeconomics.tabs.relevance", "决策距离")}
            </TabsTrigger>
          </>
        ) : null}
      </TabsList>

      <TabsContent value="all" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
        <SocioeconomicsEntryList actions={actions} compact={compact} entries={entries} />
      </TabsContent>

      {ECON_TOPIC_AREAS.map((topicArea) => {
        const filteredEntries = entries.filter((entry) => getEntryTopicArea(entry) === topicArea)

        return (
          <TabsContent
            key={topicArea}
            value={topicArea}
            className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1"
          >
            <SocioeconomicsEntryList
              actions={actions}
              compact={compact}
              emptyMessage={t("socioeconomics.empty.topicArea", {
                topic: translateSocioeconomicsEnum(t, "topicArea", topicArea),
              })}
              entries={filteredEntries}
            />
          </TabsContent>
        )
      })}

      {includeWorkbenchTabs ? (
        <TabsContent value="graph" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
          <ConceptGraph entries={entries} />
        </TabsContent>
      ) : null}

      {includeWorkbenchTabs ? (
        <TabsContent value="gaps" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="space-y-2">
            {socioeconomicsModule.gaps.length > 0 ? (
              socioeconomicsModule.gaps.map((gap) => (
                <GapCard
                  key={gap.id}
                  gap={gap}
                  compact={compact}
                  onEdit={actions.isControlMode ? () => actions.onEditGap(gap) : undefined}
                />
              ))
            ) : (
              <EmptyState
                message={t("socioeconomics.empty.gaps", "当前筛选下没有可展示的认知缺口。")}
                compact
              />
            )}
          </div>
        </TabsContent>
      ) : null}

      {includeWorkbenchTabs ? (
        <TabsContent value="prompts" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="space-y-2">
            {socioeconomicsModule.reviewPrompts.length > 0 ? (
              socioeconomicsModule.reviewPrompts.map((prompt, index) => (
                <PromptCard
                  key={`${prompt}-${index}`}
                  prompt={prompt}
                  compact={compact}
                  onEdit={
                    actions.isControlMode ? () => actions.onEditPrompt(prompt, index) : undefined
                  }
                />
              ))
            ) : (
              <EmptyState
                message={t("socioeconomics.empty.prompts", "当前筛选下没有复习提问。")}
                compact
              />
            )}
          </div>
        </TabsContent>
      ) : null}

      {includeWorkbenchTabs ? (
        <TabsContent value="relevance" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
          <div className="grid gap-3 min-[960px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
            <RelevancePanel rows={relevanceRows} compact />
            <div className="space-y-2">
              <div className="text-xs font-medium tracking-wide text-[color:var(--text-primary)]">
                {t("socioeconomics.review.title", "该先补的几条")}
              </div>
              {reviewItems.length > 0 ? (
                reviewItems
                  .slice(0, 6)
                  .map((entry) => <ReviewSignalCard key={entry.id} entry={entry} />)
              ) : (
                <EmptyState
                  message={t("socioeconomics.empty.review", "当前筛选下没有需要优先补课的条目。")}
                  compact
                />
              )}
            </div>
          </div>
        </TabsContent>
      ) : null}
    </Tabs>
  )
}

function SocioeconomicsDisciplineTab({
  actions,
  description,
  discipline,
  emptyMessage,
  entries,
  isFixedLayout,
  title,
}: {
  actions: SocioeconomicsActions
  description: string
  discipline: SocioeconomicsDiscipline
  emptyMessage: string
  entries: SocioeconomicsEntry[]
  isFixedLayout: boolean
  title: string
}) {
  const { t } = useTranslation()
  const domainRows = createDistribution(ECON_DOMAINS, entries, (entry) => entry.domain)
  const confidenceRows = createDistribution(ECON_CONFIDENCES, entries, (entry) => entry.confidence)
  const reviewItems = [...entries]
    .filter((entry) => entry.relevance === "直接影响当前决策" || entry.confidence === "听过名词")
    .sort((a, b) => ECON_CONFIDENCE_ORDER[a.confidence] - ECON_CONFIDENCE_ORDER[b.confidence])

  if (isFixedLayout) {
    return (
      <div className="grid h-full min-h-0 grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)] gap-3 overflow-hidden">
        <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
          <SectionHeading icon={Landmark} title={title} description={description} compact />
          <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
            {discipline === "经济学" ? (
              <SocioeconomicsKnowledgeTabs
                actions={actions}
                compact
                entries={entries}
                includeWorkbenchTabs={false}
                relevanceRows={createDistribution(
                  ECON_RELEVANCES,
                  entries,
                  (entry) => entry.relevance,
                )}
                reviewItems={reviewItems}
                socioeconomicsModule={{ entries, gaps: [], reviewPrompts: [] }}
              />
            ) : (
              <SocioeconomicsEntryList
                actions={actions}
                compact
                emptyMessage={emptyMessage}
                entries={entries}
              />
            )}
          </div>
        </Surface>

        <div className="flex min-h-0 flex-col gap-3">
          <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
            <SectionHeading
              icon={Grid3x3}
              title={t("socioeconomics.discipline.mapTitle", "领域与掌握度")}
              description={t(
                "socioeconomics.discipline.mapDescription",
                "看这门学科内部哪些领域已经形成框架，哪些还只是听过名词。",
              )}
              compact
            />
            <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
              <ClassificationPanel
                group="domain"
                title={t("socioeconomics.classification.domain.title", "领域")}
                description={t(
                  "socioeconomics.classification.domain.description",
                  "属于经济运行的哪一块。",
                )}
                rows={domainRows}
                total={entries.length}
              />
              <ClassificationPanel
                group="confidence"
                title={t("socioeconomics.classification.confidence.title", "掌握程度")}
                description={t(
                  "socioeconomics.classification.confidence.description",
                  "从听过名词到有自己的判断框架。",
                )}
                rows={confidenceRows}
                total={entries.length}
              />
            </div>
          </Surface>

          <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
            <SectionHeading
              icon={NotebookPen}
              title={t("socioeconomics.review.title", "该先补的几条")}
              description={t(
                "socioeconomics.review.description",
                "决策距离近 + 掌握度浅，是优先补课的位置。",
              )}
              compact
            />
            <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {reviewItems.length > 0 ? (
                reviewItems.map((entry) => <ReviewSignalCard key={entry.id} entry={entry} />)
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
        <SectionHeading icon={Landmark} title={title} description={description} />
        <div className="mt-5">
          {discipline === "经济学" ? (
            <SocioeconomicsKnowledgeTabs
              actions={actions}
              entries={entries}
              includeWorkbenchTabs={false}
              relevanceRows={createDistribution(
                ECON_RELEVANCES,
                entries,
                (entry) => entry.relevance,
              )}
              reviewItems={reviewItems}
              socioeconomicsModule={{ entries, gaps: [], reviewPrompts: [] }}
            />
          ) : (
            <SocioeconomicsEntryList
              actions={actions}
              compact={false}
              emptyMessage={emptyMessage}
              entries={entries}
            />
          )}
        </div>
      </Surface>

      <div className="grid gap-4 min-[1100px]:grid-cols-2">
        <Surface className="p-5">
          <ClassificationPanel
            group="domain"
            title={t("socioeconomics.classification.domain.title", "领域")}
            description={t(
              "socioeconomics.classification.domain.description",
              "属于经济运行的哪一块。",
            )}
            rows={domainRows}
            total={entries.length}
          />
        </Surface>
        <Surface className="p-5">
          <ClassificationPanel
            group="confidence"
            title={t("socioeconomics.classification.confidence.title", "掌握程度")}
            description={t(
              "socioeconomics.classification.confidence.description",
              "从听过名词到有自己的判断框架。",
            )}
            rows={confidenceRows}
            total={entries.length}
          />
        </Surface>
      </div>
    </div>
  )
}

function SocioeconomicsStudyQueue({
  actions,
  compact,
  relevanceRows,
  reviewItems,
  socioeconomicsModule,
}: {
  actions: SocioeconomicsActions
  compact: boolean
  relevanceRows: DistributionRow[]
  reviewItems: SocioeconomicsEntry[]
  socioeconomicsModule: SocioeconomicsModuleData
}) {
  const { t } = useTranslation()

  return (
    <div className="grid gap-3 min-[960px]:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <div className="space-y-3">
        <RelevancePanel rows={relevanceRows} compact={compact} />
        <div className="space-y-2">
          {socioeconomicsModule.reviewPrompts.length > 0 ? (
            socioeconomicsModule.reviewPrompts.map((prompt, index) => (
              <PromptCard
                key={`${prompt}-${index}`}
                compact={compact}
                prompt={prompt}
                onEdit={
                  actions.isControlMode ? () => actions.onEditPrompt(prompt, index) : undefined
                }
              />
            ))
          ) : (
            <EmptyState
              message={t("socioeconomics.empty.prompts", "当前筛选下没有复习提问。")}
              compact
            />
          )}
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-xs font-medium tracking-wide text-[color:var(--text-primary)]">
          {t("socioeconomics.review.title", "该先补的几条")}
        </div>
        {reviewItems.length > 0 ? (
          reviewItems.map((entry) => <ReviewSignalCard key={entry.id} entry={entry} />)
        ) : (
          <EmptyState
            message={t("socioeconomics.empty.review", "当前筛选下没有需要优先补课的条目。")}
            compact
          />
        )}
      </div>
    </div>
  )
}

function SocioeconomicsEntryList({
  actions,
  compact,
  emptyMessage,
  entries,
}: {
  actions: SocioeconomicsActions
  compact: boolean
  emptyMessage?: string
  entries: SocioeconomicsEntry[]
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      {entries.length > 0 ? (
        entries.map((entry) => (
          <SocioeconomicsCard
            key={entry.id}
            entry={entry}
            compact={compact}
            onEdit={actions.isControlMode ? () => actions.onEditEntry(entry) : undefined}
          />
        ))
      ) : (
        <EmptyState
          message={
            emptyMessage ?? t("socioeconomics.empty.entries", "当前筛选下没有可展示的认知条目。")
          }
          compact
        />
      )}
    </div>
  )
}

function ConceptGraph({ entries }: { entries: SocioeconomicsEntry[] }) {
  const { t } = useTranslation()

  const graphModel = useMemo(() => {
    const linkedEntries = entries.filter((entry) => (entry.relatedConcepts ?? []).length > 0)
    const conceptMap = new Map<
      string,
      {
        concept: string
        entries: SocioeconomicsEntry[]
      }
    >()

    const elements = linkedEntries.flatMap((entry) => {
      const discipline = getEntryDiscipline(entry)
      const concepts = [
        ...new Set((entry.relatedConcepts ?? []).map((item) => item.trim()).filter(Boolean)),
      ]
      const entryNode = {
        data: {
          discipline,
          id: entry.id,
          kind: "entry",
          label: entry.title,
          weight: Math.max(1, concepts.length),
        },
      }

      const edges = concepts.map((concept) => {
        const conceptId = `concept:${concept}`
        const bucket = conceptMap.get(conceptId)

        if (bucket) {
          bucket.entries.push(entry)
        } else {
          conceptMap.set(conceptId, {
            concept,
            entries: [entry],
          })
        }

        return {
          data: {
            discipline,
            id: `${entry.id}::${conceptId}`,
            source: entry.id,
            target: conceptId,
            weight: Math.max(1, concepts.length),
          },
        }
      })

      return [entryNode, ...edges]
    })

    const conceptNodes = [...conceptMap.entries()].map(([id, bucket]) => ({
      data: {
        id,
        importance: bucket.entries.length,
        kind: "concept",
        label: bucket.concept,
        weight: Math.max(1, bucket.entries.length),
      },
    }))

    const nodeMeta = new Map<
      string,
      | {
          entry: SocioeconomicsEntry
          kind: "entry"
        }
      | {
          concept: string
          entries: SocioeconomicsEntry[]
          kind: "concept"
        }
    >()

    linkedEntries.forEach((entry) => {
      nodeMeta.set(entry.id, { entry, kind: "entry" })
    })
    conceptMap.forEach((bucket, id) => {
      nodeMeta.set(id, {
        concept: bucket.concept,
        entries: bucket.entries,
        kind: "concept",
      })
    })

    return {
      edgeCount: elements.length - linkedEntries.length,
      elements: [...elements, ...conceptNodes],
      linkedEntries,
      nodeCount: linkedEntries.length + conceptNodes.length,
      nodeMeta,
    }
  }, [entries])

  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const effectiveSelectedNodeId =
    selectedNodeId && graphModel.nodeMeta.has(selectedNodeId) ? selectedNodeId : null

  if (graphModel.edgeCount === 0) {
    return <EmptyState message={t("socioeconomics.empty.graph", "当前还没有概念关联。")} compact />
  }

  const selectedNode = effectiveSelectedNodeId
    ? (graphModel.nodeMeta.get(effectiveSelectedNodeId) ?? null)
    : null

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,0.78fr)]">
      <div className="space-y-3">
        <div className="grid gap-3 min-[720px]:grid-cols-3">
          <GraphMetric
            detail={t("socioeconomics.graph.metrics.entriesDetail", "带有关联概念的知识条目")}
            label={t("socioeconomics.graph.metrics.entries", "条目")}
            value={graphModel.linkedEntries.length}
          />
          <GraphMetric
            detail={t("socioeconomics.graph.metrics.nodesDetail", "概念节点和知识节点合计")}
            label={t("socioeconomics.graph.metrics.nodes", "节点")}
            value={graphModel.nodeCount}
          />
          <GraphMetric
            detail={t("socioeconomics.graph.metrics.linksDetail", "从条目指向概念的连接")}
            label={t("socioeconomics.graph.metrics.links", "连接")}
            value={graphModel.edgeCount}
          />
        </div>

        <Cytoscape2DGraph
          elements={graphModel.elements}
          layout={CONCEPT_GRAPH_LAYOUT}
          legend={
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-[color:var(--tone-past-bg)] text-[color:var(--tone-past-ink)]">
                  {t("socioeconomics.graph.legend.entry", "知识条目")}
                </Badge>
                <Badge className="bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]">
                  {t("socioeconomics.graph.legend.concept", "概念节点")}
                </Badge>
                <Badge className="bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]">
                  {t("socioeconomics.graph.legend.hub", "高连接概念")}
                </Badge>
              </div>
              <p className="text-xs leading-5 text-[color:var(--text-muted)]">
                {t(
                  "socioeconomics.graph.helper",
                  "缩放或拖动画布重看结构，点击节点查看说明，空白处点击可取消选择。",
                )}
              </p>
            </div>
          }
          selectedNodeId={effectiveSelectedNodeId}
          stylesheet={createConceptGraphStylesheet}
          onNodeSelect={setSelectedNodeId}
        />
      </div>

      <Surface className="flex min-h-[440px] flex-col overflow-hidden p-4">
        <SectionHeading
          icon={Sparkles}
          title={t("socioeconomics.graph.detailTitle", "节点说明")}
          description={t(
            "socioeconomics.graph.detailDescription",
            "右侧卡片会跟着当前选中的节点变化，帮你把图上的位置重新翻译成可读信息。",
          )}
          compact
        />

        <div className="mt-4 min-h-0 flex-1 overflow-y-auto pr-1">
          {selectedNode ? (
            selectedNode.kind === "entry" ? (
              <EntryGraphDetail entry={selectedNode.entry} />
            ) : (
              <ConceptGraphDetail concept={selectedNode.concept} entries={selectedNode.entries} />
            )
          ) : (
            <EmptyState
              message={t(
                "socioeconomics.graph.emptySelection",
                "选中一个节点后，这里会显示详细说明。",
              )}
              compact
            />
          )}
        </div>
      </Surface>
    </div>
  )
}

function GraphMetric({ detail, label, value }: { detail: string; label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3">
      <div className="text-[11px] tracking-[0.16em] text-[color:var(--text-muted)] uppercase">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-[color:var(--text-primary)] tabular-nums">
        {value}
      </div>
      <p className="mt-2 text-xs leading-5 text-[color:var(--text-muted)]">{detail}</p>
    </div>
  )
}

function EntryGraphDetail({ entry }: { entry: SocioeconomicsEntry }) {
  const { t } = useTranslation()
  const discipline = getEntryDiscipline(entry)
  const topicArea = getEntryTopicArea(entry)

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-[color:var(--tone-past-bg)] text-[color:var(--tone-past-ink)]">
          {translateSocioeconomicsEnum(t, "discipline", discipline)}
        </Badge>
        {topicArea ? (
          <Badge
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
          >
            {translateSocioeconomicsEnum(t, "topicArea", topicArea)}
          </Badge>
        ) : null}
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
        >
          {translateSocioeconomicsEnum(t, "domain", entry.domain)}
        </Badge>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-[color:var(--text-primary)]">{entry.title}</h4>
        <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{entry.summary}</p>
      </div>

      {entry.understandingNote ? (
        <div className="rounded-2xl border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3">
          <div className="text-xs font-medium text-[color:var(--text-primary)]">
            {t("socioeconomics.fields.understandingNote", "理解笔记")}
          </div>
          <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
            {entry.understandingNote}
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 min-[640px]:grid-cols-2">
        <SocioeconomicsMeta
          label={t("socioeconomics.fields.relevance", "决策距离")}
          value={translateSocioeconomicsEnum(t, "relevance", entry.relevance)}
          accent
        />
        <SocioeconomicsMeta
          label={t("socioeconomics.fields.confidence", "掌握程度")}
          value={translateSocioeconomicsEnum(t, "confidence", entry.confidence)}
        />
      </div>

      {(entry.relatedConcepts ?? []).length > 0 ? (
        <div>
          <div className="text-sm font-medium text-[color:var(--text-primary)]">
            {t("socioeconomics.graph.connectedConcepts", "连接到的概念")}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {entry.relatedConcepts?.map((concept) => (
              <Badge
                key={concept}
                variant="outline"
                className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
              >
                {concept}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}

      {entry.sourceRefs && entry.sourceRefs.length > 0 ? (
        <div>
          <div className="text-sm font-medium text-[color:var(--text-primary)]">
            {t("socioeconomics.fields.sourceRefs", "权威来源")}
          </div>
          <div className="mt-3 space-y-2">
            {entry.sourceRefs.map((source) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 rounded-2xl border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm text-[color:var(--text-secondary)] transition hover:border-[color:var(--surface-border)] hover:text-[color:var(--text-primary)]"
              >
                <span className="min-w-0 truncate">{source.label}</span>
                <ArrowUpRight className="size-4 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function ConceptGraphDetail({
  concept,
  entries,
}: {
  concept: string
  entries: SocioeconomicsEntry[]
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]">
          {t("socioeconomics.graph.legend.concept", "概念节点")}
        </Badge>
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
        >
          {t("socioeconomics.graph.connectedEntriesCount", {
            count: entries.length,
            defaultValue: `连接 ${entries.length} 个条目`,
          })}
        </Badge>
      </div>

      <div>
        <h4 className="text-lg font-semibold text-[color:var(--text-primary)]">{concept}</h4>
        <p className="mt-2 text-sm leading-6 text-[color:var(--text-muted)]">
          {t(
            "socioeconomics.graph.conceptDescription",
            "这个概念像一个交汇点，把原本分散的知识条目重新拢到同一张图里。",
          )}
        </p>
      </div>

      <div>
        <div className="text-sm font-medium text-[color:var(--text-primary)]">
          {t("socioeconomics.graph.connectedEntries", "连接到的条目")}
        </div>
        <div className="mt-3 space-y-3">
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="rounded-2xl border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
                >
                  {translateSocioeconomicsEnum(t, "discipline", getEntryDiscipline(entry))}
                </Badge>
                <Badge className="bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]">
                  {translateSocioeconomicsEnum(t, "domain", entry.domain)}
                </Badge>
              </div>
              <div className="mt-3 text-sm font-medium text-[color:var(--text-primary)]">
                {entry.title}
              </div>
              <p className="mt-2 text-xs leading-5 text-[color:var(--text-muted)]">
                {entry.summary}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RelevancePanel({
  rows,
  className,
  compact = false,
}: {
  rows: DistributionRow[]
  className?: string
  compact?: boolean
}) {
  const { t } = useTranslation()
  const visibleRows = rows.filter((row) => row.count > 0)

  return (
    <div
      className={cn(
        "rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-4",
        compact && "py-3",
        className,
      )}
    >
      <div className="text-sm font-medium text-[color:var(--text-primary)]">
        {t("socioeconomics.relevance.title", "决策距离")}
      </div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
        {t(
          "socioeconomics.relevance.description",
          "relevance 不进主筛选器，但是判断这条现在用不用得上的核心评估。",
        )}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {visibleRows.length > 0 ? (
          visibleRows.map((row) => (
            <RelevanceBadge
              key={row.label}
              relevance={row.label as EconRelevance}
              count={row.count}
            />
          ))
        ) : (
          <span className="text-xs text-[color:var(--text-muted)]">
            {t("socioeconomics.empty.distribution", "暂无分布数据。")}
          </span>
        )}
      </div>
    </div>
  )
}

function ClassificationPanel({
  title,
  description,
  group,
  rows,
  total,
}: {
  title: string
  description: string
  group: SocioeconomicsEnumGroup
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
                    {translateSocioeconomicsEnum(t, group, row.label)}
                  </span>
                  <span className="shrink-0 text-[color:var(--text-muted)]">{row.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--chip-bg)]">
                  <div
                    className="h-full rounded-full bg-[color:var(--socio-meter-bg)] opacity-80"
                    style={{ width }}
                  />
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-xs leading-5 text-[color:var(--text-muted)]">
            {t("socioeconomics.empty.distribution", "暂无分布数据。")}
          </div>
        )}
      </div>
    </div>
  )
}

function Heatmap({ heatmap }: { heatmap: Map<EconDomain, Map<EconConfidence, number>> }) {
  const { t } = useTranslation()

  return (
    <div className="min-w-[420px] space-y-1.5">
      <div className="grid grid-cols-[minmax(110px,1fr)_repeat(4,minmax(58px,1fr))] gap-1.5 text-[11px] text-[color:var(--text-muted)]">
        <div />
        {ECON_CONFIDENCES.map((conf) => (
          <div key={conf} className="px-1 text-center leading-tight">
            {translateSocioeconomicsEnum(t, "confidence", conf)}
          </div>
        ))}
      </div>
      {ECON_DOMAINS.map((domain) => {
        const row = heatmap.get(domain)
        return (
          <div
            key={domain}
            className="grid grid-cols-[minmax(110px,1fr)_repeat(4,minmax(58px,1fr))] gap-1.5"
          >
            <div className="flex items-center text-xs text-[color:var(--text-secondary)]">
              {translateSocioeconomicsEnum(t, "domain", domain)}
            </div>
            {ECON_CONFIDENCES.map((conf, index) => {
              const value = row?.get(conf) ?? 0
              const intensity = value === 0 ? 0 : Math.min(0.85, 0.26 + (index + 1) * 0.14)
              const heatColor = `var(--socio-heat-${index + 1})`

              return (
                <div
                  key={conf}
                  className="flex h-9 items-center justify-center rounded-md border border-[color:var(--chip-border)] text-xs font-medium"
                  style={{
                    backgroundColor:
                      value === 0
                        ? "var(--muted-surface-bg)"
                        : `color-mix(in srgb, ${heatColor} ${Math.round(intensity * 76)}%, var(--surface-bg))`,
                    color:
                      value === 0
                        ? "var(--text-muted)"
                        : intensity > 0.6
                          ? "var(--socio-heat-ink)"
                          : "var(--text-primary)",
                  }}
                >
                  {value > 0 ? value : "·"}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

function SocioeconomicsCard({
  entry,
  compact = false,
  onEdit,
}: {
  entry: SocioeconomicsEntry
  compact?: boolean
  onEdit?: () => void
}) {
  const { t } = useTranslation()
  const discipline = getEntryDiscipline(entry)
  const topicArea = getEntryTopicArea(entry)

  return (
    <article
      className={cn(
        "rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4",
        compact && "px-3 py-3",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
          >
            {translateSocioeconomicsEnum(t, "discipline", discipline)}
          </Badge>
          {topicArea ? (
            <Badge
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
            >
              {translateSocioeconomicsEnum(t, "topicArea", topicArea)}
            </Badge>
          ) : null}
          <Badge className="bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]">
            {translateSocioeconomicsEnum(t, "domain", entry.domain)}
          </Badge>
          <Badge
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
          >
            {translateSocioeconomicsEnum(t, "layer", entry.layer)}
          </Badge>
          <ConfidenceBadge confidence={entry.confidence} />
          <RelevanceBadge relevance={entry.relevance} />
        </div>
        {onEdit ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={t("socioeconomics.actions.editEntry", "编辑条目")}
            onClick={onEdit}
          >
            <Pencil className="size-3.5" />
          </Button>
        ) : null}
      </div>

      <h3
        className={cn(
          "mt-3 text-base font-medium text-[color:var(--text-primary)]",
          compact && "text-sm",
        )}
      >
        {entry.title}
      </h3>
      <p
        className={cn(
          "mt-2 text-sm leading-6 text-[color:var(--text-secondary)]",
          compact && "text-xs leading-5",
        )}
      >
        {entry.summary}
      </p>
      {entry.understandingNote ? (
        <p
          className={cn(
            "mt-2 text-sm leading-6 text-[color:var(--text-muted)]",
            compact && "text-xs leading-5",
          )}
        >
          <span className="font-medium text-[color:var(--text-primary)]">
            {t("socioeconomics.fields.understandingNote", "理解笔记")}:
          </span>{" "}
          {entry.understandingNote}
        </p>
      ) : null}

      <div className="mt-4 grid gap-2 min-[640px]:grid-cols-2">
        <SocioeconomicsMeta
          label={t("socioeconomics.fields.source", "来源")}
          value={translateSocioeconomicsEnum(t, "source", entry.source)}
        />
        <SocioeconomicsMeta
          label={t("socioeconomics.fields.relevance", "决策距离")}
          value={translateSocioeconomicsEnum(t, "relevance", entry.relevance)}
          accent
        />
      </div>

      {entry.relatedConcepts && entry.relatedConcepts.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {entry.relatedConcepts.map((concept) => (
            <Badge
              key={concept}
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
            >
              {concept}
            </Badge>
          ))}
        </div>
      ) : null}

      {entry.sourceRefs && entry.sourceRefs.length > 0 ? (
        <div className="mt-3 space-y-2 border-t border-[color:var(--muted-surface-border)] pt-3">
          <div className="text-[11px] font-medium text-[color:var(--text-muted)]">
            {t("socioeconomics.fields.sourceRefs", "权威来源")}
          </div>
          <div className="flex flex-wrap gap-2">
            {entry.sourceRefs.map((source) => (
              <a
                key={source.id}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-2 py-1 text-[11px] text-[color:var(--text-secondary)] transition hover:text-[color:var(--text-primary)]"
              >
                {source.label}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      {entry.confidenceHistory && entry.confidenceHistory.length > 0 ? (
        <div className="mt-3 space-y-2">
          {entry.confidenceHistory.map((history) => (
            <div
              key={history.id}
              className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-3 py-2 text-xs leading-5 text-[color:var(--text-muted)]"
            >
              <span className="font-medium text-[color:var(--text-primary)]">{history.date}</span>:{" "}
              {translateSocioeconomicsEnum(t, "confidence", history.from)} {"->"}{" "}
              {translateSocioeconomicsEnum(t, "confidence", history.to)}
              <span className="ml-1">· {history.trigger}</span>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  )
}

function SocioeconomicsMeta({
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
          accent && "text-[color:var(--socio-priority-ink)]",
        )}
      >
        {value}
      </div>
    </div>
  )
}

function ConfidenceBadge({ confidence }: { confidence: EconConfidence }) {
  const { t } = useTranslation()
  const style =
    confidence === "有自己的判断框架"
      ? "bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]"
      : confidence === "能预判常见情境"
        ? "bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]"
        : confidence === "知道大致逻辑"
          ? "bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
          : "bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]"

  return <Badge className={style}>{translateSocioeconomicsEnum(t, "confidence", confidence)}</Badge>
}

function RelevanceBadge({ relevance, count }: { relevance: EconRelevance; count?: number }) {
  const { t } = useTranslation()

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]",
        relevance === "直接影响当前决策" &&
          "border-[color:var(--socio-priority-border)] bg-[color:var(--socio-priority-bg)] text-[color:var(--socio-priority-ink)]",
      )}
    >
      {translateSocioeconomicsEnum(t, "relevance", relevance)}
      {typeof count === "number" ? ` · ${count}` : null}
    </Badge>
  )
}

function GapCard({
  gap,
  compact = false,
  onEdit,
}: {
  gap: SocioeconomicsGap
  compact?: boolean
  onEdit?: () => void
}) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3",
        compact && "px-3 py-2.5",
      )}
    >
      <div className="flex items-start gap-3">
        <Globe2 className="mt-1 size-4 shrink-0 text-[color:var(--text-muted)]" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Badge
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
            >
              {translateSocioeconomicsEnum(t, "domain", gap.domain)}
            </Badge>
            {onEdit ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={t("socioeconomics.actions.editGap", "编辑缺口")}
                onClick={onEdit}
              >
                <Pencil className="size-3.5" />
              </Button>
            ) : null}
          </div>
          <p
            className={cn(
              "mt-2 text-sm leading-6 text-[color:var(--text-secondary)]",
              compact && "text-xs leading-5",
            )}
          >
            {gap.summary}
          </p>
          <p
            className={cn(
              "mt-1.5 text-xs leading-5 text-[color:var(--text-muted)]",
              compact && "text-[11px]",
            )}
          >
            <span className="font-medium text-[color:var(--text-primary)]">
              {t("socioeconomics.fields.nextStep", "下一步")}:
            </span>{" "}
            {gap.nextStep}
          </p>
        </div>
      </div>
    </div>
  )
}

function PromptCard({
  prompt,
  compact = false,
  onEdit,
}: {
  prompt: string
  compact?: boolean
  onEdit?: () => void
}) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "flex items-start justify-between gap-3 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3 text-sm leading-6 text-[color:var(--text-secondary)]",
        compact && "px-3 py-2.5 text-xs leading-5",
      )}
    >
      <span className="min-w-0">{prompt}</span>
      {onEdit ? (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={t("socioeconomics.actions.editPrompt", "编辑提问")}
          onClick={onEdit}
        >
          <Pencil className="size-3.5" />
        </Button>
      ) : null}
    </div>
  )
}

function resolveSourcePromptIndex(
  sourcePrompts: string[],
  visiblePrompts: string[],
  visibleIndex: number,
) {
  const prompt = visiblePrompts[visibleIndex]
  if (prompt === undefined) {
    return visibleIndex
  }

  const visibleOccurrence = visiblePrompts
    .slice(0, visibleIndex + 1)
    .filter((entry) => entry === prompt).length
  let sourceOccurrence = 0

  for (let index = 0; index < sourcePrompts.length; index += 1) {
    if (sourcePrompts[index] !== prompt) {
      continue
    }

    sourceOccurrence += 1
    if (sourceOccurrence === visibleOccurrence) {
      return index
    }
  }

  const fallbackIndex = sourcePrompts.indexOf(prompt)
  return fallbackIndex >= 0 ? fallbackIndex : visibleIndex
}

function ReviewSignalCard({ entry }: { entry: SocioeconomicsEntry }) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 py-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge className="bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]">
          {translateSocioeconomicsEnum(t, "domain", entry.domain)}
        </Badge>
        <ConfidenceBadge confidence={entry.confidence} />
      </div>
      <div className="mt-2 text-sm font-medium text-[color:var(--text-primary)]">{entry.title}</div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">
        {translateSocioeconomicsEnum(t, "relevance", entry.relevance)} · {entry.summary}
      </p>
    </div>
  )
}
