import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/{-$locale}/_landing/chat/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/-$locale/chat/"!</div>
}
