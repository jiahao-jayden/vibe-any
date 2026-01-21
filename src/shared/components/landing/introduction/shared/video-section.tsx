import { useId } from "react"
import { cn } from "@/shared/lib/utils"
import type { VideoSectionProps } from "@/shared/types/landing"

/**
 * VideoSection - Displays video media content
 * with accessibility support and semantic structure
 */
export const VideoSection = ({
  video,
  title,
  autoPlay = false,
  controls = true,
  loop = false,
  muted = false,
}: VideoSectionProps) => {
  const videoDescriptionId = useId()

  const videoControlsStyles = !controls
    ? "[&::-webkit-media-controls]:hidden [&::-webkit-media-controls-enclosure]:hidden"
    : ""

  return (
    <section
      className="flex items-center justify-center"
      aria-label="Video content"
    >
      <div className="relative w-full max-w-2xl">
        <video
          src={video}
          autoPlay={autoPlay}
          controls={controls}
          loop={loop}
          muted={muted}
          preload="metadata"
          className={cn("w-full h-auto rounded-lg shadow-lg object-cover", videoControlsStyles)}
          aria-label={`Video: ${title}`}
          aria-describedby={videoDescriptionId}
          style={!controls ? { outline: "none" } : undefined}
        >
          <track
            kind="captions"
            srcLang="en"
            label="English captions"
          />
          Your browser does not support the video tag.
        </video>

        {/* Screen reader description */}
        <div
          id={videoDescriptionId}
          className="sr-only"
        >
          Video demonstrating {title}.
          {controls ? "Use video controls to play, pause, or adjust volume." : ""}
        </div>
      </div>
    </section>
  )
}
