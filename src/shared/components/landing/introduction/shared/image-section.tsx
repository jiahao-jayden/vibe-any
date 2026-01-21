import { Image } from "@unpic/react"
import { useId } from "react"
import { cn } from "@/shared/lib/utils"
import type { ImageSectionProps } from "@/shared/types/landing"

export const ImageSection = ({ image, title }: ImageSectionProps) => {
  const imageDescriptionId = useId()

  return (
    <section
      className="flex items-center justify-center"
      aria-label="Image content"
    >
      <div className="relative w-full max-w-2xl">
        <Image
          src={image}
          alt={`Illustration for ${title}`}
          width={800}
          height={600}
          className={cn("w-full h-auto shadow-lg object-cover, rounded-md")}
          layout="constrained"
        />

        <div
          id={imageDescriptionId}
          className="sr-only"
        >
          Visual representation related to {title}
        </div>
      </div>
    </section>
  )
}
