import useEmblaCarousel from "embla-carousel-react"
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Gift,
  Heart,
  Package2,
  Sparkles,
} from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type {
  ShoppingLifestyleCollection,
  ShoppingModuleData,
  ShoppingSpotlight,
} from "@/features/bettertolive/types"
import { Surface, EmptyState, SectionHeading } from "@/features/bettertolive/ui/shared/shared"
import type { ShoppingPlanWithLane } from "@/features/bettertolive/ui/shopping/shopping-system-detail-dialog"
import {
  type ShoppingLifecycleGroups,
  getOverviewDimensions,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"
import {
  BoundaryTable,
  CompactItemRow,
  InlineSectionHeader,
  LifecycleLane,
} from "@/features/bettertolive/ui/shopping/shopping-page-shared"
import { cn } from "@/lib/utils"

function SpotlightCarousel({ spotlights }: { spotlights: ShoppingSpotlight[] }) {
  const { t } = useTranslation()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    dragFree: false,
    loop: spotlights.length > 1,
    watchDrag: spotlights.length > 1,
  })

  useEffect(() => {
    if (!emblaApi) {
      return
    }

    const syncSelectedIndex = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }

    syncSelectedIndex()
    emblaApi.on("select", syncSelectedIndex)
    emblaApi.on("reInit", syncSelectedIndex)

    return () => {
      emblaApi.off("select", syncSelectedIndex)
      emblaApi.off("reInit", syncSelectedIndex)
    }
  }, [emblaApi])

  const scrollTo = useCallback(
    (index: number) => {
      if (!emblaApi) {
        return
      }

      emblaApi.scrollTo(index)
    },
    [emblaApi],
  )

  const scrollPrev = useCallback(() => {
    if (!emblaApi) {
      return
    }

    emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (!emblaApi) {
      return
    }

    emblaApi.scrollNext()
  }, [emblaApi])

  if (spotlights.length === 0) {
    return <EmptyState message={t("shopping.overview.noSpotlights")} compact />
  }

  return (
    <div>
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {spotlights.map((spotlight) => (
            <article key={spotlight.id} className="min-w-0 flex-[0_0_100%]">
              <div className="min-h-[232px] rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
                <div className="flex min-w-0 items-center gap-2">
                  <h3 className="min-w-0 truncate text-sm font-medium text-[color:var(--text-primary)]">
                    {spotlight.title}
                  </h3>
                  <Badge
                    variant="outline"
                    className="shrink-0 border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
                  >
                    {spotlight.stage}
                  </Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-[color:var(--text-secondary)]">
                  {spotlight.summary}
                </p>
                <p className="mt-1 text-sm leading-6 text-[color:var(--text-muted)]">
                  {spotlight.reason}
                </p>
                <div className="mt-3 grid gap-2 min-[1080px]:grid-cols-2">
                  {spotlight.attention.map((entry) => (
                    <div
                      key={entry}
                      className="rounded-md border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-3 py-2 text-sm leading-6 text-[color:var(--text-secondary)]"
                    >
                      {entry}
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      {spotlights.length > 1 ? (
        <div className="mt-3 grid grid-cols-3 items-center gap-3">
          <div className="flex justify-start">
            <button
              type="button"
              aria-label={t("shopping.overview.prevSpotlight")}
              onClick={scrollPrev}
              className="inline-flex size-7 items-center justify-center rounded-full border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)] transition hover:text-[color:var(--text-primary)]"
            >
              <ChevronLeft className="size-4" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-1.5">
            {spotlights.map((spotlight, index) => {
              const isActive = index === selectedIndex

              return (
                <button
                  key={spotlight.id}
                  type="button"
                  aria-label={t("shopping.overview.switchToNth", { n: index + 1 })}
                  aria-pressed={isActive}
                  onClick={() => scrollTo(index)}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    isActive
                      ? "w-5 bg-[color:var(--text-primary)]"
                      : "w-1.5 bg-[color:var(--chip-border)] hover:bg-[color:var(--text-muted)]",
                  )}
                />
              )
            })}
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              aria-label={t("shopping.overview.nextSpotlight")}
              onClick={scrollNext}
              className="inline-flex size-7 items-center justify-center rounded-full border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-secondary)] transition hover:text-[color:var(--text-primary)]"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function ShoppingOverviewTab({
  shopping,
  lifecycleGroups,
  fastDepreciationWarnings,
  worthBuyingSlowly,
  featuredCollections,
  overlookedCollection,
  isWideLayout,
  isFixedLayout,
  isManagementMode,
  onEditPlan,
}: {
  shopping: ShoppingModuleData
  lifecycleGroups: ShoppingLifecycleGroups
  fastDepreciationWarnings: ShoppingPlanWithLane[]
  worthBuyingSlowly: ShoppingPlanWithLane[]
  featuredCollections: ShoppingLifestyleCollection[]
  overlookedCollection: ShoppingLifestyleCollection | undefined
  isWideLayout: boolean
  isFixedLayout: boolean
  isManagementMode?: boolean
  onEditPlan?: (item: ShoppingPlanWithLane) => void
}) {
  const { t } = useTranslation()
  const overviewDimensions = getOverviewDimensions(t)
  return (
    <TabsContent
      value="overview"
      className={cn("space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
    >
      <div
        className={cn(
          "grid gap-4 min-[1320px]:grid-cols-[minmax(0,1.25fr)_minmax(340px,0.85fr)]",
          isFixedLayout &&
            "h-full min-h-0 flex-1 min-[1320px]:grid-rows-[minmax(0,1fr)_minmax(0,1fr)]",
        )}
      >
        <Surface
          className={cn(
            "p-5",
            isFixedLayout && "flex min-h-0 flex-col overflow-hidden min-[1320px]:row-span-2",
          )}
        >
          <div className="min-h-0 flex-1 overflow-auto pr-1">
            <InlineSectionHeader
              compact={isWideLayout}
              icon={AlertTriangle}
              title={t("shopping.overview.currentFocus")}
              description={t("shopping.overview.currentFocusDesc")}
            />
            <div className="mt-5">
              <SpotlightCarousel spotlights={shopping.spotlights} />
            </div>

            <Tabs defaultValue="classification" className="mt-5 min-h-0 gap-4">
              <TabsList className="grid h-auto w-full grid-cols-3 items-center gap-1 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] p-1">
                <TabsTrigger value="classification" className="h-8 px-3 text-xs">
                  {t("shopping.overview.dimensions")}
                </TabsTrigger>
                <TabsTrigger value="collections" className="h-8 px-3 text-xs">
                  {t("shopping.overview.lifestyle")}
                </TabsTrigger>
                <TabsTrigger value="boundary" className="h-8 px-3 text-xs">
                  {t("shopping.overview.boundary")}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="classification" className="mt-4">
                <div className="grid gap-3 min-[1120px]:grid-cols-2 min-[1440px]:grid-cols-3">
                  {overviewDimensions.map((dimension) => (
                    <div
                      key={dimension.id}
                      className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3"
                    >
                      <div className="text-xs tracking-[0.18em] text-[color:var(--text-muted)] uppercase">
                        {dimension.title}
                      </div>
                      <div className="mt-2 text-sm font-medium text-[color:var(--text-primary)]">
                        {dimension.answer}
                      </div>
                      <p className="mt-1 text-sm leading-6 text-[color:var(--text-secondary)]">
                        {dimension.detail}
                      </p>
                      <p className="mt-3 border-t border-[color:var(--chip-border)] pt-3 text-sm leading-6 text-[color:var(--text-muted)]">
                        {dimension.cue}
                      </p>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="collections" className="mt-4">
                <div className="grid gap-4 min-[1200px]:grid-cols-2">
                  {featuredCollections.map((collection) => {
                    const icon =
                      collection.id === "collection-gifts"
                        ? Gift
                        : collection.id === "collection-happiness"
                          ? Heart
                          : Sparkles

                    return (
                      <div
                        key={collection.id}
                        className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] p-4"
                      >
                        <SectionHeading
                          compact={isWideLayout}
                          icon={icon}
                          title={collection.title}
                          description={collection.description}
                        />
                        <div className="mt-4 space-y-3 text-sm leading-6 text-[color:var(--text-secondary)]">
                          {collection.items.map((item) => (
                            <div
                              key={item}
                              className="border-t border-[color:var(--muted-surface-border)] py-3 first:border-t-0 first:pt-0 last:pb-0"
                            >
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </TabsContent>

              <TabsContent value="boundary" className="mt-0 min-h-[320px]">
                <BoundaryTable entries={shopping.boundaryEntries} className="mt-4" />
              </TabsContent>
            </Tabs>
          </div>
        </Surface>

        <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col overflow-hidden")}>
          <InlineSectionHeader
            compact={isWideLayout}
            icon={Package2}
            title={t("shopping.overview.actionRhythm")}
            description={t("shopping.overview.actionRhythmDesc")}
          />

          <div className="mt-5 min-h-0 flex-1 overflow-auto pr-1">
            <div className="grid gap-3 min-[1260px]:grid-cols-2">
              {(Object.keys(lifecycleGroups) as Array<keyof ShoppingLifecycleGroups>).map(
                (lifecycle) => (
                  <LifecycleLane
                    key={lifecycle}
                    lifecycle={lifecycle}
                    ownedCount={lifecycleGroups[lifecycle].owned.length}
                    plannedCount={lifecycleGroups[lifecycle].planned.length}
                    highlights={[
                      ...lifecycleGroups[lifecycle].owned.slice(0, 2).map((item) => item.name),
                      ...lifecycleGroups[lifecycle].planned.slice(0, 2).map((item) => item.name),
                    ]}
                  />
                ),
              )}
            </div>
          </div>
        </Surface>

        <Surface className={cn("p-5", isFixedLayout && "flex min-h-0 flex-col overflow-hidden")}>
          <InlineSectionHeader
            compact={isWideLayout}
            icon={CircleDollarSign}
            title={t("shopping.overview.purchaseAlerts")}
            description={t("shopping.overview.purchaseAlertsDesc")}
          />

          <Tabs
            defaultValue="fast-depreciation"
            className="mt-5 min-h-0 flex-1 gap-4 overflow-hidden"
          >
            <TabsList className="grid h-auto w-full grid-cols-3 items-center gap-1 rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] p-1">
              <TabsTrigger value="fast-depreciation" className="h-8 px-3 text-xs">
                {t("shopping.overview.highDepreciation")}
              </TabsTrigger>
              <TabsTrigger value="buy-slowly" className="h-8 px-3 text-xs">
                {t("shopping.overview.buySlowly")}
              </TabsTrigger>
              <TabsTrigger value="overlooked" className="h-8 px-3 text-xs">
                {t("shopping.overview.essentials")}
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="fast-depreciation"
              className="mt-0 min-h-0 flex-1 overflow-auto pr-1"
            >
              {fastDepreciationWarnings.length > 0 ? (
                <div className="space-y-3">
                  {fastDepreciationWarnings.map((item) => (
                    <CompactItemRow
                      key={item.id}
                      item={item}
                      sourceLabel={item.laneTitle}
                      compact
                      onEditPlan={isManagementMode ? onEditPlan : undefined}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[color:var(--text-muted)]">
                  {t("shopping.overview.noHighDepreciationWarnings")}
                </p>
              )}
            </TabsContent>

            <TabsContent value="buy-slowly" className="mt-0 min-h-0 flex-1 overflow-auto pr-1">
              {worthBuyingSlowly.length > 0 ? (
                <div className="space-y-3">
                  {worthBuyingSlowly.map((item) => (
                    <CompactItemRow
                      key={item.id}
                      item={item}
                      sourceLabel={item.laneTitle}
                      compact
                      onEditPlan={isManagementMode ? onEditPlan : undefined}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[color:var(--text-muted)]">
                  {t("shopping.overview.noSlowDepreciationSuggestions")}
                </p>
              )}
            </TabsContent>

            <TabsContent value="overlooked" className="mt-0 min-h-0 flex-1 overflow-auto pr-1">
              {overlookedCollection ? (
                <ul className="space-y-3 text-sm leading-6 text-[color:var(--text-secondary)]">
                  {overlookedCollection.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-3"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState message={t("shopping.overview.noEssentialsReminder")} compact />
              )}
            </TabsContent>
          </Tabs>
        </Surface>
      </div>
    </TabsContent>
  )
}
