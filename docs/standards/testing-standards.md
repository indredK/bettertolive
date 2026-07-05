# 测试规范

> 用途：定义项目的测试框架、测试类型、编写约定与优先级。约定均提炼自现有代码实践，不是凭空发明。
>
> 与 `conventions.md` 分工：那份立"代码怎么写"的规约；这份定"测试怎么写"。

---

## 一、测试框架与工具

| 工具 | 用途 | 配置位置 |
|------|------|----------|
| Vitest | 测试运行器 | `vitest.config.ts` |
| @testing-library/react | React 组件测试 | `src/test/setup.ts` |
| @testing-library/jest-dom | DOM 断言扩展 | `src/test/setup.ts` |
| happy-dom | DOM 环境 | `vitest.config.ts` |
| fixture 数据 | 测试用例数据 | `src/features/bettertolive/*/__fixtures__/` |

**运行命令**：`bun run test`

---

## 二、测试类型与优先级

按投入产出比从高到低排序，优先写高价值测试：

| 优先级 | 测试类型 | 适用场景 | 价值 |
|--------|----------|----------|------|
| 🔴 最高 | **纯函数单元测试** | 数据计算、派生状态、工具函数、业务逻辑（如 `nutrition-page-data.ts`、`finance-page-data.ts`） | 输入输出明确，覆盖率高，维护成本低 |
| 🟡 中 | **自定义 Hook 测试** | 复杂状态编排、异步交互、controller hook | 验证状态流转逻辑，比组件测试更稳定 |
| 🟢 低 | **组件渲染测试** | 关键 UI 状态（空状态、错误态、加载态） | 防止回归，但受 UI 变更影响大，维护成本高 |
| ⚪ 暂不 | E2E 测试 / IPC 集成测试 | 全链路功能验证 | Tauri 桌面端 E2E 成本高，开发阶段暂不强制 |

**核心原则**：业务逻辑越复杂、越容易出 bug、越难肉眼验证的，越值得写测试。纯展示性 UI 不强制写测试。

---

## 三、测试编写约定

### 3.1 文件放置与命名

- **硬约定**：测试文件与被测文件同目录，命名 `<被测文件名>.test.{ts,tsx}`。
  - 例：`nutrition-page-data.ts` → `nutrition-page-data.test.ts`
  - 例：`use-workspace-view-model.ts` → `use-workspace-view-model.test.ts`
- **硬约定**：测试用例数据放在 `__fixtures__/` 目录下，命名 `<模块>.fixture.ts`；多个测试文件共享同一组 fixture。
- **建议**：按"给定-当-那么"（Given-When-Then）结构组织测试用例，语义清晰。

### 3.2 纯函数单元测试

适用：数据计算、派生状态、工具函数、业务逻辑编排。

**当前标杆**：`nutrition-page-data.test.ts`、`finance-page-data.test.ts`

- **硬约定**：使用 `describe` 分组，`it` 描述具体行为——测试名是"它应该做什么"，不是"它测试什么"。
  - ✅ `it("marks high-sugar plans with warning signals")`
  - ❌ `it("test buildDailyPlanSignals function")`
- **硬约定**：一个 `it` 只验证一个核心行为；多个断言但围绕同一结果可以接受。
- **建议**：覆盖典型场景 + 边界场景（空输入、极值、异常值），不追求逐行覆盖率。
- **建议**：涉及 i18n 的函数，通过 `createTranslator()` 工厂传入 mock `t` 函数，不依赖真实 i18n 环境。

### 3.3 自定义 Hook 测试

适用：复杂状态编排、异步交互、controller hook。

- **硬约定**：自定义 hook 测试必须用 `renderHook(() => useXxxHook())` + `result.current.xxx()` 模式（从 `@testing-library/react` 导入），**禁止在测试函数体内直接调用 hook**——违反 Rules of Hooks 会抛 `Invalid hook call. Hooks can only be called inside of the body of a function component.`。
- **硬约定**：异步动作包在 `await act(async () => { await result.current.foo(); })` 内，确保 state 更新被 React 调度。
- **建议**：优先验证 hook 返回的状态和 actions 的行为，不测试内部实现细节。

### 3.4 组件测试

适用：关键 UI 状态（空状态、错误态、加载态）、复杂交互组件。

- **硬约定**：使用 `@testing-library/react` 的 `render` + `screen` 查询，优先用角色/文本/标签等用户可见方式定位元素，不直接用 CSS 选择器。
- **硬约定**：用户交互用 `@testing-library/user-event` 的 `userEvent`，不用 `fireEvent`——`userEvent` 更接近真实用户行为。
- **建议**：组件测试聚焦"用户能观察到的行为"，不测试内部 state、不测实现细节。
- **建议**：模拟 Tauri 命令用 mock `invoke`，不依赖真实后端；模拟 Query 用 `QueryClientProvider` + 自定义 QueryClient。

### 3.5 Fixture 数据

- **硬约定**：fixture 数据是**稳定的测试输入**，一旦写入不应随意改动——改动会导致所有依赖它的测试结果变化。
- **建议**：fixture 覆盖典型场景（正常数据、边界数据、空数据），不要只造"完美数据"。
- **建议**：fixture 中的 ID 使用语义化前缀（如 `food-apple`、`plan-xxx`），便于测试断言时定位。

---

## 四、Mock 约定

- **硬约定**：Tauri 命令（`invoke`）通过 vi.mock 模拟，不调用真实 IPC——测试跑在 happy-dom 里，没有 Tauri 环境。
- **硬约定**：时间相关逻辑用 `vi.useFakeTimers()` 控制，不用 `setTimeout` 等待真实时间。
- **建议**：mock 只 mock 外部依赖（IPC、网络、时间），业务逻辑不 mock——mock 越多，测试越不真实。

---

## 五、哪些代码必须有测试

以下改动必须伴随测试（或更新已有测试）：

1. **新增纯函数型业务逻辑**（数据计算、派生状态、排序筛选算法等）
2. **修复 bug** —— 补一个复现该 bug 的测试，防止回归
3. **自定义 Hook 逻辑复杂到需要 review 时** —— 用测试锁定期望行为

以下可以不写：

1. 纯展示性 UI、样式调整
2. 一次性脚本、配置文件
3. 类型定义、常量声明
4. 简单的组件状态切换（开关、弹窗显隐）

---

## 六、审查要点

代码审查时，测试相关检查项：

- 新增业务逻辑是否有对应测试？
- 修复 bug 是否有回归测试？
- 测试名是否描述行为而非实现？
- 自定义 hook 测试是否用了 `renderHook` + `act`？
- fixture 数据是否稳定，有无随意改动导致大面积测试失效？
