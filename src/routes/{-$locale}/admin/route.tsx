import { createFileRoute, Outlet } from "@tanstack/react-router"
import AdminSidebar from "@/shared/components/sidebar/admin-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/shared/components/ui/sidebar"

export const Route = createFileRoute("/{-$locale}/admin")({
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <main className="flex min-h-dvh flex-1 flex-col">
        <SidebarTrigger />
        <Outlet />
      </main>
    </SidebarProvider>
  )
}
