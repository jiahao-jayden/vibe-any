import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/{-$locale}/_landing/blog/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/-$locale/blog/"!</div>
}
