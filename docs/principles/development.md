# 原则模块开发文档
> 由现有设计文档提取开发相关部分；后续开发计划统一在此维护。

## 开发维护约定

- 当前模块尚未拆出独立的完整开发计划。
- 进入实现时，先以 `design.md` 的数据维度、页面职责和边界约定为准。
- 后续新增接口、数据模型、组件拆分和迁移步骤统一补充到本文件。

---

## 从设计文档提取的开发相关内容

### 10. 实施步骤（给开发者）

1. 把 6 个领域作为 `PrincipleDomain` 枚举写出来
2. 把 3 种类型作为 `PrincipleType` 枚举写出来
3. 把 3 级强度作为 `PrincipleStrength` 枚举写出来
4. 把 4 种来源作为 `PrincipleSource` 枚举写出来
5. 把 4 种状态作为 `PrincipleStatus` 枚举写出来
6. 把 4 级代价作为 `PrincipleCost` 枚举写出来
7. 在 `Principle` 类型上：
   - `domain: PrincipleDomain`（必填）
   - `type: PrincipleType`（必填）
   - `strength: PrincipleStrength`（必填）
   - `source: PrincipleSource`（必填）
   - `status: PrincipleStatus`（必填）
   - `cost: PrincipleCost`（必填）
8. 原则之间支持关联：支撑（一条原则支撑另一条）/ 冲突（两条原则指向不同方向）
9. 每条原则保留修订记录（内容、strength、status 的变化）
10. UI 层注意：**5 维**进入过滤器 / 分组 / 总览统计；**cost** 进详情页和决策校准页

### 11. 不在本文档讨论的范围

- 原则的录入、编辑、删除交互
- 数据库表结构
- 决策校准的具体交互流程
- 与反思模块的联动机制
