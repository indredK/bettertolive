import { forwardRef, type ComponentProps, type ReactNode } from "react"
import { Button as ButtonPrimitive } from "@base-ui/react/button"
import { cva, type VariantProps } from "class-variance-authority"
import { AnimatePresence, m, type Transition, useReducedMotion } from "motion/react"

import {
  ACTION_BUTTON_PRESENCE,
  ACTION_BUTTON_TRANSITION,
  BUTTON_TAP_SCALE,
  type PresenceMotion,
} from "@/lib/app-motion"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

const buttonVariants = cva(
  "group/button inline-flex cursor-pointer shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:cursor-default disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border bg-background hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_5%)] aria-expanded:bg-secondary aria-expanded:text-secondary-foreground",
        ghost:
          "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground dark:hover:bg-muted/50",
        destructive:
          "bg-destructive/10 text-destructive hover:bg-destructive/20 focus-visible:border-destructive/40 focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:hover:bg-destructive/30 dark:focus-visible:ring-destructive/40",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default:
          "h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-[min(var(--radius-md),12px)] px-2.5 text-[0.8rem] in-data-[slot=button-group]:rounded-lg has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: "h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2",
        icon: "size-8",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] in-data-[slot=button-group]:rounded-lg [&_svg:not([class*='size-'])]:size-3",
        "icon-sm":
          "size-7 rounded-[min(var(--radius-md),12px)] in-data-[slot=button-group]:rounded-lg",
        "icon-lg": "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

const actionGroupVariants = cva("flex shrink-0 items-center gap-2", {
  variants: {
    align: {
      start: "items-start",
      center: "items-center",
      end: "items-end",
    },
    gap: {
      default: "gap-2",
      compact: "gap-1",
      loose: "gap-3",
    },
    justify: {
      start: "justify-start",
      end: "justify-end",
      between: "justify-between",
    },
    wrap: {
      true: "flex-wrap",
      false: "flex-nowrap",
    },
  },
  defaultVariants: {
    align: "center",
    gap: "default",
    justify: "start",
    wrap: true,
  },
})

type ButtonProps = ButtonPrimitive.Props &
  VariantProps<typeof buttonVariants> & {
    tooltip?: ReactNode | null
  }
type ActionGroupProps = ComponentProps<"div"> & VariantProps<typeof actionGroupVariants>

const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "default", size = "default", tooltip, ...props },
  ref,
) {
  const button = (
    <ButtonPrimitive
      ref={ref}
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )

  if (tooltip == null) {
    return button
  }

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  )
})

type AnimatedButtonProps = ButtonProps & {
  show: boolean
  containerClassName?: string
  presence?: Partial<PresenceMotion>
  reducedMotionPresence?: Partial<PresenceMotion>
  presenceMode?: ComponentProps<typeof AnimatePresence>["mode"]
  layout?: boolean
  transition?: Transition
}

const REDUCED_MOTION_BUTTON_PRESENCE: PresenceMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

function ActionGroup({ align, className, gap, justify, wrap, ...props }: ActionGroupProps) {
  return (
    <div
      data-slot="button-group"
      className={cn(actionGroupVariants({ align, gap, justify, wrap }), className)}
      {...props}
    />
  )
}

function AnimatedButton({
  show,
  containerClassName,
  presence,
  reducedMotionPresence,
  presenceMode = "wait",
  layout = true,
  transition = ACTION_BUTTON_TRANSITION,
  tooltip,
  ...props
}: AnimatedButtonProps) {
  const prefersReducedMotion = useReducedMotion()
  const resolvedPresence: PresenceMotion = {
    initial: presence?.initial ?? ACTION_BUTTON_PRESENCE.initial,
    animate: presence?.animate ?? ACTION_BUTTON_PRESENCE.animate,
    exit: presence?.exit ?? ACTION_BUTTON_PRESENCE.exit,
  }
  const resolvedReducedMotionPresence: PresenceMotion = {
    initial: reducedMotionPresence?.initial ?? REDUCED_MOTION_BUTTON_PRESENCE.initial,
    animate: reducedMotionPresence?.animate ?? REDUCED_MOTION_BUTTON_PRESENCE.animate,
    exit: reducedMotionPresence?.exit ?? REDUCED_MOTION_BUTTON_PRESENCE.exit,
  }
  return (
    <AnimatePresence initial={false} mode={presenceMode}>
      {show ? (
        <m.span
          layout={layout}
          whileTap={{ scale: BUTTON_TAP_SCALE }}
          initial={
            prefersReducedMotion ? resolvedReducedMotionPresence.initial : resolvedPresence.initial
          }
          animate={
            prefersReducedMotion ? resolvedReducedMotionPresence.animate : resolvedPresence.animate
          }
          exit={prefersReducedMotion ? resolvedReducedMotionPresence.exit : resolvedPresence.exit}
          transition={transition}
          style={{ perspective: 1200, transformStyle: "preserve-3d" }}
          className={cn("inline-flex origin-center", containerClassName)}
        >
          <Button {...props} tooltip={tooltip} />
        </m.span>
      ) : null}
    </AnimatePresence>
  )
}

type AnimatedIconButtonProps = Omit<AnimatedButtonProps, "children"> & {
  icon: ReactNode
  label: string
  children?: ReactNode
  tooltip?: ReactNode | null
}

function AnimatedIconButton({
  children,
  icon,
  label,
  tooltip,
  size = children ? "sm" : "icon-sm",
  type = "button",
  ...props
}: AnimatedIconButtonProps) {
  const resolvedTooltip = tooltip === undefined ? (children ? null : label) : tooltip

  return (
    <AnimatedButton aria-label={label} size={size} tooltip={resolvedTooltip} type={type} {...props}>
      {icon}
      {children ?? <span className="sr-only">{label}</span>}
    </AnimatedButton>
  )
}

export { ActionGroup, AnimatedButton, AnimatedIconButton, Button, buttonVariants }
