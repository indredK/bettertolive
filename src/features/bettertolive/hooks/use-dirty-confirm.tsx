"use client"

import { useCallback, useState } from "react"

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type UseDirtyConfirmOptions = {
  isDirty: boolean
  confirmMessage: string
  cancelLabel: string
  confirmLabel: string
}

/**
 * Hook to show a confirmation dialog when the user tries to close a dirty form.
 * Returns { handleOpenChange, dirtyConfirmDialog } to integrate with your Dialog.
 *
 * Usage:
 *   const { handleOpenChange, dirtyConfirmDialog } = useDirtyConfirm({
 *     isDirty: form.formState.isDirty,
 *     confirmMessage: t("common.confirm.unsavedChanges"),
 *     cancelLabel: t("common.actions.cancel"),
 *     confirmLabel: t("common.actions.confirm"),
 *   })
 *
 *   <Dialog open onOpenChange={handleOpenChange(onClose)}>
 *     ...
 *     {dirtyConfirmDialog}
 *   </Dialog>
 */
export function useDirtyConfirm({
  isDirty,
  confirmMessage,
  cancelLabel,
  confirmLabel,
}: UseDirtyConfirmOptions) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [pendingClose, setPendingClose] = useState<(() => void) | null>(null)

  const handleOpenChange = useCallback(
    (onClose: () => void) => (open: boolean) => {
      if (!open && isDirty) {
        setPendingClose(() => onClose)
        setShowConfirm(true)
        return
      }
      if (!open) onClose()
    },
    [isDirty],
  )

  const handleCancel = useCallback(() => {
    setShowConfirm(false)
    setPendingClose(null)
  }, [])

  const handleConfirm = useCallback(() => {
    setShowConfirm(false)
    pendingClose?.()
    setPendingClose(null)
  }, [pendingClose])

  const dirtyConfirmDialog = showConfirm ? (
    <Dialog open onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{confirmMessage}</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            {cancelLabel}
          </Button>
          <Button variant="default" onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ) : null

  return { handleOpenChange, dirtyConfirmDialog }
}
