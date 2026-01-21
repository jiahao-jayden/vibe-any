"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { useCallback, useEffect, useId, useRef, useState } from "react"
import { useIntlayer } from "react-intlayer"
import { cn } from "@/shared/lib/utils"
import { MediaCard } from "../shared/media-card"
import { MediaHeader } from "../shared/media-header"
import { getScrollButtonClasses } from "../utils/get-scroll-button-classes"

const CARD_WIDTH = 320
const SCROLL_DISTANCE = CARD_WIDTH * 2

export const HorizontalMedia = () => {
  const { mediaCoverage } = useIntlayer("landing")
  const titleId = useId()
  const scrollRef = useRef<HTMLUListElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const items = mediaCoverage.items.map((item, index) => ({
    id: `${index}`,
    title: item.title.value,
    description: item.description.value,
    imagePath: item.imagePath.value,
    href: item.href.value,
    source: item.source.value,
    date: item.date.value,
    external: item.external,
  }))

  const hasItems = items.length > 0

  /**
   * Handle scroll state updates based on current scroll position
   */
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return

    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 0)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1)
  }, [])

  /**
   * Scroll left by predefined distance
   */
  const scrollLeft = useCallback(() => {
    if (!scrollRef.current) return

    scrollRef.current.scrollBy({
      left: -SCROLL_DISTANCE,
      behavior: "smooth",
    })
  }, [])

  /**
   * Scroll right by predefined distance
   */
  const scrollRight = useCallback(() => {
    if (!scrollRef.current) return

    scrollRef.current.scrollBy({
      left: SCROLL_DISTANCE,
      behavior: "smooth",
    })
  }, [])

  /**
   * Handle keyboard navigation for accessibility
   */
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault()
        scrollLeft()
      } else if (event.key === "ArrowRight") {
        event.preventDefault()
        scrollRight()
      }
    },
    [scrollLeft, scrollRight]
  )

  // Initialize scroll state on component mount
  useEffect(() => {
    handleScroll()
  }, [handleScroll])

  // Don't render if no data available
  if (!hasItems) {
    return null
  }

  return (
    <section
      className="media-horizontal py-16 px-4 sm:px-6 lg:px-8"
      aria-labelledby={titleId}
    >
      <div className="max-w-7xl mx-auto">
        <MediaHeader
          title={mediaCoverage.title.value}
          description={mediaCoverage.description.value}
          titleId={titleId}
        />

        {/* Scroll Container */}
        <section
          className="relative"
          onKeyDown={handleKeyDown}
          aria-label="Horizontal scrollable media coverage"
        >
          {/* Left Scroll Button */}
          <button
            type="button"
            onClick={scrollLeft}
            className={cn(getScrollButtonClasses(canScrollLeft), "left-0")}
            disabled={!canScrollLeft}
            aria-label="Scroll left to view previous articles"
            tabIndex={canScrollLeft ? 0 : -1}
          >
            <ChevronLeft
              className="w-5 h-5"
              aria-hidden="true"
            />
          </button>

          {/* Right Scroll Button */}
          <button
            type="button"
            onClick={scrollRight}
            className={cn(getScrollButtonClasses(canScrollRight), "right-0")}
            disabled={!canScrollRight}
            aria-label="Scroll right to view more articles"
            tabIndex={canScrollRight ? 0 : -1}
          >
            <ChevronRight
              className="w-5 h-5"
              aria-hidden="true"
            />
          </button>

          {/* Card Scroll Area */}
          <ul
            ref={scrollRef}
            onScroll={handleScroll}
            className={cn("flex gap-6 overflow-x-auto scrollbar-hide pb-4 scroll-smooth")}
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
            aria-label="Media coverage articles"
          >
            {items.map((item, index) => (
              <MediaCard
                key={`media-${index}`}
                item={item}
                index={index}
              />
            ))}
          </ul>
        </section>
      </div>
    </section>
  )
}
