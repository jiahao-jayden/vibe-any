import { createFileRoute, Outlet } from "@tanstack/react-router"
import { GlobalContextProvider } from "@/shared/context/global.context"

export const Route = createFileRoute("/{-$locale}/_main")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <GlobalContextProvider>
      <Outlet />
    </GlobalContextProvider>
  )
}
