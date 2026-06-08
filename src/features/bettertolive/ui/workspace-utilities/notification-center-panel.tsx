import { Button } from "@/components/ui/button"
import type {
  WorkspaceNotification,
  WorkspaceNotificationInput,
} from "@/features/bettertolive/config/notifications"
import { useTranslation } from "react-i18next"

export function NotificationCenterPanel({
  notifications,
  notificationFeed,
  onActivateNotificationTarget,
  onDismissNotification,
  onNotify,
  onOpenNotificationDetail,
  onRequestClose,
}: {
  notifications: WorkspaceNotification[]
  notificationFeed: WorkspaceNotification[]
  onActivateNotificationTarget: (notification: WorkspaceNotification) => void
  onDismissNotification: (id: string) => void
  onNotify: (input: WorkspaceNotificationInput) => string
  onOpenNotificationDetail: (id: string) => void
  onRequestClose: () => void
}) {
  const { t } = useTranslation()
  const activeNotificationCount = notifications.length
  const hasNotifications = notificationFeed.length > 0

  return (
    <div
      data-testid="utility-panel-notifications"
      className="rounded-2xl border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-[color:var(--text-primary)]">
            {t("shell.notificationCenter.title")}
          </div>
          <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
            {t("shell.notificationCenter.description")}
          </p>
        </div>
        <span className="rounded-full border border-[color:var(--chip-border)] bg-white/80 px-2 py-1 text-[11px] leading-none text-[color:var(--text-muted)]">
          {t("shell.notificationCenter.activeCount", { count: activeNotificationCount })}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {hasNotifications ? (
          notificationFeed.map((notification) => {
            const isActive = notifications.some((entry) => entry.id === notification.id)

            return (
              <div
                key={notification.id}
                className="w-full rounded-xl border border-[color:var(--chip-border)] bg-white/75 px-3 py-3 text-left transition hover:bg-white"
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => onOpenNotificationDetail(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1 size-2 rounded-full bg-[color:var(--text-primary)] opacity-70" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-medium text-[color:var(--text-primary)]">
                          {notification.title}
                        </div>
                        {notification.readAt === null ? (
                          <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[11px] leading-none text-sky-700">
                            {t("shell.notificationCenter.unread")}
                          </span>
                        ) : null}
                        {notification.persistent ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] leading-none text-amber-700">
                            {t("shell.notifications.persistent")}
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-[color:var(--text-muted)]">
                        {notification.message}
                      </p>
                      <div className="mt-2 text-[11px] text-[color:var(--text-muted)]">
                        {notification.channel === "message"
                          ? t("shell.notifications.messageChannel")
                          : t("shell.notifications.notificationChannel")}
                      </div>
                    </div>
                  </div>
                </button>
                <div className="mt-2 flex items-center justify-end gap-2">
                  {notification.targetView ? (
                    <button
                      type="button"
                      className="text-[11px] text-[color:var(--text-primary)]"
                      onClick={() => {
                        onActivateNotificationTarget(notification)
                        onRequestClose()
                      }}
                    >
                      {t("shell.notifications.goTo", {
                        view: t(`shell.views.${notification.targetView}`),
                      })}
                    </button>
                  ) : null}
                  {isActive ? (
                    <button
                      type="button"
                      className="text-[11px] text-[color:var(--text-muted)]"
                      onClick={() => onDismissNotification(notification.id)}
                    >
                      {t("shell.notifications.close")}
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })
        ) : (
          <div className="rounded-xl border border-dashed border-[color:var(--chip-border)] bg-white/60 px-4 py-5 text-sm text-[color:var(--text-muted)]">
            {t("shell.notificationCenter.empty")}
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-[color:var(--chip-border)] bg-white/65 px-3 py-3">
        <div className="text-xs font-medium text-[color:var(--text-muted)]">
          {t("shell.notificationCenter.demo.title")}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 bg-white/80"
            data-testid="notification-demo-message"
            onClick={() =>
              onNotify({
                channel: "message",
                title: t("shell.notificationCenter.demo.message.title"),
                message: t("shell.notificationCenter.demo.message.message"),
                tone: "success",
                source: t("shell.notificationCenter.demo.message.source"),
                detail: t("shell.notificationCenter.demo.message.detail"),
                detailLines: [
                  t("shell.notificationCenter.demo.message.lineDuration"),
                  t("shell.notificationCenter.demo.message.lineUse"),
                  t("shell.notificationCenter.demo.message.lineShape"),
                ],
              })
            }
          >
            {t("shell.notificationCenter.demo.message.button")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 bg-white/80"
            data-testid="notification-demo-notification"
            onClick={() =>
              onNotify({
                channel: "notification",
                title: t("shell.notificationCenter.demo.notification.title"),
                message: t("shell.notificationCenter.demo.notification.message"),
                tone: "info",
                source: t("shell.notificationCenter.demo.notification.source"),
                detail: t("shell.notificationCenter.demo.notification.detail"),
                detailLines: [
                  t("shell.notificationCenter.demo.notification.lineDuration"),
                  t("shell.notificationCenter.demo.notification.lineUse"),
                  t("shell.notificationCenter.demo.notification.lineShape"),
                ],
              })
            }
          >
            {t("shell.notificationCenter.demo.notification.button")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 bg-white/80"
            data-testid="notification-demo-persistent"
            onClick={() =>
              onNotify({
                channel: "notification",
                title: t("shell.notificationCenter.demo.persistent.title"),
                message: t("shell.notificationCenter.demo.persistent.message"),
                tone: "warning",
                persistent: true,
                targetView: "journey",
                actionLabel: t("shell.notificationCenter.demo.persistent.action"),
                source: t("shell.notificationCenter.demo.persistent.source"),
                detail: t("shell.notificationCenter.demo.persistent.detail"),
                detailLines: [
                  t("shell.notificationCenter.demo.persistent.lineDuration"),
                  t("shell.notificationCenter.demo.persistent.lineTarget"),
                  t("shell.notificationCenter.demo.persistent.lineShape"),
                ],
              })
            }
          >
            {t("shell.notificationCenter.demo.persistent.button")}
          </Button>
        </div>
      </div>
    </div>
  )
}
