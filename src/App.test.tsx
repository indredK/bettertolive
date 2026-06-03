import { act, fireEvent, render, screen, waitFor } from "@testing-library/react"
import { afterEach, vi } from "vitest"

import { resetWorkspaceUiStore } from "@/features/bettertolive/stores/workspace-ui-store"
import App from "./App"

const THEME_STORAGE_KEY = "bettertolive.theme"

function setViewportWidth(width: number) {
  window.innerWidth = width
  window.dispatchEvent(new Event("resize"))
}

function clearLocationHash() {
  window.history.replaceState(
    window.history.state,
    "",
    `${window.location.pathname}${window.location.search}`,
  )
}

describe("App", () => {
  beforeEach(() => {
    clearLocationHash()
    window.localStorage.removeItem(THEME_STORAGE_KEY)
    resetWorkspaceUiStore()
    setViewportWidth(1440)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("renders the overview workspace", () => {
    render(<App />)

    expect(screen.getByRole("heading", { name: "BetterToLive" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "总览" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /快速记录/ })).toBeInTheDocument()
    expect(screen.getByTestId("sidebar-nav-scroll")).toBeInTheDocument()
    expect(screen.getByTestId("sidebar-preview-bottom")).toBeInTheDocument()
    expect(screen.getByTestId("sidebar-rhythm-carousel")).toBeInTheDocument()
    expect(screen.getByTestId("sidebar-note-carousel")).toBeInTheDocument()
    expect(screen.getByText("总览说明")).toBeInTheDocument()
    expect(screen.getByTestId("nav-beliefs")).toBeInTheDocument()
    expect(screen.getByTestId("nav-journey")).toBeInTheDocument()
    expect(screen.getByTestId("nav-emotion")).toBeInTheDocument()
    expect(screen.getByTestId("nav-legacy")).toBeInTheDocument()
  })

  it("switches to the compact rail layout between 960px and 1240px", () => {
    setViewportWidth(1100)

    render(<App />)

    expect(screen.getByTestId("workspace-root")).toHaveAttribute("data-layout-mode", "compact")
    expect(screen.getByTestId("workspace-sidebar")).toHaveAttribute("data-collapsed", "true")
    expect(screen.queryByTestId("stacked-navigation")).not.toBeInTheDocument()
    expect(screen.queryByTestId("sidebar-toggle")).not.toBeInTheDocument()
    expect(screen.queryByText("BetterToLive")).not.toBeInTheDocument()
    expect(screen.getByTestId("sidebar-brand-toggle")).toBeInTheDocument()
    expect(screen.getByTestId("workspace-header-shell")).toHaveAttribute("data-orientation", "row")
  })

  it("allows expanding the compact rail layout on demand", async () => {
    setViewportWidth(1100)

    render(<App />)

    fireEvent.click(screen.getByTestId("sidebar-brand-toggle"))

    await waitFor(() => {
      expect(screen.getByTestId("workspace-sidebar")).toHaveAttribute("data-collapsed", "false")
      expect(screen.getByTestId("sidebar-toggle")).toBeInTheDocument()
      expect(screen.getByText("BetterToLive")).toBeInTheDocument()
    })
  })

  it("remembers the expanded compact rail layout across resize round-trips", async () => {
    setViewportWidth(1100)

    render(<App />)

    fireEvent.click(screen.getByTestId("sidebar-brand-toggle"))

    await waitFor(() => {
      expect(screen.getByTestId("workspace-sidebar")).toHaveAttribute("data-collapsed", "false")
    })

    setViewportWidth(820)

    await waitFor(() => {
      expect(screen.getByTestId("workspace-root")).toHaveAttribute("data-layout-mode", "stacked")
      expect(screen.queryByTestId("workspace-sidebar")).not.toBeInTheDocument()
    })

    setViewportWidth(1100)

    await waitFor(() => {
      expect(screen.getByTestId("workspace-root")).toHaveAttribute("data-layout-mode", "compact")
      expect(screen.getByTestId("workspace-sidebar")).toHaveAttribute("data-collapsed", "false")
      expect(screen.getByTestId("sidebar-toggle")).toBeInTheDocument()
      expect(screen.getByText("BetterToLive")).toBeInTheDocument()
    })
  })

  it("remembers the expanded compact rail layout after a reload in the same tab", async () => {
    setViewportWidth(1100)

    const view = render(<App />)

    fireEvent.click(screen.getByTestId("sidebar-brand-toggle"))

    await waitFor(() => {
      expect(screen.getByTestId("workspace-sidebar")).toHaveAttribute("data-collapsed", "false")
    })

    view.unmount()
    resetWorkspaceUiStore({
      clearSession: false,
      restorePersistedState: true,
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByTestId("workspace-root")).toHaveAttribute("data-layout-mode", "compact")
      expect(screen.getByTestId("workspace-sidebar")).toHaveAttribute("data-collapsed", "false")
      expect(screen.getByTestId("sidebar-toggle")).toBeInTheDocument()
      expect(screen.getByText("BetterToLive")).toBeInTheDocument()
    })
  })

  it("switches to a stacked top navigation below 960px", () => {
    setViewportWidth(820)

    render(<App />)

    expect(screen.getByTestId("workspace-root")).toHaveAttribute("data-layout-mode", "stacked")
    expect(screen.queryByTestId("workspace-sidebar")).not.toBeInTheDocument()
    expect(screen.getByTestId("stacked-navigation")).toBeInTheDocument()
    expect(screen.getAllByText("BetterToLive").length).toBeGreaterThan(0)
    expect(screen.getByTestId("nav-shopping")).toBeInTheDocument()
    expect(screen.getByTestId("workspace-header-shell")).toHaveAttribute(
      "data-orientation",
      "column",
    )
  })

  it("switches to the journey view", () => {
    render(<App />)

    fireEvent.click(screen.getByTestId("nav-journey"))

    expect(screen.getByRole("heading", { name: "成长记忆" })).toBeInTheDocument()
    expect(screen.getByText("成长记忆说明")).toBeInTheDocument()
    expect(
      screen.getByText("把人生节点、经历背景和留下的影响放在同一条时间线上回看。"),
    ).toBeInTheDocument()
  })

  it("keeps the current menu view in the URL hash", async () => {
    render(<App />)

    fireEvent.click(screen.getByTestId("nav-journey"))

    await waitFor(() => {
      expect(window.location.hash).toBe("#/journey")
    })
  })

  it("restores the active view from the URL hash after a reload", async () => {
    window.location.hash = "#/legacy"
    resetWorkspaceUiStore()

    render(<App />)

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: "生命整理" })).toBeInTheDocument()
    })
  })

  it("switches to the emotion view with trend and support data", () => {
    render(<App />)

    fireEvent.click(screen.getByTestId("nav-emotion"))

    expect(screen.getByRole("heading", { name: "情绪情感" })).toBeInTheDocument()
    expect(screen.getByText("情绪说明")).toBeInTheDocument()
    expect(screen.getByText("最近波动")).toBeInTheDocument()
    expect(screen.getByText("恢复工具箱")).toBeInTheDocument()
  })

  it("switches to the legacy view with letters and directives", () => {
    render(<App />)

    fireEvent.click(screen.getByTestId("nav-legacy"))

    expect(screen.getByRole("heading", { name: "生命整理" })).toBeInTheDocument()
    expect(screen.getByText("生命整理说明")).toBeInTheDocument()
    expect(screen.getByText("重要交代与留给某人的话")).toBeInTheDocument()
    expect(screen.getByText("未来的自己")).toBeInTheDocument()
  })

  it("switches to the shopping view with planning and stage data", () => {
    render(<App />)

    fireEvent.click(screen.getByTestId("nav-shopping"))

    expect(screen.getByRole("heading", { name: "购物清单" })).toBeInTheDocument()
    expect(screen.getByText("购物说明")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("tab", { name: "采购决策" }))
    expect(screen.getByText("立即补齐")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("tab", { name: "阶段清单" }))
    expect(screen.getByText("搬家最低配置")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("tab", { name: "理想生活" }))
    expect(screen.getByText("送礼可以考虑什么")).toBeInTheDocument()
  })

  it("collapses the sidebar into an icon rail", async () => {
    render(<App />)

    fireEvent.click(screen.getByTestId("sidebar-toggle"))

    expect(screen.getByTestId("workspace-sidebar")).toHaveAttribute("data-collapsed", "true")
    await waitFor(() => {
      expect(screen.queryByTestId("sidebar-rhythm-carousel")).not.toBeInTheDocument()
      expect(screen.queryByTestId("sidebar-note-carousel")).not.toBeInTheDocument()
      expect(screen.queryByTestId("sidebar-toggle")).not.toBeInTheDocument()
      expect(screen.queryByText("BetterToLive")).not.toBeInTheDocument()
    })
    expect(screen.getByTestId("sidebar-brand-toggle")).toBeInTheDocument()
    expect(screen.getByTestId("nav-overview")).toBeInTheDocument()

    fireEvent.click(screen.getByTestId("sidebar-brand-toggle"))

    await waitFor(() => {
      expect(screen.getByTestId("workspace-sidebar")).toHaveAttribute("data-collapsed", "false")
      expect(screen.getByTestId("sidebar-toggle")).toBeInTheDocument()
    })
  })

  it("switches between palette themes without relying on dark mode", () => {
    render(<App />)

    fireEvent.click(screen.getByTestId("theme-center-trigger"))
    fireEvent.click(screen.getByTestId("theme-option-linen"))

    expect(screen.getByTestId("workspace-root")).toHaveAttribute("data-theme", "linen")
  })

  it("shows and auto-dismisses top messages", async () => {
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(screen.getByTestId("notification-center-trigger"))
    fireEvent.click(screen.getByTestId("notification-demo-message"))

    expect(screen.getAllByText("顶部消息已触发").length).toBeGreaterThan(0)
    expect(screen.getAllByTestId("notification-card-message")).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(3200)
    })

    vi.useRealTimers()

    await waitFor(() => {
      expect(screen.queryAllByTestId("notification-card-message")).toHaveLength(0)
    })
  })

  it("keeps persistent notifications until handled and can navigate from them", () => {
    vi.useFakeTimers()
    render(<App />)

    fireEvent.click(screen.getByTestId("notification-center-trigger"))
    fireEvent.click(screen.getByTestId("notification-demo-persistent"))

    expect(screen.getAllByText("人生脉络待补充").length).toBeGreaterThan(0)
    expect(screen.getAllByTestId("notification-card-notification")).toHaveLength(1)

    act(() => {
      vi.advanceTimersByTime(6000)
    })

    expect(screen.getAllByTestId("notification-card-notification")).toHaveLength(1)

    fireEvent.click(screen.getAllByText("前往成长记忆")[0])

    expect(screen.getByRole("heading", { name: "成长记忆" })).toBeInTheDocument()
  })

  it("opens the music panel from the persistent utility area", () => {
    render(<App />)

    fireEvent.click(screen.getByTestId("music-center-trigger"))

    const workspaceRoot = screen.getByTestId("workspace-root")
    const panel = screen.getByTestId("utility-panel-music")

    expect(panel).toBeInTheDocument()
    expect(workspaceRoot).not.toContainElement(panel)
    expect(screen.getByText("音乐控制")).toBeInTheDocument()
    expect(screen.getByText("晨间")).toBeInTheDocument()
    expect(screen.getByText("雨幕")).toBeInTheDocument()
  })

  it("renders the notification center in a top-level portal layer", () => {
    render(<App />)

    fireEvent.click(screen.getByTestId("notification-center-trigger"))

    const workspaceRoot = screen.getByTestId("workspace-root")
    const panel = screen.getByTestId("utility-panel-notifications")

    expect(panel).toBeInTheDocument()
    expect(workspaceRoot).not.toContainElement(panel)
  })

  it("renders the theme switcher in the same persistent utility area", () => {
    render(<App />)

    fireEvent.click(screen.getByTestId("theme-center-trigger"))

    const workspaceRoot = screen.getByTestId("workspace-root")
    const panel = screen.getByTestId("utility-panel-themes")

    expect(panel).toBeInTheDocument()
    expect(workspaceRoot).not.toContainElement(panel)
    expect(screen.getByText("主题切换")).toBeInTheDocument()
  })
})
