import {
  Activity,
  AlertTriangle,
  Battery,
  CalendarRange,
  HeartPulse,
  Pencil,
  PhoneCall,
  Plus,
  ShieldAlert,
  Sparkles,
  Sun,
  WavesLadder,
} from "lucide-react"
import type { ReactNode } from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { ActionGroup, AnimatedButton, AnimatedIconButton } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  EmotionCheckIn,
  EmotionEnvironmentCue,
  EmotionLifestyleLink,
  EmotionLoopPattern,
  EmotionModuleData,
  EmotionRecoveryNote,
  EmotionRelationshipCue,
  EmotionSupportTool,
  EmotionTimelineSegment,
  EmotionTrendPoint,
  EmotionTriggerGroup,
} from "@/features/bettertolive/types"
import {
  EmotionEntityEditDialog,
  EmotionOverviewEditDialog,
  EmotionTextListEditDialog,
  type EmotionEntityEditorTarget,
  type EmotionTextListKey,
} from "@/features/bettertolive/ui/emotion/emotion-edit-dialog"
import { translateEmotionEnum } from "@/features/bettertolive/ui/emotion/emotion-i18n"
import { EmptyState, SectionHeading, Surface } from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"

type EmotionTab = "overview" | "today" | "timeline" | "triggers" | "toolbox"

type TextListEditorTarget = {
  listKey: EmotionTextListKey
}

const EMPTY_EMOTION_OVERVIEW: EmotionModuleData["overview"] = {
  windowLabel: "",
  averageScore: 0,
  topEmotionTags: [],
  bestWindow: "",
  worstWindow: "",
  conclusion: "",
}

export function EmotionPage({
  editableEmotionModule,
  emotionModule,
  isControlMode = false,
  isStackedLayout = false,
}: {
  editableEmotionModule: EmotionModuleData
  emotionModule: EmotionModuleData
  isControlMode?: boolean
  isStackedLayout?: boolean
}) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<EmotionTab>("overview")
  const [editingEntity, setEditingEntity] = useState<EmotionEntityEditorTarget | null>(null)
  const [isEditingOverview, setIsEditingOverview] = useState(false)
  const [editingTextList, setEditingTextList] = useState<TextListEditorTarget | null>(null)
  const normalizedEmotionModule = normalizeEmotionData(emotionModule)
  const normalizedEditableEmotionModule = normalizeEmotionData(editableEmotionModule)
  const latestCheckIn = normalizedEmotionModule.checkIns[0]
  const previousCheckIns = normalizedEmotionModule.checkIns.slice(1)
  const tabContentClassName = cn(
    "min-h-0",
    isStackedLayout ? "overflow-visible" : "h-full overflow-hidden",
  )

  return (
    <div
      className={cn(
        "flex min-h-0 flex-col gap-5",
        isStackedLayout ? "min-h-full" : "h-full overflow-hidden",
      )}
    >
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as EmotionTab)}
        className={cn("min-h-0 flex-1", isStackedLayout ? "overflow-visible" : "overflow-hidden")}
      >
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <TabsList className="hide-scrollbar max-w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">{t("emotion.tabs.overview", "情绪总览")}</TabsTrigger>
            <TabsTrigger value="today">{t("emotion.tabs.today", "今日记录")}</TabsTrigger>
            <TabsTrigger value="timeline">{t("emotion.tabs.timeline", "波动时间线")}</TabsTrigger>
            <TabsTrigger value="triggers">{t("emotion.tabs.triggers", "触发关联")}</TabsTrigger>
            <TabsTrigger value="toolbox">{t("emotion.tabs.toolbox", "恢复工具箱")}</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className={tabContentClassName}>
          <EmotionTabViewport isStackedLayout={isStackedLayout}>
            <OverviewTab
              emotionModule={normalizedEmotionModule}
              isControlMode={isControlMode}
              onAddCheckIn={() => setEditingEntity({ kind: "checkIn", isNew: true, item: null })}
              onEditOverview={() => setIsEditingOverview(true)}
            />
          </EmotionTabViewport>
        </TabsContent>

        <TabsContent value="today" className={tabContentClassName}>
          <EmotionTabViewport isStackedLayout={isStackedLayout}>
            <TodayTab
              latestCheckIn={latestCheckIn}
              previousCheckIns={previousCheckIns}
              isControlMode={isControlMode}
              onAddCheckIn={() => setEditingEntity({ kind: "checkIn", isNew: true, item: null })}
              onEditCheckIn={(item) => setEditingEntity({ kind: "checkIn", isNew: false, item })}
            />
          </EmotionTabViewport>
        </TabsContent>

        <TabsContent value="timeline" className={tabContentClassName}>
          <EmotionTabViewport isStackedLayout={isStackedLayout}>
            <TimelineTab
              emotionModule={normalizedEmotionModule}
              isControlMode={isControlMode}
              onAddLoop={() => setEditingEntity({ kind: "loopPattern", isNew: true, item: null })}
              onAddSegment={() =>
                setEditingEntity({ kind: "timelineSegment", isNew: true, item: null })
              }
              onAddTrendPoint={() =>
                setEditingEntity({ kind: "trendPoint", isNew: true, item: null })
              }
              onEditLoop={(item) => setEditingEntity({ kind: "loopPattern", isNew: false, item })}
              onEditSegment={(item) =>
                setEditingEntity({ kind: "timelineSegment", isNew: false, item })
              }
              onEditTrendPoint={(item) =>
                setEditingEntity({ kind: "trendPoint", isNew: false, item })
              }
            />
          </EmotionTabViewport>
        </TabsContent>

        <TabsContent value="triggers" className={tabContentClassName}>
          <EmotionTabViewport isStackedLayout={isStackedLayout}>
            <TriggersTab
              emotionModule={normalizedEmotionModule}
              isControlMode={isControlMode}
              onAddEnvironmentCue={() =>
                setEditingEntity({ kind: "environmentCue", isNew: true, item: null })
              }
              onAddLifestyleLink={() =>
                setEditingEntity({ kind: "lifestyleLink", isNew: true, item: null })
              }
              onAddRelationshipCue={() =>
                setEditingEntity({ kind: "relationshipCue", isNew: true, item: null })
              }
              onAddTrigger={() => setEditingEntity({ kind: "trigger", isNew: true, item: null })}
              onEditEnvironmentCue={(item) =>
                setEditingEntity({ kind: "environmentCue", isNew: false, item })
              }
              onEditLifestyleLink={(item) =>
                setEditingEntity({ kind: "lifestyleLink", isNew: false, item })
              }
              onEditRelationshipCue={(item) =>
                setEditingEntity({ kind: "relationshipCue", isNew: false, item })
              }
              onEditTrigger={(item) => setEditingEntity({ kind: "trigger", isNew: false, item })}
            />
          </EmotionTabViewport>
        </TabsContent>

        <TabsContent value="toolbox" className={tabContentClassName}>
          <EmotionTabViewport isStackedLayout={isStackedLayout}>
            <ToolboxTab
              emotionModule={normalizedEmotionModule}
              isControlMode={isControlMode}
              onAddRecoveryNote={() =>
                setEditingEntity({ kind: "recoveryNote", isNew: true, item: null })
              }
              onAddTool={() => setEditingEntity({ kind: "tool", isNew: true, item: null })}
              onEditRecoveryNote={(item) =>
                setEditingEntity({ kind: "recoveryNote", isNew: false, item })
              }
              onEditTextList={(listKey) => setEditingTextList({ listKey })}
              onEditTool={(item) => setEditingEntity({ kind: "tool", isNew: false, item })}
            />
          </EmotionTabViewport>
        </TabsContent>
      </Tabs>

      {editingEntity ? (
        <EmotionEntityEditDialog
          key={`${editingEntity.kind}-${editingEntity.item?.id ?? "new"}`}
          editing={editingEntity}
          emotion={normalizedEditableEmotionModule}
          onClose={() => setEditingEntity(null)}
        />
      ) : null}

      {isEditingOverview ? (
        <EmotionOverviewEditDialog
          emotion={normalizedEditableEmotionModule}
          onClose={() => setIsEditingOverview(false)}
        />
      ) : null}

      {editingTextList ? (
        <EmotionTextListEditDialog
          key={editingTextList.listKey}
          emotion={normalizedEditableEmotionModule}
          listKey={editingTextList.listKey}
          onClose={() => setEditingTextList(null)}
        />
      ) : null}
    </div>
  )
}

function EmotionTabViewport({
  children,
  isStackedLayout,
}: {
  children: ReactNode
  isStackedLayout: boolean
}) {
  return (
    <div
      className={cn(
        "min-h-0 pr-1",
        isStackedLayout ? "space-y-4 overflow-visible" : "h-full overflow-y-auto",
      )}
    >
      {children}
    </div>
  )
}

function OverviewTab({
  emotionModule,
  isControlMode,
  onAddCheckIn,
  onEditOverview,
}: {
  emotionModule: EmotionModuleData
  isControlMode: boolean
  onAddCheckIn: () => void
  onEditOverview: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="grid min-h-full gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
      <Surface className="flex min-h-[520px] flex-col overflow-hidden p-5">
        <CardHeaderActions
          icon={Sun}
          title={t("emotion.overview.title", "情绪总览")}
          description={emotionModule.overview.windowLabel}
          isControlMode={isControlMode}
          onEdit={onEditOverview}
          editLabel={t("emotion.editor.overview.title", "编辑情绪总览")}
        />
        <div className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <OverviewSnapshot emotionModule={emotionModule} />
        </div>
      </Surface>

      <Surface className="flex min-h-[520px] flex-col overflow-hidden p-5">
        <CardHeaderActions
          icon={HeartPulse}
          title={t("emotion.today.title", "今天的情绪记录")}
          description={t("emotion.today.description", "此刻的强度、身体感觉和想做的反应。")}
          isControlMode={isControlMode}
          onAdd={onAddCheckIn}
          addLabel={t("emotion.actions.addCheckIn", "新增记录")}
        />
        <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {emotionModule.checkIns.length > 0 ? (
            emotionModule.checkIns
              .slice(0, 4)
              .map((checkIn, index) => (
                <CheckInDetailedCard
                  key={checkIn.id}
                  checkIn={checkIn}
                  compact={index > 0}
                  highlight={index === 0}
                />
              ))
          ) : (
            <EmptyState message={t("emotion.empty.checkIns", "还没有情绪记录。")} compact />
          )}
        </div>
      </Surface>
    </div>
  )
}

function TodayTab({
  isControlMode,
  latestCheckIn,
  onAddCheckIn,
  onEditCheckIn,
  previousCheckIns,
}: {
  isControlMode: boolean
  latestCheckIn: EmotionCheckIn | undefined
  onAddCheckIn: () => void
  onEditCheckIn: (checkIn: EmotionCheckIn) => void
  previousCheckIns: EmotionCheckIn[]
}) {
  const { t } = useTranslation()

  return (
    <div className="grid min-h-full gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.45fr)]">
      <Surface className="flex min-h-[620px] flex-col overflow-hidden p-5">
        <CardHeaderActions
          icon={HeartPulse}
          title={t("emotion.today.title", "今天的情绪记录")}
          description={t("emotion.today.longDescription", "把模糊情绪落成可回看的样本。")}
          isControlMode={isControlMode}
          onAdd={onAddCheckIn}
          addLabel={t("emotion.actions.addCheckIn", "新增记录")}
        />
        <div className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {latestCheckIn ? (
            <CheckInDetailedCard
              checkIn={latestCheckIn}
              highlight
              onEdit={isControlMode ? () => onEditCheckIn(latestCheckIn) : undefined}
            />
          ) : (
            <EmptyState message={t("emotion.empty.today", "今天还没有记录。")} compact />
          )}
          {previousCheckIns.length > 0 ? (
            <div className="space-y-3 border-t border-[color:var(--muted-surface-border)] pt-4">
              <div className="text-xs tracking-wide text-[color:var(--text-muted)] uppercase">
                {t("emotion.today.recent", "最近几条")}
              </div>
              {previousCheckIns.map((checkIn) => (
                <CheckInDetailedCard
                  key={checkIn.id}
                  checkIn={checkIn}
                  compact
                  onEdit={isControlMode ? () => onEditCheckIn(checkIn) : undefined}
                />
              ))}
            </div>
          ) : null}
        </div>
      </Surface>

      <Surface className="flex min-h-[620px] flex-col overflow-hidden p-5">
        <SectionHeading
          icon={Sparkles}
          title={t("emotion.today.promptTitle", "记录入口")}
          description={t(
            "emotion.today.promptDescription",
            "强度、标签、触发和需要会一起进入后续模式观察。",
          )}
        />
        <div className="mt-5 space-y-3 text-sm leading-6 text-[color:var(--text-secondary)]">
          <InfoBlock
            title={t("emotion.today.prompt.feeling", "先命名感受")}
            body={t("emotion.today.prompt.feelingBody", "不用准确，先选最接近的词。")}
          />
          <InfoBlock
            title={t("emotion.today.prompt.body", "再看身体")}
            body={t("emotion.today.prompt.bodyBody", "肩颈、胸口、胃口、困意常常比语言更早知道。")}
          />
          <InfoBlock
            title={t("emotion.today.prompt.need", "最后确认需要")}
            body={t("emotion.today.prompt.needBody", "不是立刻解决，而是先知道此刻怎样会更安全。")}
          />
        </div>
      </Surface>
    </div>
  )
}

function TimelineTab({
  emotionModule,
  isControlMode,
  onAddLoop,
  onAddSegment,
  onAddTrendPoint,
  onEditLoop,
  onEditSegment,
  onEditTrendPoint,
}: {
  emotionModule: EmotionModuleData
  isControlMode: boolean
  onAddLoop: () => void
  onAddSegment: () => void
  onAddTrendPoint: () => void
  onEditLoop: (loop: EmotionLoopPattern) => void
  onEditSegment: (segment: EmotionTimelineSegment) => void
  onEditTrendPoint: (point: EmotionTrendPoint) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="grid min-h-full gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.45fr)]">
      <Surface className="flex min-h-[640px] flex-col overflow-hidden p-5">
        <CardHeaderActions
          icon={WavesLadder}
          title={t("emotion.timeline.title", "波动时间线")}
          description={t("emotion.timeline.description", "按时间看波峰、波谷和恢复区段。")}
          isControlMode={isControlMode}
          onAdd={onAddTrendPoint}
          addLabel={t("emotion.actions.addTrendPoint", "新增趋势点")}
        />
        <div className="mt-5 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          <TrendChart
            trend={emotionModule.trend}
            onEditPoint={isControlMode ? onEditTrendPoint : undefined}
          />
          <PanelListHeader
            title={t("emotion.timeline.segments", "时间段总结")}
            isControlMode={isControlMode}
            onAdd={onAddSegment}
            addLabel={t("emotion.actions.addSegment", "新增时间段")}
          />
          {emotionModule.timelineSegments.length > 0 ? (
            <div className="grid gap-3 min-[900px]:grid-cols-2">
              {emotionModule.timelineSegments.map((segment) => (
                <TimelineSegmentCard
                  key={segment.id}
                  segment={segment}
                  onEdit={isControlMode ? () => onEditSegment(segment) : undefined}
                />
              ))}
            </div>
          ) : (
            <EmptyState message={t("emotion.empty.timelineSegments", "还没有可总结的时间段。")} />
          )}
        </div>
      </Surface>

      <Surface className="flex min-h-[640px] flex-col overflow-hidden p-5">
        <CardHeaderActions
          icon={Activity}
          title={t("emotion.timeline.loopTitle", "反复出现的循环")}
          description={t("emotion.timeline.loopDescription", "看见不是随机出现的节律。")}
          isControlMode={isControlMode}
          onAdd={onAddLoop}
          addLabel={t("emotion.actions.addLoop", "新增循环")}
        />
        <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {emotionModule.loopPatterns.length > 0 ? (
            emotionModule.loopPatterns.map((loop) => (
              <LoopPatternCard
                key={loop.id}
                loop={loop}
                onEdit={isControlMode ? () => onEditLoop(loop) : undefined}
              />
            ))
          ) : (
            <EmptyState message={t("emotion.empty.loopPatterns", "还没有识别到循环模式。")} />
          )}
        </div>
      </Surface>
    </div>
  )
}

function TriggersTab({
  emotionModule,
  isControlMode,
  onAddEnvironmentCue,
  onAddLifestyleLink,
  onAddRelationshipCue,
  onAddTrigger,
  onEditEnvironmentCue,
  onEditLifestyleLink,
  onEditRelationshipCue,
  onEditTrigger,
}: {
  emotionModule: EmotionModuleData
  isControlMode: boolean
  onAddEnvironmentCue: () => void
  onAddLifestyleLink: () => void
  onAddRelationshipCue: () => void
  onAddTrigger: () => void
  onEditEnvironmentCue: (cue: EmotionEnvironmentCue) => void
  onEditLifestyleLink: (link: EmotionLifestyleLink) => void
  onEditRelationshipCue: (cue: EmotionRelationshipCue) => void
  onEditTrigger: (trigger: EmotionTriggerGroup) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="grid min-h-full grid-rows-[minmax(360px,0.9fr)_minmax(360px,1fr)] gap-4">
      <Surface className="flex min-h-0 flex-col overflow-hidden p-5">
        <CardHeaderActions
          icon={Activity}
          title={t("emotion.triggers.title", "触发因素")}
          description={t("emotion.triggers.description", "把情绪和真实生活事件连起来。")}
          isControlMode={isControlMode}
          onAdd={onAddTrigger}
          addLabel={t("emotion.actions.addTrigger", "新增触发")}
        />
        <div className="mt-5 grid min-h-0 flex-1 gap-3 overflow-y-auto pr-1 lg:grid-cols-2">
          {emotionModule.triggers.length > 0 ? (
            emotionModule.triggers.map((trigger) => (
              <TriggerCard
                key={trigger.id}
                trigger={trigger}
                onEdit={isControlMode ? () => onEditTrigger(trigger) : undefined}
              />
            ))
          ) : (
            <EmptyState message={t("emotion.empty.triggers", "当前筛选下没有触发因素。")} />
          )}
        </div>
      </Surface>

      <div className="grid min-h-0 gap-4 xl:grid-cols-3">
        <Surface className="flex min-h-[360px] flex-col overflow-hidden p-5">
          <CardHeaderActions
            icon={Battery}
            title={t("emotion.triggers.lifestyle", "生活节律关联")}
            description={t("emotion.triggers.lifestyleDesc", "睡眠、饮食、运动和屏幕时长。")}
            isControlMode={isControlMode}
            onAdd={onAddLifestyleLink}
            addLabel={t("emotion.actions.addLifestyleLink", "新增关联")}
          />
          <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {emotionModule.lifestyleLinks.length > 0 ? (
              emotionModule.lifestyleLinks.map((link) => (
                <LifestyleLinkCard
                  key={link.id}
                  link={link}
                  onEdit={isControlMode ? () => onEditLifestyleLink(link) : undefined}
                />
              ))
            ) : (
              <EmptyState
                message={t("emotion.empty.lifestyleLinks", "还没有生活节律关联。")}
                compact
              />
            )}
          </div>
        </Surface>

        <Surface className="flex min-h-[360px] flex-col overflow-hidden p-5">
          <CardHeaderActions
            icon={AlertTriangle}
            title={t("emotion.triggers.environment", "环境提示")}
            description={t("emotion.triggers.environmentDesc", "容易让状态变坏的场景。")}
            isControlMode={isControlMode}
            onAdd={onAddEnvironmentCue}
            addLabel={t("emotion.actions.addEnvironmentCue", "新增环境")}
          />
          <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {emotionModule.environmentCues.length > 0 ? (
              emotionModule.environmentCues.map((cue) => (
                <EnvCueCard
                  key={cue.id}
                  cue={cue}
                  onEdit={isControlMode ? () => onEditEnvironmentCue(cue) : undefined}
                />
              ))
            ) : (
              <EmptyState
                message={t("emotion.empty.environmentCues", "还没有环境提示。")}
                compact
              />
            )}
          </div>
        </Surface>

        <Surface className="flex min-h-[360px] flex-col overflow-hidden p-5">
          <CardHeaderActions
            icon={HeartPulse}
            title={t("emotion.triggers.relationships", "关系提示")}
            description={t("emotion.triggers.relationshipsDesc", "哪些关系更容易带来波动。")}
            isControlMode={isControlMode}
            onAdd={onAddRelationshipCue}
            addLabel={t("emotion.actions.addRelationshipCue", "新增关系")}
          />
          <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {emotionModule.relationshipCues.length > 0 ? (
              emotionModule.relationshipCues.map((cue) => (
                <RelationshipCueCard
                  key={cue.id}
                  cue={cue}
                  onEdit={isControlMode ? () => onEditRelationshipCue(cue) : undefined}
                />
              ))
            ) : (
              <EmptyState
                message={t("emotion.empty.relationshipCues", "还没有关系提示。")}
                compact
              />
            )}
          </div>
        </Surface>
      </div>
    </div>
  )
}

function ToolboxTab({
  emotionModule,
  isControlMode,
  onAddRecoveryNote,
  onAddTool,
  onEditRecoveryNote,
  onEditTextList,
  onEditTool,
}: {
  emotionModule: EmotionModuleData
  isControlMode: boolean
  onAddRecoveryNote: () => void
  onAddTool: () => void
  onEditRecoveryNote: (note: EmotionRecoveryNote) => void
  onEditTextList: (listKey: EmotionTextListKey) => void
  onEditTool: (tool: EmotionSupportTool) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="grid min-h-full gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
      <Surface className="flex min-h-[640px] flex-col overflow-hidden p-5">
        <CardHeaderActions
          icon={ShieldAlert}
          title={t("emotion.toolbox.title", "安抚与恢复工具箱")}
          description={t("emotion.toolbox.description", "状态差的时候，先有效，再分析。")}
          isControlMode={isControlMode}
          onAdd={onAddTool}
          addLabel={t("emotion.actions.addTool", "新增工具")}
        />
        <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <MinimalStepsCard
            steps={emotionModule.minimalRecoverySteps}
            onEdit={isControlMode ? () => onEditTextList("minimalRecoverySteps") : undefined}
          />
          {emotionModule.tools.length > 0 ? (
            emotionModule.tools.map((tool) => (
              <SupportToolCard
                key={tool.id}
                tool={tool}
                onEdit={isControlMode ? () => onEditTool(tool) : undefined}
              />
            ))
          ) : (
            <EmptyState message={t("emotion.empty.tools", "当前筛选下没有恢复工具。")} />
          )}
        </div>
      </Surface>

      <div className="grid min-h-0 gap-4 xl:grid-rows-[minmax(220px,0.44fr)_minmax(320px,0.56fr)]">
        <Surface className="flex min-h-[260px] flex-col overflow-hidden p-5">
          <CardHeaderActions
            icon={AlertTriangle}
            title={t("emotion.toolbox.ineffective", "反而会更糟的动作")}
            description={t("emotion.toolbox.ineffectiveDesc", "状态差时先避开这些路径。")}
            isControlMode={isControlMode}
            onEdit={isControlMode ? () => onEditTextList("ineffectiveActions") : undefined}
            editLabel={t("emotion.actions.editIneffectiveActions", "编辑提醒")}
          />
          <div className="mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
            <IneffectiveActionsCard actions={emotionModule.ineffectiveActions} />
          </div>
        </Surface>

        <Surface className="flex min-h-[360px] flex-col overflow-hidden p-5">
          <CardHeaderActions
            icon={Sparkles}
            title={t("emotion.toolbox.recoveryNotes", "曾经把我接住的方式")}
            description={t("emotion.toolbox.recoveryNotesDesc", "过去有效的经验可以再次被调用。")}
            isControlMode={isControlMode}
            onAdd={onAddRecoveryNote}
            addLabel={t("emotion.actions.addRecoveryNote", "新增经验")}
          />
          <div className="mt-5 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            {emotionModule.recoveryNotes.length > 0 ? (
              emotionModule.recoveryNotes.map((note) => (
                <RecoveryNoteCard
                  key={note.id}
                  note={note}
                  onEdit={isControlMode ? () => onEditRecoveryNote(note) : undefined}
                />
              ))
            ) : (
              <EmptyState message={t("emotion.empty.recoveryNotes", "还没有恢复经验。")} compact />
            )}
          </div>
        </Surface>
      </div>
    </div>
  )
}

function CardHeaderActions({
  addLabel,
  description,
  editLabel,
  icon,
  isControlMode,
  onAdd,
  onEdit,
  title,
}: {
  addLabel?: string
  description: string
  editLabel?: string
  icon: typeof Sun
  isControlMode: boolean
  onAdd?: () => void
  onEdit?: () => void
  title: string
}) {
  const { t } = useTranslation()

  return (
    <div className="flex items-start justify-between gap-3">
      <SectionHeading icon={icon} title={title} description={description} compact />
      <ActionGroup justify="end">
        <AnimatedButton
          show={isControlMode && Boolean(onEdit)}
          type="button"
          variant="outline"
          size="sm"
          onClick={onEdit}
        >
          <Pencil className="size-3.5" />
          {editLabel ?? t("emotion.actions.edit", "编辑")}
        </AnimatedButton>
        <AnimatedButton
          show={isControlMode && Boolean(onAdd)}
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
        >
          <Plus className="size-3.5" />
          {addLabel ?? t("emotion.actions.add", "新增")}
        </AnimatedButton>
      </ActionGroup>
    </div>
  )
}

function PanelListHeader({
  addLabel,
  isControlMode,
  onAdd,
  title,
}: {
  addLabel: string
  isControlMode: boolean
  onAdd: () => void
  title: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-xs tracking-wide text-[color:var(--text-muted)] uppercase">{title}</div>
      <ActionGroup justify="end" className="shrink-0">
        <AnimatedButton
          show={isControlMode}
          type="button"
          variant="outline"
          size="sm"
          onClick={onAdd}
        >
          <Plus className="size-3.5" />
          {addLabel}
        </AnimatedButton>
      </ActionGroup>
    </div>
  )
}

function EditButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <AnimatedIconButton
      show={Boolean(onClick)}
      containerClassName="absolute top-2 right-2"
      layout={false}
      type="button"
      variant="ghost"
      size="icon-sm"
      className="size-7 rounded-md border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]"
      label={label}
      icon={<Pencil className="size-3.5" />}
      onClick={onClick}
    />
  )
}

function OverviewSnapshot({ emotionModule }: { emotionModule: EmotionModuleData }) {
  const { t } = useTranslation()
  const overview = emotionModule.overview
  const totalTags = overview.topEmotionTags.reduce((sum, tag) => sum + tag.count, 0) || 1

  return (
    <>
      <div className="grid gap-2 min-[640px]:grid-cols-2">
        <SummaryTile
          icon={Battery}
          label={t("emotion.overview.averageScore", "平均强度")}
          value={`${overview.averageScore.toFixed(1)} / 10`}
        />
        <SummaryTile
          icon={Sparkles}
          label={t("emotion.overview.bestWindow", "最好的时段")}
          value={overview.bestWindow}
        />
        <SummaryTile
          icon={AlertTriangle}
          label={t("emotion.overview.worstWindow", "最差的时段")}
          value={overview.worstWindow}
        />
        <SummaryTile
          icon={Activity}
          label={t("emotion.overview.window", "窗口")}
          value={overview.windowLabel}
        />
      </div>

      <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3">
        <div className="text-xs font-medium text-[color:var(--text-primary)]">
          {t("emotion.overview.topTags", "高频情绪标签")}
        </div>
        <div className="mt-3 space-y-2">
          {overview.topEmotionTags.map((tag) => {
            const width = `${Math.max(12, (tag.count / totalTags) * 100)}%`
            return (
              <div key={tag.tag} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[color:var(--text-secondary)]">
                    {translateEmotionEnum(t, "emotionTag", tag.tag)}
                  </span>
                  <span className="text-[color:var(--text-muted)]">{tag.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--chip-bg)]">
                  <div
                    className="h-full rounded-full bg-[color:var(--emotion-accent-ink)] opacity-70"
                    style={{ width }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-lg border border-[color:var(--emotion-accent-border)] bg-[color:var(--emotion-accent-bg)] px-4 py-3 text-xs leading-5 text-[color:var(--emotion-accent-ink)]">
        <span className="font-medium">{t("emotion.overview.conclusion", "一句话总结")}：</span>
        {overview.conclusion}
      </div>
    </>
  )
}

function SummaryTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Battery
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-2.5">
      <div className="flex items-center gap-2 text-[11px] tracking-wide text-[color:var(--text-muted)] uppercase">
        <Icon className="size-3.5" />
        {label}
      </div>
      <div className="mt-1.5 text-sm font-medium text-[color:var(--text-primary)]">{value}</div>
    </div>
  )
}

function CheckInDetailedCard({
  checkIn,
  compact = false,
  highlight = false,
  onEdit,
}: {
  checkIn: EmotionCheckIn
  compact?: boolean
  highlight?: boolean
  onEdit?: () => void
}) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "relative rounded-lg border px-3 py-3",
        highlight
          ? "border-[color:var(--emotion-accent-border)] bg-[color:var(--emotion-accent-bg)]"
          : "border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)]",
        compact && "py-2.5",
        onEdit && "pr-11",
      )}
    >
      <EditButton label={t("emotion.actions.editCheckIn", "编辑情绪记录")} onClick={onEdit} />
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]">
          {translateEmotionEnum(t, "state", checkIn.state)}
        </Badge>
        <span className="text-xs text-[color:var(--text-muted)]">{checkIn.date}</span>
        <span className="text-xs text-[color:var(--text-muted)]">
          {t("emotion.common.intensity", "强度")} {checkIn.intensity}
        </span>
      </div>
      <p
        className={cn(
          "mt-2 text-sm leading-6 text-[color:var(--text-secondary)]",
          compact && "text-xs leading-5",
        )}
      >
        {checkIn.summary}
      </p>

      {checkIn.emotionTags && checkIn.emotionTags.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {checkIn.emotionTags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
            >
              {translateEmotionEnum(t, "emotionTag", tag)}
            </Badge>
          ))}
        </div>
      ) : null}

      {!compact ? (
        <div className="mt-3 grid gap-2 min-[640px]:grid-cols-2">
          <DetailRow
            label={t("emotion.common.bodySignal", "身体感觉")}
            value={checkIn.bodySignal}
          />
          {checkIn.triggerEvent ? (
            <DetailRow
              label={t("emotion.common.triggerEvent", "触发事件")}
              value={checkIn.triggerEvent}
            />
          ) : null}
          {checkIn.impulse ? (
            <DetailRow
              label={t("emotion.common.impulse", "此刻冲动")}
              value={translateEmotionEnum(t, "impulse", checkIn.impulse)}
            />
          ) : null}
          {checkIn.needRightNow ? (
            <DetailRow
              label={t("emotion.common.needRightNow", "现在最需要")}
              value={checkIn.needRightNow}
            />
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-[color:var(--text-muted)]">
          {t("emotion.common.bodyPrefix", "身体")}：{checkIn.bodySignal}
          {checkIn.impulse
            ? ` · ${t("emotion.common.impulsePrefix", "想")}${translateEmotionEnum(t, "impulse", checkIn.impulse)}`
            : ""}
        </p>
      )}

      {!compact && checkIn.tags.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {checkIn.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
            >
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-3 py-2">
      <div className="text-[11px] text-[color:var(--text-muted)]">{label}</div>
      <div className="mt-0.5 text-xs leading-5 text-[color:var(--text-primary)]">{value}</div>
    </div>
  )
}

function TrendChart({
  onEditPoint,
  trend,
}: {
  onEditPoint?: (point: EmotionTrendPoint) => void
  trend: EmotionTrendPoint[]
}) {
  const { t } = useTranslation()

  if (trend.length === 0) {
    return <EmptyState message={t("emotion.empty.trend", "还没有可绘制的情绪样本。")} compact />
  }

  const points = trend.map((entry, index) => {
    const x = trend.length === 1 ? 50 : (index / (trend.length - 1)) * 100
    const y = 100 - (entry.score / 10) * 100
    return { ...entry, x, y }
  })
  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ")
  const areaPath = `M 0,100 L ${polyline} L 100,100 Z`

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
          <CalendarRange className="size-3.5" />
          {t("emotion.timeline.chartTitle", "7 天情绪强度")}
        </div>
        <div className="text-[11px] text-[color:var(--text-muted)]">
          {t("emotion.timeline.chartHint", "0–10 越高越紧绷")}
        </div>
      </div>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="mt-3 h-28 w-full text-[color:var(--emotion-chart-line)]"
      >
        <path d={areaPath} fill="currentColor" opacity={0.12} />
        <polyline
          points={polyline}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.2}
          opacity={0.9}
          vectorEffect="non-scaling-stroke"
        />
        {points.map((point) => (
          <circle
            key={point.id}
            cx={point.x}
            cy={point.y}
            r={1.6}
            fill="currentColor"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-7">
        {points.map((point) => (
          <button
            key={`${point.id}-label`}
            type="button"
            disabled={!onEditPoint}
            className={cn(
              "rounded-md border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-2 py-1.5 text-left text-[10px] text-[color:var(--text-muted)]",
              onEditPoint && "transition-colors hover:text-[color:var(--text-primary)]",
            )}
            onClick={() => onEditPoint?.(point)}
          >
            <div className="font-medium text-[color:var(--text-secondary)]">{point.label}</div>
            <div className="mt-0.5">
              {point.score} ·{" "}
              {point.primaryState
                ? translateEmotionEnum(t, "state", point.primaryState)
                : point.note}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}

function TimelineSegmentCard({
  onEdit,
  segment,
}: {
  onEdit?: () => void
  segment: EmotionTimelineSegment
}) {
  const { t } = useTranslation()
  const trendStyle =
    segment.trend === "持续恶化"
      ? "bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]"
      : segment.trend === "逐渐恢复"
        ? "bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]"
        : segment.trend === "起伏波动"
          ? "bg-[color:var(--tone-past-bg)] text-[color:var(--tone-past-ink)]"
          : "bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"

  return (
    <div
      className={cn(
        "relative rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-2.5",
        onEdit && "pr-11",
      )}
    >
      <EditButton label={t("emotion.actions.editSegment", "编辑时间段")} onClick={onEdit} />
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={trendStyle}>
          {translateEmotionEnum(t, "segmentTrend", segment.trend)}
        </Badge>
        <span className="text-xs text-[color:var(--text-muted)]">{segment.range}</span>
      </div>
      <p className="mt-1.5 text-xs leading-5 text-[color:var(--text-secondary)]">
        {segment.summary}
      </p>
    </div>
  )
}

function LoopPatternCard({ loop, onEdit }: { loop: EmotionLoopPattern; onEdit?: () => void }) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "relative rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-2.5",
        onEdit && "pr-11",
      )}
    >
      <EditButton label={t("emotion.actions.editLoop", "编辑循环")} onClick={onEdit} />
      <div className="text-xs font-medium text-[color:var(--text-primary)]">{loop.title}</div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">
        {loop.description}
      </p>
      <p className="mt-1 text-[11px] text-[color:var(--text-muted)]">{loop.frequency}</p>
    </div>
  )
}

function TriggerCard({ onEdit, trigger }: { onEdit?: () => void; trigger: EmotionTriggerGroup }) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "relative rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4",
        onEdit && "pr-11",
      )}
    >
      <EditButton label={t("emotion.actions.editTrigger", "编辑触发")} onClick={onEdit} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="font-medium text-[color:var(--text-primary)]">{trigger.title}</div>
        {trigger.category ? (
          <Badge
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
          >
            {translateEmotionEnum(t, "triggerCategory", trigger.category)}
          </Badge>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{trigger.summary}</p>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {trigger.cues.map((cue) => (
          <Badge
            key={cue}
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
          >
            {cue}
          </Badge>
        ))}
      </div>
      {trigger.recentExamples && trigger.recentExamples.length > 0 ? (
        <p className="mt-2 text-[11px] text-[color:var(--text-muted)]">
          {t("emotion.common.recent", "最近")}：{trigger.recentExamples.join(" · ")}
        </p>
      ) : null}
    </div>
  )
}

function LifestyleLinkCard({ link, onEdit }: { link: EmotionLifestyleLink; onEdit?: () => void }) {
  const { t } = useTranslation()
  const directionStyle =
    link.direction === "正相关"
      ? "bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]"
      : link.direction === "负相关"
        ? "bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]"
        : "bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"

  return (
    <div
      className={cn(
        "relative rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3",
        onEdit && "pr-11",
      )}
    >
      <EditButton label={t("emotion.actions.editLifestyleLink", "编辑关联")} onClick={onEdit} />
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
        >
          {translateEmotionEnum(t, "lifestyleFactor", link.factor)}
        </Badge>
        <Badge className={directionStyle}>
          {translateEmotionEnum(t, "linkDirection", link.direction)}
        </Badge>
      </div>
      <p className="mt-2 text-xs leading-5 text-[color:var(--text-secondary)]">
        {link.observation}
      </p>
    </div>
  )
}

function EnvCueCard({ cue, onEdit }: { cue: EmotionEnvironmentCue; onEdit?: () => void }) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "relative rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-2.5",
        onEdit && "pr-11",
      )}
    >
      <EditButton label={t("emotion.actions.editEnvironmentCue", "编辑环境")} onClick={onEdit} />
      <div className="text-xs font-medium text-[color:var(--text-primary)]">{cue.context}</div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">{cue.description}</p>
    </div>
  )
}

function RelationshipCueCard({
  cue,
  onEdit,
}: {
  cue: EmotionRelationshipCue
  onEdit?: () => void
}) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "relative rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-2.5",
        onEdit && "pr-11",
      )}
    >
      <EditButton label={t("emotion.actions.editRelationshipCue", "编辑关系")} onClick={onEdit} />
      <div className="text-xs font-medium text-[color:var(--text-primary)]">{cue.who}</div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">{cue.pattern}</p>
    </div>
  )
}

function SupportToolCard({ onEdit, tool }: { onEdit?: () => void; tool: EmotionSupportTool }) {
  const { t } = useTranslation()
  const kindStyle =
    tool.kind === "有效"
      ? "bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]"
      : tool.kind === "无效"
        ? "bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]"
        : tool.kind === "可联系"
          ? "bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]"
          : "bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"

  return (
    <div
      className={cn(
        "relative rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3",
        onEdit && "pr-11",
      )}
    >
      <EditButton label={t("emotion.actions.editTool", "编辑工具")} onClick={onEdit} />
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-medium text-[color:var(--text-primary)]">{tool.title}</div>
        {tool.kind ? (
          <Badge className={kindStyle}>{translateEmotionEnum(t, "toolKind", tool.kind)}</Badge>
        ) : null}
      </div>
      <p className="mt-1.5 text-xs leading-5 text-[color:var(--text-secondary)]">
        {tool.description}
      </p>
      <p className="mt-1.5 text-[11px] text-[color:var(--text-muted)]">
        {t("emotion.common.when", "适用时机")}：{tool.when}
      </p>
      {tool.contactScript ? (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-2 py-1 text-[11px] text-[color:var(--text-secondary)]">
          <PhoneCall className="size-3" />
          {tool.contactScript}
        </div>
      ) : null}
    </div>
  )
}

function MinimalStepsCard({ onEdit, steps }: { onEdit?: () => void; steps: string[] }) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "relative rounded-lg border border-[color:var(--emotion-accent-border)] bg-[color:var(--emotion-accent-bg)] px-3 py-3",
        onEdit && "pr-11",
      )}
    >
      <EditButton label={t("emotion.actions.editMinimalSteps", "编辑极简步骤")} onClick={onEdit} />
      <div className="flex items-center gap-2 text-xs font-medium text-[color:var(--emotion-accent-ink)]">
        <Sparkles className="size-3.5" />
        {t("emotion.toolbox.minimalSteps", "如果已经很差，只做这三件事")}
      </div>
      {steps.length > 0 ? (
        <ol className="mt-2 space-y-1.5">
          {steps.map((step, index) => (
            <li
              key={step}
              className="flex items-start gap-2 text-xs leading-5 text-[color:var(--text-secondary)]"
            >
              <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[10px] font-medium text-[color:var(--text-primary)]">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-3">
          <EmptyState
            message={t("emotion.empty.minimalRecoverySteps", "还没有极简恢复步骤。")}
            compact
          />
        </div>
      )}
    </div>
  )
}

function IneffectiveActionsCard({ actions }: { actions: string[] }) {
  const { t } = useTranslation()

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3">
      {actions.length > 0 ? (
        <ul className="space-y-1 text-xs leading-5 text-[color:var(--text-muted)]">
          {actions.map((action) => (
            <li key={action}>· {action}</li>
          ))}
        </ul>
      ) : (
        <EmptyState
          message={t("emotion.empty.ineffectiveActions", "还没有无效动作提醒。")}
          compact
        />
      )}
    </div>
  )
}

function RecoveryNoteCard({ note, onEdit }: { note: EmotionRecoveryNote; onEdit?: () => void }) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "relative rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-2.5",
        onEdit && "pr-11",
      )}
    >
      <EditButton label={t("emotion.actions.editRecoveryNote", "编辑恢复经验")} onClick={onEdit} />
      <div className="text-[11px] text-[color:var(--text-muted)]">{note.date}</div>
      <div className="mt-1 text-xs font-medium text-[color:var(--text-primary)]">{note.what}</div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">
        {t("emotion.common.effect", "效果")}：{note.effect}
      </p>
    </div>
  )
}

function InfoBlock({ body, title }: { body: string; title: string }) {
  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3">
      <div className="text-sm font-medium text-[color:var(--text-primary)]">{title}</div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">{body}</p>
    </div>
  )
}

function normalizeEmotionData(emotion: EmotionModuleData): EmotionModuleData {
  const source = emotion as Partial<EmotionModuleData>

  return {
    checkIns: source.checkIns ?? [],
    trend: source.trend ?? [],
    triggers: source.triggers ?? [],
    tools: source.tools ?? [],
    overview: {
      ...EMPTY_EMOTION_OVERVIEW,
      ...(source.overview ?? {}),
      topEmotionTags: source.overview?.topEmotionTags ?? [],
    },
    timelineSegments: source.timelineSegments ?? [],
    loopPatterns: source.loopPatterns ?? [],
    lifestyleLinks: source.lifestyleLinks ?? [],
    environmentCues: source.environmentCues ?? [],
    relationshipCues: source.relationshipCues ?? [],
    recoveryNotes: source.recoveryNotes ?? [],
    ineffectiveActions: source.ineffectiveActions ?? [],
    minimalRecoverySteps: source.minimalRecoverySteps ?? [],
  }
}
