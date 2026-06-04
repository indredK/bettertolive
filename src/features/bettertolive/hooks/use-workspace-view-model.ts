import { useCallback, useMemo } from "react"

import type {
  EmotionTriggerGroup,
  ShoppingLifestyleCollection,
  ShoppingStageChecklist,
  WorkspaceSnapshot,
} from "@/features/bettertolive/models/workspace"

function filterChecklistByQuery(
  checklist: ShoppingStageChecklist,
  hasQuery: boolean,
  matchesQuery: (...values: Array<string | number | undefined>) => boolean,
) {
  if (!hasQuery) {
    return checklist
  }

  if (matchesQuery(checklist.stage, checklist.title, checklist.description, checklist.focus)) {
    return checklist
  }

  const sections = checklist.sections
    .map((section) => {
      if (matchesQuery(section.system)) {
        return section
      }

      const minimum = section.minimum.filter((entry) => matchesQuery(entry))
      const essentials = section.essentials.filter((entry) => matchesQuery(entry))
      const upgrades = section.upgrades.filter((entry) => matchesQuery(entry))

      if (minimum.length === 0 && essentials.length === 0 && upgrades.length === 0) {
        return null
      }

      return {
        ...section,
        minimum,
        essentials,
        upgrades,
      }
    })
    .filter((section) => section !== null)

  if (sections.length === 0) {
    return null
  }

  return {
    ...checklist,
    sections,
  }
}

function filterCollectionByQuery(
  collection: ShoppingLifestyleCollection,
  hasQuery: boolean,
  matchesQuery: (...values: Array<string | number | undefined>) => boolean,
) {
  if (!hasQuery) {
    return collection
  }

  if (matchesQuery(collection.title, collection.description)) {
    return collection
  }

  const items = collection.items.filter((entry) => matchesQuery(entry))

  if (items.length === 0) {
    return null
  }

  return {
    ...collection,
    items,
  }
}

function filterEmotionTriggerByQuery(
  group: EmotionTriggerGroup,
  hasQuery: boolean,
  matchesQuery: (...values: Array<string | number | undefined>) => boolean,
) {
  if (!hasQuery) {
    return group
  }

  if (matchesQuery(group.title, group.summary)) {
    return group
  }

  const cues = group.cues.filter((entry) => matchesQuery(entry))

  if (cues.length === 0) {
    return null
  }

  return {
    ...group,
    cues,
  }
}

export function useWorkspaceViewModel({
  searchQuery,
  workspace,
}: {
  searchQuery: string
  workspace: WorkspaceSnapshot
}) {
  const normalizedQuery = searchQuery.trim().toLowerCase()

  const matchesQuery = useCallback(
    (...values: Array<string | number | undefined>) =>
      normalizedQuery.length === 0 ||
      values.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(normalizedQuery),
      ),
    [normalizedQuery],
  )

  const reflections = useMemo(
    () =>
      workspace.reflection.entries.filter((entry) =>
        matchesQuery(entry.date, entry.title, entry.excerpt, ...entry.tags),
      ),
    [matchesQuery, workspace.reflection.entries],
  )

  const events = useMemo(
    () =>
      workspace.events.entries.filter((entry) =>
        matchesQuery(entry.date, entry.title, entry.excerpt, entry.theme),
      ),
    [matchesQuery, workspace.events.entries],
  )

  const transactions = useMemo(
    () =>
      workspace.finance.entries.filter((entry) =>
        matchesQuery(entry.date, entry.label, entry.category, entry.note, entry.amount),
      ),
    [matchesQuery, workspace.finance.entries],
  )

  const shoppingModule = useMemo(
    () => ({
      ...workspace.shopping,
      systemDefinitions: workspace.shopping.systemDefinitions.filter((entry) =>
        matchesQuery(
          entry.id,
          entry.cluster,
          entry.summary,
          entry.keyQuestion,
          ...entry.secondaryGroups,
        ),
      ),
      spotlights: workspace.shopping.spotlights.filter((entry) =>
        matchesQuery(entry.title, entry.stage, entry.summary, entry.reason, ...entry.attention),
      ),
      ownedItems: workspace.shopping.ownedItems.filter((entry) =>
        matchesQuery(
          entry.name,
          entry.system,
          entry.category,
          ...entry.spaces,
          ...entry.stages,
          entry.necessity,
          entry.lifecycle,
          entry.depreciation,
          entry.status,
          entry.replacementCue,
          entry.note,
          entry.quantity,
        ),
      ),
      purchaseLanes: workspace.shopping.purchaseLanes.map((lane) => ({
        ...lane,
        items: lane.items.filter((entry) =>
          matchesQuery(
            lane.title,
            lane.subtitle,
            entry.name,
            entry.system,
            entry.category,
            ...entry.stages,
            ...entry.spaces,
            entry.necessity,
            entry.lifecycle,
            entry.depreciation,
            entry.reason,
            entry.targetLifestyle,
            entry.currentPrice,
            entry.buyBelowPrice,
            entry.overpayPrice,
            entry.note,
            ...entry.tags,
          ),
        ),
      })),
      stageChecklists: workspace.shopping.stageChecklists
        .map((entry) => filterChecklistByQuery(entry, normalizedQuery.length > 0, matchesQuery))
        .filter((entry) => entry !== null),
      priceReferences: workspace.shopping.priceReferences.filter((entry) =>
        matchesQuery(
          entry.system,
          entry.category,
          entry.lifecycle,
          entry.depreciation,
          entry.entryPrice,
          entry.sweetSpotPrice,
          entry.overpayPrice,
          entry.note,
        ),
      ),
      boundaryEntries: workspace.shopping.boundaryEntries.filter((entry) =>
        matchesQuery(entry.item, entry.system, entry.reason),
      ),
      lifestyleCollections: workspace.shopping.lifestyleCollections
        .map((entry) => filterCollectionByQuery(entry, normalizedQuery.length > 0, matchesQuery))
        .filter((entry) => entry !== null),
    }),
    [matchesQuery, normalizedQuery.length, workspace.shopping],
  )

  const emotionCheckIns = useMemo(
    () =>
      workspace.emotion.checkIns.filter((entry) =>
        matchesQuery(
          entry.date,
          entry.summary,
          entry.state,
          entry.intensity,
          entry.bodySignal,
          ...entry.tags,
        ),
      ),
    [matchesQuery, workspace.emotion.checkIns],
  )

  const emotionTrend = useMemo(
    () =>
      workspace.emotion.trend.filter((entry) => matchesQuery(entry.label, entry.score, entry.note)),
    [matchesQuery, workspace.emotion.trend],
  )

  const emotionTriggers = useMemo(
    () =>
      workspace.emotion.triggers
        .map((entry) =>
          filterEmotionTriggerByQuery(entry, normalizedQuery.length > 0, matchesQuery),
        )
        .filter((entry) => entry !== null),
    [matchesQuery, normalizedQuery.length, workspace.emotion.triggers],
  )

  const emotionTools = useMemo(
    () =>
      workspace.emotion.tools.filter((entry) =>
        matchesQuery(entry.title, entry.description, entry.when),
      ),
    [matchesQuery, workspace.emotion.tools],
  )

  const crisisWarningSigns = useMemo(
    () => workspace.crisis.warningSigns.filter((entry) => matchesQuery(entry)),
    [matchesQuery, workspace.crisis.warningSigns],
  )

  const crisisContacts = useMemo(
    () =>
      workspace.crisis.contacts.filter((entry) =>
        matchesQuery(entry.name, entry.role, entry.when, entry.script),
      ),
    [matchesQuery, workspace.crisis.contacts],
  )

  const crisisSteps = useMemo(
    () => workspace.crisis.steps.filter((entry) => matchesQuery(entry.title, entry.description)),
    [matchesQuery, workspace.crisis.steps],
  )

  const crisisReviewNotes = useMemo(
    () => workspace.crisis.reviewNotes.filter((entry) => matchesQuery(entry)),
    [matchesQuery, workspace.crisis.reviewNotes],
  )

  const recentRecords = useMemo(
    () =>
      workspace.overview.recentRecords.filter((entry) =>
        matchesQuery(entry.date, entry.kind, entry.title, entry.description),
      ),
    [matchesQuery, workspace.overview.recentRecords],
  )

  const beliefCards = useMemo(
    () =>
      workspace.beliefs.cards.filter((entry) =>
        matchesQuery(entry.label, entry.summary, entry.note, ...entry.keywords),
      ),
    [matchesQuery, workspace.beliefs.cards],
  )

  const beliefQuestions = useMemo(
    () => workspace.beliefs.questions.filter((entry) => matchesQuery(entry)),
    [matchesQuery, workspace.beliefs.questions],
  )

  const principlesModule = useMemo(() => {
    const entries = workspace.principles.entries.filter((entry) =>
      matchesQuery(
        entry.title,
        entry.statement,
        entry.description,
        entry.domain,
        entry.type,
        entry.strength,
        entry.source,
        entry.status,
        entry.cost,
        entry.boundary,
        entry.protectedValue,
        entry.decisionCue,
        ...entry.tags,
        ...entry.revisionHistory.flatMap((revision) => [
          revision.date,
          revision.summary,
          ...revision.changedFields,
        ]),
      ),
    )
    const visibleEntryIds = new Set(entries.map((entry) => entry.id))
    const relations = workspace.principles.relations.filter(
      (entry) =>
        matchesQuery(entry.type, entry.fromId, entry.toId, entry.note) ||
        visibleEntryIds.has(entry.fromId) ||
        visibleEntryIds.has(entry.toId),
    )
    const boundaries = workspace.principles.boundaries.filter((entry) => matchesQuery(entry))
    const decisionPrompts = workspace.principles.decisionPrompts.filter((entry) =>
      matchesQuery(entry),
    )

    return {
      ...workspace.principles,
      entries,
      boundaries,
      relations,
      decisionPrompts,
    }
  }, [matchesQuery, workspace.principles])

  const principles = principlesModule.entries
  const principleBoundaries = principlesModule.boundaries

  const relationshipsModule = useMemo(() => {
    const circles = workspace.relationships.circles.map((circle) => {
      if (matchesQuery(circle.title, circle.summary)) {
        return circle
      }

      return {
        ...circle,
        entries: circle.entries.filter((entry) =>
          matchesQuery(
            entry.name,
            entry.type,
            entry.role,
            entry.depth,
            entry.stage,
            entry.impact,
            entry.interaction,
            entry.unfinishedWeight,
            entry.influence,
            entry.currentState,
            entry.emotionalTone,
            entry.unspokenLine,
            entry.positiveImpact,
            entry.ongoingShadow,
            entry.boundaryStatus,
            ...entry.emotionCues,
            ...entry.unsentLineIds,
            ...entry.tags,
            ...entry.events.flatMap((event) => [
              event.date,
              event.kind,
              event.title,
              event.summary,
            ]),
            ...entry.history.flatMap((history) => [
              history.date,
              history.field,
              history.from,
              history.to,
              history.note,
            ]),
          ),
        ),
      }
    })
    const visibleRelationshipIds = new Set(
      circles.flatMap((circle) => circle.entries.map((entry) => entry.id)),
    )
    const patterns = workspace.relationships.patterns.filter((entry) =>
      matchesQuery(entry.title, entry.summary, ...entry.cues),
    )
    const unsentNotes = workspace.relationships.unsentNotes.filter(
      (entry) =>
        matchesQuery(
          entry.targetType,
          entry.relationshipId,
          entry.to,
          entry.theme,
          entry.excerpt,
          entry.unfinishedWeight,
        ) || (entry.relationshipId ? visibleRelationshipIds.has(entry.relationshipId) : false),
    )

    return {
      ...workspace.relationships,
      circles,
      patterns,
      unsentNotes,
    }
  }, [matchesQuery, workspace.relationships])

  const relationshipCircles = relationshipsModule.circles
  const relationshipPatterns = relationshipsModule.patterns
  const relationshipUnsentNotes = relationshipsModule.unsentNotes

  const legacyModule = useMemo(
    () => ({
      ...workspace.legacy,
      items: workspace.legacy.items.filter((entry) =>
        matchesQuery(
          entry.title,
          entry.category,
          entry.recipient,
          entry.recipientName,
          entry.relatedRelationshipId,
          entry.urgency,
          entry.visibility,
          entry.deliveryCondition,
          entry.status,
          entry.emotionalLoad,
          entry.summary,
          entry.contentPreview,
          entry.isLocked ? "锁定" : "可修改",
          entry.updatedAt,
          entry.reviewCue,
          ...entry.tags,
        ),
      ),
      trustBoundaries: workspace.legacy.trustBoundaries.filter((entry) =>
        matchesQuery(entry.title, entry.detail),
      ),
      reviewPrompts: workspace.legacy.reviewPrompts.filter((entry) => matchesQuery(entry)),
    }),
    [matchesQuery, workspace.legacy],
  )

  const legacyItems = legacyModule.items
  const legacyDirectives = legacyItems.filter((entry) => entry.category === "重要交代")
  const legacyLetters = legacyItems.filter((entry) => entry.category === "留给某人的话")

  const milestones = useMemo(
    () =>
      workspace.future.milestones.filter((entry) =>
        matchesQuery(entry.horizon, entry.summary, ...entry.steps),
      ),
    [matchesQuery, workspace.future.milestones],
  )

  const nutritionModule = useMemo(
    () => ({
      ...workspace.nutrition,
      meals: workspace.nutrition.meals.filter((entry) =>
        matchesQuery(
          entry.date,
          entry.title,
          entry.scene,
          entry.structure,
          entry.beverageKind,
          entry.composition,
          entry.origin,
          entry.trigger,
          entry.valueDensity,
          entry.bodyFeedback,
          entry.cost,
          ...(entry.companions ?? []),
          entry.relatedFoodMemoryId,
          entry.relatedFinanceEntryId,
          entry.relatedEmotionEntryId,
          entry.note,
          ...entry.detailSignals,
        ),
      ),
      weeklyReview: {
        ...workspace.nutrition.weeklyReview,
        highlights: workspace.nutrition.weeklyReview.highlights.filter((entry) =>
          matchesQuery(entry.title, entry.summary, ...entry.evidence),
        ),
        missingSignals: workspace.nutrition.weeklyReview.missingSignals.filter((entry) =>
          matchesQuery(entry),
        ),
        crossViews: workspace.nutrition.weeklyReview.crossViews
          .map((entry) => {
            if (matchesQuery(entry.title, entry.summary)) {
              return entry
            }

            const rows = entry.rows.filter((row) =>
              matchesQuery(row.label, row.count, row.valueDensity, row.bodyFeedback),
            )

            if (rows.length === 0) {
              return null
            }

            return {
              ...entry,
              rows,
            }
          })
          .filter((entry) => entry !== null),
      },
      foodMemories: workspace.nutrition.foodMemories.filter((entry) =>
        matchesQuery(
          entry.name,
          entry.type,
          entry.flavorDescription,
          entry.recipe,
          entry.story,
          entry.currentAvailability,
          entry.emotionalLoad,
          ...(entry.relatedPeople ?? []),
          ...(entry.relatedMemoryIds ?? []),
        ),
      ),
    }),
    [matchesQuery, workspace.nutrition],
  )

  const nutritionMeals = nutritionModule.meals
  const nutritionHighlights = nutritionModule.weeklyReview.highlights
  const nutritionFoodMemories = nutritionModule.foodMemories

  const socioeconomicsEntries = useMemo(
    () =>
      workspace.socioeconomics.entries.filter((entry) =>
        matchesQuery(
          entry.title,
          entry.domain,
          entry.layer,
          entry.confidence,
          entry.source,
          entry.summary,
        ),
      ),
    [matchesQuery, workspace.socioeconomics.entries],
  )

  const socioeconomicsGaps = useMemo(
    () => workspace.socioeconomics.gaps.filter((entry) => matchesQuery(entry)),
    [matchesQuery, workspace.socioeconomics.gaps],
  )

  const visibleShoppingCount = shoppingModule.purchaseLanes.reduce(
    (count, column) => count + column.items.length,
    0,
  )

  const visibleRelationshipCount = relationshipCircles.reduce(
    (count, circle) => count + circle.entries.length,
    0,
  )

  const journeyData = useMemo(() => {
    const memories = workspace.memory.memories.filter((entry) =>
      matchesQuery(
        entry.title,
        entry.type,
        entry.primaryEra,
        ...entry.era,
        entry.emotionalWeight,
        entry.processing,
        entry.privacy,
        entry.formativePower,
        entry.summary,
        entry.impact,
        entry.sensoryCue,
        ...entry.sourceModules,
        ...entry.tags,
      ),
    )
    const visibleMemoryIds = new Set(memories.map((entry) => entry.id))
    const growthNodes = workspace.growth.growthNodes.filter((entry) => {
      const linkedMemoryIds = [
        ...entry.beforeMemoryIds,
        ...entry.afterMemoryIds,
        entry.triggerMemoryId,
      ]

      return (
        matchesQuery(
          entry.title,
          entry.domain,
          entry.stability,
          entry.before,
          entry.after,
          entry.keyEvent,
          ...entry.evidence,
        ) || linkedMemoryIds.some((memoryId) => visibleMemoryIds.has(memoryId))
      )
    })
    const threads = workspace.growth.threads.filter((entry) => matchesQuery(entry))
    const anchors = workspace.memory.anchors.filter(
      (entry) =>
        matchesQuery(entry.type, entry.label, entry.note, ...entry.linkedMemoryIds) ||
        entry.linkedMemoryIds.some((memoryId) => visibleMemoryIds.has(memoryId)),
    )
    const eraSuggestions = workspace.memory.eraSuggestions.filter((entry) => matchesQuery(entry))
    const reviewPrompts = workspace.memory.reviewPrompts.filter((entry) => matchesQuery(entry))

    return { growthNodes, threads, memories, anchors, eraSuggestions, reviewPrompts }
  }, [matchesQuery, workspace.growth, workspace.memory])

  const visibleExpenseTotal = transactions
    .filter((entry) => entry.direction === "expense")
    .reduce((sum, entry) => sum + entry.amount, 0)

  const visibleIncomeTotal = transactions
    .filter((entry) => entry.direction === "income")
    .reduce((sum, entry) => sum + entry.amount, 0)

  return {
    beliefCards,
    beliefQuestions,
    crisisContacts,
    crisisCurrentState: workspace.crisis.currentState,
    crisisReviewNotes,
    crisisSteps,
    crisisWarningSigns,
    dailyPulse: workspace.overview.dailyPulse,
    emotionCheckIns,
    emotionTools,
    emotionTrend,
    emotionTriggers,
    events,
    futureBlueprint: workspace.future,
    greeting: workspace.overview.greeting,
    journeyData,
    legacyDirectives,
    legacyLetters,
    legacyModule,
    milestones,
    nutritionModule,
    nutritionMeals,
    nutritionHighlights,
    nutritionFoodMemories,
    principleBoundaries,
    principlesModule,
    principles,
    recentRecords,
    reflectionDraftExample: workspace.reflection.draftExample,
    reflections,
    relationshipsModule,
    relationshipCircles,
    relationshipPatterns,
    relationshipUnsentNotes,
    shoppingModule,
    socioeconomicsEntries,
    socioeconomicsGaps,
    transactions,
    visibleExpenseTotal,
    visibleIncomeTotal,
    visibleRelationshipCount,
    visibleShoppingCount,
    workspace,
  }
}
