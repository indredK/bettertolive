import { Button } from "@/components/ui/button"
import type {
  WorkspaceNotification,
  WorkspaceNotificationInput,
} from "@/features/bettertolive/notifications"
import { getWorkspaceViewLabel } from "@/features/bettertolive/view-labels"

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
  const activeNotificationCount = notifications.length
  const hasNotifications = notificationFeed.length > 0

  return (
    <div
      data-testid="utility-panel-notifications"
      className="rounded-2xl border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-[color:var(--text-primary)]">通知中心</div>
          <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
            顶部消息和右下通知都会汇总到这里，适合回看和继续处理。
          </p>
        </div>
        <span className="rounded-full border border-[color:var(--chip-border)] bg-white/80 px-2 py-1 text-[11px] leading-none text-[color:var(--text-muted)]">
          {activeNotificationCount} 条正在显示
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
                            未读
                          </span>
                        ) : null}
                        {notification.persistent ? (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] leading-none text-amber-700">
                            常驻
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-sm leading-6 text-[color:var(--text-muted)]">
                        {notification.message}
                      </p>
                      <div className="mt-2 text-[11px] text-[color:var(--text-muted)]">
                        {notification.channel === "message" ? "顶部消息" : "右下通知"}
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
                      前往{getWorkspaceViewLabel(notification.targetView)}
                    </button>
                  ) : null}
                  {isActive ? (
                    <button
                      type="button"
                      className="text-[11px] text-[color:var(--text-muted)]"
                      onClick={() => onDismissNotification(notification.id)}
                    >
                      关闭
                    </button>
                  ) : null}
                </div>
              </div>
            )
          })
        ) : (
          <div className="rounded-xl border border-dashed border-[color:var(--chip-border)] bg-white/60 px-4 py-5 text-sm text-[color:var(--text-muted)]">
            暂时还没有通知。后面可以继续接保存结果、提醒和跨页面待处理事项。
          </div>
        )}
      </div>

      <div className="mt-4 rounded-xl border border-[color:var(--chip-border)] bg-white/65 px-3 py-3">
        <div className="text-xs font-medium text-[color:var(--text-muted)]">反馈测试</div>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 bg-white/80"
            data-testid="notification-demo-message"
            onClick={() =>
              onNotify({
                channel: "message",
                title: "顶部消息已触发",
                message: "默认 3 秒后自动消失，适合保存成功这类轻反馈。",
                tone: "success",
                source: "顶部消息组件",
                detail: "顶部消息更适合短暂确认和轻量结果反馈，不应该承载太重的阅读压力。",
                detailLines: [
                  "默认时长：3000ms",
                  "适合保存成功、完成确认、轻提醒",
                  "信息应短，动作应少",
                ],
              })
            }
          >
            顶部消息 3s
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 bg-white/80"
            data-testid="notification-demo-notification"
            onClick={() =>
              onNotify({
                channel: "notification",
                title: "右下通知已触发",
                message: "默认 5 秒停留，适合更完整的信息提示。",
                tone: "info",
                source: "右下通知组件",
                detail: "右下通知更适合带上下文的提醒、建议和可操作的信息，也更适合多条堆叠。",
                detailLines: [
                  "默认时长：5000ms",
                  "适合任务完成、提醒、建议等场景",
                  "可继续扩展优先级、来源和分类",
                ],
              })
            }
          >
            右下通知 5s
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 bg-white/80"
            data-testid="notification-demo-persistent"
            onClick={() =>
              onNotify({
                channel: "notification",
                title: "成长线索待补充",
                message: "这条通知会常驻，直到你处理或手动关闭。",
                tone: "warning",
                persistent: true,
                targetView: "growth",
                actionLabel: "前往成长页",
                source: "扩展通知示例",
                detail: "常驻通知适合真正需要处理的事项，比如待补充内容、待确认操作或跨页面提醒。",
                detailLines: [
                  "不会自动消失",
                  "支持前往指定页面",
                  "支持后续扩展成任务、待办或消息中心入口",
                ],
              })
            }
          >
            常驻通知
          </Button>
        </div>
      </div>
    </div>
  )
}
