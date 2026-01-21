import { useId } from "react"
import { useIntlayer } from "react-intlayer"
import { cn } from "@/shared/lib/utils"
import { AnimatedBenefitCard } from "./animated-benefit-card"
import { AnimatedBenefitHeader } from "./animated-benefit-header"

export const ThreeBenefits = () => {
  const { threeBenefits } = useIntlayer("landing")
  const titleId = useId()

  const benefitItems = threeBenefits.items.map((item, index) => ({
    id: `${index}`,
    title: item.title.value,
    description: item.description.value,
    icon: item.icon.value,
  }))

  return (
    <section
      className={cn("benefits-base", "py-16 md:py-20 lg:py-24")}
      aria-labelledby={titleId}
    >
      <div className={cn("mx-auto max-w-6xl px-6")}>
        <AnimatedBenefitHeader
          title={threeBenefits.title.value}
          description={threeBenefits.description.value}
          titleId={titleId}
        />

        <ul
          className={cn("grid grid-cols-1 md:grid-cols-3", "gap-8 lg:gap-12")}
          aria-label="Key benefits and features"
        >
          {benefitItems.map((benefit, index) => (
            <AnimatedBenefitCard
              key={benefit.id}
              benefit={benefit}
              index={index}
            />
          ))}
        </ul>
      </div>
    </section>
  )
}
