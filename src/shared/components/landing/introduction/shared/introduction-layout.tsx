import { cn } from "@/shared/lib/utils"
import type { IntroductionLayoutProps } from "@/shared/types/landing"
/**
 * IntroductionLayout - Common layout component for arranging content and media
 * with accessibility support and responsive design
 */
export const IntroductionLayout = ({
  id,
  contentSection,
  mediaSection,
  mediaPosition = "right",
}: IntroductionLayoutProps) => (
  <section
    id={id}
    className={cn("py-12 px-4", "sm:px-6", "lg:px-8")}
    aria-label="Introduction section"
  >
    <div className="max-w-7xl mx-auto">
      <div className={cn("grid grid-cols-1 gap-8 items-center", "lg:grid-cols-2 lg:gap-12")}>
        {mediaPosition === "left" ? (
          <>
            {/* Media section - left position */}
            <aside
              className="order-2 lg:order-1"
              aria-label="Media content"
            >
              {mediaSection}
            </aside>

            {/* Content section - right position */}
            <main
              className="order-1 lg:order-2"
              aria-label="Text content"
            >
              {contentSection}
            </main>
          </>
        ) : (
          <>
            {/* Content section - left position */}
            <main
              className="order-1 lg:order-1"
              aria-label="Text content"
            >
              {contentSection}
            </main>

            {/* Media section - right position */}
            <aside
              className="order-2 lg:order-2"
              aria-label="Media content"
            >
              {mediaSection}
            </aside>
          </>
        )}
      </div>
    </div>
  </section>
)
