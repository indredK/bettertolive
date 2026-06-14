"use client"

import { createRoot } from "react-dom/client"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ConfirmOptions = {
  title: string
  message: string
  confirmLabel: string
  cancelLabel: string
  variant?: "default" | "destructive"
}

let activeResolver: ((value: boolean) => void) | null = null

function ConfirmDialogComponent({
  options,
  onResolve,
}: {
  options: ConfirmOptions
  onResolve: (value: boolean) => void
}) {
  return (
    <Dialog open onOpenChange={(open) => !open && onResolve(false)}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>{options.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[color:var(--text-secondary)]">{options.message}</p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onResolve(false)}>
            {options.cancelLabel}
          </Button>
          <Button variant={options.variant ?? "default"} onClick={() => onResolve(true)}>
            {options.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Show a confirmation dialog and return a Promise that resolves to true/false.
 * Works outside of React components (e.g. in utility functions).
 */
export function showConfirm(options: ConfirmOptions): Promise<boolean> {
  // Clean up any existing dialog
  if (activeResolver) {
    activeResolver(false)
    activeResolver = null
  }

  return new Promise<boolean>((resolve) => {
    activeResolver = resolve

    const container = document.createElement("div")
    container.id = "confirm-dialog-root"
    document.body.appendChild(container)

    const root = createRoot(container)

    const handleResolve = (value: boolean) => {
      activeResolver = null
      resolve(value)
      // Delay unmount so the dialog close animation plays
      setTimeout(() => {
        root.unmount()
        container.remove()
      }, 200)
    }

    root.render(<ConfirmDialogComponent options={options} onResolve={handleResolve} />)
  })
}
