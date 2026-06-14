import dayjs from "dayjs"

import type {
  FinanceLifeSystem,
  FinanceLinkedModule,
  FinanceNecessity,
  FinanceReviewStatus,
  TransactionDirection,
} from "@/features/bettertolive/types"
import { generateId } from "@/lib/id-utils"
import { joinListText, splitListText } from "@/lib/list-utils"

export const FINANCE_CATEGORIES = [
  "餐饮",
  "居住",
  "交通",
  "购物",
  "学习成长",
  "健康",
  "社交",
  "娱乐",
  "收入",
  "储蓄",
  "其他",
] as const

export const FINANCE_LIFE_SYSTEMS = [
  "基本生活",
  "身体健康",
  "关系社交",
  "成长学习",
  "居住环境",
  "自由安全",
  "娱乐恢复",
] satisfies FinanceLifeSystem[]

export const FINANCE_NECESSITIES = [
  "生存必需",
  "稳定维护",
  "体验改善",
  "长期投资",
  "冲动/待复盘",
] satisfies FinanceNecessity[]

export const FINANCE_REVIEW_STATUSES = [
  "已确认",
  "待复盘",
  "可优化",
  "值得保留",
] satisfies FinanceReviewStatus[]

export const FINANCE_LINKED_MODULES = [
  "手动录入",
  "购物",
  "饮食",
  "记事",
  "反思",
  "未来",
] satisfies FinanceLinkedModule[]

export const FINANCE_DIRECTIONS = ["expense", "income"] satisfies TransactionDirection[]

export const createFinanceId = (prefix = "finance-entry") => generateId(prefix)

export const joinFinanceListText = (values?: string[]) => joinListText(values, "\n")

export const splitFinanceListText = (text: string) => splitListText(text, /\n|,|，/)

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
