# 决策日志 Decision Log

> **为什么要有这个文件** — 记录方向性决策，避免反复讨论、避免 AI 重做已推翻的方案。
>
> **读法**：新增功能 / 做取舍前先读一遍，确认方向没走偏。
>
> **写法**：每次确定方向性决策后追加一条，编号 `D-NNN`，不可逆。
>
> **格式**：
> ```markdown
> ## D-001: <决策标题>
> - 日期：YYYY-MM-DD
> - 背景：<为什么要做这个决策>
> - 决策：<决定了什么>
> - 理由：<为什么选这个方案，放弃了哪些>
> - 影响：<哪些模块/代码受影响>
> ```

---

## D-001: 初始决策（占位）

- 日期：2026-03-05
- 背景：项目启动，需要确立技术栈和核心架构方向
- 决策：
  - 采用 Tauri v2 + React 19 + TypeScript + Vite 技术栈
  - 状态管理采用 TanStack Query（服务端状态）+ Zustand（客户端 UI 状态）双轨制
  - IPC 层使用 specta 自动生成类型绑定，Rust 为唯一事实来源
  - 数据库采用 SQLite（复杂关系型数据）+ JSON 文件（简单模块）双轨制
  - 样式采用 Tailwind CSS 4 + OKLCH 色彩空间
  - 动画采用 Motion / Framer Motion + LazyMotion 按需加载
- 理由：
  - Tauri 提供轻量级桌面应用体验，Rust 后端保证性能和安全性
  - TanStack Query 统一管理服务端状态缓存，避免 zustand 存副本
  - specta 消除 IPC 边界类型不一致问题，减少手写类型维护成本
  - SQLite + JSON 双轨制平衡复杂度，简单模块用 JSON 快速迭代，复杂关系用 SQLite
  - OKLCH 色彩空间提供更均匀的感知亮度，支持深色模式和主题切换
  - LazyMotion 按需加载减少首屏体积
- 影响：全项目架构的基础决策，所有模块开发都应遵循

---

## D-002: 模块组织模式（占位）

- 日期：2026-03-05
- 背景：19 个功能模块需要统一的组织模式
- 决策：
  - 前端采用 single-domain 架构，所有功能归 `features/bettertolive/` 下
  - 每个功能模块包含 `-page.tsx`、`-page-data.ts`、`queries.ts` 标准三件套
  - 私有组件放模块内 `components/`，可复用组件提升到 `components/`
  - API 边界层统一通过 `api/bettertolive-api.ts` 切换 live/fallback
- 理由：
  - 单域架构减少跨域通信复杂度，bettertolive 是单一产品
  - page / page-data / queries 三层分离保持视图层轻薄
  - API 边界层保证浏览器模式可运行，便于开发调试
- 影响：所有新增模块必须遵循此组织模式

---

## D-003: 国际化策略（占位）

- 日期：2026-03-05
- 背景：中/英双语支持，19 个模块命名空间
- 决策：
  - 采用 i18next，按模块拆分 JSON 文件
  - 译文是唯一事实来源，代码中不传 default value
  - 模块内 i18n 辅助函数放在 `<feature>-i18n.ts`
  - 颜色/数量等中性值用 canonical value，不写中文回退
- 理由：
  - 按模块拆分避免单个 JSON 过大，便于维护
  - 译文唯一来源保证不会出现"代码改了翻译没更"的漂移
  - canonical value 策略避免英文界面显示中文
- 影响：所有用户可见文案必须走 i18n
