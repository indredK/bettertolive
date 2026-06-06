import * as React from "react"
import { cn } from "@/lib/utils"

type CheckboxProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> & {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

/**
 * 极简 checkbox 实现(原生 input)。
 * 没有引入 @radix-ui/react-checkbox 依赖,API 与 shadcn 的 Checkbox 兼容:checked / onCheckedChange。
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className={cn("border-input accent-primary h-4 w-4 rounded border", className)}
        {...props}
      />
    )
  },
)
Checkbox.displayName = "Checkbox"
