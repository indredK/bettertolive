# 版本管理自动化方案

> 基于 Conventional Commits + Release Please 的全自动版本管理流水线（与 bench 一致）。

---

## 整体流程

```
开发分支 PR（Conventional Commits：feat / fix / feat!）
  → 合并到 main
    → [release-please.yml] 自动创建/更新 Release PR（版本号 + CHANGELOG）
      → 合并 Release PR
        → 自动打 git tag + 创建 GitHub Release
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

### 2. feat PR 合并 → Release PR（`release-please.yml`）

- 触发条件：push 到 `main`
- Release Please 解析自上次发版以来的 commits
- 自动创建/更新 `chore(main): release x.y.z` PR
- 同步更新 `package.json`、`Cargo.toml`、`Cargo.lock`、`tauri.conf.json`、`src/shared/version.ts`

### 3. Release PR 合并 → 发版

- Release Please 自动创建 `v*` git tag 和 GitHub Release
- tag push 触发 `release.yml`

### 4. Tag → 构建发布（`release.yml`）

- 触发条件：`v*` tag 被 push
- 构建 macOS（aarch64 + x86_64 + universal）、Ubuntu、Windows 安装包
- 创建 GitHub Release，上传构建产物

---

## 配置文件

| 文件 | 作用 |
|---|---|
| `.github/workflows/release-please.yml` | push main 时运行 Release Please |
| `release-please-config.json` | 版本 bump 规则与 extra-files 同步配置 |
| `.release-please-manifest.json` | 当前已发布版本号 |
| `.github/workflows/release.yml` | tag 触发 Tauri 打包 |

---

## 所需 GitHub Secrets

| Secret | 用途 |
|---|---|
| `RELEASE_PLEASE_TOKEN` | PAT（`repo` 权限，含 pull request 写入），用于 Release Please 创建 PR 和推 tag |
| `TAURI_SIGNING_PRIVATE_KEY` | Tauri 更新包签名私钥 |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | 签名私钥密码（如有） |

> 未配置 `RELEASE_PLEASE_TOKEN` 时回退到 `GITHUB_TOKEN`，但 PAT 推送的 tag 才能可靠触发后续 workflow。

---

## 关键设计决策

- **为什么用 Release Please？** 与 bench 统一，feat PR 合并后一条 Release PR 即可发版，链路更短
- **版本存多处如何保证一致？** `release-please-config.json` 的 `extra-files` 在 Release PR 中一并更新
- **Release PR 要不要人工合并？** 建议快速 review 后合并；也可配置 auto-merge
