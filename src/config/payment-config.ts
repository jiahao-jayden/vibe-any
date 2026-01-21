import { logger } from "better-auth"
import { websiteConfig } from "@/config/website-config"
import {
  type CreditPackageWithPrice,
  PaymentTypes,
  PlanTypes,
  type PlanWithPrice,
  type Price,
} from "@/shared/types/payment"

/**
 * Get price plans configuration
 *
 * This returns raw plan data without translations.
 * For translated content, use the `useIntlayer("pricing")` hook in client components.
 *
 * @returns Array of plans with price information
 */
export function getPricePlans(): PlanWithPrice[] {
  const priceConfig = websiteConfig.planWithPrice
  if (!priceConfig?.length) {
    return []
  }
  return priceConfig
}

export function getCreditPackageWithPrice(): CreditPackageWithPrice[] {
  return websiteConfig?.payment?.credit?.packages || []
}

/**
 * Transform a credit package to a plan
 * @returns The transformed plan
 */
export function transformPackageToPlan(): PlanWithPrice[] {
  return (
    websiteConfig.payment?.credit?.packages?.map((pkg: CreditPackageWithPrice) => {
      return {
        id: pkg.id,
        planType: PlanTypes.CREDITS,
        credit: pkg.credit,
        prices: [
          {
            type: PaymentTypes.ONE_TIME,
            priceId: pkg.price.priceId,
            amount: pkg.price.amount,
            currency: pkg.price.currency,
          },
        ],
      }
    }) || []
  )
}

/**
 * Get all price plans without translations
 *
 * Use this in server components or when translations are not needed
 *
 * @returns Array of raw plans without translations
 */
export function getAllPricePlans() {
  if (!websiteConfig.planWithPrice?.length) {
    return []
  }
  return websiteConfig.planWithPrice
}

/**
 * Find a plan by its ID
 *
 * @param planId Plan ID to search for
 * @returns The matching plan or undefined if not found
 */
export function getPlanById(planId: string) {
  if (!websiteConfig.planWithPrice?.length) {
    return undefined
  }
  return [...websiteConfig.planWithPrice, ...transformPackageToPlan()].find(
    (plan: PlanWithPrice) => plan.id === planId
  )
}

/**
 * Find a price by its ID
 *
 * @param priceId Price ID to search for
 * @returns The matching price or undefined if not found
 */
export function getPriceById(planId: string, priceId: string): Price | undefined {
  const plan = getPlanById(planId)
  if (!plan) {
    logger.error(`findPriceInPlan, Plan with ID ${planId} not found`)
    return undefined
  }
  return plan.prices.find((price: any) => price.priceId === priceId) as Price | undefined
}

export function getPlanByPriceId(priceId: string) {
  return websiteConfig.planWithPrice?.find((plan: PlanWithPrice) =>
    plan.prices.some((price: any) => price.priceId === priceId)
  )
}

/**
 * Get the type of a plan
 *
 * @param planId Plan ID to check
 * @returns Plan type or null if plan not found
 */
export function getPlanType(planId: string) {
  const plan = getPlanById(planId)
  if (!plan) {
    return null
  }
  return plan.planType
}
