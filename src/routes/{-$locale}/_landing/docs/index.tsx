import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/{-$locale}/_landing/docs/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/-$locale/docs/"!</div>
}
