import { useQueryClient } from "@tanstack/react-query"
import { Download, Upload, AlertTriangle } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { collectAllData } from "@/features/bettertolive/api/import-export/export-utils"
import {
  importData,
  summarizeImportData,
  validateExportFile,
} from "@/features/bettertolive/api/import-export/import-utils"
import type { ImportMode } from "@/features/bettertolive/api/import-export/types"
import { workspaceQueryKeys } from "@/features/bettertolive/queries/workspace-query-keys"
import { cn } from "@/lib/utils"

export function DataTab() {
  const { t } = useTranslation()
  const queryClient = useQueryClient()
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)

  const [importSummary, setImportSummary] = useState<{
    modules: string[]
    totalItems: number
  } | null>(null)
  const [importMode, setImportMode] = useState<ImportMode>("merge")
  const [showConfirm, setShowConfirm] = useState(false)
  const [rawImportData, setRawImportData] = useState<unknown>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  function closeMessages() {
    setErrorMessage(null)
    setSuccessMessage(null)
  }

  async function handleExport() {
    closeMessages()
    setExporting(true)
    try {
      const { save } = await import("@tauri-apps/plugin-dialog")
      const { writeTextFile } = await import("@tauri-apps/plugin-fs")

      const path = await save({
        defaultPath: `bettertolive-export.bettertolive`,
        filters: [{ name: "BetterToLive Export", extensions: ["bettertolive"] }],
      })
      if (!path) {
        setExporting(false)
        return
      }

      const data = await collectAllData()
      const json = JSON.stringify(data, null, 2)
      await writeTextFile(path, json)
      setSuccessMessage(t("shell.settings.data.exportDone"))
    } catch {
      setErrorMessage(t("shell.settings.data.exportFailed"))
    } finally {
      setExporting(false)
    }
  }

  async function handleSelectImport() {
    closeMessages()
    setImportSummary(null)
    setShowConfirm(false)
    setRawImportData(null)

    try {
      const { open } = await import("@tauri-apps/plugin-dialog")
      const { readTextFile } = await import("@tauri-apps/plugin-fs")

      const selected = await open({
        multiple: false,
        filters: [{ name: "BetterToLive Export", extensions: ["bettertolive"] }],
      })
      if (!selected) return

      const content = await readTextFile(selected)
      let parsed: unknown
      try {
        parsed = JSON.parse(content)
      } catch {
        setErrorMessage(t("shell.settings.data.importFileInvalid"))
        return
      }

      let validated: ReturnType<typeof validateExportFile>
      try {
        validated = validateExportFile(parsed)
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : String(err))
        return
      }

      const summary = summarizeImportData(validated.data)
      const totalItems = summary.reduce((acc, s) => acc + parseInt(s.count) || 0, 0)
      setImportSummary({
        modules: summary.map((s) => s.module),
        totalItems,
      })
      setRawImportData(validated)
      setImportMode("merge")
      setShowConfirm(true)
    } catch {
      setErrorMessage(t("shell.settings.data.importFileInvalid"))
    }
  }

  async function handleConfirmImport() {
    if (!rawImportData) return
    setImporting(true)
    closeMessages()

    try {
      await importData(rawImportData as Parameters<typeof importData>[0], importMode)
      await queryClient.invalidateQueries({ queryKey: workspaceQueryKeys.all })
      setSuccessMessage(t("shell.settings.data.importDone"))
    } catch {
      setErrorMessage(t("shell.settings.data.exportFailed"))
    } finally {
      setImporting(false)
      setShowConfirm(false)
      setImportSummary(null)
      setRawImportData(null)
    }
  }

  function handleCancelImport() {
    setShowConfirm(false)
    setImportSummary(null)
    setRawImportData(null)
  }

  return (
    <div className="space-y-5">
      <section>
        <div className="mb-2.5 flex items-center gap-2">
          <Download className="size-3.5 text-[color:var(--text-muted)]" />
          <span className="text-xs font-medium tracking-wide text-[color:var(--text-muted)] uppercase">
            {t("shell.settings.data.export")}
          </span>
        </div>
        <p className="mb-3 text-xs text-[color:var(--text-muted)]">
          {t("shell.settings.data.exportDescription")}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 border-[color:var(--chip-border)] bg-white/80 text-[color:var(--text-primary)] hover:bg-white"
          onClick={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <span className="inline-block size-4 animate-spin rounded-full border-2 border-[color:var(--text-muted)] border-t-transparent" />
          ) : (
            <Download className="size-4" />
          )}
          {t("shell.settings.data.export")}
        </Button>
      </section>

      <section>
        <div className="mb-2.5 flex items-center gap-2">
          <Upload className="size-3.5 text-[color:var(--text-muted)]" />
          <span className="text-xs font-medium tracking-wide text-[color:var(--text-muted)] uppercase">
            {t("shell.settings.data.import")}
          </span>
        </div>
        <p className="mb-3 text-xs text-[color:var(--text-muted)]">
          {t("shell.settings.data.importDescription")}
        </p>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 border-[color:var(--chip-border)] bg-white/80 text-[color:var(--text-primary)] hover:bg-white"
          onClick={handleSelectImport}
          disabled={importing}
        >
          {importing ? (
            <span className="inline-block size-4 animate-spin rounded-full border-2 border-[color:var(--text-muted)] border-t-transparent" />
          ) : (
            <Upload className="size-4" />
          )}
          {t("shell.settings.data.import")}
        </Button>
      </section>

      {errorMessage && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          {errorMessage}
        </div>
      )}

      {successMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
          {successMessage}
        </div>
      )}

      {showConfirm && importSummary && (
        <div className="space-y-3 rounded-xl border border-[color:var(--chip-border)] bg-white/60 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-[color:var(--text-primary)]">
            <AlertTriangle className="size-4 text-amber-600" />
            {t("shell.settings.data.importConfirmTitle")}
          </div>

          <div className="text-xs text-[color:var(--text-muted)]">
            <p className="mb-1 font-medium text-[color:var(--text-primary)]">
              {importSummary.modules.length} modules, {importSummary.totalItems} items
            </p>
            <p className="text-[color:var(--text-muted)]">{importSummary.modules.join(", ")}</p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-left text-sm transition",
                importMode === "merge"
                  ? "border-[color:var(--nav-active-border)] bg-white font-medium text-[color:var(--text-primary)]"
                  : "border-[color:var(--chip-border)] bg-white/60 text-[color:var(--text-muted)] hover:bg-white",
              )}
              onClick={() => setImportMode("merge")}
            >
              {t("shell.settings.data.importMerge")}
              <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                {t("shell.settings.data.importMergeHelp")}
              </p>
            </button>
            <button
              type="button"
              className={cn(
                "flex-1 rounded-lg border px-3 py-2 text-left text-sm transition",
                importMode === "overwrite"
                  ? "border-red-300 bg-red-50 font-medium text-red-700"
                  : "border-[color:var(--chip-border)] bg-white/60 text-[color:var(--text-muted)] hover:bg-white",
              )}
              onClick={() => setImportMode("overwrite")}
            >
              {t("shell.settings.data.importOverwrite")}
              <p className="mt-0.5 text-xs text-[color:var(--text-muted)]">
                {t("shell.settings.data.importOverwriteHelp")}
              </p>
            </button>
          </div>

          <p className="text-xs text-[color:var(--text-muted)]">
            {importMode === "overwrite"
              ? t("shell.settings.data.importConfirmOverwrite")
              : t("shell.settings.data.importConfirmMerge")}
          </p>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 border-[color:var(--chip-border)] bg-white/80 text-[color:var(--text-primary)] hover:bg-white"
              onClick={handleCancelImport}
              disabled={importing}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className={cn(
                "flex-1",
                importMode === "overwrite"
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "bg-[color:var(--text-primary)] text-[color:var(--hero-ink)] hover:opacity-90",
              )}
              onClick={handleConfirmImport}
              disabled={importing}
            >
              {importing ? (
                <span className="inline-block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                t("shell.settings.data.import")
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
