"use client"

import { cn } from "@/shared/lib/utils"
import type { GridColumns, GridShowcaseProps } from "@/shared/types/landing"
import { ShowcaseCard } from "./shared/showcase-card"
import { ShowcaseHeader } from "./shared/showcase-header"

const gridColsMapping: Record<GridColumns, string> = {
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
}

export const GridShowcase = ({ id, title, description, items, columns = 3 }: GridShowcaseProps) => {
  const gridCols = gridColsMapping[columns] || gridColsMapping[3]

  return (
    <section
      id={id}
      className="showcase-grid py-16 px-4 sm:px-6 lg:px-8"
      aria-labelledby={id ? `${id}-title` : undefined}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <ShowcaseHeader
          title={title}
          description={description}
          titleId={id ? `${id}-title` : undefined}
        />

        {/* Grid Container */}
        <ul
          className={cn("grid gap-6", gridCols)}
          aria-label="Showcase items"
        >
          {items.map((item, index) => {
            const key = `${item.title}-${index}`

            return (
              <li key={key}>
                <ShowcaseCard
                  item={item}
                  index={index}
                />
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
