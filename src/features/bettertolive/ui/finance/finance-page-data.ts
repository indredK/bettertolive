import dayjs from "dayjs"

import type {
  FinanceCategory,
  FinanceLifeSystem,
  FinanceLinkedModule,
  FinanceNecessity,
  FinanceReviewStatus,
  TransactionDirection,
} from "@/features/bettertolive/types"
import type { TFunction } from "i18next"

export const FINANCE_CATEGORIES = [
  "food",
  "housing",
  "transport",
  "shopping",
  "learning",
  "health",
  "social",
  "entertainment",
  "income",
  "savings",
  "other",
] as const satisfies readonly FinanceCategory[]

export const FINANCE_LIFE_SYSTEMS = [
  "basic_life",
  "health",
  "relationships",
  "growth",
  "housing",
  "safety",
  "recovery",
] as const satisfies readonly FinanceLifeSystem[]

export const FINANCE_NECESSITIES = [
  "essential",
  "maintenance",
  "upgrade",
  "long_term_investment",
  "impulse_review",
] as const satisfies readonly FinanceNecessity[]

export const FINANCE_REVIEW_STATUSES = [
  "confirmed",
  "needs_review",
  "can_optimize",
  "worth_keeping",
] as const satisfies readonly FinanceReviewStatus[]

export const FINANCE_LINKED_MODULES = [
  "manual",
  "shopping",
  "nutrition",
  "events",
  "reflection",
  "future",
] as const satisfies readonly FinanceLinkedModule[]

export const FINANCE_DIRECTIONS = [
  "expense",
  "income",
] as const satisfies readonly TransactionDirection[]

const FINANCE_ENUM_GROUPS = {
  category: FINANCE_CATEGORIES,
  lifeSystem: FINANCE_LIFE_SYSTEMS,
  necessity: FINANCE_NECESSITIES,
  reviewStatus: FINANCE_REVIEW_STATUSES,
  linkedModule: FINANCE_LINKED_MODULES,
} as const

export function getFinanceEnumSearchTokens<K extends keyof typeof FINANCE_ENUM_GROUPS>(
  t: TFunction,
  group: K,
  value: (typeof FINANCE_ENUM_GROUPS)[K][number] | undefined,
) {
  if (!value) {
    return []
  }

  const resolved = t(`finance.enum.${group}.${value}`)
  const english = t(`finance.enumSearch.en.${group}.${value}`, { defaultValue: "" })
  const chinese = t(`finance.enumSearch.zh.${group}.${value}`, { defaultValue: "" })
  const isKnownValue = FINANCE_ENUM_GROUPS[group].some((candidate) => candidate === value)

  if (!isKnownValue) {
    return [value]
  }

  return [value, resolved, english, chinese].filter((token) => token && token !== value)
}

export function getEntryMonth(date: string) {
  return dayjs(date).format("YYYY-MM")
}

export function getLatestMonth(entries: Array<{ date: string }>) {
  const months = entries
    .map((entry) => getEntryMonth(entry.date))
    .filter(Boolean)
    .sort()

  return months[months.length - 1]
}
