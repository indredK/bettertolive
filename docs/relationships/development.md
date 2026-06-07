# 关系深化模块开发文档
> 由现有设计文档提取开发相关部分；后续开发计划统一在此维护。

## 开发维护约定

- 当前模块尚未拆出独立的完整开发计划。
- 进入实现时，先以 `design.md` 的数据维度、页面职责和边界约定为准。
- 后续新增接口、数据模型、组件拆分和迁移步骤统一补充到本文件。

---

## 从设计文档提取的开发相关内容

### 11. 实施步骤（给开发者）

1. 把 6 种关系类型作为 `RelationshipType` 枚举写出来
2. 把 5 级深度作为 `RelationshipDepth` 枚举写出来
3. 把 6 种阶段作为 `RelationshipStage` 枚举写出来
4. 把 4 种影响方向作为 `RelationshipImpact` 枚举写出来
5. 把 6 级互动频率作为 `InteractionFrequency` 枚举写出来
6. 把 4 级未完成重量作为 `UnfinishedWeight` 枚举写出来
7. 在 `Relationship` 类型上：
   - `type: RelationshipType`（必填）
   - `depth: RelationshipDepth`（必填）
   - `stage: RelationshipStage`（必填）
   - `impact: RelationshipImpact`（必填）
   - `interaction: InteractionFrequency`（必填）
   - `unfinishedWeight?: UnfinishedWeight`（可选）
8. 关系条目内挂载：关键互动事件（子列表）、情绪线索（标签）、想说的话（子列表）
9. depth 和 stage 保留变化历史（时间线数据来源）
10. "想说的话"支持三种目标类型：关系条目内的人 / 独立对象 / 未来的自己
11. UI 层注意：**5 维**进入过滤器 / 分组 / 总览；**unfinished_weight** 进关系详情和"想说的话"排序

### 12. 不在本文档讨论的范围

- 关系条目的录入、编辑交互
- 数据库表结构
- 关系与情绪/记忆/观念模块之间的具体联动逻辑
- 隐私控制的技术实现（谁可以看到关系数据）
