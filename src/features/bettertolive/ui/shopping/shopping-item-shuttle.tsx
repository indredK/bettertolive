import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Search } from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

// 穿梭框单元 — 候选物品的最简化展示数据
export type ShuttleItem = {
  id: string
  name: string
  // 当前归属提示(例如:已在"睡眠系统",或当前空间"卧室/客厅")
  hint?: string
}

type ShuttleProps = {
  candidates: ShuttleItem[]
  selectedIds: string[]
  onChange: (nextIds: string[]) => void
  leftTitle: string
  rightTitle: string
  searchPlaceholder?: string
  emptyHint?: string
  // 顶部说明文字(例如"仅设置归属,不清除")
  note?: string
}

// 双列穿梭框:候选(左) ⇄ 已选(右)。中间是 4 个方向按钮 — 全部加入 / 加入选中 / 移除选中 / 全部移除。
// 设计参考方案 §2。组件本身无副作用,所有 diff 计算交给调用方在 onChange 后做。
export function ShoppingItemShuttle({
  candidates,
  selectedIds,
  onChange,
  leftTitle,
  rightTitle,
  searchPlaceholder,
  emptyHint,
  note,
}: ShuttleProps) {
  const { t } = useTranslation()
  const [leftQuery, setLeftQuery] = useState("")
  const [rightQuery, setRightQuery] = useState("")
  const [leftChecked, setLeftChecked] = useState<Set<string>>(() => new Set())
  const [rightChecked, setRightChecked] = useState<Set<string>>(() => new Set())

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds])

  const inSelected = useMemo(
    () => candidates.filter((item) => selectedSet.has(item.id)),
    [candidates, selectedSet],
  )
  const notInSelected = useMemo(
    () => candidates.filter((item) => !selectedSet.has(item.id)),
    [candidates, selectedSet],
  )

  const matches = (item: ShuttleItem, query: string) => {
    if (!query) return true
    const lower = query.toLocaleLowerCase()
    return (
      item.name.toLocaleLowerCase().includes(lower) ||
      (item.hint?.toLocaleLowerCase().includes(lower) ?? false)
    )
  }

  const filteredLeft = useMemo(
    () => notInSelected.filter((item) => matches(item, leftQuery)),
    [notInSelected, leftQuery],
  )
  const filteredRight = useMemo(
    () => inSelected.filter((item) => matches(item, rightQuery)),
    [inSelected, rightQuery],
  )

  // 工具:从某个集合提交 onChange,同时清空两侧勾选
  const commit = (nextIds: string[]) => {
    onChange(nextIds)
    setLeftChecked(new Set())
    setRightChecked(new Set())
  }

  const handleAddAll = () => {
    const next = [...selectedIds, ...filteredLeft.map((item) => item.id)]
    commit(Array.from(new Set(next)))
  }

  const handleAddChecked = () => {
    const next = [...selectedIds, ...Array.from(leftChecked)]
    commit(Array.from(new Set(next)))
  }

  const handleRemoveChecked = () => {
    const removeSet = rightChecked
    commit(selectedIds.filter((id) => !removeSet.has(id)))
  }

  const handleRemoveAll = () => {
    const removeSet = new Set(filteredRight.map((item) => item.id))
    commit(selectedIds.filter((id) => !removeSet.has(id)))
  }

  const toggleLeftChecked = (id: string) => {
    setLeftChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleRightChecked = (id: string) => {
    setRightChecked((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-2">
      {note ? <p className="text-[11px] leading-5 text-[color:var(--text-muted)]">{note}</p> : null}
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-2">
        <ShuttleColumn
          title={leftTitle}
          count={filteredLeft.length}
          totalCount={notInSelected.length}
          query={leftQuery}
          onQueryChange={setLeftQuery}
          searchPlaceholder={searchPlaceholder ?? t("shopping.shuttle.search")}
          items={filteredLeft}
          checkedSet={leftChecked}
          onToggle={toggleLeftChecked}
          emptyHint={emptyHint ?? t("shopping.shuttle.empty")}
        />

        <div className="flex flex-col items-center justify-center gap-1.5 self-center">
          <Button
            size="icon-sm"
            variant="outline"
            disabled={filteredLeft.length === 0}
            onClick={handleAddAll}
            title={t("shopping.shuttle.addAll")}
          >
            <ChevronsRight />
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            disabled={leftChecked.size === 0}
            onClick={handleAddChecked}
            title={t("shopping.shuttle.addChecked")}
          >
            <ChevronRight />
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            disabled={rightChecked.size === 0}
            onClick={handleRemoveChecked}
            title={t("shopping.shuttle.removeChecked")}
          >
            <ChevronLeft />
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            disabled={filteredRight.length === 0}
            onClick={handleRemoveAll}
            title={t("shopping.shuttle.removeAll")}
          >
            <ChevronsLeft />
          </Button>
        </div>

        <ShuttleColumn
          title={rightTitle}
          count={filteredRight.length}
          totalCount={inSelected.length}
          query={rightQuery}
          onQueryChange={setRightQuery}
          searchPlaceholder={searchPlaceholder ?? t("shopping.shuttle.search")}
          items={filteredRight}
          checkedSet={rightChecked}
          onToggle={toggleRightChecked}
          emptyHint={t("shopping.shuttle.noSelected")}
        />
      </div>
    </div>
  )
}

function ShuttleColumn({
  title,
  count,
  totalCount,
  query,
  onQueryChange,
  searchPlaceholder,
  items,
  checkedSet,
  onToggle,
  emptyHint,
}: {
  title: string
  count: number
  totalCount: number
  query: string
  onQueryChange: (value: string) => void
  searchPlaceholder: string
  items: ShuttleItem[]
  checkedSet: Set<string>
  onToggle: (id: string) => void
  emptyHint: string
}) {
  return (
    <div className="flex min-h-0 flex-col overflow-hidden rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]">
      <div className="flex items-center justify-between border-b border-[color:var(--muted-surface-border)] px-3 py-2">
        <span className="text-xs font-medium text-[color:var(--text-secondary)]">{title}</span>
        <span className="text-[11px] text-[color:var(--text-muted)]">
          {query ? `${count} / ${totalCount}` : totalCount}
        </span>
      </div>
      <div className="border-b border-[color:var(--muted-surface-border)] px-2 py-1.5">
        <div className="relative">
          <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-[color:var(--text-muted)]" />
          <Input
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="h-8 pl-7 text-[12px]"
          />
        </div>
      </div>
      <div className="max-h-72 min-h-32 flex-1 [scrollbar-width:thin] [scrollbar-color:var(--muted-surface-border)_transparent] overflow-y-auto px-1 py-1">
        {items.length > 0 ? (
          <ul className="space-y-0.5">
            {items.map((item) => (
              <li key={item.id}>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 transition-colors",
                    checkedSet.has(item.id)
                      ? "bg-[color:var(--tone-present-bg)]/40"
                      : "hover:bg-[color:var(--muted-surface-bg)]",
                  )}
                >
                  <input
                    type="checkbox"
                    checked={checkedSet.has(item.id)}
                    onChange={() => onToggle(item.id)}
                    className="mt-0.5 size-3.5 rounded border-[color:var(--surface-border)]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[12px] text-[color:var(--text-primary)]">
                      {item.name}
                    </div>
                    {item.hint ? (
                      <div className="truncate text-[10px] text-[color:var(--text-muted)]">
                        {item.hint}
                      </div>
                    ) : null}
                  </div>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex h-full items-center justify-center px-2 py-4">
            <p className="text-[11px] text-[color:var(--text-muted)]">{emptyHint}</p>
          </div>
        )}
      </div>
    </div>
  )
}
