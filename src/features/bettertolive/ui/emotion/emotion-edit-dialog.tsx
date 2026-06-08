import { Trash2 } from "lucide-react"
import type { ComponentProps, FormEvent, ReactNode } from "react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useSaveEmotionMutation } from "@/features/bettertolive/queries/use-save-emotion-mutation"
import type {
  EmotionCheckIn,
  EmotionEmotionTag,
  EmotionEnvironmentCue,
  EmotionImpulse,
  EmotionLifestyleLink,
  EmotionLoopPattern,
  EmotionModuleData,
  EmotionOverviewSummary,
  EmotionRecoveryNote,
  EmotionRelationshipCue,
  EmotionState,
  EmotionSupportTool,
  EmotionSupportToolKind,
  EmotionTimelineSegment,
  EmotionTrendPoint,
  EmotionTriggerCategory,
  EmotionTriggerGroup,
} from "@/features/bettertolive/types"
import { translateEmotionEnum } from "@/features/bettertolive/ui/emotion/emotion-i18n"
import { cn } from "@/lib/utils"

export type EmotionEntityEditorTarget =
  | { kind: "checkIn"; isNew: boolean; item: EmotionCheckIn | null }
  | { kind: "trendPoint"; isNew: boolean; item: EmotionTrendPoint | null }
  | { kind: "trigger"; isNew: boolean; item: EmotionTriggerGroup | null }
  | { kind: "tool"; isNew: boolean; item: EmotionSupportTool | null }
  | { kind: "timelineSegment"; isNew: boolean; item: EmotionTimelineSegment | null }
  | { kind: "loopPattern"; isNew: boolean; item: EmotionLoopPattern | null }
  | { kind: "lifestyleLink"; isNew: boolean; item: EmotionLifestyleLink | null }
  | { kind: "environmentCue"; isNew: boolean; item: EmotionEnvironmentCue | null }
  | { kind: "relationshipCue"; isNew: boolean; item: EmotionRelationshipCue | null }
  | { kind: "recoveryNote"; isNew: boolean; item: EmotionRecoveryNote | null }

export type EmotionTextListKey = "minimalRecoverySteps" | "ineffectiveActions"

type FormState = Record<string, string>

const NONE_VALUE = "__none__"

const EMOTION_STATES = [
  "平静",
  "回稳",
  "低压焦虑",
  "易怒",
  "麻木",
  "空",
  "委屈",
  "难过",
  "高压后空掉",
  "松弛",
  "期待",
] satisfies EmotionState[]

const EMOTION_TAGS = [
  "难过",
  "焦虑",
  "空",
  "平静",
  "委屈",
  "愤怒",
  "松弛",
  "期待",
  "羞愧",
  "恐惧",
  "孤独",
  "兴奋",
] satisfies EmotionEmotionTag[]

const EMOTION_IMPULSES = [
  "逃避",
  "倾诉",
  "睡觉",
  "吃东西",
  "出门",
  "沉默",
  "运动",
  "刷手机",
] satisfies EmotionImpulse[]

const TRIGGER_CATEGORIES = [
  "工作",
  "家庭",
  "亲密关系",
  "金钱",
  "睡眠",
  "社交",
  "自我否定",
  "环境",
] satisfies EmotionTriggerCategory[]

const TOOL_KINDS = ["有效", "无效", "极简三步", "可联系"] satisfies EmotionSupportToolKind[]

const SEGMENT_TRENDS = [
  "持续恶化",
  "逐渐恢复",
  "起伏波动",
  "平稳",
] satisfies EmotionTimelineSegment["trend"][]

const LIFESTYLE_FACTORS = [
  "睡眠",
  "饮食",
  "运动",
  "经期",
  "饮酒",
  "屏幕时长",
  "通勤",
  "独处",
] satisfies EmotionLifestyleLink["factor"][]

const LINK_DIRECTIONS = ["正相关", "负相关", "混合"] satisfies EmotionLifestyleLink["direction"][]

function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function splitList(value: string) {
  return value
    .split(/[\n,，]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
}

function listToText(values: string[] | undefined) {
  return (values ?? []).join("\n")
}

function normalizeSelectValue(value: string) {
  return value === NONE_VALUE ? "" : value
}

function cloneEmotion(emotion: EmotionModuleData): EmotionModuleData {
  return {
    ...emotion,
    checkIns: [...emotion.checkIns],
    trend: [...emotion.trend],
    triggers: [...emotion.triggers],
    tools: [...emotion.tools],
    overview: {
      ...emotion.overview,
      topEmotionTags: [...emotion.overview.topEmotionTags],
    },
    timelineSegments: [...emotion.timelineSegments],
    loopPatterns: [...emotion.loopPatterns],
    lifestyleLinks: [...emotion.lifestyleLinks],
    environmentCues: [...emotion.environmentCues],
    relationshipCues: [...emotion.relationshipCues],
    recoveryNotes: [...emotion.recoveryNotes],
    ineffectiveActions: [...emotion.ineffectiveActions],
    minimalRecoverySteps: [...emotion.minimalRecoverySteps],
  }
}

function upsertById<T extends { id: string }>(items: T[], item: T, isNew: boolean) {
  if (isNew) {
    return [item, ...items]
  }

  return items.map((entry) => (entry.id === item.id ? item : entry))
}

function removeById<T extends { id: string }>(items: T[], id: string) {
  return items.filter((entry) => entry.id !== id)
}

function getTargetTitle(target: EmotionEntityEditorTarget) {
  const action = target.isNew ? "create" : "edit"
  return `emotion.editor.${target.kind}.${action}Title`
}

function getTargetFallbackTitle(target: EmotionEntityEditorTarget) {
  const prefix = target.isNew ? "Add" : "Edit"

  switch (target.kind) {
    case "checkIn":
      return `${prefix} Emotion Entry`
    case "trendPoint":
      return `${prefix} Trend Point`
    case "trigger":
      return `${prefix} Trigger`
    case "tool":
      return `${prefix} Recovery Tool`
    case "timelineSegment":
      return `${prefix} Period Segment`
    case "loopPattern":
      return `${prefix} Loop Pattern`
    case "lifestyleLink":
      return `${prefix} Lifestyle Link`
    case "environmentCue":
      return `${prefix} Environment Cue`
    case "relationshipCue":
      return `${prefix} Relationship Cue`
    case "recoveryNote":
      return `${prefix} Recovery Note`
  }
}

function createInitialForm(target: EmotionEntityEditorTarget): FormState {
  switch (target.kind) {
    case "checkIn":
      return {
        date: target.item?.date ?? "",
        summary: target.item?.summary ?? "",
        state: target.item?.state ?? "平静",
        intensity: target.item?.intensity ?? "5/10",
        bodySignal: target.item?.bodySignal ?? "",
        tags: listToText(target.item?.tags),
        emotionTags: listToText(target.item?.emotionTags),
        triggerEvent: target.item?.triggerEvent ?? "",
        impulse: target.item?.impulse ?? "",
        needRightNow: target.item?.needRightNow ?? "",
      }
    case "trendPoint":
      return {
        label: target.item?.label ?? "",
        score: String(target.item?.score ?? 5),
        note: target.item?.note ?? "",
        primaryState: target.item?.primaryState ?? "",
      }
    case "trigger":
      return {
        title: target.item?.title ?? "",
        summary: target.item?.summary ?? "",
        cues: listToText(target.item?.cues),
        category: target.item?.category ?? "",
        recentExamples: listToText(target.item?.recentExamples),
      }
    case "tool":
      return {
        title: target.item?.title ?? "",
        description: target.item?.description ?? "",
        when: target.item?.when ?? "",
        kind: target.item?.kind ?? "有效",
        contactScript: target.item?.contactScript ?? "",
      }
    case "timelineSegment":
      return {
        range: target.item?.range ?? "",
        trend: target.item?.trend ?? "平稳",
        summary: target.item?.summary ?? "",
      }
    case "loopPattern":
      return {
        title: target.item?.title ?? "",
        description: target.item?.description ?? "",
        frequency: target.item?.frequency ?? "",
      }
    case "lifestyleLink":
      return {
        factor: target.item?.factor ?? "睡眠",
        observation: target.item?.observation ?? "",
        direction: target.item?.direction ?? "混合",
      }
    case "environmentCue":
      return {
        context: target.item?.context ?? "",
        description: target.item?.description ?? "",
      }
    case "relationshipCue":
      return {
        who: target.item?.who ?? "",
        pattern: target.item?.pattern ?? "",
      }
    case "recoveryNote":
      return {
        date: target.item?.date ?? "",
        what: target.item?.what ?? "",
        effect: target.item?.effect ?? "",
      }
  }
}

function getRequiredField(target: EmotionEntityEditorTarget, form: FormState) {
  switch (target.kind) {
    case "checkIn":
      return form.date.trim() && form.summary.trim() && form.bodySignal.trim()
    case "trendPoint":
      return form.label.trim() && form.note.trim()
    case "trigger":
      return form.title.trim() && form.summary.trim()
    case "tool":
      return form.title.trim() && form.description.trim() && form.when.trim()
    case "timelineSegment":
      return form.range.trim() && form.summary.trim()
    case "loopPattern":
      return form.title.trim() && form.description.trim()
    case "lifestyleLink":
      return form.observation.trim()
    case "environmentCue":
      return form.context.trim() && form.description.trim()
    case "relationshipCue":
      return form.who.trim() && form.pattern.trim()
    case "recoveryNote":
      return form.date.trim() && form.what.trim() && form.effect.trim()
  }
}

function buildNextEmotion(
  emotion: EmotionModuleData,
  target: EmotionEntityEditorTarget,
  form: FormState,
) {
  const nextEmotion = cloneEmotion(emotion)

  switch (target.kind) {
    case "checkIn": {
      const item: EmotionCheckIn = {
        id: target.item?.id ?? createId("emotion-checkin"),
        date: form.date.trim(),
        summary: form.summary.trim(),
        state: form.state as EmotionState,
        intensity: form.intensity.trim(),
        bodySignal: form.bodySignal.trim(),
        tags: splitList(form.tags),
        emotionTags: splitList(form.emotionTags) as EmotionEmotionTag[],
        triggerEvent: form.triggerEvent.trim() || undefined,
        impulse: (form.impulse || undefined) as EmotionImpulse | undefined,
        needRightNow: form.needRightNow.trim() || undefined,
      }
      nextEmotion.checkIns = upsertById(nextEmotion.checkIns, item, target.isNew)
      return nextEmotion
    }
    case "trendPoint": {
      const score = Math.max(0, Math.min(10, Number(form.score) || 0))
      const item: EmotionTrendPoint = {
        id: target.item?.id ?? createId("emotion-trend"),
        label: form.label.trim(),
        score,
        note: form.note.trim(),
        primaryState: (form.primaryState || undefined) as EmotionState | undefined,
      }
      nextEmotion.trend = upsertById(nextEmotion.trend, item, target.isNew)
      return nextEmotion
    }
    case "trigger": {
      const item: EmotionTriggerGroup = {
        id: target.item?.id ?? createId("emotion-trigger"),
        title: form.title.trim(),
        summary: form.summary.trim(),
        cues: splitList(form.cues),
        category: (form.category || undefined) as EmotionTriggerCategory | undefined,
        recentExamples: splitList(form.recentExamples),
      }
      nextEmotion.triggers = upsertById(nextEmotion.triggers, item, target.isNew)
      return nextEmotion
    }
    case "tool": {
      const item: EmotionSupportTool = {
        id: target.item?.id ?? createId("emotion-tool"),
        title: form.title.trim(),
        description: form.description.trim(),
        when: form.when.trim(),
        kind: (form.kind || undefined) as EmotionSupportToolKind | undefined,
        contactScript: form.contactScript.trim() || undefined,
      }
      nextEmotion.tools = upsertById(nextEmotion.tools, item, target.isNew)
      return nextEmotion
    }
    case "timelineSegment": {
      const item: EmotionTimelineSegment = {
        id: target.item?.id ?? createId("emotion-segment"),
        range: form.range.trim(),
        trend: form.trend as EmotionTimelineSegment["trend"],
        summary: form.summary.trim(),
      }
      nextEmotion.timelineSegments = upsertById(nextEmotion.timelineSegments, item, target.isNew)
      return nextEmotion
    }
    case "loopPattern": {
      const item: EmotionLoopPattern = {
        id: target.item?.id ?? createId("emotion-loop"),
        title: form.title.trim(),
        description: form.description.trim(),
        frequency: form.frequency.trim(),
      }
      nextEmotion.loopPatterns = upsertById(nextEmotion.loopPatterns, item, target.isNew)
      return nextEmotion
    }
    case "lifestyleLink": {
      const item: EmotionLifestyleLink = {
        id: target.item?.id ?? createId("emotion-life"),
        factor: form.factor as EmotionLifestyleLink["factor"],
        observation: form.observation.trim(),
        direction: form.direction as EmotionLifestyleLink["direction"],
      }
      nextEmotion.lifestyleLinks = upsertById(nextEmotion.lifestyleLinks, item, target.isNew)
      return nextEmotion
    }
    case "environmentCue": {
      const item: EmotionEnvironmentCue = {
        id: target.item?.id ?? createId("emotion-env"),
        context: form.context.trim(),
        description: form.description.trim(),
      }
      nextEmotion.environmentCues = upsertById(nextEmotion.environmentCues, item, target.isNew)
      return nextEmotion
    }
    case "relationshipCue": {
      const item: EmotionRelationshipCue = {
        id: target.item?.id ?? createId("emotion-rel"),
        who: form.who.trim(),
        pattern: form.pattern.trim(),
      }
      nextEmotion.relationshipCues = upsertById(nextEmotion.relationshipCues, item, target.isNew)
      return nextEmotion
    }
    case "recoveryNote": {
      const item: EmotionRecoveryNote = {
        id: target.item?.id ?? createId("emotion-recovery"),
        date: form.date.trim(),
        what: form.what.trim(),
        effect: form.effect.trim(),
      }
      nextEmotion.recoveryNotes = upsertById(nextEmotion.recoveryNotes, item, target.isNew)
      return nextEmotion
    }
  }
}

function removeEntity(emotion: EmotionModuleData, target: EmotionEntityEditorTarget) {
  const nextEmotion = cloneEmotion(emotion)
  const id = target.item?.id

  if (!id) return nextEmotion

  switch (target.kind) {
    case "checkIn":
      nextEmotion.checkIns = removeById(nextEmotion.checkIns, id)
      break
    case "trendPoint":
      nextEmotion.trend = removeById(nextEmotion.trend, id)
      break
    case "trigger":
      nextEmotion.triggers = removeById(nextEmotion.triggers, id)
      break
    case "tool":
      nextEmotion.tools = removeById(nextEmotion.tools, id)
      break
    case "timelineSegment":
      nextEmotion.timelineSegments = removeById(nextEmotion.timelineSegments, id)
      break
    case "loopPattern":
      nextEmotion.loopPatterns = removeById(nextEmotion.loopPatterns, id)
      break
    case "lifestyleLink":
      nextEmotion.lifestyleLinks = removeById(nextEmotion.lifestyleLinks, id)
      break
    case "environmentCue":
      nextEmotion.environmentCues = removeById(nextEmotion.environmentCues, id)
      break
    case "relationshipCue":
      nextEmotion.relationshipCues = removeById(nextEmotion.relationshipCues, id)
      break
    case "recoveryNote":
      nextEmotion.recoveryNotes = removeById(nextEmotion.recoveryNotes, id)
      break
  }

  return nextEmotion
}

export function EmotionEntityEditDialog({
  editing,
  emotion,
  onClose,
}: {
  editing: EmotionEntityEditorTarget
  emotion: EmotionModuleData
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveEmotionMutation = useSaveEmotionMutation()
  const [form, setForm] = useState<FormState>(() => createInitialForm(editing))

  const updateForm = (patch: FormState) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!getRequiredField(editing, form)) {
      toast.error(t("emotion.editor.validation.required", "请补全必填内容"))
      return
    }

    try {
      await saveEmotionMutation.mutateAsync(buildNextEmotion(emotion, editing, form))
      toast.success(t("emotion.toast.saved", "情绪数据已保存"))
      onClose()
    } catch (error) {
      toast.error(String(error))
    }
  }

  const handleDelete = async () => {
    if (editing.isNew || !editing.item) return

    const confirmed =
      typeof window === "undefined" ||
      window.confirm(t("emotion.editor.confirmDelete", "确定删除这条情绪数据吗？"))

    if (!confirmed) return

    try {
      await saveEmotionMutation.mutateAsync(removeEntity(emotion, editing))
      toast.success(t("emotion.toast.deleted", "情绪数据已删除"))
      onClose()
    } catch (error) {
      toast.error(String(error))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[min(820px,calc(100dvh-2rem))] max-w-3xl grid-rows-none flex-col gap-0 overflow-hidden border border-[color:var(--surface-border)] bg-[color:var(--dialog-bg)] p-0">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="shrink-0 border-b border-[color:var(--surface-border)] px-5 py-4 pr-12">
            <DialogTitle>{t(getTargetTitle(editing), getTargetFallbackTitle(editing))}</DialogTitle>
            <DialogDescription>
              {t(
                "emotion.editor.description",
                "这些内容会保存到后端情绪数据，不再依赖页面内的临时模拟内容。",
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
            <EntityFields target={editing} form={form} onChange={updateForm} />
          </div>

          <DialogFooter className="shrink-0 border-[color:var(--surface-border)] bg-[color:var(--dialog-bg)]">
            {!editing.isNew ? (
              <Button type="button" variant="destructive" onClick={handleDelete}>
                <Trash2 className="size-4" />
                {t("emotion.editor.delete", "删除")}
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onClose}>
              {t("emotion.editor.cancel", "取消")}
            </Button>
            <Button type="submit" disabled={saveEmotionMutation.isPending}>
              {t("emotion.editor.save", "保存")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function EntityFields({
  form,
  onChange,
  target,
}: {
  form: FormState
  onChange: (patch: FormState) => void
  target: EmotionEntityEditorTarget
}) {
  const { t } = useTranslation()

  switch (target.kind) {
    case "checkIn":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("emotion.editor.fields.date", "时间")}
            value={form.date}
            onChange={(date) => onChange({ date })}
            placeholder="06-03 08:20"
          />
          <SelectField
            label={t("emotion.editor.fields.state", "总体状态")}
            value={form.state}
            options={EMOTION_STATES}
            enumGroup="state"
            onChange={(state) => onChange({ state })}
          />
          <TextField
            className="sm:col-span-2"
            label={t("emotion.editor.fields.summary", "此刻发生了什么")}
            value={form.summary}
            onChange={(summary) => onChange({ summary })}
            multiline
          />
          <TextField
            label={t("emotion.editor.fields.intensity", "强度")}
            value={form.intensity}
            onChange={(intensity) => onChange({ intensity })}
            placeholder="6/10"
          />
          <SelectField
            label={t("emotion.editor.fields.impulse", "此刻冲动")}
            value={form.impulse || NONE_VALUE}
            options={EMOTION_IMPULSES}
            enumGroup="impulse"
            includeNone
            onChange={(impulse) => onChange({ impulse: normalizeSelectValue(impulse) })}
          />
          <TextField
            className="sm:col-span-2"
            label={t("emotion.editor.fields.bodySignal", "身体感觉")}
            value={form.bodySignal}
            onChange={(bodySignal) => onChange({ bodySignal })}
          />
          <ChipToggleField
            className="sm:col-span-2"
            label={t("emotion.editor.fields.emotionTags", "情绪标签")}
            values={EMOTION_TAGS}
            selectedText={form.emotionTags}
            enumGroup="emotionTag"
            onChange={(emotionTags) => onChange({ emotionTags })}
          />
          <TextField
            className="sm:col-span-2"
            label={t("emotion.editor.fields.tags", "上下文标签")}
            value={form.tags}
            onChange={(tags) => onChange({ tags })}
            multiline
            placeholder={t("emotion.editor.placeholders.list", "一行一个，或用逗号分隔")}
          />
          <TextField
            className="sm:col-span-2"
            label={t("emotion.editor.fields.triggerEvent", "触发事件")}
            value={form.triggerEvent}
            onChange={(triggerEvent) => onChange({ triggerEvent })}
            multiline
          />
          <TextField
            className="sm:col-span-2"
            label={t("emotion.editor.fields.needRightNow", "现在最需要")}
            value={form.needRightNow}
            onChange={(needRightNow) => onChange({ needRightNow })}
            multiline
          />
        </div>
      )
    case "trendPoint":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("emotion.editor.fields.label", "标签")}
            value={form.label}
            onChange={(label) => onChange({ label })}
            placeholder="06-03"
          />
          <TextField
            label={t("emotion.editor.fields.score", "强度分")}
            value={form.score}
            onChange={(score) => onChange({ score })}
            type="number"
            min={0}
            max={10}
          />
          <SelectField
            label={t("emotion.editor.fields.primaryState", "主要状态")}
            value={form.primaryState || NONE_VALUE}
            options={EMOTION_STATES}
            enumGroup="state"
            includeNone
            onChange={(primaryState) =>
              onChange({ primaryState: normalizeSelectValue(primaryState) })
            }
          />
          <TextField
            className="sm:col-span-2"
            label={t("emotion.editor.fields.note", "备注")}
            value={form.note}
            onChange={(note) => onChange({ note })}
            multiline
          />
        </div>
      )
    case "trigger":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("emotion.editor.fields.title", "标题")}
            value={form.title}
            onChange={(title) => onChange({ title })}
          />
          <SelectField
            label={t("emotion.editor.fields.category", "分类")}
            value={form.category || NONE_VALUE}
            options={TRIGGER_CATEGORIES}
            enumGroup="triggerCategory"
            includeNone
            onChange={(category) => onChange({ category: normalizeSelectValue(category) })}
          />
          <TextField
            className="sm:col-span-2"
            label={t("emotion.editor.fields.summary", "说明")}
            value={form.summary}
            onChange={(summary) => onChange({ summary })}
            multiline
          />
          <TextField
            className="sm:col-span-2"
            label={t("emotion.editor.fields.cues", "线索")}
            value={form.cues}
            onChange={(cues) => onChange({ cues })}
            multiline
            placeholder={t("emotion.editor.placeholders.list", "一行一个，或用逗号分隔")}
          />
          <TextField
            className="sm:col-span-2"
            label={t("emotion.editor.fields.recentExamples", "近期例子")}
            value={form.recentExamples}
            onChange={(recentExamples) => onChange({ recentExamples })}
            multiline
            placeholder={t("emotion.editor.placeholders.list", "一行一个，或用逗号分隔")}
          />
        </div>
      )
    case "tool":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("emotion.editor.fields.title", "标题")}
            value={form.title}
            onChange={(title) => onChange({ title })}
          />
          <SelectField
            label={t("emotion.editor.fields.kind", "类型")}
            value={form.kind || NONE_VALUE}
            options={TOOL_KINDS}
            enumGroup="toolKind"
            includeNone
            onChange={(kind) => onChange({ kind: normalizeSelectValue(kind) })}
          />
          <TextField
            className="sm:col-span-2"
            label={t("emotion.editor.fields.description", "说明")}
            value={form.description}
            onChange={(description) => onChange({ description })}
            multiline
          />
          <TextField
            className="sm:col-span-2"
            label={t("emotion.editor.fields.when", "适用时机")}
            value={form.when}
            onChange={(when) => onChange({ when })}
            multiline
          />
          <TextField
            className="sm:col-span-2"
            label={t("emotion.editor.fields.contactScript", "可直接说的话")}
            value={form.contactScript}
            onChange={(contactScript) => onChange({ contactScript })}
            multiline
          />
        </div>
      )
    case "timelineSegment":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("emotion.editor.fields.range", "时间段")}
            value={form.range}
            onChange={(range) => onChange({ range })}
          />
          <SelectField
            label={t("emotion.editor.fields.trend", "趋势")}
            value={form.trend}
            options={SEGMENT_TRENDS}
            enumGroup="segmentTrend"
            onChange={(trend) => onChange({ trend })}
          />
          <TextField
            className="sm:col-span-2"
            label={t("emotion.editor.fields.summary", "总结")}
            value={form.summary}
            onChange={(summary) => onChange({ summary })}
            multiline
          />
        </div>
      )
    case "loopPattern":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("emotion.editor.fields.title", "标题")}
            value={form.title}
            onChange={(title) => onChange({ title })}
          />
          <TextField
            label={t("emotion.editor.fields.frequency", "频率")}
            value={form.frequency}
            onChange={(frequency) => onChange({ frequency })}
          />
          <TextField
            className="sm:col-span-2"
            label={t("emotion.editor.fields.description", "说明")}
            value={form.description}
            onChange={(description) => onChange({ description })}
            multiline
          />
        </div>
      )
    case "lifestyleLink":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField
            label={t("emotion.editor.fields.factor", "因素")}
            value={form.factor}
            options={LIFESTYLE_FACTORS}
            enumGroup="lifestyleFactor"
            onChange={(factor) => onChange({ factor })}
          />
          <SelectField
            label={t("emotion.editor.fields.direction", "方向")}
            value={form.direction}
            options={LINK_DIRECTIONS}
            enumGroup="linkDirection"
            onChange={(direction) => onChange({ direction })}
          />
          <TextField
            className="sm:col-span-2"
            label={t("emotion.editor.fields.observation", "观察")}
            value={form.observation}
            onChange={(observation) => onChange({ observation })}
            multiline
          />
        </div>
      )
    case "environmentCue":
      return (
        <div className="grid gap-4">
          <TextField
            label={t("emotion.editor.fields.context", "环境")}
            value={form.context}
            onChange={(context) => onChange({ context })}
          />
          <TextField
            label={t("emotion.editor.fields.description", "说明")}
            value={form.description}
            onChange={(description) => onChange({ description })}
            multiline
          />
        </div>
      )
    case "relationshipCue":
      return (
        <div className="grid gap-4">
          <TextField
            label={t("emotion.editor.fields.who", "对象")}
            value={form.who}
            onChange={(who) => onChange({ who })}
          />
          <TextField
            label={t("emotion.editor.fields.pattern", "模式")}
            value={form.pattern}
            onChange={(pattern) => onChange({ pattern })}
            multiline
          />
        </div>
      )
    case "recoveryNote":
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField
            label={t("emotion.editor.fields.date", "日期")}
            value={form.date}
            onChange={(date) => onChange({ date })}
          />
          <TextField
            label={t("emotion.editor.fields.what", "做了什么")}
            value={form.what}
            onChange={(what) => onChange({ what })}
          />
          <TextField
            className="sm:col-span-2"
            label={t("emotion.editor.fields.effect", "效果")}
            value={form.effect}
            onChange={(effect) => onChange({ effect })}
            multiline
          />
        </div>
      )
  }
}

export function EmotionOverviewEditDialog({
  emotion,
  onClose,
}: {
  emotion: EmotionModuleData
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveEmotionMutation = useSaveEmotionMutation()
  const [form, setForm] = useState({
    windowLabel: emotion.overview.windowLabel,
    averageScore: String(emotion.overview.averageScore),
    bestWindow: emotion.overview.bestWindow,
    worstWindow: emotion.overview.worstWindow,
    conclusion: emotion.overview.conclusion,
    topEmotionTags: emotion.overview.topEmotionTags
      .map((entry) => `${entry.tag},${entry.count}`)
      .join("\n"),
  })

  const updateForm = (patch: Partial<typeof form>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!form.windowLabel.trim() || !form.conclusion.trim()) {
      toast.error(t("emotion.editor.validation.required", "请补全必填内容"))
      return
    }

    const overview: EmotionOverviewSummary = {
      windowLabel: form.windowLabel.trim(),
      averageScore: Math.max(0, Math.min(10, Number(form.averageScore) || 0)),
      bestWindow: form.bestWindow.trim(),
      worstWindow: form.worstWindow.trim(),
      conclusion: form.conclusion.trim(),
      topEmotionTags: form.topEmotionTags
        .split("\n")
        .map((row) => {
          const [tag, count] = row.split(/[,，]/).map((entry) => entry.trim())
          return {
            tag: tag as EmotionEmotionTag,
            count: Math.max(1, Number(count) || 1),
          }
        })
        .filter((entry) => entry.tag),
    }

    try {
      await saveEmotionMutation.mutateAsync({
        ...cloneEmotion(emotion),
        overview,
      })
      toast.success(t("emotion.toast.saved", "情绪数据已保存"))
      onClose()
    } catch (error) {
      toast.error(String(error))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[min(760px,calc(100dvh-2rem))] max-w-2xl grid-rows-none flex-col gap-0 overflow-hidden border border-[color:var(--surface-border)] bg-[color:var(--dialog-bg)] p-0">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="shrink-0 border-b border-[color:var(--surface-border)] px-5 py-4 pr-12">
            <DialogTitle>{t("emotion.editor.overview.title", "编辑情绪总览")}</DialogTitle>
            <DialogDescription>
              {t("emotion.editor.overview.description", "维护最近窗口、强度和一句话总结。")}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                label={t("emotion.editor.fields.windowLabel", "观察窗口")}
                value={form.windowLabel}
                onChange={(windowLabel) => updateForm({ windowLabel })}
              />
              <TextField
                label={t("emotion.editor.fields.averageScore", "平均强度")}
                value={form.averageScore}
                onChange={(averageScore) => updateForm({ averageScore })}
                type="number"
                min={0}
                max={10}
              />
              <TextField
                label={t("emotion.editor.fields.bestWindow", "较好时段")}
                value={form.bestWindow}
                onChange={(bestWindow) => updateForm({ bestWindow })}
              />
              <TextField
                label={t("emotion.editor.fields.worstWindow", "较差时段")}
                value={form.worstWindow}
                onChange={(worstWindow) => updateForm({ worstWindow })}
              />
            </div>
            <TextField
              label={t("emotion.editor.fields.topEmotionTags", "高频情绪标签")}
              value={form.topEmotionTags}
              onChange={(topEmotionTags) => updateForm({ topEmotionTags })}
              multiline
              placeholder={t("emotion.editor.overview.tagsPlaceholder", "焦虑,4")}
            />
            <TextField
              label={t("emotion.editor.fields.conclusion", "一句话总结")}
              value={form.conclusion}
              onChange={(conclusion) => updateForm({ conclusion })}
              multiline
            />
          </div>
          <DialogFooter className="shrink-0 border-[color:var(--surface-border)] bg-[color:var(--dialog-bg)]">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("emotion.editor.cancel", "取消")}
            </Button>
            <Button type="submit" disabled={saveEmotionMutation.isPending}>
              {t("emotion.editor.save", "保存")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function EmotionTextListEditDialog({
  emotion,
  listKey,
  onClose,
}: {
  emotion: EmotionModuleData
  listKey: EmotionTextListKey
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveEmotionMutation = useSaveEmotionMutation()
  const [value, setValue] = useState(listToText(emotion[listKey]))
  const title =
    listKey === "minimalRecoverySteps"
      ? t("emotion.editor.textList.minimalRecoverySteps", "编辑极简恢复步骤")
      : t("emotion.editor.textList.ineffectiveActions", "编辑无效动作提醒")

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    try {
      await saveEmotionMutation.mutateAsync({
        ...cloneEmotion(emotion),
        [listKey]: splitList(value),
      })
      toast.success(t("emotion.toast.saved", "情绪数据已保存"))
      onClose()
    } catch (error) {
      toast.error(String(error))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="flex max-h-[min(640px,calc(100dvh-2rem))] max-w-xl grid-rows-none flex-col gap-0 overflow-hidden border border-[color:var(--surface-border)] bg-[color:var(--dialog-bg)] p-0">
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="shrink-0 border-b border-[color:var(--surface-border)] px-5 py-4 pr-12">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>
              {t("emotion.editor.textList.description", "一行一条，保存后会写回后端。")}
            </DialogDescription>
          </DialogHeader>
          <div className="min-h-0 flex-1 px-5 py-4">
            <Textarea
              value={value}
              onChange={(event) => setValue(event.target.value)}
              className="min-h-[260px] border-[color:var(--chip-border)] bg-[color:var(--surface-bg)]"
              placeholder={t("emotion.editor.placeholders.list", "一行一个，或用逗号分隔")}
            />
          </div>
          <DialogFooter className="shrink-0 border-[color:var(--surface-border)] bg-[color:var(--dialog-bg)]">
            <Button type="button" variant="outline" onClick={onClose}>
              {t("emotion.editor.cancel", "取消")}
            </Button>
            <Button type="submit" disabled={saveEmotionMutation.isPending}>
              {t("emotion.editor.save", "保存")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function FieldShell({
  children,
  className,
  label,
}: {
  children: ReactNode
  className?: string
  label: string
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-[color:var(--text-secondary)]">{label}</Label>
      {children}
    </div>
  )
}

function TextField({
  className,
  label,
  multiline = false,
  onChange,
  value,
  ...inputProps
}: {
  className?: string
  label: string
  multiline?: boolean
  onChange: (value: string) => void
  value: string
} & Omit<ComponentProps<typeof Input>, "onChange" | "value">) {
  return (
    <FieldShell className={className} label={label}>
      {multiline ? (
        <Textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-24 border-[color:var(--chip-border)] bg-[color:var(--surface-bg)]"
          {...(inputProps as ComponentProps<typeof Textarea>)}
        />
      ) : (
        <Input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)]"
          {...inputProps}
        />
      )}
    </FieldShell>
  )
}

function SelectField<T extends string>({
  className,
  enumGroup,
  includeNone = false,
  label,
  onChange,
  options,
  value,
}: {
  className?: string
  enumGroup: string
  includeNone?: boolean
  label: string
  onChange: (value: string) => void
  options: readonly T[]
  value: string
}) {
  const { t } = useTranslation()

  return (
    <FieldShell className={className} label={label}>
      <Select
        value={value}
        onValueChange={(nextValue) => nextValue !== null && onChange(nextValue)}
      >
        <SelectTrigger className="w-full border-[color:var(--chip-border)] bg-[color:var(--surface-bg)]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {includeNone ? (
            <SelectItem value={NONE_VALUE}>{t("emotion.editor.none", "不设置")}</SelectItem>
          ) : null}
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {translateEmotionEnum(t, enumGroup, option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  )
}

function ChipToggleField<T extends string>({
  className,
  enumGroup,
  label,
  onChange,
  selectedText,
  values,
}: {
  className?: string
  enumGroup: string
  label: string
  onChange: (value: string) => void
  selectedText: string
  values: readonly T[]
}) {
  const { t } = useTranslation()
  const selected = splitList(selectedText)

  const toggle = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter((entry) => entry !== value)
      : [...selected, value]

    onChange(next.join("\n"))
  }

  return (
    <FieldShell className={className} label={label}>
      <div className="flex flex-wrap gap-1.5">
        {values.map((value) => {
          const isSelected = selected.includes(value)

          return (
            <button
              key={value}
              type="button"
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                isSelected
                  ? "border-[color:var(--emotion-accent-border)] bg-[color:var(--emotion-accent-bg)] text-[color:var(--emotion-accent-ink)]"
                  : "border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]",
              )}
              onClick={() => toggle(value)}
            >
              {translateEmotionEnum(t, enumGroup, value)}
            </button>
          )
        })}
      </div>
    </FieldShell>
  )
}
