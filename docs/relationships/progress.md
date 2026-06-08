# 关系深化模块进度文档
> 当前模块没有单独进度源文档；本文件作为后续进度唯一入口。

## 当前状态

- `design.md` 已收纳 关系深化模块 的产品定位、分类维度、页面职责和边界。
- `development.md` 已收纳当前能从设计文档中提取的开发约定。
- 第一阶段实现已落地：关系模块从前端静态展示页迁移为后端 JSON seed + app data 持久化 + 前端管理态页面。
- 当前阶段不拆 SQLite 表，先沿用饮食 / 情绪模块的 JSON 过渡层；后续如需细粒度 CRUD，可再按 `development.md` 拆表。

## 后续维护格式

- `已完成`：记录已经落地的页面、模型、接口或迁移。
- `进行中`：记录当前正在处理的阶段。
- `待处理`：记录尚未开始但已确认范围的事项。
- `暂不处理`：记录明确排除在当前阶段之外的内容。

## 已完成

- 新增 `src-tauri/src/relationships/` 后端模块：
  - `commands.rs` 提供 `get_relationships` / `save_relationships`。
  - `seed.json` 提供按设计文档构造的初始样本数据，覆盖 6 种关系类型、5 级深度、6 种阶段、4 种影响方向、6 级互动频率、4 级未完成重量，以及三种“想说的话”目标类型。
  - `mod.rs` 注册 relationships command 模块。
- `src-tauri/src/lib.rs` 已注册 `RelationshipsState`，并把 `relationships.json` 写入 app data 目录，保存采用临时文件替换目标文件，降低半写入风险。
- live API 已接入 Rust command：
  - `getRelationships` 使用 `get_relationships`。
  - `saveRelationships` 使用 `save_relationships`。
  - `getWorkspaceSnapshot` 已把 relationships 纳入后端读取结果，避免 live 模式继续使用前端关系 mock。
- mock API 已补齐会话级 `saveRelationships` 闭环；前端 mock 文件改为复用 Tauri relationships seed，避免维护第二份关系样本。
- 新增 `useSaveRelationshipsMutation`，保存成功后刷新 workspace snapshot 与 relationships query。
- `RelationshipsPage` 已重构为一页式响应式工作台：
  - 顶层 Tab：总览 / 关系档案 / 想说的话 / 跨关系模式。
  - 总览展示 5 维分布与未完成重量分布，并补充滋养、消耗、紧张/修复、很重表达等核心指标。
  - 关系档案采用左侧列表 + 右侧详情，并提供 type / depth / stage / impact / interaction 五维筛选；窄屏自动堆叠，固定壳下内部滚动。
  - 想说的话按未完成重量排序，支持关联关系、独立对象、未来的自己。
  - 跨关系模式独立展示，可维护重复出现的关系角色和冲突路径。
- 第二轮严格复查已修复窄屏堆叠布局：双栏列表与详情面板在移动端自然撑开并显示溢出，`lg` 桌面布局继续使用固定高度内部滚动，避免关系详情、想说的话和跨关系模式内容被裁切。
- 管理态已与全局“管理模式”联动：
  - 浏览模式只读展示。
  - 控制模式显示新增、编辑、删除入口。
  - 关系条目支持编辑 5 维分类、未完成重量、关系档案、当前状态、情绪线索、想说的话摘要、正面影响、持续阴影、边界状态、关键互动事件、depth/stage 变化历史。
  - 想说的话和跨关系模式均支持新增、编辑、删除。
  - 删除沿用购物模块的 5 秒可撤销队列交互。
- 已补齐 `relationships.*` 中英文国际化：
  - 页面标题、tabs、空态、编辑弹窗、删除 toast。
  - type / depth / stage / impact / interaction / unfinishedWeight / eventKind / changeField / targetType 枚举显示。
- 主题适配已使用现有 workspace theme CSS 变量；关系页所有面板、badge、指标和编辑弹窗跟随当前主题。
- 已做轻量静态数据检查：
  - `src-tauri/src/relationships/seed.json` 可被 JSON 解析。
  - `src/i18n/locales/zh.json` / `src/i18n/locales/en.json` 可被 JSON 解析。
  - 静态 `relationships.*` 翻译 key 已覆盖中英文 locale。

## 待处理

- 后续可把 relationships JSON 过渡层升级为 SQLite 表与细粒度 CRUD command。
- 后续可增加圈层本身的新增、编辑、排序；当前阶段先维护 seed 中的圈层，并允许关系条目在既有圈层间移动。
- 后续可继续做关系与情绪、成长记忆、生命整理模块的跨模块引用校验。

## 暂不处理

- 不实现隐私权限体系。
- 不实现关系与外部通讯录同步。
- 按当前仓库约定，本次不运行测试、lint，不启动本地服务，也不接管浏览器验证。
