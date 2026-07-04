import { useState, useMemo } from "react"
import { m, AnimatePresence } from "motion/react"
import { Plus, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { EmptyState } from "@/features/bettertolive/shared/shared"
import { confirmUndoableDelete } from "@/features/bettertolive/shared/shopping-delete"
import type {
  CivilizationId,
  CivilizationProfile,
  ComparisonPreset,
  GeopoliticalDimension,
} from "@/features/bettertolive/models/workspace"
import { DIMENSION_ORDER, useWorldHistoryLabels } from "./world-history-shared"

interface CognitiveArenaProps {
  civilizations: CivilizationProfile[]
  activeCivilizationId: CivilizationId
  comparisonPresets: ComparisonPreset[]
  highlightedDimension?: GeopoliticalDimension | null
  isEditing?: boolean
  onAddPreset?: (civA: CivilizationId, civB: CivilizationId) => void
  onUpdatePreset?: (
    id: string,
    patch: Partial<Pick<ComparisonPreset, "title" | "thesis" | "analysis" | "conclusion">>,
  ) => void
  onDeletePreset?: (id: string) => void
}

function radarCoords(
  values: Record<GeopoliticalDimension, number>,
  cx: number,
  cy: number,
  radius: number,
): { x: number; y: number }[] {
  return DIMENSION_ORDER.map((dim, i) => {
    const angle = (Math.PI * 2 * i) / DIMENSION_ORDER.length - Math.PI / 2
    const r = (radius * values[dim]) / 100
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) }
  })
}

function radarPolygon(coords: { x: number; y: number }[]): string {
  return coords.map((p) => `${p.x},${p.y}`).join(" ")
}

const SPIDER_POINTS: { x: number; y: number }[] = DIMENSION_ORDER.map((_, i) => {
  const angle = (Math.PI * 2 * i) / DIMENSION_ORDER.length - Math.PI / 2
  return { x: Math.cos(angle), y: Math.sin(angle) }
})

export function CognitiveArena({
  civilizations,
  activeCivilizationId,
  comparisonPresets,
  highlightedDimension = null,
  isEditing = false,
  onAddPreset,
  onUpdatePreset,
  onDeletePreset,
}: CognitiveArenaProps) {
  const { t } = useTranslation()
  const { dimensionLabels } = useWorldHistoryLabels()
  const civA = civilizations.find((c) => c.id === activeCivilizationId)
  const availableCivB = civilizations.filter((c) => c.id !== activeCivilizationId)
  const [selectedCivB, setSelectedCivB] = useState<CivilizationId>(
    availableCivB[0]?.id ?? activeCivilizationId,
  )
  const [selectedPresetId, setSelectedPresetId] = useState<string>("")

  // 如果 selectedCivB 不在可用列表中，自动切到第一个可用文明
  const effectiveCivBId = availableCivB.some((c) => c.id === selectedCivB)
    ? selectedCivB
    : (availableCivB[0]?.id ?? activeCivilizationId)
  if (effectiveCivBId !== selectedCivB) {
    setSelectedCivB(effectiveCivBId)
    setSelectedPresetId("")
  }

  const civB = civilizations.find((c) => c.id === selectedCivB)

  const presets = useMemo(
    () =>
      comparisonPresets.filter(
        (p) =>
          (p.civA === activeCivilizationId && p.civB === selectedCivB) ||
          (p.civA === selectedCivB && p.civB === activeCivilizationId),
      ),
    [comparisonPresets, activeCivilizationId, selectedCivB],
  )

  const activePreset =
    presets.find((p) => p.id === selectedPresetId) ?? (presets.length > 0 ? presets[0] : undefined)

  if (!civA || !civB) {
    return (
      <div className="flex h-full items-center justify-center font-sans text-xs text-[color:var(--text-muted)]">
        {t("worldhistory.arena.needsTwo")}
      </div>
    )
  }

  const cx = 120
  const cy = 120
  const radius = 100
  const coordsA = radarCoords(civA.indices, cx, cy, radius)
  const coordsB = radarCoords(civB.indices, cx, cy, radius)

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-2">
        <h3 className="font-serif text-base font-semibold tracking-wide text-[color:var(--text-primary)]">
          {t("worldhistory.arena.title")}
        </h3>
        <select
          value={selectedCivB}
          onChange={(e) => {
            setSelectedCivB(e.target.value as CivilizationId)
            setSelectedPresetId("")
          }}
          className="rounded-md border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-2 py-1 font-mono text-xs text-[color:var(--text-secondary)]"
        >
          {availableCivB.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-auto rounded-xl border border-[color:var(--surface-border)] bg-[color:var(--muted-surface-bg)] p-4">
        {/* 双雷达图 */}
        <div className="mx-auto flex justify-center">
          <div className="relative">
            <div className="mb-2 flex items-center justify-center gap-6 text-center">
              <span className="font-serif text-xs font-semibold" style={{ color: civA.color }}>
                {civA.icon} {civA.name}
              </span>
              <span className="font-mono text-[10px] text-[color:var(--text-muted)]">vs</span>
              <span className="font-serif text-xs font-semibold" style={{ color: civB.color }}>
                {civB.icon} {civB.name}
              </span>
            </div>
            <svg width={260} height={260} viewBox="0 0 240 240">
              {[0.2, 0.4, 0.6, 0.8, 1.0].map((level) => {
                const pts = DIMENSION_ORDER.map((_, i) => {
                  const angle = (Math.PI * 2 * i) / DIMENSION_ORDER.length - Math.PI / 2
                  return {
                    x: cx + radius * level * Math.cos(angle),
                    y: cy + radius * level * Math.sin(angle),
                  }
                })
                return (
                  <polygon
                    key={level}
                    points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
                    fill="none"
                    stroke="var(--surface-border)"
                    strokeWidth={0.5}
                  />
                )
              })}
              {SPIDER_POINTS.map((p) => (
                <line
                  key={[p.x, p.y].toString()}
                  x1={cx}
                  y1={cy}
                  x2={cx + radius * p.x}
                  y2={cy + radius * p.y}
                  stroke="var(--surface-border)"
                  strokeWidth={0.5}
                />
              ))}
              <polygon
                points={radarPolygon(coordsA)}
                fill={civA.color}
                fillOpacity={0.15}
                stroke={civA.color}
                strokeWidth={2}
              />
              {coordsA.map((p, i) => (
                <circle key={`a-${i}`} cx={p.x} cy={p.y} r={3} fill={civA.color} />
              ))}
              <polygon
                points={radarPolygon(coordsB)}
                fill={civB.color}
                fillOpacity={0.15}
                stroke={civB.color}
                strokeWidth={2}
                strokeDasharray="4 2"
              />
              {coordsB.map((p, i) => (
                <circle key={`b-${i}`} cx={p.x} cy={p.y} r={3} fill={civB.color} />
              ))}
              {/* 维度标签：联动高亮 */}
              {DIMENSION_ORDER.map((dim, i) => {
                const angle = (Math.PI * 2 * i) / DIMENSION_ORDER.length - Math.PI / 2
                const labelR = radius + 16
                const lx = cx + labelR * Math.cos(angle)
                const ly = cy + labelR * Math.sin(angle) + 4
                const isHi = highlightedDimension === dim
                return (
                  <text
                    key={dim}
                    x={lx}
                    y={ly}
                    textAnchor="middle"
                    className="font-mono"
                    style={{
                      fontSize: isHi ? "8px" : "7px",
                      fontWeight: isHi ? 700 : 400,
                      fill: isHi ? "var(--primary)" : "var(--text-secondary)",
                    }}
                  >
                    {dimensionLabels[dim]}
                  </text>
                )
              })}
            </svg>
          </div>
        </div>

        {/* 指数对照表：联动高亮当前维度行 */}
        <div className="overflow-x-auto">
          <table className="w-full font-mono text-[10px]">
            <thead>
              <tr className="border-b border-[color:var(--surface-border)]">
                <th className="py-1 pr-2 text-left text-[color:var(--text-muted)]">
                  {t("worldhistory.arena.dimension")}
                </th>
                <th className="px-2 py-1 text-center" style={{ color: civA.color }}>
                  {civA.icon} {civA.name}
                </th>
                <th className="px-2 py-1 text-center" style={{ color: civB.color }}>
                  {civB.icon} {civB.name}
                </th>
                <th className="py-1 pl-2 text-center text-[color:var(--text-muted)]">
                  {t("worldhistory.arena.diff")}
                </th>
              </tr>
            </thead>
            <tbody>
              {DIMENSION_ORDER.map((dim) => {
                const diff = civA.indices[dim] - civB.indices[dim]
                const isHi = highlightedDimension === dim
                return (
                  <tr
                    key={dim}
                    className="border-b border-[color:var(--surface-border)]"
                    style={
                      isHi
                        ? { backgroundColor: "color-mix(in srgb, var(--primary) 12%, transparent)" }
                        : undefined
                    }
                  >
                    <td className="py-1.5 pr-2 text-[color:var(--text-secondary)]">
                      {dimensionLabels[dim]}
                    </td>
                    <td className="px-2 py-1.5 text-center">{civA.indices[dim]}</td>
                    <td className="px-2 py-1.5 text-center">{civB.indices[dim]}</td>
                    <td
                      className="py-1.5 pl-2 text-center font-semibold"
                      style={{
                        color: diff > 0 ? civA.color : diff < 0 ? civB.color : "var(--text-muted)",
                      }}
                    >
                      {diff > 0 ? `+${diff}` : diff}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* 经典判词 */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="font-serif text-xs font-semibold text-[color:var(--text-secondary)]">
              {t("worldhistory.arena.classicVerdicts")}
            </h4>
            {isEditing && onAddPreset && (
              <Button size="sm" onClick={() => onAddPreset(activeCivilizationId, selectedCivB)}>
                <Plus className="size-3" />
                {t("worldhistory.arena.addPreset")}
              </Button>
            )}
          </div>

          {presets.length === 0 ? (
            <EmptyState
              message={`${t("worldhistory.preset.noPresets")}${isEditing ? t("worldhistory.preset.noPresetsHint") : ""}`}
              compact
            />
          ) : isEditing && onUpdatePreset && onDeletePreset ? (
            <div className="space-y-3">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  className="space-y-1.5 rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] p-3"
                >
                  <div className="flex items-center gap-2">
                    <Input
                      value={preset.title}
                      onChange={(e) => onUpdatePreset(preset.id, { title: e.target.value })}
                      placeholder={t("worldhistory.preset.titlePlaceholder")}
                      className="flex-1 font-serif text-xs font-semibold"
                    />
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        confirmUndoableDelete({
                          confirmMessage: t("worldhistory.preset.deleteAria"),
                          pendingMessage: t("common.toast.deletePending"),
                          successMessage: t("worldhistory.preset.deleteSuccess"),
                          failureMessage: t("worldhistory.preset.deleteFailed"),
                          undoLabel: t("common.actions.undo"),
                          undoneMessage: t("common.toast.deleteUndone"),
                          onDelete: () => Promise.resolve(onDeletePreset(preset.id)),
                        })
                      }}
                      className="shrink-0 text-[color:var(--text-muted)] hover:text-[color:var(--destructive)]"
                      aria-label={t("worldhistory.preset.deleteAria")}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                  <Textarea
                    value={preset.thesis}
                    onChange={(e) => onUpdatePreset(preset.id, { thesis: e.target.value })}
                    placeholder={t("worldhistory.preset.thesisPlaceholder")}
                    rows={2}
                    className="font-sans text-[11px]"
                  />
                  <Textarea
                    value={preset.analysis}
                    onChange={(e) => onUpdatePreset(preset.id, { analysis: e.target.value })}
                    placeholder={t("worldhistory.preset.analysisPlaceholder")}
                    rows={4}
                    className="font-sans text-[11px]"
                  />
                  <Textarea
                    value={preset.conclusion}
                    onChange={(e) => onUpdatePreset(preset.id, { conclusion: e.target.value })}
                    placeholder={t("worldhistory.preset.conclusionPlaceholder")}
                    rows={2}
                    className="font-sans text-[11px]"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedPresetId(preset.id)}
                  className={`w-full rounded-lg border p-3 text-left transition-all ${
                    activePreset?.id === preset.id
                      ? "border-[color:var(--primary)] bg-[color:var(--chip-bg)]"
                      : "border-[color:var(--surface-border)] hover:border-[color:var(--chip-border)]"
                  }`}
                >
                  <div className="font-serif text-xs font-semibold text-[color:var(--text-primary)]">
                    {preset.title}
                  </div>
                  <div className="mt-1 font-sans text-[11px] leading-relaxed text-[color:var(--text-secondary)]">
                    {preset.thesis}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 判词详情（非编辑态） */}
        <AnimatePresence>
          {!isEditing && activePreset && (
            <m.div
              key={`preset-${activePreset.id}`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--chip-bg)] p-4">
                <h4 className="mb-3 font-serif text-sm font-semibold text-[color:var(--primary)]">
                  ⚖️ {activePreset.title}
                </h4>
                <div className="space-y-3 font-sans text-xs leading-relaxed text-[color:var(--text-secondary)]">
                  <div>
                    <span className="font-semibold text-[color:var(--text-muted)]">
                      {t("worldhistory.preset.thesisPlaceholder")}：
                    </span>
                    {activePreset.thesis}
                  </div>
                  <div>
                    <span className="font-semibold text-[color:var(--text-muted)]">
                      {t("worldhistory.preset.analysisPlaceholder")}：
                    </span>
                    {activePreset.analysis}
                  </div>
                  <div className="border-t border-[color:var(--surface-border)] pt-3">
                    <span className="font-semibold text-[color:var(--primary)]">
                      {t("worldhistory.preset.conclusionPlaceholder")}：
                    </span>
                    {activePreset.conclusion}
                  </div>
                </div>
              </div>
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
