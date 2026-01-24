import { cn } from "@/shared/lib/utils"

interface TechItem {
  name: string
  desc?: string
  href?: string
}

interface TechStackProps {
  items: TechItem[]
}

export function TechStack({ items }: TechStackProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 not-prose">
      {items.map((item) => (
        <div key={item.name} className="flex items-baseline gap-2 py-1">
          {item.href ? (
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "font-medium text-fd-foreground hover:text-fd-primary",
                "transition-colors no-underline shrink-0"
              )}
            >
              {item.name}
            </a>
          ) : (
            <span className="font-medium text-fd-foreground shrink-0">
              {item.name}
            </span>
          )}
          {item.desc && (
            <span className="text-sm text-fd-muted-foreground">{item.desc}</span>
          )}
        </div>
      ))}
    </div>
  )
}
