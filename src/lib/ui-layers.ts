export const UI_LAYERS = {
  header: "z-[20]",
  /** SVG link overlay behind star-map nodes */
  starMapLink: "z-[1]",
  /** Internal canvas elements (e.g., star-map layers) */
  canvas: "z-[4]",
  /** Gantt chart timeline markers */
  ganttMarker: "z-[50]",
  utilityPanel: "z-[90]",
  notifications: "z-[100]",
  dialogOverlay: "z-[140]",
  dialogContent: "z-[150]",
  floatingContent: "z-[160]",
  /** Fullscreen graph overlay (above all floating UI) */
  graphFullscreen: "z-[200]",
} as const
