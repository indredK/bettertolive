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
| `verify-tauri.yml` | macOS / Windows `tauri build --debug --no-bundle -- --bin bettertolive` + Rust 测试 |

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
| `src-tauri/Cargo.toml` | 主 binary 声明、`default-run`、`release-tools` feature |
| `src-tauri/tauri.conf.json` | `mainBinaryName` 指定打包主程序 |
| `src-tauri/src/bin/verify_updater_manifest.rs` | 发布前验签（`release-tools` feature，不参与 Tauri 打包） |

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

**Publish job（CI runner）**：`publish` 在 `ubuntu-latest` 上合并 artifact 并验签；`cargo run --features release-tools --bin verify_updater_manifest` 会触发 `tauri_build`，因此需运行 `scripts/ci/install-linux-deps.sh`（仅 CI 依赖，非 Linux 客户端发布）。

---

## Tauri 多 Binary 打包注意事项

> 背景：v0.4.0 曾因误打包辅助 binary，导致 DMG / updater 产物全部 < 1 MB。

### 现象

- GitHub Release 上的 `.dmg`、`.exe`、`.app.tar.gz` 体积异常小（通常 < 1 MB，正常应为 30–80 MB）
- CI 日志出现 `Built application at: .../verify_updater_manifest`
- 解压 `.app.tar.gz` 后，`Contents/MacOS/` 下只有 `verify_updater_manifest`，没有 `bettertolive`

### 根因

Cargo 会同时发现 `src/main.rs` 与 `src/bin/*.rs`。当 crate 内存在多个 binary 时，Tauri CLI 可能把**辅助工具**当成主程序打包，生成缺少前端资源与主可执行文件的空壳 `.app`。

本项目的辅助 binary 是 `verify_updater_manifest`（发布前校验 `latest.json` 签名），仅用于 CI `publish` job，不应进入客户端安装包。

### 防护措施（已落地）

1. **`src-tauri/Cargo.toml`**
   - `default-run = "bettertolive"`
   - 显式声明 `[[bin]]`，主程序为 `bettertolive`
   - 辅助工具挂 `required-features = ["release-tools"]`，默认 `tauri build` 不会编译它

2. **`src-tauri/tauri.conf.json`**
   - `"mainBinaryName": "bettertolive"`

3. **CI 命令**
   - 所有 `tauri build` 追加 `-- --bin bettertolive`（见 `release.yml`、`verify-tauri.yml`）
   - 验签：`cargo run --features release-tools --bin verify_updater_manifest`

### 发版后快速验收

```bash
# 1. 安装包体积应在 30 MB 量级
ls -lh bettertolive_*.dmg

# 2. updater 包内应是主程序，而非验签工具
tar -tzf darwin-aarch64-bettertolive.app.tar.gz | grep MacOS
# 期望：bettertolive.app/Contents/MacOS/bettertolive

# 3. CI 日志应指向主 binary
# 期望：Built application at: .../release/bettertolive
```

### 新增辅助 Binary 的约定

若将来还需在 `src-tauri` 内添加 CLI 工具：

- **不要**把仅用于 CI / 开发的工具放在 `src/bin/` 且不设 feature gate
- 优先：挂 `required-features`，或拆到独立 crate / `scripts/`
- 若必须保留多个 binary，同步更新 `mainBinaryName`、`default-run`，并在所有 `tauri build` 命令中显式指定 `-- --bin bettertolive`
