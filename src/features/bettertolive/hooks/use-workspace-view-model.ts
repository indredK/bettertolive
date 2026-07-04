import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import type { TFunction } from "i18next"

import type {
  AppView,
  EmotionTriggerGroup,
  ShoppingLifestyleCollection,
  ShoppingStageTemplate,
  WorkspaceSnapshot,
} from "@/features/bettertolive/models/workspace"
import { normalizeRelationshipsModuleData } from "@/features/bettertolive/models/relationship-connections"
import { getFinanceEnumSearchTokens } from "@/features/bettertolive/finance/finance-page-data"

type QueryMatcher = (...values: Array<string | number | undefined>) => boolean

type WorkspaceViewModel = {
  dailyPulse: WorkspaceSnapshot["overview"]["dailyPulse"]
  recentRecords: WorkspaceSnapshot["overview"]["recentRecords"]
  reflectionDraftExample: WorkspaceSnapshot["reflection"]["draftExample"]
  reflections: WorkspaceSnapshot["reflection"]["entries"]
  events: WorkspaceSnapshot["events"]["entries"]
  transactions: WorkspaceSnapshot["finance"]["entries"]
  shoppingModule: WorkspaceSnapshot["shopping"]
  nutritionModule: WorkspaceSnapshot["nutrition"]
  emotionModule: WorkspaceSnapshot["emotion"]
  beliefsModule: WorkspaceSnapshot["beliefs"]
  principlesModule: WorkspaceSnapshot["principles"]
  relationshipsModule: WorkspaceSnapshot["relationships"]
  journeyData: {
    growthNodes: WorkspaceSnapshot["growth"]["growthNodes"]
    threads: WorkspaceSnapshot["growth"]["threads"]
    memories: WorkspaceSnapshot["memory"]["memories"]
    anchors: WorkspaceSnapshot["memory"]["anchors"]
    eraSuggestions: WorkspaceSnapshot["memory"]["eraSuggestions"]
    reviewPrompts: WorkspaceSnapshot["memory"]["reviewPrompts"]
  }
  legacyModule: WorkspaceSnapshot["legacy"]
  socioeconomicsModule: WorkspaceSnapshot["socioeconomics"]
  futureBlueprint: WorkspaceSnapshot["future"]
  milestones: WorkspaceSnapshot["future"]["milestones"]
}

function createQueryMatcher(searchQuery: string): {
  hasQuery: boolean
  matchesQuery: QueryMatcher
} {
  const normalizedQuery = searchQuery.trim().toLowerCase()

  return {
    hasQuery: normalizedQuery.length > 0,
    matchesQuery: (...values) =>
      normalizedQuery.length === 0 ||
      values.some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(normalizedQuery),
      ),
  }
}

function filterStageTemplateByQuery(
  stage: ShoppingStageTemplate,
  hasQuery: boolean,
  matchesQuery: QueryMatcher,
) {
  if (!hasQuery) {
    return stage
  }
  if (matchesQuery(stage.name, stage.description, stage.focus)) {
    return stage
  }

  return null
}

function filterCollectionByQuery(
  collection: ShoppingLifestyleCollection,
  hasQuery: boolean,
  matchesQuery: QueryMatcher,
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
  matchesQuery: QueryMatcher,
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

function buildJourneyData(workspace: WorkspaceSnapshot): WorkspaceViewModel["journeyData"] {
  return {
    growthNodes: workspace.growth.growthNodes,
    threads: workspace.growth.threads,
    memories: workspace.memory.memories,
    anchors: workspace.memory.anchors,
    eraSuggestions: workspace.memory.eraSuggestions,
    reviewPrompts: workspace.memory.reviewPrompts,
  }
}

export function buildWorkspaceViewModel({
  activeView,
  searchQuery,
  t,
  workspace,
}: {
  activeView: AppView
  searchQuery: string
  t: TFunction
  workspace: WorkspaceSnapshot
}): WorkspaceViewModel {
  const { hasQuery, matchesQuery } = createQueryMatcher(searchQuery)

  const recentRecords =
    activeView === "overview" && hasQuery
      ? workspace.overview.recentRecords.filter((entry) =>
          matchesQuery(entry.date, entry.kind, entry.title, entry.description),
        )
      : workspace.overview.recentRecords

  const reflections =
    activeView === "reflection" && hasQuery
      ? workspace.reflection.entries.filter((entry) =>
          matchesQuery(entry.date, entry.title, entry.excerpt, ...entry.tags),
        )
      : workspace.reflection.entries

  const events =
    activeView === "events" && hasQuery
      ? workspace.events.entries.filter((entry) =>
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
        )
      : workspace.events.entries

  const transactions =
    activeView === "finance" && hasQuery
      ? workspace.finance.entries.filter((entry) =>
          matchesQuery(
            entry.date,
            entry.label,
            entry.note,
            entry.amount,
            entry.account,
            ...getFinanceEnumSearchTokens(t, "category", entry.category),
            ...getFinanceEnumSearchTokens(t, "lifeSystem", entry.lifeSystem),
            ...getFinanceEnumSearchTokens(t, "necessity", entry.necessity),
            ...getFinanceEnumSearchTokens(t, "reviewStatus", entry.reviewStatus),
            ...getFinanceEnumSearchTokens(t, "linkedModule", entry.linkedModule),
            ...(entry.tags ?? []),
          ),
        )
      : workspace.finance.entries

  const shoppingModule =
    activeView === "shopping" && hasQuery
      ? {
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
              ...entry.children.map((child) => child.name),
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
            .map((entry) => filterStageTemplateByQuery(entry, hasQuery, matchesQuery))
            .filter((entry): entry is ShoppingStageTemplate => entry !== null),
          boundaryEntries: workspace.shopping.boundaryEntries.filter((entry) =>
            matchesQuery(entry.item, entry.system, entry.reason),
          ),
          lifestyleCollections: workspace.shopping.lifestyleCollections
            .map((entry) => filterCollectionByQuery(entry, hasQuery, matchesQuery))
            .filter((entry): entry is ShoppingLifestyleCollection => entry !== null),
        }
      : workspace.shopping

  const nutritionModule =
    activeView === "nutrition" && hasQuery
      ? {
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
            missingSignals: (workspace.nutrition.weeklyReview?.missingSignals ?? []).filter(
              (entry) => matchesQuery(entry.label, ...entry.evidence),
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
              .filter((entry): entry is NonNullable<typeof entry> => entry !== null),
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
        }
      : workspace.nutrition

  const emotionModule =
    activeView === "emotion" && hasQuery
      ? {
          ...workspace.emotion,
          checkIns: workspace.emotion.checkIns.filter((entry) =>
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
          ),
          trend: workspace.emotion.trend.filter((entry) =>
            matchesQuery(entry.label, entry.score, entry.note, entry.primaryState),
          ),
          triggers: workspace.emotion.triggers
            .map((entry) => filterEmotionTriggerByQuery(entry, hasQuery, matchesQuery))
            .filter((entry): entry is EmotionTriggerGroup => entry !== null),
          tools: workspace.emotion.tools.filter((entry) =>
            matchesQuery(
              entry.title,
              entry.description,
              entry.when,
              entry.kind,
              entry.contactScript,
            ),
          ),
          timelineSegments: workspace.emotion.timelineSegments.filter((entry) =>
            matchesQuery(entry.range, entry.trend, entry.summary),
          ),
          loopPatterns: workspace.emotion.loopPatterns.filter((entry) =>
            matchesQuery(entry.title, entry.description, entry.frequency),
          ),
          lifestyleLinks: workspace.emotion.lifestyleLinks.filter((entry) =>
            matchesQuery(entry.factor, entry.observation, entry.direction),
          ),
          environmentCues: workspace.emotion.environmentCues.filter((entry) =>
            matchesQuery(entry.context, entry.description),
          ),
          relationshipCues: workspace.emotion.relationshipCues.filter((entry) =>
            matchesQuery(entry.who, entry.pattern),
          ),
          recoveryNotes: workspace.emotion.recoveryNotes.filter((entry) =>
            matchesQuery(entry.date, entry.what, entry.effect),
          ),
          ineffectiveActions: workspace.emotion.ineffectiveActions.filter((entry) =>
            matchesQuery(entry),
          ),
          minimalRecoverySteps: workspace.emotion.minimalRecoverySteps.filter((entry) =>
            matchesQuery(entry),
          ),
        }
      : workspace.emotion

  const beliefsModule =
    activeView === "beliefs" && hasQuery
      ? (() => {
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

          return {
            ...workspace.beliefs,
            cards: workspace.beliefs.cards.filter((entry) =>
              matchesQuery(entry.label, entry.summary, entry.note, ...entry.keywords),
            ),
            questions: workspace.beliefs.questions.filter((entry) => matchesQuery(entry)),
            entries,
            relations: workspace.beliefs.relations.filter(
              (relation) =>
                matchesQuery(relation.type, relation.fromId, relation.toId, relation.note) ||
                visibleEntryIds.has(relation.fromId) ||
                visibleEntryIds.has(relation.toId),
            ),
          }
        })()
      : workspace.beliefs

  const principlesModule =
    activeView === "principles" && hasQuery
      ? (() => {
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

          return {
            ...workspace.principles,
            entries,
            boundaries: workspace.principles.boundaries.filter((entry) => matchesQuery(entry)),
            relations: workspace.principles.relations.filter(
              (entry) =>
                matchesQuery(entry.type, entry.fromId, entry.toId, entry.note) ||
                visibleEntryIds.has(entry.fromId) ||
                visibleEntryIds.has(entry.toId),
            ),
            decisionPrompts: workspace.principles.decisionPrompts.filter((entry) =>
              matchesQuery(entry),
            ),
          }
        })()
      : workspace.principles

  const relationshipsModule =
    activeView === "relationships"
      ? (() => {
          const normalizedRelationshipsModule = normalizeRelationshipsModuleData(
            workspace.relationships,
          )

          if (!hasQuery) {
            return normalizedRelationshipsModule
          }

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
                  ...connection.roles.flatMap((role) => [
                    role.sourceRole,
                    role.targetRole,
                    role.note,
                  ]),
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
              entries: circle.entries.filter((entry) =>
                boostedVisibleRelationshipIds.has(entry.id),
              ),
            }
          })
          const visibleRelationshipIds = new Set(
            boostedCircles.flatMap((circle) => circle.entries.map((entry) => entry.id)),
          )

          return {
            ...normalizedRelationshipsModule,
            circles: boostedCircles,
            patterns: normalizedRelationshipsModule.patterns.filter((entry) =>
              matchesQuery(entry.title, entry.summary, ...entry.cues),
            ),
            unsentNotes: normalizedRelationshipsModule.unsentNotes.filter(
              (entry) =>
                matchesQuery(
                  entry.targetType,
                  entry.relationshipId,
                  entry.to,
                  entry.theme,
                  entry.excerpt,
                  entry.unfinishedWeight,
                ) ||
                (entry.relationshipId ? visibleRelationshipIds.has(entry.relationshipId) : false),
            ),
            connections: normalizedRelationshipsModule.connections.filter(
              (connection) =>
                (visibleRelationshipIds.has(connection.sourceId) &&
                  visibleRelationshipIds.has(connection.targetId)) ||
                matchesQuery(
                  connection.note,
                  connection.strength,
                  ...connection.roles.flatMap((role) => [
                    role.sourceRole,
                    role.targetRole,
                    role.note,
                  ]),
                ),
            ),
          }
        })()
      : workspace.relationships

  const journeyData =
    activeView === "journey" && hasQuery
      ? (() => {
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

          return {
            memories,
            growthNodes: workspace.growth.growthNodes.filter((entry) => {
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
            }),
            threads: workspace.growth.threads.filter((entry) => matchesQuery(entry)),
            anchors: workspace.memory.anchors.filter(
              (entry) =>
                matchesQuery(entry.type, entry.label, entry.note, ...entry.linkedMemoryIds) ||
                entry.linkedMemoryIds.some((memoryId) => visibleMemoryIds.has(memoryId)),
            ),
            eraSuggestions: workspace.memory.eraSuggestions.filter((entry) => matchesQuery(entry)),
            reviewPrompts: workspace.memory.reviewPrompts.filter((entry) => matchesQuery(entry)),
          }
        })()
      : buildJourneyData(workspace)

  const legacyModule =
    activeView === "legacy" && hasQuery
      ? {
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
        }
      : workspace.legacy

  const socioeconomicsModule =
    activeView === "socioeconomics" && hasQuery
      ? {
          ...workspace.socioeconomics,
          entries: workspace.socioeconomics.entries.filter((entry) =>
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
          ),
          gaps: workspace.socioeconomics.gaps.filter((entry) =>
            matchesQuery(entry.domain, entry.summary, entry.nextStep),
          ),
          reviewPrompts: workspace.socioeconomics.reviewPrompts.filter((entry) =>
            matchesQuery(entry),
          ),
        }
      : workspace.socioeconomics

  const milestones =
    activeView === "future" && hasQuery
      ? workspace.future.milestones.filter((entry) =>
          matchesQuery(entry.horizon, entry.summary, ...entry.steps),
        )
      : workspace.future.milestones

  return {
    dailyPulse: workspace.overview.dailyPulse,
    recentRecords,
    reflectionDraftExample: workspace.reflection.draftExample,
    reflections,
    events,
    transactions,
    shoppingModule,
    nutritionModule,
    emotionModule,
    beliefsModule,
    principlesModule,
    relationshipsModule,
    journeyData,
    legacyModule,
    socioeconomicsModule,
    futureBlueprint: workspace.future,
    milestones,
  }
}

export function useWorkspaceViewModel({
  activeView,
  searchQuery,
  workspace,
}: {
  activeView: AppView
  searchQuery: string
  workspace: WorkspaceSnapshot
}) {
  const { t } = useTranslation()

  return useMemo(
    () =>
      buildWorkspaceViewModel({
        activeView,
        searchQuery,
        t,
        workspace,
      }),
    [activeView, searchQuery, t, workspace],
  )
}
