import { ChevronRight, Minus, Pause, Play, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
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
  return (
    <div
      data-testid="utility-panel-music"
      className="rounded-2xl border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] p-4 shadow-[0_24px_60px_rgba(15,23,42,0.16)] backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-medium text-[color:var(--text-primary)]">音乐控制</div>
          <p className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
            常驻工具区的一部分。更像轻量陪伴，不抢页面注意力。
          </p>
        </div>
        <Button
          size="icon-sm"
          variant="outline"
          className="bg-white/80"
          onClick={() => void onToggleMusic()}
        >
          {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
        </Button>
      </div>

      <div className="mt-4 rounded-xl border border-[color:var(--chip-border)] bg-white/70 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-sm font-medium text-[color:var(--text-primary)]">
              {isPlaying ? "正在播放" : "已暂停"}
            </div>
            <p className="mt-1 text-sm text-[color:var(--text-muted)]">
              {musicPresetLabel} · {musicDescription}
            </p>
          </div>
          <div className="rounded-full border border-[color:var(--chip-border)] bg-white px-2.5 py-1 text-[11px] leading-none text-[color:var(--text-muted)]">
            音量 {volume}
          </div>
        </div>
        {!isMusicSupported ? (
          <p className="mt-3 text-xs leading-5 text-amber-700">
            当前环境不支持实时音频，界面仍可保留，后续可替换成真实播放器。
          </p>
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
                  {preset.label}
                </div>
                <div className="mt-1 text-xs leading-5 text-[color:var(--text-muted)]">
                  {preset.description}
                </div>
              </div>
              <ChevronRight className="size-4 text-[color:var(--text-muted)]" />
            </div>
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-[color:var(--chip-border)] bg-white/65 px-3 py-3">
        <div>
          <div className="text-xs font-medium text-[color:var(--text-muted)]">音量微调</div>
          <div className="mt-1 text-sm text-[color:var(--text-primary)]">
            让功能区保持轻量，不盖住主页面。
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon-sm"
            variant="outline"
            className="bg-white/80"
            onClick={() => onNudgeVolume(-8)}
          >
            <Minus className="size-4" />
          </Button>
          <Button
            size="icon-sm"
            variant="outline"
            className="bg-white/80"
            onClick={() => onNudgeVolume(8)}
          >
            <Plus className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
