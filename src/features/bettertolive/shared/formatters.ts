export function resolveIntlLocale(locale?: string) {
  return locale?.toLowerCase().startsWith("en") ? "en-US" : "zh-CN"
}

export function formatCurrency(amount: number, locale?: string) {
  return new Intl.NumberFormat(resolveIntlLocale(locale), {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatWorkspaceDate(date: Date, locale?: string) {
  return new Intl.DateTimeFormat(resolveIntlLocale(locale), {
    month: "long",
    day: "numeric",
    weekday: "long",
  }).format(date)
}
