import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/{-$locale}/_landing/roadmap/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/-$locale/roadmap/"!</div>
}
