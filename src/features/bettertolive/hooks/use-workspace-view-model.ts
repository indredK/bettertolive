import { useCallback, useMemo } from "react"

import type {
  EmotionTriggerGroup,
  ShoppingLifestyleCollection,
  ShoppingStageTemplate,
  WorkspaceSnapshot,
} from "@/features/bettertolive/models/workspace"
import { normalizeRelationshipsModuleData } from "@/features/bettertolive/models/relationship-connections"
import {
  LEGACY_CATEGORY_DIRECTIVE,
  LEGACY_CATEGORY_LETTER,
} from "@/features/bettertolive/ui/legacy/legacy-page-data"

function filterStageTemplateByQuery(
  stage: ShoppingStageTemplate,
  hasQuery: boolean,
  matchesQuery: (...values: Array<string | number | undefined>) => boolean,
) {
  if (!hasQuery) {
    return stage
  }
  if (matchesQuery(stage.name, stage.description, stage.focus)) {
    return stage
  }
  // 阶段下物品的过滤交给视图层(按 itemId 解出名字时再做)
  return null
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
        matchesQuery(
          entry.date,
          entry.title,
          entry.excerpt,
          entry.theme,
          entry.type,
          entry.createdAt,
          entry.occurredAt,
          entry.content,
          entry.status,
          ...(entry.tags ?? []),
        ),
      ),
    [matchesQuery, workspace.events.entries],
  )

  const transactions = useMemo(
    () =>
      workspace.finance.entries.filter((entry) =>
        matchesQuery(
          entry.date,
          entry.label,
          entry.category,
          entry.note,
          entry.amount,
          entry.account,
          entry.lifeSystem,
          entry.necessity,
          entry.reviewStatus,
          entry.linkedModule,
          ...(entry.tags ?? []),
        ),
      ),
    [matchesQuery, workspace.finance.entries],
  )

  const shoppingModule = useMemo(
    () => ({
      ...workspace.shopping,
      systemDefinitions: workspace.shopping.systemDefinitions.filter((entry) =>
        matchesQuery(
          entry.id,
          entry.name,
          entry.summary,
          entry.keyQuestion,
          ...entry.secondaryGroups,
        ),
      ),
      spaceDefinitions: workspace.shopping.spaceDefinitions.filter((entry) =>
        matchesQuery(entry.name),
      ),
      spotlights: workspace.shopping.spotlights.filter((entry) =>
        matchesQuery(entry.title, entry.stage, entry.summary, entry.reason, ...entry.attention),
      ),
      items: workspace.shopping.items.filter((entry) =>
        matchesQuery(
          entry.name,
          ...entry.systemTags,
          ...entry.spaceTags,
          ...entry.children.map((c) => c.name),
          ...entry.children.flatMap((child) => [
            child.status,
            child.lifecycle,
            child.depreciation,
            ...(child.channelPrices ?? []).map((channelPrice) => channelPrice.channel),
          ]),
          entry.note,
        ),
      ),
      stageTemplates: workspace.shopping.stageTemplates
        .map((entry) => filterStageTemplateByQuery(entry, normalizedQuery.length > 0, matchesQuery))
        .filter((entry): entry is ShoppingStageTemplate => entry !== null),
      boundaryEntries: workspace.shopping.boundaryEntries.filter((entry) =>
        matchesQuery(entry.item, entry.system, entry.reason),
      ),
      lifestyleCollections: workspace.shopping.lifestyleCollections
        .map((entry) => filterCollectionByQuery(entry, normalizedQuery.length > 0, matchesQuery))
        .filter((entry): entry is ShoppingLifestyleCollection => entry !== null),
    }),
    [matchesQuery, normalizedQuery.length, workspace.shopping],
  )

  const emotionModule = useMemo(() => {
    const hasQuery = normalizedQuery.length > 0
    const checkIns = workspace.emotion.checkIns.filter((entry) =>
      matchesQuery(
        entry.date,
        entry.summary,
        entry.state,
        entry.intensity,
        entry.bodySignal,
        entry.triggerEvent,
        entry.impulse,
        entry.needRightNow,
        ...entry.tags,
        ...(entry.emotionTags ?? []),
      ),
    )
    const trend = workspace.emotion.trend.filter((entry) =>
      matchesQuery(entry.label, entry.score, entry.note, entry.primaryState),
    )
    const triggers = workspace.emotion.triggers
      .map((entry) => filterEmotionTriggerByQuery(entry, hasQuery, matchesQuery))
      .filter((entry) => entry !== null)
    const tools = workspace.emotion.tools.filter((entry) =>
      matchesQuery(entry.title, entry.description, entry.when, entry.kind, entry.contactScript),
    )
    const timelineSegments = workspace.emotion.timelineSegments.filter((entry) =>
      matchesQuery(entry.range, entry.trend, entry.summary),
    )
    const loopPatterns = workspace.emotion.loopPatterns.filter((entry) =>
      matchesQuery(entry.title, entry.description, entry.frequency),
    )
    const lifestyleLinks = workspace.emotion.lifestyleLinks.filter((entry) =>
      matchesQuery(entry.factor, entry.observation, entry.direction),
    )
    const environmentCues = workspace.emotion.environmentCues.filter((entry) =>
      matchesQuery(entry.context, entry.description),
    )
    const relationshipCues = workspace.emotion.relationshipCues.filter((entry) =>
      matchesQuery(entry.who, entry.pattern),
    )
    const recoveryNotes = workspace.emotion.recoveryNotes.filter((entry) =>
      matchesQuery(entry.date, entry.what, entry.effect),
    )
    const ineffectiveActions = workspace.emotion.ineffectiveActions.filter((entry) =>
      matchesQuery(entry),
    )
    const minimalRecoverySteps = workspace.emotion.minimalRecoverySteps.filter((entry) =>
      matchesQuery(entry),
    )

    return {
      ...workspace.emotion,
      checkIns,
      trend,
      triggers,
      tools,
      timelineSegments,
      loopPatterns,
      lifestyleLinks,
      environmentCues,
      relationshipCues,
      recoveryNotes,
      ineffectiveActions,
      minimalRecoverySteps,
    }
  }, [matchesQuery, normalizedQuery.length, workspace.emotion])

  const emotionCheckIns = emotionModule.checkIns
  const emotionTrend = emotionModule.trend
  const emotionTriggers = emotionModule.triggers
  const emotionTools = emotionModule.tools

  const recentRecords = useMemo(
    () =>
      workspace.overview.recentRecords.filter((entry) =>
        matchesQuery(entry.date, entry.kind, entry.title, entry.description),
      ),
    [matchesQuery, workspace.overview.recentRecords],
  )

  const beliefsModule = useMemo(() => {
    const cards = workspace.beliefs.cards.filter((entry) =>
      matchesQuery(entry.label, entry.summary, entry.note, ...entry.keywords),
    )
    const questions = workspace.beliefs.questions.filter((entry) => matchesQuery(entry))
    const entries = workspace.beliefs.entries.filter((entry) =>
      matchesQuery(
        entry.title,
        entry.statement,
        entry.description,
        entry.domain,
        entry.layer,
        entry.stability,
        entry.source,
        entry.impact,
        ...(entry.secondaryDomains ?? []),
        entry.cbtLayer,
        ...(entry.cognitiveDistortions ?? []),
        entry.defenseMechanism,
        entry.attachmentNote,
        ...entry.tags,
        ...entry.revisionHistory.flatMap((revision) => [
          revision.date,
          revision.summary,
          ...revision.changedFields,
        ]),
      ),
    )
    const visibleEntryIds = new Set(entries.map((entry) => entry.id))
    const relations = workspace.beliefs.relations.filter(
      (relation) =>
        matchesQuery(relation.type, relation.fromId, relation.toId, relation.note) ||
        visibleEntryIds.has(relation.fromId) ||
        visibleEntryIds.has(relation.toId),
    )

    return {
      ...workspace.beliefs,
      cards,
      questions,
      entries,
      relations,
    }
  }, [matchesQuery, workspace.beliefs])

  const beliefCards = beliefsModule.cards
  const beliefQuestions = beliefsModule.questions

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
    const normalizedRelationshipsModule = normalizeRelationshipsModuleData(workspace.relationships)
    const circles = normalizedRelationshipsModule.circles.map((circle) => {
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
    const initiallyVisibleRelationshipIds = new Set(
      circles.flatMap((circle) => circle.entries.map((entry) => entry.id)),
    )
    const matchedConnectionRelationshipIds = new Set(
      normalizedRelationshipsModule.connections
        .filter((connection) =>
          matchesQuery(
            connection.note,
            connection.strength,
            ...connection.roles.flatMap((role) => [role.sourceRole, role.targetRole, role.note]),
          ),
        )
        .flatMap((connection) => [connection.sourceId, connection.targetId]),
    )
    const boostedVisibleRelationshipIds = new Set([
      ...initiallyVisibleRelationshipIds,
      ...matchedConnectionRelationshipIds,
    ])
    const boostedCircles = normalizedRelationshipsModule.circles.map((circle) => {
      if (matchesQuery(circle.title, circle.summary)) {
        return circle
      }

      return {
        ...circle,
        entries: circle.entries.filter((entry) => boostedVisibleRelationshipIds.has(entry.id)),
      }
    })
    const visibleRelationshipIds = new Set(
      boostedCircles.flatMap((circle) => circle.entries.map((entry) => entry.id)),
    )
    const patterns = normalizedRelationshipsModule.patterns.filter((entry) =>
      matchesQuery(entry.title, entry.summary, ...entry.cues),
    )
    const unsentNotes = normalizedRelationshipsModule.unsentNotes.filter(
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
    const connections = normalizedRelationshipsModule.connections.filter(
      (connection) =>
        (visibleRelationshipIds.has(connection.sourceId) &&
          visibleRelationshipIds.has(connection.targetId)) ||
        matchesQuery(
          connection.note,
          connection.strength,
          ...connection.roles.flatMap((role) => [role.sourceRole, role.targetRole, role.note]),
        ),
    )

    return {
      ...normalizedRelationshipsModule,
      circles: boostedCircles,
      connections,
      patterns,
      unsentNotes,
    }
  }, [matchesQuery, workspace.relationships])

  const relationshipCircles = relationshipsModule.circles
  const relationshipConnections = relationshipsModule.connections
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
          entry.content,
          entry.contentPreview,
          // 布尔标志不参与自由文本搜索；使用专用过滤器代替
          entry.createdAt,
          entry.updatedAt,
          entry.finalizedAt,
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
  const legacyDirectives = legacyItems.filter(
    (entry) => entry.category === LEGACY_CATEGORY_DIRECTIVE,
  )
  const legacyLetters = legacyItems.filter((entry) => entry.category === LEGACY_CATEGORY_LETTER)

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
      foodCategories: (workspace.nutrition.foodCategories ?? []).filter((entry) =>
        matchesQuery(entry.id, entry.name, entry.dimension, entry.description, entry.sortOrder),
      ),
      foods: (workspace.nutrition.foods ?? []).filter((entry) =>
        matchesQuery(
          entry.id,
          entry.name,
          ...entry.categoryIds,
          entry.defaultUnit,
          entry.storage,
          entry.lifecycle,
          ...entry.allergenTags,
          ...entry.dietaryTags,
          entry.nutrientProfileId,
          entry.note,
        ),
      ),
      nutrientProfiles: (workspace.nutrition.nutrientProfiles ?? []).filter((entry) =>
        matchesQuery(
          entry.id,
          entry.foodId,
          entry.basisAmount,
          entry.basisUnit,
          entry.energyKcal,
          entry.proteinG,
          entry.fatG,
          entry.carbG,
          entry.fiberG,
          entry.sugarG,
          entry.sodiumMg,
          entry.source,
          entry.confidence,
        ),
      ),
      recipes: (workspace.nutrition.recipes ?? []).filter((entry) =>
        matchesQuery(
          entry.id,
          entry.name,
          entry.summary,
          entry.servings,
          ...entry.mealRoles,
          ...entry.ingredients.flatMap((ingredient) => [
            ingredient.foodId,
            ingredient.amount,
            ingredient.unit,
            ingredient.note,
          ]),
          ...entry.steps,
          entry.prepMinutes,
          entry.cookMinutes,
          entry.difficulty,
          entry.repeatability,
          ...entry.tags,
          entry.linkedFoodMemoryId,
        ),
      ),
      dailyPlans: (workspace.nutrition.dailyPlans ?? []).filter((entry) =>
        matchesQuery(
          entry.id,
          entry.date,
          entry.note,
          ...entry.slots.flatMap((slot) => [
            slot.id,
            slot.structure,
            slot.status,
            slot.note,
            ...slot.entries.flatMap((slotEntry) =>
              slotEntry.type === "recipe"
                ? [slotEntry.type, slotEntry.recipeId, slotEntry.servings]
                : slotEntry.type === "food"
                  ? [slotEntry.type, slotEntry.foodId, slotEntry.amount, slotEntry.unit]
                  : [slotEntry.type, slotEntry.title, slotEntry.note],
            ),
          ]),
        ),
      ),
      mealLogs: (workspace.nutrition.mealLogs ?? []).filter((entry) => {
        const relatedFoodMemory = (workspace.nutrition.foodMemories ?? []).find(
          (memory) => memory.id === entry.relatedFoodMemoryId,
        )

        return matchesQuery(
          entry.id,
          entry.dateTime,
          entry.plannedSlotId,
          entry.relatedFoodMemoryId,
          relatedFoodMemory?.name,
          relatedFoodMemory?.type,
          relatedFoodMemory?.story,
          entry.scene,
          entry.trigger,
          entry.valueDensity,
          entry.bodyFeedback,
          entry.changeReason,
          entry.note,
          ...entry.entries.flatMap((logEntry) =>
            logEntry.type === "recipe"
              ? [logEntry.type, logEntry.recipeId, logEntry.servings]
              : logEntry.type === "food"
                ? [logEntry.type, logEntry.foodId, logEntry.amount, logEntry.unit]
                : [logEntry.type, logEntry.title, logEntry.note],
          ),
        )
      }),
      meals: (workspace.nutrition.meals ?? []).filter((entry) =>
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
        highlights: (workspace.nutrition.weeklyReview?.highlights ?? []).filter((entry) =>
          matchesQuery(entry.title, entry.summary, ...entry.evidence),
        ),
        missingSignals: (workspace.nutrition.weeklyReview?.missingSignals ?? []).filter((entry) =>
          matchesQuery(entry),
        ),
        crossViews: (workspace.nutrition.weeklyReview?.crossViews ?? [])
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
      foodMemories: (workspace.nutrition.foodMemories ?? []).filter((entry) =>
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

  const socioeconomicsModule = useMemo(() => {
    const entries = workspace.socioeconomics.entries.filter((entry) =>
      matchesQuery(
        entry.title,
        entry.domain,
        entry.layer,
        entry.confidence,
        entry.source,
        entry.relevance,
        entry.summary,
        entry.understandingNote,
        ...(entry.relatedConcepts ?? []),
        ...(entry.tags ?? []),
        ...(entry.confidenceHistory ?? []).flatMap((history) => [
          history.date,
          history.from,
          history.to,
          history.trigger,
        ]),
      ),
    )
    const gaps = workspace.socioeconomics.gaps.filter((entry) =>
      matchesQuery(entry.domain, entry.summary, entry.nextStep),
    )
    const reviewPrompts = workspace.socioeconomics.reviewPrompts.filter((entry) =>
      matchesQuery(entry),
    )

    return {
      ...workspace.socioeconomics,
      entries,
      gaps,
      reviewPrompts,
    }
  }, [matchesQuery, workspace.socioeconomics])

  const socioeconomicsEntries = socioeconomicsModule.entries
  const socioeconomicsGaps = socioeconomicsModule.gaps

  const visibleShoppingCount = shoppingModule.items.length

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
    beliefsModule,
    dailyPulse: workspace.overview.dailyPulse,
    emotionCheckIns,
    emotionModule,
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
    relationshipConnections,
    relationshipPatterns,
    relationshipUnsentNotes,
    shoppingModule,
    socioeconomicsEntries,
    socioeconomicsGaps,
    socioeconomicsModule,
    transactions,
    visibleExpenseTotal,
    visibleIncomeTotal,
    visibleRelationshipCount,
    visibleShoppingCount,
    workspace,
  }
}
