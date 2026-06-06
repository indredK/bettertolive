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
      className={cn("relative w-full min-w-0 flex-1 select-none", isDragging && "z-10")}
    >
      {/* Visual drag indicator — three tiny dots on the left edge */}
      {!disabled ? (
        <button
          type="button"
          aria-label="拖动排序"
          {...attributes}
          {...listeners}
          className="focus-visible:ring-primary absolute top-1/2 left-1 z-10 flex -translate-y-1/2 cursor-grab flex-col items-center gap-[1.5px] rounded-sm px-1 py-2 outline-none focus-visible:ring-2 active:cursor-grabbing"
        >
          <div className="size-[2px] rounded-full bg-[color:var(--text-muted)]" />
          <div className="size-[2px] rounded-full bg-[color:var(--text-muted)]" />
          <div className="size-[2px] rounded-full bg-[color:var(--text-muted)]" />
        </button>
      ) : null}
      <div className={cn(isDragging && "opacity-40")}>{children}</div>
    </div>
  )
}
