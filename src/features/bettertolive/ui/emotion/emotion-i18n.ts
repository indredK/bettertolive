import type { TFunction } from "i18next"

export function translateEmotionEnum(t: TFunction, group: string, value: string | undefined) {
  if (!value) return ""

  return t(`emotion.enum.${group}.${value}`, value)
}
