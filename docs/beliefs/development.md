# 观念模块开发文档
> 由现有设计文档提取开发相关部分；后续开发计划统一在此维护。

## 开发维护约定

- 当前模块尚未拆出独立的完整开发计划。
- 进入实现时，先以 `design.md` 的数据维度、页面职责和边界约定为准。
- 后续新增接口、数据模型、组件拆分和迁移步骤统一补充到本文件。

---

## 从设计文档提取的开发相关内容

### 11. 实施步骤（给开发者）

1. 把 7 个领域作为 `BeliefDomain` 枚举写出来
2. 把 3 个层次作为 `BeliefLayer` 枚举写出来
3. 把 4 种稳定性状态作为 `StabilityStatus` 枚举写出来
4. 把 4 种来源作为 `BeliefSource` 枚举写出来
5. 把 4 种影响方向作为 `BeliefImpact` 枚举写出来
6. 在 `Belief` 类型上：
   - `domain: BeliefDomain`（必填）
   - `layer: BeliefLayer`（必填）
   - `stability: StabilityStatus`（必填）
   - `source: BeliefSource`（必填）
   - `impact: BeliefImpact`（必填，每一条观念都有影响方向）
7. 观念之间支持关联：相似 / 冲突 / 派生（一条观念从另一条演变而来）
8. 每条观念保留修订历史（stability 变化、内容变化的时间点）
9. UI 层注意：**4 维**进入过滤器 / 分组；**impact** 进详情页和总览的分布图，不做集合过滤
10. 心理学视角字段（全部可选，不进入分类）：
    - `cbtLayer?: 'automatic' | 'intermediate' | 'core'`（CBT 层次,作为 layer 的辅助标记）
    - `cognitiveDistortion?: CognitiveDistortion[]`（认知扭曲类型,可多选,见 §10.2）
    - `defenseMechanism?: DefenseMechanism`（防御机制,见 §10.3）
    - 这些字段只在"心理学解读"折叠区出现,不进入主筛选器,也不参与统计图谱

### 12. 不在本文档讨论的范围

- 观念的录入、编辑、删除交互
- 数据库表结构
- 跨模块联动的具体 API（观念 ↔ 原则 ↔ 关系 ↔ 成长记忆）
- AI 自动提取观念的功能设计

这些等分类稳定之后再单独讨论。
