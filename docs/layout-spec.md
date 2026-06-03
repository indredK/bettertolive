# 布局规范

本文档记录本应用的全局布局规则。每条规则按「规则 → 为什么 → 例外」三段式描述,方便后续矫正代码时直接对照。

---

## 1. 滚动行为

### 规则

- **整页(`html` / `body`)不出现滚动条**——视口被布局完整占满,不存在页面级滚动。
- **内容区域的外层容器不出现滚动条**——主内容区作为一个整体,不滚动。这包括 app-shell 的 `<main>` 内层容器(`mx-auto w-full max-w-[1500px] ...`)和每个模块页的根 `<div>`。
- **每个模块页都按"固定壳"模式实现**——根容器在 `wide` / `compact` 模式下都是 `flex h-full flex-col min-h-0 overflow-hidden`,内部任何会溢出的子区块自带滚动容器。**不允许**模块页根容器只写 `space-y-*` 把内容堆下去等外层兜底滚动(这正是 §1 第二条要避免的)。
- **内容内的子区块可以独立滚动**——列表、卡片栈、详情面板等子模块按需 `overflow-y-auto`,且每个滚动容器都要在其链路上的所有 flex/grid 祖先设置 `min-h-0`。
- **窄屏(`stacked` 模式)允许整页滚动**——此时回退到正常文档流,模块页根容器写成 `space-y-*`、由 `html` / `body` `overflow: auto` 接管。模块组件通过 `isStackedLayout` 之类的 prop 区分两套根容器写法,而不是依赖隐式断点。

### 为什么

- **桌面端定位是工作台**:多区域并排展示(导航 / 列表 / 详情),用户视线在各区域之间切换,而不是从上往下浏览长文。整页滚动会让顶部信息(导航、工具栏)失焦,破坏空间记忆。
- **所有模块共享一种节奏**:如果一部分模块是"固定壳",一部分模块是"长页面",用户在模块之间切换时会有忽然变成滚动视图的错位感。统一为固定壳,模块切换才是无缝的横向移动。
- **窄屏放弃 shell**:小屏幕里多区域并排无意义,堆叠为单列后,正常滚动反而比拆分多个滚动容器更符合直觉,也避免嵌套滚动的手势冲突。

### 例外 / 实现要点

- **canonical 模式参考**:[shopping-page.tsx](src/features/bettertolive/ui/shopping-page.tsx) 已经实现了完整的固定壳:根容器 `flex h-full flex-col gap-3 space-y-0 overflow-hidden`,顶部摘要 `shrink-0`,中段网格 `min-h-0 flex-1 overflow-hidden`,内部列表用独立的 `overflow-y-auto` 容器。新模块页或重构旧模块页时,都以这个文件为模板。
- **app-shell 配合**:[app-shell.tsx](src/features/bettertolive/ui/app-shell.tsx) 的内容容器在非 `stacked` 模式下必须是 `min-h-0 flex-1 overflow-hidden`,而不是 `overflow-y-auto`。`overflow-y-auto` 等价于把"内容会很长"当默认,与本规则相悖。
- **必须配套设置 `min-height: 0`**:flex / grid 子项默认 `min-height: auto`,会被内容撑开导致滚动条出现在错误的层级。所有作为"滚动容器父级"的 flex 子项都要显式 `min-height: 0`(grid 同理 `min-block-size: 0`)。
- **`<m.div>` / motion 包装**:页面切换动画的包装容器在固定壳下应写成 `h-full`,而不是 `min-h-full`。`min-h-full` 会让内容超出时把外层撑高,触发外层滚动。
- **窄屏断点要同时解除两处**:不仅要切布局,还要把 `html, body { overflow: hidden }` 改回 `overflow: auto`,否则窄屏下内容被裁掉。
- **模态层 / Toast 不受此规则约束**:它们脱离正常文档流,自身管理滚动(如 `Dialog` 内部的长表单)。
- **滚动条样式统一**:子区块出现滚动条时使用统一的细滚动条样式(具体值后续在「滚动条样式」章节补充)。

---

## 2. 响应式断点

### 规则

应用使用三档布局模式,断点定义在 [src/features/bettertolive/ui/app-shell.tsx](src/features/bettertolive/ui/app-shell.tsx):

| 模式 | 视口宽度 | 形态 | 间距风格 |
|---|---|---|---|
| `wide` | ≥ 1240px | 侧栏 + 主内容并排,侧栏可展开 | 更紧凑(`px-6 py-3` / `py-2.5`) |
| `compact` | ≥ 960px 且 < 1240px | 侧栏 + 主内容并排,侧栏默认折叠 | 标准(`px-4 py-4`) |
| `stacked` | < 960px | 单列堆叠,整页可滚动 | 标准(`px-4 py-4`) |

### 为什么

- 1240 / 960 两个边界已经在 `app-shell.tsx` 里写死并被布局模式逻辑依赖,新组件不能各自再设一套断点。
- `wide` 模式刻意把间距收紧(`py-2.5`、`h-8` 输入框)——大屏不需要更松,需要更密的信息密度。
- `stacked` 模式同时切换:布局形态(单列)+ 滚动模式(整页滚动)+ 头部样式(竖排)。不要只切其中一项。

### 例外 / 实现要点

- 组件内部如果要响应布局模式,优先读父层传下的 `isWideLayout` / `isStackedLayout` 之类的 props,而不是再用 `useWorkspaceLayoutMode()`,避免布局判断分散。
- 不引入新的中间断点。需要更细粒度时,用 props 控制密度(参考 `isWideLayout` 模式)。

---

## 3. 间距尺度

### 规则

只在以下尺度内选择,不引入项目内未出现的值:

| 用途 | 主选 | 备选 |
|---|---|---|
| `gap` 行内紧凑(图标+文字、徽章组) | `gap-2` | `gap-1`(更紧) |
| `gap` 卡片内部分组 | `gap-3` | — |
| `gap` 区块之间 | `gap-4` | — |
| 内边距 容器/卡片 | `p-5` | `p-4` |
| 内边距 横向(header / 主内容) | `px-4` | `px-6`(`wide` 模式) |
| 内边距 纵向(header / 主内容) | `py-4` | `py-3`(密集)/ `py-2.5`(`wide` 模式) |

### 为什么

实际统计:`gap-2`(62 次)、`gap-3`(35)、`gap-4`(35);`px-4`(53)、`py-4`(34)、`p-5`(42)、`py-3`(26)、`px-3`(21)。这套尺度已经是事实标准,继续用它意味着新代码自动一致。

### 例外 / 实现要点

- 不要用 `gap-5`、`p-3`、`py-8` 这类只出现 1–2 次的零散值——它们是历史残留,新代码不要扩大它们的使用面。
- 紧贴 wrap 元素(`flex-wrap`)时常需要 `gap-3` 而非 `gap-2`,避免折行后挤在一起。
- 长文本区域(段落、列表项)用 `py-1` / `py-2` 控制行间,不与卡片内边距尺度混。

---

## 4. 圆角

### 规则

| 场景 | 类 |
|---|---|
| 默认控件、按钮、卡片、容器 | `rounded-lg` |
| 大型容器、面板 | `rounded-xl` 或 `rounded-2xl` |
| 头像、徽章、纯图标按钮、圆形指示点 | `rounded-full` |

`rounded-lg` 锚定 `--radius: 0.625rem`(10px),其余级别按比例衍生(见 [globals.css:70](src/styles/globals.css:70))。

### 为什么

统计:`rounded-lg` 64 次、`rounded-full` 34 次、`rounded-xl` 11、`rounded-2xl` 4、`rounded-md` 2。`rounded-lg` 是事实上的"默认圆角",`rounded-md` 几乎没人用,新代码不要再选它。

### 例外 / 实现要点

- 同一卡片里嵌套元素圆角不要超过父级。
- 需要"近乎方形"的内嵌格子时用 `rounded-sm`,不要自己写 `rounded-[2px]`。

---

## 5. 容器宽度

### 规则

| 用途 | 值 |
|---|---|
| 主内容区最大宽度 | `max-w-[1500px]`,配合 `mx-auto` |
| 侧栏展开宽 | `w-[292px]` |
| 侧栏折叠宽 | `w-[92px]` |
| 顶部搜索框最大宽 | `max-w-[400px]` |

### 为什么

`1500px` 是已在 4 处使用的主内容容器上限。超出会让多列布局看起来太空,信息密度被稀释。`292 / 92` 是 app-shell 的固定值,改动会牵连 motion `layout` 动画。

### 例外 / 实现要点

- 新增主内容容器一律 `mx-auto w-full max-w-[1500px]`。不要在内部子组件再设一次 `max-w-[1500px]`(已经被父层限制了)。
- 详情面板、对话框有自己的宽度档(后续追加),不复用主内容的 1500。

---

## 6. 层级(z-index)

### 规则

所有 z-index 走 [src/lib/ui-layers.ts](src/lib/ui-layers.ts) 的 `UI_LAYERS` 常量,不写裸 `z-*`:

| 层 | 值 | 用途 |
|---|---|---|
| `header` | 20 | 顶部栏 / 主内容内的固定 header |
| `utilityPanel` | 90 | 右上工具面板浮层 |
| `notifications` | 100 | 通知列表 / Toast |
| `dialogOverlay` | 140 | 对话框遮罩 |
| `dialogContent` | 150 | 对话框内容 |

### 为什么

层级集中管理后,出现"被遮住""挡住下拉"等问题时,只需调常量,而不用全局搜 `z-50` / `z-99`。

### 例外 / 实现要点

- 需要新增层级时(例如新增"全屏临时视图"),先在 `UI_LAYERS` 加常量,再使用。
- Tailwind 的 `z-10` / `z-20` 之类的预设别再用——已经用裸数字 `z-[20]` 把档位定死。

---

## 7. 颜色与字体令牌

### 规则

- **颜色一律读 CSS 变量**:`[color:var(--text-primary)]`、`bg-[color:var(--chip-bg)]`、`border-[color:var(--surface-border)]`。变量在 [src/styles/globals.css](src/styles/globals.css) 与 workspace 主题文件中定义。
- **字体一律走 `--font-sans`**(Geist Variable),通过 `@layer base` 已注入 `html`,不需要每个组件再 `font-sans`。
- **字号锚点**:正文 `text-sm`,辅助说明 `text-xs`,卡片标题 `text-[1.05rem]` ~ `text-[1.15rem]`,页面主标题 `text-[1.35rem]`(`wide` 模式下收到 `text-[1.2rem]`)。

### 为什么

变量是主题切换的唯一入口(`useWorkspaceTheme`)。一旦在组件里写死 `text-neutral-700` 这种,主题切换就会失效,而 bug 表象是"某些区域不跟着换主题"——很难定位。

### 例外 / 实现要点

- 用 shadcn 组件时其内部已用 `bg-background` / `text-foreground` 等语义令牌,不要再额外覆盖颜色。
- 业务页面用 workspace 主题变量(`--text-primary` 等),shadcn 内部用 shadcn 令牌(`--foreground` 等),两套不要混。
- 字距类 `tracking-[0.22em]`(标签小字)、`tracking-tight`(标题)——除此之外不引入新字距。

---

## 8. 模块页结构骨架

### 规则

每个模块页(`overview` / `reflection` / `nutrition` / ... )都按下面这一套骨架实现,只有内部子区块的分栏可以差异化:

```tsx
// canonical 模块页骨架,对照 shopping-page.tsx
export function ModulePage({ isWideLayout, /* data... */ }) {
  return (
    <div
      className={cn(
        "space-y-5",                                       // stacked 模式:正常文档流
        isWideLayout && "flex h-full flex-col gap-3 space-y-0 overflow-hidden",
        // compact 模式介于两者之间;如果模块在 compact 也想固定壳,沿用上面这一行
      )}
    >
      <PageIntro ... />                                    // 永远在最上,占自然高度

      <div
        className={cn(
          "grid gap-4 min-[960px]:grid-cols-3",             // 顶部摘要 SummarySurface 阵列
          isWideLayout && "shrink-0 gap-3",                 // 固定壳里要 shrink-0
        )}
      >
        <SummarySurface ... />
      </div>

      <div
        className={cn(
          "grid gap-4 min-[1240px]:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.88fr)]",
          isWideLayout && "min-h-0 flex-1 gap-3 overflow-hidden",
        )}
      >
        {/* 这里的每一列再各自 overflow-y-auto,详见下条 */}
      </div>
    </div>
  )
}
```

每一列(`Surface` 等卡片栈)在固定壳模式下要包一层独立的滚动容器:

```tsx
<Surface className={cn("p-5", isWideLayout && "flex h-full min-h-0 flex-col")}>
  <SectionHeading ... />                                   // shrink-0
  <div
    className={cn(
      "mt-5 space-y-4",
      isWideLayout && "min-h-0 flex-1 overflow-y-auto pr-1",
    )}
  >
    {entries.map(...)}
  </div>
</Surface>
```

### 为什么

- **一套骨架,横向无缝**:模块切换时如果一个页面是固定壳、下一个是长滚动页,用户会瞬间失去空间方位感。统一骨架后,模块之间就是横向移动,而不是切换到新形态。
- **"哪里出滚动条"是设计决策**:固定壳让"哪一列长、哪一列要滚"成为可控的设计判断,而不是"内容多就自动撑长页面"的隐式后果。
- **`isWideLayout` 作为单一切换点**:只在根容器和容器边界使用 `isWideLayout` 切换形态,内部细节不重复判断,避免布局逻辑散落。

### 例外 / 实现要点

- **`PageIntro` 不占行高时**:`PageIntro` 在没有 `searchQuery` 时返回 `null`(参考 [shared.tsx:36](src/features/bettertolive/ui/shared.tsx:36)),不会破坏 `flex-1` 中段的高度计算,不需要额外处理。
- **顶部摘要可缺省**:不是所有模块都有摘要阵列。没有摘要时,中段网格直接成为 `flex-1 min-h-0`,不要塞占位卡片。
- **滚动容器只能出现在叶子层**:不要在中段网格上写 `overflow-y-auto`——那会让两列同时滚动,空间感塌掉。只让每一列内部的列表 `overflow-y-auto`。
- **`pr-1` / `pr-0.5` 给滚动条留位**:子区块开启 `overflow-y-auto` 后,加一点右内边距让滚动条不贴边,这点参考 [sidebar-navigation.tsx](src/features/bettertolive/ui/sidebar-navigation.tsx) 的 `pr-0.5`。
- **`stacked` 模式不走这套**:窄屏直接 `space-y-5`,所有 `flex h-full overflow-hidden` / `min-h-0 flex-1 overflow-y-auto` 都不加。判断逻辑挂在 `isWideLayout`(或 `!isStackedLayout`)props 上,不在组件内部再调 `useWorkspaceLayoutMode()`。
- **数据非常少的模块**:即使现在内容很短也按固定壳实现——内容会随使用增长,等"开始溢出再改"成本远高于一开始就按规则写。

---

<!-- 后续追加新章节时,沿用「规则 → 为什么 → 例外」三段式 -->
