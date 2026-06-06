import { toast } from "sonner"

const DELETE_UNDO_WINDOW_MS = 5000

export function confirmUndoableDelete({
  confirmMessage,
  pendingMessage,
  successMessage,
  failureMessage,
  undoLabel,
  undoneMessage,
  onDelete,
  onDeleted,
}: {
  confirmMessage: string
  pendingMessage: string
  successMessage: string
  failureMessage: string
  undoLabel: string
  undoneMessage: string
  onDelete: () => Promise<void>
  onDeleted?: () => void
}) {
  if (!window.confirm(confirmMessage)) return false

  let isUndone = false

  const toastId = toast(pendingMessage, {
    duration: DELETE_UNDO_WINDOW_MS,
    action: {
      label: undoLabel,
      onClick: () => {
        isUndone = true
        toast.dismiss(toastId)
        toast.info(undoneMessage)
      },
    },
  })

  window.setTimeout(async () => {
    if (isUndone) return

    try {
      await onDelete()
      toast.success(successMessage)
      onDeleted?.()
    } catch (error) {
      toast.error(`${failureMessage}: ${String(error)}`)
    }
  }, DELETE_UNDO_WINDOW_MS)

  return true
}

export { DELETE_UNDO_WINDOW_MS }
