# 记账模块进度文档
> 维护记账模块的实现状态、已完成事项和后续遗留问题。

---

## 当前状态

- `design.md` 已补齐记账模块 V1 的定位、数据维度、页面结构和 seed 数据边界。
- `development.md` 已补齐前端 DTO、Tauri command、编辑状态和文件组织约定。
- 本轮已按文档完成前端页面、后端 seed/持久化、国际化和主题接入。

## 已完成

- 新增 `src-tauri/src/finance/seed.json`，包含 12 条后端初始化账目、月度目标、类别规则和复盘问题。
- 新增 `get_finance` / `save_finance` Tauri command，使用 app data 下的 `finance.json` 做最小持久化。
- `live-bettertolive-api.ts` 已改为从 Rust 后端读取和保存记账模块数据，并在 workspace snapshot 中返回后端 finance 数据。
- 前端领域模型已扩展 `account`、`lifeSystem`、`necessity`、`reviewStatus`、`linkedModule`、`tags`、`monthlyTargets`、`categoryRules`、`reviewPrompts`。
- 记账页已从原来的只读交易列表改为一页响应式工作台：摘要、账目列表、类别/生活系统分布、目标和复盘信息同页展示。
- 管理模式下支持新增、编辑、删除账目，复用全局管理模式，不单独增加页面开关。
- 已删除前端 finance mock 数据文件，前端开发 mock 模式只保留空 fallback；样本数据统一在后端 seed。
- 已补齐 `zh` / `en` 国际化词典和三个主题的 finance 专用颜色变量。

## 进行中

- 无。

## 待处理

- 后续如需导入账单、预算周期、账户流水对账，可在保持 `FinanceModuleData` 聚合 DTO 的前提下再拆 SQLite 表。

## 暂不处理

- 不做复杂预算系统。
- 不做投资收益统计。
- 不做多人账本、报销、发票或税务场景。
