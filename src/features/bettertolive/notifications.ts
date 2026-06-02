import type { AppView } from "@/features/bettertolive/types"

export type WorkspaceNotificationChannel = "message" | "notification"

export type WorkspaceNotificationTone =
  | "info"
  | "success"
  | "warning"
  | "neutral"

export type WorkspaceNotificationInput = {
  channel: WorkspaceNotificationChannel
  title: string
  message: string
  tone?: WorkspaceNotificationTone
  durationMs?: number
  persistent?: boolean
  detail?: string
  detailLines?: string[]
  actionLabel?: string
  targetView?: AppView
  source?: string
}

export type WorkspaceNotification = Omit<
  WorkspaceNotificationInput,
  "durationMs"
> & {
  id: string
  createdAt: number
  durationMs: number | null
  readAt: number | null
}
