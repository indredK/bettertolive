import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type {
  ShoppingItem,
  ShoppingSpaceDefinition,
  ShoppingSystemDefinition,
} from "@/features/bettertolive/types"
import {
  SPACE_CHIP_STYLE,
  STATUS_STYLES,
  SYSTEM_CHIP_STYLE,
  itemPrimaryStatus,
  statusDisplayName,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"
import { cn } from "@/lib/utils"

export const SHOPPING_DIALOG_CONTENT_CLASS = "border border-foreground/10 bg-background shadow-lg"

export const SHOPPING_DIALOG_HEADER_CLASS =
  "sticky top-0 z-10 -mx-4 -mt-4 border-b border-foreground/10 bg-background/95 px-4 pt-4 pb-3 pr-12 supports-[backdrop-filter]:bg-background/90 supports-[backdrop-filter]:backdrop-blur-xs"

export const SHOPPING_DIALOG_SECTION_CLASS =
  "space-y-3 rounded-xl border border-foreground/10 bg-card/70 p-4"

export const SHOPPING_DIALOG_PANEL_CLASS =
  "rounded-lg border border-foreground/10 bg-background/85 p-4"

export const SHOPPING_DIALOG_FIELD_CLASS = "w-full border-foreground/15 bg-background shadow-sm"

export const SHOPPING_DIALOG_FOOTER_CLASS =
  "sticky bottom-0 z-10 gap-2 border-foreground/10 bg-background/95 supports-[backdrop-filter]:bg-background/90 supports-[backdrop-filter]:backdrop-blur-xs"

/**
 * 物品卡片(各 Tab 复用)。
 * 展示物品的核心信息:名称、状态、标签、子级、价格、备注。
 */
export function ItemCard({
  item,
  systemDefinitions,
  spaceDefinitions,
  onEdit,
}: {
  item: ShoppingItem
  systemDefinitions: ShoppingSystemDefinition[]
  spaceDefinitions: ShoppingSpaceDefinition[]
  onEdit?: () => void
}) {
  const { t } = useTranslation()
  const status = itemPrimaryStatus(item)

  const systemNames = item.systemTags
    .map((id) => systemDefinitions.find((s) => s.id === id)?.name ?? id)
    .filter(Boolean)
  const spaceNames = item.spaceTags
    .map((id) => spaceDefinitions.find((s) => s.id === id)?.name ?? id)
    .filter(Boolean)

  return (
    <div
      className="bg-card flex cursor-pointer flex-col gap-2 rounded-md border p-3 hover:shadow-sm"
      role={onEdit ? "button" : undefined}
      onClick={onEdit}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="font-medium">{item.name}</div>
        <Badge variant="outline" className={STATUS_STYLES[status]}>
          {statusDisplayName(status, t)}
        </Badge>
      </div>

      {item.children.length > 0 && (
        <div className="text-muted-foreground text-xs">
          {item.children.map((c) => c.name).join(" / ")}
        </div>
      )}

      <div className="flex flex-wrap gap-1">
        {systemNames.map((n) => (
          <Badge key={`sys-${n}`} variant="outline" className={SYSTEM_CHIP_STYLE}>
            {n}
          </Badge>
        ))}
        {spaceNames.map((n) => (
          <Badge key={`spc-${n}`} variant="outline" className={SPACE_CHIP_STYLE}>
            {n}
          </Badge>
        ))}
      </div>

      {item.note && <div className="text-muted-foreground text-xs">{item.note}</div>}
    </div>
  )
}

/** 简易名字标签栏 */
export function NameTagBar({ names, className }: { names: string[]; className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-1 text-xs", className)}>
      {names.map((n) => (
        <span
          key={n}
          className="border-border bg-muted text-muted-foreground rounded-md border px-2 py-0.5"
        >
          {n}
        </span>
      ))}
    </div>
  )
}

export function ShoppingTabViewport({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn("flex h-full min-h-0 flex-col gap-4", className)}>{children}</div>
}

export function ShoppingTabBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex min-h-0 flex-1 flex-col gap-3 lg:flex-row", className)}>
      {children}
    </div>
  )
}

export function ShoppingSidebarPane({
  children,
  className,
  contentClassName,
}: {
  children: ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <Card className={cn("min-h-0 lg:w-72 lg:shrink-0", className)}>
      <CardContent className={cn("flex min-h-0 flex-col overflow-y-auto p-3", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  )
}

export function ShoppingDetailPane({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={cn("min-h-0 flex-1", className)}>{children}</div>
}

export function ShoppingEmptyDetailCard({ message }: { message: string }) {
  return (
    <Card className="flex h-full items-center justify-center p-8">
      <p className="text-muted-foreground text-sm">{message}</p>
    </Card>
  )
}

export function ShoppingStatusColumnCard({
  title,
  count,
  emptyMessage,
  children,
  className,
  contentClassName,
}: {
  title: string
  count: number
  emptyMessage: string
  children?: ReactNode
  className?: string
  contentClassName?: string
}) {
  return (
    <Card className={cn("flex min-h-0 flex-col overflow-hidden", className)}>
      <CardHeader className="shrink-0 pb-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Badge variant="outline" className="text-muted-foreground text-[10px]">
            {count}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className={cn("min-h-0 flex-1 space-y-3 overflow-y-auto", contentClassName)}>
        {count > 0 ? (
          children
        ) : (
          <div className="text-muted-foreground rounded-lg border border-dashed px-4 py-6 text-center text-xs">
            {emptyMessage}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
