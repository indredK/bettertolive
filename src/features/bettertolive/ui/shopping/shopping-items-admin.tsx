import { Plus, Search, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  ShoppingOwnedItemForm,
  ShoppingOwnedItemRow,
  ShoppingPlanItemForm,
  ShoppingPlanItemRow,
  ShoppingPurchaseLaneRow,
} from "@/features/bettertolive/api/bettertolive-api"
import {
  createOwnedItem,
  createPlanItem,
  deleteOwnedItem,
  deletePlanItem,
  listOwnedItems,
  listPlanItems,
  listPurchaseLanes,
  updateOwnedItem,
  updatePlanItem,
} from "@/features/bettertolive/api/shopping-crud-api"
import { formatPrice } from "@/features/bettertolive/ui/shopping/shopping-page-data"
import { cn } from "@/lib/utils"

type ItemType = "owned" | "plan"

type EditableForm =
  | (ShoppingOwnedItemForm & { isNew: boolean; itemType: "owned" })
  | (ShoppingPlanItemForm & { isNew: boolean; itemType: "plan" })

type OwnedEditableForm = Extract<EditableForm, { itemType: "owned" }>
type PlanEditableForm = Extract<EditableForm, { itemType: "plan" }>

type UnifiedItemRow =
  | {
      rowType: "owned"
      id: string
      name: string
      systemId: string
      itemCategory: string
      classification: string
      necessity: string
      lifecycle: string
      metaPrimary: string
      metaSecondary: string
      raw: ShoppingOwnedItemRow
    }
  | {
      rowType: "plan"
      id: string
      name: string
      systemId: string
      itemCategory: string
      classification: string
      necessity: string
      lifecycle: string
      metaPrimary: string
      metaSecondary: string
      raw: ShoppingPlanItemRow
    }

const EMPTY_OWNED: ShoppingOwnedItemForm & { isNew: true; itemType: "owned" } = {
  isNew: true,
  itemType: "owned",
  name: "",
  system: "",
  category: "",
  spaces: [],
  stages: [],
  necessity: "",
  lifecycle: "",
  depreciation: null,
  quantity: 1,
  status: "",
  replacementCue: "",
  note: "",
}

const EMPTY_PLAN: ShoppingPlanItemForm & { isNew: true; itemType: "plan" } = {
  isNew: true,
  itemType: "plan",
  laneId: "",
  name: "",
  system: "",
  category: "",
  spaces: [],
  stages: [],
  necessity: "",
  lifecycle: "",
  depreciation: null,
  reason: "",
  targetLifestyle: "",
  currentPrice: null,
  buyBelowPrice: null,
  overpayPrice: null,
  note: "",
  tags: [],
  keywords: [],
}

function parseArray(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
}

export function ShoppingItemsAdmin({
  isWideLayout = false,
  isFixedLayout = false,
}: {
  isWideLayout?: boolean
  isFixedLayout?: boolean
}) {
  const { t } = useTranslation()
  const [ownedItems, setOwnedItems] = useState<ShoppingOwnedItemRow[]>([])
  const [planItems, setPlanItems] = useState<ShoppingPlanItemRow[]>([])
  const [lanes, setLanes] = useState<ShoppingPurchaseLaneRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<EditableForm | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const loadItems = useCallback(async () => {
    try {
      setLoading(true)
      const [owned, plan, lanesData] = await Promise.all([
        listOwnedItems(),
        listPlanItems(),
        listPurchaseLanes(),
      ])
      setOwnedItems(owned)
      setPlanItems(plan)
      setLanes(lanesData)
      setError(null)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadItems()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadItems])

  async function handleSave(form: EditableForm) {
    try {
      if (form.itemType === "owned") {
        if (form.isNew) {
          await createOwnedItem(form)
        } else {
          if (!form.id) return
          await updateOwnedItem({ ...form, id: form.id })
        }
      } else {
        if (form.isNew) {
          await createPlanItem(form)
        } else {
          if (!form.id) return
          await updatePlanItem({ ...form, id: form.id })
        }
      }
      setEditing(null)
      setError(null)
      void loadItems()
    } catch (e) {
      setError(String(e))
    }
  }

  async function handleDelete(itemType: ItemType, id: string) {
    if (!window.confirm(t("shopping.admin.items.confirmDelete"))) return
    try {
      if (itemType === "owned") {
        await deleteOwnedItem(id)
      } else {
        await deletePlanItem(id)
      }
      setError(null)
      void loadItems()
    } catch (e) {
      setError(String(e))
    }
  }

  function startEditOwned(item: ShoppingOwnedItemRow) {
    setEditing({
      isNew: false,
      itemType: "owned",
      id: item.id,
      name: item.name,
      system: item.system_id,
      category: item.category,
      spaces: [],
      stages: [],
      necessity: item.necessity,
      lifecycle: item.lifecycle,
      depreciation: item.depreciation,
      quantity: item.quantity,
      status: item.status,
      replacementCue: item.replacement_cue,
      note: item.note,
    })
  }

  function startEditPlan(item: ShoppingPlanItemRow) {
    setEditing({
      isNew: false,
      itemType: "plan",
      id: item.id,
      laneId: item.lane_id,
      name: item.name,
      system: item.system_id,
      category: item.category,
      spaces: [],
      stages: [],
      necessity: item.necessity,
      lifecycle: item.lifecycle,
      depreciation: item.depreciation,
      reason: item.reason,
      targetLifestyle: item.target_lifestyle,
      currentPrice: item.current_price,
      buyBelowPrice: item.buy_below_price,
      overpayPrice: item.overpay_price,
      note: item.note,
      tags: [],
      keywords: [],
    })
  }

  const laneLabel = (laneId: string) => {
    const lane = lanes.find((l) => l.id === laneId)
    return lane ? lane.title : laneId
  }

  const normalizedQuery = searchQuery.trim().toLowerCase()
  const matchesQuery = (values: Array<string | number | null | undefined>) =>
    normalizedQuery.length === 0 ||
    values.some((value) =>
      String(value ?? "")
        .toLowerCase()
        .includes(normalizedQuery),
    )

  const combinedItems: UnifiedItemRow[] = [
    ...ownedItems.map((item) => ({
      rowType: "owned" as const,
      id: item.id,
      name: item.name,
      systemId: item.system_id,
      itemCategory: item.category,
      classification: t("shopping.admin.items.classification.owned"),
      necessity: item.necessity,
      lifecycle: item.lifecycle,
      metaPrimary: item.status || t("shopping.admin.items.statusNotSet"),
      metaSecondary: t("shopping.admin.items.quantity", { n: item.quantity }),
      raw: item,
    })),
    ...planItems.map((item) => ({
      rowType: "plan" as const,
      id: item.id,
      name: item.name,
      systemId: item.system_id,
      itemCategory: item.category,
      classification: t("shopping.admin.items.classification.planned"),
      necessity: item.necessity,
      lifecycle: item.lifecycle,
      metaPrimary: laneLabel(item.lane_id),
      metaSecondary:
        item.current_price != null
          ? formatPrice(item.current_price)
          : t("shopping.admin.items.noPrice"),
      raw: item,
    })),
  ]

  const filteredItems = combinedItems.filter((item) =>
    matchesQuery([
      item.classification,
      item.name,
      item.systemId,
      item.itemCategory,
      item.necessity,
      item.lifecycle,
      item.metaPrimary,
      item.metaSecondary,
    ]),
  )

  const tableScrollAreaClassName = cn(
    "rounded-md overflow-auto",
    isFixedLayout ? "min-h-0 flex-1" : "max-h-[420px]",
  )

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        isFixedLayout && "h-full min-h-0 flex-1 overflow-hidden",
      )}
    >
      <section className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
              >
                {t("shopping.admin.items.unifiedManagement")}
              </Badge>
              <span className="text-xs text-[color:var(--text-muted)]">
                {t("shopping.admin.items.unifiedDesc")}
              </span>
            </div>
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder={t("shopping.admin.items.searchPlaceholder")}
                className="h-10 border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] pl-9 shadow-none"
              />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="h-9 border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-3 text-[color:var(--text-secondary)]"
            >
              {filteredItems.length} / {combinedItems.length}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button className={cn("h-9 px-3", isWideLayout && "h-8")}>
                    <Plus />
                    {t("shopping.admin.items.addItem")}
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setEditing({ ...EMPTY_OWNED })}>
                  {t("shopping.admin.items.newOwnedItem")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditing({ ...EMPTY_PLAN })}>
                  {t("shopping.admin.items.newPlanItem")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className={cn(isFixedLayout && "min-h-0 flex-1 overflow-hidden")}>
        {loading ? (
          <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-5 py-10 text-sm text-[color:var(--text-muted)] shadow-[var(--surface-shadow)]">
            {t("shopping.admin.items.loading")}
          </div>
        ) : (
          <section
            className={cn(
              "flex min-h-0 flex-col overflow-hidden rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] shadow-[var(--surface-shadow)]",
              isFixedLayout && "h-full min-h-0",
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[color:var(--muted-surface-border)] px-5 py-4">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">
                  {t("shopping.admin.items.itemList")}
                </h3>
                <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                  {t("shopping.admin.items.itemListDesc")}
                </p>
              </div>
              <span className="text-xs text-[color:var(--text-muted)]">
                {t("shopping.admin.items.currentResults", { count: filteredItems.length })}
              </span>
            </div>
            <div className={cn("min-h-0 px-2 pb-2", isFixedLayout && "flex-1")}>
              <div
                className={cn(
                  "min-h-0 rounded-md border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)]",
                  isFixedLayout && "flex h-full flex-col",
                )}
              >
                <UnifiedItemsTable
                  items={filteredItems}
                  onEditOwned={startEditOwned}
                  onEditPlan={startEditPlan}
                  onDelete={handleDelete}
                  scrollAreaClassName={tableScrollAreaClassName}
                  isFixedLayout={isFixedLayout}
                />
              </div>
            </div>
          </section>
        )}
      </div>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
      >
        {editing ? (
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editing.itemType === "owned"
                  ? editing.isNew
                    ? t("shopping.admin.items.newOwnedTitle")
                    : t("shopping.admin.items.editTitle", { name: editing.name })
                  : editing.isNew
                    ? t("shopping.admin.items.newPlanTitle")
                    : t("shopping.admin.items.editTitle", { name: editing.name })}
              </DialogTitle>
              <DialogDescription>
                {editing.isNew
                  ? t("shopping.admin.items.saveInstructions")
                  : t("shopping.admin.items.editInstructions")}
              </DialogDescription>
            </DialogHeader>
            <ItemForm form={editing} onChange={setEditing} lanes={lanes} error={error} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>
                {t("shopping.admin.items.cancel")}
              </Button>
              <Button
                onClick={() => handleSave(editing)}
                disabled={
                  !editing.name ||
                  !editing.system ||
                  (editing.itemType === "plan" && !("laneId" in editing && editing.laneId))
                }
              >
                {t("shopping.admin.items.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  )
}

// ---- Table components ----

function getClassificationBadgeClassName(rowType: UnifiedItemRow["rowType"]) {
  return rowType === "owned"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : "border-sky-200 bg-sky-50 text-sky-700"
}

function getNecessityBadgeClassName(necessity: string) {
  if (necessity.includes("必要")) {
    return "border-rose-200 bg-rose-50 text-rose-700"
  }
  if (necessity.includes("改善")) {
    return "border-violet-200 bg-violet-50 text-violet-700"
  }

  return "border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
}

function UnifiedItemsTable({
  items,
  onEditOwned,
  onEditPlan,
  onDelete,
  scrollAreaClassName,
  isFixedLayout = false,
}: {
  items: UnifiedItemRow[]
  onEditOwned: (item: ShoppingOwnedItemRow) => void
  onEditPlan: (item: ShoppingPlanItemRow) => void
  onDelete: (itemType: ItemType, id: string) => void
  scrollAreaClassName?: string
  isFixedLayout?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className={cn("min-h-0", isFixedLayout && "flex min-h-0 flex-1 flex-col overflow-hidden")}>
      <Table containerClassName={scrollAreaClassName} className="min-w-[980px]">
        <TableHeader>
          <TableRow className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)]">
            <TableHead className="sticky top-0 left-0 z-20 h-11 border-r border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-4 text-[12px] font-semibold text-[color:var(--text-muted)]">
              {t("shopping.admin.items.table.name")}
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-[color:var(--chip-bg)] px-4 text-[12px] font-semibold text-[color:var(--text-muted)]">
              {t("shopping.admin.items.table.classification")}
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-[color:var(--chip-bg)] px-4 text-[12px] font-semibold text-[color:var(--text-muted)]">
              {t("shopping.admin.items.table.system")}
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-[color:var(--chip-bg)] px-4 text-[12px] font-semibold text-[color:var(--text-muted)]">
              {t("shopping.admin.items.table.category")}
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-[color:var(--chip-bg)] px-4 text-[12px] font-semibold text-[color:var(--text-muted)]">
              {t("shopping.admin.items.table.necessity")}
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-[color:var(--chip-bg)] px-4 text-[12px] font-semibold text-[color:var(--text-muted)]">
              {t("shopping.admin.items.table.lifecycle")}
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-[color:var(--chip-bg)] px-4 text-[12px] font-semibold text-[color:var(--text-muted)]">
              {t("shopping.admin.items.table.info")}
            </TableHead>
            <TableHead className="sticky top-0 right-0 z-20 h-11 border-l border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-4 text-right text-[12px] font-semibold text-[color:var(--text-muted)]">
              {t("shopping.admin.items.table.actions")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow className="border-[color:var(--muted-surface-border)]">
              <TableCell colSpan={8} className="px-4 py-8 text-sm text-[color:var(--text-muted)]">
                {t("shopping.admin.items.noMatchingItems")}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow
                key={item.id}
                className="group cursor-pointer border-[color:var(--muted-surface-border)] bg-[color:var(--surface-bg)] hover:bg-[color:var(--muted-surface-bg)]"
                onClick={() => {
                  if (item.rowType === "owned") {
                    onEditOwned(item.raw)
                  } else {
                    onEditPlan(item.raw)
                  }
                }}
              >
                <TableCell className="sticky left-0 z-10 max-w-[240px] border-r border-[color:var(--muted-surface-border)] bg-[color:var(--surface-bg)] px-4 py-3 font-medium whitespace-normal text-[color:var(--text-primary)] group-hover:bg-[color:var(--muted-surface-bg)]">
                  {item.name}
                </TableCell>
                <TableCell className="px-4 py-3 text-[color:var(--text-secondary)]">
                  <Badge
                    variant="outline"
                    className={cn("border", getClassificationBadgeClassName(item.rowType))}
                  >
                    {item.classification}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-[color:var(--text-secondary)]">
                  <Badge
                    variant="outline"
                    className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)]"
                  >
                    {item.systemId}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-[color:var(--text-secondary)]">
                  {item.itemCategory}
                </TableCell>
                <TableCell className="px-4 py-3 text-[color:var(--text-secondary)]">
                  <Badge
                    variant="outline"
                    className={cn("border", getNecessityBadgeClassName(item.necessity))}
                  >
                    {item.necessity}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-[color:var(--text-secondary)]">
                  {item.lifecycle}
                </TableCell>
                <TableCell className="px-4 py-3 text-[color:var(--text-secondary)]">
                  <div className="whitespace-normal">
                    <div>{item.metaPrimary}</div>
                    <div className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                      {item.metaSecondary}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="sticky right-0 z-10 border-l border-[color:var(--muted-surface-border)] bg-[color:var(--surface-bg)] px-4 py-3 text-right group-hover:bg-[color:var(--muted-surface-bg)]">
                  <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-red-500 hover:bg-red-50 hover:text-red-700"
                    onClick={(e) => {
                      e.stopPropagation()
                      void onDelete(item.rowType, item.id)
                    }}
                  >
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// ---- Shared form component ----

function ItemForm({
  form,
  onChange,
  lanes,
  error,
}: {
  form: EditableForm
  onChange: (form: EditableForm) => void
  lanes: ShoppingPurchaseLaneRow[]
  error: string | null
}) {
  const update = (partial: Partial<OwnedEditableForm> | Partial<PlanEditableForm>) => {
    if (form.itemType === "owned") {
      const nextForm: OwnedEditableForm = {
        ...form,
        ...(partial as Partial<OwnedEditableForm>),
      }
      onChange(nextForm)
      return
    }

    const nextForm: PlanEditableForm = {
      ...form,
      ...(partial as Partial<PlanEditableForm>),
    }
    onChange(nextForm)
  }

  const { t } = useTranslation()
  const isOwned = form.itemType === "owned"

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label={t("shopping.admin.items.form.name")} required>
          <Input
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder={t("shopping.admin.items.form.namePlaceholder")}
          />
        </FormField>

        {!isOwned ? (
          <FormField label={t("shopping.admin.items.form.laneId")} required>
            <Select
              value={"laneId" in form ? form.laneId : ""}
              onValueChange={(v) => update({ laneId: v ?? "" })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("shopping.admin.items.form.selectLane")} />
              </SelectTrigger>
              <SelectContent>
                {lanes.map((lane) => (
                  <SelectItem key={lane.id} value={lane.id}>
                    {lane.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormField>
        ) : null}

        <FormField label={t("shopping.admin.items.form.systemId")} required>
          <Input
            value={form.system}
            onChange={(e) => update({ system: e.target.value })}
            placeholder={t("shopping.admin.items.form.systemPlaceholder")}
          />
        </FormField>
        <FormField label={t("shopping.admin.items.form.category")} required>
          <Input
            value={form.category}
            onChange={(e) => update({ category: e.target.value })}
            placeholder={t("shopping.admin.items.form.categoryPlaceholder")}
          />
        </FormField>
        <FormField label={t("shopping.admin.items.form.necessity")} required>
          <Input
            value={form.necessity}
            onChange={(e) => update({ necessity: e.target.value })}
            placeholder={t("shopping.admin.items.form.necessityPlaceholder")}
          />
        </FormField>
        <FormField label={t("shopping.admin.items.form.lifecycle")} required>
          <Input
            value={form.lifecycle}
            onChange={(e) => update({ lifecycle: e.target.value })}
            placeholder={t("shopping.admin.items.form.lifecyclePlaceholder")}
          />
        </FormField>
        <FormField label={t("shopping.admin.items.form.depreciation")}>
          <Input
            value={form.depreciation ?? ""}
            onChange={(e) => update({ depreciation: e.target.value || null })}
            placeholder={t("shopping.admin.items.form.depreciationPlaceholder")}
          />
        </FormField>
        <FormField label={t("shopping.admin.items.form.spaces")}>
          <Input
            value={(form.spaces ?? []).join(", ")}
            onChange={(e) => update({ spaces: parseArray(e.target.value) })}
            placeholder={t("shopping.admin.items.form.spacesPlaceholder")}
          />
        </FormField>
        <FormField label={t("shopping.admin.items.form.stages")}>
          <Input
            value={(form.stages ?? []).join(", ")}
            onChange={(e) => update({ stages: parseArray(e.target.value) })}
            placeholder={t("shopping.admin.items.form.stagesPlaceholder")}
          />
        </FormField>

        {isOwned ? (
          <>
            <FormField label={t("shopping.admin.items.form.quantity")}>
              <Input
                type="number"
                value={"quantity" in form ? form.quantity : 1}
                onChange={(e) => update({ quantity: Number(e.target.value) || 0 })}
                min={0}
              />
            </FormField>
            <FormField label={t("shopping.admin.items.form.status")} required>
              <Input
                value={"status" in form ? form.status : ""}
                onChange={(e) => update({ status: e.target.value })}
                placeholder={t("shopping.admin.items.form.statusPlaceholder")}
              />
            </FormField>
            <FormField label={t("shopping.admin.items.form.replacementCue")} required>
              <Input
                value={"replacementCue" in form ? form.replacementCue : ""}
                onChange={(e) => update({ replacementCue: e.target.value })}
                placeholder={t("shopping.admin.items.form.cuePlaceholder")}
              />
            </FormField>
          </>
        ) : (
          <>
            <FormField label={t("shopping.admin.items.form.tags")}>
              <Input
                value={("tags" in form ? form.tags : []).join(", ")}
                onChange={(e) => update({ tags: parseArray(e.target.value) })}
                placeholder={t("shopping.admin.items.form.tagsPlaceholder")}
              />
            </FormField>
            <FormField label={t("shopping.admin.items.form.keywords")}>
              <Input
                value={("keywords" in form ? form.keywords : []).join(", ")}
                onChange={(e) => update({ keywords: parseArray(e.target.value) })}
                placeholder={t("shopping.admin.items.form.keywordsPlaceholder")}
              />
            </FormField>
            <FormField label={t("shopping.admin.items.form.reason")} required>
              <Input
                value={"reason" in form ? form.reason : ""}
                onChange={(e) => update({ reason: e.target.value })}
                placeholder={t("shopping.admin.items.form.reasonPlaceholder")}
              />
            </FormField>
            <FormField label={t("shopping.admin.items.form.targetLifestyle")} required>
              <Input
                value={"targetLifestyle" in form ? form.targetLifestyle : ""}
                onChange={(e) => update({ targetLifestyle: e.target.value })}
                placeholder={t("shopping.admin.items.form.lifestylePlaceholder")}
              />
            </FormField>
            <FormField label={t("shopping.admin.items.form.currentPrice")}>
              <Input
                type="number"
                value={"currentPrice" in form ? (form.currentPrice ?? "") : ""}
                onChange={(e) =>
                  update({
                    currentPrice: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder={t("shopping.admin.items.form.pricePlaceholder")}
                min={0}
                step={0.01}
              />
            </FormField>
            <FormField label={t("shopping.admin.items.form.buyBelowPrice")}>
              <Input
                type="number"
                value={"buyBelowPrice" in form ? (form.buyBelowPrice ?? "") : ""}
                onChange={(e) =>
                  update({
                    buyBelowPrice: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder={t("shopping.admin.items.form.pricePlaceholder")}
                min={0}
                step={0.01}
              />
            </FormField>
            <FormField label={t("shopping.admin.items.form.overpayPrice")}>
              <Input
                type="number"
                value={"overpayPrice" in form ? (form.overpayPrice ?? "") : ""}
                onChange={(e) =>
                  update({
                    overpayPrice: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder={t("shopping.admin.items.form.pricePlaceholder")}
                min={0}
                step={0.01}
              />
            </FormField>
          </>
        )}

        <FormField label={t("shopping.admin.items.form.note")} className="md:col-span-2">
          <Input
            value={form.note}
            onChange={(e) => update({ note: e.target.value })}
            placeholder={t("shopping.admin.items.form.notePlaceholder")}
          />
        </FormField>
      </div>
    </div>
  )
}

function FormField({
  label,
  required,
  className,
  children,
}: {
  label: string
  required?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={cn("space-y-1.5", className)}>
      <span className="text-xs font-medium text-[color:var(--text-secondary)]">
        {label}
        {required ? <span className="ml-0.5 text-red-400">*</span> : null}
      </span>
      {children}
    </label>
  )
}
