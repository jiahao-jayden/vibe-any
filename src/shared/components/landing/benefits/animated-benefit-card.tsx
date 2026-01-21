import type { LucideIcon } from "lucide-react"
import * as LucideIcons from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/shared/lib/utils"
import type { AnimatedBenefitCardProps } from "@/shared/types/landing"

/**
 * Dynamically get Lucide icon components with accessibility support
 * @param iconName - Icon name from Lucide icons library
 * @returns LucideIcon component, returns default HelpCircle icon if not found
 */
export const getIconComponent = (iconName: string): LucideIcon => {
  // Validate input parameter
  if (!iconName || typeof iconName !== "string") {
    console.warn(`Invalid icon name provided: ${iconName}. Using default HelpCircle icon.`)
    return LucideIcons.HelpCircle
  }

  // Attempt to get the icon component from Lucide icons
  const IconComponent = (LucideIcons as unknown as Record<string, LucideIcon>)[iconName]

  // Return the found icon or fallback to default
  if (!IconComponent) {
    console.warn(`Icon "${iconName}" not found in Lucide icons. Using default HelpCircle icon.`)
    return LucideIcons.HelpCircle
  }

  return IconComponent
}

export const AnimatedBenefitCard = ({ benefit, index }: AnimatedBenefitCardProps) => {
  // Get icon component if available
  const IconComponent = benefit.icon ? getIconComponent(benefit.icon) : null

  return (
    <motion.li
      key={benefit.id}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.6,
        delay: index * 0.1,
        ease: [0.16, 1, 0.3, 1],
      }}
      viewport={{ once: true }}
      className={cn("text-center")}
      aria-labelledby={`benefit-title-${benefit.id}`}
      aria-describedby={`benefit-description-${benefit.id}`}
    >
      {/* Benefit Icon */}
      {IconComponent && (
        <div className={cn("mb-6 flex justify-center")}>
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center",
              "rounded-2xl bg-primary/10"
            )}
            aria-hidden="true"
            role="img"
            aria-label={`Icon for ${benefit.title}`}
          >
            <IconComponent className={cn("h-8 w-8 text-primary")} />
          </div>
        </div>
      )}

      {/* Benefit Title */}
      <h3
        id={`benefit-title-${benefit.id}`}
        className={cn("text-xl font-semibold mb-3", "text-foreground")}
      >
        {benefit.title}
      </h3>

      {/* Benefit Description */}
      <p
        id={`benefit-description-${benefit.id}`}
        className={cn("text-muted-foreground leading-relaxed", "max-w-sm mx-auto")}
      >
        {benefit.description}
      </p>
    </motion.li>
  )
}
