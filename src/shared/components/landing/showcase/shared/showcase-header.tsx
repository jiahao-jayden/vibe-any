import { cn } from "@/shared/lib/utils"
import type { ShowcaseHeaderProps } from "@/shared/types/landing"

/**
 * Reusable showcase header component
 * Displays title and description consistently across variants
 */
export const ShowcaseHeader = ({ title, description, titleId }: ShowcaseHeaderProps) => {
  return (
    <div className="text-center mb-12">
      <h2
        id={titleId}
        className={cn("text-3xl md:text-4xl font-bold mb-4")}
      >
        {title}
      </h2>

      <p className={cn("text-muted-foreground text-lg max-w-2xl mx-auto")}>{description}</p>
    </div>
  )
}
