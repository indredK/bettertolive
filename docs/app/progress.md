# 应用整体进度文档
> 汇总全局工程任务清单；后续全局进度统一维护在此。

---

## 本轮全模块审查修复记录

更新日期：2026-06-08

### 两轮任务计数

- 已确认并修复：27 项
- 第一轮：已完成
- 第二轮严格复查：已完成

### 已修复

- [x] 公共 `Select` 封装自动收集 `SelectItem` 的 `value -> label` 映射，修复下拉列表显示中文但选中态回退到英文/原始枚举值的问题。
- [x] 公共 `PageIntro` 恢复页面 eyebrow、标题和说明渲染，同时保留搜索筛选徽标，修复多模块页面标题区在无搜索词时消失的问题。
- [x] 反思模块补齐最小读写闭环：新增 `save_reflection` Tauri command、前端 `saveReflection` API / mutation、控制模式下新增 / 编辑 / 删除反思记录，并补齐反思页中英文词典。
- [x] 总览页 UI 文案改为 `overview.*` 中英文词典，并清理中文词典里重复的顶层 `overview` 键，避免翻译被静默覆盖。
- [x] 公共通知层、通知中心面板和响应式导航补齐 `shell.notifications.*` / `shell.notificationCenter.*` / `shell.nav.*` 中英文文案，修复英文模式下通知徽标、详情弹窗、演示通知、默认跳转按钮和导航 aria label 仍显示中文的问题。
- [x] 公共主题 / 音乐工具面板改为按 theme / preset id 读取 `shell.themes.*` / `shell.music.*` 中英文词典，修复英文模式下主题名、音乐预设和工具面板说明仍显示中文的问题。
- [x] 后端新增模块 Tauri command 已注册到真实 `invoke_handler`；JSON 过渡层 command 不再导出 `specta` 绑定，避免 `serde_json::Value` 与超参数聚合 command 阻断 Tauri dev 编译。
- [x] 关系深化页面新增 `editableRelationshipsModule` 完整快照作为保存基准，修复全局搜索过滤后新增 / 编辑 / 删除会把未显示关系数据覆盖丢失的问题。
- [x] 饮食页面新增 `editableNutrition` 完整快照作为保存基准，食品 / 分类 / 食谱 / 每日计划 / 进食记录 / 饮食档案弹窗和生成进食记录操作均改为基于完整数据保存，修复搜索过滤后写入会覆盖丢失未显示饮食数据的问题。
- [x] 观念模块 CRUD 改为统一走 `BetterToLiveApi` live/mock 双实现，mock 模式补齐新增 / 编辑 / 删除及关联关系清理，修复非 Tauri 环境下控制模式基础写入不可用的问题。
- [x] 记事模块新增事件按钮改为仅在控制模式显示，修复浏览模式下仍可打开写入弹窗、破坏全局“浏览 / 控制”模式语义的问题。
- [x] 记账页移除 `PageIntro` 下方重复标题区，仅在控制模式保留“记一笔”操作栏，修复固定 / 窄屏布局中标题重复占用空间的问题。
- [x] 成长记忆页 Hero 收敛为纯统计栏，移除与 `PageIntro` 重复的标题和说明，修复页面首屏信息重复和响应式空间浪费的问题。
- [x] 成长记忆模块补齐最小写入闭环：新增 `save_growth` / `save_memory` Tauri command、live/mock API 与保存 mutation，旅程页管理模式支持新增 / 编辑 / 删除记忆、成长节点、感官锚点、回看问题和影响线索；同时补齐 `journey.enum.*` 中英文枚举显示，修复英文模式下成长记忆卡片和筛选项仍显示中文枚举的问题。
- [x] 英文词典补齐 `shell.rhythm.*` / `shell.rhythmPopup.*` / `shell.sidebarCarousel.*`，修复英文模式下节奏弹窗、侧栏说明轮播标题/正文和轮播按钮 aria label 缺失翻译的问题。
- [x] 生命整理页堆叠布局移除固定高度与隐藏溢出，保留固定工作台内部滚动，修复移动端 / 窄屏下 Tab 内容被裁切、无法随页面自然滚动的问题。
- [x] 公共 `PopupNotificationHeader` 关闭按钮改为接收本地化 `closeLabel`，节奏弹窗传入 `shell.notifications.close`，修复英文模式下弹窗关闭按钮 aria label 仍是中文的问题。
- [x] 公共 `MultiSelect` 默认占位、搜索占位和空状态移除硬编码中文，保留业务调用显式传入中英文词典文案，避免新增调用在英文模式下露出中文默认值。
- [x] 情绪编辑弹窗实体标题的 fallback 从中文拼接改为英文中性兜底，主展示继续使用 `emotion.editor.*.createTitle/editTitle` 中英文词典，降低缺 key 时英文界面露出中文的风险。
- [x] 主题预设与音乐预设配置的 label / description fallback 从中文改为英文中性值，工具面板主展示继续走 `shell.themes.*` 与 `shell.music.*` 中英文词典，避免缺 key 时英文界面回退中文。
- [x] 社会经济模块复习提问编辑从“筛选后显示 index”映射回完整源数组 index，修复搜索过滤后编辑 / 删除复习提问可能改错隐藏项的问题。
- [x] 公共 `MultiSelect` 选中态改为保留完整 option 渲染 chip，不再用 label 反查 value，修复重复中文标签或翻译标签相同导致移除错项 / key 冲突的风险。
- [x] 关系深化页双栏列表与详情面板在移动 / 窄屏下取消固定高度和隐藏溢出，桌面端继续保留内部滚动，修复窄屏下关系详情、想说的话和跨关系模式可能被裁切的问题。
- [x] `bun run start` 启动复查发现 1420 端口残留占用与 Tauri Specta 编译失败；端口释放后，JSON 过渡层 command 保留运行时注册但退出 Specta 导出，避免 `serde_json::Value` / 超参数聚合 command 阻断编译。
- [x] 营养与购物图表补充 Recharts `initialDimension`，修复 Tauri dev 首帧挂载时 `ResponsiveContainer` 默认 `-1/-1` 触发连续宽高警告的问题。
- [x] 成长记忆页 `AnchorRow` 补齐本地 `useTranslation()`，修复 pre-commit lint 中 `translateJourneyEnum(t, ...)` 因未定义 `t` 被推断为 error type 的阻断问题。
- [x] 成长记忆编辑弹窗为泛型 `JourneySelectField` 显式传入 `Select<JourneySelectValue<T>>`，修复 pre-commit strict 中 `value` 被窄化为仅允许 `"__none__"` 的 TypeScript 阻断问题。

### 第二轮严格复查结论

- [x] 后端链路：除只读聚合的总览模块外，反思、记事、记账、饮食、情绪、观念、原则、关系、成长记忆、生命整理、社会经济和未来模块均具备读取与保存 / CRUD 基础链路；相关 command 已覆盖 `specta_builder()` 与 `invoke_handler`。
- [x] 前端链路：live API、mock API、React Query mutation 与 workspace snapshot 回填已复查；mock 保存后会回填 snapshot，避免刷新后丢失会话内修改。
- [x] 保存边界：搜索 / 筛选展示与完整保存源已分离；第二轮额外修复了社会经济复习提问的字符串数组 index 偏移问题。
- [x] 公共组件：`Select` 与 `MultiSelect` 选中态均以稳定 value 映射 label / option；公共通知关闭按钮和默认文案不再硬编码中文。
- [x] 国际化：直接 `t(...)` key 已覆盖中英文 locale；可见硬编码中文扫描无实质命中；主题、音乐和情绪弹窗 fallback 已收紧。
- [x] 响应式：非购物页面的堆叠布局已复查；生命整理和关系深化的窄屏裁切风险已修复，桌面固定工作台仍保留内部滚动。
- [x] 静态数据：14 个非购物模块 seed JSON 与中英文 locale JSON 均已完成解析检查。

## 模块开发进度

### 未来蓝图模块

更新日期：2026-06-08

- [x] 按应用设计文档承接 `理想自我 / 理想生活 / 重要价值 / 阶段路径`
- [x] 增加未来模块 Tauri 后端快照：`future.json` 持久化与 `seed.json` 初始数据
- [x] live 工作区快照改为读取后端 future 数据，mock 模式保留足量示例数据
- [x] 增加未来蓝图保存 mutation，并接入整块蓝图保存
- [x] 参考购物模块控制模式：浏览态只读，控制模式下支持编辑蓝图、阶段路径和当前实验
- [x] 完成一页式响应布局：固定工作台下分栏滚动，窄屏下自然堆叠
- [x] 补齐未来模块中英文国际化文案
- [x] 使用现有主题变量和 `tone-future` 主题色，不新增硬编码主题体系

---

## 工程任务清单

### 任务清单

#### 高优先级

- [x] ESLint
- [x] Prettier
- [x] `prettier-plugin-tailwindcss`
- [x] TanStack Router ESLint 规则
- [x] TanStack Query ESLint 规则
- [x] Husky
- [ ] `lint-staged`
- [x] `commitlint`
- [x] 提交规范
- [x] Vitest
- [x] React Testing Library
- [x] `happy-dom`
- [x] `.editorconfig`
- [ ] LICENSE
- [x] README
- [x] `.gitignore` 加固
- [x] `ci.yml`
- [x] Rust CI 检查
- [x] Rust 缓存
- [x] `specta`
- [x] `tauri-specta`

#### 中优先级

- [x] `release.yml`
- [x] Changesets
- [ ] Tauri Updater
- [ ] Tauri 更新签名
- [ ] GitHub Releases
- [ ] `latest.json`
- [x] Dependabot
- [x] `cargo-audit`
- [x] `cargo-deny`
- [x] CHANGELOG
- [x] `.env.example`

#### 低优先级

- [ ] Sentry
- [ ] Playwright
- [ ] WebdriverIO Tauri Driver
- [x] Bundle 分析器
- [ ] 代码签名

#### 需要手动配置

- [ ] GitHub Secrets
- [ ] Tauri 更新签名密钥
- [ ] 更新公钥
- [ ] 更新源 Endpoint
- [ ] GitHub Releases 配置
- [ ] 环境变量
- [ ] 代码签名证书
- [ ] 私钥保管
