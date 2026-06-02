import { useCallback, useMemo } from "react"

import type { WorkspaceSnapshot } from "@/features/bettertolive/models/workspace"

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
        matchesQuery(
          entry.date,
          entry.label,
          entry.category,
          entry.note,
          entry.amount,
        ),
      ),
    [matchesQuery, workspace.finance.entries],
  )

  const shoppingColumns = useMemo(
    () =>
      workspace.shopping.columns.map((column) => ({
        ...column,
        items: column.items.filter((item) =>
          matchesQuery(item.title, item.note, item.price, column.title),
        ),
      })),
    [matchesQuery, workspace.shopping.columns],
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

  const principles = useMemo(
    () =>
      workspace.principles.entries.filter((entry) =>
        matchesQuery(
          entry.title,
          entry.description,
          entry.boundary,
          entry.source,
        ),
      ),
    [matchesQuery, workspace.principles.entries],
  )

  const principleBoundaries = useMemo(
    () =>
      workspace.principles.boundaries.filter((entry) => matchesQuery(entry)),
    [matchesQuery, workspace.principles.boundaries],
  )

  const relationshipCircles = useMemo(
    () =>
      workspace.relationships.circles.map((circle) => ({
        ...circle,
        entries: circle.entries.filter((entry) =>
          matchesQuery(
            circle.title,
            circle.summary,
            entry.name,
            entry.role,
            entry.influence,
            entry.currentState,
          ),
        ),
      })),
    [matchesQuery, workspace.relationships.circles],
  )

  const relationshipPatterns = useMemo(
    () =>
      workspace.relationships.patterns.filter((entry) => matchesQuery(entry)),
    [matchesQuery, workspace.relationships.patterns],
  )

  const growthStages = useMemo(
    () =>
      workspace.growth.stages.filter((entry) =>
        matchesQuery(
          entry.stage,
          entry.title,
          entry.environment,
          entry.impact,
          ...entry.traces,
        ),
      ),
    [matchesQuery, workspace.growth.stages],
  )

  const growthThreads = useMemo(
    () => workspace.growth.threads.filter((entry) => matchesQuery(entry)),
    [matchesQuery, workspace.growth.threads],
  )

  const milestones = useMemo(
    () =>
      workspace.future.milestones.filter((entry) =>
        matchesQuery(entry.horizon, entry.summary, ...entry.steps),
      ),
    [matchesQuery, workspace.future.milestones],
  )

  const visibleShoppingCount = shoppingColumns.reduce(
    (count, column) => count + column.items.length,
    0,
  )

  const visibleRelationshipCount = relationshipCircles.reduce(
    (count, circle) => count + circle.entries.length,
    0,
  )

  const visibleGrowthTraceCount = growthStages.reduce(
    (count, entry) => count + entry.traces.length,
    0,
  )

  const visibleExpenseTotal = transactions
    .filter((entry) => entry.direction === "expense")
    .reduce((sum, entry) => sum + entry.amount, 0)

  const visibleIncomeTotal = transactions
    .filter((entry) => entry.direction === "income")
    .reduce((sum, entry) => sum + entry.amount, 0)

  return {
    beliefCards,
    beliefQuestions,
    dailyPulse: workspace.overview.dailyPulse,
    events,
    futureBlueprint: workspace.future,
    greeting: workspace.overview.greeting,
    growthStages,
    growthThreads,
    milestones,
    principleBoundaries,
    principles,
    recentRecords,
    reflectionDraftExample: workspace.reflection.draftExample,
    reflections,
    relationshipCircles,
    relationshipPatterns,
    shoppingColumns,
    transactions,
    visibleExpenseTotal,
    visibleGrowthTraceCount,
    visibleIncomeTotal,
    visibleRelationshipCount,
    visibleShoppingCount,
    workspace,
  }
}
