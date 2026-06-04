import {
  Activity,
  AlertTriangle,
  Battery,
  CalendarRange,
  HeartPulse,
  PhoneCall,
  ShieldAlert,
  Sparkles,
  Sun,
  WavesLadder,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
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
  EmptyState,
  PageIntro,
  SectionHeading,
  Surface,
} from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"

export function EmotionPage({
  emotionModule,
  searchQuery,
  isStackedLayout = false,
}: {
  emotionModule: EmotionModuleData
  searchQuery: string
  isStackedLayout?: boolean
}) {
  const isFixedLayout = !isStackedLayout
  const latestCheckIn = emotionModule.checkIns[0]
  const previousCheckIns = emotionModule.checkIns.slice(1)

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <PageIntro
        eyebrow="情绪情感"
        title="看见最近的心理天气"
        description="把波动、触发因素、和对自己有效的恢复方式放在一起看 —— 不只是收集低落，对低落要有回应。"
        searchQuery={searchQuery}
      />

      {isFixedLayout ? (
        <EmotionFixedDashboard
          emotionModule={emotionModule}
          latestCheckIn={latestCheckIn}
          previousCheckIns={previousCheckIns}
        />
      ) : (
        <EmotionStackedView
          emotionModule={emotionModule}
          latestCheckIn={latestCheckIn}
          previousCheckIns={previousCheckIns}
        />
      )}
    </div>
  )
}

function EmotionFixedDashboard({
  emotionModule,
  latestCheckIn,
  previousCheckIns,
}: {
  emotionModule: EmotionModuleData
  latestCheckIn: EmotionCheckIn | undefined
  previousCheckIns: EmotionCheckIn[]
}) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.05fr)_minmax(0,1.2fr)_minmax(320px,0.88fr)] grid-rows-[minmax(0,0.94fr)_minmax(0,1fr)] gap-3 overflow-hidden">
      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <SectionHeading
          icon={Sun}
          title="情绪总览"
          description={emotionModule.overview.windowLabel}
          compact
        />
        <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <OverviewSnapshot emotionModule={emotionModule} />
        </div>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <SectionHeading
          icon={HeartPulse}
          title="今天的情绪记录"
          description="此刻的强度、身体感觉、想做的反应。"
          compact
        />
        <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {latestCheckIn ? (
            <CheckInDetailedCard checkIn={latestCheckIn} highlight />
          ) : (
            <EmptyState message="还没有今天的情绪记录。" compact />
          )}
          {previousCheckIns.length > 0 ? (
            <div className="space-y-2 border-t border-[color:var(--muted-surface-border)] pt-3">
              <div className="text-[11px] tracking-wide text-[color:var(--text-muted)] uppercase">
                最近几条
              </div>
              {previousCheckIns.slice(0, 3).map((checkIn) => (
                <CheckInDetailedCard key={checkIn.id} checkIn={checkIn} compact />
              ))}
            </div>
          ) : null}
        </div>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <SectionHeading
          icon={WavesLadder}
          title="波动时间线"
          description="7 天强度曲线 + 区段总结。"
          compact
        />
        <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <TrendChart trend={emotionModule.trend} />
          <div className="space-y-2">
            {emotionModule.timelineSegments.length > 0 ? (
              emotionModule.timelineSegments.map((segment) => (
                <TimelineSegmentCard key={segment.id} segment={segment} />
              ))
            ) : (
              <EmptyState message="还没有可总结的时间段。" compact />
            )}
          </div>
          <div className="space-y-2">
            <div className="text-[11px] tracking-wide text-[color:var(--text-muted)] uppercase">
              反复出现的循环
            </div>
            {emotionModule.loopPatterns.length > 0 ? (
              emotionModule.loopPatterns.map((loop) => (
                <LoopPatternCard key={loop.id} loop={loop} />
              ))
            ) : (
              <EmptyState message="还没有识别到循环模式。" compact />
            )}
          </div>
        </div>
      </Surface>

      <Surface className="col-span-2 flex min-h-0 flex-col overflow-hidden p-4">
        <Tabs defaultValue="triggers" className="min-h-0 flex-1">
          <TabsList className="w-full justify-start gap-1 rounded-lg bg-[color:var(--chip-bg)] p-1">
            <TabsTrigger value="triggers">触发因素</TabsTrigger>
            <TabsTrigger value="lifestyle">与生活节律的关联</TabsTrigger>
            <TabsTrigger value="env">环境与关系</TabsTrigger>
          </TabsList>

          <TabsContent value="triggers" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="grid gap-2 min-[960px]:grid-cols-2">
              {emotionModule.triggers.length > 0 ? (
                emotionModule.triggers.map((trigger) => (
                  <TriggerCard key={trigger.id} trigger={trigger} compact />
                ))
              ) : (
                <EmptyState message="当前筛选下没有触发因素。" compact />
              )}
            </div>
          </TabsContent>

          <TabsContent value="lifestyle" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="grid gap-2 min-[960px]:grid-cols-2">
              {emotionModule.lifestyleLinks.length > 0 ? (
                emotionModule.lifestyleLinks.map((link) => (
                  <LifestyleLinkCard key={link.id} link={link} />
                ))
              ) : (
                <EmptyState message="还没有节律关联记录。" compact />
              )}
            </div>
          </TabsContent>

          <TabsContent value="env" className="mt-3 min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="grid gap-3 min-[960px]:grid-cols-2">
              <div className="space-y-2">
                <div className="text-[11px] tracking-wide text-[color:var(--text-muted)] uppercase">
                  环境提示
                </div>
                {emotionModule.environmentCues.length > 0 ? (
                  emotionModule.environmentCues.map((cue) => <EnvCueCard key={cue.id} cue={cue} />)
                ) : (
                  <EmptyState message="还没有环境提示。" compact />
                )}
              </div>
              <div className="space-y-2">
                <div className="text-[11px] tracking-wide text-[color:var(--text-muted)] uppercase">
                  关系提示
                </div>
                {emotionModule.relationshipCues.length > 0 ? (
                  emotionModule.relationshipCues.map((cue) => (
                    <RelationshipCueCard key={cue.id} cue={cue} />
                  ))
                ) : (
                  <EmptyState message="还没有关系提示。" compact />
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Surface>

      <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
        <SectionHeading
          icon={ShieldAlert}
          title="恢复工具箱"
          description="先有效，再分析。"
          compact
        />
        <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          <MinimalStepsCard steps={emotionModule.minimalRecoverySteps} />
          {emotionModule.tools.length > 0 ? (
            emotionModule.tools.map((tool) => <SupportToolCard key={tool.id} tool={tool} />)
          ) : (
            <EmptyState message="当前筛选下没有恢复工具。" compact />
          )}
          {emotionModule.ineffectiveActions.length > 0 ? (
            <IneffectiveActionsCard actions={emotionModule.ineffectiveActions} />
          ) : null}
          {emotionModule.recoveryNotes.length > 0 ? (
            <div className="space-y-2 border-t border-[color:var(--muted-surface-border)] pt-3">
              <div className="text-[11px] tracking-wide text-[color:var(--text-muted)] uppercase">
                曾经把我接住的方式
              </div>
              {emotionModule.recoveryNotes.map((note) => (
                <RecoveryNoteCard key={note.id} note={note} />
              ))}
            </div>
          ) : null}
        </div>
      </Surface>
    </div>
  )
}

function EmotionStackedView({
  emotionModule,
  latestCheckIn,
  previousCheckIns,
}: {
  emotionModule: EmotionModuleData
  latestCheckIn: EmotionCheckIn | undefined
  previousCheckIns: EmotionCheckIn[]
}) {
  return (
    <div className="space-y-4">
      <Surface className="p-5">
        <SectionHeading
          icon={Sun}
          title="情绪总览"
          description={`心理天气图 · ${emotionModule.overview.windowLabel}`}
        />
        <div className="mt-5">
          <OverviewSnapshot emotionModule={emotionModule} />
        </div>
      </Surface>

      <div className="grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <Surface className="p-5">
          <SectionHeading
            icon={HeartPulse}
            title="今天的情绪记录"
            description="先把模糊的情绪落成可回看的样本。"
          />
          <div className="mt-5 space-y-4">
            {latestCheckIn ? (
              <CheckInDetailedCard checkIn={latestCheckIn} highlight />
            ) : (
              <EmptyState message="今天还没有记录。" compact />
            )}
            {previousCheckIns.map((checkIn) => (
              <CheckInDetailedCard key={checkIn.id} checkIn={checkIn} />
            ))}
          </div>
        </Surface>

        <Surface className="p-5">
          <SectionHeading
            icon={WavesLadder}
            title="波动时间线"
            description="情绪不是随机，而是有节律的。"
          />
          <div className="mt-5 space-y-4">
            <TrendChart trend={emotionModule.trend} />
            <div className="space-y-3">
              {emotionModule.timelineSegments.map((segment) => (
                <TimelineSegmentCard key={segment.id} segment={segment} />
              ))}
            </div>
            <div className="space-y-3 border-t border-[color:var(--muted-surface-border)] pt-3">
              <div className="text-xs tracking-wide text-[color:var(--text-muted)] uppercase">
                反复出现的循环
              </div>
              {emotionModule.loopPatterns.map((loop) => (
                <LoopPatternCard key={loop.id} loop={loop} />
              ))}
            </div>
          </div>
        </Surface>
      </div>

      <Surface className="p-5">
        <SectionHeading
          icon={Activity}
          title="触发因素与关联"
          description="把情绪和现实生活连起来 —— 不再无缘无故失控。"
        />
        <div className="mt-5 grid gap-3 min-[960px]:grid-cols-2">
          {emotionModule.triggers.map((trigger) => (
            <TriggerCard key={trigger.id} trigger={trigger} />
          ))}
        </div>
        <div className="mt-4 grid gap-3 min-[960px]:grid-cols-2">
          {emotionModule.lifestyleLinks.map((link) => (
            <LifestyleLinkCard key={link.id} link={link} />
          ))}
        </div>
        <div className="mt-4 grid gap-3 min-[960px]:grid-cols-2">
          <div className="space-y-2">
            <div className="text-xs tracking-wide text-[color:var(--text-muted)] uppercase">
              环境提示
            </div>
            {emotionModule.environmentCues.map((cue) => (
              <EnvCueCard key={cue.id} cue={cue} />
            ))}
          </div>
          <div className="space-y-2">
            <div className="text-xs tracking-wide text-[color:var(--text-muted)] uppercase">
              关系提示
            </div>
            {emotionModule.relationshipCues.map((cue) => (
              <RelationshipCueCard key={cue.id} cue={cue} />
            ))}
          </div>
        </div>
      </Surface>

      <Surface className="p-5">
        <SectionHeading
          icon={ShieldAlert}
          title="安抚与恢复工具箱"
          description="状态差的时候不必弄懂所有原因，先有效。"
        />
        <div className="mt-5 grid gap-3 min-[960px]:grid-cols-2">
          <MinimalStepsCard steps={emotionModule.minimalRecoverySteps} />
          <IneffectiveActionsCard actions={emotionModule.ineffectiveActions} />
        </div>
        <div className="mt-4 grid gap-3 min-[960px]:grid-cols-2">
          {emotionModule.tools.map((tool) => (
            <SupportToolCard key={tool.id} tool={tool} />
          ))}
        </div>
        <div className="mt-4 space-y-2">
          <div className="text-xs tracking-wide text-[color:var(--text-muted)] uppercase">
            曾经把我接住的方式
          </div>
          {emotionModule.recoveryNotes.map((note) => (
            <RecoveryNoteCard key={note.id} note={note} />
          ))}
        </div>
      </Surface>
    </div>
  )
}

function OverviewSnapshot({ emotionModule }: { emotionModule: EmotionModuleData }) {
  const overview = emotionModule.overview
  const totalTags = overview.topEmotionTags.reduce((sum, tag) => sum + tag.count, 0) || 1

  return (
    <>
      <div className="grid gap-2 min-[640px]:grid-cols-2">
        <SummaryTile
          icon={Battery}
          label="平均强度"
          value={`${overview.averageScore.toFixed(1)} / 10`}
        />
        <SummaryTile icon={Sparkles} label="最好的时段" value={overview.bestWindow} />
        <SummaryTile icon={AlertTriangle} label="最差的时段" value={overview.worstWindow} />
        <SummaryTile icon={Activity} label="窗口" value={overview.windowLabel} />
      </div>

      <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3">
        <div className="text-xs font-medium text-[color:var(--text-primary)]">高频情绪标签</div>
        <div className="mt-3 space-y-2">
          {overview.topEmotionTags.map((tag) => {
            const width = `${Math.max(12, (tag.count / totalTags) * 100)}%`
            return (
              <div key={tag.tag} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[color:var(--text-secondary)]">{tag.tag}</span>
                  <span className="text-[color:var(--text-muted)]">{tag.count}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--chip-bg)]">
                  <div
                    className="h-full rounded-full bg-[color:var(--text-primary)] opacity-70"
                    style={{ width }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-4 py-3 text-xs leading-5 text-[color:var(--text-secondary)]">
        <span className="font-medium text-[color:var(--text-primary)]">本周一句话总结：</span>
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
  highlight = false,
  compact = false,
}: {
  checkIn: EmotionCheckIn
  highlight?: boolean
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-3",
        highlight
          ? "border-[color:var(--chip-border)] bg-[color:var(--chip-bg)]"
          : "border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)]",
        compact && "px-3 py-2.5",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]">
          {checkIn.state}
        </Badge>
        <span className="text-xs text-[color:var(--text-muted)]">{checkIn.date}</span>
        <span className="text-xs text-[color:var(--text-muted)]">强度 {checkIn.intensity}</span>
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
              {tag}
            </Badge>
          ))}
        </div>
      ) : null}

      {!compact ? (
        <div className="mt-3 grid gap-2 min-[640px]:grid-cols-2">
          <DetailRow label="身体感觉" value={checkIn.bodySignal} />
          {checkIn.triggerEvent ? (
            <DetailRow label="触发事件" value={checkIn.triggerEvent} />
          ) : null}
          {checkIn.impulse ? <DetailRow label="此刻冲动" value={checkIn.impulse} /> : null}
          {checkIn.needRightNow ? (
            <DetailRow label="现在最需要" value={checkIn.needRightNow} />
          ) : null}
        </div>
      ) : (
        <p className="mt-2 text-[11px] text-[color:var(--text-muted)]">
          身体：{checkIn.bodySignal}
          {checkIn.impulse ? ` · 想${checkIn.impulse}` : ""}
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

function TrendChart({ trend }: { trend: EmotionTrendPoint[] }) {
  if (trend.length === 0) {
    return <EmptyState message="还没有可绘制的情绪样本。" compact />
  }

  const max = 10
  const min = 0
  const points = trend.map((entry, index) => {
    const x = trend.length === 1 ? 50 : (index / (trend.length - 1)) * 100
    const ratio = (entry.score - min) / (max - min)
    const y = 100 - ratio * 100
    return { ...entry, x, y }
  })
  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ")
  const areaPath = `M 0,100 L ${polyline} L 100,100 Z`

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-[color:var(--text-secondary)]">
          <CalendarRange className="size-3.5" />7 天情绪强度
        </div>
        <div className="text-[11px] text-[color:var(--text-muted)]">0–10 越高越紧绷</div>
      </div>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="mt-3 h-24 w-full text-[color:var(--text-primary)]"
      >
        <path d={areaPath} fill="currentColor" opacity={0.12} />
        <polyline
          points={polyline}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.2}
          opacity={0.85}
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
      <div className="mt-2 flex items-end justify-between text-[10px] text-[color:var(--text-muted)]">
        {points.map((point) => (
          <div key={`${point.id}-label`} className="flex-1 px-0.5 text-center">
            <div className="font-medium text-[color:var(--text-secondary)]">{point.label}</div>
            <div className="mt-0.5">{point.score}</div>
            {point.primaryState ? (
              <div className="mt-0.5 truncate">{point.primaryState}</div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

function TimelineSegmentCard({ segment }: { segment: EmotionTimelineSegment }) {
  const trendStyle =
    segment.trend === "持续恶化"
      ? "bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]"
      : segment.trend === "逐渐恢复"
        ? "bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]"
        : segment.trend === "起伏波动"
          ? "bg-[color:var(--tone-past-bg)] text-[color:var(--tone-past-ink)]"
          : "bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={trendStyle}>{segment.trend}</Badge>
        <span className="text-xs text-[color:var(--text-muted)]">{segment.range}</span>
      </div>
      <p className="mt-1.5 text-xs leading-5 text-[color:var(--text-secondary)]">
        {segment.summary}
      </p>
    </div>
  )
}

function LoopPatternCard({ loop }: { loop: EmotionLoopPattern }) {
  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-2.5">
      <div className="text-xs font-medium text-[color:var(--text-primary)]">{loop.title}</div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">
        {loop.description}
      </p>
      <p className="mt-1 text-[11px] text-[color:var(--text-muted)]">{loop.frequency}</p>
    </div>
  )
}

function TriggerCard({
  trigger,
  compact = false,
}: {
  trigger: EmotionTriggerGroup
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4",
        compact && "px-3 py-3",
      )}
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="font-medium text-[color:var(--text-primary)]">{trigger.title}</div>
        {trigger.category ? (
          <Badge
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
          >
            {trigger.category}
          </Badge>
        ) : null}
      </div>
      <p
        className={cn(
          "mt-2 text-sm leading-6 text-[color:var(--text-secondary)]",
          compact && "text-xs leading-5",
        )}
      >
        {trigger.summary}
      </p>
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
          最近：{trigger.recentExamples.join(" · ")}
        </p>
      ) : null}
    </div>
  )
}

function LifestyleLinkCard({ link }: { link: EmotionLifestyleLink }) {
  const directionStyle =
    link.direction === "正相关"
      ? "bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]"
      : link.direction === "负相关"
        ? "bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]"
        : "bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]"
        >
          {link.factor}
        </Badge>
        <Badge className={directionStyle}>{link.direction}</Badge>
      </div>
      <p className="mt-2 text-xs leading-5 text-[color:var(--text-secondary)]">
        {link.observation}
      </p>
    </div>
  )
}

function EnvCueCard({ cue }: { cue: EmotionEnvironmentCue }) {
  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-2.5">
      <div className="text-xs font-medium text-[color:var(--text-primary)]">{cue.context}</div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">{cue.description}</p>
    </div>
  )
}

function RelationshipCueCard({ cue }: { cue: EmotionRelationshipCue }) {
  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-2.5">
      <div className="text-xs font-medium text-[color:var(--text-primary)]">{cue.who}</div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">{cue.pattern}</p>
    </div>
  )
}

function SupportToolCard({ tool }: { tool: EmotionSupportTool }) {
  const kindStyle =
    tool.kind === "有效"
      ? "bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]"
      : tool.kind === "无效"
        ? "bg-[color:var(--tone-future-bg)] text-[color:var(--tone-future-ink)]"
        : tool.kind === "可联系"
          ? "bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]"
          : "bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="text-sm font-medium text-[color:var(--text-primary)]">{tool.title}</div>
        {tool.kind ? <Badge className={kindStyle}>{tool.kind}</Badge> : null}
      </div>
      <p className="mt-1.5 text-xs leading-5 text-[color:var(--text-secondary)]">
        {tool.description}
      </p>
      <p className="mt-1.5 text-[11px] text-[color:var(--text-muted)]">适用时机：{tool.when}</p>
      {tool.contactScript ? (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-2 py-1 text-[11px] text-[color:var(--text-secondary)]">
          <PhoneCall className="size-3" />
          {tool.contactScript}
        </div>
      ) : null}
    </div>
  )
}

function MinimalStepsCard({ steps }: { steps: string[] }) {
  if (steps.length === 0) {
    return null
  }
  return (
    <div className="rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-3 py-3">
      <div className="flex items-center gap-2 text-xs font-medium text-[color:var(--text-primary)]">
        <Sparkles className="size-3.5" />
        如果已经很差，只做这三件事
      </div>
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
    </div>
  )
}

function IneffectiveActionsCard({ actions }: { actions: string[] }) {
  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3">
      <div className="flex items-center gap-2 text-xs font-medium text-[color:var(--text-primary)]">
        <AlertTriangle className="size-3.5" />
        反而会更糟的动作
      </div>
      <ul className="mt-2 space-y-1 text-xs leading-5 text-[color:var(--text-muted)]">
        {actions.map((action) => (
          <li key={action}>· {action}</li>
        ))}
      </ul>
    </div>
  )
}

function RecoveryNoteCard({ note }: { note: EmotionRecoveryNote }) {
  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-2.5">
      <div className="text-[11px] text-[color:var(--text-muted)]">{note.date}</div>
      <div className="mt-1 text-xs font-medium text-[color:var(--text-primary)]">{note.what}</div>
      <p className="mt-1 text-xs leading-5 text-[color:var(--text-secondary)]">
        效果：{note.effect}
      </p>
    </div>
  )
}
