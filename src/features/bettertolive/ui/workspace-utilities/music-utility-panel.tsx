import { ChevronRight, Minus, Pause, Play, Plus } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { WorkspaceMusicPresetId } from "@/features/bettertolive/hooks/use-workspace-music"
import { cn } from "@/lib/utils"

export function MusicUtilityPanel({
  isMusicSupported,
  isPlaying,
  musicDescription,
  musicPresetId,
  musicPresetLabel,
  musicPresets,
  onNudgeVolume,
  onSelectMusicPreset,
  onToggleMusic,
  volume,
}: {
  isMusicSupported: boolean
  isPlaying: boolean
  musicDescription: string
  musicPresetId: WorkspaceMusicPresetId
  musicPresetLabel: string
  musicPresets: Array<{
    id: WorkspaceMusicPresetId
    label: string
    description: string
  }>
  onNudgeVolume: (delta: number) => void
  onSelectMusicPreset: (presetId: WorkspaceMusicPresetId) => void
  onToggleMusic: () => void | Promise<void>
  volume: number
}) {
  const { t } = useTranslation()
  const currentPresetLabel = t(`shell.music.presets.${musicPresetId}.label`, musicPresetLabel)
  const currentMusicDescription = t(
    `shell.music.presets.${musicPresetId}.description`,
    musicDescription,
  )
  const toggleMusicLabel = isPlaying
    ? t("shell.music.pause", "暂停播放")
    : t("shell.music.play", "开始播放")
  const decreaseVolumeLabel = t("shell.music.volumeDown", "降低音量")
  const increaseVolumeLabel = t("shell.music.volumeUp", "提高音量")

  return (
    <div
      data-testid="utility-panel-music"
      className="rounded-2xl border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-[color:var(--text-primary)]">
            {t("shell.music.title")}
          </div>
          <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
            {t("shell.music.description")}
          </p>
        </div>
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                aria-label={toggleMusicLabel}
                size="icon-sm"
                variant="outline"
                className="bg-white/80"
                onClick={() => void onToggleMusic()}
              >
                {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
              </Button>
            }
          />
          <TooltipContent>{toggleMusicLabel}</TooltipContent>
        </Tooltip>
      </div>

      <div className="mt-4 rounded-xl border border-[color:var(--chip-border)] bg-white/70 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-[color:var(--text-primary)]">
              {isPlaying ? t("shell.music.playing") : t("shell.music.paused")}
            </div>
            <p className="mt-1 text-sm text-[color:var(--text-muted)]">
              {currentPresetLabel} · {currentMusicDescription}
            </p>
          </div>
          <div className="rounded-full border border-[color:var(--chip-border)] bg-white px-2.5 py-1 text-[11px] leading-none text-[color:var(--text-muted)]">
            {t("shell.music.volume", { volume })}
          </div>
        </div>
        {!isMusicSupported ? (
          <p className="mt-3 text-xs leading-5 text-amber-700">{t("shell.music.unsupported")}</p>
        ) : null}
      </div>

      <div className="mt-4 space-y-2">
        {musicPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            className={cn(
              "w-full rounded-xl border px-3 py-3 text-left transition",
              preset.id === musicPresetId
                ? "border-[color:var(--nav-active-border)] bg-white"
                : "border-[color:var(--chip-border)] bg-white/70 hover:bg-white",
            )}
            onClick={() => onSelectMusicPreset(preset.id)}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-medium text-[color:var(--text-primary)]">
                  {t(`shell.music.presets.${preset.id}.label`, preset.label)}
                </div>
                <div className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
                  {t(`shell.music.presets.${preset.id}.description`, preset.description)}
                </div>
              </div>
              <ChevronRight className="size-4 text-[color:var(--text-muted)]" />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-[color:var(--chip-border)] bg-white/65 px-3 py-3">
        <div>
          <div className="text-xs font-medium text-[color:var(--text-muted)]">
            {t("shell.music.volumeNudge")}
          </div>
          <div className="mt-1 text-sm text-[color:var(--text-primary)]">
            {t("shell.music.volumeHint")}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  aria-label={decreaseVolumeLabel}
                  size="icon-sm"
                  variant="outline"
                  className="bg-white/80"
                  onClick={() => onNudgeVolume(-8)}
                >
                  <Minus className="size-4" />
                </Button>
              }
            />
            <TooltipContent>{decreaseVolumeLabel}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  aria-label={increaseVolumeLabel}
                  size="icon-sm"
                  variant="outline"
                  className="bg-white/80"
                  onClick={() => onNudgeVolume(8)}
                >
                  <Plus className="size-4" />
                </Button>
              }
            />
            <TooltipContent>{increaseVolumeLabel}</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}
