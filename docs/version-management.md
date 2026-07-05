# 版本管理自动化方案

> 基于 Conventional Commits + Changesets 的全自动版本管理流水线。

---

## 整体流程

```
开发分支 PR（写 Conventional Commits）
  → 合并到 main
    → [changeset.yml] 自动解析 commits，生成 changeset 文件
      → [version.yml / changesets/action] 创建「Version Packages」PR（含版本号 + CHANGELOG）
        → 人工审查并合并该 PR
          → [version.yml] 自动打 git tag
            → [release.yml] 触发 Tauri 构建，发布安装包
```

---

## 各环节说明

### 1. 开发阶段

开发者按 Conventional Commits 规范提交：

| 提交类型 | 对应版本变化 |
|---|---|
| `feat:` | 次版本 +1 |
| `fix:` | 修订号 +1 |
| `feat!:` / `BREAKING CHANGE` | 主版本 +1 |
| `chore: / docs: / refactor:` | 不触发版本变更 |

无需手动执行 `bun changeset add`，全程自动化。

### 2. PR 合并 → 自动生成 changeset（`changeset.yml`）

- 触发条件：PR 合并到 `main`
- 逻辑：读取该 PR 的所有 commit，解析 Conventional Commits 类型
- 取最高变更级别（breaking > feat > fix），生成 `.changeset/*.md` 文件
- 自动 commit 并 push 到 `main`

### 3. Changeset → 版本 PR（`version.yml` / `changesets/action`）

- 触发条件：push 到 `main` 时存在 `.changeset/*.md` 文件
- 调用 `changeset version` 更新版本号 + 生成 CHANGELOG
- 同步脚本 `sync-version.mjs` 将新版本号写入 `Cargo.toml` 和 `tauri.conf.json`
- 自动创建/更新「Version Packages」PR（包含版本变更 + CHANGELOG）
- **需要人工审查并合并该 PR**

### 4. 版本 PR 合并 → 发版（`version.yml`）

- 触发条件：「Version Packages」PR 合并到 `main`
- 检测到版本号变化（当前版本无对应 git tag）
- 自动创建 `v*` git tag
- push tag 触发 `release.yml`

### 5. Tag → 构建发布（`release.yml`）

- 触发条件：`v*` tag 被 push
- 构建 macOS（aarch64 + x86_64）、Ubuntu、Windows 安装包
- 创建 GitHub Release，上传构建产物

---

## 新增文件

| 文件 | 作用 |
|---|---|
| `scripts/generate-changeset.mjs` | 从 PR 的 Conventional Commits 解析变更级别，生成 changeset 文件 |
| `scripts/sync-version.mjs` | 将 `package.json` 版本同步到 `Cargo.toml` 和 `tauri.conf.json` |
| `.github/workflows/changeset.yml` | PR 合并后 auto-changeset |
| `.github/workflows/version.yml` | 版本 PR 创建 + 打 tag 发版 |

## 修改文件

| 文件 | 变更 |
|---|---|
| `package.json` | `version:packages` 改为 `changeset version && bun scripts/sync-version.mjs` |
| `.changeset/config.json` | 启用 changelog 生成 |

---

## 所需 GitHub Secrets

| Secret | 用途 |
|---|---|
| `RELEASE_PAT` | Personal Access Token（`repo` 权限），用于 tag push 触发 release workflow |

> `GITHUB_TOKEN` 推送 tag 不会触发其他 workflow，必须用 PAT。

---

## 关键设计决策

- **为什么不手动写 changeset？** 开发者只需写 Conventional Commits，减少心智负担，统一规范
- **为什么保留「Version Packages」PR 的人工审查环节？** 确认 changelog 内容和版本号无误后再发版
- **版本存三处如何保证一致？** `sync-version.mjs` 在 `changeset version` 后自动同步，版本 PR 中已包含所有文件修改，合并后三处始终一致
