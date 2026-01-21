import { motion } from "motion/react"
import { TestimonialsColumn } from "@/shared/components/ui/testimonials-column"
import { cn } from "@/shared/lib/utils"
import type { AnimatedTestimonialsContentProps } from "@/shared/types/landing"

export const AnimatedTestimonialsContent = ({
  firstColumn,
  secondColumn,
  thirdColumn,
}: AnimatedTestimonialsContentProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.8,
        delay: 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      viewport={{ once: true }}
      className={cn("relative select-none")}
      aria-label="Customer testimonials grid"
    >
      <div
        className={cn(
          "flex justify-center gap-6 mt-10",
          "[mask-image:linear-gradient(to_bottom,transparent,black_25%,black_75%,transparent)]",
          "max-h-[740px] overflow-hidden"
        )}
      >
        {/* First column - always visible */}
        <TestimonialsColumn
          testimonials={firstColumn}
          duration={15}
          className=""
          columnIndex={1}
        />

        {/* Second column - hidden on mobile */}
        <TestimonialsColumn
          testimonials={secondColumn}
          className={cn("hidden md:block")}
          duration={19}
          columnIndex={2}
        />

        {/* Third column - hidden on mobile and tablet */}
        <TestimonialsColumn
          testimonials={thirdColumn}
          className={cn("hidden lg:block")}
          duration={17}
          columnIndex={3}
        />
      </div>
    </motion.div>
  )
}
