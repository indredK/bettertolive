import { AlertTriangle, CircleDollarSign, ShoppingBasket } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TabsContent } from "@/components/ui/tabs"
import type { ShoppingModuleData } from "@/features/bettertolive/types"
import { EmptyState, SectionHeading, Surface } from "@/features/bettertolive/ui/shared/shared"
import type { ShoppingPlanWithLane } from "@/features/bettertolive/ui/shopping/shopping-system-detail-dialog"
import {
  DEPRECIATION_STYLES,
  LIFECYCLE_STYLES,
} from "@/features/bettertolive/ui/shopping/shopping-page-data"
import {
  CompactItemRow,
  PurchaseDecisionCard,
} from "@/features/bettertolive/ui/shopping/shopping-page-shared"
import { cn } from "@/lib/utils"

function formatPrice(amount: number) {
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format(amount)
}

export function ShoppingPlanningTab({
  shopping,
  priorityItems,
  isWideLayout,
  isFixedLayout,
}: {
  shopping: ShoppingModuleData
  priorityItems: ShoppingPlanWithLane[]
  isWideLayout: boolean
  isFixedLayout: boolean
}) {
  return (
    <TabsContent
      value="planning"
      className={cn("space-y-4", isFixedLayout && "min-h-0 flex-1 overflow-hidden")}
    >
      <div
        className={cn(
          "grid gap-4 min-[1400px]:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.8fr)]",
          isFixedLayout && "h-full min-h-0",
        )}
      >
        <div className={cn("space-y-4", isFixedLayout && "min-h-0 overflow-y-auto pr-1")}>
          {shopping.purchaseLanes.map((lane) => (
            <Surface key={lane.id} className={cn("p-5", isWideLayout && "p-4")}>
              <SectionHeading
                compact={isWideLayout}
                icon={ShoppingBasket}
                title={lane.title}
                description={lane.subtitle}
              />

              <div className={cn("mt-5 space-y-5", isWideLayout && "mt-4 space-y-4")}>
                {lane.items.length > 0 ? (
                  lane.items.map((item) => (
                    <PurchaseDecisionCard
                      key={item.id}
                      item={{ ...item, laneId: lane.id, laneTitle: lane.title }}
                      compact={isWideLayout}
                    />
                  ))
                ) : (
                  <EmptyState message={`当前筛选下，${lane.title} 暂时没有条目。`} compact />
                )}
              </div>
            </Surface>
          ))}
        </div>

        <div className={cn("space-y-4", isFixedLayout && "min-h-0 overflow-y-auto pr-1")}>
          <Surface className={cn("p-5", isWideLayout && "p-4")}>
            <SectionHeading
              compact={isWideLayout}
              icon={CircleDollarSign}
              title="价格参考"
              description="这里不是绝对标准，而是帮你形成自己的价格感，并把 system、lifecycle、depreciation 放回同一张决策卡里。"
            />

            <div className="mt-5">
              {shopping.priceReferences.length > 0 ? (
                <Table className={cn(isWideLayout && "text-[13px]")}>
                  <TableHeader>
                    <TableRow className="border-[color:var(--muted-surface-border)]">
                      <TableHead className={cn(isWideLayout && "h-8 text-xs")}>类别</TableHead>
                      <TableHead className={cn(isWideLayout && "h-8 text-xs")}>系统</TableHead>
                      <TableHead className={cn(isWideLayout && "h-8 text-xs")}>入门价</TableHead>
                      <TableHead className={cn(isWideLayout && "h-8 text-xs")}>舒服区间</TableHead>
                      <TableHead className={cn(isWideLayout && "h-8 text-xs")}>偏贵</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shopping.priceReferences.map((entry) => (
                      <TableRow
                        key={entry.id}
                        className="border-[color:var(--muted-surface-border)]"
                      >
                        <TableCell
                          className={cn(
                            "font-medium whitespace-normal text-[color:var(--text-primary)]",
                            isWideLayout && "py-1.5",
                          )}
                        >
                          <div>{entry.category}</div>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            <Badge variant="outline" className={LIFECYCLE_STYLES[entry.lifecycle]}>
                              {entry.lifecycle}
                            </Badge>
                            {entry.depreciation ? (
                              <Badge
                                variant="outline"
                                className={DEPRECIATION_STYLES[entry.depreciation]}
                              >
                                {entry.depreciation}
                              </Badge>
                            ) : null}
                          </div>
                          <div
                            className={cn(
                              "mt-2 text-xs leading-5 text-[color:var(--text-muted)]",
                              isWideLayout && "text-[11px]",
                            )}
                          >
                            {entry.note}
                          </div>
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-[color:var(--text-secondary)]",
                            isWideLayout && "py-1.5",
                          )}
                        >
                          {entry.system}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-[color:var(--text-secondary)]",
                            isWideLayout && "py-1.5",
                          )}
                        >
                          {formatPrice(entry.entryPrice)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-[color:var(--text-secondary)]",
                            isWideLayout && "py-1.5",
                          )}
                        >
                          {formatPrice(entry.sweetSpotPrice)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-[color:var(--text-secondary)]",
                            isWideLayout && "py-1.5",
                          )}
                        >
                          {formatPrice(entry.overpayPrice)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState message="当前筛选下没有价格参考。" />
              )}
            </div>
          </Surface>

          <Surface className={cn("p-5", isWideLayout && "p-4")}>
            <SectionHeading
              compact={isWideLayout}
              icon={AlertTriangle}
              title="当前最真实的待补清单"
              description="把最低配置和必要项单独拎出来，能防止幸福感物品遮住真正的系统缺口。"
            />

            {priorityItems.length > 0 ? (
              <div className="mt-5 space-y-3">
                {priorityItems.map((item) => (
                  <CompactItemRow key={item.id} item={item} sourceLabel={item.laneTitle} />
                ))}
              </div>
            ) : (
              <EmptyState message="当前筛选下没有必要缺口。" compact />
            )}
          </Surface>
        </div>
      </div>
    </TabsContent>
  )
}
