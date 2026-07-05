# 版本管理自动化方案

> 基于 Conventional Commits + Release Please + bench 风格三段式发版流水线。

---

## 整体流程

```
开发分支 PR（Conventional Commits：feat / fix / feat!）
  → [ci.yml] lint / typecheck / test（Ubuntu，~1min）
  → [verify-tauri.yml] macOS / Windows Tauri debug 编译冒烟（PR 门禁）
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
| `verify-tauri.yml` | macOS / Windows `tauri build --debug --no-bundle` + Rust 测试 |

### 3. Release Please → Release PR

- push 到 `main` 时运行
- 自动创建/更新 `chore(main): release x.y.z` PR
- 同步 `package.json`、`Cargo.toml`、`Cargo.lock`、`tauri.conf.json`、`src/shared/version.ts`

### 4. Tag → 构建发布（`release.yml`）

三段式，与 bench 一致：

1. **verify** — 发版前 macOS / Windows 冒烟（与 PR 门禁相同）
2. **release-build** — macOS aarch64 / macOS x86_64 / Windows 正式包，收集 updater 产物
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
| `src-tauri/common-controls.manifest` | Windows Common Controls v6 manifest |
| `src-tauri/build.rs` | 链入测试二进制 Windows manifest |
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
- **支持平台？** 仅 macOS（aarch64 + x86_64）与 Windows；不提供 Linux 安装包
- **私有仓库？** CI/CD 可用；Tauri updater 需公开可访问的 `latest.json` 与安装包 URL

---

## Windows CI 注意事项

Tauri 默认只给主程序嵌入 Windows manifest，`cargo test --lib` 生成的测试 exe 缺少 Common Controls v6，会在 CI 上以 `STATUS_ENTRYPOINT_NOT_FOUND` (0xc0000139) 崩溃。

**不要**用 `embed-resource` 直接编译 `.xml`（API 不匹配且无效）。

**正确做法**（见 `src-tauri/build.rs`，参考 [cc-switch](https://github.com/farion1231/cc-switch)）：

1. 维护 `common-controls.manifest`
2. `cargo:rustc-link-arg=/MANIFEST:EMBED` + `/MANIFESTINPUT:...`（**不要**用 `-tests` 后缀：`lib.rs` 里的 `#[test]` 不算 `[[test]]` target）
3. `cargo:rustc-link-arg-bins=/MANIFEST:NO`（主程序 manifest 由 `tauri_build` 负责）

修改 manifest 或 `build.rs` 后，务必在 `windows-latest` runner 上验证 `cargo test --manifest-path src-tauri/Cargo.toml`。

**Publish job（CI runner）**：`publish` 在 `ubuntu-latest` 上合并 artifact 并验签；`cargo run --bin verify_updater_manifest` 会触发 `tauri_build`，因此需运行 `scripts/ci/install-linux-deps.sh`（仅 CI 依赖，非 Linux 客户端发布）。
