import { useCallback, useEffect, useMemo, useState } from "react"
import type { LucideIcon } from "lucide-react"
import Autoplay from "embla-carousel-autoplay"
import useEmblaCarousel from "embla-carousel-react"
import { useTranslation } from "react-i18next"

import type { WorkspaceSidebarNote } from "@/features/bettertolive/config/sidebar"
import { cn } from "@/lib/utils"

function useSidebarCarousel(slideCount: number, delay: number) {
  const autoplay = useMemo(
    () =>
      Autoplay({
        delay,
        playOnInit: slideCount > 1,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    [delay, slideCount],
  )
  const [selectedIndex, setSelectedIndex] = useState(0)
  const plugins = useMemo(() => (slideCount > 1 ? [autoplay] : []), [autoplay, slideCount])
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "start",
      dragFree: false,
      loop: slideCount > 1,
      watchDrag: slideCount > 1,
    },
    plugins,
  )

  useEffect(() => {
    if (!emblaApi) {
      return
    }

    const syncSelectedIndex = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }

    syncSelectedIndex()
    emblaApi.on("select", syncSelectedIndex)
    emblaApi.on("reInit", syncSelectedIndex)

    return () => {
      emblaApi.off("select", syncSelectedIndex)
      emblaApi.off("reInit", syncSelectedIndex)
    }
  }, [emblaApi])

  const scrollTo = useCallback(
    (index: number) => {
      if (!emblaApi) {
        return
      }

      emblaApi.scrollTo(index)
      autoplay.reset()
    },
    [autoplay, emblaApi],
  )

  return {
    emblaRef,
    scrollTo,
    selectedIndex,
  }
}

export function SidebarNoteCarousel({
  icon: Icon,
  note,
}: {
  icon: LucideIcon
  note: WorkspaceSidebarNote
}) {
  const { t } = useTranslation()
  const { emblaRef, scrollTo, selectedIndex } = useSidebarCarousel(note.lines.length, 4200)

  return (
    <section
      className="hidden shrink-0 rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-3 py-2.5 text-sm text-[color:var(--text-muted)] min-[1240px]:block"
      data-testid="sidebar-note-carousel"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 text-[13px] font-medium text-[color:var(--text-primary)]">
          <Icon className="size-3.5" />
          {note.heading}
        </div>
        {note.lines.length > 1 ? (
          <div className="flex items-center gap-1">
            {note.lines.map((line, index) => (
              <button
                key={`${note.heading}-${line.label}`}
                type="button"
                aria-label={t("shell.sidebarCarousel.switchToNth", { n: index + 1 })}
                aria-pressed={index === selectedIndex}
                onClick={() => scrollTo(index)}
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] transition-colors",
                  index === selectedIndex
                    ? "bg-[color:var(--nav-active-bg)] text-[color:var(--text-primary)]"
                    : "bg-[color:var(--chip-bg)] text-[color:var(--text-muted)] hover:text-[color:var(--text-primary)]",
                )}
              >
                {index + 1}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-2 overflow-hidden" data-testid="sidebar-note-panel" ref={emblaRef}>
        <div className="flex">
          {note.lines.map((line) => (
            <article key={`${note.heading}-${line.label}`} className="min-w-0 flex-[0_0_100%]">
              <div className="flex items-start gap-1.5 text-[12px] leading-4.5">
                <span className="shrink-0 rounded-full border border-[color:var(--surface-border)] bg-[color:var(--muted-surface-bg)] px-1.5 py-0.5 text-[10px] tracking-[0.12em] text-[color:var(--text-muted)] uppercase">
                  {line.label}
                </span>
                <span className="min-w-0 text-[12px] text-[color:var(--text-secondary)]">
                  {line.text}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
