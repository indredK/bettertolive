import {
  ArrowDownLeft,
  ArrowUpRight,
  CalendarDays,
  Landmark,
  Pencil,
  PieChart,
  Plus,
  Target,
  Trash2,
  Wallet,
} from "lucide-react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { AnimatedButton } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useSaveFinanceMutation } from "@/features/bettertolive/queries/use-save-finance-mutation"
import type {
  FinanceCategoryRule,
  FinanceModuleData,
  FinanceMonthlyTarget,
  TransactionEntry,
} from "@/features/bettertolive/types"
import {
  FinanceEntryEditDialog,
  type EditingFinanceEntry,
} from "@/features/bettertolive/ui/finance/finance-entry-edit-dialog"
import { translateFinanceEnum } from "@/features/bettertolive/ui/finance/finance-i18n"
import { getEntryMonth, getLatestMonth } from "@/features/bettertolive/ui/finance/finance-page-data"
import { formatCurrency } from "@/features/bettertolive/ui/shared/formatters"
import { EmptyState, SectionHeading, Surface } from "@/features/bettertolive/ui/shared/shared"
import { cn } from "@/lib/utils"

type FinanceSummary = {
  income: number
  expense: number
  net: number
  weeklyExpense: number
  dailyAverageExpense: number
}

type DistributionRow = {
  label: string
  amount: number
  count: number
  progress: number
}

const EMPTY_FINANCE: FinanceModuleData = {
  entries: [],
  monthlyTargets: [],
  categoryRules: [],
  reviewPrompts: [],
}

export function FinancePage({
  financeModule,
  editableFinanceModule,
  isControlMode = false,
  isStackedLayout = false,
}: {
  financeModule: FinanceModuleData
  editableFinanceModule?: FinanceModuleData
  isControlMode?: boolean
  isStackedLayout?: boolean
}) {
  const { i18n, t } = useTranslation()
  const locale = i18n.resolvedLanguage ?? i18n.language
  const isFixedLayout = !isStackedLayout
  const saveFinanceMutation = useSaveFinanceMutation()
  const [editingEntry, setEditingEntry] = useState<EditingFinanceEntry | null>(null)
  const finance = normalizeFinanceData(financeModule)
  const editableFinance = normalizeFinanceData(editableFinanceModule ?? financeModule)
  const entries = useMemo(() => sortEntriesByDate(finance.entries), [finance.entries])
  const latestMonth =
    getLatestMonth(entries) ??
    getLatestMonth(editableFinance.entries) ??
    new Date().toISOString().slice(0, 7)
  const monthEntries = entries.filter((entry) => getEntryMonth(entry.date) === latestMonth)
  const summary = createFinanceSummary(entries, monthEntries)
  const categoryRows = createDistributionRows(
    monthEntries.filter((entry) => entry.direction === "expense"),
    (entry) => entry.category,
  )
  const lifeSystemRows = createDistributionRows(
    monthEntries.filter((entry) => entry.direction === "expense" && entry.lifeSystem),
    (entry) => entry.lifeSystem ?? "",
  )
  const target = editableFinance.monthlyTargets.find((entry) => entry.month === latestMonth)
  const reviewEntries = entries.filter(
    (entry) => entry.reviewStatus === "待复盘" || entry.reviewStatus === "可优化",
  )

  const handleCreateEntry = () => {
    setEditingEntry({ isNew: true, entry: null })
  }

  const handleEditEntry = (entry: TransactionEntry) => {
    setEditingEntry({ isNew: false, entry })
  }

  const handleDeleteEntry = async (entry: TransactionEntry) => {
    const confirmed = window.confirm(
      t("finance.confirm.deleteEntry", {
        title: entry.label,
        defaultValue: `确定删除「${entry.label}」吗？`,
      }),
    )

    if (!confirmed) return

    try {
      await saveFinanceMutation.mutateAsync({
        ...editableFinance,
        entries: editableFinance.entries.filter((item) => item.id !== entry.id),
      })
      toast.success(t("finance.toast.deleted", "已删除账目"))
    } catch {
      toast.error(t("finance.toast.deleteFailed", "删除失败"))
    }
  }

  return (
    <div
      className={cn(
        "space-y-5",
        isFixedLayout && "flex h-full min-h-0 flex-col gap-3 space-y-0 overflow-hidden",
      )}
    >
      <Tabs
        defaultValue="overview"
        className={cn("min-h-0 flex-1 flex-col", isFixedLayout && "overflow-hidden")}
      >
        <div className="flex shrink-0 items-center gap-2 overflow-hidden">
          <div className="min-w-0 flex-1 overflow-hidden">
            <TabsList className="hide-scrollbar max-w-full shrink-0 justify-start overflow-x-auto">
              <TabsTrigger value="overview">{t("finance.tabs.overview", "总览")}</TabsTrigger>
              <TabsTrigger value="entries">{t("finance.tabs.entries", "明细")}</TabsTrigger>
              <TabsTrigger value="rules">{t("finance.tabs.rules", "预算规则")}</TabsTrigger>
              <TabsTrigger value="review">{t("finance.tabs.review", "复盘线索")}</TabsTrigger>
            </TabsList>
          </div>

          <AnimatedButton
            show={isControlMode}
            containerClassName="shrink-0"
            className="gap-2"
            onClick={handleCreateEntry}
          >
            <Plus className="size-4" />
            {t("finance.actions.addEntry", "记一笔")}
          </AnimatedButton>
        </div>

        <TabsContent
          value="overview"
          className={cn("mt-3", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          {isFixedLayout ? (
            <FinanceFixedDashboard
              categoryRows={categoryRows}
              entries={entries}
              isControlMode={isControlMode}
              lifeSystemRows={lifeSystemRows}
              locale={locale}
              reviewEntries={reviewEntries}
              summary={summary}
              target={target}
              categoryRules={editableFinance.categoryRules}
              reviewPrompts={editableFinance.reviewPrompts}
              onDeleteEntry={handleDeleteEntry}
              onEditEntry={handleEditEntry}
            />
          ) : (
            <FinanceStackedView
              categoryRows={categoryRows}
              entries={entries}
              isControlMode={isControlMode}
              lifeSystemRows={lifeSystemRows}
              locale={locale}
              reviewEntries={reviewEntries}
              summary={summary}
              target={target}
              categoryRules={editableFinance.categoryRules}
              reviewPrompts={editableFinance.reviewPrompts}
              onDeleteEntry={handleDeleteEntry}
              onEditEntry={handleEditEntry}
            />
          )}
        </TabsContent>

        <TabsContent
          value="entries"
          className={cn("mt-3", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          <Surface className={cn("p-4", isFixedLayout && "flex h-full min-h-0 flex-col")}>
            <SectionHeading
              icon={Wallet}
              title={t("finance.sections.entriesTitle", "最近账目")}
              description={t(
                "finance.sections.entriesDescription",
                "收入和支出都放在同一条现实时间线上。",
              )}
              compact
            />
            <TransactionList
              entries={entries}
              isControlMode={isControlMode}
              locale={locale}
              onDeleteEntry={handleDeleteEntry}
              onEditEntry={handleEditEntry}
            />
          </Surface>
        </TabsContent>

        <TabsContent
          value="rules"
          className={cn("mt-3", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          <div
            className={cn(
              "grid gap-3 min-[960px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]",
              isFixedLayout && "h-full min-h-0 overflow-hidden",
            )}
          >
            <Surface
              className={cn("p-4", isFixedLayout && "flex min-h-0 flex-col overflow-hidden")}
            >
              <SectionHeading
                icon={PieChart}
                title={t("finance.sections.distributionTitle", "类别和生活系统")}
                description={t(
                  "finance.sections.distributionDescription",
                  "先看钱流向哪里，再看它支撑了什么。",
                )}
                compact
              />
              <div
                className={cn(
                  "mt-3 space-y-4",
                  isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1",
                )}
              >
                <DistributionList rows={categoryRows} group="category" locale={locale} />
                <DistributionList rows={lifeSystemRows} group="lifeSystem" locale={locale} muted />
              </div>
            </Surface>
            <Surface
              className={cn("p-4", isFixedLayout && "flex min-h-0 flex-col overflow-hidden")}
            >
              <SectionHeading
                icon={Target}
                title={t("finance.rules.title", "预算规则")}
                description={t(
                  "finance.rules.description",
                  "把每类支出的意图和上限放在同一处校准。",
                )}
                compact
              />
              <div
                className={cn(
                  "mt-3 space-y-2",
                  isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1",
                )}
              >
                {editableFinance.categoryRules.length > 0 ? (
                  editableFinance.categoryRules.map((rule) => (
                    <CategoryRuleCard key={rule.id} rule={rule} />
                  ))
                ) : (
                  <EmptyState message={t("finance.empty.rules", "当前还没有预算规则。")} compact />
                )}
              </div>
            </Surface>
          </div>
        </TabsContent>

        <TabsContent
          value="review"
          className={cn("mt-3", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
        >
          <Surface className={cn("p-4", isFixedLayout && "flex h-full min-h-0 flex-col")}>
            <SectionHeading
              icon={Target}
              title={t("finance.sections.reviewTitle", "目标和复盘")}
              description={t(
                "finance.sections.reviewDescription",
                "目标不是压迫，而是给钱一个方向。",
              )}
              compact
            />
            <div
              className={cn(
                "mt-3 space-y-3",
                isFixedLayout && "min-h-0 flex-1 overflow-y-auto pr-1",
              )}
            >
              <TargetCard locale={locale} summary={summary} target={target} />
              <ReviewPanel
                entries={reviewEntries}
                locale={locale}
                prompts={editableFinance.reviewPrompts}
                rules={editableFinance.categoryRules}
              />
            </div>
          </Surface>
        </TabsContent>
      </Tabs>

      {editingEntry ? (
        <FinanceEntryEditDialog
          editing={editingEntry}
          finance={editableFinance}
          onClose={() => setEditingEntry(null)}
        />
      ) : null}
    </div>
  )
}

function FinanceFixedDashboard({
  categoryRows,
  entries,
  isControlMode,
  lifeSystemRows,
  locale,
  reviewEntries,
  summary,
  target,
  categoryRules,
  reviewPrompts,
  onDeleteEntry,
  onEditEntry,
}: {
  categoryRows: DistributionRow[]
  entries: TransactionEntry[]
  isControlMode: boolean
  lifeSystemRows: DistributionRow[]
  locale: string
  reviewEntries: TransactionEntry[]
  summary: FinanceSummary
  target: FinanceMonthlyTarget | undefined
  categoryRules: FinanceCategoryRule[]
  reviewPrompts: string[]
  onDeleteEntry: (entry: TransactionEntry) => void
  onEditEntry: (entry: TransactionEntry) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)_minmax(320px,0.84fr)] grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden">
      <SummaryStrip className="col-span-3" locale={locale} summary={summary} />

      <Surface className="col-span-2 flex min-h-0 flex-col overflow-hidden p-4">
        <SectionHeading
          icon={Wallet}
          title={t("finance.sections.entriesTitle", "最近账目")}
          description={t(
            "finance.sections.entriesDescription",
            "收入和支出都放在同一条现实时间线上。",
          )}
          compact
        />
        <TransactionList
          entries={entries}
          isControlMode={isControlMode}
          locale={locale}
          onDeleteEntry={onDeleteEntry}
          onEditEntry={onEditEntry}
        />
      </Surface>

      <div className="grid min-h-0 gap-3 overflow-hidden">
        <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
          <SectionHeading
            icon={PieChart}
            title={t("finance.sections.distributionTitle", "类别和生活系统")}
            description={t(
              "finance.sections.distributionDescription",
              "先看钱流向哪里，再看它支撑了什么。",
            )}
            compact
          />
          <div className="mt-3 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
            <DistributionList rows={categoryRows} group="category" locale={locale} />
            <DistributionList rows={lifeSystemRows} group="lifeSystem" locale={locale} muted />
          </div>
        </Surface>

        <Surface className="flex min-h-0 flex-col overflow-hidden p-4">
          <SectionHeading
            icon={Target}
            title={t("finance.sections.reviewTitle", "目标和复盘")}
            description={t(
              "finance.sections.reviewDescription",
              "目标不是压迫，而是给钱一个方向。",
            )}
            compact
          />
          <div className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
            <TargetCard locale={locale} summary={summary} target={target} />
            <ReviewPanel
              entries={reviewEntries}
              locale={locale}
              prompts={reviewPrompts}
              rules={categoryRules}
            />
          </div>
        </Surface>
      </div>
    </div>
  )
}

function FinanceStackedView({
  categoryRows,
  entries,
  isControlMode,
  lifeSystemRows,
  locale,
  reviewEntries,
  summary,
  target,
  categoryRules,
  reviewPrompts,
  onDeleteEntry,
  onEditEntry,
}: {
  categoryRows: DistributionRow[]
  entries: TransactionEntry[]
  isControlMode: boolean
  lifeSystemRows: DistributionRow[]
  locale: string
  reviewEntries: TransactionEntry[]
  summary: FinanceSummary
  target: FinanceMonthlyTarget | undefined
  categoryRules: FinanceCategoryRule[]
  reviewPrompts: string[]
  onDeleteEntry: (entry: TransactionEntry) => void
  onEditEntry: (entry: TransactionEntry) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-4">
      <SummaryStrip locale={locale} summary={summary} />

      <Surface className="p-5">
        <SectionHeading
          icon={Wallet}
          title={t("finance.sections.entriesTitle", "最近账目")}
          description={t(
            "finance.sections.entriesDescription",
            "收入和支出都放在同一条现实时间线上。",
          )}
        />
        <TransactionList
          entries={entries}
          isControlMode={isControlMode}
          locale={locale}
          onDeleteEntry={onDeleteEntry}
          onEditEntry={onEditEntry}
        />
      </Surface>

      <div className="grid gap-4 min-[960px]:grid-cols-2">
        <Surface className="p-5">
          <SectionHeading
            icon={PieChart}
            title={t("finance.sections.distributionTitle", "类别和生活系统")}
            description={t(
              "finance.sections.distributionDescription",
              "先看钱流向哪里，再看它支撑了什么。",
            )}
          />
          <div className="mt-4 space-y-4">
            <DistributionList rows={categoryRows} group="category" locale={locale} />
            <DistributionList rows={lifeSystemRows} group="lifeSystem" locale={locale} muted />
          </div>
        </Surface>

        <Surface className="p-5">
          <SectionHeading
            icon={Target}
            title={t("finance.sections.reviewTitle", "目标和复盘")}
            description={t(
              "finance.sections.reviewDescription",
              "目标不是压迫，而是给钱一个方向。",
            )}
          />
          <div className="mt-4 space-y-3">
            <TargetCard locale={locale} summary={summary} target={target} />
            <ReviewPanel
              entries={reviewEntries}
              locale={locale}
              prompts={reviewPrompts}
              rules={categoryRules}
            />
          </div>
        </Surface>
      </div>
    </div>
  )
}

function SummaryStrip({
  className,
  locale,
  summary,
}: {
  className?: string
  locale: string
  summary: FinanceSummary
}) {
  const { t } = useTranslation()

  return (
    <Surface className={cn("grid gap-2 p-3 min-[900px]:grid-cols-4", className)}>
      <MetricCell
        icon={ArrowUpRight}
        label={t("finance.summary.income", "本月收入")}
        value={formatCurrency(summary.income, locale)}
        tone="income"
      />
      <MetricCell
        icon={ArrowDownLeft}
        label={t("finance.summary.expense", "本月支出")}
        value={formatCurrency(summary.expense, locale)}
        tone="expense"
      />
      <MetricCell
        icon={Landmark}
        label={t("finance.summary.net", "本月结余")}
        value={formatCurrency(summary.net, locale)}
        tone={summary.net >= 0 ? "income" : "expense"}
      />
      <MetricCell
        icon={CalendarDays}
        label={t("finance.summary.weeklyExpense", "近 7 日支出")}
        value={formatCurrency(summary.weeklyExpense, locale)}
        detail={t("finance.summary.dailyAverage", {
          value: formatCurrency(summary.dailyAverageExpense, locale),
          defaultValue: "日均 {{value}}",
        })}
        tone="neutral"
      />
    </Surface>
  )
}

function MetricCell({
  detail,
  icon: Icon,
  label,
  tone,
  value,
}: {
  detail?: string
  icon: typeof ArrowUpRight
  label: string
  tone: "income" | "expense" | "neutral"
  value: string
}) {
  return (
    <div
      className={cn(
        "min-w-0 rounded-lg border px-3 py-3",
        tone === "income" &&
          "border-[color:var(--finance-income-border)] bg-[color:var(--finance-income-bg)]",
        tone === "expense" &&
          "border-[color:var(--finance-expense-border)] bg-[color:var(--finance-expense-bg)]",
        tone === "neutral" &&
          "border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)]",
      )}
    >
      <div className="flex items-center gap-2 text-xs text-[color:var(--text-muted)]">
        <Icon className="size-3.5" />
        <span>{label}</span>
      </div>
      <div className="mt-2 truncate text-lg font-semibold text-[color:var(--text-primary)]">
        {value}
      </div>
      {detail ? <div className="mt-1 text-xs text-[color:var(--text-muted)]">{detail}</div> : null}
    </div>
  )
}

function TransactionList({
  entries,
  isControlMode,
  locale,
  onDeleteEntry,
  onEditEntry,
}: {
  entries: TransactionEntry[]
  isControlMode: boolean
  locale: string
  onDeleteEntry: (entry: TransactionEntry) => void
  onEditEntry: (entry: TransactionEntry) => void
}) {
  const { t } = useTranslation()

  return (
    <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
      {entries.length > 0 ? (
        entries.map((entry) => (
          <TransactionCard
            key={entry.id}
            entry={entry}
            isControlMode={isControlMode}
            locale={locale}
            onDelete={() => onDeleteEntry(entry)}
            onEdit={() => onEditEntry(entry)}
          />
        ))
      ) : (
        <EmptyState message={t("finance.empty.entries", "当前筛选下还没有账目记录。")} compact />
      )}
    </div>
  )
}

function TransactionCard({
  entry,
  isControlMode,
  locale,
  onDelete,
  onEdit,
}: {
  entry: TransactionEntry
  isControlMode: boolean
  locale: string
  onDelete: () => void
  onEdit: () => void
}) {
  const { t } = useTranslation()
  const isIncome = entry.direction === "income"

  return (
    <article className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[color:var(--text-muted)]">
              {formatEntryDate(entry.date, locale)}
            </span>
            <Badge
              variant="outline"
              className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
            >
              {translateFinanceEnum(t, "category", entry.category)}
            </Badge>
            {entry.reviewStatus ? (
              <Badge
                variant="outline"
                className={cn(
                  "border-[color:var(--chip-border)]",
                  entry.reviewStatus === "待复盘" || entry.reviewStatus === "可优化"
                    ? "bg-[color:var(--finance-review-bg)] text-[color:var(--finance-review-ink)]"
                    : "bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)]",
                )}
              >
                {translateFinanceEnum(t, "reviewStatus", entry.reviewStatus)}
              </Badge>
            ) : null}
          </div>
          <h3 className="mt-2 text-base font-medium text-[color:var(--text-primary)]">
            {entry.label}
          </h3>
          <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{entry.note}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-[color:var(--text-muted)]">
            {entry.account ? <span>{entry.account}</span> : null}
            {entry.lifeSystem ? (
              <span>{translateFinanceEnum(t, "lifeSystem", entry.lifeSystem)}</span>
            ) : null}
            {entry.necessity ? (
              <span>{translateFinanceEnum(t, "necessity", entry.necessity)}</span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          <div
            className={cn(
              "text-base font-semibold",
              isIncome
                ? "text-[color:var(--finance-income-ink)]"
                : "text-[color:var(--finance-expense-ink)]",
            )}
          >
            {isIncome ? "+" : "-"}
            {formatCurrency(entry.amount, locale)}
          </div>
          <div className="flex gap-1">
            <AnimatedButton
              show={isControlMode}
              aria-label={t("finance.actions.editEntry", "编辑账目")}
              size="icon-sm"
              variant="outline"
              onClick={onEdit}
            >
              <Pencil className="size-3.5" />
            </AnimatedButton>
            <AnimatedButton
              show={isControlMode}
              aria-label={t("finance.actions.deleteEntry", "删除账目")}
              size="icon-sm"
              variant="outline"
              onClick={onDelete}
            >
              <Trash2 className="size-3.5" />
            </AnimatedButton>
          </div>
        </div>
      </div>
    </article>
  )
}

function DistributionList({
  group,
  locale,
  muted = false,
  rows,
}: {
  group: "category" | "lifeSystem"
  locale: string
  muted?: boolean
  rows: DistributionRow[]
}) {
  const { t } = useTranslation()

  if (rows.length === 0) {
    return (
      <EmptyState
        message={t("finance.empty.distribution", "当前筛选下没有可展示的分布。")}
        compact
      />
    )
  }

  return (
    <div className="space-y-2">
      {rows.slice(0, 7).map((row) => (
        <div key={row.label} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium text-[color:var(--text-secondary)]">
              {translateFinanceEnum(t, group, row.label)}
            </span>
            <span className="shrink-0 text-[color:var(--text-muted)]">
              {formatCurrency(row.amount, locale)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-[color:var(--muted-surface-border)]">
            <div
              className={cn(
                "h-2 rounded-full",
                muted
                  ? "bg-[color:var(--finance-system-bar)]"
                  : "bg-[color:var(--finance-expense-ink)]",
              )}
              style={{ width: `${row.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function CategoryRuleCard({ rule }: { rule: FinanceCategoryRule }) {
  const { i18n, t } = useTranslation()
  const locale = i18n.resolvedLanguage ?? i18n.language

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-medium text-[color:var(--text-primary)]">
          {translateFinanceEnum(t, "category", rule.category)}
        </div>
        {rule.monthlyLimit ? (
          <Badge
            variant="outline"
            className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
          >
            {formatCurrency(rule.monthlyLimit, locale)}
          </Badge>
        ) : null}
      </div>
      <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">{rule.intent}</p>
      {rule.reviewPrompt ? (
        <p className="mt-2 border-t border-[color:var(--muted-surface-border)] pt-2 text-xs leading-5 text-[color:var(--text-muted)]">
          {rule.reviewPrompt}
        </p>
      ) : null}
    </div>
  )
}

function TargetCard({
  locale,
  summary,
  target,
}: {
  locale: string
  summary: FinanceSummary
  target: FinanceMonthlyTarget | undefined
}) {
  const { t } = useTranslation()

  if (!target) {
    return <EmptyState message={t("finance.target.empty", "当前月份还没有目标。")} compact />
  }

  const expenseProgress =
    target.expenseLimit && target.expenseLimit > 0
      ? Math.min(100, Math.round((summary.expense / target.expenseLimit) * 100))
      : 0
  const savingProgress =
    target.savingTarget && target.savingTarget > 0
      ? Math.min(100, Math.round((Math.max(summary.net, 0) / target.savingTarget) * 100))
      : 0

  return (
    <div className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--chip-bg)] px-3 py-3">
      <div className="text-sm font-medium text-[color:var(--text-primary)]">{target.month}</div>
      {target.note ? (
        <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">{target.note}</p>
      ) : null}
      <div className="mt-3 space-y-2">
        {target.expenseLimit ? (
          <ProgressLine
            label={t("finance.target.expenseLimit", "支出上限")}
            progress={expenseProgress}
            value={`${formatCurrency(summary.expense, locale)} / ${formatCurrency(
              target.expenseLimit,
              locale,
            )}`}
          />
        ) : null}
        {target.savingTarget ? (
          <ProgressLine
            label={t("finance.target.savingTarget", "储蓄目标")}
            progress={savingProgress}
            value={`${formatCurrency(Math.max(summary.net, 0), locale)} / ${formatCurrency(
              target.savingTarget,
              locale,
            )}`}
          />
        ) : null}
      </div>
    </div>
  )
}

function ProgressLine({
  label,
  progress,
  value,
}: {
  label: string
  progress: number
  value: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-xs">
        <span className="text-[color:var(--text-muted)]">{label}</span>
        <span className="text-[color:var(--text-secondary)]">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-[color:var(--muted-surface-border)]">
        <div
          className="h-2 rounded-full bg-[color:var(--finance-income-ink)]"
          style={{ width: `${Math.max(4, progress)}%` }}
        />
      </div>
    </div>
  )
}

function ReviewPanel({
  entries,
  locale,
  prompts,
  rules,
}: {
  entries: TransactionEntry[]
  locale: string
  prompts: string[]
  rules: FinanceCategoryRule[]
}) {
  const { t } = useTranslation()

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        {entries.length > 0 ? (
          entries.slice(0, 3).map((entry) => (
            <div
              key={entry.id}
              className="rounded-lg border border-[color:var(--finance-review-border)] bg-[color:var(--finance-review-bg)] px-3 py-2"
            >
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium text-[color:var(--finance-review-ink)]">
                  {entry.label}
                </span>
                <span className="shrink-0 text-[color:var(--finance-review-ink)]">
                  {formatCurrency(entry.amount, locale)}
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">{entry.note}</p>
            </div>
          ))
        ) : (
          <EmptyState
            message={t("finance.empty.reviewEntries", "当前没有需要优先复盘的账目。")}
            compact
          />
        )}
      </div>

      {rules.length > 0 ? (
        <div className="space-y-2 border-t border-[color:var(--muted-surface-border)] pt-3">
          {rules.slice(0, 2).map((rule) => (
            <div key={rule.id} className="text-xs leading-5 text-[color:var(--text-muted)]">
              <span className="font-medium text-[color:var(--text-secondary)]">
                {translateFinanceEnum(t, "category", rule.category)}
              </span>
              {locale.startsWith("zh") ? "：" : ": "}
              {rule.reviewPrompt ?? rule.intent}
            </div>
          ))}
        </div>
      ) : null}

      {prompts.length > 0 ? (
        <div className="space-y-2 border-t border-[color:var(--muted-surface-border)] pt-3">
          {prompts.slice(0, 2).map((prompt) => (
            <div key={prompt} className="text-xs leading-5 text-[color:var(--text-muted)]">
              {prompt}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function createFinanceSummary(
  entries: TransactionEntry[],
  monthEntries: TransactionEntry[],
): FinanceSummary {
  const latestDate = entries
    .map((entry) => parseDateValue(entry.date))
    .filter((date): date is Date => date !== null)
    .sort((left, right) => right.getTime() - left.getTime())[0]
  const weekStart = latestDate ? new Date(latestDate) : null

  if (weekStart) {
    weekStart.setDate(weekStart.getDate() - 6)
  }

  const weekEntries = weekStart
    ? entries.filter((entry) => {
        const date = parseDateValue(entry.date)
        return date ? date >= weekStart && date <= latestDate : false
      })
    : entries
  const income = sumEntries(monthEntries, "income")
  const expense = sumEntries(monthEntries, "expense")
  const weeklyExpense = sumEntries(weekEntries, "expense")
  const uniqueExpenseDays = new Set(
    monthEntries.filter((entry) => entry.direction === "expense").map((entry) => entry.date),
  ).size

  return {
    income,
    expense,
    net: income - expense,
    weeklyExpense,
    dailyAverageExpense: uniqueExpenseDays > 0 ? expense / uniqueExpenseDays : 0,
  }
}

function createDistributionRows(
  entries: TransactionEntry[],
  getValue: (entry: TransactionEntry) => string,
): DistributionRow[] {
  const total = entries.reduce((sum, entry) => sum + entry.amount, 0)
  const rows = new Map<string, { amount: number; count: number }>()

  entries.forEach((entry) => {
    const label = getValue(entry)
    if (!label) return

    const current = rows.get(label) ?? { amount: 0, count: 0 }
    rows.set(label, {
      amount: current.amount + entry.amount,
      count: current.count + 1,
    })
  })

  return Array.from(rows.entries())
    .map(([label, row]) => ({
      label,
      amount: row.amount,
      count: row.count,
      progress: total > 0 ? Math.max(8, Math.round((row.amount / total) * 100)) : 0,
    }))
    .sort((left, right) => right.amount - left.amount)
}

function sumEntries(entries: TransactionEntry[], direction: TransactionEntry["direction"]) {
  return entries
    .filter((entry) => entry.direction === direction)
    .reduce((sum, entry) => sum + entry.amount, 0)
}

function parseDateValue(date: string) {
  const parsed = new Date(`${date}T00:00:00`)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatEntryDate(date: string, locale: string) {
  const parsed = parseDateValue(date)

  if (!parsed) return date

  return new Intl.DateTimeFormat(locale, {
    month: "2-digit",
    day: "2-digit",
  }).format(parsed)
}

function sortEntriesByDate(entries: TransactionEntry[]) {
  return [...entries].sort((left, right) => right.date.localeCompare(left.date))
}

function normalizeFinanceData(finance: FinanceModuleData | undefined): FinanceModuleData {
  return {
    ...EMPTY_FINANCE,
    ...finance,
    entries: finance?.entries ?? [],
    monthlyTargets: finance?.monthlyTargets ?? [],
    categoryRules: finance?.categoryRules ?? [],
    reviewPrompts: finance?.reviewPrompts ?? [],
  }
}
