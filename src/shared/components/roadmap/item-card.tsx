import { cn } from "@/shared/lib/utils"

export type RoadmapItem = {
  title: string
}

type ItemCardProps = {
  item: RoadmapItem
  className?: string
}

export function ItemCard({ item, className }: ItemCardProps) {
  return (
    <article
      className={cn(
        "bg-card rounded-xl border",
        "p-3 sm:p-4",
        "flex items-start justify-between gap-4",
        className
      )}
    >
      <div className="min-w-0">
        <h4 className={cn("font-medium text-sm")}>{item.title}</h4>
      </div>
    </article>
  )
}
