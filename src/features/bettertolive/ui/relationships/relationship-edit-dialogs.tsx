import { Plus, Trash2 } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { useSaveRelationshipsMutation } from "@/features/bettertolive/queries/use-save-relationships-mutation"
import type {
  InteractionFrequency,
  RelationshipChange,
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
  INTERACTION_FREQUENCIES,
  RELATIONSHIP_CHANGE_FIELDS,
  RELATIONSHIP_DEPTHS,
  RELATIONSHIP_DIALOG_CONTENT_CLASS,
  RELATIONSHIP_DIALOG_FIELD_CLASS,
  RELATIONSHIP_DIALOG_FOOTER_CLASS,
  RELATIONSHIP_DIALOG_HEADER_CLASS,
  RELATIONSHIP_DIALOG_SECTION_CLASS,
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
  name: string
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

    const id = editing.relationship?.id ?? createRelationshipId("relationship")
    const nextRelationship = relationshipFromForm({
      existingRelationship: editing.relationship,
      form,
      id,
      relationshipsModule,
    })
    const nextModule = upsertRelationship(relationshipsModule, form.circleId, nextRelationship)

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
          "flex max-h-[min(820px,calc(100dvh-2rem))] max-w-6xl flex-col overflow-hidden",
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
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">
            <section className={RELATIONSHIP_DIALOG_SECTION_CLASS}>
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_180px]">
                <Field label={t("relationships.edit.name", "姓名")}>
                  <Input
                    value={form.name}
                    onChange={(event) => updateForm({ name: event.target.value })}
                    className={RELATIONSHIP_DIALOG_FIELD_CLASS}
                  />
                </Field>
                <Field label={t("relationships.edit.role", "角色")}>
                  <Input
                    value={form.role}
                    onChange={(event) => updateForm({ role: event.target.value })}
                    className={RELATIONSHIP_DIALOG_FIELD_CLASS}
                  />
                </Field>
                <Field label={t("relationships.edit.circle", "圈层")}>
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
                    <SelectContent>
                      {relationshipsModule.circles.map((circle) => (
                        <SelectItem key={circle.id} value={circle.id}>
                          {circle.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
                <EnumSelect
                  label={t("relationships.edit.type", "类型")}
                  value={form.type}
                  options={RELATIONSHIP_TYPES}
                  group="type"
                  onValueChange={(type) => updateForm({ type: type as RelationshipType })}
                />
                <EnumSelect
                  label={t("relationships.edit.depth", "深度")}
                  value={form.depth}
                  options={RELATIONSHIP_DEPTHS}
                  group="depth"
                  onValueChange={(depth) => updateForm({ depth: depth as RelationshipDepth })}
                />
                <EnumSelect
                  label={t("relationships.edit.stage", "阶段")}
                  value={form.stage}
                  options={RELATIONSHIP_STAGES}
                  group="stage"
                  onValueChange={(stage) => updateForm({ stage: stage as RelationshipStage })}
                />
                <EnumSelect
                  label={t("relationships.edit.impact", "影响")}
                  value={form.impact}
                  options={RELATIONSHIP_IMPACTS}
                  group="impact"
                  onValueChange={(impact) => updateForm({ impact: impact as RelationshipImpact })}
                />
                <EnumSelect
                  label={t("relationships.edit.interaction", "互动")}
                  value={form.interaction}
                  options={INTERACTION_FREQUENCIES}
                  group="interaction"
                  onValueChange={(interaction) =>
                    updateForm({ interaction: interaction as InteractionFrequency })
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
              </div>
            </section>

            <section className={RELATIONSHIP_DIALOG_SECTION_CLASS}>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label={t("relationships.edit.influence", "关系档案")}>
                  <Textarea
                    value={form.influence}
                    onChange={(event) => updateForm({ influence: event.target.value })}
                    className={cn(RELATIONSHIP_DIALOG_FIELD_CLASS, "min-h-24")}
                  />
                </Field>
                <Field label={t("relationships.edit.currentState", "当前状态")}>
                  <Textarea
                    value={form.currentState}
                    onChange={(event) => updateForm({ currentState: event.target.value })}
                    className={cn(RELATIONSHIP_DIALOG_FIELD_CLASS, "min-h-24")}
                  />
                </Field>
                <Field label={t("relationships.edit.emotionalTone", "情绪线索描述")}>
                  <Textarea
                    value={form.emotionalTone}
                    onChange={(event) => updateForm({ emotionalTone: event.target.value })}
                    className={cn(RELATIONSHIP_DIALOG_FIELD_CLASS, "min-h-24")}
                  />
                </Field>
                <Field label={t("relationships.edit.unspokenLine", "没说出口")}>
                  <Textarea
                    value={form.unspokenLine}
                    onChange={(event) => updateForm({ unspokenLine: event.target.value })}
                    className={cn(RELATIONSHIP_DIALOG_FIELD_CLASS, "min-h-24")}
                  />
                </Field>
                <Field label={t("relationships.edit.positiveImpact", "正面影响")}>
                  <Textarea
                    value={form.positiveImpact}
                    onChange={(event) => updateForm({ positiveImpact: event.target.value })}
                    className={cn(RELATIONSHIP_DIALOG_FIELD_CLASS, "min-h-24")}
                  />
                </Field>
                <Field label={t("relationships.edit.ongoingShadow", "持续阴影")}>
                  <Textarea
                    value={form.ongoingShadow}
                    onChange={(event) => updateForm({ ongoingShadow: event.target.value })}
                    className={cn(RELATIONSHIP_DIALOG_FIELD_CLASS, "min-h-24")}
                  />
                </Field>
              </div>
              <Field label={t("relationships.edit.boundaryStatus", "边界状态")}>
                <Textarea
                  value={form.boundaryStatus}
                  onChange={(event) => updateForm({ boundaryStatus: event.target.value })}
                  className={cn(RELATIONSHIP_DIALOG_FIELD_CLASS, "min-h-20")}
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label={t("relationships.edit.emotionCues", "情绪标签")}>
                  <Input
                    value={form.emotionCuesText}
                    onChange={(event) => updateForm({ emotionCuesText: event.target.value })}
                    className={RELATIONSHIP_DIALOG_FIELD_CLASS}
                  />
                </Field>
                <Field label={t("relationships.edit.tags", "标签")}>
                  <Input
                    value={form.tagsText}
                    onChange={(event) => updateForm({ tagsText: event.target.value })}
                    className={RELATIONSHIP_DIALOG_FIELD_CLASS}
                  />
                </Field>
              </div>
            </section>

            <section className={RELATIONSHIP_DIALOG_SECTION_CLASS}>
              <EditableListHeader
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
              <div className="space-y-3">
                {form.events.map((event, index) => (
                  <EventEditor
                    key={event.id}
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
                ))}
              </div>
            </section>

            <section className={RELATIONSHIP_DIALOG_SECTION_CLASS}>
              <EditableListHeader
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
              <div className="space-y-3">
                {form.history.map((history, index) => (
                  <HistoryEditor
                    key={history.id}
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
                ))}
              </div>
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
  const relationships = useMemo(() => getRelationships(relationshipsModule), [relationshipsModule])
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
          "flex max-h-[min(620px,calc(100dvh-2rem))] max-w-3xl flex-col overflow-hidden",
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
              <div className="grid gap-4 md:grid-cols-3">
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
                    <SelectContent>
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
      <DialogContent className={cn(RELATIONSHIP_DIALOG_CONTENT_CLASS, "max-w-2xl")}>
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

        <form onSubmit={handleSubmit} className="space-y-4">
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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function EnumSelect({
  label,
  value,
  options,
  group,
  onValueChange,
}: {
  label: string
  value: string
  options: readonly string[]
  group: RelationshipEnumGroup
  onValueChange: (value: string) => void
}) {
  const { t } = useTranslation()

  return (
    <Field label={label}>
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
        <SelectContent>
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

function EditableListHeader({ title, onAdd }: { title: string; onAdd: () => void }) {
  const { t } = useTranslation()

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm font-medium">{title}</div>
      <Button type="button" size="sm" variant="outline" onClick={onAdd}>
        <Plus className="h-4 w-4" />
        {t("relationships.common.add", "添加")}
      </Button>
    </div>
  )
}

function EventEditor({
  event,
  onChange,
  onRemove,
}: {
  event: RelationshipEvent
  onChange: (event: RelationshipEvent) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="border-foreground/10 bg-background/80 rounded-lg border p-3">
      <div className="grid gap-3 md:grid-cols-[140px_160px_minmax(0,1fr)_auto]">
        <Input
          value={event.date}
          onChange={(inputEvent) => onChange({ ...event, date: inputEvent.target.value })}
          className={RELATIONSHIP_DIALOG_FIELD_CLASS}
          placeholder={t("relationships.edit.date", "日期")}
        />
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
          <SelectContent>
            {RELATIONSHIP_EVENT_KINDS.map((kind) => (
              <SelectItem key={kind} value={kind}>
                {translateRelationshipEnum(t, "eventKind", kind)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={event.title}
          onChange={(inputEvent) => onChange({ ...event, title: inputEvent.target.value })}
          className={RELATIONSHIP_DIALOG_FIELD_CLASS}
          placeholder={t("relationships.edit.eventTitle", "事件标题")}
        />
        <Button type="button" size="icon" variant="ghost" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <Textarea
        value={event.summary}
        onChange={(inputEvent) => onChange({ ...event, summary: inputEvent.target.value })}
        className={cn(RELATIONSHIP_DIALOG_FIELD_CLASS, "mt-3 min-h-20")}
        placeholder={t("relationships.edit.eventSummary", "事件摘要")}
      />
    </div>
  )
}

function HistoryEditor({
  history,
  onChange,
  onRemove,
}: {
  history: RelationshipChange
  onChange: (history: RelationshipChange) => void
  onRemove: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="border-foreground/10 bg-background/80 rounded-lg border p-3">
      <div className="grid gap-3 md:grid-cols-[140px_120px_minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Input
          value={history.date}
          onChange={(event) => onChange({ ...history, date: event.target.value })}
          className={RELATIONSHIP_DIALOG_FIELD_CLASS}
          placeholder={t("relationships.edit.date", "日期")}
        />
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
          <SelectContent>
            {RELATIONSHIP_CHANGE_FIELDS.map((field) => (
              <SelectItem key={field} value={field}>
                {translateRelationshipEnum(t, "changeField", field)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={history.from}
          onChange={(event) => onChange({ ...history, from: event.target.value })}
          className={RELATIONSHIP_DIALOG_FIELD_CLASS}
          placeholder={t("relationships.edit.from", "从")}
        />
        <Input
          value={history.to}
          onChange={(event) => onChange({ ...history, to: event.target.value })}
          className={RELATIONSHIP_DIALOG_FIELD_CLASS}
          placeholder={t("relationships.edit.toValue", "到")}
        />
        <Button type="button" size="icon" variant="ghost" onClick={onRemove}>
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
      <Textarea
        value={history.note}
        onChange={(event) => onChange({ ...history, note: event.target.value })}
        className={cn(RELATIONSHIP_DIALOG_FIELD_CLASS, "mt-3 min-h-20")}
        placeholder={t("relationships.edit.historyNote", "变化说明")}
      />
    </div>
  )
}

function createInitialRelationshipForm(
  editing: EditingRelationship,
  relationshipsModule: RelationshipMap,
): RelationshipFormState {
  const relationship = editing.relationship
  const fallbackCircleId = relationshipsModule.circles[0]?.id ?? ""

  return {
    circleId: editing.circleId || fallbackCircleId,
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
  id,
  relationshipsModule,
}: {
  existingRelationship: RelationshipPerson | null
  form: RelationshipFormState
  id: string
  relationshipsModule: RelationshipMap
}): RelationshipPerson {
  return {
    id,
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
        .filter((note) => note.relationshipId === id)
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
) {
  return {
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
}

function syncUnsentLineRefs(relationshipsModule: RelationshipMap): RelationshipMap {
  return {
    ...relationshipsModule,
    circles: relationshipsModule.circles.map((circle) => ({
      ...circle,
      entries: circle.entries.map((relationship) => ({
        ...relationship,
        unsentLineIds: relationshipsModule.unsentNotes
          .filter((note) => note.relationshipId === relationship.id)
          .map((note) => note.id),
      })),
    })),
  }
}

function getRelationships(relationshipsModule: RelationshipMap) {
  return relationshipsModule.circles.flatMap((circle) => circle.entries)
}
