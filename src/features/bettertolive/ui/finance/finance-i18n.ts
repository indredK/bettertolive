import type { TFunction } from "i18next"

export function translateFinanceEnum(t: TFunction, group: string, value: string | undefined) {
  if (!value) return ""

  return t(`finance.enum.${group}.${value}`, value)
}
