import { createFileRoute } from "@tanstack/react-router"
import { CreditService } from "@/services/credits.service"
import { auth } from "@/shared/lib/auth/auth-server"
import { Resp } from "@/shared/lib/tools/response"
import { noStrictAuthMiddleware } from "@/shared/middleware/auth.middleware"

export const Route = createFileRoute("/api/credit/history")({
  server: {
    middleware: [noStrictAuthMiddleware],
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const session = await auth.api.getSession({
            headers: request.headers,
          })

          if (!session?.user) {
            return Resp.error("Unauthorized", 401)
          }

          const url = new URL(request.url)
          const page = Number(url.searchParams.get("page")) || 1
          const limit = Math.min(Number(url.searchParams.get("limit")) || 20, 100)
          const days = Number(url.searchParams.get("days")) || undefined

          const creditService = new CreditService()
          const history = await creditService.getUserCreditsHistory(
            session.user.id,
            page,
            limit,
            days
          )

          return Resp.success(history)
        } catch (error) {
          console.error("Failed to fetch credit history:", error)
          return Resp.error("Failed to fetch credit history")
        }
      },
    },
  },
})
