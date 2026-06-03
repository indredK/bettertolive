import { Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { ShoppingStageChecklist } from "@/features/bettertolive/types"
import { ChecklistBlock } from "@/features/bettertolive/ui/shopping-page"
import { cn } from "@/lib/utils"

const STAGE_DETAIL_DIALOG_CLASS = "w-[min(1040px,calc(100vw-2rem))] max-w-none p-0 sm:max-w-none"

function SystemChip({ label }: { label: string }) {
  return (
    <Badge
      variant="outline"
      className="border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] text-[color:var(--text-muted)]"
    >
      {label}
    </Badge>
  )
}

export function ShoppingStageDetailDialog({
  checklist,
  open,
  onOpenChange,
}: {
  checklist: ShoppingStageChecklist | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  if (!checklist) {
    return null
  }

  const sectionCount = checklist.sections.length
  const totalItems = checklist.sections.reduce(
    (sum, s) => sum + s.minimum.length + s.essentials.length + s.upgrades.length,
    0,
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          STAGE_DETAIL_DIALOG_CLASS,
          "border border-[color:var(--surface-border)] bg-[color:var(--dialog-bg)] text-[color:var(--text-primary)] ring-[color:var(--surface-border)]",
        )}
      >
        <div className="max-h-[calc(100vh-2rem)] overflow-y-auto">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="size-5" />
              {checklist.title}
            </DialogTitle>
            <DialogDescription className="leading-6 text-[color:var(--text-secondary)]">
              {checklist.description}
            </DialogDescription>
          </DialogHeader>

          <div className="px-5 pb-5">
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-muted)]"
              >
                {checklist.stage}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "border",
                  "border-[color:var(--tone-present-border)] bg-[color:var(--tone-present-bg)] text-[color:var(--tone-present-ink)]",
                )}
              >
                {sectionCount} 个系统
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "border",
                  "border-[color:var(--tone-value-border)] bg-[color:var(--tone-value-bg)] text-[color:var(--tone-value-ink)]",
                )}
              >
                {totalItems} 条物品
              </Badge>
            </div>

            <p className="mt-4 text-sm leading-6 text-[color:var(--text-secondary)]">
              {checklist.focus}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {checklist.sections.map((section) => (
                <SystemChip key={section.system} label={section.system} />
              ))}
            </div>

            <div className="mt-6 space-y-4">
              {checklist.sections.map((section) => (
                <div
                  key={section.system}
                  className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4"
                >
                  <div className="flex items-center gap-2">
                    <SystemChip label={section.system} />
                  </div>
                  <div className="mt-4 grid gap-4 min-[960px]:grid-cols-3">
                    <ChecklistBlock title="最低配置" items={section.minimum} />
                    <ChecklistBlock title="必要物品" items={section.essentials} />
                    <ChecklistBlock title="之后再升级" items={section.upgrades} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
