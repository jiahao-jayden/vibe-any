import type { ImageIntroductionProps } from "@/shared/types/landing"
import { ContentSection } from "../shared/content-section"
import { ImageSection } from "../shared/image-section"
import { IntroductionLayout } from "../shared/introduction-layout"

export const ImageIntroduction = ({ section }: ImageIntroductionProps) => {
  const { features } = section

  const contentSection = (
    <ContentSection
      title={section.title}
      description={section.description}
      features={features}
    />
  )

  const mediaSection = (
    <ImageSection
      image={section.image}
      title={section.title}
    />
  )

  return (
    <IntroductionLayout
      id={section.id}
      contentSection={contentSection}
      mediaSection={mediaSection}
      mediaPosition={section.imagePosition || "right"}
    />
  )
}
