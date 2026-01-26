import type { ReactNode } from "react"
import { cn } from "@/shared/lib/utils"

interface TimelineItemProps {
  date: string
  version?: string
  title: string
  tags?: string[]
  children?: ReactNode
}

export default function TimelineItem({ date, version, title, tags, children }: TimelineItemProps) {
  return (
    <div className="relative md:pl-10">
      <div className="hidden md:block absolute left-4 -translate-x-1/2 top-2 size-3 bg-primary rounded-full" />

      <div className="flex flex-col md:flex-row gap-y-4">
        <div className="md:w-40 flex-shrink-0">
          <div className="md:sticky md:top-24">
            <time className="text-sm font-medium text-muted-foreground block mb-2">{date}</time>
            {version && (
              <div className="inline-flex items-center justify-center h-8 w-auto px-3 text-foreground border border-border rounded-md text-sm font-medium bg-background/60">
                <span className="tabular-nums">{version}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 md:pl-8">
          <h2 className={cn("text-2xl font-semibold tracking-tight text-balance mb-2")}>{title}</h2>
          {Array.isArray(tags) && tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="h-6 w-fit px-2 text-xs font-medium bg-muted text-muted-foreground rounded-full border flex items-center justify-center"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="prose dark:prose-invert max-w-none prose-headings:scroll-mt-24 prose-headings:font-semibold prose-a:no-underline prose-headings:tracking-tight">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
