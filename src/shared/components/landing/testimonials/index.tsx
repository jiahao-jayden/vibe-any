import { useId } from "react"
import { useIntlayer } from "react-intlayer"
import { cn } from "@/shared/lib/utils"
import { AnimatedTestimonialsContent } from "./animated-testimonials-content"
import { AnimatedTestimonialsHeader } from "./animated-testimonials-header"

export const Testimonials = () => {
  const { userTestimonials } = useIntlayer("landing")
  const headingId = useId()

  const testimonials = userTestimonials.testimonials.map((item, index) => ({
    id: `${index}`,
    text: item.text.value,
    image: item.image.value,
    name: item.name.value,
    role: item.role.value,
  }))

  const firstColumn = testimonials.slice(0, 3)
  const secondColumn = testimonials.slice(3, 6)
  const thirdColumn = testimonials.slice(6, 9)

  return (
    <section
      className={cn("testimonials-base", "py-16 md:py-20")}
      aria-labelledby={headingId}
    >
      <div className={cn("mx-auto max-w-[1200px] px-4")}>
        <AnimatedTestimonialsHeader
          title={userTestimonials.title.value}
          headingId={headingId}
        />
        <AnimatedTestimonialsContent
          firstColumn={firstColumn}
          secondColumn={secondColumn}
          thirdColumn={thirdColumn}
        />
      </div>
    </section>
  )
}
