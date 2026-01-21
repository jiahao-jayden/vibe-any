import { createFileRoute, Outlet } from "@tanstack/react-router"
import Banner from "@/shared/components/landing/banner"
import { Footer } from "@/shared/components/landing/footer"
import { LandingHeader } from "@/shared/components/landing/header"

export const Route = createFileRoute("/{-$locale}/_landing")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <main className="overflow-x-clip">
      <Banner />
      <LandingHeader />
      <Outlet />
      <Footer />
    </main>
  )
}
