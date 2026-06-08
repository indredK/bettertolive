import { useCallback, useEffect, useMemo, useRef, useState } from "react"

export type WorkspaceMusicPresetId = "morning" | "rain" | "night"

type MusicPreset = {
  id: WorkspaceMusicPresetId
  label: string
  description: string
  notes: number[]
  intervalMs: number
  oscillatorType: OscillatorType
  noteDurationMs: number
}

const MUSIC_PRESETS: MusicPreset[] = [
  {
    id: "morning",
    label: "Morning",
    description: "A lighter bright melody for organizing thoughts.",
    notes: [523.25, 659.25, 783.99, 659.25],
    intervalMs: 880,
    oscillatorType: "sine",
    noteDurationMs: 620,
  },
  {
    id: "rain",
    label: "Rain",
    description: "A smoother, lower pattern for longer sessions.",
    notes: [220, 246.94, 261.63, 246.94],
    intervalMs: 1080,
    oscillatorType: "triangle",
    noteDurationMs: 760,
  },
  {
    id: "night",
    label: "Night Reading",
    description: "A more distant tone for calm evening work.",
    notes: [329.63, 392, 440, 392],
    intervalMs: 960,
    oscillatorType: "sine",
    noteDurationMs: 680,
  },
]

type AudioContextWithWebkit = typeof window & {
  webkitAudioContext?: typeof AudioContext
}

function getAudioContextConstructor() {
  if (typeof window === "undefined") {
    return null
  }

  const scopedWindow = window as AudioContextWithWebkit
  return scopedWindow.AudioContext ?? scopedWindow.webkitAudioContext ?? null
}

export function useWorkspaceMusic() {
  const [isPlaying, setIsPlaying] = useState(false)
  const [presetId, setPresetId] = useState<WorkspaceMusicPresetId>("morning")
  const [volume, setVolume] = useState(52)
  const [isSupported, setIsSupported] = useState(true)

  const audioContextRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepRef = useRef(0)

  const currentPreset = useMemo(
    () => MUSIC_PRESETS.find((entry) => entry.id === presetId) ?? MUSIC_PRESETS[0],
    [presetId],
  )

  const stopPlayback = useCallback(async () => {
    setIsPlaying(false)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    if (audioContextRef.current?.state === "running") {
      await audioContextRef.current.suspend()
    }
  }, [])

  const playTone = useCallback(
    (context: AudioContext, frequency: number, preset: MusicPreset) => {
      if (!gainRef.current) {
        return
      }

      const oscillator = context.createOscillator()
      const envelope = context.createGain()
      const now = context.currentTime
      const durationSeconds = preset.noteDurationMs / 1000
      const peakGain = (volume / 100) * 0.05

      oscillator.type = preset.oscillatorType
      oscillator.frequency.setValueAtTime(frequency, now)
      oscillator.connect(envelope)
      envelope.connect(gainRef.current)

      envelope.gain.setValueAtTime(0.0001, now)
      envelope.gain.exponentialRampToValueAtTime(peakGain, now + 0.08)
      envelope.gain.exponentialRampToValueAtTime(0.0001, now + durationSeconds)

      oscillator.start(now)
      oscillator.stop(now + durationSeconds + 0.02)
    },
    [volume],
  )

  const startPlayback = useCallback(
    async (preset: MusicPreset = currentPreset) => {
      const AudioContextConstructor = getAudioContextConstructor()

      if (!AudioContextConstructor) {
        setIsSupported(false)
        return
      }

      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextConstructor()
      }

      if (!gainRef.current) {
        gainRef.current = audioContextRef.current.createGain()
        gainRef.current.gain.value = 0.18
        gainRef.current.connect(audioContextRef.current.destination)
      }

      if (audioContextRef.current.state === "suspended") {
        await audioContextRef.current.resume()
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }

      stepRef.current = 0
      const runStep = () => {
        if (!audioContextRef.current) {
          return
        }

        const note = preset.notes[stepRef.current % preset.notes.length]
        playTone(audioContextRef.current, note, preset)
        stepRef.current += 1
      }

      runStep()
      intervalRef.current = setInterval(runStep, preset.intervalMs)
      setIsPlaying(true)
    },
    [currentPreset, playTone],
  )

  const togglePlayback = useCallback(async () => {
    if (isPlaying) {
      await stopPlayback()
      return
    }

    await startPlayback()
  }, [isPlaying, startPlayback, stopPlayback])

  const selectPreset = useCallback(
    (nextPresetId: WorkspaceMusicPresetId) => {
      const nextPreset =
        MUSIC_PRESETS.find((entry) => entry.id === nextPresetId) ?? MUSIC_PRESETS[0]
      setPresetId(nextPresetId)

      if (isPlaying) {
        void startPlayback(nextPreset)
      }
    },
    [isPlaying, startPlayback],
  )

  const nudgeVolume = useCallback((delta: number) => {
    setVolume((current) => Math.max(0, Math.min(100, current + delta)))
  }, [])

  useEffect(() => {
    if (gainRef.current && audioContextRef.current) {
      gainRef.current.gain.value = Math.max(0.02, volume / 100) * 0.18
    }
  }, [volume])

  useEffect(
    () => () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }

      if (audioContextRef.current) {
        void audioContextRef.current.close()
      }
    },
    [],
  )

  return {
    isPlaying,
    isSupported,
    currentPreset,
    presets: MUSIC_PRESETS,
    presetId,
    selectPreset,
    togglePlayback,
    volume,
    nudgeVolume,
  }
}
