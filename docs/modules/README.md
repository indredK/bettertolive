# 模块文档索引

> 按业务模块收纳文档——每个模块的设计、bug、路线图都放在自己目录下，不散落各处。
>
> 目录约定参照 bench 项目 `docs/modules/<id>/` 模式，与 `src/features/bettertolive/<module>/` 一一对应。

---

## 模块清单

| 模块 | 目录 | 说明 |
|------|------|------|
| 总览 | [overview](./overview/) | 工作台总览与快速入口 |
| 反思 | [reflection](./reflection/) | 反思写作与回顾 |
| 记事 | [events](./events/) | 生活事件记录 |
| 记账 | [finance](./finance/) | 收支记录与财务分析 |
| 购物 | [shopping](./shopping/) | 生活物品分类与管理 |
| 饮食 | [nutrition](./nutrition/) | 营养记录与饮食规划 |
| 情绪情感 | [emotion](./emotion/) | 情绪记录与情感梳理 |
| 观念 | [beliefs](./beliefs/) | 信念观念与认知 |
| 原则 | [principles](./principles/) | 行事原则与决策 |
| 关系深化 | [relationships](./relationships/) | 人际关系梳理与维护 |
| 成长记忆 | [memory](./memory/) | 成长记忆与里程碑 |
| 生命整理 | [legacy](./legacy/) | 遗产规划与生命整理 |
| 社会经济 | [socioeconomics](./socioeconomics/) | 社会经济认知 |
| 未来 | [future](./future/) | 未来规划与目标 |
| 成长 | [growth](./growth/) | 个人成长与发展 |
| 旅程 | [journey](./journey/) | 人生旅程叙事 |
| 世界历史 | [worldhistory](./worldhistory/) | 文明与历史认知 |

---

## 模块目录约定

每个模块目录按需包含以下文件（从最小集开始，需要时追加）：

| 文件 | 必要性 | 说明 |
|------|--------|------|
| `README.md` | 必须 | 模块文档入口，链到本目录其余文件 |
| `design.md` | 按需 | 模块设计稿、技术方案、PRD 等 |
| `bugs.md` | 按需 | 已知问题；无 open bug 时可省略 |
| `roadmap.md` | 按需 | 迭代规划与 backlog |

**最小模块**：只有 `README.md` 一句话说明 + 链接回总索引。
**完整模块**：`README.md` + `design.md` + `bugs.md` + `roadmap.md`。

---

## 维护约定

1. 新增 feature 模块时，同步创建 `docs/modules/<id>/README.md`
2. 模块专属设计稿放进对应模块目录，不放全局 `design/`
3. 跨模块设计稿放 `docs/` 根目录（见 [总索引](../README.md)）
4. 功能合入后，`roadmap.md` 与代码保持一致——已实现的移除，未实现的保留
