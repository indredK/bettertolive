import { useMemo, useState } from "react"
import { m, AnimatePresence } from "motion/react"
import { useTranslation } from "react-i18next"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type {
  CausalLink,
  CausalNode,
  CivilizationProfile,
} from "@/features/bettertolive/models/workspace"
import {
  NODE_KIND_COLOR_VARS,
  NODE_KIND_ORDER,
  useWorldHistoryLabels,
} from "./world-history-shared"

interface StarMapCanvasProps {
  civilization: CivilizationProfile | undefined
  nodes: CausalNode[]
  links: CausalLink[]
  selectedNodeId: string | null
  onSelectNode: (nodeId: string) => void
  isEditing?: boolean
  onUpdateNode?: (
    nodeId: string,
    patch: Partial<Pick<CausalNode, "label" | "description" | "causalExplanation">>,
  ) => void
}

// 贝塞尔曲线：坐标统一为 0-100 百分比坐标系（与节点定位一致）
function bezierPath(x1: number, y1: number, x2: number, y2: number, offset = 6): string {
  const midX = (x1 + x2) / 2
  return `M ${x1} ${y1} Q ${midX} ${y1 - offset} ${x2} ${y2}`
}

function getRelatedLinkIds(nodeId: string, links: CausalLink[]): Set<string> {
  const related = new Set<string>()
  for (const link of links) {
    if (link.sourceId === nodeId || link.targetId === nodeId) {
      related.add(link.id)
    }
  }
  return related
}

export function StarMapCanvas({
  civilization,
  nodes,
  links,
  selectedNodeId,
  onSelectNode,
  isEditing = false,
  onUpdateNode,
}: StarMapCanvasProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const { t } = useTranslation()
  const { nodeKindLabels, nodeGlyphs } = useWorldHistoryLabels()

  const activeRelatedLinks = useMemo(() => {
    const displayId = hoveredNodeId ?? selectedNodeId
    if (!displayId) return new Set<string>()
    return getRelatedLinkIds(displayId, links)
  }, [hoveredNodeId, selectedNodeId, links])

  const tooltipNode = nodes.find((n) => n.id === selectedNodeId) ?? null

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <h3 className="font-serif text-base font-semibold tracking-wide text-[color:var(--text-primary)]">
          {civilization?.icon} {civilization?.name} {t("worldhistory.star.suffix")}
        </h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {NODE_KIND_ORDER.map((kind) => (
            <span
              key={kind}
              className="flex items-center gap-1 font-mono text-[9px] tracking-wide uppercase"
            >
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: NODE_KIND_COLOR_VARS[kind] }}
              />
              <span style={{ color: NODE_KIND_COLOR_VARS[kind] }}>{nodeKindLabels[kind]}</span>
            </span>
          ))}
        </div>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl bg-[color:var(--muted-surface-bg)]">
        {/* SVG 连线：viewBox 0-100 + preserveAspectRatio none，与节点百分比定位严格对齐 */}
        <svg
          className="pointer-events-none absolute inset-0 size-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          style={{ zIndex: 1 }}
        >
          {links.map((link) => {
            const source = nodes.find((n) => n.id === link.sourceId)
            const target = nodes.find((n) => n.id === link.targetId)
            if (!source || !target) return null
            const isActive = activeRelatedLinks.has(link.id)
            return (
              <path
                key={link.id}
                d={bezierPath(source.x, source.y, target.x, target.y, 6)}
                fill="none"
                stroke={isActive ? "var(--wh-link-active)" : "var(--surface-border)"}
                strokeWidth={isActive ? 0.5 : 0.25}
                strokeOpacity={isActive ? 1 : 0.6}
                vectorEffect="non-scaling-stroke"
                style={{ transition: "stroke 0.3s, stroke-opacity 0.3s" }}
              />
            )
          })}
        </svg>

        {/* 节点 */}
        {nodes.map((node) => {
          const isActive = selectedNodeId === node.id
          const isHovered = hoveredNodeId === node.id
          const isHighlighted = isActive || isHovered
          const kindColor = NODE_KIND_COLOR_VARS[node.kind]

          return (
            <m.button
              key={node.id}
              type="button"
              className="absolute z-[3] flex -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center select-none"
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
              animate={{ scale: isHighlighted ? 1.08 : 1 }}
              transition={{ duration: 0.2 }}
              onClick={() => onSelectNode(node.id)}
              onPointerEnter={() => setHoveredNodeId(node.id)}
              onPointerLeave={() => setHoveredNodeId(null)}
            >
              <div
                className="flex size-10 items-center justify-center rounded-full ring-2 ring-[color:var(--surface-bg)] transition-shadow"
                style={{
                  backgroundColor: kindColor,
                  boxShadow: isHighlighted
                    ? `0 0 0 3px color-mix(in srgb, ${kindColor} 30%, transparent), 0 4px 12px rgba(0,0,0,0.15)`
                    : "0 2px 8px rgba(0,0,0,0.08)",
                }}
              >
                <span className="font-mono text-xs font-bold text-white">
                  {nodeGlyphs[node.kind]}
                </span>
              </div>
              <span
                className="mt-1 max-w-[72px] text-center font-serif text-[11px] leading-tight"
                style={{ color: isHighlighted ? kindColor : "var(--text-muted)" }}
              >
                {node.label.length > 8 ? `${node.label.slice(0, 8)}…` : node.label}
              </span>
            </m.button>
          )
        })}

        {/* 选中节点详情：固定在面板底部，不随节点位置溢出；编辑态切换为内联表单 */}
        <AnimatePresence>
          {tooltipNode && (
            <m.div
              key={`tip-${tooltipNode.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute inset-x-3 bottom-3 z-[4] max-h-[70%] overflow-auto rounded-lg border border-[color:var(--surface-border)] p-4 shadow-xl"
              style={{ backgroundColor: "var(--hero-bg)", color: "var(--hero-ink)" }}
            >
              <div className="flex items-start justify-between gap-2">
                <div
                  className="font-serif text-sm font-semibold"
                  style={{ color: NODE_KIND_COLOR_VARS[tooltipNode.kind] }}
                >
                  {nodeKindLabels[tooltipNode.kind]} · {tooltipNode.label}
                </div>
                <button
                  type="button"
                  className="shrink-0 font-mono text-[10px] text-[color:var(--hero-muted)] hover:text-[color:var(--hero-ink)]"
                  onClick={() => onSelectNode(tooltipNode.id)}
                >
                  {t("common.ui.collapse")}
                </button>
              </div>

              {isEditing && onUpdateNode ? (
                <div className="mt-2 space-y-2">
                  <Input
                    value={tooltipNode.label}
                    onChange={(e) => onUpdateNode(tooltipNode.id, { label: e.target.value })}
                    placeholder={t("worldhistory.star.nodeNamePlaceholder")}
                    className="font-serif text-xs"
                  />
                  <Textarea
                    value={tooltipNode.description}
                    onChange={(e) => onUpdateNode(tooltipNode.id, { description: e.target.value })}
                    placeholder={t("worldhistory.star.descriptionPlaceholder")}
                    rows={2}
                    className="font-sans text-[11px]"
                  />
                  <Textarea
                    value={tooltipNode.causalExplanation}
                    onChange={(e) =>
                      onUpdateNode(tooltipNode.id, { causalExplanation: e.target.value })
                    }
                    placeholder={t("worldhistory.star.causalPlaceholder")}
                    rows={3}
                    className="font-sans text-[11px]"
                  />
                </div>
              ) : (
                <>
                  <div
                    className="mt-1.5 font-sans text-[11px] leading-relaxed"
                    style={{ color: "var(--hero-muted)" }}
                  >
                    {tooltipNode.description}
                  </div>
                  <div
                    className="mt-2 border-t pt-2 font-sans text-[11px] leading-relaxed"
                    style={{
                      color: "var(--hero-muted)",
                      borderColor: "color-mix(in srgb, var(--hero-ink) 18%, transparent)",
                    }}
                  >
                    <span className="font-semibold" style={{ color: "var(--hero-ink)" }}>
                      {t("worldhistory.star.causalLabel")}
                    </span>
                    {tooltipNode.causalExplanation}
                  </div>
                </>
              )}
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
