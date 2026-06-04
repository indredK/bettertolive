import { Plus, Search, Trash2 } from "lucide-react"
import { useCallback, useEffect, useState } from "react"

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
      classification: "已有"
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
      classification: "计划"
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
    if (!window.confirm("确定删除这个物件？")) return
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
      classification: "已有" as const,
      necessity: item.necessity,
      lifecycle: item.lifecycle,
      metaPrimary: item.status || "未设置状态",
      metaSecondary: `数量 ${item.quantity}`,
      raw: item,
    })),
    ...planItems.map((item) => ({
      rowType: "plan" as const,
      id: item.id,
      name: item.name,
      systemId: item.system_id,
      itemCategory: item.category,
      classification: "计划" as const,
      necessity: item.necessity,
      lifecycle: item.lifecycle,
      metaPrimary: laneLabel(item.lane_id),
      metaSecondary: item.current_price != null ? `¥${item.current_price}` : "未填价格",
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
                统一管理
              </Badge>
              <span className="text-xs text-[color:var(--text-muted)]">
                已有物件与计划物件共用同一张清单
              </span>
            </div>
            <div className="relative w-full md:max-w-md">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[color:var(--text-muted)]" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="搜索名称、系统、分类、状态"
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
                    添加物件
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem onClick={() => setEditing({ ...EMPTY_OWNED })}>
                  新增已有物件
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditing({ ...EMPTY_PLAN })}>
                  新增计划物件
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
            加载中...
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
                <h3 className="text-sm font-semibold text-[color:var(--text-primary)]">物件列表</h3>
                <p className="mt-1 text-xs text-[color:var(--text-muted)]">
                  支持从列表中直接进入编辑，按系统、状态和必要性快速查看。
                </p>
              </div>
              <span className="text-xs text-[color:var(--text-muted)]">
                当前结果 {filteredItems.length} 条
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
                    ? "新增已有物件"
                    : `编辑物件：${editing.name}`
                  : editing.isNew
                    ? "新增计划物件"
                    : `编辑物件：${editing.name}`}
              </DialogTitle>
              <DialogDescription>
                {editing.isNew ? "填写物件信息后点击保存。" : "修改物件信息后点击保存。"}
              </DialogDescription>
            </DialogHeader>
            <ItemForm form={editing} onChange={setEditing} lanes={lanes} error={error} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>
                取消
              </Button>
              <Button
                onClick={() => handleSave(editing)}
                disabled={
                  !editing.name ||
                  !editing.system ||
                  (editing.itemType === "plan" && !("laneId" in editing && editing.laneId))
                }
              >
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  )
}

// ---- Table components ----

function getClassificationBadgeClassName(classification: UnifiedItemRow["classification"]) {
  return classification === "已有"
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
  return (
    <div className={cn("min-h-0", isFixedLayout && "flex min-h-0 flex-1 flex-col overflow-hidden")}>
      <Table containerClassName={scrollAreaClassName} className="min-w-[980px]">
        <TableHeader>
          <TableRow className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)]">
            <TableHead className="sticky top-0 left-0 z-20 h-11 border-r border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-4 text-[12px] font-semibold text-[color:var(--text-muted)]">
              名称
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-[color:var(--chip-bg)] px-4 text-[12px] font-semibold text-[color:var(--text-muted)]">
              分类
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-[color:var(--chip-bg)] px-4 text-[12px] font-semibold text-[color:var(--text-muted)]">
              系统
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-[color:var(--chip-bg)] px-4 text-[12px] font-semibold text-[color:var(--text-muted)]">
              品类
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-[color:var(--chip-bg)] px-4 text-[12px] font-semibold text-[color:var(--text-muted)]">
              必要性
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-[color:var(--chip-bg)] px-4 text-[12px] font-semibold text-[color:var(--text-muted)]">
              生命周期
            </TableHead>
            <TableHead className="sticky top-0 z-10 h-11 bg-[color:var(--chip-bg)] px-4 text-[12px] font-semibold text-[color:var(--text-muted)]">
              信息
            </TableHead>
            <TableHead className="sticky top-0 right-0 z-20 h-11 border-l border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-4 text-right text-[12px] font-semibold text-[color:var(--text-muted)]">
              操作
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow className="border-[color:var(--muted-surface-border)]">
              <TableCell colSpan={8} className="px-4 py-8 text-sm text-[color:var(--text-muted)]">
                没有匹配的物件。
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
                    className={cn("border", getClassificationBadgeClassName(item.classification))}
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

  const isOwned = form.itemType === "owned"

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label="名称" required>
          <Input
            value={form.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="物件名称"
          />
        </FormField>

        {!isOwned ? (
          <FormField label="采购分栏 (laneId)" required>
            <Select
              value={"laneId" in form ? form.laneId : ""}
              onValueChange={(v) => update({ laneId: v ?? "" })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择采购分栏" />
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

        <FormField label="系统ID (system)" required>
          <Input
            value={form.system}
            onChange={(e) => update({ system: e.target.value })}
            placeholder="e.g. sleep"
          />
        </FormField>
        <FormField label="分类 (category)" required>
          <Input
            value={form.category}
            onChange={(e) => update({ category: e.target.value })}
            placeholder="e.g. 卧室"
          />
        </FormField>
        <FormField label="必要性 (necessity)" required>
          <Input
            value={form.necessity}
            onChange={(e) => update({ necessity: e.target.value })}
            placeholder="e.g. 核心刚需"
          />
        </FormField>
        <FormField label="生命周期 (lifecycle)" required>
          <Input
            value={form.lifecycle}
            onChange={(e) => update({ lifecycle: e.target.value })}
            placeholder="e.g. 耐用品"
          />
        </FormField>
        <FormField label="折旧 (depreciation)">
          <Input
            value={form.depreciation ?? ""}
            onChange={(e) => update({ depreciation: e.target.value || null })}
            placeholder="e.g. 慢折旧"
          />
        </FormField>
        <FormField label="空间 (spaces，逗号分隔)">
          <Input
            value={(form.spaces ?? []).join(", ")}
            onChange={(e) => update({ spaces: parseArray(e.target.value) })}
            placeholder="e.g. 卧室, 客厅"
          />
        </FormField>
        <FormField label="阶段 (stages，逗号分隔)">
          <Input
            value={(form.stages ?? []).join(", ")}
            onChange={(e) => update({ stages: parseArray(e.target.value) })}
            placeholder="e.g. 搭建, 优化"
          />
        </FormField>

        {isOwned ? (
          <>
            <FormField label="数量 (quantity)">
              <Input
                type="number"
                value={"quantity" in form ? form.quantity : 1}
                onChange={(e) => update({ quantity: Number(e.target.value) || 0 })}
                min={0}
              />
            </FormField>
            <FormField label="状态 (status)" required>
              <Input
                value={"status" in form ? form.status : ""}
                onChange={(e) => update({ status: e.target.value })}
                placeholder="e.g. 在用"
              />
            </FormField>
            <FormField label="替换提示 (replacementCue)" required>
              <Input
                value={"replacementCue" in form ? form.replacementCue : ""}
                onChange={(e) => update({ replacementCue: e.target.value })}
                placeholder="e.g. 舒适度下降或塌陷"
              />
            </FormField>
          </>
        ) : (
          <>
            <FormField label="标签 (tags，逗号分隔)">
              <Input
                value={("tags" in form ? form.tags : []).join(", ")}
                onChange={(e) => update({ tags: parseArray(e.target.value) })}
                placeholder="e.g. 高频, 刚需"
              />
            </FormField>
            <FormField label="关键词 (keywords，逗号分隔)">
              <Input
                value={("keywords" in form ? form.keywords : []).join(", ")}
                onChange={(e) => update({ keywords: parseArray(e.target.value) })}
                placeholder="e.g. 床垫, 睡眠"
              />
            </FormField>
            <FormField label="理由 (reason)" required>
              <Input
                value={"reason" in form ? form.reason : ""}
                onChange={(e) => update({ reason: e.target.value })}
                placeholder="为什么要购买"
              />
            </FormField>
            <FormField label="目标生活方式 (targetLifestyle)" required>
              <Input
                value={"targetLifestyle" in form ? form.targetLifestyle : ""}
                onChange={(e) => update({ targetLifestyle: e.target.value })}
                placeholder="e.g. 舒服"
              />
            </FormField>
            <FormField label="当前价格 (currentPrice)">
              <Input
                type="number"
                value={"currentPrice" in form ? (form.currentPrice ?? "") : ""}
                onChange={(e) =>
                  update({
                    currentPrice: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </FormField>
            <FormField label="购入价格 (buyBelowPrice)">
              <Input
                type="number"
                value={"buyBelowPrice" in form ? (form.buyBelowPrice ?? "") : ""}
                onChange={(e) =>
                  update({
                    buyBelowPrice: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </FormField>
            <FormField label="超付价格 (overpayPrice)">
              <Input
                type="number"
                value={"overpayPrice" in form ? (form.overpayPrice ?? "") : ""}
                onChange={(e) =>
                  update({
                    overpayPrice: e.target.value ? Number(e.target.value) : null,
                  })
                }
                placeholder="0.00"
                min={0}
                step={0.01}
              />
            </FormField>
          </>
        )}

        <FormField label="备注 (note)" className="md:col-span-2">
          <Input
            value={form.note}
            onChange={(e) => update({ note: e.target.value })}
            placeholder="其他备注"
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
