# 记账模块开发文档
> 汇总记账模块的前后端契约、数据持久化方案和当前实现路径。

---

## 1. 当前目标

记账模块 V1 需要完成：

1. 使用 `docs/finance/design.md` 中定义的账目模型
2. 页面从 `BetterToLiveApi` 消费数据，不在组件内硬编码账目
3. Tauri 环境下通过 Rust command 读写后端数据
4. 管理模式下支持新增、编辑、删除账目
5. 桌面固定布局与窄屏堆叠布局共用同一份数据
6. 国际化文本和主题变量统一接入

---

## 2. 前端 DTO

前端领域类型位于：

- `src/features/bettertolive/models/workspace.ts`

核心结构：

```ts
type TransactionEntry = {
  id: string
  date: string
  label: string
  category: string
  amount: number
  direction: "income" | "expense"
  note: string
  account?: string
  lifeSystem?: string
  necessity?: string
  reviewStatus?: string
  linkedModule?: string
  tags?: string[]
}

type FinanceMonthlyTarget = {
  id: string
  month: string
  incomeTarget?: number
  expenseLimit?: number
  savingTarget?: number
  note?: string
}

type FinanceCategoryRule = {
  id: string
  category: string
  monthlyLimit?: number
  intent: string
  reviewPrompt?: string
}

type FinanceModuleData = {
  entries: TransactionEntry[]
  monthlyTargets: FinanceMonthlyTarget[]
  categoryRules: FinanceCategoryRule[]
  reviewPrompts: string[]
}
```

---

## 3. 后端命令

Tauri command：

- `get_finance`
- `save_finance`

当前采用与饮食、社会经济等模块相同的最小持久化方案：

- app data 目录下保存 `finance.json`
- 文件不存在时返回 `src-tauri/src/finance/seed.json`
- 保存时写入临时文件再 rename，避免写一半损坏

后续如果需要更细的账目查询、筛选或批量导入，再迁移到 SQLite 表；前端 `FinanceModuleData` 聚合 DTO 保持稳定。

---

## 4. 前端文件约定

```text
src/features/bettertolive/
  api/
    fallback/empty-finance-module.ts
    live/live-bettertolive-api.ts
    mock/mock-bettertolive-api.ts
  queries/
    use-save-finance-mutation.ts
  ui/finance/
    finance-page.tsx
    finance-entry-edit-dialog.tsx
    finance-page-data.ts
    finance-i18n.ts
```

---

## 5. 编辑状态控制

记账模块复用全局管理模式：

- 浏览模式：只显示摘要、账目、类别和复盘信息
- 管理模式：显示新增账目按钮、单条编辑按钮、单条删除按钮

这与购物模块的“浏览/管理”分离保持一致，避免普通浏览时出现过多操作控件。

---

## 6. Seed 数据要求

`seed.json` 必须包含足够验证页面的样本数据：

- 至少 12 条账目
- 至少 1 条收入
- 至少 7 个不同类别
- 覆盖当月和本周
- 至少 3 条 `待复盘` 或 `可优化` 记录
- 至少 1 条与购物或饮食模块相关的记录

这些数据用于初始化后端，不作为前端 mock 数据源。
