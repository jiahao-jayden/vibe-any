import { createServerFn } from "@tanstack/react-start"
import { UserService } from "@/services/user.service"
import { sessionMiddleware } from "@/shared/middleware/auth.middleware"
import type { UserInfo } from "@/shared/types/user"

export const getUserInfoFn = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }): Promise<UserInfo> => {
    const userId = context.session?.user.id

    if (!userId) {
      return {
        user: null,
        payment: { activePlan: null, activeSubscription: null },
      }
    }

    const userService = new UserService()
    return userService.getUserInfo(userId)
  })
