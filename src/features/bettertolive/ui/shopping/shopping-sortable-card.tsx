import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

interface SortableShoppingCardProps {
  id: string
  children: ReactNode
  disabled?: boolean
}

export function SortableShoppingCard({ id, children, disabled }: SortableShoppingCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "relative select-none",
        !disabled && "cursor-grab active:cursor-grabbing",
        isDragging && "z-10",
      )}
    >
      {/* Visual drag indicator — three tiny dots on the left edge */}
      {!disabled ? (
        <div className="pointer-events-none absolute top-1/2 left-1 z-10 flex shrink-0 -translate-y-1/2 flex-col items-center gap-[1.5px] py-0.5">
          <div className="size-[2px] rounded-full bg-[color:var(--text-muted)]" />
          <div className="size-[2px] rounded-full bg-[color:var(--text-muted)]" />
          <div className="size-[2px] rounded-full bg-[color:var(--text-muted)]" />
        </div>
      ) : null}
      <div className={cn(isDragging && "opacity-40")}>{children}</div>
    </div>
  )
}
