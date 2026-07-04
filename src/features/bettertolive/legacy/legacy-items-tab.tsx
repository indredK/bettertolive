import { Pencil, Search, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { AnimatedIconButton, Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { deleteLegacyItem } from "@/features/bettertolive/api/legacy-crud-api"
import type {
  LegacyCategory,
  LegacyItem,
  LegacyStatus,
  LegacyVisibility,
} from "@/features/bettertolive/types"
import {
  getLegacyDeliveryWarnings,
  legacyRecipientLabel,
  legacyWarningLabel,
  LEGACY_CATEGORIES,
  LEGACY_STATUS_FINAL,
  LEGACY_STATUSES,
  LEGACY_VISIBILITIES,
  translateLegacyEnum,
  type LegacySignalFilter,
} from "@/features/bettertolive/legacy/legacy-page-data"
import {
  LEGACY_DETAIL_CARD_CLASS,
  LegacyDetailPane,
  LegacyEmptyDetailCard,
  LegacyItemSummaryCard,
  LegacyMeta,
  LegacySidebarPane,
  LegacyTabBody,
  LegacyWarningCallout,
} from "@/features/bettertolive/legacy/legacy-page-shared"
import { confirmUndoableDelete } from "@/features/bettertolive/shared/shopping-delete"
import { EmptyState } from "@/features/bettertolive/shared/shared"
import {
  FilterAppliedChips,
  FilterPopoverButton,
  type FilterPopoverDimension,
} from "@/features/bettertolive/shared/filter-popover"
import { cn } from "@/lib/utils"

type FilterValue<T extends string> = "all" | T

export function LegacyItemsTab({
  items,
  isControlMode,
  onEditItem,
  onDeleted,
}: {
  items: LegacyItem[]
  isControlMode: boolean
  onEditItem: (item: LegacyItem | null) => void
  onDeleted?: () => void
}) {
  const { t } = useTranslation()
  const [localQuery, setLocalQuery] = useState("")
  const [category, setCategory] = useState<FilterValue<LegacyCategory>>("all")
  const [status, setStatus] = useState<FilterValue<LegacyStatus>>("all")
  const [visibility, setVisibility] = useState<FilterValue<LegacyVisibility>>("all")
  const [signal, setSignal] = useState<LegacySignalFilter>("all")
  const [selectedId, setSelectedId] = useState<string | null>(items[0]?.id ?? null)

  const filteredItems = useMemo(() => {
    const query = localQuery.trim().toLowerCase()

    return items.filter((item) => {
      const text = [
        item.title,
        item.summary,
        item.content,
        item.contentPreview,
        item.recipientName,
        item.relatedRelationshipId,
        item.deliveryCondition,
        item.reviewCue,
        ...item.tags,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      const matchesText = !query || text.includes(query)
      const matchesCategory = category === "all" || item.category === category
      const matchesStatus = status === "all" || item.status === status
      const matchesVisibility = visibility === "all" || item.visibility === visibility
      const matchesSignal =
        signal === "all" ||
        (signal === "missingDelivery" &&
          getLegacyDeliveryWarnings(item).some((w) => w.kind === "missingDelivery")) ||
        (signal === "locked" && (item.isLocked || item.status === LEGACY_STATUS_FINAL)) ||
        (signal === "aiExcluded" && item.excludeFromAi) ||
        (signal === "secondConfirm" && item.requiresSecondConfirm)

      return matchesText && matchesCategory && matchesStatus && matchesVisibility && matchesSignal
    })
  }, [category, items, localQuery, signal, status, visibility])

  const selectedItem =
    filteredItems.find((item) => item.id === selectedId) ?? filteredItems[0] ?? null
  const activeSelectedId = selectedItem?.id ?? null

  const filterDimensions = useMemo<FilterPopoverDimension[]>(
    () => [
      {
        key: "category",
        label: t("legacy.fields.category"),
        allLabel: t("legacy.filters.all"),
        value: category,
        options: LEGACY_CATEGORIES.map((value) => ({
          value,
          label: translateLegacyEnum(t, "category", value),
        })),
      },
      {
        key: "status",
        label: t("legacy.fields.status"),
        allLabel: t("legacy.filters.all"),
        value: status,
        options: LEGACY_STATUSES.map((value) => ({
          value,
          label: translateLegacyEnum(t, "status", value),
        })),
      },
      {
        key: "visibility",
        label: t("legacy.fields.visibility"),
        allLabel: t("legacy.filters.all"),
        value: visibility,
        options: LEGACY_VISIBILITIES.map((value) => ({
          value,
          label: translateLegacyEnum(t, "visibility", value),
        })),
      },
      {
        key: "signal",
        label: t("legacy.filters.signal"),
        allLabel: t("legacy.filters.all"),
        value: signal,
        options: (["missingDelivery", "locked", "aiExcluded", "secondConfirm"] as const).map(
          (value) => ({ value, label: t(`legacy.filters.${value}`, value) }),
        ),
      },
    ],
    [category, status, visibility, signal, t],
  )

  const handleFilterChange = (key: string, value: string) => {
    if (key === "category") setCategory(value as FilterValue<LegacyCategory>)
    else if (key === "status") setStatus(value as FilterValue<LegacyStatus>)
    else if (key === "visibility") setVisibility(value as FilterValue<LegacyVisibility>)
    else if (key === "signal") setSignal(value as LegacySignalFilter)
  }

  const handleClearAll = () => {
    setCategory("all")
    setStatus("all")
    setVisibility("all")
    setSignal("all")
  }

  return (
    <LegacyTabBody>
      <LegacySidebarPane>
        <div className="space-y-2">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
              <Input
                value={localQuery}
                onChange={(event) => setLocalQuery(event.currentTarget.value)}
                className="h-9 pl-9"
                placeholder={t("legacy.items.search")}
              />
            </div>
            <FilterPopoverButton
              className="shrink-0"
              popoverWidth="18.5rem"
              dimensions={filterDimensions}
              onChangeFilter={handleFilterChange}
              onClearAll={handleClearAll}
            />
          </div>
          <FilterAppliedChips dimensions={filterDimensions} onChangeFilter={handleFilterChange} />
        </div>

        <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          <div className="text-muted-foreground text-[11px] tabular-nums">
            {filteredItems.length}/{items.length}
          </div>
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <LegacyItemSummaryCard
                key={item.id}
                item={item}
                isSelected={item.id === activeSelectedId}
                onSelect={() => setSelectedId(item.id)}
                onEdit={isControlMode ? () => onEditItem(item) : undefined}
              />
            ))
          ) : (
            <EmptyState message={t("legacy.empty.filteredItems")} compact />
          )}
        </div>
      </LegacySidebarPane>

      <LegacyDetailPane>
        {selectedItem ? (
          <LegacyItemDetail
            key={selectedItem.id}
            item={selectedItem}
            isControlMode={isControlMode}
            onEdit={() => onEditItem(selectedItem)}
            onDeleted={onDeleted}
          />
        ) : (
          <LegacyEmptyDetailCard message={t("legacy.items.selectPrompt")} />
        )}
      </LegacyDetailPane>
    </LegacyTabBody>
  )
}

function LegacyItemDetail({
  item,
  isControlMode,
  onEdit,
  onDeleted,
}: {
  item: LegacyItem
  isControlMode: boolean
  onEdit: () => void
  onDeleted?: () => void
}) {
  const { t } = useTranslation()
  const [isContentRevealed, setIsContentRevealed] = useState(!item.requiresSecondConfirm)
  const warnings = getLegacyDeliveryWarnings(item)

  const handleDelete = () => {
    const scheduled = confirmUndoableDelete({
      confirmMessage: t("common.confirm.deleteItem", {
        name: item.title,
      }),
      pendingMessage: t("common.toast.deletePending", {
        name: item.title,
      }),
      successMessage: t("legacy.toast.deleteSuccessItem", {
        title: item.title,
      }),
      failureMessage: t("legacy.toast.deleteFailedItem"),
      undoLabel: t("common.actions.undo"),
      undoneMessage: t("common.toast.deleteUndone", {
        name: item.title,
      }),
      onDelete: () => deleteLegacyItem(item.id),
      onDeleted,
    })

    if (!scheduled) return
  }

  return (
    <Card className={cn(LEGACY_DETAIL_CARD_CLASS, "flex h-full min-h-0 flex-col")}>
      <CardHeader className="shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="text-base">{item.title}</CardTitle>
            <p className="text-muted-foreground mt-1 text-sm leading-6">{item.summary}</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <AnimatedIconButton
              show={isControlMode}
              variant="outline"
              size="sm"
              label={t("common.actions.edit")}
              icon={<Pencil className="size-4" />}
              onClick={onEdit}
            >
              {t("common.actions.edit")}
            </AnimatedIconButton>
            <AnimatedIconButton
              show={isControlMode}
              variant="outline"
              size="sm"
              label={t("common.actions.delete")}
              icon={<Trash2 className="size-4" />}
              onClick={handleDelete}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="min-h-0 flex-1 space-y-4 overflow-y-auto">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{translateLegacyEnum(t, "category", item.category)}</Badge>
          <Badge variant="outline">{legacyRecipientLabel(item, t)}</Badge>
          <Badge className="bg-[color:var(--legacy-private-bg)] text-[color:var(--legacy-private-ink)]">
            {translateLegacyEnum(t, "visibility", item.visibility)}
          </Badge>
          <Badge variant="outline">{translateLegacyEnum(t, "status", item.status)}</Badge>
          {item.isLocked ? (
            <Badge className="bg-[color:var(--legacy-lock-bg)] text-[color:var(--legacy-lock-ink)]">
              {t("legacy.labels.locked")}
            </Badge>
          ) : null}
        </div>

        {warnings.length > 0 ? (
          <LegacyWarningCallout title={t("legacy.items.warningTitle")}>
            <div className="flex flex-wrap gap-2">
              {warnings.map((warning) => (
                <Badge
                  key={`${warning.kind}-${warning.itemId}`}
                  variant="outline"
                  className="border-current"
                >
                  {legacyWarningLabel(warning.kind, t)}
                </Badge>
              ))}
            </div>
          </LegacyWarningCallout>
        ) : null}

        <div className="border-foreground/10 bg-muted/20 rounded-lg border p-4">
          <div className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            {t("legacy.fields.content")}
          </div>
          {item.requiresSecondConfirm && !isContentRevealed ? (
            <div className="mt-3 space-y-3">
              <p className="text-muted-foreground text-sm leading-6">
                {t("legacy.items.secondConfirmCopy")}
              </p>
              <Button variant="outline" size="sm" onClick={() => setIsContentRevealed(true)}>
                {t("legacy.actions.revealContent")}
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-7 whitespace-pre-wrap">{item.content}</p>
          )}
        </div>

        {item.deliveryCondition ? (
          <LegacyWarningCallout title={t("legacy.fields.deliveryCondition")} compact>
            {item.deliveryCondition}
          </LegacyWarningCallout>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <LegacyMeta
            label={t("legacy.fields.urgency")}
            value={translateLegacyEnum(t, "urgency", item.urgency)}
          />
          <LegacyMeta
            label={t("legacy.fields.emotionalLoad")}
            value={
              item.emotionalLoad
                ? translateLegacyEnum(t, "emotionalLoad", item.emotionalLoad)
                : t("legacy.labels.unrated")
            }
          />
          <LegacyMeta label={t("legacy.fields.updatedAt")} value={item.updatedAt} />
          <LegacyMeta label={t("legacy.fields.createdAt")} value={item.createdAt} />
          <LegacyMeta
            label={t("legacy.fields.finalizedAt")}
            value={item.finalizedAt ?? t("legacy.labels.notFinalized")}
          />
          <LegacyMeta
            label={t("legacy.fields.aiBoundary")}
            value={
              item.excludeFromAi ? t("legacy.labels.aiExcluded") : t("legacy.labels.aiAllowed")
            }
            accent={item.excludeFromAi}
          />
        </div>

        <LegacyMeta label={t("legacy.fields.reviewCue")} value={item.reviewCue} />

        <div className="flex flex-wrap gap-2">
          {item.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="border-foreground/10 bg-background/70">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
