import { createContext, useContext } from "react"

type PopupNotificationContextValue = {
  isPaused: boolean
}

const PopupNotificationContext = createContext<PopupNotificationContextValue | null>(null)

function usePopupNotificationContext() {
  const ctx = useContext(PopupNotificationContext)
  if (!ctx) {
    throw new Error("PopupNotification.* must be used inside <PopupNotification>")
  }
  return ctx
}

export function usePopupNotification() {
  return usePopupNotificationContext()
}

export { PopupNotificationContext }
export type { PopupNotificationContextValue }
