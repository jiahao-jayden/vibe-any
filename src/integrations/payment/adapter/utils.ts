import { getPlanById } from "@/config/payment-config"
import type { DbTransaction } from "@/db"
import { CreditService } from "@/services/credits.service"
import { logger } from "@/shared/lib/tools/logger"
import { CreditsType } from "@/shared/types/credit"
import { PlanTypes } from "@/shared/types/payment"

/**
 * Process increase credits
 * @param planId plan id
 * @param userId user id
 * @param paymentId payment id
 * @param periodEnd subscription period end date (if applicable)
 * @param tx transaction database
 */
export async function processIncreaseCredits(
  planId: string,
  userId: string,
  paymentId: string,
  periodEnd?: Date,
  tx?: DbTransaction
) {
  const plan = getPlanById(planId)
  // if plan include credit, then process increase credits
  if (plan?.credit) {
    const creditService = new CreditService()

    // Calculate expiry date based on plan configuration
    let expiresAt: Date | undefined
    if (plan.planType === PlanTypes.SUBSCRIPTION) {
      expiresAt = periodEnd
    } else if (plan.credit.expireDays) {
      expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + plan.credit.expireDays)
    }

    // Determine credit type based on plan type
    let creditsType: CreditsType
    if (plan.planType === PlanTypes.SUBSCRIPTION) {
      creditsType = CreditsType.ADD_SUBSCRIPTION_PAYMENT
    } else {
      creditsType = CreditsType.ADD_ONE_TIME_PAYMENT
    }

    await creditService.increaseCredits({
      userId,
      credits: plan.credit.amount,
      creditsType,
      paymentId,
      expiresAt,
      description: `Credits from ${plan.planType} plan: ${planId}`,
      tx,
    })

    logger.info(
      `Successfully processed ${plan.credit.amount} credits for user ${userId} from plan ${planId}`
    )
  }
}
