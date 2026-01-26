import type { ReactNode } from "react"

export default function Timeline({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border hidden md:block" />
      <div className="space-y-12">{children}</div>
    </div>
  )
}
