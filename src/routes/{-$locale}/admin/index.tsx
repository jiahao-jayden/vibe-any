import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/{-$locale}/admin/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/{-$locale}/admin/users",
      params: { locale: params.locale },
    })
  },
})
