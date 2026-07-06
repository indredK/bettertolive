# bettertolive 全局路线图

> **本文件是什么** — bettertolive 项目的全局方向和阶段目标。
>
> **和模块 roadmap 的关系**：
> - 本文档是**顶层路线图**，定义大方向和优先级
> - 各模块的 `docs/modules/<id>/roadmap.md` 是**执行层路线图**，记录该模块的具体任务
> - 两者冲突时，以本文件为准

---

## 项目愿景

一个 local-first 的个人成长与生活管理桌面应用，帮助用户：
- 建立清晰的自我认知（beliefs / values / principles）
- 管理生活的各个维度（health / finance / relationships / career）
- 记录成长轨迹（memory / journey / reflection / growth）
- 规划未来（future / goals）

---

## 阶段划分

| 阶段 | 代号 | 状态 | 说明 |
|------|------|------|------|
| Phase 0 | 基础设施 | ✅ 完成 | 项目脚手架、IPC 体系、UI 系统、i18n 框架 |
| Phase 1 | 核心模块 | 🚧 进行中 | 19 个功能模块的基础 CRUD + 数据持久化 |
| Phase 2 | 体验打磨 | ⏳ 待开始 | 动画、交互、性能、可用性优化 |
| Phase 3 | 跨域智能 | ⏳ 待开始 | 模块间联动、数据分析、洞察建议 |
| Phase 4 | 生态扩展 | ⏳ 待开始 | 插件、数据同步、移动端 / Web 端 |

---

## 当前阶段：Phase 1 — 核心模块

**目标**：完成所有 19 个功能模块的基础 CRUD 能力和数据持久化。

### 模块清单

| 模块 | 类型 | 状态 | 说明 |
|------|------|------|------|
| overview | JSON Store | 🚧 | 总览仪表盘 |
| reflection | JSON Store | 🚧 | 反思记录 |
| emotion | JSON Store | 🚧 | 情绪追踪 |
| events | JSON Store | 🚧 | 事件记录 |
| finance | JSON Store | 🚧 | 财务记录 |
| growth | JSON Store | 🚧 | 成长记录 |
| memory | JSON Store | 🚧 | 记忆档案 |
| journey | JSON Store | 🚧 | 人生旅程 |
| nutrition | JSON Store | 🚧 | 营养记录 |
| beliefs | JSON Store | 🚧 | 信念体系 |
| principles | JSON Store | 🚧 | 原则手册 |
| relationships | JSON Store | 🚧 | 关系管理 |
| socioeconomics | JSON Store | 🚧 | 社会经济 |
| future | JSON Store | 🚧 | 未来规划 |
| worldhistory | JSON Store | 🚧 | 世界历史 |
| legacy | SQLite | 🚧 | 遗产清单 |
| shopping | SQLite | ✅ | 购物清单（标杆模块） |
| （待补充） | — | — | — |

### Phase 1 完成标准

- [ ] 所有模块完成基础 CRUD
- [ ] 所有模块完成数据持久化（JSON 或 SQLite）
- [ ] 所有模块完成 i18n 中/英双语
- [ ] 所有模块有对应文档（README + roadmap）
- [ ] 导入导出功能可用
- [ ] 数据重置功能可用
- [ ] 类型安全全链路（specta bindings 完整）

---

## Phase 2 — 体验打磨

**目标**：把能用的东西变得好用。

- [ ] 全量动画打磨（入场/离场/过渡/微交互）
- [ ] 性能优化（大列表虚拟化、懒加载、首屏优化）
- [ ] 可用性提升（键盘导航、快捷键、错误提示）
- [ ] 深色模式 + 主题切换完整
- [ ] 无障碍支持（A11y）
- [ ] 搜索功能统一
- [ ] 拖拽排序全面支持

---

## Phase 3 — 跨域智能

**目标**：模块间产生化学反应，从"记录工具"变成"成长伙伴"。

- [ ] 数据洞察（情绪-事件关联、财务趋势分析等）
- [ ] 跨模块联动（beliefs → principles → actions 链路）
- [ ] 智能提醒和建议
- [ ] 数据可视化图表
- [ ] 时间线视图

---

## Phase 4 — 生态扩展

**目标**：从单桌面应用走向多端生态。

- [ ] 插件系统
- [ ] 数据同步（云端 / 多设备）
- [ ] Web 端
- [ ] 移动端
- [ ] 数据导入导出格式扩展

---

## 优先级原则

1. **稳定优先**：已有的功能先做稳定，再堆新功能
2. **质量优先**：一个做到 90 分，比十个做到 60 分强
3. **用户价值优先**：能直接帮到用户的优先，炫技靠后
4. **架构整洁优先**：技术债及时还，不堆到最后

---

## 如何更新本文件

- 阶段切换时更新状态标记
- 新增大方向决策时追加到对应 Phase
- 具体模块任务更新到各模块的 `roadmap.md`，不在这里展开
