"use client"

import ForceGraph3D, {
  type ForceGraphMethods,
  type GraphData,
  type LinkObject,
  type NodeObject,
} from "react-force-graph-3d"
import {
  AmbientLight,
  CanvasTexture,
  DirectionalLight,
  Group,
  LinearFilter,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PointLight,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  type Object3D,
} from "three"
import { Maximize2, Minimize2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

import { Button } from "@/components/ui/button"
import type { CytoscapeThemeTokens } from "@/features/bettertolive/ui/shared/cytoscape-2d-graph"
import { cn } from "@/lib/utils"

type GraphPrimitive = string | number | boolean | null | undefined

type GraphElementData = Record<string, GraphPrimitive>

type GraphElementDefinition = {
  data: GraphElementData
}

type ReactForceGraph3DLayoutOptions = {
  gravity?: number
  idealEdgeLength?: number
  name?: string
  nodeRepulsion?: number
  numIter?: number
  padding?: number
}

type GraphStylesheetBlock = {
  selector: string
  style: Record<string, string | number>
}

type ForceGraphNodeData = GraphElementData & {
  color: string
  initialX: number
  initialY: number
  initialZ: number
  kind: string
  label: string
  labelColor: string
  size: number
}

type ForceGraphLinkData = GraphElementData & {
  color: string
  linkKind: string
  size: number
}

type ForceGraphNode = NodeObject<ForceGraphNodeData>
type ForceGraphLink = LinkObject<ForceGraphNodeData, ForceGraphLinkData>
type RelationshipGraphData = GraphData<ForceGraphNodeData, ForceGraphLinkData>

type SelectorCondition = {
  key: string
  operator: "=" | ">"
  value: number | string
}

type ParsedSelector = {
  conditions: SelectorCondition[]
  selected: boolean
  target: "edge" | "node"
}

type Position = {
  x: number
  y: number
  z: number
}

type NodeSelectionState = "connected" | "dimmed" | "normal" | "selected"

type GraphLegendPosition = "bottom-left" | "top-left"

type ConfigurableD3Force = {
  distance?: (value: number) => unknown
  strength?: (value: number) => unknown
}

type WebkitFullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void
  webkitFullscreenElement?: Element | null
}

type WebkitFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
}

const FALLBACK_THEME_TOKENS: CytoscapeThemeTokens = {
  accent: "#2563eb",
  chipBorder: "rgba(148, 163, 184, 0.38)",
  mutedSurfaceBg: "rgba(248, 250, 252, 0.92)",
  mutedSurfaceBorder: "rgba(148, 163, 184, 0.22)",
  surfaceBg: "rgba(255, 255, 255, 0.82)",
  surfaceBorder: "rgba(15, 23, 42, 0.08)",
  textMuted: "#64748b",
  textPrimary: "#0f172a",
  textSecondary: "#1f2937",
  toneFutureBg: "rgba(254, 249, 195, 0.82)",
  toneFutureBorder: "#f59e0b",
  tonePastBg: "rgba(219, 234, 254, 0.78)",
  tonePastBorder: "#60a5fa",
  tonePresentBg: "rgba(220, 252, 231, 0.78)",
  tonePresentBorder: "#22c55e",
  toneValueBg: "rgba(255, 228, 230, 0.82)",
  toneValueBorder: "#fb7185",
}

const EMPTY_GRAPH_DATA: RelationshipGraphData = {
  links: [],
  nodes: [],
}

function readThemeTokens() {
  const styles = getComputedStyle(document.documentElement)

  return {
    accent: styles.getPropertyValue("--primary").trim() || FALLBACK_THEME_TOKENS.accent,
    chipBorder: styles.getPropertyValue("--chip-border").trim() || FALLBACK_THEME_TOKENS.chipBorder,
    mutedSurfaceBg:
      styles.getPropertyValue("--muted-surface-bg").trim() || FALLBACK_THEME_TOKENS.mutedSurfaceBg,
    mutedSurfaceBorder:
      styles.getPropertyValue("--muted-surface-border").trim() ||
      FALLBACK_THEME_TOKENS.mutedSurfaceBorder,
    surfaceBg: styles.getPropertyValue("--surface-bg").trim() || FALLBACK_THEME_TOKENS.surfaceBg,
    surfaceBorder:
      styles.getPropertyValue("--surface-border").trim() || FALLBACK_THEME_TOKENS.surfaceBorder,
    textMuted: styles.getPropertyValue("--text-muted").trim() || FALLBACK_THEME_TOKENS.textMuted,
    textPrimary:
      styles.getPropertyValue("--text-primary").trim() || FALLBACK_THEME_TOKENS.textPrimary,
    textSecondary:
      styles.getPropertyValue("--text-secondary").trim() || FALLBACK_THEME_TOKENS.textSecondary,
    toneFutureBg:
      styles.getPropertyValue("--tone-future-bg").trim() || FALLBACK_THEME_TOKENS.toneFutureBg,
    toneFutureBorder:
      styles.getPropertyValue("--tone-future-border").trim() ||
      FALLBACK_THEME_TOKENS.toneFutureBorder,
    tonePastBg:
      styles.getPropertyValue("--tone-past-bg").trim() || FALLBACK_THEME_TOKENS.tonePastBg,
    tonePastBorder:
      styles.getPropertyValue("--tone-past-border").trim() || FALLBACK_THEME_TOKENS.tonePastBorder,
    tonePresentBg:
      styles.getPropertyValue("--tone-present-bg").trim() || FALLBACK_THEME_TOKENS.tonePresentBg,
    tonePresentBorder:
      styles.getPropertyValue("--tone-present-border").trim() ||
      FALLBACK_THEME_TOKENS.tonePresentBorder,
    toneValueBg:
      styles.getPropertyValue("--tone-value-bg").trim() || FALLBACK_THEME_TOKENS.toneValueBg,
    toneValueBorder:
      styles.getPropertyValue("--tone-value-border").trim() ||
      FALLBACK_THEME_TOKENS.toneValueBorder,
  } satisfies CytoscapeThemeTokens
}

export function ReactForceGraph3DGraph({
  canvasClassName,
  className,
  elements,
  exitFullscreenLabel,
  fullscreenLabel,
  layout,
  legend,
  legendPosition = "top-left",
  selectedNodeId,
  stylesheet,
  onNodeSelect,
}: {
  canvasClassName?: string
  className?: string
  elements: GraphElementDefinition[]
  exitFullscreenLabel?: string
  fullscreenLabel?: string
  layout: ReactForceGraph3DLayoutOptions
  legend?: ReactNode
  legendPosition?: GraphLegendPosition
  selectedNodeId?: string | null
  stylesheet: (theme: CytoscapeThemeTokens) => unknown
  onNodeSelect?: (nodeId: string | null) => void
}) {
  const shellRef = useRef<HTMLDivElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const graphRef = useRef<ForceGraphMethods<ForceGraphNodeData, ForceGraphLinkData> | undefined>(
    undefined,
  )
  const lastViewRestoreSignatureRef = useRef<string | null>(null)
  const wasGraphVisibleRef = useRef(false)
  const onNodeSelectRef = useRef(onNodeSelect)
  const [dimensions, setDimensions] = useState({ height: 440, width: 640 })
  const [isGraphVisible, setIsGraphVisible] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [useFixedFullscreenFallback, setUseFixedFullscreenFallback] = useState(false)
  const [theme, setTheme] = useState<CytoscapeThemeTokens>(() =>
    typeof document === "undefined" ? FALLBACK_THEME_TOKENS : readThemeTokens(),
  )
  const [visibilityRevision, setVisibilityRevision] = useState(0)
  const layoutRevision = 0

  const graphModel = useMemo(() => {
    try {
      const data = createForceGraphData(
        elements,
        layout,
        stylesheet(theme) as GraphStylesheetBlock[],
        layoutRevision,
      )

      return {
        data,
        error: null,
      }
    } catch (error) {
      return {
        data: EMPTY_GRAPH_DATA,
        error: readErrorMessage(error),
      }
    }
  }, [elements, layout, layoutRevision, stylesheet, theme])

  const selectedConnectedNodeIds = useMemo(
    () => findConnectedNodeIds(graphModel.data, selectedNodeId ?? null),
    [graphModel.data, selectedNodeId],
  )

  const graphResetKey = useMemo(
    () =>
      [
        graphModel.data.nodes.length,
        graphModel.data.links.length,
        layoutRevision,
        visibilityRevision,
        themeSignature(theme),
      ].join(":"),
    [
      graphModel.data.links.length,
      graphModel.data.nodes.length,
      layoutRevision,
      theme,
      visibilityRevision,
    ],
  )
  const graphError = graphModel.error
  const canRenderGraph = isGraphVisible && !graphError && graphModel.data.nodes.length > 0
  const isFullscreenPresentation = isFullscreen || useFixedFullscreenFallback
  const viewRestoreSignature = [
    dimensions.width,
    dimensions.height,
    graphModel.data.nodes.length,
    graphModel.data.links.length,
    layoutRevision,
    selectedNodeId ?? "none",
    visibilityRevision,
  ].join(":")

  const exitGraphFullscreen = useCallback(async () => {
    setUseFixedFullscreenFallback(false)
    setIsFullscreen(false)
    setVisibilityRevision((current) => current + 1)

    if (getFullscreenElement()) {
      try {
        await exitFullscreen()
      } catch (error) {
        console.warn("Failed to exit graph fullscreen", error)
      }
    }
  }, [])

  useEffect(() => {
    onNodeSelectRef.current = onNodeSelect
  }, [onNodeSelect])

  useEffect(() => {
    if (typeof document === "undefined") {
      return
    }

    const root = document.documentElement
    const themeObserver = new MutationObserver(() => {
      setTheme(readThemeTokens())
    })

    themeObserver.observe(root, {
      attributeFilter: ["class", "data-theme", "style"],
      attributes: true,
    })

    return () => {
      themeObserver.disconnect()
    }
  }, [])

  useEffect(() => {
    if (!isFullscreenPresentation) {
      return
    }

    const previousOverflow = document.body.style.overflow
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        void exitGraphFullscreen()
      }
    }

    document.body.style.overflow = "hidden"
    window.addEventListener("keydown", handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [exitGraphFullscreen, isFullscreenPresentation])

  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNativeFullscreen = getFullscreenElement() === shellRef.current

      if (isNativeFullscreen) {
        setIsFullscreen(true)
        setUseFixedFullscreenFallback(false)
        setVisibilityRevision((current) => current + 1)
        return
      }

      if (!useFixedFullscreenFallback) {
        setIsFullscreen(false)
      }

      setVisibilityRevision((current) => current + 1)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange)
    }
  }, [useFixedFullscreenFallback])

  useEffect(() => {
    const container = containerRef.current
    if (!container) {
      return
    }

    let frameId = 0
    const observedElements = collectVisibleAncestors(container)

    const updateDimensions = () => {
      frameId = 0
      const rect = container.getBoundingClientRect()
      const nextIsVisible =
        container.getClientRects().length > 0 && rect.width >= 120 && rect.height >= 180

      setIsGraphVisible(nextIsVisible)

      if (nextIsVisible) {
        setDimensions({
          height: Math.round(rect.height),
          width: Math.round(rect.width),
        })

        if (!wasGraphVisibleRef.current) {
          setVisibilityRevision((current) => current + 1)
        }
      }

      wasGraphVisibleRef.current = nextIsVisible
    }

    const scheduleUpdate = () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }

      frameId = window.requestAnimationFrame(updateDimensions)
    }

    scheduleUpdate()
    const resizeObserver = new ResizeObserver(scheduleUpdate)
    resizeObserver.observe(container)

    const intersectionObserver = new IntersectionObserver(scheduleUpdate, {
      threshold: 0.01,
    })
    intersectionObserver.observe(container)

    const mutationObserver = new MutationObserver(scheduleUpdate)
    observedElements.forEach((element) => {
      mutationObserver.observe(element, {
        attributeFilter: ["aria-hidden", "class", "data-active", "hidden", "style"],
        attributes: true,
      })
    })

    window.addEventListener("focus", scheduleUpdate)
    window.addEventListener("pointerup", scheduleUpdate, true)
    window.addEventListener("resize", scheduleUpdate)
    document.addEventListener("visibilitychange", scheduleUpdate)

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId)
      }
      resizeObserver.disconnect()
      intersectionObserver.disconnect()
      mutationObserver.disconnect()
      window.removeEventListener("focus", scheduleUpdate)
      window.removeEventListener("pointerup", scheduleUpdate, true)
      window.removeEventListener("resize", scheduleUpdate)
      document.removeEventListener("visibilitychange", scheduleUpdate)
    }
  }, [isFullscreenPresentation])

  useEffect(() => {
    const graph = graphRef.current
    if (!graph || !canRenderGraph) {
      return
    }

    configureSceneLighting(graph, theme)
    configureForces(graph, layout)
    graph.d3ReheatSimulation()
  }, [canRenderGraph, graphModel.data, layout, theme])

  useEffect(() => {
    const graph = graphRef.current
    if (!graph || !canRenderGraph) {
      return
    }

    graph.refresh()
  }, [canRenderGraph, graphModel.data, layout.padding, selectedNodeId])

  useEffect(() => {
    const graph = graphRef.current
    if (!graph || !canRenderGraph) {
      return
    }

    if (lastViewRestoreSignatureRef.current === viewRestoreSignature) {
      return
    }

    lastViewRestoreSignatureRef.current = viewRestoreSignature

    return scheduleGraphViewRestore(() => {
      const activeGraph = graphRef.current
      if (!activeGraph || !isContainerVisible(containerRef.current)) {
        return
      }

      configureSceneLighting(activeGraph, theme)
      configureForces(activeGraph, layout)
      activeGraph.resumeAnimation()
      activeGraph.d3ReheatSimulation()
      restoreGraphView(activeGraph, graphModel.data, selectedNodeId ?? null, layout)
    })
  }, [canRenderGraph, viewRestoreSignature, graphModel.data, layout, selectedNodeId, theme])

  const handleToggleFullscreen = async () => {
    if (isFullscreenPresentation) {
      await exitGraphFullscreen()
      return
    }

    const shell = shellRef.current

    if (shell && canRequestFullscreen(shell)) {
      try {
        await requestFullscreen(shell)
        setIsFullscreen(true)
        setUseFixedFullscreenFallback(false)
        setVisibilityRevision((current) => current + 1)
        return
      } catch (error) {
        console.warn("Native graph fullscreen failed, falling back to fixed overlay", error)
      }
    }

    setIsFullscreen(true)
    setUseFixedFullscreenFallback(true)
    setVisibilityRevision((current) => current + 1)
  }

  const graphShell = (
    <div
      ref={shellRef}
      style={
        isFullscreenPresentation
          ? {
              height: "100dvh",
              maxHeight: "100dvh",
              width: "100vw",
            }
          : undefined
      }
      className={cn(
        "relative min-h-[420px] overflow-hidden rounded-[1.25rem]",
        className,
        isFullscreenPresentation &&
          "fixed inset-0 z-[2147483647] [height:100dvh] h-screen [max-height:100dvh] min-h-screen [width:100vw] rounded-none bg-[color:var(--background)] p-4",
      )}
    >
      {legend ? (
        <div
          className={cn(
            "pointer-events-auto absolute left-3 z-40 max-w-[calc(100%-1.5rem)] rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]/92 p-2 shadow-sm backdrop-blur",
            legendPosition === "bottom-left" ? "bottom-3" : "top-3 max-w-[70%]",
          )}
        >
          {legend}
        </div>
      ) : null}

      {fullscreenLabel && exitFullscreenLabel ? (
        <div className="pointer-events-none absolute top-3 right-3 z-50 flex items-start justify-end">
          <div
            className="pointer-events-auto rounded-lg border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)]/92 p-1 shadow-sm backdrop-blur transition-[background-color,border-color,box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5 hover:border-[color:var(--accent)] hover:bg-[color:var(--surface-bg)] hover:shadow-[0_14px_34px_rgba(2,6,23,0.18)]"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="active:translate-y-0"
              onClick={handleToggleFullscreen}
            >
              {isFullscreenPresentation ? (
                <Minimize2 className="size-3.5" />
              ) : (
                <Maximize2 className="size-3.5" />
              )}
              {isFullscreenPresentation ? exitFullscreenLabel : fullscreenLabel}
            </Button>
          </div>
        </div>
      ) : null}

      <div
        ref={containerRef}
        style={isFullscreenPresentation ? { height: "calc(100dvh - 2rem)" } : undefined}
        className={cn(
          "relative overflow-hidden rounded-[1.25rem] border border-white/10 bg-[radial-gradient(circle_at_18%_14%,rgba(56,189,248,0.32)_0%,transparent_32%),radial-gradient(circle_at_78%_18%,rgba(34,197,94,0.2)_0%,transparent_31%),radial-gradient(circle_at_48%_82%,rgba(251,113,133,0.15)_0%,transparent_34%),linear-gradient(145deg,#10233a_0%,#0b1a2d_46%,#06111f_100%)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-40px_90px_rgba(2,6,23,0.42)]",
          !isFullscreenPresentation && "h-[440px]",
          canvasClassName,
          isFullscreenPresentation &&
            "[height:calc(100dvh-2rem)] h-[calc(100dvh-2rem)] min-h-0 rounded-[1.5rem]",
        )}
      >
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(2,6,23,0.08)_52%,rgba(2,6,23,0.44)_100%)]" />
        <div className="pointer-events-none absolute inset-0 z-0 [background-image:radial-gradient(circle_at_24px_18px,rgba(255,255,255,0.34)_0_1px,transparent_1px),radial-gradient(circle_at_72px_52px,rgba(125,211,252,0.24)_0_1px,transparent_1px)] [background-size:78px_78px,132px_132px] opacity-35" />
        <div className="pointer-events-none absolute inset-x-10 bottom-8 z-0 h-28 rounded-[50%] bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.16)_0%,rgba(56,189,248,0.06)_42%,transparent_72%)] blur-xl" />
        {canRenderGraph ? (
          <div className="absolute inset-0 z-10">
            <ForceGraph3D
              key={graphResetKey}
              ref={graphRef}
              backgroundColor="rgba(0,0,0,0)"
              cooldownTicks={260}
              d3AlphaDecay={0.034}
              d3VelocityDecay={0.32}
              enableNavigationControls
              enableNodeDrag
              forceEngine="d3"
              graphData={graphModel.data}
              height={dimensions.height}
              linkColor={(link) => getLinkDisplayColor(link, selectedNodeId ?? null, theme)}
              linkDirectionalArrowColor={(link) =>
                getLinkDisplayColor(link, selectedNodeId ?? null, theme)
              }
              linkDirectionalArrowLength={(link) => getLinkDirectionalArrowLength(link)}
              linkDirectionalArrowRelPos={1}
              linkDirectionalParticleColor={(link) =>
                getLinkDisplayColor(link, selectedNodeId ?? null, theme)
              }
              linkDirectionalParticles={(link) =>
                getLinkDirectionalParticleCount(link, selectedNodeId ?? null)
              }
              linkDirectionalParticleWidth={(link) =>
                getLinkDisplayWidth(link, selectedNodeId ?? null) * 0.72
              }
              linkHoverPrecision={6}
              linkLabel={(link) => createLinkTooltip(link)}
              linkOpacity={0.92}
              linkSource="source"
              linkTarget="target"
              linkWidth={(link) => getLinkDisplayWidth(link, selectedNodeId ?? null)}
              nodeId="id"
              nodeLabel={(node) => createNodeTooltip(node)}
              nodeOpacity={0.98}
              nodeRelSize={3.8}
              nodeResolution={28}
              nodeThreeObject={(node: ForceGraphNode) => {
                const forceNode = node
                return createNodeObject(
                  forceNode,
                  getNodeSelectionState(
                    forceNode,
                    selectedNodeId ?? null,
                    selectedConnectedNodeIds,
                  ),
                  theme,
                )
              }}
              nodeThreeObjectExtend={false}
              nodeVal={(node) => Math.max(2, (node as ForceGraphNode).size)}
              numDimensions={3}
              rendererConfig={{
                alpha: true,
                antialias: true,
                powerPreference: "high-performance",
              }}
              showNavInfo={false}
              showPointerCursor={(item) => Boolean(item)}
              warmupTicks={80}
              width={dimensions.width}
              onBackgroundClick={() => {
                onNodeSelectRef.current?.(null)
              }}
              onNodeClick={(node) => {
                onNodeSelectRef.current?.(readId((node as ForceGraphNode).id))
              }}
            />
          </div>
        ) : null}
      </div>

      {graphError ? (
        <div className="absolute inset-x-6 bottom-6 rounded-lg border border-amber-200 bg-amber-50/95 px-4 py-3 text-sm text-amber-900 shadow-sm backdrop-blur">
          图谱暂时无法显示：{graphError}
        </div>
      ) : null}
    </div>
  )

  return useFixedFullscreenFallback && typeof document !== "undefined"
    ? createPortal(graphShell, document.body)
    : graphShell
}

function createForceGraphData(
  elements: GraphElementDefinition[],
  layout: ReactForceGraph3DLayoutOptions,
  stylesheet: GraphStylesheetBlock[],
  layoutRevision: number,
): RelationshipGraphData {
  const nodes: ForceGraphNode[] = []
  const links: ForceGraphLink[] = []
  const nodeElements = elements.filter(
    (element) => !("source" in element.data) && !("target" in element.data),
  )
  const edgeElements = elements.filter(
    (element) => "source" in element.data && "target" in element.data,
  )
  const positions = computeInitialPositions(nodeElements, layout, layoutRevision)
  const nodeIds = new Set<string>()

  nodeElements.forEach((element) => {
    const id = readId(element.data.id)
    if (!id || nodeIds.has(id)) {
      return
    }

    const style = resolveElementStyle(stylesheet, "node", element.data)
    const position = sanitizePosition(positions.get(id), id, layout, layoutRevision)
    const size = deriveNodeSize(style, element.data)
    const kind = readString(element.data.kind) ?? "node"
    const color = normalizeRenderableColor(
      readStyleColor(style["background-color"], fallbackNodeColor(element.data)),
      fallbackNodeColor(element.data),
    )

    nodes.push({
      ...element.data,
      color,
      id,
      initialX: position.x,
      initialY: position.y,
      initialZ: position.z,
      kind,
      label: readString(element.data.label) ?? id,
      labelColor: normalizeRenderableColor(
        readStyleColor(style.color, fallbackLabelColor(element.data)),
        fallbackLabelColor(element.data),
      ),
      size,
      x: position.x,
      y: position.y,
      z: position.z,
    })
    nodeIds.add(id)
  })

  edgeElements.forEach((element) => {
    const id = readId(element.data.id)
    const source = readId(element.data.source)
    const target = readId(element.data.target)
    if (!id || !source || !target || !nodeIds.has(source) || !nodeIds.has(target)) {
      return
    }

    const style = resolveElementStyle(stylesheet, "edge", element.data)
    const color = normalizeRenderableColor(
      readStyleColor(style["line-color"], fallbackLinkColor(element.data)),
      fallbackLinkColor(element.data),
    )

    links.push({
      ...element.data,
      color,
      id,
      linkKind: readString(element.data.linkKind) ?? "link",
      size: deriveEdgeSize(style, element.data),
      source,
      target,
    })
  })

  return {
    links,
    nodes,
  }
}

function createNodeObject(
  node: ForceGraphNode,
  selectionState: NodeSelectionState,
  theme: CytoscapeThemeTokens,
): Object3D {
  const group = new Group()
  const isSelected = selectionState === "selected"
  const isDimmed = selectionState === "dimmed"
  const accentColor = normalizeRenderableColor(theme.accent, FALLBACK_THEME_TOKENS.accent)
  const radius = Math.max(3.8, node.size * (isSelected ? 0.95 : 0.76))
  const nodeColor = isSelected ? accentColor : node.color

  if (isSelected) {
    const halo = new Mesh(
      new SphereGeometry(radius * 1.55, 32, 16),
      new MeshBasicMaterial({
        color: accentColor,
        depthWrite: false,
        opacity: 0.22,
        transparent: true,
      }),
    )
    group.add(halo)
  }

  const sphere = new Mesh(
    new SphereGeometry(radius, 32, 20),
    new MeshStandardMaterial({
      color: nodeColor,
      emissive: isSelected ? accentColor : nodeColor,
      emissiveIntensity: isSelected ? 0.34 : 0.08,
      metalness: isSelected ? 0.16 : 0.08,
      opacity: isDimmed ? 0.34 : selectionState === "connected" ? 0.98 : 0.94,
      roughness: isSelected ? 0.28 : 0.42,
      transparent: true,
    }),
  )
  sphere.userData = { id: node.id }
  group.add(sphere)

  if (shouldRenderLabel(node, selectionState)) {
    const label = createLabelSprite(
      node.label,
      isSelected ? "#ffffff" : selectionState === "connected" ? "#f8fafc" : "#dbeafe",
      isSelected ? accentColor : nodeColor,
      isSelected,
      isDimmed,
    )
    label.position.set(0, radius + (isSelected ? 13 : 10), 0)
    group.add(label)
  }

  return group
}

function createLabelSprite(
  label: string,
  textColor: string,
  borderColor: string,
  isSelected: boolean,
  isDimmed: boolean,
) {
  const lines = wrapLabel(label, isSelected ? 10 : 9, 2)
  const fontSize = isSelected ? 58 : 50
  const lineHeight = fontSize * 1.14
  const paddingX = isSelected ? 34 : 30
  const paddingY = isSelected ? 20 : 17
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) {
    return new Sprite()
  }

  context.font = `600 ${fontSize}px "Geist Variable", sans-serif`
  const rawWidth =
    Math.max(120, ...lines.map((line) => context.measureText(line).width)) + paddingX * 2
  const rawHeight = lines.length * lineHeight + paddingY * 2
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)

  canvas.width = Math.ceil(rawWidth * pixelRatio)
  canvas.height = Math.ceil(rawHeight * pixelRatio)

  context.scale(pixelRatio, pixelRatio)
  context.font = `600 ${fontSize}px "Geist Variable", sans-serif`
  context.textAlign = "center"
  context.textBaseline = "middle"
  context.fillStyle = isSelected ? "rgba(15, 23, 42, 0.86)" : "rgba(15, 23, 42, 0.72)"
  drawRoundedRect(context, 0, 0, rawWidth, rawHeight, rawHeight / 2)
  context.fill()
  context.strokeStyle = isSelected ? `${borderColor}cc` : "rgba(148, 163, 184, 0.38)"
  context.lineWidth = isSelected ? 3 : 2
  context.stroke()
  context.fillStyle = isDimmed ? "rgba(148, 163, 184, 0.62)" : textColor

  lines.forEach((line, index) => {
    const offset = (index - (lines.length - 1) / 2) * lineHeight
    context.fillText(line, rawWidth / 2, rawHeight / 2 + offset)
  })

  const texture = new CanvasTexture(canvas)
  texture.generateMipmaps = false
  texture.minFilter = LinearFilter
  texture.needsUpdate = true

  const sprite = new Sprite(
    new SpriteMaterial({
      depthWrite: false,
      map: texture,
      opacity: isDimmed ? 0.5 : 1,
      transparent: true,
    }),
  )
  const scale = isSelected ? 24 : 19
  sprite.scale.set((rawWidth / rawHeight) * scale, scale, 1)

  return sprite
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const safeRadius = Math.min(radius, width / 2, height / 2)

  context.beginPath()
  context.moveTo(x + safeRadius, y)
  context.lineTo(x + width - safeRadius, y)
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius)
  context.lineTo(x + width, y + height - safeRadius)
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height)
  context.lineTo(x + safeRadius, y + height)
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius)
  context.lineTo(x, y + safeRadius)
  context.quadraticCurveTo(x, y, x + safeRadius, y)
  context.closePath()
}

function configureForces(
  graph: ForceGraphMethods<ForceGraphNodeData, ForceGraphLinkData>,
  layout: ReactForceGraph3DLayoutOptions,
) {
  const chargeForce = graph.d3Force("charge") as ConfigurableD3Force | undefined
  const linkForce = graph.d3Force("link") as ConfigurableD3Force | undefined
  const repulsion = Math.max(80, (layout.nodeRepulsion ?? 9000) / 80)
  const idealEdgeLength = Math.max(58, layout.idealEdgeLength ?? 120)

  chargeForce?.strength?.(-repulsion)
  linkForce?.distance?.(idealEdgeLength)
  linkForce?.strength?.(0.58)
}

function configureSceneLighting(
  graph: ForceGraphMethods<ForceGraphNodeData, ForceGraphLinkData>,
  theme: CytoscapeThemeTokens,
) {
  const accentColor = normalizeRenderableColor(theme.accent, FALLBACK_THEME_TOKENS.accent)
  const keyLight = new DirectionalLight("#f8fafc", 1.45)
  const fillLight = new DirectionalLight(accentColor, 0.62)
  const rimLight = new PointLight("#7dd3fc", 1.08, 760)

  keyLight.position.set(180, 220, 260)
  fillLight.position.set(-220, -80, 120)
  rimLight.position.set(0, 160, -260)

  graph.lights([new AmbientLight("#93c5fd", 0.48), keyLight, fillLight, rimLight])
}

function restoreGraphView(
  graph: ForceGraphMethods<ForceGraphNodeData, ForceGraphLinkData>,
  graphData: RelationshipGraphData,
  selectedNodeId: string | null,
  layout: ReactForceGraph3DLayoutOptions,
) {
  graph.refresh()

  if (selectedNodeId) {
    focusGraphNode(graph, graphData, selectedNodeId, 260)
    return
  }

  graph.zoomToFit(260, Math.max(36, layout.padding ?? 44))
}

function focusGraphNode(
  graph: ForceGraphMethods<ForceGraphNodeData, ForceGraphLinkData>,
  graphData: RelationshipGraphData,
  nodeId: string,
  duration = 520,
) {
  const node = graphData.nodes.find((candidate) => readId(candidate.id) === nodeId)
  if (!node) {
    graph.zoomToFit(280, 44)
    return
  }

  const x = ensureFiniteNumber(node.x, node.initialX)
  const y = ensureFiniteNumber(node.y, node.initialY)
  const z = ensureFiniteNumber(node.z, node.initialZ)
  const distance = Math.max(170, node.size * 16)

  graph.cameraPosition(
    {
      x: x + distance * 0.48,
      y: y + distance * 0.34,
      z: z + distance,
    },
    { x, y, z },
    duration,
  )
}

function getNodeSelectionState(
  node: ForceGraphNode,
  selectedNodeId: string | null,
  selectedConnectedNodeIds: Set<string>,
): NodeSelectionState {
  const nodeId = readId(node.id)
  if (!selectedNodeId || !nodeId) {
    return "normal"
  }

  if (nodeId === selectedNodeId) {
    return "selected"
  }

  return selectedConnectedNodeIds.has(nodeId) ? "connected" : "dimmed"
}

function shouldRenderLabel(node: ForceGraphNode, selectionState: NodeSelectionState) {
  if (selectionState === "dimmed") {
    return false
  }

  return (
    selectionState !== "normal" ||
    node.size >= 6 ||
    node.kind === "circle" ||
    node.kind === "relationship" ||
    node.kind === "entry"
  )
}

function getLinkDisplayColor(
  link: ForceGraphLink,
  selectedNodeId: string | null,
  theme: CytoscapeThemeTokens,
) {
  if (!selectedNodeId) {
    return link.color
  }

  return isLinkConnectedToNode(link, selectedNodeId)
    ? normalizeRenderableColor(theme.accent, FALLBACK_THEME_TOKENS.accent)
    : mixHexColor(link.color, "#1e293b", 0.72)
}

function getLinkDisplayWidth(link: ForceGraphLink, selectedNodeId: string | null) {
  const baseWidth = Math.max(1.6, link.size)

  return selectedNodeId && isLinkConnectedToNode(link, selectedNodeId) ? baseWidth * 1.7 : baseWidth
}

function getLinkDirectionalArrowLength(link: ForceGraphLink) {
  const linkKind = readString(link.linkKind)
  return linkKind === "pattern" ? 2.4 : 3.4
}

function getLinkDirectionalParticleCount(link: ForceGraphLink, selectedNodeId: string | null) {
  if (selectedNodeId && isLinkConnectedToNode(link, selectedNodeId)) {
    return 2
  }

  return readString(link.linkKind) === "pattern" ? 1 : 0
}

function isLinkConnectedToNode(link: ForceGraphLink, nodeId: string) {
  return readEndpointId(link.source) === nodeId || readEndpointId(link.target) === nodeId
}

function readEndpointId(endpoint: ForceGraphLink["source"]) {
  if (typeof endpoint === "object" && endpoint !== null) {
    return readId(endpoint.id)
  }

  return readId(endpoint)
}

function findConnectedNodeIds(graphData: RelationshipGraphData, selectedNodeId: string | null) {
  const connectedIds = new Set<string>()
  if (!selectedNodeId) {
    return connectedIds
  }

  graphData.links.forEach((link) => {
    const source = readEndpointId(link.source)
    const target = readEndpointId(link.target)

    if (source === selectedNodeId && target) {
      connectedIds.add(target)
    }
    if (target === selectedNodeId && source) {
      connectedIds.add(source)
    }
  })

  return connectedIds
}

function createNodeTooltip(node: ForceGraphNode) {
  return `<div style="font-size:12px;line-height:1.45"><strong>${escapeHtml(
    node.label,
  )}</strong><br/><span>${escapeHtml(readString(node.kind) ?? "node")}</span></div>`
}

function createLinkTooltip(link: ForceGraphLink) {
  const source = readEndpointId(link.source) ?? ""
  const target = readEndpointId(link.target) ?? ""
  const label = readString(link.linkKind) ?? "link"

  return `<div style="font-size:12px;line-height:1.45"><strong>${escapeHtml(
    label,
  )}</strong><br/><span>${escapeHtml(source)} -> ${escapeHtml(target)}</span></div>`
}

function resolveElementStyle(
  stylesheet: GraphStylesheetBlock[],
  target: "edge" | "node",
  data: GraphElementData,
) {
  return stylesheet.reduce<Record<string, string | number>>((resolved, block) => {
    const parsed = parseSelector(block.selector)
    if (!parsed || parsed.target !== target || parsed.selected) {
      return resolved
    }

    if (!selectorMatches(data, parsed.conditions)) {
      return resolved
    }

    return { ...resolved, ...block.style }
  }, {})
}

function parseSelector(selector: string): ParsedSelector | null {
  const trimmed = selector.trim()
  if (!trimmed.startsWith("node") && !trimmed.startsWith("edge")) {
    return null
  }

  const selected = trimmed.includes(":selected")
  const target = trimmed.startsWith("edge") ? "edge" : "node"
  const conditions: SelectorCondition[] = []

  for (const match of trimmed.matchAll(
    /\[\s*([\w-]+)\s*(=|>)\s*(?:'([^']*)'|"([^"]*)"|([^\]]+))\s*\]/g,
  )) {
    const [, key, operator, singleQuoted, doubleQuoted, rawValue] = match
    const value = (singleQuoted ?? doubleQuoted ?? rawValue ?? "").trim()
    const numericValue = Number(value)

    conditions.push({
      key,
      operator: operator as "=" | ">",
      value: Number.isFinite(numericValue) && value !== "" ? numericValue : value,
    })
  }

  return {
    conditions,
    selected,
    target,
  }
}

function selectorMatches(data: GraphElementData, conditions: SelectorCondition[]) {
  return conditions.every((condition) => {
    const candidate = data[condition.key]
    if (condition.operator === "=") {
      return String(candidate ?? "") === String(condition.value)
    }

    return readNumber(candidate, Number.NEGATIVE_INFINITY) > readNumber(condition.value, 0)
  })
}

function deriveNodeSize(style: Record<string, string | number>, data: GraphElementData) {
  const width = resolveStyleMetric(style.width, data)
  const height = resolveStyleMetric(style.height, data)
  return Math.max(4.4, (width + height) / 22)
}

function deriveEdgeSize(style: Record<string, string | number>, data: GraphElementData) {
  return Math.max(1.7, resolveStyleMetric(style.width, data) * 1.1)
}

function resolveStyleMetric(value: string | number | undefined, data: GraphElementData) {
  if (typeof value === "number") {
    return value
  }

  if (!value) {
    return 48
  }

  const numeric = Number(value)
  if (Number.isFinite(numeric)) {
    return numeric
  }

  const mapDataMatch = value.match(
    /mapData\(\s*([\w-]+)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)/,
  )

  if (!mapDataMatch) {
    return 48
  }

  const [, key, inputMin, inputMax, outputMin, outputMax] = mapDataMatch
  const rawValue = readNumber(data[key], Number(inputMin))
  const sourceMin = Number(inputMin)
  const sourceMax = Number(inputMax)
  const targetMin = Number(outputMin)
  const targetMax = Number(outputMax)

  if (sourceMax === sourceMin) {
    return targetMin
  }

  const clamped = Math.min(sourceMax, Math.max(sourceMin, rawValue))
  const ratio = (clamped - sourceMin) / (sourceMax - sourceMin)
  return targetMin + ratio * (targetMax - targetMin)
}

function computeInitialPositions(
  nodes: GraphElementDefinition[],
  layout: ReactForceGraph3DLayoutOptions,
  layoutRevision: number,
) {
  const positions = new Map<string, Position>()
  const idealEdgeLength = Math.max(80, layout.idealEdgeLength ?? 120)

  nodes.forEach((node) => {
    const id = readId(node.data.id)
    if (!id) {
      return
    }

    const kind = readString(node.data.kind) ?? "node"
    const seed = `${layoutRevision}:${id}`
    const theta = seededUnit(seed) * Math.PI * 2
    const phi = Math.acos(2 * seededUnit(`${seed}:phi`) - 1)
    const radius =
      idealEdgeLength *
      (baseRadiusForKind(kind) + seededUnit(`${seed}:radius`) * 0.38 + layoutRevision * 0.015)

    positions.set(id, {
      x: Math.sin(phi) * Math.cos(theta) * radius,
      y: Math.sin(phi) * Math.sin(theta) * radius,
      z: Math.cos(phi) * radius,
    })
  })

  return positions
}

function sanitizePosition(
  position: Position | undefined,
  id: string,
  layout: ReactForceGraph3DLayoutOptions,
  layoutRevision: number,
): Position {
  if (
    position &&
    Number.isFinite(position.x) &&
    Number.isFinite(position.y) &&
    Number.isFinite(position.z)
  ) {
    return position
  }

  return createFallbackPosition(id, layout, layoutRevision)
}

function createFallbackPosition(
  id: string,
  layout: ReactForceGraph3DLayoutOptions = {},
  layoutRevision = 0,
): Position {
  const idealEdgeLength = Math.max(80, layout.idealEdgeLength ?? 120)
  const seed = `${layoutRevision}:${id}:fallback`
  const angle = seededUnit(seed) * Math.PI * 2
  const height = seededUnit(`${seed}:height`) * 2 - 1
  const radius = idealEdgeLength * (0.76 + seededUnit(`${seed}:radius`) * 0.52)
  const ringRadius = Math.sqrt(1 - height * height) * radius

  return {
    x: Math.cos(angle) * ringRadius,
    y: Math.sin(angle) * ringRadius,
    z: height * radius,
  }
}

function baseRadiusForKind(kind: string) {
  switch (kind) {
    case "circle":
      return 0.52
    case "relationship":
      return 0.96
    case "note":
      return 1.32
    case "pattern":
      return 1.42
    case "entry":
      return 0.92
    case "concept":
      return 1.18
    default:
      return 1
  }
}

function wrapLabel(label: string, maxChars: number, maxLines: number) {
  const normalized = label.trim()
  if (normalized.length <= maxChars) {
    return [normalized]
  }

  const lines: string[] = []
  let remaining = normalized

  while (remaining.length > 0 && lines.length < maxLines) {
    const next = remaining.slice(0, maxChars)
    lines.push(next)
    remaining = remaining.slice(maxChars)
  }

  if (remaining.length > 0 && lines.length > 0) {
    lines[lines.length - 1] = `${lines[lines.length - 1].slice(0, Math.max(1, maxChars - 1))}...`
  }

  return lines
}

function fallbackNodeColor(data: GraphElementData) {
  const kind = readString(data.kind)
  const impact = readString(data.impact)
  const discipline = readString(data.discipline)

  if (kind === "relationship" && impact === "滋养") {
    return "#86efac"
  }
  if (kind === "relationship" && impact === "消耗") {
    return "#fde68a"
  }
  if (kind === "relationship" && impact === "混合") {
    return "#fda4af"
  }
  if (kind === "entry" && discipline === "社会学") {
    return "#bbf7d0"
  }
  if (kind === "entry") {
    return "#bfdbfe"
  }
  if (kind === "concept") {
    return "#f8fafc"
  }

  return "#e2e8f0"
}

function fallbackLabelColor(data: GraphElementData) {
  return readString(data.kind) === "concept" ? "#334155" : "#0f172a"
}

function fallbackLinkColor(data: GraphElementData) {
  switch (readString(data.linkKind)) {
    case "contains":
      return "#22c55e"
    case "expresses":
      return "#60a5fa"
    case "pattern":
      return "#fb7185"
    default:
      return "#94a3b8"
  }
}

function normalizeRenderableColor(color: string, fallback: string) {
  const trimmed = color.trim()
  const fallbackColor = fallback.startsWith("#") ? fallback : "#94a3b8"

  if (/^#[\da-f]{3}$/i.test(trimmed)) {
    return `#${trimmed
      .slice(1)
      .split("")
      .map((part) => `${part}${part}`)
      .join("")}`
  }

  if (/^#[\da-f]{6}$/i.test(trimmed)) {
    return trimmed
  }

  const rgbMatch = trimmed.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)/i,
  )
  if (rgbMatch) {
    const [, red, green, blue] = rgbMatch
    return rgbToHex(Number(red), Number(green), Number(blue))
  }

  return fallbackColor
}

function mixHexColor(color: string, targetColor: string, amount: number) {
  const normalized = normalizeRenderableColor(color, "#94a3b8").replace("#", "")
  const normalizedTarget = normalizeRenderableColor(targetColor, "#1e293b").replace("#", "")
  const red = parseInt(normalized.slice(0, 2), 16)
  const green = parseInt(normalized.slice(2, 4), 16)
  const blue = parseInt(normalized.slice(4, 6), 16)
  const targetRed = parseInt(normalizedTarget.slice(0, 2), 16)
  const targetGreen = parseInt(normalizedTarget.slice(2, 4), 16)
  const targetBlue = parseInt(normalizedTarget.slice(4, 6), 16)

  return rgbToHex(
    red + (targetRed - red) * amount,
    green + (targetGreen - green) * amount,
    blue + (targetBlue - blue) * amount,
  )
}

function rgbToHex(red: number, green: number, blue: number) {
  return `#${[red, green, blue]
    .map((value) =>
      Math.round(Math.min(255, Math.max(0, value)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("")}`
}

function collectVisibleAncestors(element: HTMLElement) {
  const ancestors: HTMLElement[] = []
  let current: HTMLElement | null = element

  while (current && ancestors.length < 6) {
    ancestors.push(current)
    current = current.parentElement
  }

  return ancestors
}

function getFullscreenElement() {
  const webkitDocument = document as WebkitFullscreenDocument
  return document.fullscreenElement ?? webkitDocument.webkitFullscreenElement ?? null
}

function canRequestFullscreen(element: HTMLElement) {
  const webkitElement = element as WebkitFullscreenElement
  return (
    typeof element.requestFullscreen === "function" ||
    typeof webkitElement.webkitRequestFullscreen === "function"
  )
}

async function requestFullscreen(element: HTMLElement) {
  const webkitElement = element as WebkitFullscreenElement

  if (typeof element.requestFullscreen === "function") {
    await element.requestFullscreen()
    return
  }

  if (typeof webkitElement.webkitRequestFullscreen === "function") {
    await webkitElement.webkitRequestFullscreen()
  }
}

async function exitFullscreen() {
  const webkitDocument = document as WebkitFullscreenDocument

  if (typeof document.exitFullscreen === "function") {
    await document.exitFullscreen()
    return
  }

  if (typeof webkitDocument.webkitExitFullscreen === "function") {
    await webkitDocument.webkitExitFullscreen()
  }
}

function isContainerVisible(container: HTMLElement | null) {
  if (!container) {
    return false
  }

  const rect = container.getBoundingClientRect()
  return container.getClientRects().length > 0 && rect.width >= 120 && rect.height >= 180
}

function scheduleGraphViewRestore(callback: () => void) {
  let firstFrame = 0
  let secondFrame = 0

  firstFrame = window.requestAnimationFrame(() => {
    secondFrame = window.requestAnimationFrame(callback)
  })

  return () => {
    if (firstFrame) {
      window.cancelAnimationFrame(firstFrame)
    }
    if (secondFrame) {
      window.cancelAnimationFrame(secondFrame)
    }
  }
}

function seededUnit(value: string) {
  let hash = 2166136261

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }

  return ((hash >>> 0) % 1000) / 1000
}

function readId(value: unknown) {
  if (typeof value === "string" && value.length > 0) {
    return value
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value)
  }

  return null
}

function readString(value: GraphPrimitive) {
  return typeof value === "string" && value.length > 0 ? value : null
}

function readNumber(value: GraphPrimitive, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function readStyleColor(value: string | number | undefined, fallback: string) {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback
}

function ensureFiniteNumber(value: number | undefined, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback
}

function themeSignature(theme: CytoscapeThemeTokens) {
  return Object.values(theme).join("|")
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

function readErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return String(error)
}
