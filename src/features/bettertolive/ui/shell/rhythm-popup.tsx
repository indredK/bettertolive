import { useCallback, useEffect, useMemo, useState } from "react"
import { CalendarDays } from "lucide-react"
import Autoplay from "embla-carousel-autoplay"
import useEmblaCarousel from "embla-carousel-react"
import { AnimatePresence, m } from "motion/react"

import {
  PopupNotification,
  PopupNotificationBody,
  PopupNotificationHeader,
  usePopupNotification,
} from "@/components/ui/popup-notification"
import type { WorkspaceRhythmSlide } from "@/features/bettertolive/config/sidebar"
import { cn } from "@/lib/utils"

const AUTO_CLOSE_MS = 9000
const SLIDE_DELAY_MS = 3200

type RhythmPopupProps = {
  slides: WorkspaceRhythmSlide[]
}

export function RhythmPopup({ slides }: RhythmPopupProps) {
  const [open, setOpen] = useState<boolean>(slides.length > 0)

  if (slides.length === 0) {
    return null
  }

  return (
    <PopupNotification
      data-testid="rhythm-popup"
      open={open}
      onOpenChange={setOpen}
      autoCloseMs={AUTO_CLOSE_MS}
    >
      <PopupNotificationHeader
        icon={CalendarDays}
        eyebrow="今日节奏"
        title="慢一点，先看看今天"
        onClose={() => setOpen(false)}
      />
      <PopupNotificationBody>
        <RhythmCarousel slides={slides} />
      </PopupNotificationBody>
    </PopupNotification>
  )
}

function RhythmCarousel({ slides }: { slides: WorkspaceRhythmSlide[] }) {
  const { isPaused } = usePopupNotification()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const autoplay = useMemo(
    () =>
      Autoplay({
        delay: SLIDE_DELAY_MS,
        playOnInit: slides.length > 1,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    [slides.length],
  )

  const plugins = useMemo(() => (slides.length > 1 ? [autoplay] : []), [autoplay, slides.length])

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "start",
      dragFree: false,
      loop: slides.length > 1,
      watchDrag: slides.length > 1,
    },
    plugins,
  )

  useEffect(() => {
    if (!emblaApi) return
    const sync = () => setSelectedIndex(emblaApi.selectedScrollSnap())
    sync()
    emblaApi.on("select", sync)
    emblaApi.on("reInit", sync)
    return () => {
      emblaApi.off("select", sync)
      emblaApi.off("reInit", sync)
    }
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi || slides.length <= 1) return
    if (isPaused) {
      autoplay.stop()
    } else {
      autoplay.play()
    }
  }, [emblaApi, autoplay, isPaused, slides.length])

  const scrollTo = useCallback(
    (index: number) => {
      if (!emblaApi) return
      emblaApi.scrollTo(index)
      autoplay.reset()
    },
    [autoplay, emblaApi],
  )

  return (
    <div data-testid="rhythm-popup-carousel">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex">
          {slides.map((slide, index) => (
            <article
              key={slide.id}
              data-testid={`rhythm-popup-slide-${slide.id}`}
              className="min-w-0 flex-[0_0_100%] pr-2"
            >
              <AnimatePresence mode="wait">
                {index === selectedIndex ? (
                  <m.div
                    key={slide.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="text-[13px] font-medium tracking-[0.02em] text-[color:var(--text-primary)]">
                      {slide.title}
                    </div>
                    <p className="mt-1.5 text-[13px] leading-5 text-[color:var(--text-muted)]">
                      {slide.body}
                    </p>
                  </m.div>
                ) : (
                  <div aria-hidden>
                    <div className="text-[13px] font-medium tracking-[0.02em] text-[color:var(--text-primary)]">
                      {slide.title}
                    </div>
                    <p className="mt-1.5 text-[13px] leading-5 text-[color:var(--text-muted)]">
                      {slide.body}
                    </p>
                  </div>
                )}
              </AnimatePresence>
            </article>
          ))}
        </div>
      </div>

      {slides.length > 1 ? (
        <div className="mt-2.5 flex items-center gap-1.5">
          {slides.map((slide, index) => {
            const isActive = index === selectedIndex
            return (
              <button
                key={slide.id}
                type="button"
                aria-label={`切换到今日节奏第 ${index + 1} 条`}
                aria-pressed={isActive}
                onClick={() => scrollTo(index)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  isActive
                    ? "w-5 bg-[color:var(--text-primary)]"
                    : "w-1.5 bg-[color:var(--chip-border)] hover:bg-[color:var(--text-muted)]",
                )}
              />
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
