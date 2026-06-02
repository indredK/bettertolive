# BetterToLive 前端数据架构（当前约定）

## 状态与请求选型

- `zustand`
  - 管 UI 本地状态
  - 当前用于 `activeView`、`searchQuery`
  - 适合后续继续放筛选、菜单展开、工作区偏好等纯前端状态

- `@tanstack/react-query`
  - 管服务端数据状态
  - 当前用于 `workspace snapshot`
  - 适合后续接真实后端接口、缓存、重试、失效、预取

- `fetch + typed api adapter`
  - 当前没有额外引入 axios
  - 用 `requestJson` 做统一请求入口
  - mock / live 通过 adapter 切换，页面层不直接感知数据来源

## 当前目录

```text
src/features/bettertolive/
  api/
    bettertolive-api.ts
    config.ts
    endpoints.ts
    http-client.ts
    live/
    mock/
      data/
        overview/
        reflection/
        events/
        finance/
        shopping/
        beliefs/
        principles/
        relationships/
        growth/
        future/
  models/
    workspace.ts
  queries/
    workspace-query-keys.ts
    use-workspace-snapshot-query.ts
  stores/
    workspace-ui-store.ts
  ui/
    workspace-utilities/
```

## 当前约定

- mock 数据按业务文件夹拆分，不再放在一个大文件里
- 页面组件不直接读取 mock 文件
- 页面只消费：
  - query hook
  - view model
  - store
- 真正的数据入口是 `BetterToLiveApi`

## 环境变量

- `VITE_BETTERTOLIVE_API_MODE=mock | live`
- `VITE_BETTERTOLIVE_API_BASE_URL=/api/bettertolive`

默认走 `mock`。

## 接后端时的动作

1. 保持 `models/workspace.ts` 作为前端领域类型
2. 在 `live/live-bettertolive-api.ts` 中把接口路径替换成真实后端
3. 如果后端 DTO 和前端领域类型不一致，在 `api` 层做转换，不把 DTO 直接带进页面
4. 按 query key 逐步拆成页面级或业务级查询，而不是让页面直接请求
