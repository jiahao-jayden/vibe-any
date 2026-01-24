import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/{-$locale}/_main/_landing/changelog/")({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/-$locale/changelog/"!</div>
}
