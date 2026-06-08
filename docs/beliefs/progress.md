# 观念模块进度文档
> 当前模块没有单独进度源文档；本文件作为后续进度唯一入口。

## 当前状态

- `design.md` 已收纳 观念模块 的产品定位、分类维度、页面职责和边界。
- `development.md` 已收纳当前能从设计文档中提取的开发约定。
- 当前模块已进入第一轮可用实现；后续在本文件维护阶段状态、已完成事项和遗留问题。

## 已完成

- 前端观念页已按 `design.md` 的 4 维分类 + `impact` 展示方式重做，支持桌面一页式布局和窄屏堆叠布局。
- 观念页已接入全局管理模式，支持新增、编辑、删除观念条目，并保留删除撤销交互。
- 观念条目编辑已覆盖核心字段：
  - `domain / layer / stability / source / impact`
  - `secondaryDomains`
  - `cbtLayer / cognitiveDistortions / defenseMechanism / attachmentNote`
  - `tags`
- 编辑保存时已补充自动修订历史，至少覆盖：
  - 内容变化
  - 稳定性变化
  - 影响方向变化
- Tauri 后端已新增观念模块独立数据源：
  - `src-tauri/src/beliefs/seed.json`
  - `src-tauri/src/beliefs/commands.rs`
  - `get_beliefs / create_belief_entry / update_belief_entry / delete_belief_entry`
- 观念模块真实数据已改为后端提供并持久化到 `beliefs.json`，不再依赖前端专用 mock 数据文件。
- `live` 模式下的 workspace snapshot 已合并后端观念数据。
- 观念模块中英文文案已补齐，显示层通过 i18n 翻译枚举文案，不改变后端原始枚举值。
- 新增 UI 已统一使用现有主题变量，不单独引入新的硬编码色板体系。

## 进行中

- 暂无。

## 待处理

- 如后续确认需要，可继续补充：
  - 观念关系的新增/编辑/删除
  - 三层骨架卡片与反思问题的管理能力
  - 依恋自评、认知扭曲提示卡等文档里的扩展能力

## 暂不处理

- 数据库表结构拆分与 SQLite 细粒度建模，当前先沿用 JSON 文件持久化方案。
- 跨模块联动 API（观念 ↔ 原则 ↔ 关系 ↔ 成长记忆）。
- AI 自动提取观念与心理咨询式能力。

## 后续维护格式

- `已完成`：记录已经落地的页面、模型、接口或迁移。
- `进行中`：记录当前正在处理的阶段。
- `待处理`：记录尚未开始但已确认范围的事项。
- `暂不处理`：记录明确排除在当前阶段之外的内容。
