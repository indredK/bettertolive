import { Plus, Trash2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type {
  ShoppingPageContentForm,
  ShoppingPageContentRow,
} from "@/features/bettertolive/api/bettertolive-api"
import {
  createPageContent,
  deletePageContent,
  listPageContents,
  updatePageContent,
} from "@/features/bettertolive/api/shopping-crud-api"
import { cn } from "@/lib/utils"

type EditableForm = ShoppingPageContentForm & { isNew: boolean }

function createContentTypeOptions(t: ReturnType<typeof useTranslation>["t"]) {
  return [
    { value: "spotlight" as const, label: t("shopping.admin.pageContent.type.spotlight") },
    {
      value: "stage_checklist" as const,
      label: t("shopping.admin.pageContent.type.stageChecklist"),
    },
    {
      value: "price_reference" as const,
      label: t("shopping.admin.pageContent.type.priceReference"),
    },
    {
      value: "boundary_entry" as const,
      label: t("shopping.admin.pageContent.type.boundaryEntry"),
    },
    {
      value: "lifestyle_collection" as const,
      label: t("shopping.admin.pageContent.type.lifestyleCollection"),
    },
  ]
}

const EMPTY_FORM: EditableForm = {
  isNew: true,
  contentType: "spotlight",
  title: null,
  stage: null,
  system: null,
  summary: null,
  reason: null,
  body: "{}",
}

export function ShoppingPageContentAdmin({
  isWideLayout = false,
  isFixedLayout = false,
}: {
  isWideLayout?: boolean
  isFixedLayout?: boolean
}) {
  const { t } = useTranslation()
  const contentTypes = useMemo(() => createContentTypeOptions(t), [t])
  const [activeContentType, setActiveContentType] = useState("spotlight")
  const [items, setItems] = useState<ShoppingPageContentRow[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<EditableForm | null>(null)
  const [error, setError] = useState<string | null>(null)

  const loadItems = useCallback(async () => {
    try {
      setLoading(true)
      const data = await listPageContents(activeContentType)
      setItems(data)
      setError(null)
    } catch (e) {
      setError(String(e))
    } finally {
      setLoading(false)
    }
  }, [activeContentType])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadItems()
    }, 0)

    return () => {
      window.clearTimeout(timer)
    }
  }, [loadItems])

  async function handleSave(form: EditableForm) {
    try {
      if (form.isNew) {
        await createPageContent(form)
      } else {
        if (!form.id) return
        await updatePageContent({ ...form, id: form.id })
      }
      setEditing(null)
      setError(null)
      void loadItems()
    } catch (e) {
      setError(String(e))
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm(t("shopping.admin.pageContent.confirmDelete"))) return
    try {
      await deletePageContent(id)
      setError(null)
      void loadItems()
    } catch (e) {
      setError(String(e))
    }
  }

  function startEdit(item: ShoppingPageContentRow) {
    setEditing({
      isNew: false,
      id: item.id,
      contentType: item.content_type,
      title: item.title,
      stage: item.stage,
      system: item.system_id,
      summary: item.summary,
      reason: item.reason,
      body: item.body_json,
    })
  }

  const contentTypeLabel = (ct: string) => {
    const found = contentTypes.find((t) => t.value === ct)
    return found ? found.label : ct
  }

  const scrollAreaClassName = cn(
    "rounded-md overflow-auto",
    isFixedLayout ? "min-h-0 flex-1" : "max-h-[420px]",
  )

  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        isFixedLayout && "h-full min-h-0 flex-1 overflow-hidden",
      )}
    >
      <section className="rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] px-4 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] text-[color:var(--text-secondary)]"
              >
                {t("shopping.admin.pageContent.contentGroup")}
              </Badge>
              <span className="text-xs text-[color:var(--text-muted)]">
                {t("shopping.admin.pageContent.contentGroupDesc")}
              </span>
            </div>
            <div className="w-full md:max-w-xs">
              <Select
                value={activeContentType}
                onValueChange={(value) => {
                  setActiveContentType(value ?? "spotlight")
                  setEditing(null)
                }}
              >
                <SelectTrigger className="h-10 border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] shadow-none">
                  <SelectValue placeholder={t("shopping.admin.pageContent.selectType")}>
                    {(value) => contentTypeLabel(String(value ?? ""))}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((ct) => (
                    <SelectItem key={ct.value} value={ct.value} label={ct.label}>
                      {ct.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="outline"
              className="h-9 border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-3 text-[color:var(--text-secondary)]"
            >
              {t("shopping.admin.pageContent.count", { count: items.length })}
            </Badge>
            <Button
              onClick={() => setEditing({ ...EMPTY_FORM, contentType: activeContentType })}
              className={cn("h-9 px-3", isWideLayout && "h-8")}
            >
              <Plus />
              {t("shopping.admin.pageContent.addContent")}
            </Button>
          </div>
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <section
        className={cn(
          "flex flex-col overflow-hidden rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] shadow-[var(--surface-shadow)]",
          isFixedLayout && "min-h-0 flex-1",
        )}
      >
        <div className="flex flex-col gap-3 border-b border-[color:var(--muted-surface-border)] px-5 py-4 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0">
            <h4 className="text-sm font-semibold tracking-tight text-[color:var(--text-primary)]">
              {t("shopping.admin.pageContent.contentList", {
                type: contentTypeLabel(activeContentType),
              })}
            </h4>
            <p className="mt-1 text-xs text-[color:var(--text-muted)]">
              {t("shopping.admin.pageContent.contentListDesc")}
            </p>
          </div>
          <span className="text-xs text-[color:var(--text-muted)]">
            {t("shopping.admin.pageContent.count", { count: items.length })}
          </span>
        </div>

        {loading ? (
          <div className="flex flex-1 items-center px-5 py-10 text-sm text-[color:var(--text-muted)]">
            {t("shopping.admin.pageContent.loading")}
          </div>
        ) : (
          <div className={cn("min-h-0 px-2 pb-2", isFixedLayout && "flex-1")}>
            <div
              className={cn(
                "min-h-0 rounded-md border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)]",
                isFixedLayout && "flex h-full flex-col",
              )}
            >
              <Table containerClassName={scrollAreaClassName} className="min-w-[980px]">
                <TableHeader>
                  <TableRow className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)]">
                    <TableHead className="sticky top-0 left-0 z-20 h-11 border-r border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-4 text-[12px] font-semibold text-[color:var(--text-muted)]">
                      {t("shopping.admin.pageContent.table.title")}
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 h-11 bg-[color:var(--chip-bg)] px-4 text-[12px] font-semibold text-[color:var(--text-muted)]">
                      {t("shopping.admin.pageContent.table.stage")}
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 h-11 bg-[color:var(--chip-bg)] px-4 text-[12px] font-semibold text-[color:var(--text-muted)]">
                      {t("shopping.admin.pageContent.table.system")}
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 h-11 bg-[color:var(--chip-bg)] px-4 text-[12px] font-semibold text-[color:var(--text-muted)]">
                      {t("shopping.admin.pageContent.table.summary")}
                    </TableHead>
                    <TableHead className="sticky top-0 right-0 z-20 h-11 border-l border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-4 text-right text-[12px] font-semibold text-[color:var(--text-muted)]">
                      {t("shopping.admin.pageContent.table.actions")}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow className="border-[color:var(--muted-surface-border)]">
                      <TableCell
                        colSpan={5}
                        className="px-4 py-8 text-sm text-[color:var(--text-muted)]"
                      >
                        {t("shopping.admin.pageContent.noContent", {
                          type: contentTypeLabel(activeContentType),
                        })}
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((item) => (
                      <TableRow
                        key={item.id}
                        className="group cursor-pointer border-[color:var(--muted-surface-border)] bg-[color:var(--surface-bg)] hover:bg-[color:var(--muted-surface-bg)]"
                        onClick={() => startEdit(item)}
                      >
                        <TableCell className="sticky left-0 z-10 max-w-[240px] border-r border-[color:var(--muted-surface-border)] bg-[color:var(--surface-bg)] px-4 py-3 font-medium whitespace-normal text-[color:var(--text-primary)] group-hover:bg-[color:var(--muted-surface-bg)]">
                          {item.title ?? "-"}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-[color:var(--text-secondary)]">
                          {item.stage ? (
                            <Badge
                              variant="outline"
                              className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)]"
                            >
                              {item.stage}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-[color:var(--text-secondary)]">
                          {item.system_id ? (
                            <Badge
                              variant="outline"
                              className="border-[color:var(--chip-border)] bg-[color:var(--chip-bg)]"
                            >
                              {item.system_id}
                            </Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell className="max-w-[360px] px-4 py-3 whitespace-normal text-[color:var(--text-secondary)]">
                          {item.summary ?? "-"}
                        </TableCell>
                        <TableCell className="sticky right-0 z-10 border-l border-[color:var(--muted-surface-border)] bg-[color:var(--surface-bg)] px-4 py-3 text-right group-hover:bg-[color:var(--muted-surface-bg)]">
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="text-red-500 hover:bg-red-50 hover:text-red-700"
                            onClick={(e) => {
                              e.stopPropagation()
                              void handleDelete(item.id)
                            }}
                          >
                            <Trash2 />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </section>

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) setEditing(null)
        }}
      >
        {editing ? (
          <DialogContent className="sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>
                {editing.isNew
                  ? t("shopping.admin.pageContent.newContentTitle")
                  : t("shopping.admin.pageContent.editContentTitle", {
                      title: editing.title ?? editing.id,
                    })}
              </DialogTitle>
              <DialogDescription>
                {editing.isNew
                  ? t("shopping.admin.pageContent.saveInstructions")
                  : t("shopping.admin.pageContent.editInstructions")}
              </DialogDescription>
            </DialogHeader>
            <PageContentForm form={editing} onChange={setEditing} error={error} />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>
                {t("shopping.admin.pageContent.cancel")}
              </Button>
              <Button
                onClick={() => handleSave(editing)}
                disabled={!editing.contentType || !editing.body}
              >
                {t("shopping.admin.pageContent.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  )
}

function PageContentForm({
  form,
  onChange,
  error,
}: {
  form: EditableForm
  onChange: (form: EditableForm) => void
  error: string | null
}) {
  const { t } = useTranslation()
  const contentTypes = useMemo(() => createContentTypeOptions(t), [t])
  const contentTypeLabel = (ct: string) => {
    const found = contentTypes.find((type) => type.value === ct)
    return found ? found.label : ct
  }
  const update = (partial: Partial<EditableForm>) => onChange({ ...form, ...partial })

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50/90 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <FormField label={t("shopping.admin.pageContent.form.contentType")} required>
          <Select value={form.contentType} onValueChange={(v) => update({ contentType: v ?? "" })}>
            <SelectTrigger>
              <SelectValue>{(value) => contentTypeLabel(String(value ?? ""))}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {contentTypes.map((ct) => (
                <SelectItem key={ct.value} value={ct.value} label={ct.label}>
                  {ct.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>

        <FormField label={t("shopping.admin.pageContent.form.title")}>
          <Input
            value={form.title ?? ""}
            onChange={(e) => update({ title: e.target.value || null })}
            placeholder={t("shopping.admin.pageContent.form.titlePlaceholder")}
          />
        </FormField>

        <FormField label={t("shopping.admin.pageContent.form.stage")}>
          <Input
            value={form.stage ?? ""}
            onChange={(e) => update({ stage: e.target.value || null })}
            placeholder={t("shopping.admin.pageContent.form.stagePlaceholder")}
          />
        </FormField>

        <FormField label={t("shopping.admin.pageContent.form.system")}>
          <Input
            value={form.system ?? ""}
            onChange={(e) => update({ system: e.target.value || null })}
            placeholder={t("shopping.admin.pageContent.form.systemPlaceholder")}
          />
        </FormField>

        <FormField label={t("shopping.admin.pageContent.form.summary")} className="md:col-span-2">
          <Input
            value={form.summary ?? ""}
            onChange={(e) => update({ summary: e.target.value || null })}
            placeholder={t("shopping.admin.pageContent.form.summaryPlaceholder")}
          />
        </FormField>

        <FormField label={t("shopping.admin.pageContent.form.reason")} className="md:col-span-2">
          <Input
            value={form.reason ?? ""}
            onChange={(e) => update({ reason: e.target.value || null })}
            placeholder={t("shopping.admin.pageContent.form.reasonPlaceholder")}
          />
        </FormField>

        <FormField
          label={t("shopping.admin.pageContent.form.body")}
          required
          className="md:col-span-2"
        >
          <textarea
            value={form.body}
            onChange={(e) => update({ body: e.target.value })}
            placeholder={t("shopping.admin.pageContent.form.bodyPlaceholder")}
            rows={10}
            className="flex min-h-[80px] w-full rounded-md border border-[color:var(--surface-border)] bg-[color:var(--surface-bg)] px-3 py-2 font-mono text-sm text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)] focus-visible:ring-2 focus-visible:ring-[color:var(--ring)] focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
          />
        </FormField>
      </div>
    </div>
  )
}

function FormField({
  label,
  required,
  className,
  children,
}: {
  label: string
  required?: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <label className={cn("space-y-1.5", className)}>
      <span className="text-xs font-medium text-[color:var(--text-secondary)]">
        {label}
        {required ? <span className="ml-0.5 text-red-400">*</span> : null}
      </span>
      {children}
    </label>
  )
}
