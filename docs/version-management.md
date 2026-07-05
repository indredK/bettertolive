# 版本管理自动化方案

> 基于 Conventional Commits + Release Please + bench 风格三段式发版流水线。

---

## 整体流程

```
开发分支 PR（Conventional Commits：feat / fix / feat!）
  → [ci.yml] lint / typecheck / test（Ubuntu，~1min）
  → [verify-tauri.yml] 三端 Tauri debug 编译冒烟（PR 门禁）
  → 合并到 main
    → [release-please.yml] 自动创建/更新 Release PR
      → 合并 Release PR
        → 自动打 git tag
          → [release.yml] verify → build → publish
            → 上传安装包 + latest.json（Tauri 自动更新）
```

---

## 各环节说明

### 1. 开发阶段

| 提交类型 | 版本变化 |
|---|---|
| `feat:` | 次版本 +1 |
| `fix:` | 修订号 +1 |
| `feat!:` / `BREAKING CHANGE` | 主版本 +1 |
| `chore: / docs: / refactor:` | 不触发版本变更 |

### 2. PR 门禁

| Workflow | 作用 |
|---|---|
| `ci.yml` | ESLint、TypeScript、Vitest |
| `verify-tauri.yml` | macOS / Windows / Ubuntu 三端 `tauri build --debug --no-bundle` + Rust 测试 |

### 3. Release Please → Release PR

- push 到 `main` 时运行
- 自动创建/更新 `chore(main): release x.y.z` PR
- 同步 `package.json`、`Cargo.toml`、`Cargo.lock`、`tauri.conf.json`、`src/shared/version.ts`

### 4. Tag → 构建发布（`release.yml`）

三段式，与 bench 一致：

1. **verify** — 发版前三端冒烟（与 PR 门禁相同）
2. **release-build** — 分平台打正式包（mac aarch64 / mac x86_64 / Windows），收集 updater 产物
3. **publish** — 合并 artifact、生成 `latest.json`、Rust 验签、上传 GitHub Release（非 draft）

---

## 配置文件

| 文件 | 作用 |
|---|---|
| `.github/workflows/release-please.yml` | Release Please |
| `.github/workflows/ci.yml` | 快速前端检查 |
| `.github/workflows/verify-tauri.yml` | 跨平台 Tauri 冒烟 |
| `.github/workflows/release.yml` | tag 触发打包发布 |
| `release-please-config.json` | 版本 bump 与 extra-files |
| `scripts/release/generate-updater-json.mjs` | 生成 Tauri updater 清单 |
| `scripts/release/write-updater-manifest.mjs` | 收集各平台 updater 产物 |
| `src-tauri/src/bin/verify_updater_manifest.rs` | 发布前验签 |

---

## 所需 GitHub Secrets

| Secret | 用途 |
|---|---|
| `RELEASE_PLEASE_TOKEN` | Release Please 开 PR + 推 tag + 上传 Release |
| `TAURI_SIGNING_PRIVATE_KEY` | Tauri updater 签名私钥 |
| `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` | 签名私钥密码（如有） |

---

## 关键设计决策

- **为什么 Release Please + bench 发版？** 版本管理自动化 + updater 闭环（`latest.json` + 验签）
- **为什么 Linux 暂未打包？** 与 bench 一致，先保证 macOS / Windows 稳定，后续可按需启用 matrix 行
- **私有仓库？** CI/CD 可用；Tauri updater 需公开可访问的 `latest.json` 与安装包 URL
