import {
  type CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { BellRing, Globe, Music4, Palette, Wrench } from "lucide-react"
import { useTranslation } from "react-i18next"

import type {
  WorkspaceNotification,
  WorkspaceNotificationInput,
} from "@/features/bettertolive/config/notifications"
import type { WorkspaceTheme, WorkspaceThemeId } from "@/features/bettertolive/config/theme-presets"
import type { WorkspaceMusicPresetId } from "@/features/bettertolive/hooks/use-workspace-music"
import { useLocaleStore } from "@/features/bettertolive/stores/locale-store"
import { useWorkspaceUiStore } from "@/features/bettertolive/stores/workspace-ui-store"
import { MusicUtilityPanel } from "@/features/bettertolive/ui/workspace-utilities/music-utility-panel"
import { NotificationCenterPanel } from "@/features/bettertolive/ui/workspace-utilities/notification-center-panel"
import { ThemeUtilityPanel } from "@/features/bettertolive/ui/workspace-utilities/theme-utility-panel"
import { UtilityIconButton } from "@/features/bettertolive/ui/workspace-utilities/utility-icon-button"
import { UtilityPanelPortal } from "@/features/bettertolive/ui/workspace-utilities/utility-panel-portal"

type UtilityPanel = "themes" | "notifications" | "music" | null

const PANEL_GAP = 12
const PANEL_VIEWPORT_PADDING = 16
const PANEL_WIDTHS: Record<Exclude<UtilityPanel, null>, number> = {
  themes: 336,
  notifications: 360,
  music: 340,
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function WorkspaceUtilities({
  themeId,
  themes,
  onSelectTheme,
  notifications,
  notificationFeed,
  unreadCount,
  onNotify,
  onDismissNotification,
  onOpenNotificationDetail,
  onActivateNotificationTarget,
  isPlaying,
  isMusicSupported,
  musicPresetLabel,
  musicDescription,
  musicPresetId,
  musicPresets,
  volume,
  onSelectMusicPreset,
  onToggleMusic,
  onNudgeVolume,
}: {
  themeId: WorkspaceThemeId
  themes: WorkspaceTheme[]
  onSelectTheme: (themeId: WorkspaceThemeId) => void
  notifications: WorkspaceNotification[]
  notificationFeed: WorkspaceNotification[]
  unreadCount: number
  onNotify: (input: WorkspaceNotificationInput) => string
  onDismissNotification: (id: string) => void
  onOpenNotificationDetail: (id: string) => void
  onActivateNotificationTarget: (notification: WorkspaceNotification) => void
  isPlaying: boolean
  isMusicSupported: boolean
  musicPresetLabel: string
  musicDescription: string
  musicPresetId: WorkspaceMusicPresetId
  musicPresets: Array<{
    id: WorkspaceMusicPresetId
    label: string
    description: string
  }>
  volume: number
  onSelectMusicPreset: (presetId: WorkspaceMusicPresetId) => void
  onToggleMusic: () => void | Promise<void>
  onNudgeVolume: (delta: number) => void
}) {
  const { t } = useTranslation()
  const [openPanel, setOpenPanel] = useState<UtilityPanel>(null)
  const [panelStyle, setPanelStyle] = useState<CSSProperties | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const themeTriggerRef = useRef<HTMLButtonElement | null>(null)
  const notificationTriggerRef = useRef<HTMLButtonElement | null>(null)
  const musicTriggerRef = useRef<HTMLButtonElement | null>(null)

  const currentTheme = themes.find((item) => item.id === themeId) ?? themes[0]
  const locale = useLocaleStore((state) => state.locale)
  const toggleLocale = useLocaleStore((state) => state.toggleLocale)
  const isShoppingManagementMode = useWorkspaceUiStore((state) => state.isShoppingManagementMode)
  const toggleShoppingManagementMode = useWorkspaceUiStore(
    (state) => state.toggleShoppingManagementMode,
  )

  const updatePanelPosition = useCallback(() => {
    if (openPanel === null || typeof window === "undefined") {
      return
    }

    const trigger =
      openPanel === "themes"
        ? themeTriggerRef.current
        : openPanel === "notifications"
          ? notificationTriggerRef.current
          : musicTriggerRef.current

    if (!trigger) {
      return
    }

    const availableWidth = Math.max(0, window.innerWidth - PANEL_VIEWPORT_PADDING * 2)
    const width = Math.min(PANEL_WIDTHS[openPanel], availableWidth)
    const rect = trigger.getBoundingClientRect()
    const maxLeft = Math.max(
      PANEL_VIEWPORT_PADDING,
      window.innerWidth - width - PANEL_VIEWPORT_PADDING,
    )

    setPanelStyle({
      top: rect.bottom + PANEL_GAP,
      left: clamp(rect.right - width, PANEL_VIEWPORT_PADDING, maxLeft),
      width,
    })
  }, [openPanel])

  useLayoutEffect(() => {
    if (openPanel === null) {
      return
    }

    updatePanelPosition()

    if (typeof window === "undefined") {
      return
    }

    const handleViewportChange = () => {
      updatePanelPosition()
    }

    window.addEventListener("resize", handleViewportChange)
    window.addEventListener("scroll", handleViewportChange, true)

    const trigger =
      openPanel === "themes"
        ? themeTriggerRef.current
        : openPanel === "notifications"
          ? notificationTriggerRef.current
          : musicTriggerRef.current
    const observer =
      typeof ResizeObserver !== "undefined" && trigger
        ? new ResizeObserver(handleViewportChange)
        : null

    if (observer && trigger) {
      observer.observe(trigger)
    }

    return () => {
      window.removeEventListener("resize", handleViewportChange)
      window.removeEventListener("scroll", handleViewportChange, true)
      observer?.disconnect()
    }
  }, [openPanel, updatePanelPosition])

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node

      if (containerRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return
      }

      setOpenPanel(null)
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenPanel(null)
      }
    }

    window.addEventListener("pointerdown", handlePointerDown)
    window.addEventListener("keydown", handleEscape)

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown)
      window.removeEventListener("keydown", handleEscape)
    }
  }, [])

  return (
    <>
      <div
        ref={containerRef}
        className="flex items-center gap-1 rounded-full border border-[color:var(--chip-border)] bg-[color:var(--chip-bg)] px-1.5 py-1"
      >
        <UtilityIconButton
          ref={themeTriggerRef}
          isActive={openPanel === "themes"}
          label="主题切换"
          popupType="dialog"
          testId="theme-center-trigger"
          onClick={() => setOpenPanel((current) => (current === "themes" ? null : "themes"))}
        >
          <Palette className="size-4" />
          <span
            className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full border border-white/90 shadow-sm"
            style={{ backgroundColor: currentTheme.swatches[0] }}
          />
        </UtilityIconButton>

        <UtilityIconButton
          ref={notificationTriggerRef}
          isActive={openPanel === "notifications"}
          label="通知中心"
          badge={unreadCount > 0 ? unreadCount : null}
          popupType="dialog"
          testId="notification-center-trigger"
          onClick={() =>
            setOpenPanel((current) => (current === "notifications" ? null : "notifications"))
          }
        >
          <BellRing className="size-4" />
        </UtilityIconButton>

        <UtilityIconButton
          ref={musicTriggerRef}
          isActive={openPanel === "music"}
          label="播放音乐"
          dot={isPlaying}
          popupType="dialog"
          testId="music-center-trigger"
          onClick={() => setOpenPanel((current) => (current === "music" ? null : "music"))}
        >
          <Music4 className="size-4" />
        </UtilityIconButton>

        <UtilityIconButton
          isActive={false}
          label={
            locale === "zh"
              ? t("shell.language.switchToEnglish")
              : t("shell.language.switchToChinese")
          }
          testId="language-toggle"
          onClick={toggleLocale}
        >
          <Globe className="size-4" />
        </UtilityIconButton>

        <UtilityIconButton
          isActive={isShoppingManagementMode}
          label="管理模式"
          testId="management-mode-trigger"
          onClick={toggleShoppingManagementMode}
        >
          <Wrench className="size-4" />
        </UtilityIconButton>
      </div>

      <UtilityPanelPortal
        isOpen={openPanel !== null}
        panelKey={openPanel}
        panelRef={panelRef}
        panelStyle={panelStyle}
      >
        {openPanel === "themes" ? (
          <ThemeUtilityPanel
            currentTheme={currentTheme}
            themeId={themeId}
            themes={themes}
            onSelectTheme={(nextThemeId) => {
              onSelectTheme(nextThemeId)
              setOpenPanel(null)
            }}
          />
        ) : null}

        {openPanel === "notifications" ? (
          <NotificationCenterPanel
            notifications={notifications}
            notificationFeed={notificationFeed}
            onActivateNotificationTarget={onActivateNotificationTarget}
            onDismissNotification={onDismissNotification}
            onNotify={onNotify}
            onOpenNotificationDetail={onOpenNotificationDetail}
            onRequestClose={() => setOpenPanel(null)}
          />
        ) : null}

        {openPanel === "music" ? (
          <MusicUtilityPanel
            isMusicSupported={isMusicSupported}
            isPlaying={isPlaying}
            musicDescription={musicDescription}
            musicPresetId={musicPresetId}
            musicPresetLabel={musicPresetLabel}
            musicPresets={musicPresets}
            onNudgeVolume={onNudgeVolume}
            onSelectMusicPreset={onSelectMusicPreset}
            onToggleMusic={onToggleMusic}
            volume={volume}
          />
        ) : null}
      </UtilityPanelPortal>
    </>
  )
}
