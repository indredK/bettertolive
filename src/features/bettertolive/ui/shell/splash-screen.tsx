import { useEffect, useState } from "react"
import { AnimatePresence, m } from "motion/react"
import { useTranslation } from "react-i18next"
import { UI_LAYERS } from "@/lib/ui-layers"

interface SplashScreenProps {
  onComplete: () => void
}

const W = 480
const H = 360
const CX = W / 2
const CY = H / 2

const NODE_DIST = 142

const LIFE_AREAS = [
  { labelKey: "splash.nodes.inner", color: "var(--splash-inner)", angle: -90 },
  { labelKey: "splash.nodes.records", color: "var(--splash-records)", angle: -30 },
  { labelKey: "splash.nodes.relationships", color: "var(--splash-relationships)", angle: 30 },
  { labelKey: "splash.nodes.journey", color: "var(--splash-journey)", angle: 90 },
  { labelKey: "splash.nodes.legacy", color: "var(--splash-legacy)", angle: 150 },
  { labelKey: "splash.nodes.social", color: "var(--splash-social)", angle: 210 },
]

const NODES = LIFE_AREAS.map((area, i) => {
  const rad = (area.angle * Math.PI) / 180
  return {
    ...area,
    x: CX + NODE_DIST * Math.cos(rad),
    y: CY + NODE_DIST * Math.sin(rad),
    delay: 0.52 + i * 0.1,
  }
})

type ResolvedNode = (typeof NODES)[number] & { label: string }

function ConstellationSVG({ nodes }: { nodes: ResolvedNode[] }) {
  return (
    <m.svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: `min(92vw, ${W}px)`, height: "auto" }}
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
    >
      <defs>
        <filter id="spl-node-glow" x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="spl-center-glow" x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ambient center halo */}
      <m.circle
        cx={CX}
        cy={CY}
        r={62}
        fill="var(--splash-inner)"
        fillOpacity={0.06}
        initial={{ r: 0, opacity: 0 }}
        animate={{ r: 62, opacity: 1 }}
        transition={{ delay: 0.18, duration: 0.7, ease: "easeOut" }}
      />

      {/* Spoke lines: center → nodes */}
      {nodes.map((node, i) => (
        <m.path
          key={`spoke-${i}`}
          d={`M ${CX} ${CY} L ${node.x} ${node.y}`}
          stroke={node.color}
          strokeOpacity={0.2}
          strokeWidth={1}
          fill="none"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ delay: node.delay, duration: 0.7, ease: "easeInOut" }}
        />
      ))}

      {/* Perimeter ring connecting adjacent nodes */}
      {nodes.map((node, i) => {
        const next = nodes[(i + 1) % nodes.length]
        return (
          <m.path
            key={`rim-${i}`}
            d={`M ${node.x} ${node.y} L ${next.x} ${next.y}`}
            stroke={node.color}
            strokeOpacity={0.11}
            strokeWidth={0.8}
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: node.delay + 0.3, duration: 0.52, ease: "easeInOut" }}
          />
        )
      })}

      {/* Node dots */}
      {nodes.map((node, i) => (
        <m.circle
          key={`dot-${i}`}
          cx={node.x}
          cy={node.y}
          r={5.5}
          fill={node.color}
          filter="url(#spl-node-glow)"
          initial={{ r: 0, opacity: 0 }}
          animate={{ r: 5.5, opacity: 0.84 }}
          transition={{ delay: node.delay, duration: 0.42, ease: [0.2, 0, 0, 1] }}
        />
      ))}

      {/* Node labels */}
      {nodes.map((node, i) => {
        const dx = node.x - CX
        const dy = node.y - CY
        const mag = Math.sqrt(dx * dx + dy * dy)
        return (
          <m.text
            key={`lbl-${i}`}
            x={node.x + (dx / mag) * 17}
            y={node.y + (dy / mag) * 17}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fontFamily="Geist Variable, -apple-system, sans-serif"
            fill="var(--splash-star)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.58 }}
            transition={{ delay: node.delay + 0.22, duration: 0.4 }}
          >
            {node.label}
          </m.text>
        )
      })}

      {/* One-shot pulse ring */}
      <m.circle
        cx={CX}
        cy={CY}
        r={14}
        fill="none"
        stroke="var(--splash-inner)"
        strokeOpacity={0.5}
        strokeWidth={1.5}
        initial={{ r: 14, opacity: 0 }}
        animate={{ r: [14, 14, 42], opacity: [0, 0.75, 0] }}
        transition={{ delay: 0.38, duration: 1.5, ease: "easeOut", times: [0, 0.1, 1] }}
      />

      {/* Center diamond */}
      <m.polygon
        points={`${CX},${CY - 10} ${CX + 10},${CY} ${CX},${CY + 10} ${CX - 10},${CY}`}
        fill="var(--splash-node-fill)"
        filter="url(#spl-center-glow)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.92 }}
        transition={{ delay: 0.32, duration: 0.5 }}
      />

      {/* Center core dot */}
      <m.circle
        cx={CX}
        cy={CY}
        r={4}
        fill="var(--splash-node-shadow)"
        initial={{ r: 0 }}
        animate={{ r: 4 }}
        transition={{ delay: 0.32, duration: 0.4, ease: "easeOut" }}
      />
    </m.svg>
  )
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(true)

  const nodes: ResolvedNode[] = NODES.map((n) => ({ ...n, label: t(n.labelKey) }))

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 2450)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence onExitComplete={onComplete}>
      {visible && (
        <m.div
          key="splash"
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } }}
          className={`fixed inset-0 ${UI_LAYERS.floatingContent} flex flex-col items-center justify-center overflow-hidden select-none`}
          style={{
            background: [
              "radial-gradient(ellipse at 22% 18%, rgba(207,224,245,0.88), transparent 45%)",
              "radial-gradient(ellipse at 82% 12%, rgba(238,224,198,0.72), transparent 40%)",
              "linear-gradient(168deg, var(--splash-bg-start) 0%, var(--splash-bg-end) 100%)",
            ].join(", "),
          }}
        >
          {/* Subtle dot grid */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(15,23,42,0.055) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          <ConstellationSVG nodes={nodes} />

          {/* Branding */}
          <div className="mt-2 flex flex-col items-center gap-1.5">
            <m.span
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.48, duration: 0.55, ease: [0.2, 0, 0, 1] }}
              style={{
                fontFamily: "Geist Variable, -apple-system, sans-serif",
                fontSize: "1.25rem",
                fontWeight: 500,
                letterSpacing: "-0.03em",
                color: "var(--splash-brand)",
                lineHeight: 1,
              }}
            >
              bettertolive
            </m.span>
            <m.span
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.78, duration: 0.5, ease: [0.2, 0, 0, 1] }}
              style={{
                fontFamily: "Geist Variable, -apple-system, sans-serif",
                fontSize: "0.75rem",
                fontWeight: 400,
                color: "var(--splash-subtitle)",
                letterSpacing: "0.025em",
              }}
            >
              {t("splash.tagline")}
            </m.span>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
