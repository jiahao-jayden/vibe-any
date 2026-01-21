"use client"

import { useId } from "react"
import { useIntlayer } from "react-intlayer"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/components/ui/accordion"
import { cn } from "@/shared/lib/utils"

export function Faq() {
  const headingId = useId()
  const { faq } = useIntlayer("landing")

  const faqItems = faq.items.map((item, index) => ({
    id: `${index}`,
    question: item.question.value,
    answer: item.answer.value,
  }))

  return (
    <section className="faq-base py-14 md:py-16" aria-labelledby={headingId}>
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2
            id={headingId}
            className={cn("text-balance text-3xl font-bold", "md:text-4xl lg:text-5xl")}
          >
            {faq.title.value}
          </h2>
          <p className={cn("mt-4 text-balance text-muted-foreground")}>{faq.description.value}</p>
        </div>

        <div className="mx-auto mt-12 max-w-2xl">
          <Accordion
            type="single"
            collapsible
            className={cn(
              "w-full rounded-2xl border px-8 py-3 shadow-sm",
              "bg-card ring-4 ring-muted dark:ring-0"
            )}
            aria-label="Frequently Asked Questions"
          >
            {faqItems.map((item) => (
              <AccordionItem key={item.id} value={item.id} className="border-dashed">
                <AccordionTrigger
                  className={cn("cursor-pointer text-base hover:no-underline")}
                  aria-controls={`faq-content-${item.id}`}
                  aria-describedby={`faq-answer-${item.id}`}
                >
                  <span className="text-left">{item.question}</span>
                </AccordionTrigger>
                <AccordionContent
                  id={`faq-content-${item.id}`}
                  aria-labelledby={`faq-trigger-${item.id}`}
                >
                  <p id={`faq-answer-${item.id}`} className="text-base">
                    {item.answer}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  )
}
