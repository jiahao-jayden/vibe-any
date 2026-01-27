import { createServerFn } from "@tanstack/react-start"
import { CreditService } from "@/services/credits.service"
import { sessionMiddleware } from "@/shared/middleware/auth.middleware"
import type { UserCredits } from "@/shared/types/user"

export const getUserCreditsFn = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }): Promise<UserCredits> => {
    const userId = context.session?.user.id

    if (!userId) {
      return { userCredits: 0, dailyBonusCredits: 0, nextRefreshTime: null }
    }

    const creditService = new CreditService()
    return creditService.getUserCredits(userId)
  })
