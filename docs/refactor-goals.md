# 重构目标

> 下一阶段的优化方向。以后直接丢这个文档过来，按优先级逐项推进。

---

## 1. Feature 按域内聚（高优先级）

### 现状
`features/bettertolive/` 按层组织：所有 feature 的 API 混在 `api/`，所有查询混在 `queries/`，所有页面混在 `ui/`。改一个功能要跨 5 个目录翻找。

### 目标
改为按域组织，每个 feature 自包含：

```
features/bettertolive/
  config/                   # 全局配置（路由、通知、主题预设）
  models/                   # 全局类型（跨 feature 共享的类型）
  stores/                   # 全局 store（locale-store 等）
  hooks/                    # 全局 hook（theme、notification、music 等）
  shared/                   # 跨 feature 复用的 UI 组件
  reflection/               # ✅ 域内聚
    api.ts                  #   本 feature 的 API 调用
    queries.ts              #   本 feature 的 React Query 钩子
    page.tsx                #   页面组件
    components/             #   feature 内组件
    hooks/                  #   feature 内 hook（controller 等）
  beliefs/
    api.ts
    queries.ts
    page.tsx
    components/
    hooks/
  events/
    ...
  finance/
  ...
```

### 原则
- 只在 `shared/` 放真正跨 feature 复用的 UI（如 `liquid-glass`、`graph` 包装器）
- 每个 feature 的 `api.ts` 只导出该 feature 需要的 `invoke` 调用（可以直接用 bindings，也可以用 BetterToLiveApi 的方法）
- `queries.ts` 只导出该 feature 的 query/mutation 钩子
- 迁移时保持 `BetterToLiveApi` 接口不变，逐步替换消费方

---

## 2. Controller Hook 模式（中优先级）

### 现状
Page 组件直接处理所有交互逻辑，随着功能膨胀会越来越胖。

### 目标
每个 feature 导出一个 `useXxxController()` hook，封装所有操作和状态，Page 只做编排：

```tsx
// page.tsx
function ReflectionPage() {
  const ctrl = useReflectionController()
  return <ReflectionView data={ctrl.data} onSave={ctrl.handleSave} />
}
```

### 迁移策略
- 从最复杂的 feature 开始（shopping、finance）
- controller 不引入新状态管理，只是把现存逻辑从 page 抽出来

---

## 3. CSS 变量体系重组（低优先级）

### 现状
单文件 `globals.css`，约 200 个变量，所有主题变量混在一起。

### 目标（可选）
拆分为三层：

```
src/styles/
  tokens.css              @theme 命名映射（不含值）
  base.css                :root / .dark 的实际色值
  window-glass.css        毛玻璃等窗口主题覆盖（按需）
  animations.css          Apple 风格动画曲线（160~320ms 分级）
```

### 触发条件
- 需要支持毛玻璃等额外窗口主题时
- `globals.css` 超过 500 行时

---

## 4. 完成标准

一次 `refactor-goals.md` 修复会话完成后，检查项：

- [ ] TypeScript 编译零错误（`npx tsc --noEmit`）
- [ ] Rust 编译零错误（`cargo check`）
- [ ] 功能不受影响（至少 mock 模式下能跑）
