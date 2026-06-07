# 饮食模块重构开发文档

## 1. 目标

把现有饮食模块从“进食观察看板”重构为完整的饮食工作台：

- 食谱库
- 食品库与食品分类
- 营养成分表
- 每日计划
- 进食记录与回顾
- 总览一屏工作台

本开发文档对应 [饮食模块设计文档](./module-design/nutrition-module.md)。

## 2. 当前代码现状

当前饮食模块主要由这些文件支撑：

| 文件 | 现状 |
|---|---|
| `src/features/bettertolive/ui/nutrition/nutrition-page.tsx` | 单页看板，围绕进食记录、5 维分类、周回顾、食物记忆 |
| `src/features/bettertolive/models/workspace.ts` | 已有 `NutritionMealEntry / DietaryProfile / NutritionFoodMemory / NutritionWeeklyReview` |
| `src/features/bettertolive/api/mock/data/nutrition/nutrition.mock.ts` | mock 数据需要替换为新版食谱、食品、计划与记录结构 |
| `src/features/bettertolive/hooks/use-workspace-view-model.ts` | 搜索过滤需要兼容新版 nutrition 数据 |

旧设计不再作为模块主线；新实现以新版信息架构替换旧看板，只保留可服务计划校准的观察字段。

## 3. 新信息架构

建议顶层目录：

```text
src/features/bettertolive/ui/nutrition/
  nutrition-page.tsx
  nutrition-overview-tab.tsx
  nutrition-daily-plan-tab.tsx
  nutrition-recipes-tab.tsx
  nutrition-foods-tab.tsx
  nutrition-nutrients-tab.tsx
  nutrition-logs-tab.tsx
  nutrition-page-shared.tsx
  nutrition-page-data.ts
  nutrition-types.ts
```

与购物模块保持同类分层：

| 购物模块 | 饮食模块 |
|---|---|
| `shopping-page.tsx` | `nutrition-page.tsx` |
| `shopping-overview-tab.tsx` | `nutrition-overview-tab.tsx` |
| `shopping-planning-tab.tsx` | `nutrition-recipes-tab.tsx` 或 `nutrition-daily-plan-tab.tsx` |
| `shopping-systems-tab.tsx` | `nutrition-foods-tab.tsx` |
| `shopping-page-shared.tsx` | `nutrition-page-shared.tsx` |
| `shopping-page-data.ts` | `nutrition-page-data.ts` |

## 4. 数据模型重构

### 4.1 前端模型

在 `src/features/bettertolive/models/workspace.ts` 增加或替换以下类型：

```ts
export type FoodCategoryDimension =
  | "食物大类"
  | "食材形态"
  | "储存方式"
  | "使用频率"
  | "饮食立场"

export type FoodCategoryDefinition = {
  id: string
  name: string
  dimension: FoodCategoryDimension
  description?: string
  sortOrder: number
}

export type NutritionBasisUnit = "g" | "ml"

export type FoodNutrientProfile = {
  id: string
  foodId: string
  basisAmount: number
  basisUnit: NutritionBasisUnit
  energyKcal?: number
  proteinG?: number
  fatG?: number
  carbG?: number
  fiberG?: number
  sugarG?: number
  sodiumMg?: number
  source: "手动" | "包装" | "食物成分表" | "外部导入"
  confidence: "高" | "中" | "低"
}

export type FoodItem = {
  id: string
  name: string
  categoryIds: string[]
  defaultUnit: "g" | "ml" | "个" | "份"
  storage?: "常温" | "冷藏" | "冷冻" | "即食"
  lifecycle?: "新鲜短期" | "常备" | "干货" | "调味" | "饮品"
  allergenTags: string[]
  dietaryTags: string[]
  nutrientProfileId?: string
  note?: string
}

export type RecipeIngredient = {
  foodId: string
  amount: number
  unit: "g" | "ml" | "个" | "份"
  note?: string
}

export type Recipe = {
  id: string
  name: string
  summary?: string
  servings: number
  mealRoles: MealStructure[]
  ingredients: RecipeIngredient[]
  steps: string[]
  prepMinutes?: number
  cookMinutes?: number
  difficulty: "简单" | "中等" | "麻烦"
  repeatability: "常做" | "偶尔" | "只想记录"
  tags: string[]
  linkedFoodMemoryId?: string
}

export type DailyMealSlot = {
  id: string
  structure: MealStructure
  entries: DailyPlanEntry[]
  status: "planned" | "prepared" | "eaten" | "skipped" | "replaced"
  note?: string
}

export type DailyPlanEntry =
  | { type: "recipe"; recipeId: string; servings: number }
  | { type: "food"; foodId: string; amount: number; unit: string }
  | { type: "text"; title: string; note?: string }

export type DailyPlan = {
  id: string
  date: string
  slots: DailyMealSlot[]
  note?: string
}

export type MealLog = {
  id: string
  dateTime: string
  plannedSlotId?: string
  entries: DailyPlanEntry[]
  scene?: MealScene
  trigger?: MealTrigger
  valueDensity?: ValueDensity
  bodyFeedback?: BodyFeedback
  relatedFoodMemoryId?: string
  changeReason?: string
  note?: string
}

export type NutritionModuleData = {
  profile: DietaryProfile
  foodCategories: FoodCategoryDefinition[]
  foods: FoodItem[]
  nutrientProfiles: FoodNutrientProfile[]
  recipes: Recipe[]
  dailyPlans: DailyPlan[]
  mealLogs: MealLog[]
  weeklyReview: NutritionWeeklyReview
  foodMemories: NutritionFoodMemory[]
}
```

### 4.2 旧模型迁移

旧字段迁移方向：

| 旧字段 | 新位置 |
|---|---|
| `meals` | `mealLogs` |
| `foodMemories` | 保留 |
| `weeklyReview` | 保留，但数据来源改为 `dailyPlans + mealLogs` |
| `profile` | 保留 |
| `scene / trigger / valueDensity / bodyFeedback` | 保留在 `MealLog` |

## 5. 前端页面计划

### 5.1 `nutrition-page.tsx`

职责：

- 管理顶层 Tab。
- 接收 `NutritionModuleData`。
- 传递布局 props。
- 不直接写复杂业务逻辑。

Tab：

- `overview`
- `dailyPlan`
- `recipes`
- `foods`
- `nutrients`
- `logs`

### 5.2 `nutrition-overview-tab.tsx`

总览应一屏优先：

- 今日计划完成度。
- 当前饮食意图、硬约束和软立场。
- 今日营养摘要。
- 待补食材 / 缺口。
- 推荐可做食谱。
- 最近身体反馈。

需要图表时使用项目已有 `recharts`。

### 5.3 `nutrition-daily-plan-tab.tsx`

布局：

```text
左侧：日期列表 / 周视图
中间：当天餐次计划
右侧：营养摘要 + 缺口 + 可替换建议
```

功能：

- 新增餐次条目。
- 从食谱库选择。
- 从食品库选择。
- 录入临时文本。
- 标记已吃 / 跳过 / 替换。
- 从计划生成 MealLog。

### 5.4 `nutrition-recipes-tab.tsx`

布局参考购物物件库：

```text
左侧：食谱列表 + 搜索 + 筛选
右侧：食谱详情
```

筛选：

- 餐次。
- 难度。
- 标签。
- 是否缺食材。
- 是否有关联食物记忆。

详情：

- 食材表。
- 步骤。
- 每份营养。
- 最近进食反馈。

### 5.5 `nutrition-foods-tab.tsx`

布局参考购物系统 / 空间视图：

```text
左侧：分类维度列表
右侧：该分类下食品
```

视角：

- 食物大类。
- 食材形态。
- 储存方式。
- 使用频率。
- 饮食立场。

### 5.6 `nutrition-nutrients-tab.tsx`

这是表格密度最高的 Tab。

视图：

- 食品营养表。
- 食谱每份营养。
- 每日计划营养合计。

要求：

- 不把缺失数据算成 0。
- 缺失显示为 `待补`。
- 每个营养字段有单位。
- 支持简单搜索和分类筛选。

### 5.7 `nutrition-logs-tab.tsx`

迁移观察与回顾能力：

- 最近进食记录。
- 计划偏差。
- 场景 / 触发。
- value_density。
- body_feedback。
- 食物记忆关联。

## 6. 共享组件计划

新增 `nutrition-page-shared.tsx`：

- `NutritionTabViewport`
- `NutritionTabBody`
- `NutritionSidebarPane`
- `NutritionDetailPane`
- `NutritionEmptyDetailCard`
- `NutritionSelectableCard`
- `NutritionMetricCard`

样式要求：

- 只使用全局主题 token。
- 不写固定颜色。
- 可参考购物模块 `SHOPPING_*_CLASS` 的方式抽常量。

## 7. Mock 数据计划

重写 `src/features/bettertolive/api/mock/data/nutrition/nutrition.mock.ts`。

V1 mock 至少包含：

- 8 个食品分类。
- 15 个食品。
- 15 条营养档案。
- 6 个食谱。
- 7 天每日计划。
- 8 条实际进食记录。
- 3 条食物记忆。
- 3 条周回顾。

Mock 要覆盖：

- 食谱引用多个食品。
- 某些食品缺营养数据。
- 每日计划中同时有食谱、食品、临时文本。
- MealLog 从计划生成和独立补记两种情况。

## 8. 后端计划

如果饮食模块进入可编辑持久化，建议参考购物模块独立建 Rust 子模块：

```text
src-tauri/src/nutrition/
  mod.rs
  commands.rs
  seed.json
  db.rs
  models.rs
  dto.rs
  repository.rs
```

### 8.0 当前进度

已完成第一阶段后端入口：

- 新增 `src-tauri/src/nutrition/mod.rs`。
- 新增 `src-tauri/src/nutrition/commands.rs`。
- 新增 `src-tauri/src/nutrition/seed.json`。
- 新增 Tauri command `get_nutrition`。
- 新增 Tauri command `save_nutrition`。
- live API 的 `getNutrition` 与 `getWorkspaceSnapshot` 已优先从 Rust command 读取饮食 seed，失败时回退 mock。
- live API 已提供 `saveNutrition`，当前写入 app data 下的 `nutrition.json`。
- 前端已新增 `useSaveNutritionMutation`，保存成功后刷新 workspace snapshot 与 nutrition query。
- 每日计划 Tab 已接入计划新增、编辑、删除；支持餐次、状态、备注，以及食谱 / 食品 / 文本条目组合；右侧摘要已补充今日缺口与可替换食谱建议。
- 总览与每日计划 Tab 已改为优先匹配本地今天的 `DailyPlan`，不存在今日计划时再回退第一条计划，避免“今日”语义和数据顺序耦合。
- 每日计划 Tab 已支持从具体餐次生成 `MealLog`，生成后自动关联 `plannedSlotId`、复制计划条目、标记餐次为已吃，并避免重复生成同一餐次记录。
- 食品分类 Tab 已接入分类与食品的新增、编辑、删除；食品保存会同步维护基础营养档案，分类删除会保护食品引用，食品删除会保护食谱、每日计划与进食记录引用。
- 食品分类 Tab 已补充“全部食品”虚拟视角，搜索默认可跨分类覆盖整个食品库，避免搜索被当前分类锁死。
- 食谱库 Tab 已接入食谱新增、编辑、删除；食材引用食品库，删除时会阻止仍被每日计划或进食记录引用的食谱，并支持标签筛选、关联食物记忆、展示最近一次实际进食反馈，以及按关联记忆 / 已有反馈筛选。
- 食谱库筛选状态已从中文显示值改为语言无关的稳定 id，筛选展示继续走中英文国际化，避免 UI 文案和业务判断耦合。
- 营养成分表 Tab 已接入搜索、分类筛选、只看待补筛选；缺失计数按营养字段统计。
- 营养成分表 Tab 已接入行点击详情抽屉，展示完整营养明细与六维雷达图；雷达图先用已有营养字段和稳定模拟分数承载视觉与交互，后续可替换为真实目标评分。
- 进食记录 Tab 已接入记录新增、编辑、删除；支持关联计划餐次、结构化条目、旧观察维度、关联食物记忆，以及搜索 / 直接点击筛选。
- 食谱、食品、营养成分表和进食记录的搜索索引已补充翻译后的枚举文本，避免英文界面只能按中文枚举值搜索。
- 食谱标签、食品分类和营养表分类筛选已补充失效兜底；当标签或分类被编辑 / 删除后，视图会自动按“全部”筛选展示，避免被旧 state 锁到空结果。
- 已完成静态兼容检查：旧版 `meals / foodMemories / weeklyReview / profile` 字段增加空值兜底，避免新旧本地数据版本不一致时搜索过滤报错。
- 已补充计划、记录、食谱编辑弹窗的缺失引用占位；当旧数据引用的食品、食谱或食物记忆不存在时，选择器会明确显示“已关联对象不存在”。
- 已补充营养成分表空态、单位国际化、食品详情待补字段与饮食标签空态显示，以及食品营养档案清空后的引用移除逻辑。
- 已补充总览的饮食意图卡片，展示 `currentIntent`、硬约束和软立场，并补齐对应中英文国际化枚举。
- 已接入总览饮食档案编辑弹窗，支持维护 `currentIntent`、硬约束与软立场，并复用 JSON 持久化保存链路。
- 饮食模块的新增、编辑、删除与从计划生成记录等写操作已和全局控制模式联动；浏览模式保留搜索、筛选、选择与营养详情抽屉等只读交互。
- 已移除进食条目格式化 helper 中的中文默认份量标签，调用点必须显式传入国际化后的单位文案。
- JSON 持久化已改为先写入同目录临时文件，再替换目标 `nutrition.json`，降低保存中断导致目标文件半写入的风险。
- mock API 已补齐会话级 `saveNutrition` 闭环，保存后 `getNutrition` 与 `getWorkspaceSnapshot` 都会读取最新饮食数据；live API 不再在 Rust 读取失败时静默回退 mock，避免错误数据覆盖本地持久化内容。

当前后端仍未拆 SQLite 表和细粒度 CRUD；这是一个最小 JSON 持久化过渡层。

### 8.1 表结构建议

核心表：

- `nutrition_food_categories`
- `nutrition_foods`
- `nutrition_food_category_links`
- `nutrition_nutrient_profiles`
- `nutrition_recipes`
- `nutrition_recipe_ingredients`
- `nutrition_recipe_steps`
- `nutrition_daily_plans`
- `nutrition_daily_plan_slots`
- `nutrition_daily_plan_entries`
- `nutrition_meal_logs`
- `nutrition_meal_log_entries`
- `nutrition_food_memories`

### 8.2 命令建议

V1 CRUD：

- `get_nutrition_module`
- `create_food`
- `update_food`
- `delete_food`
- `create_recipe`
- `update_recipe`
- `delete_recipe`
- `upsert_daily_plan`
- `create_meal_log`
- `update_meal_log`
- `delete_meal_log`

派生计算：

- `calculate_recipe_nutrition`
- `calculate_daily_plan_nutrition`

### 8.3 TypeScript 绑定

注意 Specta 导出：

- 不导出 `usize / i64 / u64` 等 BigInt 风险类型。
- 数量、计数统一用 `i32` 或 `f64`。
- 营养数值用 `f64`。

## 9. 实施顺序

1. 已完成：替换设计文档。
2. 已完成：新增本开发文档。
3. 已完成：重写前端类型和 mock 数据。
4. 已完成：拆分 `nutrition-page.tsx` 为多 Tab。
5. 已完成：实现总览。
6. 已完成基础展示与编辑：实现每日计划，并支持从计划餐次生成实际进食记录。
7. 已完成基础展示与编辑：实现食谱库。
8. 已完成基础展示与编辑：实现食品分类。
9. 已完成基础展示与筛选：实现营养成分表。
10. 已完成基础展示、筛选与编辑：实现进食记录。
11. 已完成：静态检查观察字段和旧引用是否还有误用，并补充兼容兜底。
12. 后续：把 JSON 持久化过渡层升级为 SQLite 表与细粒度 CRUD。

## 10. 验收标准

- 本地存在新版设计文档和开发文档。
- 旧“饮食模块不做食谱库”的定位已被替换。
- 页面结构能清晰承接：食谱、营养成分表、食品分类、每日计划。
- 新数据模型能表达食品库作为基础源、食谱引用食品、每日计划引用食谱 / 食品。
- 旧进食观察能力没有丢失，但位置变为记录与回顾。
- 样式要求和购物模块一致：主题联动、固定壳、内部滚动、响应式回退。

## 11. 暂不处理

- 不接外部食品数据库。
- 不做图片识别。
- 不做医疗建议。
- 不运行测试、lint 或启动本地。
