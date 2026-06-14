"use client"

import cytoscape from "cytoscape"
import { Maximize2, Minimize2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { UI_LAYERS } from "@/lib/ui-layers"

type GraphPrimitive = string | number | boolean | null | undefined

type GraphElementData = Record<string, GraphPrimitive>

type GraphElementDefinition = {
  data: GraphElementData
  position?: {
    x: number
    y: number
  }
}

type Cytoscape2DLayoutOptions = {
  animate?: boolean
  edgeElasticity?: number
  fit?: boolean
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

type GraphLegendPosition = "bottom-left" | "top-left"

type WebkitFullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void
  webkitFullscreenElement?: Element | null
}

type WebkitFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void
}

type CytoscapeCore = cytoscape.Core
type CytoscapeElementDefinition = cytoscape.ElementDefinition
type CytoscapeLayoutOptions = cytoscape.LayoutOptions
type CytoscapeStylesheetJson = cytoscape.StylesheetJson

export type CytoscapeThemeTokens = {
  accent: string
  chipBorder: string
  mutedSurfaceBg: string
  mutedSurfaceBorder: string
  surfaceBg: string
  surfaceBorder: string
  textMuted: string
  textPrimary: string
  textSecondary: string
  toneFutureBg: string
  toneFutureBorder: string
  tonePastBg: string
  tonePastBorder: string
  tonePresentBg: string
  tonePresentBorder: string
  toneValueBg: string
  toneValueBorder: string
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

export function Cytoscape2DGraph({
  canvasClassName,
  className,
  elements,
  exitFullscreenLabel,
  fullscreenLabel,
  layout,
  legend,
  legendPosition = "top-left",
  nodesDraggable = true,
  selectedNodeId,
  stylesheet,
  onNodeSelect,
}: {
  canvasClassName?: string
  className?: string
  elements: GraphElementDefinition[]
  exitFullscreenLabel?: string
  fullscreenLabel?: string
  layout: Cytoscape2DLayoutOptions
  legend?: ReactNode
  legendPosition?: GraphLegendPosition
  nodesDraggable?: boolean
  selectedNodeId?: string | null
  stylesheet: (theme: CytoscapeThemeTokens) => unknown
  onNodeSelect?: (nodeId: string | null) => void
}) {
  const shellRef = useRef<HTMLDivElement | null>(null)
  const viewportRef = useRef<HTMLDivElement | null>(null)
  const graphRef = useRef<CytoscapeCore | null>(null)
  const wasGraphVisibleRef = useRef(false)
  const onNodeSelectRef = useRef(onNodeSelect)
  const selectedNodeIdRef = useRef<string | null>(selectedNodeId ?? null)
  const [dimensions, setDimensions] = useState({ height: 440, width: 640 })
  const [isGraphVisible, setIsGraphVisible] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [useFixedFullscreenFallback, setUseFixedFullscreenFallback] = useState(false)
  const [runtimeError, setRuntimeError] = useState<{
    message: string
    resetKey: string
  } | null>(null)
  const [theme, setTheme] = useState<CytoscapeThemeTokens>(() =>
    typeof document === "undefined" ? FALLBACK_THEME_TOKENS : readThemeTokens(),
  )
  const [visibilityRevision, setVisibilityRevision] = useState(0)

  const graphElements = useMemo(() => createCytoscapeElements(elements), [elements])
  const graphStylesheet = useMemo(
    () => createGraphStylesheet(stylesheet(theme) as GraphStylesheetBlock[], theme),
    [stylesheet, theme],
  )
  const elementSignature = useMemo(() => createElementSignature(graphElements), [graphElements])
  const layoutSignature = useMemo(() => JSON.stringify(layout), [layout])
  const graphInstanceKey = useMemo(
    () => [elementSignature, layoutSignature, themeSignature(theme)].join(":"),
    [elementSignature, layoutSignature, theme],
  )
  const graphResetKey = useMemo(
    () => [graphInstanceKey, visibilityRevision].join(":"),
    [graphInstanceKey, visibilityRevision],
  )
  const graphError = runtimeError?.resetKey === graphResetKey ? runtimeError.message : null
  const canRenderGraph = isGraphVisible && !graphError && graphElements.length > 0
  const isFullscreenPresentation = isFullscreen || useFixedFullscreenFallback
  const graphPadding = Math.max(28, layout.padding ?? 48)

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
    selectedNodeIdRef.current = selectedNodeId ?? null
  }, [selectedNodeId])

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
    const viewport = viewportRef.current
    if (!viewport) {
      return
    }

    let frameId = 0
    const observedElements = collectVisibleAncestors(viewport)

    const updateDimensions = () => {
      frameId = 0
      const rect = viewport.getBoundingClientRect()
      const nextIsVisible =
        viewport.getClientRects().length > 0 && rect.width >= 120 && rect.height >= 180

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
    resizeObserver.observe(viewport)

    const intersectionObserver = new IntersectionObserver(scheduleUpdate, {
      threshold: 0.01,
    })
    intersectionObserver.observe(viewport)

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
    if (!canRenderGraph) {
      return
    }

    const viewport = viewportRef.current
    if (!viewport) {
      return
    }

    let graph: CytoscapeCore | null = null

    try {
      graph = cytoscape({
        autoungrabify: !nodesDraggable,
        autounselectify: false,
        boxSelectionEnabled: false,
        container: viewport,
        elements: graphElements,
        layout: createCytoscapeLayout(layout, graphPadding),
        maxZoom: 2.5,
        minZoom: 0.18,
        pixelRatio: "auto",
        selectionType: "single",
        style: graphStylesheet,
        wheelSensitivity: 0.18,
      })
    } catch (error) {
      const timeoutId = window.setTimeout(() => {
        setRuntimeError({
          message: readErrorMessage(error),
          resetKey: graphResetKey,
        })
      }, 0)

      return () => {
        window.clearTimeout(timeoutId)
      }
    }

    graphRef.current = graph
    setRuntimeError(null)

    graph.on("tap", "node", (event: cytoscape.EventObjectNode) => {
      const nodeId = event.target.id()
      onNodeSelectRef.current?.(selectedNodeIdRef.current === nodeId ? null : nodeId)
    })
    graph.on("tap", (event) => {
      if (event.target === graph) {
        onNodeSelectRef.current?.(null)
      }
    })
    graph.on("layoutstop", () => {
      syncGraphSelection(graph, selectedNodeIdRef.current)
      if (layout.fit !== false) {
        scheduleGraphViewportRestore(() =>
          restoreGraphViewport(graph, selectedNodeIdRef.current, graphPadding),
        )
      }
    })

    const cleanupRestore = scheduleGraphViewportRestore(() => {
      if (graph?.destroyed() || !isContainerVisible(viewportRef.current)) {
        return
      }

      graph.resize()
      syncGraphSelection(graph, selectedNodeIdRef.current)
      if (layout.fit !== false) {
        restoreGraphViewport(graph, selectedNodeIdRef.current, graphPadding)
      }
    })

    return () => {
      cleanupRestore()

      if (graph && !graph.destroyed()) {
        graph.destroy()
      }

      if (graphRef.current === graph) {
        graphRef.current = null
      }
    }
  }, [
    canRenderGraph,
    graphElements,
    graphPadding,
    graphResetKey,
    graphStylesheet,
    layout,
    nodesDraggable,
  ])

  useEffect(() => {
    const graph = graphRef.current
    if (!graph || graph.destroyed()) {
      return
    }

    syncGraphSelection(graph, selectedNodeId ?? null)
    if (layout.fit !== false) {
      restoreGraphViewport(graph, selectedNodeId ?? null, graphPadding)
    }
  }, [graphPadding, layout.fit, selectedNodeId])

  useEffect(() => {
    const graph = graphRef.current
    if (!graph || graph.destroyed() || !canRenderGraph) {
      return
    }

    graph.resize()
    if (layout.fit !== false) {
      restoreGraphViewport(graph, selectedNodeId ?? null, graphPadding)
    }
  }, [
    canRenderGraph,
    dimensions.height,
    dimensions.width,
    graphPadding,
    layout.fit,
    selectedNodeId,
  ])

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
          `fixed inset-0 ${UI_LAYERS.graphFullscreen} [height:100dvh] h-screen [max-height:100dvh] min-h-screen [width:100vw] rounded-none bg-[color:var(--background)] p-4`,
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
        ref={viewportRef}
        style={isFullscreenPresentation ? { height: "calc(100dvh - 2rem)" } : undefined}
        className={cn(
          "relative overflow-hidden rounded-[1.25rem] border border-[color:var(--surface-border)] bg-[color:var(--muted-surface-bg)] [background-image:linear-gradient(rgba(148,163,184,0.13)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.13)_1px,transparent_1px)] [background-size:28px_28px] shadow-[inset_0_1px_0_rgba(255,255,255,0.24)]",
          !isFullscreenPresentation && "h-[440px]",
          canvasClassName,
          isFullscreenPresentation &&
            "[height:calc(100dvh-2rem)] h-[calc(100dvh-2rem)] min-h-0 rounded-[1.5rem]",
        )}
      />

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

function createCytoscapeElements(elements: GraphElementDefinition[]) {
  const nodes: CytoscapeElementDefinition[] = []
  const edges: CytoscapeElementDefinition[] = []
  const nodeIds = new Set<string>()
  const edgeIds = new Set<string>()

  elements.forEach((element) => {
    const id = readId(element.data.id)
    const source = readId(element.data.source)
    const target = readId(element.data.target)

    if (!id || source || target || nodeIds.has(id)) {
      return
    }

    nodeIds.add(id)
    nodes.push({
      data: {
        ...element.data,
        id,
      },
      group: "nodes",
      position: element.position,
    })
  })

  elements.forEach((element) => {
    const id = readId(element.data.id)
    const source = readId(element.data.source)
    const target = readId(element.data.target)

    if (
      !id ||
      !source ||
      !target ||
      !nodeIds.has(source) ||
      !nodeIds.has(target) ||
      edgeIds.has(id)
    ) {
      return
    }

    edgeIds.add(id)
    edges.push({
      data: {
        ...element.data,
        id,
        source,
        target,
      },
      group: "edges",
    })
  })

  return [...nodes, ...edges]
}

function createGraphStylesheet(
  stylesheet: GraphStylesheetBlock[],
  theme: CytoscapeThemeTokens,
): CytoscapeStylesheetJson {
  return [
    ...stylesheet,
    {
      selector: "node, edge",
      style: {
        "transition-duration": 160,
        "transition-property":
          "background-color, border-color, line-color, opacity, shadow-opacity, text-opacity, width",
        "transition-timing-function": "ease-out",
      },
    },
    {
      selector: "node.bt-graph-connected",
      style: {
        "border-color": theme.accent,
        "border-width": 2.2,
        "shadow-blur": 10,
        "shadow-color": theme.accent,
        "shadow-opacity": 0.16,
        "shadow-offset-x": 0,
        "shadow-offset-y": 4,
      },
    },
    {
      selector: "edge.bt-graph-connected",
      style: {
        "line-color": theme.accent,
        opacity: 0.98,
        "target-arrow-color": theme.accent,
      },
    },
    {
      selector: "node.bt-graph-dimmed",
      style: {
        opacity: 0.24,
        "text-opacity": 0.36,
      },
    },
    {
      selector: "edge.bt-graph-dimmed",
      style: {
        opacity: 0.12,
      },
    },
  ] as CytoscapeStylesheetJson
}

function createCytoscapeLayout(
  layout: Cytoscape2DLayoutOptions,
  padding: number,
): CytoscapeLayoutOptions {
  if ((layout.name ?? "cose") === "cose") {
    return {
      animate: layout.animate ?? false,
      componentSpacing: 92,
      edgeElasticity: layout.edgeElasticity ?? 110,
      fit: false,
      gravity: layout.gravity ?? 0.28,
      idealEdgeLength: layout.idealEdgeLength ?? 132,
      name: "cose",
      nodeOverlap: 18,
      nodeRepulsion: layout.nodeRepulsion ?? 12000,
      numIter: layout.numIter ?? 900,
      padding,
      randomize: true,
    }
  }

  return {
    ...layout,
    fit: false,
    name: layout.name ?? "grid",
    padding,
  } as CytoscapeLayoutOptions
}

function syncGraphSelection(graph: CytoscapeCore, selectedNodeId: string | null) {
  graph.batch(() => {
    const graphElements = graph.elements()
    graphElements.removeClass("bt-graph-connected bt-graph-dimmed")
    graph.nodes().unselect()

    if (!selectedNodeId) {
      return
    }

    const selectedNode = graph.$id(selectedNodeId)
    if (selectedNode.empty() || !selectedNode.isNode()) {
      return
    }

    selectedNode.select()

    const connectedEdges = selectedNode.connectedEdges()
    const connectedNodes = connectedEdges.connectedNodes().difference(selectedNode)
    const visibleNeighborhood = selectedNode.union(connectedEdges).union(connectedNodes)

    connectedEdges.addClass("bt-graph-connected")
    connectedNodes.addClass("bt-graph-connected")
    graphElements.difference(visibleNeighborhood).addClass("bt-graph-dimmed")
  })
}

function restoreGraphViewport(
  graph: CytoscapeCore,
  selectedNodeId: string | null,
  padding: number,
) {
  if (graph.destroyed() || graph.elements().empty()) {
    return
  }

  const selectedNode = selectedNodeId ? graph.$id(selectedNodeId) : null
  const target =
    selectedNode && selectedNode.nonempty() && selectedNode.isNode()
      ? selectedNode.closedNeighborhood()
      : graph.elements()

  graph.stop()
  graph.animate(
    {
      fit: {
        eles: target,
        padding,
      },
    },
    {
      duration: 220,
      easing: "ease-out-cubic",
    },
  )
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

function scheduleGraphViewportRestore(callback: () => void) {
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

function createElementSignature(elements: CytoscapeElementDefinition[]) {
  return elements
    .map((element) => {
      const data = element.data
      return [
        element.group ?? "node",
        readId(data.id) ?? "",
        readId(data.source) ?? "",
        readId(data.target) ?? "",
        readString(data.label) ?? "",
        readNumber(data.weight, 1),
      ].join("|")
    })
    .join("::")
}

function themeSignature(theme: CytoscapeThemeTokens) {
  return Object.values(theme).join("|")
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

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : null
}

function readNumber(value: unknown, fallback: number) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value
  }

  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}

function readErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message
  }

  return String(error)
}
