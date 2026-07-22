import { Check, Clock, Plus, Repeat, Snowflake, X } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import type {
  ShoppingCooldown,
  ShoppingItem,
  ShoppingModuleData,
} from "@/features/bettertolive/types"
import { ShoppingStatus } from "@/features/bettertolive/types"
import { getBetterToLiveApi } from "@/features/bettertolive/api/bettertolive-api"
import { itemPrimaryStatus } from "@/features/bettertolive/shopping/shopping-page-data"

const DEFAULT_COOLDOWN_HOURS = 72

function formatRemaining(ms: number): { text: string; expired: boolean } {
  if (ms <= 0) return { text: "可以决定了", expired: true }
  const totalSec = Math.floor(ms / 1000)
  const d = Math.floor(totalSec / 86400)
  const h = Math.floor((totalSec % 86400) / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n: number) => String(n).padStart(2, "0")
  const hms = `${pad(h)}:${pad(m)}:${pad(s)}`
  return { text: d > 0 ? `${d}天 ${hms}` : hms, expired: false }
}

export function ShoppingCooldownTab({
  shopping,
  isControlMode = false,
  onRefresh,
}: {
  shopping: ShoppingModuleData
  isControlMode?: boolean
  onRefresh?: () => void
}) {
  const { t } = useTranslation()
  const cooldowns = shopping.cooldowns
  const [now, setNow] = useState(() => Date.now())
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const wantedItems = useMemo(
    () => shopping.items.filter((item) => itemPrimaryStatus(item) === ShoppingStatus.Wanted),
    [shopping.items],
  )

  const cooldownItems = useMemo(
    () => shopping.cooldowns.map((cd) => cd.itemId),
    [shopping.cooldowns],
  )

  const availableItems = useMemo(
    () => wantedItems.filter((item) => !cooldownItems.includes(item.id)),
    [wantedItems, cooldownItems],
  )

  const act = async (id: string, fn: () => Promise<unknown>, successKey: string) => {
    setPendingId(id)
    try {
      await fn()
      toast.success(t(successKey))
      onRefresh?.()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e))
    } finally {
      setPendingId(null)
    }
  }

  const api = getBetterToLiveApi()

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Snowflake className="text-muted-foreground size-4 shrink-0" />
          <p className="text-muted-foreground truncate text-sm">{t("shopping.cooldown.lead")}</p>
        </div>
        {isControlMode && (
          <Button
            size="sm"
            variant="outline"
            disabled={availableItems.length === 0}
            onClick={() => setAdding(true)}
          >
            <Plus className="size-4" />
            {t("shopping.cooldown.add")}
          </Button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
        {cooldowns.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-2xl border border-dashed px-6 py-10 text-center">
            <p className="text-muted-foreground text-sm leading-6">
              {t("shopping.cooldown.empty")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {cooldowns.map((cd) => (
              <CooldownRow
                key={cd.id}
                cooldown={cd}
                now={now}
                pending={pendingId === cd.id}
                onKeep={() =>
                  act(
                    cd.id,
                    () => api.resolveShoppingCooldown(cd.id, "kept"),
                    "shopping.cooldown.toastKept",
                  )
                }
                onExtend={() =>
                  act(
                    cd.id,
                    () => api.extendShoppingCooldown(cd.id),
                    "shopping.cooldown.toastExtended",
                  )
                }
                onRelease={() =>
                  act(
                    cd.id,
                    () => api.resolveShoppingCooldown(cd.id, "released"),
                    "shopping.cooldown.toastReleased",
                  )
                }
              />
            ))}
          </div>
        )}
      </div>

      {adding && (
        <CooldownAddDialog
          items={availableItems}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false)
            onRefresh?.()
          }}
        />
      )}
    </div>
  )
}

function CooldownRow({
  cooldown,
  now,
  pending,
  onKeep,
  onExtend,
  onRelease,
}: {
  cooldown: ShoppingCooldown
  now: number
  pending: boolean
  onKeep: () => void
  onExtend: () => void
  onRelease: () => void
}) {
  const { t } = useTranslation()
  const remaining = formatRemaining(new Date(cooldown.releaseAt).getTime() - now)
  const extended = cooldown.extendCount > 0

  return (
    <div className="border-foreground/10 bg-card flex flex-col gap-3 rounded-2xl border p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{cooldown.itemName}</div>
          {cooldown.note ? (
            <p className="text-muted-foreground mt-1 line-clamp-2 text-xs leading-5">
              {cooldown.note}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <div
            className={
              "font-mono text-lg font-semibold tabular-nums " +
              (remaining.expired ? "text-secondary-foreground" : "text-accent-foreground")
            }
          >
            {remaining.text}
          </div>
          <div className="text-muted-foreground flex items-center gap-1 text-[11px]">
            <Clock className="size-3" />
            {remaining.expired ? t("shopping.cooldown.ready") : t("shopping.cooldown.counting")}
            {extended
              ? ` · ${t("shopping.cooldown.extended", { count: cooldown.extendCount })}`
              : ""}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={onKeep}
          className="bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Check className="size-4" />
          {t("shopping.cooldown.keep")}
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={onExtend}>
          <Repeat className="size-4" />
          {t("shopping.cooldown.extend")}
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={onRelease}>
          <X className="size-4" />
          {t("shopping.cooldown.release")}
        </Button>
      </div>
    </div>
  )
}

function CooldownAddDialog({
  items,
  onClose,
  onSaved,
}: {
  items: ShoppingItem[]
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const api = getBetterToLiveApi()
  const [itemId, setItemId] = useState<string>(items[0]?.id ?? "")
  const [note, setNote] = useState("")
  const [hours, setHours] = useState<number>(DEFAULT_COOLDOWN_HOURS)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!itemId) {
      toast.error(t("shopping.cooldown.pickItem"))
      return
    }
    setSaving(true)
    try {
      await api.createShoppingCooldown(itemId, note || undefined, hours)
      toast.success(t("shopping.cooldown.toastAdded"))
      onSaved()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("shopping.cooldown.addTitle")}</DialogTitle>
          <DialogDescription>{t("shopping.cooldown.addDescription")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-1">
          <div className="grid gap-1.5">
            <Label>{t("shopping.cooldown.itemLabel")}</Label>
            <Select value={itemId} onValueChange={(v) => setItemId(v ?? "")}>
              <SelectTrigger>
                <SelectValue placeholder={t("shopping.cooldown.pickItem")} />
              </SelectTrigger>
              <SelectContent>
                {items.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>{t("shopping.cooldown.hoursLabel")}</Label>
            <Select value={String(hours)} onValueChange={(v) => setHours(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24h</SelectItem>
                <SelectItem value="48">48h</SelectItem>
                <SelectItem value="72">72h</SelectItem>
                <SelectItem value="168">168h</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-1.5">
            <Label>{t("shopping.cooldown.noteLabel")}</Label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t("shopping.cooldown.notePlaceholder")}
              rows={2}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            {t("common.actions.cancel")}
          </Button>
          <Button onClick={save} disabled={saving || !itemId}>
            {t("shopping.cooldown.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
