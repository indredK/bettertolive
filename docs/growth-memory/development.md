# 成长记忆模块开发文档
> 由现有设计文档提取开发相关部分；后续开发计划统一在此维护。

## 开发维护约定

- 当前模块尚未拆出独立的完整开发计划。
- 进入实现时，先以 `design.md` 的数据维度、页面职责和边界约定为准。
- 后续新增接口、数据模型、组件拆分和迁移步骤统一补充到本文件。

---

## 从设计文档提取的开发相关内容

### 14. 实施步骤（给开发者）

1. 把 6 种记忆类型作为 `MemoryType` 枚举写出来
2. 把 7 种整理状态作为 `ProcessingStatus` 枚举写出来
3. 把 5 级隐私作为 `PrivacyLevel` 枚举写出来
4. 把 5 级塑造力作为 `FormativePower` 枚举写出来
5. era 使用用户自定义标签 + 默认提示（不硬编码枚举）
6. 在 `Memory` 类型上：
   - `type: MemoryType`（必填）
   - `era: string[]`（必填，支持多个时期标签）
   - `emotionalWeight: EmotionalWeight`（必填）
   - `processing: ProcessingStatus`（必填）
   - `privacy: PrivacyLevel`（必填，默认"仅自己"）
   - `formativePower?: FormativePower`（可选，因为刚录入时可能不确定）
7. `GrowthNode` 类型：关联多条记忆（变化前/变化后）、领域、稳固程度
8. 记忆支持从反思/关系/情绪模块生成（跨模块沉淀）
9. privacy=需二次确认 的记忆在打开时触发确认步骤
10. UI 层：**5 维**进入过滤器/分组；**formative_power** 进入时间轴标注和详情页

### 16. 不在本文档讨论的范围

- 记忆的录入 UI 交互
- 数据库表结构
- 成长节点自动检测（AI 分析多条记忆识别成长模式）
- 照片/文件存储方案
- "离世后可看"的交付机制
- 与其他模块的 API 级联动
