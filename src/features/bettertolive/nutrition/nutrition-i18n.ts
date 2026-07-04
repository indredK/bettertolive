import type { TFunction } from "i18next"

export function translateNutritionEnum(t: TFunction, group: string, value: string) {
  return t(`nutrition.enum.${group}.${value}`)
}
