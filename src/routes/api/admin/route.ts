import { createFileRoute } from "@tanstack/react-router"
import { adminMiddleware } from "@/shared/middleware/auth.middleware"

export const Route = createFileRoute("/api/admin")({
  server: {
    middleware: [adminMiddleware],
  },
})
