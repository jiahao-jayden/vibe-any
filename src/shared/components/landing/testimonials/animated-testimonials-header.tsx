import { motion } from "motion/react"
import { useId } from "react"
import { cn } from "@/shared/lib/utils"
import type { AnimatedTestimonialsHeaderProps } from "@/shared/types/landing"

export const AnimatedTestimonialsHeader = ({
  title,
  headingId: providedHeadingId,
}: AnimatedTestimonialsHeaderProps) => {
  const generatedId = useId()
  const headingId = providedHeadingId || generatedId

  return (
    <header className={cn("text-center mb-12 md:mb-16")}>
      <motion.h2
        id={headingId}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1],
        }}
        viewport={{ once: true }}
        className={cn("text-3xl sm:text-4xl lg:text-5xl", "font-bold mb-4", "text-foreground")}
        aria-label="Customer testimonials section"
      >
        {title}
      </motion.h2>
    </header>
  )
}
