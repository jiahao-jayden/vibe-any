import { motion } from "motion/react"
import { cn } from "@/shared/lib/utils"
import type { AnimatedBenefitHeaderProps } from "@/shared/types/landing"

export const AnimatedBenefitHeader = ({
  title,
  description,
  titleId,
}: AnimatedBenefitHeaderProps) => {
  return (
    <header className={cn("text-center", "mb-12 md:mb-16")}>
      {/* Main Title */}
      <motion.h2
        id={titleId}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          ease: [0.16, 1, 0.3, 1],
        }}
        viewport={{ once: true }}
        className={cn("text-3xl sm:text-4xl lg:text-5xl", "font-bold mb-4", "text-foreground")}
      >
        {title}
      </motion.h2>

      {/* Description */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.6,
          delay: 0.1,
          ease: [0.16, 1, 0.3, 1],
        }}
        viewport={{ once: true }}
        className={cn("text-lg text-muted-foreground", "max-w-2xl mx-auto")}
        aria-describedby={titleId}
      >
        {description}
      </motion.p>
    </header>
  )
}
