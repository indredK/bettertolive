/**
 * Split text by delimiters (commas, newlines), trim, and filter empty strings.
 * Default separator matches Chinese/English commas and newlines.
 */
export function splitListText(text: string, separators: RegExp = /[,，\n]/): string[] {
  return text
    .split(separators)
    .map((item) => item.trim())
    .filter(Boolean)
}

/**
 * Join a string array with a separator. Default uses Chinese comma.
 * Returns empty string for undefined/null input.
 */
export function joinListText(items: string[] | undefined, separator = "，"): string {
  return (items ?? []).join(separator)
}

/**
 * Deduplicate and clean a list of strings: trim each, remove empties, keep unique values.
 */
export function uniqueList(values: string[]): string[] {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)))
}
