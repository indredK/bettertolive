import { ChevronDown, Plus, Trash2 } from "lucide-react"
import type { FormEvent, ReactNode } from "react"
import { useMemo, useState } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useSaveRelationshipsMutation } from "@/features/bettertolive/queries/use-save-relationships-mutation"
import type {
  InteractionFrequency,
  RelationshipChange,
  RelationshipConnection,
  RelationshipDepth,
  RelationshipEvent,
  RelationshipImpact,
  RelationshipMap,
  RelationshipPattern,
  RelationshipPerson,
  RelationshipStage,
  RelationshipType,
  RelationshipUnsentNote,
  UnfinishedWeight,
  UnsentNoteTargetType,
} from "@/features/bettertolive/types"
import {
  buildRelationshipConnectionPerspectives,
  createRelationshipScopedId,
  getRelationshipsFromCircles,
  mergeConnectionsForRelationship,
  syncUnsentLineRefs,
  type RelationshipConnectionPerspective,
  type RelationshipConnectionPerspectiveRole,
} from "@/features/bettertolive/models/relationship-connections"
import {
  INTERACTION_FREQUENCIES,
  RELATIONSHIP_CONNECTION_STRENGTH_OPTIONS,
  RELATIONSHIP_CHANGE_FIELDS,
  RELATIONSHIP_DEPTHS,
  RELATIONSHIP_DIALOG_COMPACT_SECTION_CLASS,
  RELATIONSHIP_DIALOG_CONTENT_CLASS,
  RELATIONSHIP_DIALOG_FIELD_CLASS,
  RELATIONSHIP_DIALOG_FOOTER_CLASS,
  RELATIONSHIP_DIALOG_HEADER_CLASS,
  RELATIONSHIP_DIALOG_SECTION_CLASS,
  RELATIONSHIP_SELECT_CONTENT_CLASS,
  RELATIONSHIP_EVENT_KINDS,
  RELATIONSHIP_IMPACTS,
  RELATIONSHIP_STAGES,
  RELATIONSHIP_TYPES,
  UNFINISHED_WEIGHTS,
  UNSENT_NOTE_TARGET_TYPES,
  createRelationshipId,
  joinListText,
  splitListText,
  translateRelationshipEnum,
  type RelationshipEnumGroup,
} from "@/features/bettertolive/ui/relationships/relationships-page-data"
import { cn } from "@/lib/utils"

export type EditingRelationship = {
  isNew: boolean
  circleId: string
  relationship: RelationshipPerson | null
}

export type EditingUnsentNote = {
  isNew: boolean
  note: RelationshipUnsentNote | null
}

export type EditingRelationshipPattern = {
  isNew: boolean
  pattern: RelationshipPattern | null
}

type RelationshipFormState = {
  circleId: string
  connections: RelationshipConnectionPerspective[]
  name: string
  id: string
  role: string
  type: RelationshipType
  depth: RelationshipDepth
  stage: RelationshipStage
  impact: RelationshipImpact
  interaction: InteractionFrequency
  unfinishedWeight: UnfinishedWeight
  influence: string
  currentState: string
  emotionalTone: string
  unspokenLine: string
  positiveImpact: string
  ongoingShadow: string
  boundaryStatus: string
  emotionCuesText: string
  tagsText: string
  events: RelationshipEvent[]
  history: RelationshipChange[]
}

type UnsentNoteFormState = {
  targetType: UnsentNoteTargetType
  relationshipId: string
  to: string
  theme: string
  excerpt: string
  unfinishedWeight: UnfinishedWeight
}

type PatternFormState = {
  title: string
  summary: string
  cuesText: string
}

const NONE_RELATIONSHIP_ID = "__none__"

export function RelationshipEditDialog({
  editing,
  relationshipsModule,
  onClose,
  onSaved,
}: {
  editing: EditingRelationship
  relationshipsModule: RelationshipMap
  onClose: () => void
  onSaved?: () => void
}) {
  const { t } = useTranslation()
  const saveRelationshipsMutation = useSaveRelationshipsMutation()
  const relationships = useMemo(
    () => getRelationshipsFromCircles(relationshipsModule.circles),
    [relationshipsModule.circles],
  )
  const [form, setForm] = useState<RelationshipFormState>(() =>
    createInitialRelationshipForm(editing, relationshipsModule),
  )

  const updateForm = (patch: Partial<RelationshipFormState>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!form.name.trim() || !form.role.trim()) {
      toast.error(t("relationships.edit.validation.relationshipRequired", "请填写姓名和角色"))
      return
    }

    const nextRelationship = relationshipFromForm({
      existingRelationship: editing.relationship,
      form,
      relationshipsModule,
    })
    const nextModule = upsertRelationship(
      relationshipsModule,
      form.circleId,
      nextRelationship,
      form.connections,
    )

    try {
      await saveRelationshipsMutation.mutateAsync(nextModule)
      toast.success(t("relationships.edit.saved", "关系已保存"))
      onSaved?.()
      onClose()
    } catch {
      toast.error(t("relationships.edit.saveFailed", "关系保存失败"))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent
        className={cn(
          RELATIONSHIP_DIALOG_CONTENT_CLASS,
          "flex max-h-[min(760px,calc(100dvh-2rem))] flex-col overflow-hidden sm:max-w-[min(1120px,calc(100vw-3rem))]",
        )}
      >
        <DialogHeader className={RELATIONSHIP_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew
              ? t("relationships.edit.createRelationship", "新增关系")
              : t("relationships.edit.editRelationship", "编辑关系")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "relationships.edit.relationshipDescription",
              "5 维用于归类关系世界，未完成重量只跟随单段关系和想说的话。",
            )}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="grid min-h-0 flex-1 gap-3 overflow-hidden px-1 py-1 pr-2 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
            <div className="min-h-0 space-y-3 overflow-y-auto">
              <section className={RELATIONSHIP_DIALOG_COMPACT_SECTION_CLASS}>
                <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px]">
                  <Field compact label={t("relationships.edit.name", "姓名")}>
                    <Input
                      value={form.name}
                      onChange={(event) => updateForm({ name: event.target.value })}
                      className={RELATIONSHIP_DIALOG_FIELD_CLASS}
                    />
                  </Field>
                  <Field compact label={t("relationships.edit.role", "角色")}>
                    <Input
                      value={form.role}
                      onChange={(event) => updateForm({ role: event.target.value })}
                      className={RELATIONSHIP_DIALOG_FIELD_CLASS}
                    />
                  </Field>
                  <Field compact label={t("relationships.edit.circle", "圈层")}>
                    <Select
                      value={form.circleId}
                      onValueChange={(circleId) => {
                        if (circleId !== null) {
                          updateForm({ circleId })
                        }
                      }}
                    >
                      <SelectTrigger className={RELATIONSHIP_DIALOG_FIELD_CLASS}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={RELATIONSHIP_SELECT_CONTENT_CLASS} align="start">
                        {relationshipsModule.circles.map((circle) => (
                          <SelectItem key={circle.id} value={circle.id}>
                            {circle.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>

                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  <EnumSelect
                    compact
                    label={t("relationships.edit.type", "类型")}
                    value={form.type}
                    options={RELATIONSHIP_TYPES}
                    group="type"
                    onValueChange={(type) => updateForm({ type: type as RelationshipType })}
                  />
                  <EnumSelect
                    compact
                    label={t("relationships.edit.depth", "深度")}
                    value={form.depth}
                    options={RELATIONSHIP_DEPTHS}
                    group="depth"
                    onValueChange={(depth) => updateForm({ depth: depth as RelationshipDepth })}
                  />
                  <EnumSelect
                    compact
                    label={t("relationships.edit.stage", "阶段")}
                    value={form.stage}
                    options={RELATIONSHIP_STAGES}
                    group="stage"
                    onValueChange={(stage) => updateForm({ stage: stage as RelationshipStage })}
                  />
                  <EnumSelect
                    compact
                    label={t("relationships.edit.impact", "影响")}
                    value={form.impact}
                    options={RELATIONSHIP_IMPACTS}
                    group="impact"
                    onValueChange={(impact) => updateForm({ impact: impact as RelationshipImpact })}
                  />
                  <EnumSelect
                    compact
                    label={t("relationships.edit.interaction", "互动")}
                    value={form.interaction}
                    options={INTERACTION_FREQUENCIES}
                    group="interaction"
                    onValueChange={(interaction) =>
                      updateForm({ interaction: interaction as InteractionFrequency })
                    }
                  />
                  <EnumSelect
                    compact
                    label={t("relationships.edit.unfinishedWeight", "未完成重量")}
                    value={form.unfinishedWeight}
                    options={UNFINISHED_WEIGHTS}
                    group="unfinishedWeight"
                    onValueChange={(unfinishedWeight) =>
                      updateForm({ unfinishedWeight: unfinishedWeight as UnfinishedWeight })
                    }
                  />
                </div>
              </section>

              <section className={RELATIONSHIP_DIALOG_COMPACT_SECTION_CLASS}>
                <div className="grid gap-2.5 lg:grid-cols-2">
                  <Field compact label={t("relationships.edit.influence", "关系档案")}>
                    <Textarea
                      value={form.influence}
                      onChange={(event) => updateForm({ influence: event.target.value })}
                      className={cn(RELATIONSHIP_DIALOG_FIELD_CLASS, "min-h-16")}
                    />
                  </Field>
                  <Field compact label={t("relationships.edit.currentState", "当前状态")}>
                    <Textarea
                      value={form.currentState}
                      onChange={(event) => updateForm({ currentState: event.target.value })}
                      className={cn(RELATIONSHIP_DIALOG_FIELD_CLASS, "min-h-16")}
                    />
                  </Field>
                  <Field compact label={t("relationships.edit.emotionalTone", "情绪线索描述")}>
                    <Textarea
                      value={form.emotionalTone}
                      onChange={(event) => updateForm({ emotionalTone: event.target.value })}
                      className={cn(RELATIONSHIP_DIALOG_FIELD_CLASS, "min-h-16")}
                    />
                  </Field>
                  <Field compact label={t("relationships.edit.unspokenLine", "没说出口")}>
                    <Textarea
                      value={form.unspokenLine}
                      onChange={(event) => updateForm({ unspokenLine: event.target.value })}
                      className={cn(RELATIONSHIP_DIALOG_FIELD_CLASS, "min-h-16")}
                    />
                  </Field>
                  <Field compact label={t("relationships.edit.positiveImpact", "正面影响")}>
                    <Textarea
                      value={form.positiveImpact}
                      onChange={(event) => updateForm({ positiveImpact: event.target.value })}
                      className={cn(RELATIONSHIP_DIALOG_FIELD_CLASS, "min-h-16")}
                    />
                  </Field>
                  <Field compact label={t("relationships.edit.ongoingShadow", "持续阴影")}>
                    <Textarea
                      value={form.ongoingShadow}
                      onChange={(event) => updateForm({ ongoingShadow: event.target.value })}
                      className={cn(RELATIONSHIP_DIALOG_FIELD_CLASS, "min-h-16")}
                    />
                  </Field>
                </div>
                <Field compact label={t("relationships.edit.boundaryStatus", "边界状态")}>
                  <Textarea
                    value={form.boundaryStatus}
                    onChange={(event) => updateForm({ boundaryStatus: event.target.value })}
                    className={cn(RELATIONSHIP_DIALOG_FIELD_CLASS, "min-h-14")}
                  />
                </Field>
                <div className="grid gap-2.5 md:grid-cols-2">
                  <Field compact label={t("relationships.edit.emotionCues", "情绪标签")}>
                    <Input
                      value={form.emotionCuesText}
                      onChange={(event) => updateForm({ emotionCuesText: event.target.value })}
                      className={RELATIONSHIP_DIALOG_FIELD_CLASS}
                    />
                  </Field>
                  <Field compact label={t("relationships.edit.tags", "标签")}>
                    <Input
                      value={form.tagsText}
                      onChange={(event) => updateForm({ tagsText: event.target.value })}
                      className={RELATIONSHIP_DIALOG_FIELD_CLASS}
                    />
                  </Field>
                </div>
              </section>
            </div>

            <RelationshipCollectionTabs
              form={form}
              relationships={relationships.filter((relationship) => relationship.id !== form.id)}
              updateForm={updateForm}
            />
          </div>

          <DialogFooter className={RELATIONSHIP_DIALOG_FOOTER_CLASS}>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("relationships.common.cancel", "取消")}
            </Button>
            <Button type="submit" disabled={saveRelationshipsMutation.isPending}>
              {saveRelationshipsMutation.isPending
                ? t("relationships.common.saving", "保存中")
                : t("relationships.common.save", "保存")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function UnsentNoteEditDialog({
  editing,
  relationshipsModule,
  onClose,
  onSaved,
}: {
  editing: EditingUnsentNote
  relationshipsModule: RelationshipMap
  onClose: () => void
  onSaved?: () => void
}) {
  const { t } = useTranslation()
  const saveRelationshipsMutation = useSaveRelationshipsMutation()
  const relationships = useMemo(
    () => getRelationshipsFromCircles(relationshipsModule.circles),
    [relationshipsModule.circles],
  )
  const [form, setForm] = useState<UnsentNoteFormState>(() =>
    createInitialUnsentNoteForm(editing.note),
  )

  const updateForm = (patch: Partial<UnsentNoteFormState>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!form.to.trim() || !form.theme.trim() || !form.excerpt.trim()) {
      toast.error(t("relationships.edit.validation.noteRequired", "请填写对象、主题和内容"))
      return
    }

    const id = editing.note?.id ?? createRelationshipId("unsent")
    const nextNote: RelationshipUnsentNote = {
      id,
      targetType: form.targetType,
      relationshipId:
        form.targetType === "关系条目" && form.relationshipId !== NONE_RELATIONSHIP_ID
          ? form.relationshipId
          : undefined,
      to: form.to.trim(),
      theme: form.theme.trim(),
      excerpt: form.excerpt.trim(),
      unfinishedWeight: form.unfinishedWeight,
    }
    const unsentNotes = editing.isNew
      ? [...relationshipsModule.unsentNotes, nextNote]
      : relationshipsModule.unsentNotes.map((note) => (note.id === id ? nextNote : note))

    try {
      await saveRelationshipsMutation.mutateAsync(
        syncUnsentLineRefs({
          ...relationshipsModule,
          unsentNotes,
        }),
      )
      toast.success(t("relationships.edit.noteSaved", "想说的话已保存"))
      onSaved?.()
      onClose()
    } catch {
      toast.error(t("relationships.edit.saveFailed", "保存失败"))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent
        className={cn(
          RELATIONSHIP_DIALOG_CONTENT_CLASS,
          "flex max-h-[min(620px,calc(100dvh-2rem))] flex-col overflow-hidden sm:max-w-[min(960px,calc(100vw-3rem))]",
        )}
      >
        <DialogHeader className={RELATIONSHIP_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew
              ? t("relationships.edit.createNote", "新增想说的话")
              : t("relationships.edit.editNote", "编辑想说的话")}
          </DialogTitle>
          <DialogDescription>
            {t("relationships.edit.noteDescription", "可以写给现有关系、独立对象，或未来的自己。")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
            <section className={RELATIONSHIP_DIALOG_SECTION_CLASS}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <EnumSelect
                  label={t("relationships.edit.targetType", "目标类型")}
                  value={form.targetType}
                  options={UNSENT_NOTE_TARGET_TYPES}
                  group="targetType"
                  onValueChange={(targetType) =>
                    updateForm({ targetType: targetType as UnsentNoteTargetType })
                  }
                />
                <EnumSelect
                  label={t("relationships.edit.unfinishedWeight", "未完成重量")}
                  value={form.unfinishedWeight}
                  options={UNFINISHED_WEIGHTS}
                  group="unfinishedWeight"
                  onValueChange={(unfinishedWeight) =>
                    updateForm({ unfinishedWeight: unfinishedWeight as UnfinishedWeight })
                  }
                />
                <Field label={t("relationships.edit.relatedRelationship", "关联关系")}>
                  <Select
                    value={form.relationshipId}
                    disabled={form.targetType !== "关系条目"}
                    onValueChange={(relationshipId) => {
                      if (relationshipId === null) {
                        return
                      }

                      const relationship = relationships.find((item) => item.id === relationshipId)
                      updateForm({
                        relationshipId,
                        to: relationship?.name ?? form.to,
                      })
                    }}
                  >
                    <SelectTrigger className={RELATIONSHIP_DIALOG_FIELD_CLASS}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={RELATIONSHIP_SELECT_CONTENT_CLASS} align="start">
                      <SelectItem value={NONE_RELATIONSHIP_ID}>
                        {t("relationships.edit.noRelationship", "不关联")}
                      </SelectItem>
                      {relationships.map((relationship) => (
                        <SelectItem key={relationship.id} value={relationship.id}>
                          {relationship.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t("relationships.edit.to", "对象")}>
                  <Input
                    value={form.to}
                    onChange={(event) => updateForm({ to: event.target.value })}
                    className={RELATIONSHIP_DIALOG_FIELD_CLASS}
                  />
                </Field>
                <Field label={t("relationships.edit.theme", "主题")}>
                  <Input
                    value={form.theme}
                    onChange={(event) => updateForm({ theme: event.target.value })}
                    className={RELATIONSHIP_DIALOG_FIELD_CLASS}
                  />
                </Field>
              </div>
              <Field label={t("relationships.edit.excerpt", "内容")}>
                <Textarea
                  value={form.excerpt}
                  onChange={(event) => updateForm({ excerpt: event.target.value })}
                  className={cn(RELATIONSHIP_DIALOG_FIELD_CLASS, "min-h-32")}
                />
              </Field>
            </section>
          </div>

          <DialogFooter className={RELATIONSHIP_DIALOG_FOOTER_CLASS}>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("relationships.common.cancel", "取消")}
            </Button>
            <Button type="submit" disabled={saveRelationshipsMutation.isPending}>
              {saveRelationshipsMutation.isPending
                ? t("relationships.common.saving", "保存中")
                : t("relationships.common.save", "保存")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export function RelationshipPatternEditDialog({
  editing,
  relationshipsModule,
  onClose,
  onSaved,
}: {
  editing: EditingRelationshipPattern
  relationshipsModule: RelationshipMap
  onClose: () => void
  onSaved?: () => void
}) {
  const { t } = useTranslation()
  const saveRelationshipsMutation = useSaveRelationshipsMutation()
  const [form, setForm] = useState<PatternFormState>(() => ({
    title: editing.pattern?.title ?? "",
    summary: editing.pattern?.summary ?? "",
    cuesText: joinListText(editing.pattern?.cues),
  }))

  const updateForm = (patch: Partial<PatternFormState>) => {
    setForm((current) => ({ ...current, ...patch }))
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!form.title.trim() || !form.summary.trim()) {
      toast.error(t("relationships.edit.validation.patternRequired", "请填写标题和摘要"))
      return
    }

    const id = editing.pattern?.id ?? createRelationshipId("relationship-pattern")
    const nextPattern: RelationshipPattern = {
      id,
      title: form.title.trim(),
      summary: form.summary.trim(),
      cues: splitListText(form.cuesText),
    }
    const patterns = editing.isNew
      ? [...relationshipsModule.patterns, nextPattern]
      : relationshipsModule.patterns.map((pattern) => (pattern.id === id ? nextPattern : pattern))

    try {
      await saveRelationshipsMutation.mutateAsync({
        ...relationshipsModule,
        patterns,
      })
      toast.success(t("relationships.edit.patternSaved", "模式已保存"))
      onSaved?.()
      onClose()
    } catch {
      toast.error(t("relationships.edit.saveFailed", "保存失败"))
    }
  }

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent
        className={cn(
          RELATIONSHIP_DIALOG_CONTENT_CLASS,
          "flex max-h-[min(640px,calc(100dvh-2rem))] flex-col overflow-hidden sm:max-w-[min(920px,calc(100vw-3rem))]",
        )}
      >
        <DialogHeader className={RELATIONSHIP_DIALOG_HEADER_CLASS}>
          <DialogTitle>
            {editing.isNew
              ? t("relationships.edit.createPattern", "新增模式")
              : t("relationships.edit.editPattern", "编辑模式")}
          </DialogTitle>
          <DialogDescription>
            {t("relationships.edit.patternDescription", "用于跨关系复盘重复出现的角色和路径。")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 overflow-y-auto px-1 py-1 pr-2">
            <section className={RELATIONSHIP_DIALOG_SECTION_CLASS}>
              <Field label={t("relationships.edit.title", "标题")}>
                <Input
                  value={form.title}
                  onChange={(event) => updateForm({ title: event.target.value })}
                  className={RELATIONSHIP_DIALOG_FIELD_CLASS}
                />
              </Field>
              <Field label={t("relationships.edit.summary", "摘要")}>
                <Textarea
                  value={form.summary}
                  onChange={(event) => updateForm({ summary: event.target.value })}
                  className={cn(RELATIONSHIP_DIALOG_FIELD_CLASS, "min-h-28")}
                />
              </Field>
              <Field label={t("relationships.edit.cues", "线索")}>
                <Input
                  value={form.cuesText}
                  onChange={(event) => updateForm({ cuesText: event.target.value })}
                  className={RELATIONSHIP_DIALOG_FIELD_CLASS}
                />
              </Field>
            </section>
          </div>

          <DialogFooter className={RELATIONSHIP_DIALOG_FOOTER_CLASS}>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("relationships.common.cancel", "取消")}
            </Button>
            <Button type="submit" disabled={saveRelationshipsMutation.isPending}>
              {saveRelationshipsMutation.isPending
                ? t("relationships.common.saving", "保存中")
                : t("relationships.common.save", "保存")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function RelationshipCollectionTabs({
  form,
  relationships,
  updateForm,
}: {
  form: RelationshipFormState
  relationships: RelationshipPerson[]
  updateForm: (patch: Partial<RelationshipFormState>) => void
}) {
  const { t } = useTranslation()
  const [expandedConnectionId, setExpandedConnectionId] = useState<string | null>(null)

  const effectiveExpandedId = useMemo(() => {
    if (form.connections.length === 0) return null
    if (
      expandedConnectionId &&
      form.connections.some((connection) => connection.id === expandedConnectionId)
    ) {
      return expandedConnectionId
    }
    return form.connections[0]?.id ?? null
  }, [form.connections, expandedConnectionId])

  return (
    <section
      className={cn(
        RELATIONSHIP_DIALOG_COMPACT_SECTION_CLASS,
        "flex min-h-0 flex-col overflow-hidden p-0",
      )}
    >
      <Tabs defaultValue="connections" className="flex min-h-0 flex-1 flex-col">
        <div className="border-foreground/10 flex shrink-0 items-center justify-between gap-2 border-b px-3 py-2">
          <TabsList
            variant="line"
            className="h-7 w-full justify-start gap-0.5 rounded-none bg-transparent p-0"
          >
            <TabsTrigger value="connections" className="h-7 flex-none px-2 text-xs after:bottom-0">
              {t("relationships.edit.tabs.connections", "人物关系")}
              {form.connections.length > 0 ? (
                <span className="text-muted-foreground ml-1 text-[10px] tabular-nums">
                  {form.connections.length}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="events" className="h-7 flex-none px-2 text-xs after:bottom-0">
              {t("relationships.edit.tabs.events", "互动事件")}
              {form.events.length > 0 ? (
                <span className="text-muted-foreground ml-1 text-[10px] tabular-nums">
                  {form.events.length}
                </span>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="history" className="h-7 flex-none px-2 text-xs after:bottom-0">
              {t("relationships.edit.tabs.history", "变化历史")}
              {form.history.length > 0 ? (
                <span className="text-muted-foreground ml-1 text-[10px] tabular-nums">
                  {form.history.length}
                </span>
              ) : null}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent
          value="connections"
          className="mt-0 min-h-0 flex-1 overflow-y-auto px-3 py-2.5"
        >
          <EditableListHeader
            compact
            title={t("relationships.edit.connections", "人物之间的关系")}
            onAdd={() => {
              const nextConnection = createEmptyConnection()
              updateForm({
                connections: [...form.connections, nextConnection],
              })
              setExpandedConnectionId(nextConnection.id)
            }}
          />
          <p className="mt-1.5 text-[11px] leading-4 text-[color:var(--text-muted)]">
            {t(
              "relationships.edit.connectionsDescription",
              "为当前人物补充和其他人物之间的真实关系。对方打开编辑时，会自动看到互相翻转后的角色。",
            )}
          </p>
          <div className="mt-2.5 space-y-2">
            {form.connections.length > 0 ? (
              form.connections.map((connection, index) => (
                <ConnectionEditor
                  key={connection.id}
                  compact
                  connection={connection}
                  expanded={effectiveExpandedId === connection.id}
                  relationships={relationships}
                  onToggleExpanded={() =>
                    setExpandedConnectionId((current) =>
                      current === connection.id ? null : connection.id,
                    )
                  }
                  onAddRole={() =>
                    updateForm({
                      connections: form.connections.map((entry, entryIndex) =>
                        entryIndex === index
                          ? {
                              ...entry,
                              roles: [...entry.roles, createEmptyConnectionRole()],
                            }
                          : entry,
                      ),
                    })
                  }
                  onChange={(nextConnection) =>
                    updateForm({
                      connections: form.connections.map((entry, entryIndex) =>
                        entryIndex === index ? nextConnection : entry,
                      ),
                    })
                  }
                  onRemove={() =>
                    updateForm({
                      connections: form.connections.filter((_, entryIndex) => entryIndex !== index),
                    })
                  }
                />
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[color:var(--chip-border)] px-3 py-4 text-xs text-[color:var(--text-muted)]">
                {t(
                  "relationships.edit.noConnections",
                  "还没有人物连接。可以新增一条，例如“学生 / 老师”或“朋友 / 朋友”。",
                )}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="events" className="mt-0 min-h-0 flex-1 overflow-y-auto px-3 py-2.5">
          <EditableListHeader
            compact
            title={t("relationships.edit.events", "关键互动事件")}
            onAdd={() =>
              updateForm({
                events: [
                  ...form.events,
                  {
                    id: createRelationshipId("relationship-event"),
                    date: "",
                    kind: "重要谈话",
                    title: "",
                    summary: "",
                  },
                ],
              })
            }
          />
          <div className="mt-2.5 space-y-2">
            {form.events.length > 0 ? (
              form.events.map((event, index) => (
                <EventEditor
                  key={event.id}
                  compact
                  event={event}
                  onChange={(nextEvent) =>
                    updateForm({
                      events: form.events.map((item, itemIndex) =>
                        itemIndex === index ? nextEvent : item,
                      ),
                    })
                  }
                  onRemove={() =>
                    updateForm({
                      events: form.events.filter((_, itemIndex) => itemIndex !== index),
                    })
                  }
                />
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[color:var(--chip-border)] px-3 py-4 text-xs text-[color:var(--text-muted)]">
                {t("relationships.edit.noEvents", "还没有互动事件，点击上方添加。")}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="mt-0 min-h-0 flex-1 overflow-y-auto px-3 py-2.5">
          <EditableListHeader
            compact
            title={t("relationships.edit.history", "深度 / 阶段变化历史")}
            onAdd={() =>
              updateForm({
                history: [
                  ...form.history,
                  {
                    id: createRelationshipId("relationship-history"),
                    date: "",
                    field: "stage",
                    from: "",
                    to: "",
                    note: "",
                  },
                ],
              })
            }
          />
          <div className="mt-2.5 space-y-2">
            {form.history.length > 0 ? (
              form.history.map((history, index) => (
                <HistoryEditor
                  key={history.id}
                  compact
                  history={history}
                  onChange={(nextHistory) =>
                    updateForm({
                      history: form.history.map((item, itemIndex) =>
                        itemIndex === index ? nextHistory : item,
                      ),
                    })
                  }
                  onRemove={() =>
                    updateForm({
                      history: form.history.filter((_, itemIndex) => itemIndex !== index),
                    })
                  }
                />
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-[color:var(--chip-border)] px-3 py-4 text-xs text-[color:var(--text-muted)]">
                {t("relationships.edit.noHistory", "还没有变化历史，点击上方添加。")}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </section>
  )
}

function Field({
  compact = false,
  label,
  children,
}: {
  compact?: boolean
  label: string
  children: ReactNode
}) {
  return (
    <div className={compact ? "space-y-1" : "space-y-1.5"}>
      <Label className={compact ? "text-xs" : undefined}>{label}</Label>
      {children}
    </div>
  )
}

function EnumSelect({
  compact = false,
  label,
  value,
  options,
  group,
  onValueChange,
}: {
  compact?: boolean
  label: string
  value: string
  options: readonly string[]
  group: RelationshipEnumGroup
  onValueChange: (value: string) => void
}) {
  const { t } = useTranslation()

  return (
    <Field compact={compact} label={label}>
      <Select
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue !== null) {
            onValueChange(nextValue)
          }
        }}
      >
        <SelectTrigger className={RELATIONSHIP_DIALOG_FIELD_CLASS}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className={RELATIONSHIP_SELECT_CONTENT_CLASS} align="start">
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {translateRelationshipEnum(t, group, option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )
}

function EditableListHeader({
  compact = false,
  title,
  onAdd,
}: {
  compact?: boolean
  title: string
  onAdd: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between gap-2">
      <div className={compact ? "text-xs font-medium" : "text-sm font-medium"}>{title}</div>
      <Button
        type="button"
        size={compact ? "xs" : "sm"}
        variant="outline"
        className={compact ? "h-7 px-2 text-xs" : undefined}
        onClick={onAdd}
      >
        <Plus className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        {t("relationships.common.add", "添加")}
      </Button>
    </div>
  )
}

function EventEditor({
  compact = false,
  event,
  onChange,
  onRemove,
}: {
  compact?: boolean
  event: RelationshipEvent
  onChange: (event: RelationshipEvent) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "border-foreground/10 bg-background/80 rounded-lg border",
        compact ? "p-2.5" : "p-3",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className={compact ? "text-xs font-medium" : "text-sm font-medium"}>
          {t("relationships.edit.eventCardTitle", "互动事件")}
        </div>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={onRemove}
          aria-label={t("relationships.common.delete", "删除")}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div
        className={cn(
          "grid gap-2 md:grid-cols-2",
          compact
            ? "xl:grid-cols-[120px_140px_minmax(0,1fr)]"
            : "xl:grid-cols-[140px_160px_minmax(0,1fr)]",
        )}
      >
        <Field compact={compact} label={t("relationships.edit.date", "日期")}>
          <Input
            value={event.date}
            onChange={(inputEvent) => onChange({ ...event, date: inputEvent.target.value })}
            className={RELATIONSHIP_DIALOG_FIELD_CLASS}
          />
        </Field>
        <Field compact={compact} label={t("relationships.edit.eventKind", "事件类型")}>
          <Select
            value={event.kind}
            onValueChange={(kind) => {
              if (kind !== null) {
                onChange({ ...event, kind })
              }
            }}
          >
            <SelectTrigger className={RELATIONSHIP_DIALOG_FIELD_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={RELATIONSHIP_SELECT_CONTENT_CLASS} align="start">
              {RELATIONSHIP_EVENT_KINDS.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {translateRelationshipEnum(t, "eventKind", kind)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field compact={compact} label={t("relationships.edit.eventTitle", "事件标题")}>
          <Input
            value={event.title}
            onChange={(inputEvent) => onChange({ ...event, title: inputEvent.target.value })}
            className={RELATIONSHIP_DIALOG_FIELD_CLASS}
          />
        </Field>
      </div>
      <Field compact={compact} label={t("relationships.edit.eventSummary", "事件摘要")}>
        <Textarea
          value={event.summary}
          onChange={(inputEvent) => onChange({ ...event, summary: inputEvent.target.value })}
          className={cn(RELATIONSHIP_DIALOG_FIELD_CLASS, compact ? "min-h-14" : "min-h-20")}
        />
      </Field>
    </div>
  )
}

function HistoryEditor({
  compact = false,
  history,
  onChange,
  onRemove,
}: {
  compact?: boolean
  history: RelationshipChange
  onChange: (history: RelationshipChange) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "border-foreground/10 bg-background/80 rounded-lg border",
        compact ? "p-2.5" : "p-3",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className={compact ? "text-xs font-medium" : "text-sm font-medium"}>
          {t("relationships.edit.historyCardTitle", "变化记录")}
        </div>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={onRemove}
          aria-label={t("relationships.common.delete", "删除")}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div
        className={cn(
          "grid gap-2 md:grid-cols-2",
          compact
            ? "xl:grid-cols-[120px_108px_minmax(0,1fr)_minmax(0,1fr)]"
            : "xl:grid-cols-[140px_120px_minmax(0,1fr)_minmax(0,1fr)]",
        )}
      >
        <Field compact={compact} label={t("relationships.edit.date", "日期")}>
          <Input
            value={history.date}
            onChange={(event) => onChange({ ...history, date: event.target.value })}
            className={RELATIONSHIP_DIALOG_FIELD_CLASS}
          />
        </Field>
        <Field compact={compact} label={t("relationships.edit.changeField", "变化字段")}>
          <Select
            value={history.field}
            onValueChange={(field) => {
              if (field !== null) {
                onChange({ ...history, field })
              }
            }}
          >
            <SelectTrigger className={RELATIONSHIP_DIALOG_FIELD_CLASS}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent className={RELATIONSHIP_SELECT_CONTENT_CLASS} align="start">
              {RELATIONSHIP_CHANGE_FIELDS.map((field) => (
                <SelectItem key={field} value={field}>
                  {translateRelationshipEnum(t, "changeField", field)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field compact={compact} label={t("relationships.edit.from", "从")}>
          <Input
            value={history.from}
            onChange={(event) => onChange({ ...history, from: event.target.value })}
            className={RELATIONSHIP_DIALOG_FIELD_CLASS}
          />
        </Field>
        <Field compact={compact} label={t("relationships.edit.toValue", "到")}>
          <Input
            value={history.to}
            onChange={(event) => onChange({ ...history, to: event.target.value })}
            className={RELATIONSHIP_DIALOG_FIELD_CLASS}
          />
        </Field>
      </div>
      <Field compact={compact} label={t("relationships.edit.historyNote", "变化说明")}>
        <Textarea
          value={history.note}
          onChange={(event) => onChange({ ...history, note: event.target.value })}
          className={cn(RELATIONSHIP_DIALOG_FIELD_CLASS, compact ? "min-h-14" : "min-h-20")}
        />
      </Field>
    </div>
  )
}

function ConnectionEditor({
  compact = false,
  connection,
  expanded,
  onAddRole,
  onChange,
  onRemove,
  onToggleExpanded,
  relationships,
}: {
  compact?: boolean
  connection: RelationshipConnectionPerspective
  expanded: boolean
  onAddRole: () => void
  onChange: (connection: RelationshipConnectionPerspective) => void
  onRemove: () => void
  onToggleExpanded: () => void
  relationships: RelationshipPerson[]
}) {
  const { t } = useTranslation()
  const otherRelationshipName =
    relationships.find((relationship) => relationship.id === connection.otherRelationshipId)
      ?.name ?? t("relationships.edit.unselectedRelatedPerson", "未选择关联人物")
  const roleSummary = summarizeConnectionRoles(connection)

  return (
    <div
      className={cn(
        "bg-background/85 rounded-lg border border-[color:var(--chip-border)]",
        compact ? "p-2.5" : "p-3",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          onClick={onToggleExpanded}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-start justify-between gap-3 rounded-lg px-1 py-0.5 text-left transition-colors hover:bg-black/5"
        >
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className={cn("truncate font-medium", compact ? "text-sm" : "text-base")}>
                {t("relationships.edit.connectionCardTitle", {
                  name: otherRelationshipName,
                  defaultValue: `和${otherRelationshipName}的关系`,
                })}
              </span>
              <span className="rounded-full border border-[color:var(--chip-border)] px-2 py-0.5 text-[10px] text-[color:var(--text-muted)]">
                {translateRelationshipEnum(t, "connectionStrength", connection.strength)}
              </span>
            </div>
            <div className="text-[11px] leading-4 text-[color:var(--text-muted)]">
              {roleSummary ||
                t(
                  "relationships.edit.connectionCardEmpty",
                  "还没填写角色组合，点开卡片后补充具体关系。",
                )}
            </div>
          </div>
          <ChevronDown
            className={cn(
              "mt-0.5 h-4 w-4 shrink-0 text-[color:var(--text-muted)] transition-transform",
              expanded ? "rotate-180" : undefined,
            )}
          />
        </button>

        <div className="pt-0.5">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={onRemove}
            aria-label={t("relationships.common.delete", "删除")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expanded ? (
        <div className={compact ? "mt-2 space-y-2" : "mt-3 space-y-3"}>
          <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_128px]">
            <Field compact={compact} label={t("relationships.edit.relatedPerson", "关联人物")}>
              <Select
                value={connection.otherRelationshipId || NONE_RELATIONSHIP_ID}
                onValueChange={(otherRelationshipId) => {
                  if (otherRelationshipId === null) {
                    return
                  }

                  onChange({
                    ...connection,
                    otherRelationshipId:
                      otherRelationshipId === NONE_RELATIONSHIP_ID ? "" : otherRelationshipId,
                  })
                }}
              >
                <SelectTrigger className={RELATIONSHIP_DIALOG_FIELD_CLASS}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className={RELATIONSHIP_SELECT_CONTENT_CLASS} align="start">
                  <SelectItem value={NONE_RELATIONSHIP_ID}>
                    {t("relationships.edit.selectRelatedPerson", "选择一个人物")}
                  </SelectItem>
                  {relationships.map((relationship) => (
                    <SelectItem key={relationship.id} value={relationship.id}>
                      {relationship.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <EnumSelect
              compact={compact}
              label={t("relationships.edit.connectionStrength", "连接强度")}
              value={connection.strength}
              options={RELATIONSHIP_CONNECTION_STRENGTH_OPTIONS}
              group="connectionStrength"
              onValueChange={(strength) =>
                onChange({
                  ...connection,
                  strength: strength as RelationshipConnection["strength"],
                })
              }
            />
          </div>

          <Field compact={compact} label={t("relationships.edit.connectionNote", "连接备注")}>
            <Textarea
              value={connection.note}
              onChange={(event) =>
                onChange({
                  ...connection,
                  note: event.target.value,
                })
              }
              className={cn(RELATIONSHIP_DIALOG_FIELD_CLASS, compact ? "min-h-14" : "min-h-20")}
            />
          </Field>

          <div className="text-[11px] leading-4 text-[color:var(--text-muted)]">
            {t(
              "relationships.edit.connectionRolesHint",
              "每一行都是一组自定义互相关系，例如当前人物填“学生”，对方填“老师”；从对方视角打开时会自动反过来显示。",
            )}
          </div>

          <div className="space-y-2">
            {connection.roles.map((role, roleIndex) => (
              <ConnectionRoleEditor
                key={role.id}
                compact={compact}
                role={role}
                onChange={(nextRole) =>
                  onChange({
                    ...connection,
                    roles: connection.roles.map((entry, entryIndex) =>
                      entryIndex === roleIndex ? nextRole : entry,
                    ),
                  })
                }
                onRemove={() =>
                  onChange({
                    ...connection,
                    roles: connection.roles.filter((_, entryIndex) => entryIndex !== roleIndex),
                  })
                }
              />
            ))}
          </div>

          <Button
            type="button"
            size={compact ? "xs" : "sm"}
            variant="outline"
            className={compact ? "h-7 px-2 text-xs" : undefined}
            onClick={() => onAddRole()}
          >
            <Plus className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
            {t("relationships.edit.addConnectionRole", "新增一行关系")}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function ConnectionRoleEditor({
  compact = false,
  onChange,
  onRemove,
  role,
}: {
  compact?: boolean
  onChange: (role: RelationshipConnectionPerspectiveRole) => void
  onRemove: () => void
  role: RelationshipConnectionPerspectiveRole
}) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        "rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)]",
        compact ? "p-2" : "p-3",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className={compact ? "text-xs font-medium" : "text-sm font-medium"}>
          {t("relationships.edit.connectionRoleCardTitle", "关系角色")}
        </div>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          onClick={onRemove}
          aria-label={t("relationships.common.delete", "删除")}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <Field compact={compact} label={t("relationships.edit.selfRole", "当前人物角色")}>
          <Input
            value={role.selfRole}
            onChange={(event) => onChange({ ...role, selfRole: event.target.value })}
            className={RELATIONSHIP_DIALOG_FIELD_CLASS}
          />
        </Field>
        <Field compact={compact} label={t("relationships.edit.otherRole", "对方角色")}>
          <Input
            value={role.otherRole}
            onChange={(event) => onChange({ ...role, otherRole: event.target.value })}
            className={RELATIONSHIP_DIALOG_FIELD_CLASS}
          />
        </Field>
      </div>
      <Field
        compact={compact}
        label={t("relationships.edit.connectionRoleNote", "这条关系的补充说明")}
      >
        <Input
          value={role.note}
          onChange={(event) => onChange({ ...role, note: event.target.value })}
          className={RELATIONSHIP_DIALOG_FIELD_CLASS}
        />
      </Field>
    </div>
  )
}

function summarizeConnectionRoles(connection: RelationshipConnectionPerspective) {
  return connection.roles
    .map((role) => {
      const selfRole = role.selfRole.trim()
      const otherRole = role.otherRole.trim()

      if (selfRole && otherRole) {
        return `${selfRole} / ${otherRole}`
      }

      return selfRole || otherRole
    })
    .filter(Boolean)
    .join(" · ")
}

function createEmptyConnection() {
  return {
    id: createRelationshipScopedId("relationship-connection"),
    note: "",
    otherRelationshipId: "",
    roles: [createEmptyConnectionRole()],
    strength: "中",
  } satisfies RelationshipConnectionPerspective
}

function createEmptyConnectionRole(selfRole = "", otherRole = "") {
  return {
    id: createRelationshipScopedId("relationship-connection-role"),
    note: "",
    otherRole,
    selfRole,
  } satisfies RelationshipConnectionPerspectiveRole
}

function createInitialRelationshipForm(
  editing: EditingRelationship,
  relationshipsModule: RelationshipMap,
): RelationshipFormState {
  const relationship = editing.relationship
  const fallbackCircleId = relationshipsModule.circles[0]?.id ?? ""
  const id = relationship?.id ?? createRelationshipScopedId("relationship")
  const relationships = getRelationshipsFromCircles(relationshipsModule.circles)

  return {
    circleId: editing.circleId || fallbackCircleId,
    connections: buildRelationshipConnectionPerspectives(
      relationshipsModule.connections ?? [],
      id,
    ).filter((connection) =>
      relationships.some((entry) => entry.id === connection.otherRelationshipId),
    ),
    id,
    name: relationship?.name ?? "",
    role: relationship?.role ?? "",
    type: relationship?.type ?? "朋友",
    depth: relationship?.depth ?? "熟人",
    stage: relationship?.stage ?? "建立中",
    impact: relationship?.impact ?? "中性",
    interaction: relationship?.interaction ?? "每月",
    unfinishedWeight: relationship?.unfinishedWeight ?? "无",
    influence: relationship?.influence ?? "",
    currentState: relationship?.currentState ?? "",
    emotionalTone: relationship?.emotionalTone ?? "",
    unspokenLine: relationship?.unspokenLine ?? "",
    positiveImpact: relationship?.positiveImpact ?? "",
    ongoingShadow: relationship?.ongoingShadow ?? "",
    boundaryStatus: relationship?.boundaryStatus ?? "",
    emotionCuesText: joinListText(relationship?.emotionCues),
    tagsText: joinListText(relationship?.tags),
    events: relationship?.events ?? [],
    history: relationship?.history ?? [],
  }
}

function createInitialUnsentNoteForm(note: RelationshipUnsentNote | null): UnsentNoteFormState {
  return {
    targetType: note?.targetType ?? "关系条目",
    relationshipId: note?.relationshipId ?? NONE_RELATIONSHIP_ID,
    to: note?.to ?? "",
    theme: note?.theme ?? "",
    excerpt: note?.excerpt ?? "",
    unfinishedWeight: note?.unfinishedWeight ?? "无",
  }
}

function relationshipFromForm({
  existingRelationship,
  form,
  relationshipsModule,
}: {
  existingRelationship: RelationshipPerson | null
  form: RelationshipFormState
  relationshipsModule: RelationshipMap
}): RelationshipPerson {
  return {
    id: form.id,
    name: form.name.trim(),
    role: form.role.trim(),
    type: form.type,
    depth: form.depth,
    stage: form.stage,
    impact: form.impact,
    interaction: form.interaction,
    unfinishedWeight: form.unfinishedWeight,
    influence: form.influence.trim(),
    currentState: form.currentState.trim(),
    emotionalTone: form.emotionalTone.trim(),
    unspokenLine: form.unspokenLine.trim(),
    positiveImpact: form.positiveImpact.trim(),
    ongoingShadow: form.ongoingShadow.trim(),
    boundaryStatus: form.boundaryStatus.trim(),
    emotionCues: splitListText(form.emotionCuesText),
    unsentLineIds:
      existingRelationship?.unsentLineIds ??
      relationshipsModule.unsentNotes
        .filter((note) => note.relationshipId === form.id)
        .map((note) => note.id),
    events: form.events
      .map((event) => ({
        ...event,
        date: event.date.trim(),
        title: event.title.trim(),
        summary: event.summary.trim(),
      }))
      .filter((event) => event.title.length > 0 || event.summary.length > 0),
    history: form.history
      .map((history) => ({
        ...history,
        date: history.date.trim(),
        from: history.from.trim(),
        to: history.to.trim(),
        note: history.note.trim(),
      }))
      .filter(
        (history) => history.from.length > 0 || history.to.length > 0 || history.note.length > 0,
      ),
    tags: splitListText(form.tagsText),
  }
}

function upsertRelationship(
  relationshipsModule: RelationshipMap,
  circleId: string,
  relationship: RelationshipPerson,
  connections: RelationshipConnectionPerspective[],
) {
  const nextModule = {
    ...relationshipsModule,
    circles: relationshipsModule.circles.map((circle) => {
      const entriesWithoutRelationship = circle.entries.filter(
        (entry) => entry.id !== relationship.id,
      )

      if (circle.id !== circleId) {
        return {
          ...circle,
          entries: entriesWithoutRelationship,
        }
      }

      return {
        ...circle,
        entries: [...entriesWithoutRelationship, relationship],
      }
    }),
  }

  const nextRelationships = getRelationshipsFromCircles(nextModule.circles)
  const relationshipIds = new Set(nextRelationships.map((entry) => entry.id))

  return syncUnsentLineRefs({
    ...nextModule,
    connections: mergeConnectionsForRelationship({
      allConnections: nextModule.connections ?? [],
      relationshipId: relationship.id,
      rows: connections,
    }).filter(
      (connection) =>
        relationshipIds.has(connection.sourceId) && relationshipIds.has(connection.targetId),
    ),
  })
}
