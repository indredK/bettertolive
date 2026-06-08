import type { TFunction } from "i18next"

export function translateSocioeconomicsEnum(t: TFunction, group: string, value: string) {
  return t(`socioeconomics.enum.${group}.${value}`, value)
}
