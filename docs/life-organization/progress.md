# 生命整理模块进度文档
> 从开发文档中提取当前状态、实施顺序、完成标准和本次不做范围。

---

## 进度摘录

### 2. 当前代码现状

当前生命整理模块主要由这些文件支撑：

| 文件 | 现状 |
|---|---|
| `src/features/bettertolive/ui/legacy/legacy-page.tsx` | 单页展示，包含分类分布、条目卡片、边界说明、回看问题 |
| `src/features/bettertolive/models/workspace.ts` | 已有 `LegacyItem / LegacyModuleData` 等类型 |
| `src/features/bettertolive/api/mock/data/legacy/legacy.mock.ts` | mock 数据已经覆盖 5 维分类、情感负荷、交付条件和锁定状态 |
| `src/features/bettertolive/hooks/use-workspace-view-model.ts` | 已有搜索过滤 legacy 数据 |
| `src-tauri/src/shopping/commands.rs` | `get_workspace_snapshot` 中 `legacy` 仍为 `None`，生命整理没有真实后端 |

当前页面和数据已经能表达旧设计，但还缺少：

- 顶层 Tab 信息架构。
- 条目新增 / 编辑 / 删除。
- 交付地图视图。
- 关系表达视图。
- 明确的信任边界配置页。
- SQLite 表和 Tauri 命令。

### 12. 实施顺序

1. 生成本设计文档与开发文档。
2. 扩展前端 `LegacyItem` 类型和 mock 数据。
3. 把 `legacy-page.tsx` 拆成 5 个 Tab 文件，保持现有展示能力不丢。
4. 新增条目库详情和编辑弹窗。
5. 新增交付地图分组工具和页面。
6. 新增关系表达页面。
7. 新增边界与信任页面。
8. 接入前端 API 方法，mock 先闭环。
9. 新增 Rust `legacy` 模块、SQLite 表和 Tauri commands。
10. live API 接入 Tauri commands。
11. 静态通读同模块文件，修掉命名、字段和类似遗漏问题。

### 13. Done Criteria

以下条件都满足才算完成：

- 新生命整理设计文档存在，并明确 5 个 Tab 和条目库唯一数据源。
- 开发文档存在，并明确前端拆分、模型、API、后端表和实施顺序。
- 旧“告别与托付分类建议”不再作为唯一设计文档。
- 前端页面可以按总览、条目库、交付地图、关系表达、边界与信任拆分。
- 条目新增 / 编辑 / 删除有明确 API 和后端计划。
- `status=最终版`、`emotionalLoad=很重`、`visibility=我离世后 / 条件触发` 的保护规则清楚。
- 不运行测试、不启动本地，只做代码和文档静态检查。

### 14. 本次不做

- 不接浏览器。
- 不运行测试或 lint。
- 不启动本地应用。
- 不做真实自动交付。
- 不做云同步和账号授权。
- 不做法律遗嘱生成。
- 不做加密方案落地。
