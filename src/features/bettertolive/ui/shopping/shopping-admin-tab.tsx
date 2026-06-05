import { FileText, Pencil } from "lucide-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ShoppingItemsAdmin } from "@/features/bettertolive/ui/shopping/shopping-items-admin"
import { ShoppingPageContentAdmin } from "@/features/bettertolive/ui/shopping/shopping-page-content-admin"
import { cn } from "@/lib/utils"

export function ShoppingAdminTab({
  isWideLayout = false,
  isFixedLayout = false,
}: {
  isWideLayout?: boolean
  isFixedLayout?: boolean
}) {
  const { t } = useTranslation()
  const [activeSection, setActiveSection] = useState("items")

  const ADMIN_SECTIONS = [
    {
      value: "items" as const,
      label: t("shopping.admin.itemsManagement"),
      description: t("shopping.admin.itemsManagementDesc"),
      icon: Pencil,
    },
    {
      value: "page-content" as const,
      label: t("shopping.admin.pageContentLabel"),
      description: t("shopping.admin.pageContentDesc"),
      icon: FileText,
    },
  ]

  return (
    <TabsContent
      value="admin"
      className={cn(
        "flex flex-col gap-4",
        isFixedLayout && "min-h-0 flex-1 overflow-hidden",
        isWideLayout && "gap-3",
      )}
    >
      <Tabs
        orientation="vertical"
        value={activeSection}
        onValueChange={setActiveSection}
        className={cn(
          "min-h-0 gap-4 max-md:flex-col md:flex-row",
          isFixedLayout && "min-h-0 flex-1 overflow-hidden",
          isWideLayout && "gap-3",
        )}
      >
        <div
          className={cn(
            "rounded-lg border border-[color:var(--muted-surface-border)] bg-[color:var(--muted-surface-bg)] p-2 md:w-[200px] md:flex-none",
            isFixedLayout && "shrink-0",
          )}
        >
          <TabsList
            variant="line"
            className={cn(
              "h-auto w-full flex-col items-stretch gap-1 rounded-md bg-transparent p-0",
              isWideLayout && "gap-0.5",
            )}
          >
            {ADMIN_SECTIONS.map((section) => {
              const Icon = section.icon

              return (
                <TabsTrigger
                  key={section.value}
                  value={section.value}
                  className={cn(
                    "h-auto min-h-0 rounded-md border border-transparent px-3 py-3 text-left data-active:border-[color:var(--surface-border)] data-active:bg-[color:var(--surface-bg)] data-active:text-[color:var(--text-primary)]",
                    isWideLayout && "px-2.5 py-2.5 text-[13px]",
                  )}
                >
                  <Icon />
                  <span className="min-w-0">
                    <span className="block font-medium">{section.label}</span>
                    <span className="mt-0.5 block text-xs text-[color:var(--text-muted)]">
                      {section.description}
                    </span>
                  </span>
                </TabsTrigger>
              )
            })}
          </TabsList>
        </div>

        {activeSection === "items" ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <ShoppingItemsAdmin isWideLayout={isWideLayout} isFixedLayout={isFixedLayout} />
          </div>
        ) : null}

        {activeSection === "page-content" ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <ShoppingPageContentAdmin isWideLayout={isWideLayout} isFixedLayout={isFixedLayout} />
          </div>
        ) : null}
      </Tabs>
    </TabsContent>
  )
}
