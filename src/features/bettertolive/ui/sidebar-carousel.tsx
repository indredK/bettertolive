import { useCallback, useEffect, useMemo, useState } from "react"
import type { LucideIcon } from "lucide-react"
import Autoplay from "embla-carousel-autoplay"
import useEmblaCarousel from "embla-carousel-react"

import type {
  WorkspaceRhythmSlide,
  WorkspaceSidebarNote,
} from "@/features/bettertolive/sidebar-copy"
import { cn } from "@/lib/utils"

type CarouselDotButtonProps = {
  index: number
  isActive: boolean
  label: string
  onClick: (index: number) => void
}

function CarouselDotButton({ index, isActive, label, onClick }: CarouselDotButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={isActive}
      onClick={() => onClick(index)}
      className={cn(
        "size-1.5 rounded-full transition-all",
        isActive ? "w-4 bg-white/92" : "bg-white/38 hover:bg-white/58",
      )}
    />
  )
}

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

export function SidebarRhythmCarousel({
  icon: Icon,
  slides,
  title,
}: {
  icon: LucideIcon
  slides: WorkspaceRhythmSlide[]
  title: string
}) {
  const { emblaRef, scrollTo, selectedIndex } = useSidebarCarousel(slides.length, 4600)

  return (
    <section
      className="mt-4 rounded-lg border border-white/10 px-3 py-2.5 shadow-[0_10px_24px_rgba(15,23,42,0.12)]"
      data-testid="sidebar-rhythm-carousel"
      style={{
        backgroundColor: "var(--hero-bg)",
        color: "var(--hero-ink)",
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-[11px] tracking-[0.18em] text-[color:var(--hero-muted)] uppercase">
          <Icon className="size-3.5" />
          {title}
        </div>
        {slides.length > 1 ? (
          <div className="flex items-center gap-1">
            {slides.map((slide, index) => (
              <CarouselDotButton
                key={slide.id}
                index={index}
                isActive={index === selectedIndex}
                label={`切换到今日节奏第 ${index + 1} 条`}
                onClick={scrollTo}
              />
            ))}
          </div>
        ) : null}
      </div>

      <div className="mt-2.5 overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide) => (
            <article
              key={slide.id}
              className="min-w-0 flex-[0_0_100%] pr-2"
              data-testid={`rhythm-slide-${slide.id}`}
            >
              <div className="text-[13px] font-medium tracking-[0.02em]">{slide.title}</div>
              <p className="mt-1.5 text-[13px] leading-5 text-[color:var(--hero-muted)]">
                {slide.body}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export function SidebarNoteCarousel({
  icon: Icon,
  note,
}: {
  icon: LucideIcon
  note: WorkspaceSidebarNote
}) {
  const { emblaRef, scrollTo, selectedIndex } = useSidebarCarousel(note.lines.length, 4200)

  return (
    <section
      className="mt-3 hidden shrink-0 rounded-lg border border-[color:var(--chip-border)] bg-[color:var(--surface-bg)] px-3 py-2.5 text-sm text-[color:var(--text-muted)] min-[1240px]:block"
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
                aria-label={`切换到说明第 ${index + 1} 条`}
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
