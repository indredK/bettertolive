import { Trash2 } from "lucide-react"
import type { TFunction } from "i18next"
import type { FormEvent, ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

/* eslint-disable react-hooks/incompatible-library */
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod/v4"

import { Button } from "@/components/ui/button"
import { generateId } from "@/lib/id-utils"
import { joinListText, splitListText, uniqueList } from "@/lib/list-utils"
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
import { useSaveJourneyMutation } from "@/features/bettertolive/journey/queries"
import { confirmUndoableDelete } from "@/features/bettertolive/shared/shopping-delete"
import type {
  EmotionalWeight,
  FormativePower,
  GrowthDomain,
  GrowthModuleData,
  GrowthNode,
  GrowthStability,
  MemoryAnchor,
  MemoryEntry,
  MemorySourceModule,
  MemoryType,
  MemoryWorkspaceModuleData,
  PrivacyLevel,
  ProcessingStatus,
} from "@/features/bettertolive/types"
import { cn } from "@/lib/utils"

export type EditingJourneyItem =
  | {
      kind: "memory"
      isNew: boolean
      memory: MemoryEntry | null
    }
  | {
      kind: "growth"
      isNew: boolean
      node: GrowthNode | null
    }
  | {
      kind: "anchor"
      isNew: boolean
      anchor: MemoryAnchor | null
    }
  | {
      kind: "reviewPrompt"
      isNew: boolean
      index: number | null
      value: string
    }
  | {
      kind: "thread"
      isNew: boolean
      index: number | null
      value: string
    }

type AnchorType = Extract<MemoryType, "地点" | "物件" | "人物" | "照片">

type JourneyEnumGroup =
  | "memoryType"
  | "emotionalWeight"
  | "processing"
  | "privacy"
  | "formativePower"
  | "sourceModule"
  | "growthDomain"
  | "growthStability"

type JourneySelectValue<T extends string> = T | typeof NONE_VALUE

const MEMORY_TYPES = ["事件", "地点", "物件", "人物", "照片", "领悟"] satisfies MemoryType[]

const EMOTIONAL_WEIGHTS = ["轻", "中性", "重", "很重"] satisfies EmotionalWeight[]

const PROCESSING_STATUSES = [
  "已整理",
  "正在理解",
  "暂不触碰",
  "决定不再细究",
  "开放问题",
  "想留给某人",
  "记不清的裂缝",
] satisfies ProcessingStatus[]

const PRIVACY_LEVELS = [
  "仅自己",
  "需二次确认",
  "指定的人",
  "未来可公开",
  "离世后可看",
] satisfies PrivacyLevel[]

const FORMATIVE_POWERS = ["极深", "较深", "中等", "轻微", "无"] satisfies FormativePower[]

const MEMORY_SOURCE_MODULES = [
  "手动录入",
  "反思",
  "记事",
  "记账",
  "关系",
  "情绪",
  "原则",
  "未来",
  "生命整理",
] satisfies MemorySourceModule[]

const GROWTH_DOMAINS = ["关系", "自我", "工作", "情绪能力", "生活方式"] satisfies GrowthDomain[]

const GROWTH_STABILITIES = [
  "偶尔还会退回去",
  "基本稳定",
  "已经完全内化",
] satisfies GrowthStability[]

const ANCHOR_TYPES = ["地点", "物件", "人物", "照片"] satisfies AnchorType[]

const NONE_VALUE = "__none__"

const JOURNEY_DIALOG_CONTENT_CLASS = "border border-foreground/10 bg-background shadow-lg"

const JOURNEY_DIALOG_HEADER_CLASS =
  "sticky top-0 z-10 -mx-4 -mt-4 border-b border-foreground/10 bg-background/95 px-4 pt-4 pb-3 pr-12 supports-[backdrop-filter]:bg-background/90 supports-[backdrop-filter]:backdrop-blur-xs"

const JOURNEY_DIALOG_SECTION_CLASS =
  "space-y-3 rounded-xl border border-foreground/10 bg-card/70 p-4"

const JOURNEY_DIALOG_FIELD_CLASS = "w-full border-foreground/15 bg-background shadow-sm"

const JOURNEY_DIALOG_FOOTER_CLASS =
  "sticky bottom-0 z-10 gap-2 border-foreground/10 bg-background/95 supports-[backdrop-filter]:bg-background/90 supports-[backdrop-filter]:backdrop-blur-xs"

type MemoryFormState = {
  title: string
  type: MemoryType
  primaryEra: string
  eraText: string
  emotionalWeight: EmotionalWeight
  processing: ProcessingStatus
  privacy: PrivacyLevel
  formativePower: FormativePower | typeof NONE_VALUE
  summary: string
  impact: string
  sensoryCue: string
  sourceModulesText: string
  tagsText: string
}

type GrowthFormState = {
  title: string
  domain: GrowthDomain
  stability: GrowthStability
  before: string
  after: string
  keyEvent: string
  beforeMemoryIdsText: string
  afterMemoryIdsText: string
  triggerMemoryId: string
  evidenceText: string
}

type AnchorFormState = {
  type: AnchorType
  label: string
  note: string
  linkedMemoryIdsText: string
}

function replaceById<T extends { id: string }>(items: T[], nextItem: T, isNew: boolean) {
  if (isNew) {
    return [nextItem, ...items]
  }

  return items.map((item) => (item.id === nextItem.id ? nextItem : item))
}

function removeById<T extends { id: string }>(items: T[], id: string) {
  return items.filter((item) => item.id !== id)
}

function replaceAt<T>(items: T[], index: number | null, nextItem: T, isNew: boolean) {
  if (isNew || index === null || index < 0 || index >= items.length) {
    return [...items, nextItem]
  }

  return items.map((item, itemIndex) => (itemIndex === index ? nextItem : item))
}

function removeAt<T>(items: T[], index: number | null) {
  if (index === null || index < 0 || index >= items.length) {
    return items
  }

  return items.filter((_, itemIndex) => itemIndex !== index)
}

function translateJourneyEnum(t: TFunction, group: JourneyEnumGroup, value: string | undefined) {
  if (!value) return ""
  return t(`journey.enum.${group}.${value}`, value)
}

function createInitialMemoryForm(memory: MemoryEntry | null): MemoryFormState {
  return {
    title: memory?.title ?? "",
    type: memory?.type ?? MEMORY_TYPES[0],
    primaryEra: memory?.primaryEra ?? "",
    eraText: joinListText(memory?.era, "\n"),
    emotionalWeight: memory?.emotionalWeight ?? EMOTIONAL_WEIGHTS[1],
    processing: memory?.processing ?? PROCESSING_STATUSES[1],
    privacy: memory?.privacy ?? PRIVACY_LEVELS[0],
    formativePower: memory?.formativePower ?? NONE_VALUE,
    summary: memory?.summary ?? "",
    impact: memory?.impact ?? "",
    sensoryCue: memory?.sensoryCue ?? "",
    sourceModulesText: joinListText(memory?.sourceModules ?? ["手动录入"], "\n"),
    tagsText: joinListText(memory?.tags, "\n"),
  }
}

function createInitialGrowthForm(node: GrowthNode | null, memory: MemoryWorkspaceModuleData) {
  const fallbackMemoryId = memory.memories[0]?.id ?? ""

  return {
    title: node?.title ?? "",
    domain: node?.domain ?? GROWTH_DOMAINS[0],
    stability: node?.stability ?? GROWTH_STABILITIES[0],
    before: node?.before ?? "",
    after: node?.after ?? "",
    keyEvent: node?.keyEvent ?? "",
    beforeMemoryIdsText: joinListText(node?.beforeMemoryIds, "\n"),
    afterMemoryIdsText: joinListText(node?.afterMemoryIds, "\n"),
    triggerMemoryId: node?.triggerMemoryId ?? fallbackMemoryId,
    evidenceText: joinListText(node?.evidence, "\n"),
  } satisfies GrowthFormState
}

function createInitialAnchorForm(anchor: MemoryAnchor | null): AnchorFormState {
  return {
    type: anchor?.type ?? ANCHOR_TYPES[0],
    label: anchor?.label ?? "",
    note: anchor?.note ?? "",
    linkedMemoryIdsText: joinListText(anchor?.linkedMemoryIds, "\n"),
  }
}

function normalizeSourceModules(text: string): MemorySourceModule[] {
  const sourceModules = splitListText(text).filter((source): source is MemorySourceModule =>
    MEMORY_SOURCE_MODULES.includes(source as MemorySourceModule),
  )

  return sourceModules.length > 0
    ? (uniqueList(sourceModules) as MemorySourceModule[])
    : ["手动录入"]
}

function normalizeMemoryIds(text: string, validMemoryIds: Set<string>) {
  return uniqueList(splitListText(text)).filter((memoryId) => validMemoryIds.has(memoryId))
}

function createMemoryFromForm(seed: MemoryEntry | null, form: MemoryFormState): MemoryEntry {
  const primaryEra = form.primaryEra.trim()
  const era = uniqueList([primaryEra, ...splitListText(form.eraText)])

  return {
    id: seed?.id ?? generateId("memory"),
    title: form.title.trim(),
    type: form.type,
    era,
    primaryEra,
    emotionalWeight: form.emotionalWeight,
    processing: form.processing,
    privacy: form.privacy,
    formativePower: form.formativePower === NONE_VALUE ? undefined : form.formativePower,
    summary: form.summary.trim(),
    impact: form.impact.trim(),
    sourceModules: normalizeSourceModules(form.sourceModulesText),
    sensoryCue: form.sensoryCue.trim() || undefined,
    tags: uniqueList(splitListText(form.tagsText)),
  }
}

function createGrowthNodeFromForm(
  seed: GrowthNode | null,
  form: GrowthFormState,
  validMemoryIds: Set<string>,
): GrowthNode {
  return {
    id: seed?.id ?? generateId("growth-node"),
    title: form.title.trim(),
    domain: form.domain,
    stability: form.stability,
    before: form.before.trim(),
    after: form.after.trim(),
    keyEvent: form.keyEvent.trim(),
    beforeMemoryIds: normalizeMemoryIds(form.beforeMemoryIdsText, validMemoryIds),
    afterMemoryIds: normalizeMemoryIds(form.afterMemoryIdsText, validMemoryIds),
    triggerMemoryId: form.triggerMemoryId,
    evidence: uniqueList(splitListText(form.evidenceText)),
  }
}

function createAnchorFromForm(
  seed: MemoryAnchor | null,
  form: AnchorFormState,
  validMemoryIds: Set<string>,
) {
  return {
    id: seed?.id ?? generateId("memory-anchor"),
    type: form.type,
    label: form.label.trim(),
    note: form.note.trim(),
    linkedMemoryIds: normalizeMemoryIds(form.linkedMemoryIdsText, validMemoryIds),
  } satisfies MemoryAnchor
}

function cleanupMemoryReferences(
  growth: GrowthModuleData,
  memory: MemoryWorkspaceModuleData,
  deletedMemoryId: string,
) {
  const remainingMemoryIds = new Set(
    memory.memories.filter((entry) => entry.id !== deletedMemoryId).map((entry) => entry.id),
  )
  const nextMemory: MemoryWorkspaceModuleData = {
    ...memory,
    memories: memory.memories.filter((entry) => entry.id !== deletedMemoryId),
    anchors: memory.anchors
      .map((anchor) => ({
        ...anchor,
        linkedMemoryIds: anchor.linkedMemoryIds.filter((memoryId) => memoryId !== deletedMemoryId),
      }))
      .filter((anchor) => anchor.linkedMemoryIds.length > 0),
  }
  const nextGrowth: GrowthModuleData = {
    ...growth,
    growthNodes: growth.growthNodes
      .map((node) => {
        const beforeMemoryIds = node.beforeMemoryIds.filter((memoryId) =>
          remainingMemoryIds.has(memoryId),
        )
        const afterMemoryIds = node.afterMemoryIds.filter((memoryId) =>
          remainingMemoryIds.has(memoryId),
        )
        const triggerMemoryId = remainingMemoryIds.has(node.triggerMemoryId)
          ? node.triggerMemoryId
          : (beforeMemoryIds[0] ?? afterMemoryIds[0] ?? "")

        return {
          ...node,
          beforeMemoryIds,
          afterMemoryIds,
          triggerMemoryId,
        }
      })
      .filter((node) => node.triggerMemoryId),
  }

  return { growth: nextGrowth, memory: nextMemory }
}

export function JourneyEditDialog({
  editing,
  growth,
  memory,
  onClose,
}: {
  editing: EditingJourneyItem
  growth: GrowthModuleData
  memory: MemoryWorkspaceModuleData
  onClose: () => void
}) {
  switch (editing.kind) {
    case "memory":
      return (
        <JourneyMemoryEditDialog
          editing={editing}
          growth={growth}
          memory={memory}
          onClose={onClose}
        />
      )
    case "growth":
      return (
        <JourneyGrowthNodeEditDialog
          editing={editing}
          growth={growth}
          memory={memory}
          onClose={onClose}
        />
      )
    case "anchor":
      return (
        <JourneyAnchorEditDialog
          editing={editing}
          growth={growth}
          memory={memory}
          onClose={onClose}
        />
      )
    case "reviewPrompt":
    case "thread":
      return (
        <JourneyTextEditDialog
          editing={editing}
          growth={growth}
          memory={memory}
          onClose={onClose}
        />
      )
  }
}

const memoryFormSchema = z.object({
  title: z.string().min(1),
  type: z.string(),
  primaryEra: z.string().min(1),
  eraText: z.string(),
  emotionalWeight: z.string(),
  processing: z.string(),
  privacy: z.string(),
  formativePower: z.string(),
  summary: z.string().min(1),
  impact: z.string().min(1),
  sensoryCue: z.string(),
  sourceModulesText: z.string(),
  tagsText: z.string(),
})

type MemoryFormValues = z.infer<typeof memoryFormSchema>

const growthFormSchema = z.object({
  title: z.string().min(1),
  domain: z.string(),
  stability: z.string(),
  before: z.string().min(1),
  after: z.string().min(1),
  keyEvent: z.string().min(1),
  beforeMemoryIdsText: z.string(),
  afterMemoryIdsText: z.string(),
  triggerMemoryId: z.string(),
  evidenceText: z.string(),
})

type GrowthFormValues = z.infer<typeof growthFormSchema>

const anchorFormSchema = z.object({
  type: z.string(),
  label: z.string().min(1),
  note: z.string().min(1),
  linkedMemoryIdsText: z.string(),
})

type AnchorFormValues = z.infer<typeof anchorFormSchema>

const textEditFormSchema = z.object({
  value: z.string().min(1),
})

type TextEditFormValues = z.infer<typeof textEditFormSchema>

function JourneyMemoryEditDialog({
  editing,
  growth,
  memory,
  onClose,
}: {
  editing: Extract<EditingJourneyItem, { kind: "memory" }>
  growth: GrowthModuleData
  memory: MemoryWorkspaceModuleData
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveJourneyMutation = useSaveJourneyMutation()
  const rhf = useForm<MemoryFormValues>({
    resolver: zodResolver(memoryFormSchema),
    defaultValues: createInitialMemoryForm(editing.memory) as MemoryFormValues,
  })

  const handleFormSubmit = rhf.handleSubmit(async (values) => {
    const nextMemory = createMemoryFromForm(editing.memory, values as MemoryFormState)

    try {
      await saveJourneyMutation.mutateAsync({
        growth,
        memory: {
          ...memory,
          memories: replaceById(memory.memories, nextMemory, editing.isNew),
        },
      })
      toast.success(t("common.toast.saved"))
      onClose()
    } catch {
      // mutation.onError 已处理错误提示
    }
  })

  const canSubmit = rhf.formState.isValid
  const form = rhf.watch() as MemoryFormState
  const updateForm = (patch: Partial<MemoryFormState>) => {
    for (const [key, value] of Object.entries(patch)) {
      rhf.setValue(key as keyof MemoryFormValues, value, { shouldValidate: true })
    }
  }

  const handleDelete = () => {
    if (!editing.memory) return

    confirmUndoableDelete({
      confirmMessage: t("journey.confirm.deleteMemory"),
      pendingMessage: t("common.toast.deletePending", { name: editing.memory.title }),
      successMessage: t("common.toast.deleted"),
      failureMessage: t("common.toast.deleteFailed"),
      undoLabel: t("common.actions.undo"),
      undoneMessage: t("common.toast.deleteUndone", { name: editing.memory.title }),
      onDelete: () =>
        saveJourneyMutation.mutateAsync(
          cleanupMemoryReferences(growth, memory, editing.memory!.id),
        ),
      onDeleted: () => onClose(),
    })
  }

  return (
    <JourneyDialogFrame
      title={
        editing.isNew ? t("journey.edit.memoryCreateTitle") : t("journey.edit.memoryEditTitle")
      }
      description={t("journey.edit.memoryDescription")}
      isPending={saveJourneyMutation.isPending}
      canSubmit={canSubmit}
      deleteLabel={editing.isNew ? undefined : t("common.actions.delete")}
      onDelete={editing.isNew ? undefined : handleDelete}
      onClose={onClose}
      onSubmit={handleFormSubmit}
    >
      <section className={JOURNEY_DIALOG_SECTION_CLASS}>
        <JourneyField label={t("journey.fields.title")}>
          <Input
            value={form.title}
            onChange={(event) => updateForm({ title: event.target.value })}
            className={JOURNEY_DIALOG_FIELD_CLASS}
          />
        </JourneyField>

        <div className="grid gap-3 min-[760px]:grid-cols-2">
          <JourneySelectField
            enumGroup="memoryType"
            label={t("journey.fields.type")}
            options={MEMORY_TYPES}
            value={form.type}
            onChange={(value) => updateForm({ type: value as MemoryType })}
          />
          <JourneySelectField
            enumGroup="emotionalWeight"
            label={t("journey.fields.emotionalWeight")}
            options={EMOTIONAL_WEIGHTS}
            value={form.emotionalWeight}
            onChange={(value) => updateForm({ emotionalWeight: value as EmotionalWeight })}
          />
          <JourneySelectField
            enumGroup="processing"
            label={t("journey.fields.processing")}
            options={PROCESSING_STATUSES}
            value={form.processing}
            onChange={(value) => updateForm({ processing: value as ProcessingStatus })}
          />
          <JourneySelectField
            enumGroup="privacy"
            label={t("journey.fields.privacy")}
            options={PRIVACY_LEVELS}
            value={form.privacy}
            onChange={(value) => updateForm({ privacy: value as PrivacyLevel })}
          />
        </div>

        <div className="grid gap-3 min-[760px]:grid-cols-2">
          <JourneyField label={t("journey.fields.primaryEra")}>
            <Input
              value={form.primaryEra}
              onChange={(event) => updateForm({ primaryEra: event.target.value })}
              className={JOURNEY_DIALOG_FIELD_CLASS}
            />
          </JourneyField>
          <JourneySelectField
            enumGroup="formativePower"
            label={t("journey.fields.formativePower")}
            options={FORMATIVE_POWERS}
            value={form.formativePower}
            noneLabel={t("journey.edit.none")}
            onChange={(value) => updateForm({ formativePower: value })}
          />
        </div>

        <JourneyField label={t("journey.fields.eras")} hint={t("journey.edit.listHint")}>
          <Textarea
            value={form.eraText}
            onChange={(event) => updateForm({ eraText: event.target.value })}
            className={cn(JOURNEY_DIALOG_FIELD_CLASS, "min-h-20")}
          />
        </JourneyField>

        <JourneyField label={t("journey.fields.summary")}>
          <Textarea
            value={form.summary}
            onChange={(event) => updateForm({ summary: event.target.value })}
            className={cn(JOURNEY_DIALOG_FIELD_CLASS, "min-h-24")}
          />
        </JourneyField>

        <JourneyField label={t("journey.fields.impact")}>
          <Textarea
            value={form.impact}
            onChange={(event) => updateForm({ impact: event.target.value })}
            className={cn(JOURNEY_DIALOG_FIELD_CLASS, "min-h-24")}
          />
        </JourneyField>

        <JourneyField label={t("journey.fields.sensoryCue")}>
          <Input
            value={form.sensoryCue}
            onChange={(event) => updateForm({ sensoryCue: event.target.value })}
            className={JOURNEY_DIALOG_FIELD_CLASS}
          />
        </JourneyField>

        <div className="grid gap-3 min-[760px]:grid-cols-2">
          <JourneyField
            label={t("journey.fields.sourceModules")}
            hint={t("journey.edit.sourceModulesHint")}
          >
            <Textarea
              value={form.sourceModulesText}
              onChange={(event) => updateForm({ sourceModulesText: event.target.value })}
              className={cn(JOURNEY_DIALOG_FIELD_CLASS, "min-h-24")}
            />
          </JourneyField>
          <JourneyField label={t("journey.fields.tags")} hint={t("journey.edit.listHint")}>
            <Textarea
              value={form.tagsText}
              onChange={(event) => updateForm({ tagsText: event.target.value })}
              className={cn(JOURNEY_DIALOG_FIELD_CLASS, "min-h-24")}
            />
          </JourneyField>
        </div>
      </section>
    </JourneyDialogFrame>
  )
}

function JourneyGrowthNodeEditDialog({
  editing,
  growth,
  memory,
  onClose,
}: {
  editing: Extract<EditingJourneyItem, { kind: "growth" }>
  growth: GrowthModuleData
  memory: MemoryWorkspaceModuleData
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveJourneyMutation = useSaveJourneyMutation()
  const validMemoryIds = new Set(memory.memories.map((entry) => entry.id))
  const growthSchemaWithIds = growthFormSchema.superRefine((data, ctx) => {
    if (!validMemoryIds.has(data.triggerMemoryId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["triggerMemoryId"],
        message: "Invalid memory ID",
      })
    }
  })
  const rhf = useForm<GrowthFormValues>({
    resolver: zodResolver(growthSchemaWithIds),
    defaultValues: createInitialGrowthForm(editing.node, memory) as GrowthFormValues,
  })

  const handleFormSubmit = rhf.handleSubmit(async (values) => {
    const nextNode = createGrowthNodeFromForm(
      editing.node,
      values as GrowthFormState,
      validMemoryIds,
    )

    try {
      await saveJourneyMutation.mutateAsync({
        growth: {
          ...growth,
          growthNodes: replaceById(growth.growthNodes, nextNode, editing.isNew),
        },
        memory,
      })
      toast.success(t("common.toast.saved"))
      onClose()
    } catch {
      // mutation.onError 已处理错误提示
    }
  })

  const canSubmit = rhf.formState.isValid
  const form = rhf.watch() as GrowthFormState
  const updateForm = (patch: Partial<GrowthFormState>) => {
    for (const [key, value] of Object.entries(patch)) {
      rhf.setValue(key as keyof GrowthFormValues, value, { shouldValidate: true })
    }
  }

  const handleDelete = () => {
    if (!editing.node) return

    confirmUndoableDelete({
      confirmMessage: t("journey.confirm.deleteGrowth"),
      pendingMessage: t("common.toast.deletePending", { name: editing.node.title }),
      successMessage: t("common.toast.deleted"),
      failureMessage: t("common.toast.deleteFailed"),
      undoLabel: t("common.actions.undo"),
      undoneMessage: t("common.toast.deleteUndone", { name: editing.node.title }),
      onDelete: () =>
        saveJourneyMutation.mutateAsync({
          growth: {
            ...growth,
            growthNodes: removeById(growth.growthNodes, editing.node!.id),
          },
          memory,
        }),
      onDeleted: () => onClose(),
    })
  }

  return (
    <JourneyDialogFrame
      title={
        editing.isNew ? t("journey.edit.growthCreateTitle") : t("journey.edit.growthEditTitle")
      }
      description={t("journey.edit.growthDescription")}
      isPending={saveJourneyMutation.isPending}
      canSubmit={canSubmit}
      deleteLabel={editing.isNew ? undefined : t("common.actions.delete")}
      onDelete={editing.isNew ? undefined : handleDelete}
      onClose={onClose}
      onSubmit={handleFormSubmit}
    >
      <section className={JOURNEY_DIALOG_SECTION_CLASS}>
        <JourneyField label={t("journey.fields.title")}>
          <Input
            value={form.title}
            onChange={(event) => updateForm({ title: event.target.value })}
            className={JOURNEY_DIALOG_FIELD_CLASS}
          />
        </JourneyField>

        <div className="grid gap-3 min-[760px]:grid-cols-2">
          <JourneySelectField
            enumGroup="growthDomain"
            label={t("journey.fields.domain")}
            options={GROWTH_DOMAINS}
            value={form.domain}
            onChange={(value) => updateForm({ domain: value as GrowthDomain })}
          />
          <JourneySelectField
            enumGroup="growthStability"
            label={t("journey.fields.stability")}
            options={GROWTH_STABILITIES}
            value={form.stability}
            onChange={(value) => updateForm({ stability: value as GrowthStability })}
          />
        </div>

        <div className="grid gap-3 min-[760px]:grid-cols-2">
          <JourneyField label={t("journey.fields.before")}>
            <Textarea
              value={form.before}
              onChange={(event) => updateForm({ before: event.target.value })}
              className={cn(JOURNEY_DIALOG_FIELD_CLASS, "min-h-24")}
            />
          </JourneyField>
          <JourneyField label={t("journey.fields.after")}>
            <Textarea
              value={form.after}
              onChange={(event) => updateForm({ after: event.target.value })}
              className={cn(JOURNEY_DIALOG_FIELD_CLASS, "min-h-24")}
            />
          </JourneyField>
        </div>

        <JourneyField label={t("journey.fields.keyEvent")}>
          <Textarea
            value={form.keyEvent}
            onChange={(event) => updateForm({ keyEvent: event.target.value })}
            className={cn(JOURNEY_DIALOG_FIELD_CLASS, "min-h-20")}
          />
        </JourneyField>

        <JourneySelectField
          label={t("journey.fields.triggerMemory")}
          options={memory.memories.map((entry) => entry.id)}
          renderOption={(value) =>
            memory.memories.find((entry) => entry.id === value)?.title ?? value
          }
          value={form.triggerMemoryId}
          onChange={(value) => updateForm({ triggerMemoryId: value })}
        />

        <MemoryIdReference memories={memory.memories} />

        <div className="grid gap-3 min-[760px]:grid-cols-2">
          <JourneyField
            label={t("journey.fields.beforeMemoryIds")}
            hint={t("journey.edit.memoryIdsHint")}
          >
            <Textarea
              value={form.beforeMemoryIdsText}
              onChange={(event) => updateForm({ beforeMemoryIdsText: event.target.value })}
              className={cn(JOURNEY_DIALOG_FIELD_CLASS, "min-h-24")}
            />
          </JourneyField>
          <JourneyField
            label={t("journey.fields.afterMemoryIds")}
            hint={t("journey.edit.memoryIdsHint")}
          >
            <Textarea
              value={form.afterMemoryIdsText}
              onChange={(event) => updateForm({ afterMemoryIdsText: event.target.value })}
              className={cn(JOURNEY_DIALOG_FIELD_CLASS, "min-h-24")}
            />
          </JourneyField>
        </div>

        <JourneyField label={t("journey.fields.evidence")} hint={t("journey.edit.listHint")}>
          <Textarea
            value={form.evidenceText}
            onChange={(event) => updateForm({ evidenceText: event.target.value })}
            className={cn(JOURNEY_DIALOG_FIELD_CLASS, "min-h-24")}
          />
        </JourneyField>
      </section>
    </JourneyDialogFrame>
  )
}

function JourneyAnchorEditDialog({
  editing,
  growth,
  memory,
  onClose,
}: {
  editing: Extract<EditingJourneyItem, { kind: "anchor" }>
  growth: GrowthModuleData
  memory: MemoryWorkspaceModuleData
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveJourneyMutation = useSaveJourneyMutation()
  const validMemoryIds = new Set(memory.memories.map((entry) => entry.id))
  const rhf = useForm<AnchorFormValues>({
    resolver: zodResolver(anchorFormSchema),
    defaultValues: createInitialAnchorForm(editing.anchor) as AnchorFormValues,
  })

  const handleFormSubmit = rhf.handleSubmit(async (values) => {
    const nextAnchor = createAnchorFromForm(
      editing.anchor,
      values as AnchorFormState,
      validMemoryIds,
    )

    try {
      await saveJourneyMutation.mutateAsync({
        growth,
        memory: {
          ...memory,
          anchors: replaceById(memory.anchors, nextAnchor, editing.isNew),
        },
      })
      toast.success(t("common.toast.saved"))
      onClose()
    } catch {
      // mutation.onError 已处理错误提示
    }
  })

  const canSubmit = rhf.formState.isValid
  const form = rhf.watch() as AnchorFormState
  const updateForm = (patch: Partial<AnchorFormState>) => {
    for (const [key, value] of Object.entries(patch)) {
      rhf.setValue(key as keyof AnchorFormValues, value, { shouldValidate: true })
    }
  }

  const handleDelete = () => {
    if (!editing.anchor) return

    confirmUndoableDelete({
      confirmMessage: t("journey.confirm.deleteAnchor"),
      pendingMessage: t("common.toast.deletePending", { name: editing.anchor.label }),
      successMessage: t("common.toast.deleted"),
      failureMessage: t("common.toast.deleteFailed"),
      undoLabel: t("common.actions.undo"),
      undoneMessage: t("common.toast.deleteUndone", { name: editing.anchor.label }),
      onDelete: () =>
        saveJourneyMutation.mutateAsync({
          growth,
          memory: {
            ...memory,
            anchors: removeById(memory.anchors, editing.anchor!.id),
          },
        }),
      onDeleted: () => onClose(),
    })
  }

  return (
    <JourneyDialogFrame
      title={
        editing.isNew ? t("journey.edit.anchorCreateTitle") : t("journey.edit.anchorEditTitle")
      }
      description={t("journey.edit.anchorDescription")}
      isPending={saveJourneyMutation.isPending}
      canSubmit={canSubmit}
      deleteLabel={editing.isNew ? undefined : t("common.actions.delete")}
      onDelete={editing.isNew ? undefined : handleDelete}
      onClose={onClose}
      onSubmit={handleFormSubmit}
    >
      <section className={JOURNEY_DIALOG_SECTION_CLASS}>
        <JourneySelectField
          enumGroup="memoryType"
          label={t("journey.fields.type")}
          options={ANCHOR_TYPES}
          value={form.type}
          onChange={(value) => updateForm({ type: value as AnchorType })}
        />
        <JourneyField label={t("journey.fields.label")}>
          <Input
            value={form.label}
            onChange={(event) => updateForm({ label: event.target.value })}
            className={JOURNEY_DIALOG_FIELD_CLASS}
          />
        </JourneyField>
        <JourneyField label={t("journey.fields.note")}>
          <Textarea
            value={form.note}
            onChange={(event) => updateForm({ note: event.target.value })}
            className={cn(JOURNEY_DIALOG_FIELD_CLASS, "min-h-24")}
          />
        </JourneyField>
        <MemoryIdReference memories={memory.memories} />
        <JourneyField
          label={t("journey.fields.linkedMemoryIds")}
          hint={t("journey.edit.memoryIdsHint")}
        >
          <Textarea
            value={form.linkedMemoryIdsText}
            onChange={(event) => updateForm({ linkedMemoryIdsText: event.target.value })}
            className={cn(JOURNEY_DIALOG_FIELD_CLASS, "min-h-24")}
          />
        </JourneyField>
      </section>
    </JourneyDialogFrame>
  )
}

function JourneyTextEditDialog({
  editing,
  growth,
  memory,
  onClose,
}: {
  editing: Extract<EditingJourneyItem, { kind: "reviewPrompt" | "thread" }>
  growth: GrowthModuleData
  memory: MemoryWorkspaceModuleData
  onClose: () => void
}) {
  const { t } = useTranslation()
  const saveJourneyMutation = useSaveJourneyMutation()
  const rhf = useForm<TextEditFormValues>({
    resolver: zodResolver(textEditFormSchema),
    defaultValues: { value: editing.value },
  })
  const isThread = editing.kind === "thread"

  const handleFormSubmit = rhf.handleSubmit(async (values) => {
    try {
      await saveJourneyMutation.mutateAsync({
        growth: isThread
          ? {
              ...growth,
              threads: replaceAt(growth.threads, editing.index, values.value.trim(), editing.isNew),
            }
          : growth,
        memory: isThread
          ? memory
          : {
              ...memory,
              reviewPrompts: replaceAt(
                memory.reviewPrompts,
                editing.index,
                values.value.trim(),
                editing.isNew,
              ),
            },
      })
      toast.success(t("common.toast.saved"))
      onClose()
    } catch {
      // mutation.onError 已处理错误提示
    }
  })

  const canSubmit = rhf.formState.isValid

  const handleDelete = () => {
    if (editing.isNew) return
    const confirmKey = isThread ? "journey.confirm.deleteThread" : "journey.confirm.deletePrompt"

    confirmUndoableDelete({
      confirmMessage: t(confirmKey),
      pendingMessage: t("common.toast.deletePending", { name: "" }),
      successMessage: t("common.toast.deleted"),
      failureMessage: t("common.toast.deleteFailed"),
      undoLabel: t("common.actions.undo"),
      undoneMessage: t("common.toast.deleteUndone", { name: "" }),
      onDelete: () =>
        saveJourneyMutation.mutateAsync({
          growth: isThread
            ? {
                ...growth,
                threads: removeAt(growth.threads, editing.index),
              }
            : growth,
          memory: isThread
            ? memory
            : {
                ...memory,
                reviewPrompts: removeAt(memory.reviewPrompts, editing.index),
              },
        }),
      onDeleted: () => onClose(),
    })
  }

  return (
    <JourneyDialogFrame
      title={
        isThread
          ? editing.isNew
            ? t("journey.edit.threadCreateTitle")
            : t("journey.edit.threadEditTitle")
          : editing.isNew
            ? t("journey.edit.promptCreateTitle")
            : t("journey.edit.promptEditTitle")
      }
      description={
        isThread ? t("journey.edit.threadDescription") : t("journey.edit.promptDescription")
      }
      isPending={saveJourneyMutation.isPending}
      canSubmit={canSubmit}
      deleteLabel={editing.isNew ? undefined : t("common.actions.delete")}
      onDelete={editing.isNew ? undefined : handleDelete}
      onClose={onClose}
      onSubmit={handleFormSubmit}
    >
      <section className={JOURNEY_DIALOG_SECTION_CLASS}>
        <JourneyField label={isThread ? t("journey.fields.thread") : t("journey.fields.prompt")}>
          <Controller
            control={rhf.control}
            name="value"
            render={({ field }) => (
              <Textarea
                value={field.value}
                onChange={field.onChange}
                className={cn(JOURNEY_DIALOG_FIELD_CLASS, "min-h-32")}
              />
            )}
          />
        </JourneyField>
      </section>
    </JourneyDialogFrame>
  )
}

function JourneyDialogFrame({
  title,
  description,
  children,
  isPending,
  canSubmit = true,
  deleteLabel,
  onDelete,
  onClose,
  onSubmit,
}: {
  title: string
  description: string
  children: ReactNode
  isPending: boolean
  canSubmit?: boolean
  deleteLabel?: string
  onDelete?: () => void
  onClose: () => void
  onSubmit: (event: FormEvent) => void
}) {
  const { t } = useTranslation()

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent
        className={cn(
          JOURNEY_DIALOG_CONTENT_CLASS,
          "flex max-h-[min(760px,calc(100dvh-2rem))] max-w-5xl flex-col overflow-hidden",
        )}
      >
        <DialogHeader className={JOURNEY_DIALOG_HEADER_CLASS}>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1 pr-2">{children}</div>

          <DialogFooter className={JOURNEY_DIALOG_FOOTER_CLASS}>
            {onDelete ? (
              <Button
                type="button"
                variant="destructive"
                className="mr-auto"
                disabled={isPending}
                onClick={onDelete}
              >
                <Trash2 className="size-4" />
                {deleteLabel}
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={onClose}>
              {t("common.actions.cancel")}
            </Button>
            <Button type="submit" disabled={isPending || !canSubmit}>
              {isPending ? t("common.actions.saving") : t("common.actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function JourneyField({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <Label className="grid gap-2 text-xs font-medium text-[color:var(--text-primary)]">
      <span>{label}</span>
      {children}
      {hint ? (
        <span className="text-[11px] font-normal text-[color:var(--text-muted)]">{hint}</span>
      ) : null}
    </Label>
  )
}

function JourneySelectField<T extends string>({
  label,
  options,
  value,
  enumGroup,
  noneLabel,
  renderOption,
  onChange,
}: {
  label: string
  options: readonly T[]
  value: JourneySelectValue<T>
  enumGroup?: JourneyEnumGroup
  noneLabel?: string
  renderOption?: (value: T) => string
  onChange: (value: JourneySelectValue<T>) => void
}) {
  const { t } = useTranslation()

  return (
    <JourneyField label={label}>
      <Select<JourneySelectValue<T>>
        value={value}
        onValueChange={(nextValue) => {
          if (nextValue !== null) {
            onChange(nextValue)
          }
        }}
      >
        <SelectTrigger className={JOURNEY_DIALOG_FIELD_CLASS}>
          <SelectValue placeholder={label} />
        </SelectTrigger>
        <SelectContent>
          {noneLabel ? <SelectItem value={NONE_VALUE}>{noneLabel}</SelectItem> : null}
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {renderOption?.(option) ??
                (enumGroup ? translateJourneyEnum(t, enumGroup, option) : option)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </JourneyField>
  )
}

function MemoryIdReference({ memories }: { memories: MemoryEntry[] }) {
  const { t } = useTranslation()

  if (memories.length === 0) {
    return null
  }

  return (
    <div className="rounded-xl border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-3 py-3">
      <div className="text-xs font-medium text-[color:var(--text-primary)]">
        {t("journey.edit.memoryIdReference")}
      </div>
      <div className="mt-2 grid gap-1.5 text-[11px] text-[color:var(--text-muted)]">
        {memories.map((entry) => (
          <div key={entry.id} className="break-all">
            <span className="font-mono text-[color:var(--text-secondary)]">{entry.id}</span>
            <span> · {entry.title}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
