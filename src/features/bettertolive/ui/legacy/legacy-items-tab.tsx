import { Plus, Search, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  LEGACY_STATUSES,
  LEGACY_VISIBILITIES,
  translateLegacyEnum,
  type LegacySignalFilter,
} from "@/features/bettertolive/ui/legacy/legacy-page-data"
import {
  LEGACY_DETAIL_CARD_CLASS,
  LegacyDetailPane,
  LegacyEmptyDetailCard,
  LegacyItemSummaryCard,
  LegacyMeta,
  LegacySidebarPane,
  LegacyTabBody,
  LegacyWarningCallout,
} from "@/features/bettertolive/ui/legacy/legacy-page-shared"
import { confirmUndoableDelete } from "@/features/bettertolive/ui/shopping/shopping-delete"
import { EmptyState } from "@/features/bettertolive/ui/shared/shared"
import {
  FilterPopover,
  type FilterPopoverDimension,
} from "@/features/bettertolive/ui/shared/filter-popover"
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
        (signal === "locked" && (item.isLocked || item.status === "最终版")) ||
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
        label: t("legacy.fields.category", "内容类别"),
        allLabel: t("legacy.filters.all", "全部"),
        value: category,
        options: LEGACY_CATEGORIES.map((value) => ({
          value,
          label: translateLegacyEnum(t, "category", value),
        })),
      },
      {
        key: "status",
        label: t("legacy.fields.status", "完成状态"),
        allLabel: t("legacy.filters.all", "全部"),
        value: status,
        options: LEGACY_STATUSES.map((value) => ({
          value,
          label: translateLegacyEnum(t, "status", value),
        })),
      },
      {
        key: "visibility",
        label: t("legacy.fields.visibility", "可见时机"),
        allLabel: t("legacy.filters.all", "全部"),
        value: visibility,
        options: LEGACY_VISIBILITIES.map((value) => ({
          value,
          label: translateLegacyEnum(t, "visibility", value),
        })),
      },
      {
        key: "signal",
        label: t("legacy.filters.signal", "保护信号"),
        allLabel: t("legacy.filters.all", "全部"),
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
        <div className="flex items-center justify-between gap-2">
          <div className="text-sm font-medium">
            {t("legacy.items.title", "条目库")}
            <span className="text-muted-foreground ml-2 text-xs tabular-nums">
              {filteredItems.length}/{items.length}
            </span>
          </div>
          {isControlMode ? (
            <Button size="sm" onClick={() => onEditItem(null)}>
              <Plus className="size-4" />
              {t("legacy.actions.add", "新增")}
            </Button>
          ) : null}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <Input
              value={localQuery}
              onChange={(event) => setLocalQuery(event.currentTarget.value)}
              className="h-9 pl-9"
              placeholder={t("legacy.items.search", "搜索标题、正文、标签")}
            />
          </div>
          <FilterPopover
            className="shrink-0"
            popoverWidth="18.5rem"
            dimensions={filterDimensions}
            onChangeFilter={handleFilterChange}
            onClearAll={handleClearAll}
          />
        </div>

        <div className="mt-3 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
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
            <EmptyState
              message={t("legacy.empty.filteredItems", "当前筛选下没有生命整理条目。")}
              compact
            />
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
          <LegacyEmptyDetailCard
            message={t("legacy.items.selectPrompt", "选择一个条目查看详情。")}
          />
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
      confirmMessage: t("legacy.confirm.deleteItem", {
        title: item.title,
        defaultValue: `确定删除 ${item.title} 吗？`,
      }),
      pendingMessage: t("legacy.toast.deletePendingItem", {
        title: item.title,
        defaultValue: `已加入删除队列：${item.title}，5 秒内可撤销`,
      }),
      successMessage: t("legacy.toast.deleteSuccessItem", {
        title: item.title,
        defaultValue: `已删除生命整理条目：${item.title}`,
      }),
      failureMessage: t("legacy.toast.deleteFailedItem", "删除生命整理条目失败"),
      undoLabel: t("legacy.undo", "撤销"),
      undoneMessage: t("legacy.toast.deleteUndoneItem", {
        title: item.title,
        defaultValue: `已撤销删除：${item.title}`,
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
          {isControlMode ? (
            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" size="sm" onClick={onEdit}>
                {t("legacy.actions.edit", "编辑")}
              </Button>
              <Button variant="outline" size="sm" onClick={handleDelete}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ) : null}
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
              {t("legacy.labels.locked", "已锁定")}
            </Badge>
          ) : null}
        </div>

        {warnings.length > 0 ? (
          <LegacyWarningCallout title={t("legacy.items.warningTitle", "需要确认的边界")}>
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
            {t("legacy.fields.content", "正文")}
          </div>
          {item.requiresSecondConfirm && !isContentRevealed ? (
            <div className="mt-3 space-y-3">
              <p className="text-muted-foreground text-sm leading-6">
                {t("legacy.items.secondConfirmCopy", "这份内容标记为需要二次确认，先只显示摘要。")}
              </p>
              <Button variant="outline" size="sm" onClick={() => setIsContentRevealed(true)}>
                {t("legacy.actions.revealContent", "打开正文")}
              </Button>
            </div>
          ) : (
            <p className="mt-3 text-sm leading-7 whitespace-pre-wrap">{item.content}</p>
          )}
        </div>

        {item.deliveryCondition ? (
          <LegacyWarningCallout title={t("legacy.fields.deliveryCondition", "交付条件")} compact>
            {item.deliveryCondition}
          </LegacyWarningCallout>
        ) : null}

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          <LegacyMeta
            label={t("legacy.fields.urgency", "紧急度")}
            value={translateLegacyEnum(t, "urgency", item.urgency)}
          />
          <LegacyMeta
            label={t("legacy.fields.emotionalLoad", "情感负荷")}
            value={
              item.emotionalLoad
                ? translateLegacyEnum(t, "emotionalLoad", item.emotionalLoad)
                : t("legacy.labels.unrated", "待自评")
            }
          />
          <LegacyMeta label={t("legacy.fields.updatedAt", "更新时间")} value={item.updatedAt} />
          <LegacyMeta label={t("legacy.fields.createdAt", "创建时间")} value={item.createdAt} />
          <LegacyMeta
            label={t("legacy.fields.finalizedAt", "最终确认")}
            value={item.finalizedAt ?? t("legacy.labels.notFinalized", "未最终确认")}
          />
          <LegacyMeta
            label={t("legacy.fields.aiBoundary", "AI 边界")}
            value={
              item.excludeFromAi
                ? t("legacy.labels.aiExcluded", "不参与 AI")
                : t("legacy.labels.aiAllowed", "可参与整理")
            }
            accent={item.excludeFromAi}
          />
        </div>

        <LegacyMeta label={t("legacy.fields.reviewCue", "回看提示")} value={item.reviewCue} />

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
