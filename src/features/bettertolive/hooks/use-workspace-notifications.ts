import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import type {
  WorkspaceNotification,
  WorkspaceNotificationInput,
} from "@/features/bettertolive/config/notifications"
import type { AppView } from "@/features/bettertolive/types"

let notificationCounter = 0

function createNotificationId() {
  notificationCounter += 1
  return `notification-${Date.now()}-${notificationCounter}`
}

function normalizeNotification(input: WorkspaceNotificationInput): WorkspaceNotification {
  const defaultDuration = input.channel === "message" ? 3000 : 5000

  return {
    ...input,
    tone: input.tone ?? "info",
    actionLabel: input.actionLabel ?? "前往查看",
    createdAt: Date.now(),
    durationMs: input.persistent === true ? null : (input.durationMs ?? defaultDuration),
    id: createNotificationId(),
    readAt: null,
  }
}

export function useWorkspaceNotifications({ onNavigate }: { onNavigate: (view: AppView) => void }) {
  const [notifications, setNotifications] = useState<WorkspaceNotification[]>([])
  const [notificationFeed, setNotificationFeed] = useState<WorkspaceNotification[]>([])
  const [selectedNotificationId, setSelectedNotificationId] = useState<string | null>(null)
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  const dismissNotification = useCallback((id: string) => {
    const timer = timersRef.current.get(id)

    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }

    setNotifications((current) => current.filter((entry) => entry.id !== id))
    setSelectedNotificationId((current) => (current === id ? null : current))
  }, [])

  const markNotificationRead = useCallback((id: string) => {
    const readAt = Date.now()

    setNotifications((current) =>
      current.map((entry) =>
        entry.id === id && entry.readAt === null ? { ...entry, readAt } : entry,
      ),
    )
    setNotificationFeed((current) =>
      current.map((entry) =>
        entry.id === id && entry.readAt === null ? { ...entry, readAt } : entry,
      ),
    )
  }, [])

  const notify = useCallback((input: WorkspaceNotificationInput) => {
    const notification = normalizeNotification(input)

    setNotifications((current) => [notification, ...current].slice(0, 8))
    setNotificationFeed((current) => [notification, ...current].slice(0, 20))
    return notification.id
  }, [])

  const openNotificationDetail = useCallback(
    (id: string) => {
      markNotificationRead(id)
      setSelectedNotificationId(id)
    },
    [markNotificationRead],
  )

  const closeNotificationDetail = useCallback(() => {
    setSelectedNotificationId(null)
  }, [])

  const activateNotificationTarget = useCallback(
    (notification: WorkspaceNotification) => {
      markNotificationRead(notification.id)

      if (notification.targetView) {
        onNavigate(notification.targetView)
      }

      dismissNotification(notification.id)
    },
    [dismissNotification, markNotificationRead, onNavigate],
  )

  useEffect(() => {
    const activeIds = new Set(notifications.map((entry) => entry.id))

    notifications.forEach((notification) => {
      if (notification.durationMs === null) {
        return
      }

      if (timersRef.current.has(notification.id)) {
        return
      }

      const timer = setTimeout(() => {
        dismissNotification(notification.id)
      }, notification.durationMs)

      timersRef.current.set(notification.id, timer)
    })

    Array.from(timersRef.current.keys()).forEach((id) => {
      if (!activeIds.has(id)) {
        const timer = timersRef.current.get(id)

        if (timer) {
          clearTimeout(timer)
          timersRef.current.delete(id)
        }
      }
    })
  }, [dismissNotification, notifications])

  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => clearTimeout(timer))
      timersRef.current.clear()
    },
    [],
  )

  const selectedNotification = useMemo(
    () => notificationFeed.find((entry) => entry.id === selectedNotificationId) ?? null,
    [notificationFeed, selectedNotificationId],
  )

  const unreadCount = useMemo(
    () => notificationFeed.filter((entry) => entry.readAt === null).length,
    [notificationFeed],
  )

  return {
    notifications,
    notificationFeed,
    selectedNotification,
    unreadCount,
    notify,
    dismissNotification,
    markNotificationRead,
    openNotificationDetail,
    closeNotificationDetail,
    activateNotificationTarget,
  }
}
