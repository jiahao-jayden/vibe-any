import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/{-$locale}/_main/chat/")({
  component: RouteComponent,
  ssr: false,
})

function RouteComponent() {
  return <div>Hello "/-$locale/_main/chat/inddex"!</div>
}
