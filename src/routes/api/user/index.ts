import { createFileRoute } from "@tanstack/react-router"
import { auth } from "@/shared/lib/auth/auth-server"
import { authMiddleware } from "@/shared/middleware/auth"

export const Route = createFileRoute("/api/user/")({
  server: {
    middleware: [authMiddleware],
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        const session = await auth.api.getSession({
          headers: request.headers,
        })
        // console.log(session, "session")
        return Response.json({ session })
      },
    },
  },
})
