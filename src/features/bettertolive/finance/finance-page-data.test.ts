import type { TFunction } from "i18next"

import {
  FINANCE_CATEGORIES,
  getFinanceEnumSearchTokens,
} from "@/features/bettertolive/finance/finance-page-data"

function createTranslator(): TFunction {
  const translations: Record<string, string> = {
    "finance.enum.category.food": "Food",
    "finance.enumSearch.en.category.food": "Food",
    "finance.enumSearch.zh.category.food": "餐饮",
  }

  return ((key: string, options?: { defaultValue?: string }) =>
    translations[key] ?? options?.defaultValue ?? key) as unknown as TFunction
}

describe("finance-page-data", () => {
  it("uses stable finance codes instead of localized labels", () => {
    expect(FINANCE_CATEGORIES).toContain("food")
    expect(FINANCE_CATEGORIES).not.toContain("餐饮")
  })

  it("builds multilingual finance search tokens from code values", () => {
    const tokens = getFinanceEnumSearchTokens(createTranslator(), "category", "food")

    expect(tokens).toEqual(expect.arrayContaining(["Food", "餐饮"]))
    expect(tokens).not.toContain("food")
  })
})
