import { createFileRoute, redirect } from "@tanstack/react-router"

export const Route = createFileRoute("/{-$locale}/_main/admin/")({
  beforeLoad: ({ params }) => {
    throw redirect({
      to: "/{-$locale}/admin/users",
      params: { locale: params.locale },
    })
  },
})
