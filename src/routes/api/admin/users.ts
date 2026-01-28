import { createFileRoute } from "@tanstack/react-router"
import { desc } from "drizzle-orm"
import { db, user } from "@/db"
import { Resp } from "@/shared/lib/tools/response"

export const Route = createFileRoute("/api/admin/users")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const users = await db
            .select({
              id: user.id,
              name: user.name,
              email: user.email,
              emailVerified: user.emailVerified,
              image: user.image,
              createdAt: user.createdAt,
            })
            .from(user)
            .orderBy(desc(user.createdAt))
            .limit(50)

          return Resp.success(users)
        } catch (error) {
          console.error("Failed to fetch users:", error)
          return Resp.error("Failed to fetch users")
        }
      },
    },
  },
})
