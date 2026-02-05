import { createServerFn } from "@tanstack/react-start"
import { CreditService } from "@/services/credits.service"
import { sessionMiddleware } from "@/shared/middleware/auth.middleware"
import type { UserCredits } from "@/shared/types/user"

const DEFAULT_CREDITS: UserCredits = {
  userCredits: 0,
  dailyBonusCredits: 0,
  nextRefreshTime: null,
}

export const getUserCreditsFn = createServerFn({ method: "GET" })
  .middleware([sessionMiddleware])
  .handler(async ({ context }): Promise<UserCredits> => {
    try {
      const userId = context.session?.user.id

      if (!userId) {
        return DEFAULT_CREDITS
      }

      const creditService = new CreditService()
      return creditService.getUserCredits(userId)
    } catch (error) {
      console.error("[getUserCreditsFn] Failed to fetch credits:", error)
      return DEFAULT_CREDITS
    }
  })
