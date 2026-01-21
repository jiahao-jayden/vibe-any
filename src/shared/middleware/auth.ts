import { redirect } from "@tanstack/react-router"
import { createMiddleware } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { auth } from "@/shared/lib/auth/auth-server"

export const authMiddleware = createMiddleware().server(async ({ next, request }) => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })

  if (!session) {
    throw redirect({ to: "/{-$locale}/login" })
  }

  return await next()
})
