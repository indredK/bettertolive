import { Heart, History, MessageCircleHeart, Pencil } from "lucide-react"
import {
  FilterAppliedChips,
  FilterPopoverButton,
  type FilterPopoverDimension,
} from "@/features/bettertolive/shared/filter-popover"
import type { TFunction } from "i18next"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AnimatedIconButton } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { MealLog, NutritionModuleData } from "@/features/bettertolive/types"
import {
  NutritionMealLogEditDialog,
  type EditingMealLog,
} from "@/features/bettertolive/nutrition/nutrition-meal-log-edit-dialog"
import {
  buildLogFocusReasonIds,
  buildNutritionLookups,
  formatEntryTitle,
  logNeedsCare,
  summarizeLogFoodSemantics,
} from "@/features/bettertolive/nutrition/nutrition-page-data"
import {
  NUTRITION_DETAIL_CARD_CLASS,
  NutritionPanel,
  NutritionTabViewport,
} from "@/features/bettertolive/nutrition/nutrition-page-shared"
import { translateNutritionEnum } from "@/features/bettertolive/nutrition/nutrition-i18n"
import { cn } from "@/lib/utils"

const LOG_FILTERS = ["all", "linkedPlan", "linkedMemory", "changed", "needsCare"] as const

type LogFilter = (typeof LOG_FILTERS)[number]
type ReviewFocus =
  | {
      kind: "highlight"
      id: string
      label: string
      evidence: string[]
    }
  | {
      kind: "crossViewRow"
      id: string
      label: string
      evidence: string[]
    }
  | {
      kind: "missingSignal"
      id: string
      label: string
      evidence: string[]
    }

export function NutritionLogsTab({
  createRequested = false,
  editableNutrition,
  isControlMode = false,
  onCreateHandled,
  nutrition,
}: {
  createRequested?: boolean
  editableNutrition?: NutritionModuleData
  isControlMode?: boolean
  onCreateHandled?: () => void
  nutrition: NutritionModuleData
}) {
  const { t } = useTranslation()
  const sourceNutrition = editableNutrition ?? nutrition
  const [editingLog, setEditingLog] = useState<EditingMealLog | null>(null)
  const [query, setQuery] = useState("")
  const [filter, setFilter] = useState<LogFilter>("all")
  const [reviewFocus, setReviewFocus] = useState<ReviewFocus | null>(null)
  const lookups = useMemo(() => buildNutritionLookups(nutrition), [nutrition])
  const filteredLogs = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const focusedEvidence = reviewFocus ? new Set(reviewFocus.evidence) : null

    return nutrition.mealLogs.filter((log) => {
      const relatedFoodMemory = log.relatedFoodMemoryId
        ? ((nutrition.foodMemories ?? []).find((memory) => memory.id === log.relatedFoodMemoryId) ??
          null)
        : null
      const text = buildLogSearchText(log, lookups, relatedFoodMemory, t)

      return (
        (!focusedEvidence || focusedEvidence.has(log.id)) &&
        matchesLogFilter(log, filter) &&
        (!normalizedQuery || text.toLowerCase().includes(normalizedQuery))
      )
    })
  }, [filter, lookups, nutrition.foodMemories, nutrition.mealLogs, query, reviewFocus, t])

  useEffect(() => {
    if (!isControlMode || !createRequested) return
    setTimeout(() => setEditingLog({ isNew: true, log: null }), 0)
    onCreateHandled?.()
  }, [createRequested, isControlMode, onCreateHandled])

  return (
    <NutritionTabViewport>
      <div className="grid min-h-[620px] flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.42fr)]">
        <NutritionPanel className="min-h-0 overflow-hidden" contentClassName="space-y-3 p-4">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-muted-foreground text-xs leading-5">
                {t("nutrition.logs.description")}
              </p>
              <Badge
                variant="outline"
                className="border-foreground/10 bg-muted text-muted-foreground"
              >
                {filteredLogs.length}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("nutrition.logs.search")}
                  className="border-foreground/15 bg-background min-w-0 flex-1"
                />
                <FilterPopoverButton
                  className="shrink-0"
                  popoverWidth="16rem"
                  dimensions={[
                    {
                      key: "filter",
                      label: t("common.filter.label"),
                      allLabel: t("nutrition.logs.filters.all"),
                      value: filter,
                      options: (LOG_FILTERS.slice(1) as ReadonlyArray<string>).map((f) => ({
                        value: f,
                        label: t(`nutrition.logs.filters.${f}`),
                      })),
                    } satisfies FilterPopoverDimension,
                  ]}
                  onChangeFilter={(_, value) => setFilter(value as LogFilter)}
                  onClearAll={() => setFilter("all")}
                />
              </div>
              <FilterAppliedChips
                dimensions={[
                  {
                    key: "filter",
                    label: t("common.filter.label"),
                    allLabel: t("nutrition.logs.filters.all"),
                    value: filter,
                    options: (LOG_FILTERS.slice(1) as ReadonlyArray<string>).map((f) => ({
                      value: f,
                      label: t(`nutrition.logs.filters.${f}`),
                    })),
                  } satisfies FilterPopoverDimension,
                ]}
                onChangeFilter={(_, value) => setFilter(value as LogFilter)}
              />
            </div>
            {reviewFocus ? (
              <div className="border-ring/40 bg-accent/45 flex flex-wrap items-center justify-between gap-2 rounded-xl border px-3 py-2">
                <div className="min-w-0">
                  <div className="text-[11px] font-medium">{t("nutrition.logs.focusLabel")}</div>
                  <p className="text-muted-foreground truncate text-xs leading-5">
                    {reviewFocus.label}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setReviewFocus(null)}
                >
                  {t("common.filter.clearAll")}
                </Button>
              </div>
            ) : null}
          </div>
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <LogCard
                key={log.id}
                log={log}
                nutrition={nutrition}
                lookups={lookups}
                reviewFocus={reviewFocus}
                onEdit={isControlMode ? () => setEditingLog({ isNew: false, log }) : undefined}
              />
            ))
          ) : (
            <div className="border-foreground/15 bg-muted/20 text-muted-foreground flex min-h-[180px] items-center justify-center rounded-2xl border border-dashed p-6 text-center text-sm">
              {t("nutrition.logs.empty")}
            </div>
          )}
        </NutritionPanel>

        <Card className={cn(NUTRITION_DETAIL_CARD_CLASS, "flex min-h-0 flex-col overflow-hidden")}>
          <CardContent className="flex min-h-0 flex-1 flex-col p-4">
            <div className="flex items-center gap-2">
              <MessageCircleHeart className="size-4" />
              <h3 className="text-sm font-semibold">{t("nutrition.logs.review")}</h3>
            </div>
            <div className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
              {nutrition.weeklyReview.highlights.length > 0 ? (
                <section className="space-y-2">
                  <div className="text-muted-foreground text-[11px] font-medium">
                    {t("nutrition.logs.highlights")}
                  </div>
                  {nutrition.weeklyReview.highlights.map((highlight) => (
                    <button
                      key={highlight.id}
                      type="button"
                      className={cn(
                        "border-foreground/10 bg-background/70 w-full rounded-xl border p-3 text-left transition-colors",
                        reviewFocus?.kind === "highlight" && reviewFocus.id === highlight.id
                          ? "border-ring/50 bg-accent/40"
                          : "hover:border-ring/35 hover:bg-muted/35",
                      )}
                      onClick={() =>
                        setReviewFocus({
                          kind: "highlight",
                          id: highlight.id,
                          label: highlight.title,
                          evidence: highlight.evidence,
                        })
                      }
                    >
                      <div className="text-sm font-medium">{highlight.title}</div>
                      <p className="text-muted-foreground mt-1 text-xs leading-5">
                        {highlight.summary}
                      </p>
                      {highlight.evidence.length > 0 ? (
                        <Badge
                          variant="outline"
                          className="border-foreground/10 bg-muted text-muted-foreground mt-2 text-[10px]"
                        >
                          {t("nutrition.logs.evidenceCount", {
                            count: highlight.evidence.length,
                          })}
                        </Badge>
                      ) : null}
                    </button>
                  ))}
                </section>
              ) : null}
              {nutrition.weeklyReview.missingSignals.length > 0 ? (
                <section className="space-y-2">
                  <div className="text-muted-foreground text-[11px] font-medium">
                    {t("nutrition.logs.missingSignals")}
                  </div>
                  <div className="border-foreground/10 bg-background/70 rounded-xl border p-3">
                    <div className="space-y-2">
                      {nutrition.weeklyReview.missingSignals.map((signal) => (
                        <button
                          key={signal.id}
                          type="button"
                          className={cn(
                            "text-muted-foreground border-foreground/10 bg-muted/20 w-full rounded-lg border px-3 py-2 text-left text-xs leading-5 transition-colors",
                            reviewFocus?.kind === "missingSignal" && reviewFocus.id === signal.id
                              ? "border-ring/50 bg-accent/35"
                              : "hover:border-ring/35 hover:bg-background/75",
                          )}
                          onClick={() =>
                            setReviewFocus({
                              kind: "missingSignal",
                              id: signal.id,
                              label: signal.label,
                              evidence: signal.evidence,
                            })
                          }
                        >
                          {signal.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </section>
              ) : null}
              {nutrition.weeklyReview.crossViews.length > 0 ? (
                <section className="space-y-2">
                  <div className="text-muted-foreground text-[11px] font-medium">
                    {t("nutrition.logs.crossViews")}
                  </div>
                  {nutrition.weeklyReview.crossViews.map((view) => (
                    <div
                      key={view.id}
                      className="border-foreground/10 bg-background/70 rounded-xl border p-3"
                    >
                      <div className="text-sm font-medium">{view.title}</div>
                      <p className="text-muted-foreground mt-1 text-xs leading-5">{view.summary}</p>
                      <div className="mt-3 space-y-2">
                        {view.rows.map((row) => (
                          <button
                            key={`${view.id}:${row.id}`}
                            type="button"
                            className={cn(
                              "border-foreground/10 bg-muted/20 w-full rounded-lg border px-3 py-2 text-left transition-colors",
                              reviewFocus?.kind === "crossViewRow" &&
                                reviewFocus.id === `${view.id}:${row.id}`
                                ? "border-ring/50 bg-accent/35"
                                : "hover:border-ring/35 hover:bg-background/75",
                            )}
                            onClick={() =>
                              setReviewFocus({
                                kind: "crossViewRow",
                                id: `${view.id}:${row.id}`,
                                label: `${view.title} · ${row.label}`,
                                evidence: row.evidence,
                              })
                            }
                          >
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span>{row.label}</span>
                              <span className="font-semibold">{row.count}</span>
                            </div>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                              {row.valueDensity ? (
                                <Badge
                                  variant="outline"
                                  className="border-foreground/10 bg-background/70 text-[10px]"
                                >
                                  {translateNutritionEnum(t, "valueDensity", row.valueDensity)}
                                </Badge>
                              ) : null}
                              {row.bodyFeedback ? (
                                <Badge
                                  variant="outline"
                                  className="border-ring/50 bg-accent text-accent-foreground text-[10px]"
                                >
                                  {translateNutritionEnum(t, "bodyFeedback", row.bodyFeedback)}
                                </Badge>
                              ) : null}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              ) : null}
              {nutrition.weeklyReview.highlights.length === 0 &&
              nutrition.weeklyReview.missingSignals.length === 0 &&
              nutrition.weeklyReview.crossViews.length === 0 ? (
                <div className="border-foreground/10 bg-background/70 rounded-xl border p-3 text-xs leading-5">
                  {t("nutrition.logs.noReviewData")}
                </div>
              ) : null}
              <div className="border-foreground/15 bg-muted/25 text-muted-foreground rounded-xl border border-dashed p-3 text-xs leading-5">
                {t("nutrition.logs.boundary")}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {isControlMode && editingLog ? (
        <NutritionMealLogEditDialog
          key={editingLog.log?.id ?? "new-meal-log"}
          editing={editingLog}
          nutrition={sourceNutrition}
          onClose={() => setEditingLog(null)}
        />
      ) : null}
    </NutritionTabViewport>
  )
}

function LogCard({
  lookups,
  log,
  nutrition,
  reviewFocus,
  onEdit,
}: {
  lookups: ReturnType<typeof buildNutritionLookups>
  log: MealLog
  nutrition: NutritionModuleData
  reviewFocus: ReviewFocus | null
  onEdit?: () => void
}) {
  const { t } = useTranslation()
  const relatedFoodMemory = log.relatedFoodMemoryId
    ? ((nutrition.foodMemories ?? []).find((memory) => memory.id === log.relatedFoodMemoryId) ??
      null)
    : null
  const semanticBadges = buildLogSemanticBadges(log, lookups, t)
  const focusReasons = buildLogFocusReasons({ log, lookups, reviewFocus, t })

  return (
    <article
      className={cn(
        "border-foreground/10 bg-background/70 rounded-2xl border p-4",
        reviewFocus?.evidence.includes(log.id) && "border-ring/45 bg-accent/10",
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-muted-foreground flex items-center gap-2 text-xs">
            <History className="size-3.5" />
            {log.dateTime}
          </div>
          <div className="mt-2 space-y-1">
            {log.entries.map((entry, index) => (
              <div key={`${log.id}-${index}`} className="font-medium">
                {formatEntryTitle({
                  entry,
                  foodById: lookups.foodById,
                  recipeById: lookups.recipeById,
                  servingLabel: t("nutrition.units.serving"),
                  unitLabel: (unit) => translateNutritionEnum(t, "unit", unit),
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-start justify-end gap-1.5">
          <div className="flex flex-wrap justify-end gap-1.5">
            {log.scene ? (
              <Badge
                variant="outline"
                className="border-foreground/10 bg-muted text-muted-foreground"
              >
                {translateNutritionEnum(t, "scene", log.scene)}
              </Badge>
            ) : null}
            {log.trigger ? (
              <Badge
                variant="outline"
                className="border-foreground/10 bg-muted text-muted-foreground"
              >
                {translateNutritionEnum(t, "trigger", log.trigger)}
              </Badge>
            ) : null}
            {log.bodyFeedback ? (
              <Badge variant="outline" className="border-ring/50 bg-accent text-accent-foreground">
                {translateNutritionEnum(t, "bodyFeedback", log.bodyFeedback)}
              </Badge>
            ) : null}
            {relatedFoodMemory ? (
              <Badge
                variant="outline"
                className="border-foreground/10 bg-muted text-muted-foreground"
              >
                <Heart className="size-3" />
                {relatedFoodMemory.name}
              </Badge>
            ) : null}
          </div>
          <AnimatedIconButton
            show={Boolean(onEdit)}
            type="button"
            variant="ghost"
            size="icon-sm"
            label={t("common.actions.edit")}
            icon={<Pencil className="size-3.5" />}
            onClick={onEdit}
          />
        </div>
      </div>

      {log.changeReason ? (
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          {t("nutrition.logs.changeReasonWithValue", {
            reason: log.changeReason,
          })}
        </p>
      ) : null}
      {log.note ? <p className="text-muted-foreground mt-2 text-sm leading-6">{log.note}</p> : null}
      {focusReasons.length > 0 ? (
        <div className="border-ring/35 bg-accent/20 mt-3 rounded-xl border px-3 py-2">
          <div className="text-[11px] font-medium">{t("nutrition.logs.focusReasonLabel")}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {focusReasons.map((reason) => (
              <Badge
                key={`${log.id}:${reason}`}
                variant="outline"
                className="border-ring/45 bg-background/80 text-[10px]"
              >
                {reason}
              </Badge>
            ))}
          </div>
        </div>
      ) : null}
      {relatedFoodMemory ? (
        <div className="border-foreground/10 bg-muted/20 mt-3 rounded-xl border px-3 py-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="outline" className="border-foreground/10 bg-background/70 text-[10px]">
              {translateNutritionEnum(t, "foodMemoryType", relatedFoodMemory.type)}
            </Badge>
            <Badge
              variant="outline"
              className="border-ring/50 bg-accent text-accent-foreground text-[10px]"
            >
              {translateNutritionEnum(
                t,
                "foodMemoryEmotionalLoad",
                relatedFoodMemory.emotionalLoad,
              )}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2 line-clamp-2 text-xs leading-5">
            {relatedFoodMemory.story}
          </p>
        </div>
      ) : null}
      {log.valueDensity ? (
        <Badge
          variant="outline"
          className="border-foreground/10 bg-muted text-muted-foreground mt-3"
        >
          {t("nutrition.logs.valueDensity")} ·{" "}
          {translateNutritionEnum(t, "valueDensity", log.valueDensity)}
        </Badge>
      ) : null}
      {semanticBadges.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {semanticBadges.map((badge) => (
            <Badge
              key={`${log.id}:${badge}`}
              variant="outline"
              className="border-foreground/10 bg-background/70 text-[10px]"
            >
              {badge}
            </Badge>
          ))}
        </div>
      ) : null}
    </article>
  )
}

function matchesLogFilter(log: MealLog, filter: LogFilter) {
  if (filter === "all") {
    return true
  }

  if (filter === "linkedPlan") {
    return Boolean(log.plannedSlotId)
  }

  if (filter === "linkedMemory") {
    return Boolean(log.relatedFoodMemoryId)
  }

  if (filter === "changed") {
    return Boolean(log.changeReason)
  }

  return logNeedsCare(log.bodyFeedback, log.valueDensity)
}

function buildLogSearchText(
  log: MealLog,
  lookups: ReturnType<typeof buildNutritionLookups>,
  relatedFoodMemory: NutritionModuleData["foodMemories"][number] | null,
  t: TFunction,
) {
  const entryText = log.entries
    .map((entry) => {
      if (entry.type === "recipe") {
        return lookups.recipeById.get(entry.recipeId)?.name ?? entry.recipeId
      }

      if (entry.type === "food") {
        return lookups.foodById.get(entry.foodId)?.name ?? entry.foodId
      }

      return `${entry.title} ${entry.note ?? ""}`
    })
    .join(" ")

  return [
    log.id,
    log.dateTime,
    log.scene,
    log.scene ? translateNutritionEnum(t, "scene", log.scene) : "",
    log.trigger,
    log.trigger ? translateNutritionEnum(t, "trigger", log.trigger) : "",
    log.valueDensity,
    log.valueDensity ? translateNutritionEnum(t, "valueDensity", log.valueDensity) : "",
    log.bodyFeedback,
    log.bodyFeedback ? translateNutritionEnum(t, "bodyFeedback", log.bodyFeedback) : "",
    log.changeReason,
    log.note,
    log.plannedSlotId,
    relatedFoodMemory?.name,
    relatedFoodMemory?.type,
    relatedFoodMemory?.type
      ? translateNutritionEnum(t, "foodMemoryType", relatedFoodMemory.type)
      : "",
    relatedFoodMemory?.story,
    entryText,
  ]
    .filter(Boolean)
    .join(" ")
}

function buildLogSemanticBadges(
  log: MealLog,
  lookups: ReturnType<typeof buildNutritionLookups>,
  t: TFunction,
) {
  const semantics = summarizeLogFoodSemantics({
    entryLog: log,
    foodById: lookups.foodById,
    profileByFoodId: lookups.profileByFoodId,
    recipeById: lookups.recipeById,
  })

  return [
    semantics.hasWholeFruit ? t("nutrition.logs.semanticBadges.wholeFruit") : null,
    semantics.hasJuiceDrink ? t("nutrition.logs.semanticBadges.juiceDrink") : null,
    semantics.hasPantrySodium ? t("nutrition.logs.semanticBadges.pantrySodium") : null,
    semantics.hasSoyProtein ? t("nutrition.logs.semanticBadges.soyProtein") : null,
    semantics.addedSugarTotal >= 8 ? t("nutrition.logs.semanticBadges.freeSugar") : null,
  ].filter((entry): entry is string => Boolean(entry))
}

function buildLogFocusReasons({
  log,
  lookups,
  reviewFocus,
  t,
}: {
  log: MealLog
  lookups: ReturnType<typeof buildNutritionLookups>
  reviewFocus: ReviewFocus | null
  t: TFunction
}) {
  if (!reviewFocus || !reviewFocus.evidence.includes(log.id)) {
    return []
  }

  const reasonIds = buildLogFocusReasonIds({
    foodById: lookups.foodById,
    log,
    profileByFoodId: lookups.profileByFoodId,
    recipeById: lookups.recipeById,
    reviewFocus,
  })

  return reasonIds.map((reasonId) => t(`nutrition.logs.focusReasons.${reasonId}`))
}
