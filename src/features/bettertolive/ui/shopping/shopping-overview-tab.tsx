import { useTranslation } from "react-i18next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ShoppingItem, ShoppingModuleData } from "@/features/bettertolive/types"
import { ShoppingStatus } from "@/features/bettertolive/types"
import { itemHasStatus } from "@/features/bettertolive/ui/shopping/shopping-page-data"

export function ShoppingOverviewTab({
  shopping,
  items,
}: {
  shopping: ShoppingModuleData
  items: ShoppingItem[]
}) {
  const { t } = useTranslation()
  const ownedCount = items.filter((i) => itemHasStatus(i, ShoppingStatus.Owned)).length
  const wantedCount = items.filter((i) => itemHasStatus(i, ShoppingStatus.Wanted)).length

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label={t("shopping.overview.itemsTotal", "物品总数")} value={items.length} />
        <StatCard label={t("shopping.overview.itemsOwned", "已有")} value={ownedCount} />
        <StatCard label={t("shopping.overview.itemsWanted", "待购")} value={wantedCount} />
        <StatCard
          label={t("shopping.overview.stagesTotal", "阶段适用")}
          value={shopping.stageTemplates.length}
        />
      </div>

      {shopping.spotlights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("shopping.overview.spotlights", "焦点提示")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {shopping.spotlights.map((s) => (
              <div key={s.id} className="bg-card rounded-md border p-3">
                <div className="font-medium">{s.title}</div>
                <div className="text-muted-foreground text-sm">{s.summary}</div>
                {s.attention.length > 0 && (
                  <ul className="text-muted-foreground mt-2 list-disc pl-5 text-xs">
                    {s.attention.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {shopping.lifestyleCollections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>{t("shopping.overview.lifestyle", "生活方式集合")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {shopping.lifestyleCollections.map((c) => (
              <div key={c.id} className="bg-card rounded-md border p-3">
                <div className="font-medium">{c.title}</div>
                <div className="text-muted-foreground text-sm">{c.description}</div>
                <div className="text-muted-foreground mt-1 text-xs">{c.items.join(" / ")}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-1 p-4">
        <div className="text-muted-foreground text-xs uppercase">{label}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  )
}
