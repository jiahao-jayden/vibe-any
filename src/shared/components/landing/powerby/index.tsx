"use client"

import { Image } from "@unpic/react"
import { useId } from "react"
import { useIntlayer } from "react-intlayer"
import { cn } from "@/shared/lib/utils"
import type { PowerByConfig } from "@/shared/types/landing"

const POWER_BY_CONFIG: PowerByConfig[] = [
  { name: "github", path: "/partners/github.svg" },
  { name: "tailwindcss", path: "/partners/tailwindcss.svg" },
  { name: "vercel", path: "/partners/vercel.svg" },
  { name: "nextjs", path: "/partners/nextjs.svg" },
  { name: "shadcn", path: "/partners/shadcn.svg" },
  { name: "openai", path: "/partners/openai.svg" },
  { name: "react", path: "/partners/react.svg" },
  { name: "supabase", path: "/partners/supabase.svg" },
  { name: "cloudflare", path: "/partners/cloudflare.svg" },
]

export default function PowerBy() {
  const { powerBy } = useIntlayer("landing")
  const titleId = useId()

  const items = powerBy.items.map((item) => item.value)
  const validItems = items.filter((name) => POWER_BY_CONFIG.some((config) => config.name === name))

  return (
    <section
      className={cn("bg-background py-5", "select-none")}
      aria-labelledby={titleId}
    >
      <div
        className={cn(
          "mx-auto px-4",
          "max-w-sm sm:max-w-2xl",
          "md:max-w-4xl md:px-6",
          "lg:max-w-6xl lg:px-8",
          "xl:max-w-7xl 2xl:max-w-8xl"
        )}
      >
        <h2
          id={titleId}
          className={cn(
            "text-center font-medium leading-6 uppercase tracking-wider",
            "text-muted-foreground",
            "text-xs sm:text-sm md:text-base",
            "select-none"
          )}
        >
          {powerBy.title.value}
        </h2>

        <ul
          className={cn(
            "mx-auto flex flex-wrap items-center justify-center list-none",
            "mt-6 gap-x-4 gap-y-4 max-w-xs",
            "sm:mt-8 sm:gap-x-6 sm:gap-y-5 sm:max-w-2xl",
            "md:mt-10 md:gap-x-8 md:gap-y-6 md:max-w-4xl",
            "lg:gap-x-10 lg:gap-y-7",
            "xl:gap-x-12 xl:gap-y-8 xl:max-w-6xl",
            "2xl:gap-x-16 2xl:gap-y-10"
          )}
        >
          {validItems.map((name) => {
            const config = POWER_BY_CONFIG.find((c) => c.name === name)
            if (!config) return null

            return (
              <li
                key={name}
                className={cn("shrink-0", "select-none")}
              >
                <Image
                  className={cn(
                    "object-contain",
                    "opacity-60 dark:invert",
                    "h-5 w-auto sm:h-6 md:h-7 lg:h-8 xl:h-9",
                    "select-none pointer-events-none"
                  )}
                  src={config.path}
                  alt={`${name} logo`}
                  width={100}
                  height={24}
                  layout="constrained"
                />
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
