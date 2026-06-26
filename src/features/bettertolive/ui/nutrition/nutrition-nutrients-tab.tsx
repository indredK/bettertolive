import { BarChart3, Hexagon, TableProperties } from "lucide-react"
import type { TFunction } from "i18next"
import type { ReactNode } from "react"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts"

import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import type {
  DailyPlanEntry,
  FoodNutrientProfile,
  NutritionModuleData,
  Recipe,
} from "@/features/bettertolive/types"
import {
  NUTRIENT_KEYS,
  NUTRIENT_FRACTION_DIGITS,
  NUTRIENT_UNITS,
  PRIMARY_NUTRIENT_KEYS,
  QUALITY_NUTRIENT_KEYS,
  type NutrientKey,
  buildNutritionLookups,
  calculateDailyPlanNutrition,
  calculateRecipeNutrition,
  formatNutrientValue,
} from "@/features/bettertolive/ui/nutrition/nutrition-page-data"
import {
  NUTRITION_DETAIL_CARD_CLASS,
  NutritionPanel,
  NutritionTabViewport,
} from "@/features/bettertolive/ui/nutrition/nutrition-page-shared"
import { translateNutritionEnum } from "@/features/bettertolive/ui/nutrition/nutrition-i18n"
import { cn } from "@/lib/utils"

type NutrientMode = "foods" | "recipes" | "plans"
type NutrientTablePreset = "primary" | "quality"

type NutrientTableRow = {
  id: string
  name: string
  basis: string
  missing: number
  missingCount?: number
  sugarKind?: string
  proteinSource?: string
  processingLevel?: string
  sodiumRiskLevel?: string
} & Partial<Record<NutrientKey, number>>

const MODES = ["foods", "recipes", "plans"] satisfies NutrientMode[]
const TABLE_PRESETS = ["primary", "quality"] satisfies NutrientTablePreset[]

export function NutritionNutrientsTab({ nutrition }: { nutrition: NutritionModuleData }) {
  const { t } = useTranslation()
  const [mode, setMode] = useState<NutrientMode>("foods")
  const [tablePreset, setTablePreset] = useState<NutrientTablePreset>("primary")
  const [categoryId, setCategoryId] = useState("all")
  const [missingOnly, setMissingOnly] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null)
  const lookups = useMemo(() => buildNutritionLookups(nutrition), [nutrition])
  const effectiveCategoryId =
    categoryId === "all" || lookups.categoryById.has(categoryId) ? categoryId : "all"
  const activeCategory =
    effectiveCategoryId === "all" ? null : lookups.categoryById.get(effectiveCategoryId)
  const visibleKeys = tablePreset === "primary" ? PRIMARY_NUTRIENT_KEYS : QUALITY_NUTRIENT_KEYS

  const rows = useMemo<NutrientTableRow[]>(() => {
    const normalized = query.trim().toLowerCase()
    const withMissingFilter = (rows: NutrientTableRow[]) =>
      missingOnly ? rows.filter((row) => row.missing > 0) : rows

    if (mode === "foods") {
      return withMissingFilter(
        nutrition.foods
          .filter((food) => {
            const categoryText = food.categoryIds
              .map((id) => {
                const category = lookups.categoryById.get(id)
                return category
                  ? `${category.name} ${translateNutritionEnum(t, "foodCategoryDimension", category.dimension)}`
                  : id
              })
              .join(" ")
            const text = [
              food.name,
              categoryText,
              food.storage,
              food.storage ? translateNutritionEnum(t, "storage", food.storage) : "",
              food.lifecycle,
              food.lifecycle ? translateNutritionEnum(t, "lifecycle", food.lifecycle) : "",
              food.dietaryTags.join(" "),
              food.allergenTags.join(" "),
              profileSemanticText(lookups.profileByFoodId.get(food.id), t),
            ].join(" ")
            const matchesQuery = !normalized || text.toLowerCase().includes(normalized)
            const matchesCategory =
              effectiveCategoryId === "all" || food.categoryIds.includes(effectiveCategoryId)
            return matchesQuery && matchesCategory
          })
          .map((food) => {
            const profile = lookups.profileByFoodId.get(food.id)
            return {
              id: food.id,
              name: food.name,
              basis: profile
                ? `${profile.basisAmount}${translateNutritionEnum(t, "unit", profile.basisUnit)}`
                : t("nutrition.nutrients.pending"),
              missing: countFoodMissingFields(profile),
              energyKcal: profile?.energyKcal,
              proteinG: profile?.proteinG,
              fatG: profile?.fatG,
              saturatedFatG: profile?.saturatedFatG,
              carbG: profile?.carbG,
              fiberG: profile?.fiberG,
              sugarG: profile?.sugarG,
              addedSugarG: profile?.addedSugarG,
              sodiumMg: profile?.sodiumMg,
              calciumMg: profile?.calciumMg,
              ironMg: profile?.ironMg,
              potassiumMg: profile?.potassiumMg,
              sugarKind: profile?.sugarKind
                ? translateNutritionEnum(t, "sugarKind", profile.sugarKind)
                : undefined,
              proteinSource: profile?.proteinSource
                ? translateNutritionEnum(t, "proteinSource", profile.proteinSource)
                : undefined,
              processingLevel: profile?.processingLevel
                ? translateNutritionEnum(t, "processingLevel", profile.processingLevel)
                : undefined,
              sodiumRiskLevel: profile?.sodiumRiskLevel
                ? translateNutritionEnum(t, "sodiumRiskLevel", profile.sodiumRiskLevel)
                : undefined,
            }
          }),
      )
    }

    if (mode === "recipes") {
      return withMissingFilter(
        nutrition.recipes
          .filter((recipe) => {
            const text = [
              recipe.name,
              recipe.tags.join(" "),
              recipe.mealRoles.join(" "),
              recipe.mealRoles.map((role) => translateNutritionEnum(t, "mealRole", role)).join(" "),
              recipe.difficulty,
              translateNutritionEnum(t, "difficulty", recipe.difficulty),
              recipe.repeatability,
              translateNutritionEnum(t, "repeatability", recipe.repeatability),
            ].join(" ")
            const matchesQuery = !normalized || text.toLowerCase().includes(normalized)
            const matchesCategory =
              effectiveCategoryId === "all" ||
              recipeUsesCategory(recipe, effectiveCategoryId, lookups.foodById)
            return matchesQuery && matchesCategory
          })
          .map((recipe) => {
            const totals = calculateRecipeNutrition({
              foodById: lookups.foodById,
              profileByFoodId: lookups.profileByFoodId,
              recipe,
            })
            return {
              id: recipe.id,
              name: recipe.name,
              basis: t("nutrition.nutrients.perServing"),
              missing: totals.missingCount,
              ...totals,
            }
          }),
      )
    }

    return withMissingFilter(
      nutrition.dailyPlans
        .filter((plan) => {
          const planSearchText = [
            plan.date,
            plan.note,
            plan.slots
              .map((slot) =>
                [
                  slot.structure,
                  translateNutritionEnum(t, "mealRole", slot.structure),
                  slot.status,
                  t(`nutrition.status.${slot.status}`),
                  slot.note,
                  slot.entries
                    .map((entry) =>
                      formatPlanEntrySearchText(entry, lookups.foodById, lookups.recipeById),
                    )
                    .join(" "),
                ].join(" "),
              )
              .join(" "),
          ]
            .join(" ")
            .toLowerCase()
          const matchesQuery = !normalized || planSearchText.includes(normalized)
          const matchesCategory =
            effectiveCategoryId === "all" ||
            plan.slots.some((slot) =>
              slot.entries.some((entry) =>
                entryUsesCategory(entry, effectiveCategoryId, lookups.foodById, lookups.recipeById),
              ),
            )
          return matchesQuery && matchesCategory
        })
        .map((plan) => {
          const totals = calculateDailyPlanNutrition({
            foodById: lookups.foodById,
            plan,
            profileByFoodId: lookups.profileByFoodId,
            recipeById: lookups.recipeById,
          })
          return {
            id: plan.id,
            name: plan.date,
            basis: t("nutrition.nutrients.dailyTotal"),
            missing: totals.missingCount,
            ...totals,
          }
        }),
    )
  }, [
    effectiveCategoryId,
    lookups,
    missingOnly,
    mode,
    nutrition.dailyPlans,
    nutrition.foods,
    nutrition.recipes,
    query,
    t,
  ])
  const selectedRow = selectedRowId ? (rows.find((row) => row.id === selectedRowId) ?? null) : null

  return (
    <NutritionTabViewport className="overflow-hidden">
      <NutritionPanel
        className={cn(NUTRITION_DETAIL_CARD_CLASS, "min-h-0 flex-1 overflow-hidden")}
        contentClassName="flex min-h-0 flex-col p-4"
      >
        <div className="flex shrink-0 flex-col gap-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-1.5">
              {MODES.map((entry) => (
                <FilterChip key={entry} isActive={mode === entry} onClick={() => setMode(entry)}>
                  {t(`nutrition.nutrients.modes.${entry}`)}
                </FilterChip>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {TABLE_PRESETS.map((entry) => (
                <FilterChip
                  key={entry}
                  isActive={tablePreset === entry}
                  onClick={() => setTablePreset(entry)}
                >
                  {t(`nutrition.nutrients.tablePresets.${entry}`)}
                </FilterChip>
              ))}
            </div>
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("nutrition.nutrients.search")}
              className="border-foreground/15 bg-background xl:max-w-xs"
            />
          </div>

          <div className="border-foreground/10 bg-background/70 grid gap-3 rounded-2xl border p-3 xl:grid-cols-[minmax(0,1fr)_auto]">
            <div className="min-w-0">
              <div className="text-muted-foreground mb-2 text-xs font-medium">
                {t("nutrition.nutrients.categoryFilter")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <FilterChip
                  isActive={effectiveCategoryId === "all"}
                  onClick={() => setCategoryId("all")}
                >
                  {t("nutrition.nutrients.allCategories")}
                </FilterChip>
                {nutrition.foodCategories.map((category) => (
                  <FilterChip
                    key={category.id}
                    isActive={effectiveCategoryId === category.id}
                    onClick={() => setCategoryId(category.id)}
                  >
                    {category.name}
                  </FilterChip>
                ))}
              </div>
              {activeCategory ? (
                <p className="text-muted-foreground mt-2 line-clamp-2 text-xs leading-5">
                  {translateNutritionEnum(t, "foodCategoryDimension", activeCategory.dimension)}
                  {activeCategory.description ? ` · ${activeCategory.description}` : ""}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap items-end gap-1.5 xl:justify-end">
              <button
                type="button"
                className={cn(
                  "border-foreground/10 bg-muted text-muted-foreground rounded-full border px-3 py-1 text-xs transition",
                  missingOnly && "border-ring/60 bg-accent text-accent-foreground",
                )}
                onClick={() => setMissingOnly((current) => !current)}
              >
                {missingOnly
                  ? t("nutrition.nutrients.missingOnlyActive")
                  : t("nutrition.nutrients.missingOnly")}
              </button>
              <Badge
                variant="outline"
                className="border-foreground/10 bg-muted text-muted-foreground"
              >
                {t("nutrition.nutrients.resultCount", { count: rows.length })}
              </Badge>
            </div>
          </div>
        </div>

        {rows.length > 0 ? (
          <div className="border-foreground/10 mt-4 min-h-0 flex-1 overflow-auto rounded-2xl border">
            <table className="w-full min-w-[1080px] text-sm">
              <thead className="bg-muted/40 text-muted-foreground sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-3 text-left font-medium">
                    <span className="inline-flex items-center gap-2">
                      {mode === "foods" ? (
                        <TableProperties className="size-4" />
                      ) : (
                        <BarChart3 className="size-4" />
                      )}
                      {t("nutrition.nutrients.item")}
                    </span>
                  </th>
                  <th className="px-3 py-3 text-left font-medium">
                    {t("nutrition.nutrients.basis")}
                  </th>
                  {visibleKeys.map((key) => (
                    <th key={key} className="px-3 py-3 text-right font-medium">
                      {t(`nutrition.nutrients.${key}`)}
                    </th>
                  ))}
                  <th className="px-3 py-3 text-right font-medium">
                    {t("nutrition.nutrients.missing")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    tabIndex={0}
                    className="border-foreground/10 hover:bg-muted/25 focus-visible:ring-ring/50 cursor-pointer border-t transition outline-none focus-visible:ring-2"
                    onClick={() => setSelectedRowId(row.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        setSelectedRowId(row.id)
                      }
                    }}
                  >
                    <td className="px-3 py-3 font-medium">
                      <div>{row.name}</div>
                      {mode === "foods" ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {buildRowSignals(row, t).map((signal) => (
                            <Badge
                              key={`${row.id}:${signal}`}
                              variant="outline"
                              className="border-foreground/10 bg-muted text-muted-foreground text-[10px]"
                            >
                              {signal}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      <div className="text-muted-foreground mt-1 text-[11px]">
                        {t("nutrition.nutrients.rowClickHint")}
                      </div>
                    </td>
                    <td className="text-muted-foreground px-3 py-3">{row.basis}</td>
                    {visibleKeys.map((key) => (
                      <td key={key} className="px-3 py-3 text-right">
                        {typeof row[key] === "number" ? (
                          <>
                            {formatNutrientValue(row[key] ?? 0, NUTRIENT_FRACTION_DIGITS[key])}
                            <span className="text-muted-foreground ml-1 text-xs">
                              {NUTRIENT_UNITS[key]}
                            </span>
                          </>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-foreground/10 bg-muted text-muted-foreground"
                          >
                            {t("nutrition.nutrients.pending")}
                          </Badge>
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-3 text-right">
                      {row.missing > 0 ? (
                        <Badge
                          variant="outline"
                          className="border-foreground/10 bg-muted text-muted-foreground"
                        >
                          {row.missing}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border-foreground/15 bg-muted/20 mt-4 flex min-h-[260px] flex-1 flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center">
            <div className="text-sm font-medium">{t("nutrition.nutrients.empty")}</div>
            <p className="text-muted-foreground mt-2 max-w-md text-xs leading-5">
              {t("nutrition.nutrients.emptyHint")}
            </p>
          </div>
        )}
      </NutritionPanel>
      {selectedRow ? (
        <NutrientDetailDrawer
          mode={mode}
          row={selectedRow}
          tablePreset={tablePreset}
          onClose={() => setSelectedRowId(null)}
        />
      ) : null}
    </NutritionTabViewport>
  )
}

function NutrientDetailDrawer({
  mode,
  onClose,
  row,
  tablePreset,
}: {
  mode: NutrientMode
  onClose: () => void
  row: NutrientTableRow
  tablePreset: NutrientTablePreset
}) {
  const { t } = useTranslation()
  const radarData = buildNutrientRadarData(row, t)
  const knownCount = NUTRIENT_KEYS.filter((key) => typeof row[key] === "number").length
  const metadata = buildRowMetadata(row, t)

  return (
    <Dialog open onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent
        className={cn(
          "top-0 right-0 left-auto h-dvh w-full max-w-full translate-x-0 translate-y-0 rounded-none",
          "border-foreground/10 bg-background p-0 shadow-2xl sm:max-w-xl",
          "data-open:slide-in-from-right-10 data-closed:slide-out-to-right-10",
        )}
      >
        <div className="flex h-full min-h-0 flex-col">
          <DialogHeader className="border-foreground/10 bg-card/80 shrink-0 border-b px-5 py-4 pr-14">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-ring/50 bg-accent text-accent-foreground">
                {t(`nutrition.nutrients.modes.${mode}`)}
              </Badge>
              <Badge
                variant="outline"
                className="border-foreground/10 bg-muted text-muted-foreground"
              >
                {t("nutrition.nutrients.simulatedBadge")}
              </Badge>
            </div>
            <DialogTitle className="mt-2 text-xl">
              {t("nutrition.nutrients.drawerTitle", { name: row.name })}
            </DialogTitle>
            <DialogDescription>{t("nutrition.nutrients.drawerDescription")}</DialogDescription>
          </DialogHeader>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_180px]">
              <section className="border-foreground/10 bg-card/80 rounded-3xl border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-semibold">
                      <Hexagon className="size-4" />
                      {t("nutrition.nutrients.chartTitle")}
                    </h3>
                    <p className="text-muted-foreground mt-1 text-xs leading-5">
                      {t("nutrition.nutrients.chartHint")}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-semibold tracking-tight">{knownCount}</div>
                    <div className="text-muted-foreground text-[11px]">
                      {t("nutrition.nutrients.knownFields")}
                    </div>
                  </div>
                </div>
                <div className="mt-4 h-[280px] min-h-0">
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    initialDimension={{ width: 520, height: 280 }}
                  >
                    <RadarChart data={radarData} outerRadius="78%">
                      <PolarGrid stroke="var(--color-border)" />
                      <PolarAngleAxis
                        dataKey="label"
                        tick={{ fill: "var(--color-muted-foreground)", fontSize: 11 }}
                      />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        dataKey="score"
                        fill="var(--color-chart-2)"
                        fillOpacity={0.26}
                        stroke="var(--color-chart-2)"
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </section>

              <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                <NutrientDrawerStat label={t("nutrition.nutrients.basis")} value={row.basis} />
                <NutrientDrawerStat label={t("nutrition.nutrients.missing")} value={row.missing} />
                <NutrientDrawerStat
                  label={t("nutrition.nutrients.scoreLabel")}
                  value={Math.round(
                    radarData.reduce((total, entry) => total + entry.score, 0) / radarData.length,
                  )}
                />
              </section>
            </div>

            {metadata.length > 0 ? (
              <section className="border-foreground/10 bg-background/70 mt-4 rounded-3xl border p-4">
                <h3 className="text-sm font-semibold">{t("nutrition.nutrients.metadataTitle")}</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {metadata.map((entry) => (
                    <Badge
                      key={`${row.id}:${entry.label}:${entry.value}`}
                      variant="outline"
                      className="border-foreground/10 bg-muted text-muted-foreground"
                    >
                      {entry.label} · {entry.value}
                    </Badge>
                  ))}
                </div>
              </section>
            ) : null}

            <section className="border-foreground/10 bg-background/70 mt-4 rounded-3xl border p-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">{t("nutrition.nutrients.detailTitle")}</h3>
                <Badge
                  variant="outline"
                  className="border-foreground/10 bg-muted text-muted-foreground"
                >
                  {t(`nutrition.nutrients.tablePresets.${tablePreset}`)}
                </Badge>
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {PRIMARY_NUTRIENT_KEYS.map((key) => (
                  <div
                    key={key}
                    className="border-foreground/10 bg-muted/20 flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5"
                  >
                    <span className="text-muted-foreground text-sm">
                      {t(`nutrition.nutrients.${key}`)}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatDetailedNutrient(row, key, t)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <h4 className="text-muted-foreground text-xs font-medium">
                  {t("nutrition.nutrients.qualityTitle")}
                </h4>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {QUALITY_NUTRIENT_KEYS.map((key) => (
                    <div
                      key={key}
                      className="border-foreground/10 bg-muted/20 flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5"
                    >
                      <span className="text-muted-foreground text-sm">
                        {t(`nutrition.nutrients.${key}`)}
                      </span>
                      <span className="font-medium tabular-nums">
                        {formatDetailedNutrient(row, key, t)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function NutrientDrawerStat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border-foreground/10 bg-muted/25 rounded-3xl border p-4">
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight">{value}</div>
    </div>
  )
}

function buildNutrientRadarData(row: NutrientTableRow, t: TFunction) {
  return [
    {
      label: t("nutrition.nutrients.dimensions.energy"),
      score: scoreNutrient(row.energyKcal, 650, `${row.id}:energy`),
    },
    {
      label: t("nutrition.nutrients.dimensions.protein"),
      score: scoreNutrient(row.proteinG, 35, `${row.id}:protein`),
    },
    {
      label: t("nutrition.nutrients.dimensions.carbs"),
      score: scoreNutrient(row.carbG, 85, `${row.id}:carbs`),
    },
    {
      label: t("nutrition.nutrients.dimensions.fats"),
      score: scoreNutrient(row.fatG, 28, `${row.id}:fats`),
    },
    {
      label: t("nutrition.nutrients.dimensions.fiber"),
      score: scoreNutrient(row.fiberG, 12, `${row.id}:fiber`),
    },
    {
      label: t("nutrition.nutrients.dimensions.lightness"),
      score: Math.round(
        (scoreLowerIsBetter(row.addedSugarG ?? row.sugarG, 18, `${row.id}:addedSugar`) +
          scoreLowerIsBetter(row.saturatedFatG, 8, `${row.id}:saturatedFat`) +
          scoreLowerIsBetter(row.sodiumMg, 900, `${row.id}:sodium`)) /
          3,
      ),
    },
  ]
}

function scoreNutrient(value: number | undefined, target: number, seed: string) {
  if (typeof value !== "number") {
    return simulatedScore(seed)
  }

  return clampScore((value / target) * 100)
}

function scoreLowerIsBetter(value: number | undefined, limit: number, seed: string) {
  if (typeof value !== "number") {
    return simulatedScore(seed)
  }

  return clampScore(100 - (value / limit) * 100)
}

function simulatedScore(seed: string) {
  let hash = 0

  for (const char of seed) {
    hash = (hash * 31 + char.charCodeAt(0)) % 997
  }

  return 38 + (hash % 45)
}

function clampScore(value: number) {
  return Math.max(8, Math.min(100, Math.round(value)))
}

function formatDetailedNutrient(row: NutrientTableRow, key: NutrientKey, t: TFunction) {
  const value = row[key]

  if (typeof value !== "number") {
    return t("nutrition.nutrients.pending")
  }

  return `${formatNutrientValue(value, NUTRIENT_FRACTION_DIGITS[key])} ${NUTRIENT_UNITS[key]}`
}

function FilterChip({
  children,
  isActive,
  onClick,
}: {
  children: ReactNode
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      className={cn(
        "border-foreground/10 bg-muted text-muted-foreground rounded-full border px-3 py-1 text-xs transition",
        isActive && "border-ring/60 bg-accent text-accent-foreground",
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

function countFoodMissingFields(profile: FoodNutrientProfile | undefined) {
  if (!profile) {
    return NUTRIENT_KEYS.length
  }

  return NUTRIENT_KEYS.filter((key) => profile[key] === undefined).length
}

function profileSemanticText(profile: FoodNutrientProfile | undefined, t: TFunction) {
  if (!profile) {
    return ""
  }

  return [
    profile.sugarKind ? translateNutritionEnum(t, "sugarKind", profile.sugarKind) : "",
    profile.proteinSource ? translateNutritionEnum(t, "proteinSource", profile.proteinSource) : "",
    profile.processingLevel
      ? translateNutritionEnum(t, "processingLevel", profile.processingLevel)
      : "",
    profile.sodiumRiskLevel
      ? translateNutritionEnum(t, "sodiumRiskLevel", profile.sodiumRiskLevel)
      : "",
  ].join(" ")
}

function buildRowSignals(row: NutrientTableRow, t: TFunction) {
  const signals: string[] = []

  if (row.proteinSource) {
    signals.push(`${t("nutrition.nutrients.signalLabels.protein")} · ${row.proteinSource}`)
  }
  if (row.processingLevel) {
    signals.push(`${t("nutrition.nutrients.signalLabels.processing")} · ${row.processingLevel}`)
  }
  if (row.sodiumRiskLevel) {
    signals.push(`${t("nutrition.nutrients.signalLabels.sodium")} · ${row.sodiumRiskLevel}`)
  }

  return signals
}

function buildRowMetadata(row: NutrientTableRow, t: TFunction) {
  return [
    row.sugarKind
      ? { label: t("nutrition.nutrients.signalLabels.sugar"), value: row.sugarKind }
      : null,
    row.proteinSource
      ? { label: t("nutrition.nutrients.signalLabels.protein"), value: row.proteinSource }
      : null,
    row.processingLevel
      ? { label: t("nutrition.nutrients.signalLabels.processing"), value: row.processingLevel }
      : null,
    row.sodiumRiskLevel
      ? { label: t("nutrition.nutrients.signalLabels.sodium"), value: row.sodiumRiskLevel }
      : null,
  ].filter((entry): entry is { label: string; value: string } => Boolean(entry))
}

function recipeUsesCategory(
  recipe: Recipe,
  categoryId: string,
  foodById: ReturnType<typeof buildNutritionLookups>["foodById"],
) {
  return recipe.ingredients.some((ingredient) =>
    foodById.get(ingredient.foodId)?.categoryIds.includes(categoryId),
  )
}

function entryUsesCategory(
  entry: DailyPlanEntry,
  categoryId: string,
  foodById: ReturnType<typeof buildNutritionLookups>["foodById"],
  recipeById: ReturnType<typeof buildNutritionLookups>["recipeById"],
) {
  if (entry.type === "food") {
    return foodById.get(entry.foodId)?.categoryIds.includes(categoryId) ?? false
  }

  if (entry.type === "recipe") {
    const recipe = recipeById.get(entry.recipeId)
    return recipe ? recipeUsesCategory(recipe, categoryId, foodById) : false
  }

  return false
}

function formatPlanEntrySearchText(
  entry: DailyPlanEntry,
  foodById: ReturnType<typeof buildNutritionLookups>["foodById"],
  recipeById: ReturnType<typeof buildNutritionLookups>["recipeById"],
) {
  if (entry.type === "recipe") {
    return recipeById.get(entry.recipeId)?.name ?? entry.recipeId
  }

  if (entry.type === "food") {
    return foodById.get(entry.foodId)?.name ?? entry.foodId
  }

  return `${entry.title} ${entry.note ?? ""}`
}
