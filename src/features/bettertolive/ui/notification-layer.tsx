import {
  BellRing,
  CheckCircle2,
  ExternalLink,
  Info,
  type LucideIcon,
  Pin,
  TriangleAlert,
  X,
} from "lucide-react"
import { AnimatePresence, m } from "motion/react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { WorkspaceNotification } from "@/features/bettertolive/notifications"
import { getWorkspaceViewLabel } from "@/features/bettertolive/view-labels"
import {
  APP_FADE_TRANSITION,
  NOTIFICATION_MESSAGE_PRESENCE,
  NOTIFICATION_TOAST_PRESENCE,
} from "@/lib/app-motion"
import { UI_LAYERS } from "@/lib/ui-layers"
import { cn } from "@/lib/utils"

const NOTIFICATION_TONE_STYLES = {
  info: {
    card: "border-sky-200/80 bg-white/96 text-slate-900",
    icon: "bg-sky-100 text-sky-700",
    label: "border-sky-200 bg-sky-50 text-sky-700",
  },
  success: {
    card: "border-emerald-200/80 bg-white/96 text-slate-900",
    icon: "bg-emerald-100 text-emerald-700",
    label: "border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  warning: {
    card: "border-amber-200/80 bg-white/96 text-slate-900",
    icon: "bg-amber-100 text-amber-800",
    label: "border-amber-200 bg-amber-50 text-amber-800",
  },
  neutral: {
    card: "border-slate-200/80 bg-white/96 text-slate-900",
    icon: "bg-slate-100 text-slate-700",
    label: "border-slate-200 bg-slate-50 text-slate-700",
  },
} as const

const NOTIFICATION_TONE_ICONS: Record<
  NonNullable<WorkspaceNotification["tone"]>,
  LucideIcon
> = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  neutral: Pin,
}

export function NotificationLayer({
  notifications,
  selectedNotification,
  onDismiss,
  onOpenDetail,
  onCloseDetail,
  onActivateTarget,
}: {
  notifications: WorkspaceNotification[]
  selectedNotification: WorkspaceNotification | null
  onDismiss: (id: string) => void
  onOpenDetail: (id: string) => void
  onCloseDetail: () => void
  onActivateTarget: (notification: WorkspaceNotification) => void
}) {
  const messageNotifications = notifications.filter(
    (entry) => entry.channel === "message",
  )
  const inboxNotifications = notifications.filter(
    (entry) => entry.channel === "notification",
  )

  return (
    <>
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 top-4 flex justify-center px-4",
          UI_LAYERS.notifications,
        )}
      >
        <div className="flex w-full max-w-xl flex-col gap-2">
          <AnimatePresence initial={false}>
            {messageNotifications.map((notification) => (
              <MessageCard
                key={notification.id}
                notification={notification}
                onDismiss={onDismiss}
                onOpenDetail={onOpenDetail}
                onActivateTarget={onActivateTarget}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div
        className={cn(
          "pointer-events-none fixed inset-x-4 bottom-4 flex justify-end sm:inset-x-auto sm:right-4",
          UI_LAYERS.notifications,
        )}
      >
        <div className="flex w-full max-w-sm flex-col gap-3">
          <AnimatePresence initial={false}>
            {inboxNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onDismiss={onDismiss}
                onOpenDetail={onOpenDetail}
                onActivateTarget={onActivateTarget}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>

      <NotificationDetailDialog
        notification={selectedNotification}
        onClose={onCloseDetail}
        onActivateTarget={onActivateTarget}
      />
    </>
  )
}

function MessageCard({
  notification,
  onDismiss,
  onOpenDetail,
  onActivateTarget,
}: {
  notification: WorkspaceNotification
  onDismiss: (id: string) => void
  onOpenDetail: (id: string) => void
  onActivateTarget: (notification: WorkspaceNotification) => void
}) {
  const toneStyle = NOTIFICATION_TONE_STYLES[notification.tone ?? "info"]
  const Icon = NOTIFICATION_TONE_ICONS[notification.tone ?? "info"]

  return (
    <m.section
      role="status"
      layout
      data-testid={`notification-card-${notification.channel}`}
      initial={NOTIFICATION_MESSAGE_PRESENCE.initial}
      animate={NOTIFICATION_MESSAGE_PRESENCE.animate}
      exit={NOTIFICATION_MESSAGE_PRESENCE.exit}
      transition={APP_FADE_TRANSITION}
      className={cn(
        "pointer-events-auto rounded-2xl border px-4 py-3 shadow-[0_22px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl",
        toneStyle.card,
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-xl",
            toneStyle.icon,
          )}
        >
          <Icon className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] leading-none",
                toneStyle.label,
              )}
            >
              顶部消息 3s
            </span>
            {notification.persistent ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] leading-none text-slate-600">
                常驻
              </span>
            ) : null}
          </div>
          <div className="mt-1 text-sm font-medium text-slate-900">
            {notification.title}
          </div>
          <p className="mt-0.5 text-sm leading-6 text-slate-600">
            {notification.message}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <Button
            size="sm"
            variant="outline"
            className="h-7 border-slate-200 bg-white/70 text-slate-700 hover:bg-slate-50"
            onClick={() => onOpenDetail(notification.id)}
          >
            查看
          </Button>
          {notification.targetView ? (
            <Button
              size="sm"
              className="h-7 bg-slate-900 text-white hover:bg-slate-800"
              onClick={() => onActivateTarget(notification)}
            >
              <ExternalLink className="size-3.5" />
              {notification.actionLabel}
            </Button>
          ) : null}
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-slate-500 hover:bg-slate-100 hover:text-slate-700"
            onClick={() => onDismiss(notification.id)}
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    </m.section>
  )
}

function NotificationCard({
  notification,
  onDismiss,
  onOpenDetail,
  onActivateTarget,
}: {
  notification: WorkspaceNotification
  onDismiss: (id: string) => void
  onOpenDetail: (id: string) => void
  onActivateTarget: (notification: WorkspaceNotification) => void
}) {
  const toneStyle = NOTIFICATION_TONE_STYLES[notification.tone ?? "info"]
  const Icon = NOTIFICATION_TONE_ICONS[notification.tone ?? "info"]

  return (
    <m.section
      role="status"
      layout
      data-testid={`notification-card-${notification.channel}`}
      initial={NOTIFICATION_TOAST_PRESENCE.initial}
      animate={NOTIFICATION_TOAST_PRESENCE.animate}
      exit={NOTIFICATION_TOAST_PRESENCE.exit}
      transition={APP_FADE_TRANSITION}
      className={cn(
        "pointer-events-auto rounded-xl border px-4 py-4 shadow-[0_22px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl",
        toneStyle.card,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg",
            toneStyle.icon,
          )}
        >
          <Icon className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-sm font-medium text-slate-900">
              {notification.title}
            </div>
            <span
              className={cn(
                "rounded-full border px-2 py-0.5 text-[11px] leading-none",
                toneStyle.label,
              )}
            >
              右下通知 5s
            </span>
            {notification.persistent ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] leading-none text-slate-600">
                常驻
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {notification.message}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-7 border-slate-200 bg-white/70 text-slate-700 hover:bg-slate-50"
              onClick={() => onOpenDetail(notification.id)}
            >
              查看详情
            </Button>
            {notification.targetView ? (
              <Button
                size="sm"
                className="h-7 bg-slate-900 text-white hover:bg-slate-800"
                onClick={() => onActivateTarget(notification)}
              >
                <ExternalLink className="size-3.5" />
                {notification.actionLabel}
              </Button>
            ) : null}
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          onClick={() => onDismiss(notification.id)}
        >
          <X className="size-4" />
        </Button>
      </div>
    </m.section>
  )
}

function NotificationDetailDialog({
  notification,
  onClose,
  onActivateTarget,
}: {
  notification: WorkspaceNotification | null
  onClose: () => void
  onActivateTarget: (notification: WorkspaceNotification) => void
}) {
  return (
    <Dialog
      open={notification !== null}
      onOpenChange={(open) => !open && onClose()}
    >
      {notification ? (
        <DialogContent className="max-w-[560px] p-0" showCloseButton={false}>
          <DialogHeader className="px-5 pt-5">
            <div className="flex items-center gap-2 text-xs tracking-[0.18em] text-slate-500 uppercase">
              <BellRing className="size-3.5" />
              {notification.channel === "message" ? "消息详情" : "通知详情"}
            </div>
            <DialogTitle className="text-lg text-slate-900">
              {notification.title}
            </DialogTitle>
            <DialogDescription className="leading-6 text-slate-600">
              {notification.message}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 px-5 pb-2">
            {notification.detail ? (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
                {notification.detail}
              </div>
            ) : null}

            {notification.detailLines?.length ? (
              <div className="space-y-2">
                {notification.detailLines.map((entry) => (
                  <div
                    key={entry}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700"
                  >
                    {entry}
                  </div>
                ))}
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                来源：{notification.source ?? "站内通知"}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                展示：
                {notification.channel === "message" ? "顶部消息" : "右下通知"}
              </span>
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1">
                时效：
                {notification.persistent
                  ? "常驻"
                  : `${notification.durationMs}ms`}
              </span>
            </div>
          </div>

          <DialogFooter className="bg-slate-50/80">
            <Button variant="outline" onClick={onClose}>
              关闭
            </Button>
            {notification.targetView ? (
              <Button onClick={() => onActivateTarget(notification)}>
                <ExternalLink className="size-4" />
                前往{getWorkspaceViewLabel(notification.targetView)}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      ) : null}
    </Dialog>
  )
}
