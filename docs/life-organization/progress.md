# 生命整理模块进度文档
> 从开发文档中提取当前状态、实施顺序、完成标准和本次不做范围。

---

## 进度摘录

### 2026-06-08 实施更新

本轮已按 `development.md` / `design.md` 把生命整理从静态看板升级为可维护工作台：

| 范围 | 当前状态 |
|---|---|
| 前端信息架构 | 已拆成 `总览 / 条目库 / 交付地图 / 关系表达 / 边界与信任` 5 个 Tab |
| 条目库 CRUD | 已新增条目详情、轻筛选、控制模式下新增/编辑/删除、锁定条目解锁编辑 |
| 前端模型 | `LegacyItem` 已补 `content / requiresSecondConfirm / excludeFromAi / createdAt / finalizedAt`，并新增 `LegacyItemForm` |
| 后端数据 | 已新增 Rust `legacy` 模块、SQLite 表、Tauri commands、`seed.json` 示例数据 |
| 数据来源 | legacy 示例内容集中在 `src-tauri/src/legacy/seed.json`，前端 mock 使用空 fallback，不再维护第二份手写样例 |
| live API | `getLegacy / listLegacyItems / createLegacyItem / updateLegacyItem / deleteLegacyItem` 已接入 Tauri commands；workspace snapshot 已包含后端 legacy |
| 搜索 | 已补正文、二次确认、AI 排除、创建/最终确认时间等字段 |
| 保护规则 | 最终版锁定、重情感负荷二次确认、AI 排除和首次最终确认时间保留已落到前后端 |
| 国际化 | 已补 `zh/en` 的 `legacy.*` 页面、字段、筛选、提示、枚举翻译 |
| 主题 | 三套 workspace theme 已补 `--legacy-*` 专用变量 |

本轮追加修复：

- 已修复生命整理页窄屏 / 移动端堆叠布局：`LegacyPage` 在堆叠布局下不再强制 `h-full` 和 `overflow-hidden`，Tab 内容改为自然高度与可见溢出，避免页面内容被固定工作台滚动策略裁切。

本轮静态检查：

- 已解析 `src/i18n/locales/zh.json`、`src/i18n/locales/en.json`、`src-tauri/src/legacy/seed.json`，确认 JSON 语法有效。
- 已静态确认前端旧样例数据引用已清空，legacy 静态翻译 key 无缺失，三套主题均包含 `--legacy-*` 变量。
- 按项目指令未运行测试、lint、类型检查、未启动本地应用、未接浏览器。

### 2. 当前代码现状

当前生命整理模块主要由这些文件支撑：

| 文件 | 现状 |
|---|---|
| `src/features/bettertolive/ui/legacy/legacy-page.tsx` | 顶层 Tab 和编辑弹窗状态壳 |
| `src/features/bettertolive/ui/legacy/legacy-overview-tab.tsx` | 总览、分类覆盖、边界指标、最近更新和回看问题 |
| `src/features/bettertolive/ui/legacy/legacy-items-tab.tsx` | 条目库主 CRUD 入口、轻筛选、详情和删除 |
| `src/features/bettertolive/ui/legacy/legacy-delivery-map-tab.tsx` | 按接收者 / 可见时机组织交付地图 |
| `src/features/bettertolive/ui/legacy/legacy-relationship-expression-tab.tsx` | 聚焦写给人的内容和关系相关牵挂 |
| `src/features/bettertolive/ui/legacy/legacy-trust-boundaries-tab.tsx` | 信任边界、AI 排除、二次确认、锁定和法律边界 |
| `src/features/bettertolive/ui/legacy/legacy-item-edit-dialog.tsx` | 双栏编辑弹窗、锁定只读、解锁编辑、保护规则默认值 |
| `src/features/bettertolive/ui/legacy/legacy-page-data.ts` | 5 维枚举、统计、交付分组、关系表达桶和表单默认值 |
| `src/features/bettertolive/models/workspace.ts` | `LegacyItem / LegacyItemForm / LegacyModuleData` 等类型已更新 |
| `src-tauri/src/legacy/*` | SQLite schema、seed、repository 和 Tauri commands |
| `src-tauri/src/legacy/seed.json` | 按设计文档准备的 10 条条目、5 条信任边界、6 条回看问题 |
| `src/features/bettertolive/api/mock/data/workspace-snapshot.mock.ts` | legacy 使用空 fallback；样例数据只保留在后端 seed |
| `src/features/bettertolive/hooks/use-workspace-view-model.ts` | legacy 搜索已覆盖新字段 |
| `src-tauri/src/shopping/commands.rs` | `get_workspace_snapshot` 已包含后端 legacy 数据 |

原缺口已落地为代码；后续如果需要继续增强，可考虑导出交付清单、跨关系模块复制草稿、最终版解锁审计历史等 V1 外能力。

### 12. 实施顺序

1. 生成本设计文档与开发文档。已完成。
2. 扩展前端 `LegacyItem` 类型和 seed 数据。已完成。
3. 把 `legacy-page.tsx` 拆成 5 个 Tab 文件，保持现有展示能力不丢。已完成。
4. 新增条目库详情和编辑弹窗。已完成。
5. 新增交付地图分组工具和页面。已完成。
6. 新增关系表达页面。已完成。
7. 新增边界与信任页面。已完成。
8. 接入前端 API 方法。已完成。
9. 新增 Rust `legacy` 模块、SQLite 表和 Tauri commands。已完成。
10. live API 接入 Tauri commands。已完成。
11. 静态通读同模块文件，修掉命名、字段和类似遗漏问题。已完成。

### 13. Done Criteria

以下条件都满足才算完成：

- 新生命整理设计文档存在，并明确 5 个 Tab 和条目库唯一数据源。
- 开发文档存在，并明确前端拆分、模型、API、后端表和实施顺序。
- 旧“告别与托付分类建议”不再作为唯一设计文档。
- 前端页面可以按总览、条目库、交付地图、关系表达、边界与信任拆分。
- 条目新增 / 编辑 / 删除已有前端 API、Tauri commands 和 SQLite repository。
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
