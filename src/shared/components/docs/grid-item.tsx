import { cn } from "@/shared/lib/utils"
import { GlowingEffect } from "../motion-primitives/glowing-effect"

interface GridItemProps {
  area: string
  icon: React.ReactNode
  title: string
  description: React.ReactNode
  href?: string
}

export const GridItem = ({ area, icon, title, description, href }: GridItemProps) => {
  return (
    <li className={cn("min-h-[10rem] list-none", area)}>
      <div className="relative h-full rounded-[1.25rem] border-[0.75px] border-border p-2 md:rounded-[1.5rem] md:p-3">
        <GlowingEffect
          spread={40}
          glow={true}
          disabled={false}
          proximity={64}
          inactiveZone={0.01}
          borderWidth={3}
        />
        {href ? (
          <a
            href={href}
            className="no-underline"
          >
            <div className="relative flex h-full flex-col  justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6">
              <div className="relative flex flex-1 flex-col justify-between">
                <div className="inline-flex items-center gap-2 text-xl leading-[1.375rem] font-semibold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-foreground m-0">
                  <span className="w-fit p-0 m-0 inline-flex items-center justify-center">
                    {icon}
                  </span>
                  <span>{title}</span>
                </div>
                <div className="[&_b]:md:font-semibold [&_strong]:md:font-semibold font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-muted-foreground">
                  {description}
                </div>
              </div>
            </div>
          </a>
        ) : (
          <div className="relative flex h-full flex-col  justify-between gap-6 overflow-hidden rounded-xl border-[0.75px] bg-background p-6 shadow-sm dark:shadow-[0px_0px_27px_0px_rgba(45,45,45,0.3)] md:p-6">
            <div className="relative flex flex-1 flex-col justify-between">
              <div className="inline-flex items-center gap-2 text-xl leading-[1.375rem] font-semibold font-sans tracking-[-0.04em] md:text-2xl md:leading-[1.875rem] text-balance text-foreground m-0">
                <span className="w-fit p-0 m-0 inline-flex items-center justify-center">
                  {icon}
                </span>
                <span>{title}</span>
              </div>
              <div className="[&_b]:md:font-semibold [&_strong]:md:font-semibold font-sans text-sm leading-[1.125rem] md:text-base md:leading-[1.375rem] text-muted-foreground">
                {description}
              </div>
            </div>
          </div>
        )}
      </div>
    </li>
  )
}
