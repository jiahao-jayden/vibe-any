import { logger } from "better-auth"
import type { PlanPrice, PlanWithPrice } from "@/shared/types/payment"

const currency = import.meta.env.VITE_CURRENCY || "USD"

export const paymentConfig: PlanWithPrice[] = [
  {
    id: "free",
    planType: "free",
    prices: [],
  },
  {
    id: "pro",
    planType: "subscription",
    credit: {
      amount: 100,
      expireDays: 31,
    },
    prices: [
      {
        priceId: import.meta.env.VITE_STRIPE_PRO_MONTHLY_PRICE_ID!,
        amount: 990,
        currency,
        interval: "month",
        cryptoPrices: {
          usdc_sol: "9.9",
          sol: "0.1",
          btc: "0.00013",
          eth: "0.0043",
          trx: "30",
          usdt_erc20: "9.9",
          usdt_trc20: "9.9",
        },
      },
      {
        priceId: import.meta.env.VITE_STRIPE_PRO_YEARLY_PRICE_ID!,
        amount: 9900,
        currency,
        interval: "year",
        cryptoPrices: {
          usdc_sol: "99",
          sol: "1",
          btc: "0.0013",
          eth: "0.043",
          trx: "300",
          usdt_erc20: "99",
          usdt_trc20: "99",
        },
      },
    ],
    display: {
      isRecommended: true,
      group: "subscription",
    },
  },
  {
    id: "lifetime",
    planType: "lifetime",
    prices: [
      {
        priceId: import.meta.env.VITE_STRIPE_LIFETIME_PRICE_ID!,
        amount: 19900,
        currency,
        cryptoPrices: {
          usdc_sol: "199",
          sol: "2",
          btc: "0.0026",
          eth: "0.086",
          trx: "600",
          usdt_erc20: "199",
          usdt_trc20: "199",
        },
      },
    ],
    display: {
      group: "one-time",
    },
  },
]

/**
 * System currency (ISO 4217 code)
 * Configured via VITE_CURRENCY environment variable, defaults to "USD"
 */
export const CURRENCY = import.meta.env.VITE_CURRENCY || "USD"

/**
 * Get all plans from local configuration
 *
 * This returns raw plan data without translations.
 * For translated content, use the `useIntlayer("pricing")` hook in client components.
 *
 * @returns Array of plans with price information
 */
export function getPlans(): PlanWithPrice[] {
  return paymentConfig ?? []
}

/**
 * Find a plan by its ID
 *
 * @param planId Plan ID to search for
 * @returns The matching plan or undefined if not found
 */
export function getPlanById(planId: string): PlanWithPrice | undefined {
  return paymentConfig?.find((plan) => plan.id === planId)
}

/**
 * Find a plan by price ID
 *
 * @param priceId Stripe price ID
 * @returns The matching plan or undefined if not found
 */
export function getPlanByPriceId(priceId: string): PlanWithPrice | undefined {
  return paymentConfig?.find((plan) => plan.prices.some((price) => price.priceId === priceId))
}

/**
 * Find a price by plan ID and price ID
 *
 * @param planId Plan ID to search in
 * @param priceId Price ID to search for
 * @returns The matching price or undefined if not found
 */
export function getPriceById(planId: string, priceId: string): PlanPrice | undefined {
  const plan = getPlanById(planId)
  if (!plan) {
    logger.error(`getPriceById: Plan with ID ${planId} not found`)
    return undefined
  }
  return plan.prices.find((price) => price.priceId === priceId)
}

/**
 * Get the type of a plan
 *
 * @param planId Plan ID to check
 * @returns Plan type or null if plan not found
 */
export function getPlanType(planId: string) {
  const plan = getPlanById(planId)
  return plan?.planType ?? null
}
