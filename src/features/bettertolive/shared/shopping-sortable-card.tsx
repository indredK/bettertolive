import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"

interface SortableShoppingCardProps {
  id: string
  children: ReactNode
  disabled?: boolean
}

export function SortableShoppingCard({ id, children, disabled }: SortableShoppingCardProps) {
  const { t } = useTranslation()
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
      className={cn("relative w-full min-w-0 shrink-0 select-none", isDragging && "z-10")}
    >
      {/* Visual drag indicator — three tiny dots on the left edge */}
      {!disabled ? (
        <button
          type="button"
          aria-label={t("common.sortable.dragHandle")}
          {...attributes}
          {...listeners}
          className="focus-visible:ring-ring absolute top-1/2 left-3 z-10 flex -translate-y-1/2 cursor-grab flex-col items-center gap-[1.5px] rounded-sm px-1 py-2 outline-none focus-visible:ring-2 active:cursor-grabbing"
        >
          <div className="bg-muted-foreground size-[2px] rounded-full" />
          <div className="bg-muted-foreground size-[2px] rounded-full" />
          <div className="bg-muted-foreground size-[2px] rounded-full" />
        </button>
      ) : null}
      <div className={cn(isDragging && "opacity-40")}>{children}</div>
    </div>
  )
}
