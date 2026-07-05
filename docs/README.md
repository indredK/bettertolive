# 文档索引

> bettertolive 项目文档总入口。按类型分目录，按模块归内容。

---

## 一、开发规范（standards/）

全局硬约定，所有模块统一遵守。

| 文档 | 用途 |
|------|------|
| [conventions.md](./standards/conventions.md) | **立规** — 前端 + 后端 + 动画的硬约定与建议，违反即 bug |
| [review-scope.md](./standards/review-scope.md) | **收敛** — 三档分级判 bug，定义"什么算问题、何时停" |
| [module-organization.md](./standards/module-organization.md) | **模板** — 新增业务模块的前后端文件清单与命名约定 |
| [testing-standards.md](./standards/testing-standards.md) | **测试** — 测试框架、编写约定、优先级与审查要点 |

---

## 二、模块文档（modules/）

每个业务模块独立目录，收纳该模块的设计、bug、路线图等。

→ [模块总索引](./modules/README.md)

---

## 三、横切设计稿（根目录）

涉及多个模块或全局架构的设计文档，不强行归到某个模块下。

| 文档 | 主题 |
|------|------|
| [data-reset-design.md](./data-reset-design.md) | 数据重置与种子数据回流机制 |
| [import-export-design.md](./import-export-design.md) | 数据导入导出与合并策略 |
| [refactor-goals.md](./refactor-goals.md) | 重构目标与技术债清单 |
| [version-management.md](./version-management.md) | 版本自动化管理流程 |

---

## 四、审计与 Bug（bugs/）

跨模块全量审计报告、专项 bug 汇总等。

| 文档 | 说明 |
|------|------|
| [audit-2026-06-14.md](./bugs/audit-2026-06-14.md) | 2026-06-14 全模块审计报告 |

---

## 五、Spec 驱动开发（specs/）

新功能从需求到上线的完整流水线，每个 feature 一个目录。

→ [specs 目录说明](../specs/README.md)

---

## 文档组织原则

1. **规范类统一放 `standards/`** — 跨模块通用的硬约定、审查标准、模板
2. **模块类按模块收 `modules/<id>/`** — 某模块专属的设计、bug、路线图
3. **横切类留根目录** — 涉及 ≥2 个模块或全局架构的设计稿
4. **spec 独立放 `specs/`** — 功能开发流水线的过程产物，随功能上线归档
5. **不在旧路径留空壳 stub** — 移动文档后须更新所有引用链接
