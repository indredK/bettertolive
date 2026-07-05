import type { TFunction } from "i18next"

import type {
  EmotionalLoad,
  LegacyCategory,
  LegacyItem,
  LegacyItemForm,
  LegacyRecipient,
  LegacyStatus,
  LegacyUrgency,
  LegacyVisibility,
} from "@/features/bettertolive/types"

export const LEGACY_CATEGORIES = [
  "重要交代",
  "留给某人的话",
  "人生回顾",
  "未完成的事",
  "纪念偏好",
] satisfies LegacyCategory[]

export const LEGACY_RECIPIENTS = [
  "特定的人",
  "家人",
  "朋友",
  "公开",
  "仅自己",
] satisfies LegacyRecipient[]

export const LEGACY_URGENCIES = ["关键信息", "重要", "锦上添花", "可选"] satisfies LegacyUrgency[]

export const LEGACY_VISIBILITIES = [
  "现在",
  "某个时间后",
  "我离世后",
  "条件触发",
  "永不交付",
] satisfies LegacyVisibility[]

export const LEGACY_STATUSES = [
  "草稿",
  "基本完成",
  "已完成",
  "会持续更新",
  "最终版",
] satisfies LegacyStatus[]

export const EMOTIONAL_LOADS = ["很重", "中等", "轻微", "平静"] satisfies EmotionalLoad[]

export const LEGACY_STATUS_FINAL = "最终版" satisfies LegacyStatus
export const LEGACY_STATUS_BASIC_COMPLETE = "基本完成" satisfies LegacyStatus
export const LEGACY_RECIPIENT_SELF = "仅自己" satisfies LegacyRecipient
export const LEGACY_EMOTIONAL_LOAD_HEAVY = "很重" satisfies EmotionalLoad
export const LEGACY_VISIBILITY_AFTER_DEATH = "我离世后" satisfies LegacyVisibility
export const LEGACY_URGENCY_CRITICAL = "关键信息" satisfies LegacyUrgency
export const LEGACY_CATEGORY_DIRECTIVE = "重要交代" satisfies LegacyCategory
export const LEGACY_CATEGORY_LETTER = "留给某人的话" satisfies LegacyCategory

export type LegacyDistributionRow<T extends string = string> = {
  label: T
  count: number
}

export type LegacySignalFilter =
  "all" | "missingDelivery" | "locked" | "aiExcluded" | "secondConfirm"

export type LegacyDeliveryWarningKind =
  "missingDelivery" | "missingRecipient" | "criticalDraft" | "finalUnlocked"

export type LegacyDeliveryWarning = {
  kind: LegacyDeliveryWarningKind
  itemId: string
}

export type LegacyDeliverySection = {
  visibility: LegacyVisibility
  items: LegacyItem[]
  warnings: LegacyDeliveryWarning[]
}

export type LegacyDeliveryGroup = {
  key: string
  recipient: LegacyRecipient
  recipientName?: string
  items: LegacyItem[]
  sections: LegacyDeliverySection[]
}

export type LegacyStats = {
  totalCount: number
  criticalDraftCount: number
  missingDeliveryConditionCount: number
  finalLockedCount: number
  heavyLoadCount: number
  aiExcludedCount: number
  secondConfirmCount: number
}

export type LegacyRelationshipBuckets = {
  now: LegacyItem[]
  future: LegacyItem[]
  private: LegacyItem[]
  unlinked: LegacyItem[]
}

const COMPLETE_STATUSES = new Set<LegacyStatus>(["已完成", LEGACY_STATUS_FINAL])
const DELIVERY_CONDITION_VISIBILITIES = new Set<LegacyVisibility>([
  "某个时间后",
  LEGACY_VISIBILITY_AFTER_DEATH,
  "条件触发",
])

export function translateLegacyEnum(t: TFunction, group: string, value: string) {
  return t(`legacy.enum.${group}.${value}`, value)
}

export function requiresDeliveryCondition(visibility: LegacyVisibility) {
  return DELIVERY_CONDITION_VISIBILITIES.has(visibility)
}

export function isLegacyComplete(status: LegacyStatus) {
  return COMPLETE_STATUSES.has(status)
}

export function legacyRecipientLabel(item: LegacyItem, t: TFunction) {
  const recipient = translateLegacyEnum(t, "recipient", item.recipient)
  if (item.recipient === "特定的人" && item.recipientName) {
    return `${recipient} · ${item.recipientName}`
  }
  if (item.recipientName && item.recipient !== LEGACY_RECIPIENT_SELF) {
    return `${recipient} · ${item.recipientName}`
  }
  return recipient
}

export function createLegacyDistribution<T extends string>(
  order: readonly T[],
  items: LegacyItem[],
  getValue: (item: LegacyItem) => T | undefined,
): Array<LegacyDistributionRow<T>> {
  const counts = new Map<T, number>()
  items.forEach((item) => {
    const value = getValue(item)
    if (value) {
      counts.set(value, (counts.get(value) ?? 0) + 1)
    }
  })

  return order.map((label) => ({
    label,
    count: counts.get(label) ?? 0,
  }))
}

export function buildLegacyStats(items: LegacyItem[]): LegacyStats {
  return {
    totalCount: items.length,
    criticalDraftCount: items.filter(
      (item) => item.urgency === LEGACY_URGENCY_CRITICAL && !isLegacyComplete(item.status),
    ).length,
    missingDeliveryConditionCount: items.filter(
      (item) => requiresDeliveryCondition(item.visibility) && !item.deliveryCondition?.trim(),
    ).length,
    finalLockedCount: items.filter((item) => item.status === LEGACY_STATUS_FINAL || item.isLocked)
      .length,
    heavyLoadCount: items.filter((item) => item.emotionalLoad === LEGACY_EMOTIONAL_LOAD_HEAVY)
      .length,
    aiExcludedCount: items.filter((item) => item.excludeFromAi).length,
    secondConfirmCount: items.filter((item) => item.requiresSecondConfirm).length,
  }
}

export function getLegacyDeliveryWarnings(item: LegacyItem): LegacyDeliveryWarning[] {
  const warnings: LegacyDeliveryWarning[] = []

  if (requiresDeliveryCondition(item.visibility) && !item.deliveryCondition?.trim()) {
    warnings.push({ kind: "missingDelivery", itemId: item.id })
  }
  if (item.recipient === "特定的人" && !item.recipientName?.trim() && !item.relatedRelationshipId) {
    warnings.push({ kind: "missingRecipient", itemId: item.id })
  }
  if (item.urgency === LEGACY_URGENCY_CRITICAL && !isLegacyComplete(item.status)) {
    warnings.push({ kind: "criticalDraft", itemId: item.id })
  }
  if (item.status === LEGACY_STATUS_FINAL && !item.isLocked) {
    warnings.push({ kind: "finalUnlocked", itemId: item.id })
  }

  return warnings
}

export function legacyWarningLabel(kind: LegacyDeliveryWarningKind, t: TFunction) {
  return t(`legacy.warnings.${kind}`, kind)
}

export function sortLegacyItems(items: LegacyItem[]) {
  const urgencyOrder = new Map<LegacyUrgency, number>(
    LEGACY_URGENCIES.map((urgency, index) => [urgency, index]),
  )

  return [...items].sort((a, b) => {
    const urgencyDelta = (urgencyOrder.get(a.urgency) ?? 99) - (urgencyOrder.get(b.urgency) ?? 99)
    if (urgencyDelta !== 0) return urgencyDelta
    return b.updatedAt.localeCompare(a.updatedAt)
  })
}

export function buildLegacyDeliveryGroups(items: LegacyItem[]): LegacyDeliveryGroup[] {
  const groups = new Map<string, LegacyItem[]>()

  sortLegacyItems(items).forEach((item) => {
    const key =
      item.recipient === "特定的人"
        ? `${item.recipient}:${item.recipientName ?? item.relatedRelationshipId ?? ""}`
        : item.recipient
    groups.set(key, [...(groups.get(key) ?? []), item])
  })

  return Array.from(groups.entries()).map(([key, groupItems]) => {
    const first = groupItems[0]
    const sections = LEGACY_VISIBILITIES.map((visibility) => {
      const sectionItems = groupItems.filter((item) => item.visibility === visibility)
      return {
        visibility,
        items: sectionItems,
        warnings: sectionItems.flatMap(getLegacyDeliveryWarnings),
      }
    }).filter((section) => section.items.length > 0)

    return {
      key,
      recipient: first.recipient,
      recipientName: first.recipientName,
      items: groupItems,
      sections,
    }
  })
}

export function buildLegacyRelationshipBuckets(items: LegacyItem[]): LegacyRelationshipBuckets {
  const expressionItems = sortLegacyItems(
    items.filter(
      (item) =>
        item.category === LEGACY_CATEGORY_LETTER ||
        (item.category === "未完成的事" &&
          Boolean(item.relatedRelationshipId || item.recipientName)),
    ),
  )

  return {
    now: expressionItems.filter((item) => item.visibility === "现在"),
    future: expressionItems.filter(
      (item) => item.visibility !== "现在" && item.recipient !== LEGACY_RECIPIENT_SELF,
    ),
    private: expressionItems.filter((item) => item.recipient === LEGACY_RECIPIENT_SELF),
    unlinked: expressionItems.filter(
      (item) =>
        item.recipient !== LEGACY_RECIPIENT_SELF &&
        !item.relatedRelationshipId &&
        (!item.recipientName || item.recipient === "特定的人"),
    ),
  }
}

export function createLegacyItemForm(item?: LegacyItem | null): LegacyItemForm {
  return {
    id: item?.id,
    title: item?.title ?? "",
    category: item?.category ?? LEGACY_CATEGORY_DIRECTIVE,
    recipient: item?.recipient ?? LEGACY_RECIPIENT_SELF,
    recipientName: item?.recipientName ?? "",
    relatedRelationshipId: item?.relatedRelationshipId ?? "",
    urgency: item?.urgency ?? "重要",
    visibility: item?.visibility ?? "永不交付",
    deliveryCondition: item?.deliveryCondition ?? "",
    status: item?.status ?? "草稿",
    emotionalLoad: item?.emotionalLoad ?? "平静",
    summary: item?.summary ?? "",
    content: item?.content ?? item?.contentPreview ?? "",
    isLocked: item?.isLocked ?? false,
    requiresSecondConfirm: item?.requiresSecondConfirm ?? false,
    excludeFromAi: item?.excludeFromAi ?? item?.recipient === LEGACY_RECIPIENT_SELF,
    reviewCue: item?.reviewCue ?? "",
    tags: item?.tags ?? [],
  }
}
