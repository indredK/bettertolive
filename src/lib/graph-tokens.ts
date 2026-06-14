/**
 * Read graph visualization tokens from CSS custom properties at runtime.
 * These tokens power cytoscape, force-graph-3d, and relationship graph palettes.
 *
 * Returns the trimmed value, falling back to the provided default when the
 * CSS variable is empty or unavailable (e.g. during SSR).
 */
function readToken(name: string, fallback: string): string {
  if (typeof document === "undefined") return fallback
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return raw || fallback
}

export const GRAPH_PALETTE_KEYS = ["blue", "green", "red", "amber", "purple", "teal"] as const
export type GraphPaletteKey = (typeof GRAPH_PALETTE_KEYS)[number]

export interface GraphPaletteColor {
  bg: string
  border: string
  ink: string
}

export interface GraphImpactMark {
  bg: string
  border: string
}

export interface GraphWeightMark {
  bg: string
  border: string
}

const GRAPH_PALETTE_FALLBACK: Record<GraphPaletteKey, GraphPaletteColor> = {
  blue: { bg: "rgba(219, 234, 254, 0.82)", border: "#60a5fa", ink: "#1e3a8a" },
  green: { bg: "rgba(220, 252, 231, 0.82)", border: "#22c55e", ink: "#14532d" },
  red: { bg: "rgba(255, 228, 230, 0.82)", border: "#fb7185", ink: "#881337" },
  amber: { bg: "rgba(254, 249, 195, 0.86)", border: "#f59e0b", ink: "#78350f" },
  purple: { bg: "rgba(237, 233, 254, 0.84)", border: "#8b5cf6", ink: "#4c1d95" },
  teal: { bg: "rgba(204, 251, 241, 0.82)", border: "#14b8a6", ink: "#134e4a" },
}

/**
 * Read a single palette color from CSS variables.
 */
export function readGraphPaletteColor(key: GraphPaletteKey): GraphPaletteColor {
  const fallback = GRAPH_PALETTE_FALLBACK[key]
  return {
    bg: readToken(`--graph-palette-${key}-bg`, fallback.bg),
    border: readToken(`--graph-palette-${key}-border`, fallback.border),
    ink: readToken(`--graph-palette-${key}-ink`, fallback.ink),
  }
}

/**
 * Read all 6 palette colors at once.
 */
export function readGraphPalette(): GraphPaletteColor[] {
  return GRAPH_PALETTE_KEYS.map((key) => readGraphPaletteColor(key))
}

const GRAPH_IMPACT_FALLBACK = {
  nourishing: { bg: "rgba(34, 197, 94, 0.82)", border: "#22c55e" },
  draining: { bg: "rgba(245, 158, 11, 0.84)", border: "#f59e0b" },
  mixed: { bg: "rgba(251, 113, 133, 0.84)", border: "#fb7185" },
  neutral: { bg: "rgba(226, 232, 240, 0.9)", border: "#94a3b8" },
} as const

export function readGraphImpactMarks(): GraphImpactMark[] {
  return Object.entries(GRAPH_IMPACT_FALLBACK).map(([key, fallback]) => ({
    bg: readToken(`--graph-impact-${key}-bg`, fallback.bg),
    border: readToken(`--graph-impact-${key}-border`, fallback.border),
  }))
}

const GRAPH_WEIGHT_FALLBACK = {
  heavy: { bg: "rgba(127, 29, 29, 0.92)", border: "#ef4444" },
  medium: { bg: "rgba(251, 146, 60, 0.88)", border: "#f97316" },
  light: { bg: "rgba(254, 240, 138, 0.9)", border: "#eab308" },
  none: { bg: "rgba(226, 232, 240, 0.92)", border: "#94a3b8" },
} as const

export function readGraphWeightMarks(): GraphWeightMark[] {
  return Object.entries(GRAPH_WEIGHT_FALLBACK).map(([key, fallback]) => ({
    bg: readToken(`--graph-weight-${key}-bg`, fallback.bg),
    border: readToken(`--graph-weight-${key}-border`, fallback.border),
  }))
}
