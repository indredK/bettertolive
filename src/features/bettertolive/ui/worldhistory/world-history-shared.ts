import { useTranslation } from "react-i18next"
import type {
  CausalNodeKind,
  GeopoliticalDimension,
} from "@/features/bettertolive/models/workspace"

// 节点分类的中文标签 / 单字徽记 / 主题色变量 / 链路顺序，集中维护，供各面板共享。

export const NODE_KIND_LABELS: Record<CausalNodeKind, string> = {
  catalyst: "地缘催化",
  nutrition: "食物营养",
  customs: "风民人伦",
  conflict: "冲突战役",
  prohibition: "生死禁避",
  faith: "信仰法度",
}

export const NODE_KIND_GLYPHS: Record<CausalNodeKind, string> = {
  catalyst: "催",
  nutrition: "养",
  customs: "伦",
  conflict: "战",
  prohibition: "禁",
  faith: "信",
}

// 主题色变量（在 theme-presets.ts 中定义，随主题自动适配）
export const NODE_KIND_COLOR_VARS: Record<CausalNodeKind, string> = {
  catalyst: "var(--wh-kind-catalyst)",
  nutrition: "var(--wh-kind-nutrition)",
  customs: "var(--wh-kind-customs)",
  conflict: "var(--wh-kind-conflict)",
  prohibition: "var(--wh-kind-prohibition)",
  faith: "var(--wh-kind-faith)",
}

// 因果链推进顺序：地缘催化 → 营养 → 人伦 → 冲突 → 禁避 → 信仰
export const NODE_KIND_ORDER: CausalNodeKind[] = [
  "catalyst",
  "nutrition",
  "customs",
  "conflict",
  "prohibition",
  "faith",
]

// 对质维度的中文标签与顺序
export const DIMENSION_LABELS: Record<GeopoliticalDimension, string> = {
  calories: "主食卡路里",
  defense: "防灾隔离",
  trust: "互信契约",
  authority: "强权管制",
  taboos: "禁忌规训",
  abstract: "玄思抽象",
}

export const DIMENSION_ORDER: GeopoliticalDimension[] = [
  "calories",
  "defense",
  "trust",
  "authority",
  "taboos",
  "abstract",
]

// 跨面板联动：节点分类 ↔ 对质维度的一一映射。
// 星图选中某类节点时，对质场雷达图高亮其对应的地缘维度轴。
export const KIND_TO_DIMENSION: Record<CausalNodeKind, GeopoliticalDimension> = {
  catalyst: "defense",
  nutrition: "calories",
  customs: "trust",
  conflict: "authority",
  prohibition: "taboos",
  faith: "abstract",
}

export function useWorldHistoryLabels() {
  const { t } = useTranslation()

  const nodeKindLabels: Record<CausalNodeKind, string> = {
    catalyst: t("worldhistory.nodeKind.catalyst", NODE_KIND_LABELS.catalyst),
    nutrition: t("worldhistory.nodeKind.nutrition", NODE_KIND_LABELS.nutrition),
    customs: t("worldhistory.nodeKind.customs", NODE_KIND_LABELS.customs),
    conflict: t("worldhistory.nodeKind.conflict", NODE_KIND_LABELS.conflict),
    prohibition: t("worldhistory.nodeKind.prohibition", NODE_KIND_LABELS.prohibition),
    faith: t("worldhistory.nodeKind.faith", NODE_KIND_LABELS.faith),
  }

  const nodeGlyphs: Record<CausalNodeKind, string> = {
    catalyst: t("worldhistory.nodeGlyph.catalyst", NODE_KIND_GLYPHS.catalyst),
    nutrition: t("worldhistory.nodeGlyph.nutrition", NODE_KIND_GLYPHS.nutrition),
    customs: t("worldhistory.nodeGlyph.customs", NODE_KIND_GLYPHS.customs),
    conflict: t("worldhistory.nodeGlyph.conflict", NODE_KIND_GLYPHS.conflict),
    prohibition: t("worldhistory.nodeGlyph.prohibition", NODE_KIND_GLYPHS.prohibition),
    faith: t("worldhistory.nodeGlyph.faith", NODE_KIND_GLYPHS.faith),
  }

  const dimensionLabels: Record<GeopoliticalDimension, string> = {
    calories: t("worldhistory.dimension.calories", DIMENSION_LABELS.calories),
    defense: t("worldhistory.dimension.defense", DIMENSION_LABELS.defense),
    trust: t("worldhistory.dimension.trust", DIMENSION_LABELS.trust),
    authority: t("worldhistory.dimension.authority", DIMENSION_LABELS.authority),
    taboos: t("worldhistory.dimension.taboos", DIMENSION_LABELS.taboos),
    abstract: t("worldhistory.dimension.abstract", DIMENSION_LABELS.abstract),
  }

  return { nodeKindLabels, nodeGlyphs, dimensionLabels }
}
